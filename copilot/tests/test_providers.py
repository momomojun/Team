"""商业 API 的 Provider：用假的网络回复测请求怎么拼、出错怎么重试和退回本机。不联网、不用真的 key"""
import io
import json
import urllib.error

import pytest

from nps_copilot import providers
from nps_copilot.providers import (FallbackProvider, GeminiProvider, OpenAIProvider, ProviderError, QuotaError,
                                   ScriptedProvider, _Paced)

SCHEMA = {"type": "object", "properties": {"park": {"type": "string"}}, "required": ["park"]}


def http_error(code: int, body: str) -> urllib.error.HTTPError:
    return urllib.error.HTTPError("https://example.test", code, "error", {}, io.BytesIO(body.encode("utf-8")))


@pytest.fixture
def fake_api(monkeypatch, tmp_path):
    """把 _post 换成按顺序返回写好的回复（或抛写好的错误），记下每次发了什么；不真的等待。
    不读本机仓库的 .env.local（里面可能有真的 key），只有 Gemini、OpenAI 两把假 key"""
    monkeypatch.setattr(providers, "ROOT", tmp_path)
    for name in ("GROQ_API_KEY", "OPENROUTER_API_KEY", "DEEPSEEK_API_KEY"):
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setenv("GEMINI_API_KEY", "test-gemini-key")
    monkeypatch.setenv("OPENAI_API_KEY", "test-openai-key")
    monkeypatch.setattr(providers.time, "sleep", lambda seconds: None)
    sent = []

    def install(*replies):
        queue = list(replies)

        def post(url, body, headers, timeout):
            sent.append({"url": url, "body": json.loads(json.dumps(body)), "headers": headers})
            reply = queue.pop(0)
            if isinstance(reply, Exception):
                raise reply
            return reply

        monkeypatch.setattr(providers, "_post", post)
        return sent

    return install


def gemini_reply(text: str) -> dict:
    return {"candidates": [{"content": {"parts": [{"text": text}]}}],
            "usageMetadata": {"promptTokenCount": 40, "candidatesTokenCount": 8}}


def test_gemini_request_uses_schema_low_thinking_and_keeps_the_key_out_of_the_url(fake_api):
    sent = fake_api(gemini_reply('{"park": "Yosemite"}'))
    provider = GeminiProvider(model="gemini-3.5-flash-lite", rpm=0)
    completion = provider.complete_json("intake", "system text", "去优胜美地", SCHEMA)
    assert completion.data == {"park": "Yosemite"} and completion.meta["prompt_tokens"] == 40
    request = sent[0]
    assert request["url"].endswith("/models/gemini-3.5-flash-lite:generateContent")
    assert "test-gemini-key" not in request["url"] and request["headers"]["x-goog-api-key"] == "test-gemini-key"
    config = request["body"]["generationConfig"]
    assert config["temperature"] == 0 and config["responseJsonSchema"] == SCHEMA
    assert config["thinkingConfig"] == {"thinkingLevel": "minimal"}
    assert request["body"]["systemInstruction"]["parts"][0]["text"] == "system text"


def test_gemini_steps_down_the_thinking_setting_when_a_model_rejects_it(fake_api):
    rejected = http_error(400, '{"error": {"message": "Thinking level MINIMAL is not supported for this model."}}')
    sent = fake_api(rejected, gemini_reply('{"park": "Zion"}'), gemini_reply('{"park": "Zion"}'))
    provider = GeminiProvider(model="gemini-3.8-flash", rpm=0)
    assert provider.complete_json("intake", "s", "u", SCHEMA).data == {"park": "Zion"}
    assert [r["body"]["generationConfig"].get("thinkingConfig") for r in sent] == [{"thinkingLevel": "minimal"}, {"thinkingLevel": "low"}]
    # 记住了：下一次直接用 low，不再白白多发一次
    provider.complete_json("intake", "s", "u", SCHEMA)
    assert sent[-1]["body"]["generationConfig"]["thinkingConfig"] == {"thinkingLevel": "low"}
    gemma = GeminiProvider(model="gemma-4-31b-it", rpm=0)
    fake_api(gemini_reply('{"park": "Zion"}'))
    gemma.complete_json("intake", "s", "u", SCHEMA)
    assert "thinkingConfig" not in sent[-1]["body"]["generationConfig"]


def test_busy_service_is_retried_but_a_used_up_daily_quota_is_not(fake_api):
    sent = fake_api(http_error(503, "high demand"), http_error(429, "per minute"), gemini_reply('{"park": "Arches"}'))
    assert GeminiProvider(rpm=0).complete_json("intake", "s", "u", SCHEMA).data == {"park": "Arches"}
    assert len(sent) == 3
    fake_api(http_error(429, '{"quotaId": "GenerateRequestsPerDayPerProjectPerModel-FreeTier"}'))
    with pytest.raises(QuotaError):
        GeminiProvider(rpm=0).complete_json("intake", "s", "u", SCHEMA)
    fake_api(http_error(401, "bad key"))
    with pytest.raises(ProviderError, match="401"):
        GeminiProvider(rpm=0).complete_json("intake", "s", "u", SCHEMA)


def test_pacing_waits_between_calls():
    waited = []
    pace = _Paced(rpm=12, sleep=waited.append)
    pace.run(lambda: "first")
    pace.run(lambda: "second")
    assert waited and 4.5 < waited[0] <= 5.0  # 每分钟 12 次 → 两次之间隔 5 秒


def test_openai_reasoning_models_get_minimal_effort_and_others_temperature_zero(fake_api):
    def reply(text):
        return {"choices": [{"message": {"content": text}}], "usage": {"prompt_tokens": 30, "completion_tokens": 6,
                                                                       "completion_tokens_details": {"reasoning_tokens": 0}}}

    sent = fake_api(reply('{"park": "Yellowstone"}'), reply('```json\n{"park": "Yellowstone"}\n```'))
    nano = OpenAIProvider(model="gpt-5-nano", rpm=0).complete_json("intake", "s", "u", SCHEMA)
    mini = OpenAIProvider(model="gpt-4.1-mini", rpm=0).complete_json("intake", "s", "u", SCHEMA)
    assert nano.data == mini.data == {"park": "Yellowstone"}
    assert sent[0]["body"]["reasoning_effort"] == "minimal" and "temperature" not in sent[0]["body"]
    assert sent[1]["body"]["temperature"] == 0 and "reasoning_effort" not in sent[1]["body"]
    assert sent[0]["body"]["response_format"]["json_schema"]["schema"] == SCHEMA
    assert sent[0]["headers"]["Authorization"] == "Bearer test-openai-key"


def test_fallback_uses_the_local_model_when_the_api_fails(fake_api):
    fake_api(http_error(429, "PerDay quota"))
    local = ScriptedProvider([{"park": "Glacier"}])
    completion = FallbackProvider(GeminiProvider(rpm=0), local).complete_json("intake", "s", "u", SCHEMA)
    assert completion.data == {"park": "Glacier"} and completion.meta["fallback_from"] == "gemini-3.5-flash-lite"


def test_missing_key_is_a_clear_error(monkeypatch, tmp_path):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setattr(providers, "ROOT", tmp_path)
    with pytest.raises(ProviderError, match="GEMINI_API_KEY"):
        GeminiProvider()


def test_openai_drops_a_setting_the_model_rejects_and_remembers(fake_api):
    ok = {"choices": [{"message": {"content": '{"park": "Zion"}'}}], "usage": {}}
    sent = fake_api(http_error(400, "Unsupported value: 'reasoning_effort' does not support 'minimal' with this model."), ok, ok)
    provider = OpenAIProvider(model="gpt-6-luna", rpm=0)
    provider.complete_json("intake", "s", "u", SCHEMA)
    provider.complete_json("intake", "s", "u", SCHEMA)
    assert [r["body"].get("reasoning_effort") for r in sent] == ["minimal", "low", "low"]
    assert all("temperature" not in r["body"] for r in sent)


def test_openrouter_uses_the_openai_style_api_and_stops_on_the_daily_free_limit(fake_api, monkeypatch):
    from nps_copilot.providers import OpenRouterProvider

    monkeypatch.setenv("OPENROUTER_API_KEY", "test-openrouter-key")
    ok = {"choices": [{"message": {"content": '{"park": "Zion"}'}}], "usage": {"prompt_tokens": 30, "completion_tokens": 5}, "provider": "MiniMax"}
    sent = fake_api(ok, http_error(429, '{"error": {"message": "Rate limit exceeded: free-models-per-day"}}'))
    provider = OpenRouterProvider(rpm=0)
    assert provider.complete_json("intake", "s", "u", SCHEMA).data == {"park": "Zion"}
    assert sent[0]["url"] == "https://openrouter.ai/api/v1/chat/completions"
    assert sent[0]["body"]["model"] == "nvidia/nemotron-3.5-super-vl:free" and sent[0]["body"]["reasoning"] == {"effort": "low"}
    assert sent[0]["headers"]["Authorization"] == "Bearer test-openrouter-key"
    with pytest.raises(QuotaError):
        provider.complete_json("intake", "s", "u", SCHEMA)
    assert len(sent) == 2  # 每天的免费额度用完了：不重试


def test_chat_falls_back_gemini_then_openrouter_then_local(monkeypatch, tmp_path, fake_api):
    from nps_copilot.providers import OllamaProvider, ProviderChain, chat_provider

    monkeypatch.delenv("COPILOT_PROVIDER", raising=False)
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-openrouter-key")
    chosen = chat_provider()  # fake_api 设好了 Gemini、OpenAI 两把假 key，这里再加 OpenRouter 的
    assert isinstance(chosen, ProviderChain) and chosen.model == "gemini-3.5-flash-lite"
    # 10-21 起 OpenAI（没额度了）不在默认顺序里，有 key 也不用
    assert [type(p).__name__ for p in chosen.providers] == ["GeminiProvider", "OpenRouterProvider", "OllamaProvider"]
    # 10-28 MiniMax 的免费推广期结束，换成 Nemotron 3.5 Super（免费版）
    assert chosen.providers[1].model == "nvidia/nemotron-3.5-super-vl:free"
    # 聊天不排队、只重试一次：Gemini 忙就很快换 OpenRouter
    assert chosen.providers[0].pace.rpm == 0 and chosen.providers[0].pace.waits == (2,)
    minimax_ok = {"choices": [{"message": {"content": '{"park": "Zion"}'}}], "usage": {}}
    sent = fake_api(http_error(429, "PerDay quota"), minimax_ok)
    completion = chosen.complete_json("intake", "s", "u", SCHEMA)
    assert completion.data == {"park": "Zion"} and completion.meta["fallback_from"][0]["model"] == "gemini-3.5-flash-lite"
    assert [r["url"].split("/")[2] for r in sent] == ["generativelanguage.googleapis.com", "openrouter.ai"]
    # 只有 OpenRouter 的 key：MiniMax → 本机
    monkeypatch.delenv("GEMINI_API_KEY")
    monkeypatch.setattr(providers, "ROOT", tmp_path)
    assert [type(p).__name__ for p in chat_provider().providers] == ["OpenRouterProvider", "OllamaProvider"]
    # 什么 key 都没有（组员）：照旧本机
    monkeypatch.delenv("OPENROUTER_API_KEY")
    monkeypatch.delenv("OPENAI_API_KEY")
    assert isinstance(chat_provider(), OllamaProvider)
    # 明确指定了就按指定的
    monkeypatch.setenv("COPILOT_PROVIDER", "ollama")
    monkeypatch.setenv("GEMINI_API_KEY", "test-gemini-key")
    assert isinstance(chat_provider(), OllamaProvider)


def test_groq_uses_schema_output_and_falls_back_to_json_mode_when_the_model_rejects_it(fake_api, monkeypatch):
    from nps_copilot.providers import GroqProvider

    monkeypatch.setenv("GROQ_API_KEY", "test-groq-key")
    ok = {"choices": [{"message": {"content": '{"park": "Zion"}'}}],
          "usage": {"prompt_tokens": 30, "completion_tokens": 9, "completion_tokens_details": {"reasoning_tokens": 4}}}
    sent = fake_api(ok)
    provider = GroqProvider(rpm=0)
    completion = provider.complete_json("intake", "s", "u", SCHEMA)
    assert completion.data == {"park": "Zion"} and completion.meta["thinking_tokens"] == 4
    assert sent[0]["url"] == "https://api.groq.com/openai/v1/chat/completions"
    assert sent[0]["headers"]["Authorization"] == "Bearer test-groq-key"
    assert sent[0]["body"]["model"] == "openai/gpt-oss-120b" and sent[0]["body"]["reasoning_effort"] == "low"
    assert sent[0]["body"]["response_format"]["type"] == "json_schema"
    # 不认 JSON Schema 的模型：退成 JSON 模式，schema 写进系统提示词，之后一直这样发
    sent.clear()
    sent = fake_api(http_error(400, "This model does not support response format `json_schema`"), ok, ok)
    qwen = GroqProvider(model="qwen/qwen3.8-27b", rpm=0)
    qwen.complete_json("intake", "s", "u", SCHEMA)
    qwen.complete_json("intake", "s", "u", SCHEMA)
    assert [r["body"]["response_format"]["type"] for r in sent] == ["json_schema", "json_object", "json_object"]
    assert '"park"' in sent[1]["body"]["messages"][0]["content"]
    # 一天的 token 用完了：不重试
    sent.clear()
    sent = fake_api(http_error(429, "Rate limit reached on tokens per day (TPD): Limit 200000"))
    with pytest.raises(QuotaError):
        provider.complete_json("intake", "s", "u", SCHEMA)
    assert len(sent) == 1


def test_openrouter_reasoning_level_comes_from_the_environment(monkeypatch):
    from nps_copilot.providers import OpenRouterProvider

    monkeypatch.setenv("OPENROUTER_API_KEY", "test-openrouter-key")
    monkeypatch.setenv("COPILOT_REASONING", "high")
    assert OpenRouterProvider().reasoning == {"effort": "high"}
    monkeypatch.setenv("COPILOT_REASONING", "none")
    assert OpenRouterProvider().reasoning is None


def test_openrouter_rewrites_type_lists_that_minimax_rejects():
    from nps_copilot.providers import _no_type_lists

    schema = {"type": "object", "properties": {
        "origin": {"type": ["string", "null"], "description": "从哪出发"},
        "days": {"type": ["integer", "null"], "minimum": 1},
        "parks": {"type": "array", "items": {"type": "string"}}}}
    out = _no_type_lists(schema)
    assert out["properties"]["origin"] == {"description": "从哪出发", "anyOf": [{"type": "string"}, {"type": "null"}]}
    assert out["properties"]["days"] == {"anyOf": [{"type": "integer", "minimum": 1}, {"type": "null"}]}
    assert out["properties"]["parks"] == schema["properties"]["parks"] and schema["properties"]["origin"]["type"] == ["string", "null"]


def test_step_models_send_some_steps_to_their_own_model(monkeypatch, fake_api):
    from nps_copilot.providers import OllamaProvider, StepRouter, chat_provider

    monkeypatch.delenv("COPILOT_PROVIDER", raising=False)
    monkeypatch.setenv("COPILOT_STEP_MODELS", "intake=openai:gpt-4.1-mini, qa=ollama:qwen3.5:4b-q4_K_M")
    chosen = chat_provider()
    assert isinstance(chosen, StepRouter) and chosen.model == "gemini-3.5-flash-lite"
    assert [getattr(p, "model", "") for p in chosen.steps["intake"].providers][:1] == ["gpt-4.1-mini"]
    assert chosen.steps["qa"].providers[0].model == "qwen3.5:4b-q4_K_M" and isinstance(chosen.steps["qa"].providers[0], OllamaProvider)
    openai_ok = {"choices": [{"message": {"content": '{"park": "Zion"}'}}], "usage": {}}
    sent = fake_api(openai_ok, gemini_reply('{"park": "Yosemite"}'))
    assert chosen.complete_json("intake", "s", "u", SCHEMA).data == {"park": "Zion"}  # 摘条件走 OpenAI
    assert chosen.complete_json("dispatch", "s", "u", SCHEMA).data == {"park": "Yosemite"}  # 没写的步骤照旧
    assert [r["url"].split("/")[2] for r in sent] == ["api.openai.com", "generativelanguage.googleapis.com"]
    # 写错了不悄悄忽略
    for wrong in ("planner=openai", "intake=claude", "intake="):
        monkeypatch.setenv("COPILOT_STEP_MODELS", wrong)
        with pytest.raises(ProviderError):
            chat_provider()


def test_free_models_come_first_in_chat_and_alerts(fake_api, monkeypatch):
    from nps_copilot.providers import alerts_chain, cloud_chain

    monkeypatch.setenv("GROQ_API_KEY", "test-groq-key")
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-openrouter-key")
    assert [p.model for p in cloud_chain()] == ["gemini-3.5-flash-lite", "nvidia/nemotron-3.5-super-vl:free", "qwen/qwen3.8-27b"]
    chain = alerts_chain()
    assert [p.model for p in chain] == ["gemini-3.5-flash-lite", "nvidia/nemotron-3.5-super-vl:free", "qwen/qwen3.8-27b"]
    assert chain[1].reasoning == {"effort": "high"}
    # 只有 Gemini 一把 key：两条链都只剩 Gemini
    for name in ("GROQ_API_KEY", "OPENROUTER_API_KEY", "OPENAI_API_KEY"):
        monkeypatch.delenv(name)
    assert [p.model for p in cloud_chain()] == ["gemini-3.5-flash-lite"]
    assert [p.model for p in alerts_chain()] == ["gemini-3.5-flash-lite"]


def test_deepseek_writes_the_schema_into_the_prompt_turns_thinking_off_and_treats_empty_replies_as_errors(fake_api, monkeypatch):
    from nps_copilot.providers import DeepSeekProvider

    monkeypatch.setenv("DEEPSEEK_API_KEY", "test-deepseek-key")
    monkeypatch.delenv("COPILOT_REASONING", raising=False)
    ok = {"choices": [{"message": {"content": '{"park": "Arches"}'}}],
          "usage": {"prompt_tokens": 50, "completion_tokens": 7, "prompt_cache_hit_tokens": 32}}
    sent = fake_api(ok)
    provider = DeepSeekProvider(rpm=0)
    completion = provider.complete_json("intake", "system text", "去拱门", SCHEMA)
    assert completion.data == {"park": "Arches"} and completion.meta["cache_hit_tokens"] == 32
    request = sent[0]
    assert request["url"] == "https://api.deepseek.com/chat/completions"
    assert request["headers"]["Authorization"] == "Bearer test-deepseek-key"
    body = request["body"]
    assert body["model"] == "deepseek-flash" and body["response_format"] == {"type": "json_object"}
    assert body["thinking"] == {"type": "disabled"} and body["temperature"] == 0 and "reasoning_effort" not in body
    # 官方要求提示词里有 json 这个词、给出格式：schema 写进系统提示词
    assert "json" in body["messages"][0]["content"] and '"park"' in body["messages"][0]["content"]
    # 打开思考：不传 temperature，带上档位
    monkeypatch.setenv("COPILOT_REASONING", "high")
    sent.clear()
    sent = fake_api(ok)
    DeepSeekProvider(rpm=0).complete_json("intake", "s", "u", SCHEMA)
    assert sent[0]["body"]["thinking"] == {"type": "enabled"} and sent[0]["body"]["reasoning_effort"] == "high"
    assert "temperature" not in sent[0]["body"]
    # 回了空内容：当出错，交给下一家
    sent.clear()
    fake_api({"choices": [{"message": {"content": ""}}]})
    with pytest.raises(ProviderError):
        provider.complete_json("intake", "s", "u", SCHEMA)
