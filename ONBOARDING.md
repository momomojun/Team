# 组员上手指南 / Team Onboarding

写给第一次接触这个仓库的组员（也适合交给 AI 助手先读）。按顺序做，第 1–3 步做完就能在自己电脑上跑起网站和 Copilot。

**English summary.** Install Git, Node 24, Python 3.12 and Docker Desktop, then clone `momomojun/Team`. Run the website with `npm install && npm run dev`, and run the tests with `npm test` and `pytest`. The Copilot runs three ways: replay (no model), one command with Docker (`docker-compose.ollama.yml`, which also starts Ollama and downloads the model), or plain Python against a local Ollama. To change anything, create a branch, commit in Chinese + English, push, and open a PR; the five CI checks must pass before merging. If you change prompts, cases or the model, re-record evals locally first. Never commit API keys. Read `docs/PROJECT_LOG.md` and `docs/LLMOPS_PLAN.md` for context.

---

## 0. 这个项目是什么（一分钟版）

- **网站 NPS Guide**（`src/`，Next.js）：美国国家公园行程规划，按日期排行程、算车程、提醒封路和预约。排行程的逻辑是**确定的代码**，不用 AI。
- **Copilot**（`copilot/`，Python）：课程（CSYE 7374 LLMOps）加的 AI 部分。用户随口说一句“6 月带爸妈去优胜美地玩 4 天”，AI 模型从里面摘出条件，代码检查、追问，齐了以后交给网站的排行程引擎（`plan_trip`），再写成说明。
- **模型**：本机跑的 Qwen3.5 4B（通过 Ollama），不用云端、不花钱。
- **CI/CD**：每个 PR 自动跑 5 项检查；推 `copilot-v*` 标签自动发版到 GHCR。

更多背景：[docs/PROJECT_LOG.md](docs/PROJECT_LOG.md)（做过什么、为什么）、[docs/LLMOPS_PLAN.md](docs/LLMOPS_PLAN.md)（LLMOps 分阶段计划）、[copilot/README.md](copilot/README.md)、[copilot/RELEASE.md](copilot/RELEASE.md)。

## 1. 装工具（只做一次）

| 工具 | 版本 | 做什么用 | 必须吗 |
|---|---|---|---|
| [Git](https://git-scm.com/) | 最新 | 下载代码、提交改动 | 必须 |
| [Node.js](https://nodejs.org/) | **24** | 网站、排行程引擎、网站测试 | 必须 |
| [Python](https://www.python.org/) | 3.11 以上（CI 用 3.12） | Copilot | 改 Copilot 才需要 |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | 最新 | 一键跑 Copilot + 模型 | 想跑 Copilot 的推荐装 |
| [GitHub CLI](https://cli.github.com/)（`gh`） | 最新 | 在命令行开 PR、看检查结果 | 可选 |
| NVIDIA 显卡 | 6 GB 显存以上 | 模型跑得快 | 可选，没有也能跑，只是慢 |

还要：一个 GitHub 账号，并且被加为仓库协作者（找 momomojun）。仓库是公开的，不是协作者也能下载、运行，但不能推送分支。

## 2. 下载代码

```bash
git clone https://github.com/momomojun/Team.git
```

```bash
cd Team
```

```bash
npm install
```

Windows 上建议先运行一次 `git config --global core.autocrlf true`。仓库里的 `.gitattributes` 已经让提示词和评测录音保持 LF 换行，不用管它们。

## 3. 跑起来

### 3.1 网站

```bash
npm run dev
```

打开 http://localhost:3000 。不配任何 key 也能用；想让 NPS 公告等接口更稳，复制 `.env.example` 成 `.env.local`，按里面的说明自己申请免费 key 填进去。**`.env.local` 不会被提交，key 永远不要写进代码或发到群里。**

### 3.2 测试

```bash
npm test
```

```bash
pip install -e "copilot[dev,api]"
```

```bash
python -m pytest -q copilot/tests
```

`npm test` 是网站的测试（约 130 个，几秒），`pytest` 是 Copilot 的测试（约 100 个）。两个都不联网、不要模型。

### 3.3 Copilot：三种跑法，选一个

**A. 不要模型（最快，看看流程）**：用录好的模型回答回放，CI 也是这样跑的。

```bash
cd copilot && python eval/run.py --replay eval/recordings/qwen3.5_4b-q4_K_M.jsonl --gate eval/baseline.json --plan
```

**B. 一键启动（推荐给组员）**：Docker 同时启动 Ollama（模型服务）和 Copilot，第一次会自动下载模型。电脑上不用另外装 Ollama。

```bash
docker compose -f copilot/docker-compose.yml -f copilot/docker-compose.ollama.yml up -d --build
```

有 NVIDIA 显卡的，在 `up` 前面多加一个 `-f copilot/docker-compose.gpu.yml`，快很多。第一次要下载约 7 GB（Ollama 镜像约 3.8 GB + 模型约 3.4 GB），之后就不用了。

这条命令会等模型下载完、装进显卡（“预热”）才启动 Copilot，所以每次启动都要等几分钟（在 momomojun 的电脑上：第一次连下载 17 分钟，之后每次约 3.5 分钟）；起来以后每句话几秒。起来以后测一下：

```bash
python copilot/scripts/smoke.py http://127.0.0.1:8765 --wait 900
```

看到“冒烟测试通过”就好了。用完关掉：`docker compose -f copilot/docker-compose.yml -f copilot/docker-compose.ollama.yml down`（模型留在 Docker 卷里，下次不用重新下载）。

- 8765 端口被别的程序占了：命令前面加 `COPILOT_PORT=8766`（PowerShell 里先 `$env:COPILOT_PORT=8766`），测试地址也换成 8766。
- Mac：Docker 里用不了苹果芯片的 GPU，模型在 CPU 上很慢。建议在 Mac 上直接装 [Ollama](https://ollama.com/download)，运行 `ollama pull qwen3.5:4b-q4_K_M`，然后用下面的 C。

**C. 直接用 Python（改 Copilot 代码时最方便）**：自己开着 Ollama。

```bash
cd copilot && python -m nps_copilot chat --reference 2026-10-16
```

Ollama 的地址默认是 `http://127.0.0.1:11435`（momomojun 电脑上实验目录里的便携版用这个端口）。自己装的 Ollama 默认端口是 11434，先设 `OLLAMA_HOST_URL=http://127.0.0.1:11434`。

## 4. 改东西的流程

```
从 main 拉新分支 → 改 → 本机跑测试 → 提交（中英双语）→ 推分支 → 开 PR → 5 项检查全绿 → 请人看 → 合并
```

```bash
git checkout main && git pull
```

```bash
git checkout -b feature/你要做的事
```

改完：

```bash
git add -A && git commit
```

```bash
git push -u origin feature/你要做的事
```

然后在 GitHub 上开 PR（或者 `gh pr create`）。

**规则**：
- 不要直接推到 `main`，一律走 PR。
- 提交说明、PR 标题和描述都写**中文 + 英文**（看 `git log` 里的例子）。
- 一个 PR 做一件事；合并后可以删掉自己的分支。
- 不提交 key、密码、`.env.local`；不提交模型文件（几 GB，已经在 `.gitignore` 里）。

### PR 上的 5 项检查

| 检查 | 查什么 | 没过怎么办 |
|---|---|---|
| Website (lint, types, tests) | 网站代码风格、TypeScript 类型、`npm test` | 本机跑 `npm run lint`、`npx tsc --noEmit -p .`、`npm test` 找原因 |
| Copilot (tests, replay eval gate) | Copilot 的 pytest、三组回放评测分数不能低于基线 | 本机跑 `pytest` 和 `copilot/eval/run.py`（见 copilot/README.md） |
| Copilot image (build, smoke test) | Docker 镜像能构建、起来以后能排出行程 | 看 GitHub 上这项的日志 |
| Vercel / Vercel Preview Comments | 网站能在 Vercel 上构建出预览版 | 点进去看构建日志 |

## 5. 改了什么，要多跑什么

| 你改了 | 还要做 |
|---|---|
| 景点、住宿数据（`src/data/attractions/` 等） | 按 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) 的“数据脚本”重新生成；`npm test` |
| 公园、机场（`src/data/parks.ts`、`airports.ts`） | `npm run copilot:contracts`（Copilot 的目录要跟着变）；必要时 `python copilot/scripts/regional_names.py`（各地叫法，要联网） |
| Copilot 的 Python 代码 | `pytest`；三组回放门禁；**改了中文字也要跑 `npm run copilot:contracts`**（繁简对照表按代码里的汉字生成，不跑的话网站测试会失败） |
| 提示词（`copilot/nps_copilot/prompts/`） | 不改旧文件，新建 `intake_v2.txt` 这样的新版本；在本机用真模型重新录评测（[copilot/RELEASE.md](copilot/RELEASE.md)“提示词怎么改”） |
| 评测样例（`copilot/eval/cases/`） | 新样例**先写好期望、提交，再第一次跑**，这样成绩才可信；然后用真模型 `--record` 录音 |
| 中文文案 | 有英文版对应的，用 `scripts/rekey-zh.py` 改（直接改会让英文对不上），见 [docs/ENGLISH.md](docs/ENGLISH.md) |
| 网站界面 | 在浏览器里实际看过（手机宽度也看），再开 PR |

## 6. 用 AI 助手（Claude Code 等）一起改

- 仓库根目录的 `CLAUDE.md`、`AGENTS.md` 会被 Claude Code 自动读到，里面链到 README 和开发文档。
- 让助手先读本文件、[docs/PROJECT_LOG.md](docs/PROJECT_LOG.md) 和 [docs/LLMOPS_PLAN.md](docs/LLMOPS_PLAN.md)。
- 数据整理、核对事实的任务说明在 [docs/agent-briefs/](docs/agent-briefs/)，可以直接交给助手。
- 这个项目用的 Next.js 16 和助手训练时见过的版本不一样，改网站代码前让它先看 `node_modules/next/dist/docs/`（`AGENTS.md` 里写了）。

## 7. 常见问题

- **`npm ci` 报锁文件对不上**：Windows 生成的 `package-lock.json` 偶尔缺 Linux 的可选包。用 `npm install`，CI 会自动退回去并标警告。
- **评测报“回放记录里没有这次调用”**：你改了提示词或样例，录音对不上了。要用真模型重新录（见第 5 节）。
- **Copilot 报“连不上本机 Ollama”**：Ollama 没开，或者地址、端口不对。用第 3.3 节的 B，或者设对 `OLLAMA_HOST_URL`。
- **Git Bash 里 `-e COPILOT_REPLAY=/app/...` 这类路径被改成 Windows 路径**：命令前加 `MSYS_NO_PATHCONV=1`。
- **不知道某个功能在哪个文件**：[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) 的“代码结构”表。
