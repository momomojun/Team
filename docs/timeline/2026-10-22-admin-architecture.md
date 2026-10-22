# 10-22：后台加模型调用架构图、英文版后台（分支 `feature/admin-architecture`）

- 为什么做：仓库主人要把模型调用的架构图放进后台，再做一个英文版的后台让老师查看（O71）。
- 架构图（`src/components/admin/architecture-diagram.tsx`，纯 SVG）：用户 → Next.js 中转（边做边报）→ Copilot 服务（FastAPI + LangGraph）里的调度员、摘条件（模型 + 代码核对）、plan_trip 行程引擎（不用模型）、Critic、Writer，问问题那一路的查询工具和回答问题（BM25），收尾写日志和检查点；聊天四步的模型顺序（Gemini 3.5 Flash Lite → MiniMax M3.1 Flash → Qwen3.8 27B → 本机 Qwen3.5 4B，出错、20 秒没回、没配 key 换下一个）；每晚读 NPS 公告那一路（MiniMax 推理开 high → Gemini → Qwen → 本机，关闭清单交给行程引擎）；日志、CI 回放门禁、MLflow。设计的顺序固定画，服务报的实际顺序不一样（本机只开了 Ollama）时另写一行。顺序按 `providers.py` 的 `cloud_chain`、`alerts_chain` 核对过。
- 英文版：`/en/admin`，后台的字中英两套写在组件里（不进网站翻译表）；用户原话、issue 标题照原样。中文、英文两版都在浏览器里看过。
