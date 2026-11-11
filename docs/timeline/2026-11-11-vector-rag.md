# 11-10、11-11：回答问题前按意思找资料（Gemini 嵌入 + Neon pgvector），A/B/C 三组对照（分支 `feature/vector-rag`）

- **起因**：仓库主人 11-09 问 RAG、search agent 能不能用在项目上；助手建议先把 10-22 实验里更准的向量检索真正上线、补上 GOALS 的 P7 和 P35。仓库主人 11-10 定了：做，嵌入用 Gemini，向量存 Neon。
- **做了什么**：
  - `copilot/nps_copilot/embeddings.py`：Gemini 嵌入接口，768 维（pgvector 索引最多 2000 维，默认的 3072 太大），两个型号都支持（001 用 taskType，2 用官方的前缀写法），每次调用记进计费总账。
  - `copilot/nps_copilot/vectors.py`：向量存进 Neon 的新表 `copilot_knowledge_vectors`（不动网站的 `user_trips`、`chat_threads`）；回答问题时按 `COPILOT_RETRIEVAL` 选关键词 / 按意思 / 两样合起来，嵌入接口、数据库任何一步出错、或者按意思找一条都没找到（库是空的）都退回关键词；问题里点了全名、却还没算向量的景点住处放到最前面（CodeRabbit 指出的：不然线上设 `vector` 时，没 sync 的新资料连点名都找不到）；数据库查询超时不再重连重查。两千来条逐条比距离，不建 HNSW 索引。
  - `python -m nps_copilot vectors sync`：只给新的、改过的资料算向量；`--dry-run` 只数，`--first` 先算哪几座公园，`--limit` 这次最多算几条，额度用完就停、第二天接着算。
  - `eval/retrieval.py` 加了 Gemini + Neon 的跑法和录音回放；CI 和发版多一组门禁（`baseline-retrieval.json`），PR 评论的成绩表多一行；新的 `eval/rag_answers.py` 是 A/B/C 三组对照。
  - 默认（本机、CI）照旧关键词，原来八组回放门禁的录音不用重录；Modal 上设 `vector`，装 psycopg；`/health` 报找资料的方式，不查数据库（后台每 30 秒问一次，会让 Neon 一直醒着）。
- **成绩**（RESULTS.md）：48 题前 5 条有对的，关键词 0.81，按意思找（gemini-embedding-2）1.00、第 1 条就对 0.88；回答问题答到点子上，A 不给资料 0（全部老实说没写）、B 关键词 0.73、C 按意思找 0.94，英文问题 0.44 → 0.88（按模型自己标的出处算；第一次的算法被回答末尾自动附的出处带松了，PR 上 CodeRabbit 指出后改了，用录音回放重算）。
- **和原计划不一样的**：
  - 原来打算用“关键词 + 按意思”合起来，跑分里单用按意思找更好（合起来 0.92），线上改成 `vector`，仓库主人 11-10 同意的。
  - Gemini 免费档嵌入每个型号每天只能算 1000 条（官方文档没写，是 429 里给的），1996 条资料分了几天算：11-10 用 001 撞上限额，11-10、11-11 两天算 embedding-2，剩下 67 条 11-12 算完。
  - 没用 Chroma：Modal 上没有本机的嵌入模型，Neon 已经开着、自带 pgvector。
- **要仓库主人做的**：Modal 两个环境的 Secret `nps-copilot` 里加 `DATABASE_URL`（和 Vercel 上是同一串）；不加也能用，只是线上一直按关键词找。
- 这台新电脑没设过 Git 的作者，只在这个仓库里设成了以前一直用的 momomojun（GitHub 给的 noreply 邮箱）。
