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
def fake_api(monkeypatch):
    """把 _post 换成按顺序返回写好的回复（或抛写好的错误），记下每次发了什么；不真的等待"""
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
    assert sent[0]["body"]["model"] == "minimax/minimax-m3.1-flash:free" and sent[0]["body"]["reasoning"] == {"effort": "low"}
    assert sent[0]["headers"]["Authorization"] == "Bearer test-openrouter-key"
    with pytest.raises(QuotaError):
        provider.complete_json("intake", "s", "u", SCHEMA)
    assert len(sent) == 2  # 每天的免费额度用完了：不重试
