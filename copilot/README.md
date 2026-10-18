# NPS Guide Copilot

LLMOps 课程项目的 AI 部分：用户用自然语言说旅行需求，本机模型（Qwen3.5 4B，Ollama）摘出条件，代码检查、追问，交给网站的确定性行程引擎（`plan_trip`）排行程，再检查、写成说明。

The AI layer of the course project: a local model extracts trip conditions from free-form requests; code validates them and asks follow-ups; the website's deterministic engine plans the trip; code checks the result and writes the explanation.

| 想知道 | 看 |
|---|---|
| 怎么装、怎么跑（三种方式，包括 Docker 一键启动）、怎么改、怎么发版和回滚 | [docs/GUIDE.md](../docs/GUIDE.md) |
| 怎么设计的：契约、每个文件、提示词版本、评测方法、监控指标、环境变量 | [docs/COPILOT.md](../docs/COPILOT.md) |
| 评测成绩 | [eval/RESULTS.md](eval/RESULTS.md) |
| 做到哪了、下一步、为什么这么定 | [docs/PROJECT.md](../docs/PROJECT.md) |

最快的试法（不要模型，回放录好的输出）：

```bash
pip install -e "copilot[dev,api]"   # 在仓库根目录运行
```

```bash
cd copilot && python eval/run.py --replay eval/recordings/qwen3.5_4b-q4_K_M.jsonl --gate eval/baseline.json --plan
```
