---
title: NPS Guide Copilot
emoji: 🏞️
colorFrom: yellow
colorTo: red
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: Chinese trip-planning copilot for U.S. national parks
---

# NPS Guide Copilot

NPS Guide（美国国家公园行程规划网站）的 Copilot 服务：用户随口说一句“6 月带爸妈去优胜美地玩 4 天”，模型摘出条件，代码核对、追问，齐了以后交给网站的排行程引擎排出每天的行程。源代码在 https://github.com/momomojun/Team （`copilot/`），这个 Space 由那边的 GitHub workflow `hf-space.yml` 推上来，不要在这里直接改。

- 模型都是免费档的云端 API（Gemini → OpenRouter 上的 MiniMax → Groq 上的 Qwen），key 放在这个 Space 的 Secrets 里；Space 里不跑本机模型，讲解版的配音（Kokoro）也不装，网站会退回浏览器自带的声音。
- 接口要请求头 `X-Copilot-Token`（Space 的 Secret `COPILOT_TOKEN`），只有网站的中转知道它；`/health` 不要口令。发一句话、配音按来源限流。
- 免费的 Space 一段时间没人用会休眠，再打开要等它重新启动；重启以后正在聊的对话和运行日志都会丢。

The Copilot service behind NPS Guide, a Chinese-language trip planner for U.S. national parks. Source: https://github.com/momomojun/Team (`copilot/`); this Space is pushed by the `hf-space.yml` workflow there, so don't edit it here. It uses free-tier cloud models only (keys in this Space's Secrets), requires the `X-Copilot-Token` header except on `/health`, and rate-limits per client. Free Spaces sleep when idle and lose conversations and logs on restart.
