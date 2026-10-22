# 上手和日常操作 / Guide

怎么装、怎么跑、怎么改、怎么开 PR、怎么部署和回滚，都在这一份里。第一次来的组员（和 AI 助手）按顺序读第 1–5 节。

**English summary.** Install Git, Node 24, Python 3.12 and Docker Desktop, then clone `momomojun/Team`. Run the website with `npm install && npm run dev`, and the tests with `npm test` and `pytest`. The Copilot runs three ways: replay (no model), one command with Docker (which also starts Ollama and downloads the model), or plain Python against a local Ollama. To change anything: branch, commit in Chinese + English, push, open a PR. `main` is protected, so three CI checks must pass before merging. If you change prompts or eval cases, re-record with the real model locally. Never commit API keys. Releases are `copilot-v*` tags; to roll back, switch `COPILOT_TAG` or a prompt version env var.

## 文档在哪

| 文档 | 写什么 |
|---|---|
| [README](../README.md) | 网站介绍（给访客看） |
| **本文件** | 怎么做事：安装、运行、改代码、开 PR、部署、发版、回滚 |
| [PROJECT.md](PROJECT.md) | 项目现状：做到哪、下一步、待决定的事、做过的决定 |
| [timeline/](timeline/) | 按时间的记录：每次改动（一个 PR）一个文件 |
| [GOALS.md](GOALS.md) | 目标清单：仓库主人提过的所有要求、计划书和课程的承诺，每条做到哪了；还没完成的列在最前面 |
| [DEVELOPMENT.md](DEVELOPMENT.md) | 网站的技术参考：代码结构、数据脚本、数据源和注意事项 |
| [COPILOT.md](COPILOT.md) | Copilot 的技术参考：设计、契约、文件、提示词版本、评测方法、环境变量 |
| [ENGLISH.md](ENGLISH.md) | 英文版怎么写 |
| [copilot/eval/RESULTS.md](../copilot/eval/RESULTS.md) | 评测成绩（每次评测往后加，不改旧的） |
| [archive/](archive/) | 存档，写完不再改：按官方资料核对事实的记录、交给 AI 助手的任务说明、早期模型实验的讨论记录 |
| [experiments/](../experiments/README.md) | 早期本地模型实验的脚本和结果（冻结，不改） |

**维护规则**：一件事只写在一个文档里，别处要用就放链接。改了东西，更新对应那一块的文档，在 [timeline/](timeline/) 里**新建一个文件**记一笔（写法见 [timeline/README.md](timeline/README.md)；不要往 PROJECT.md 末尾或者别人的文件里加，两个 PR 写同一个地方合并时一定冲突），[PROJECT.md](PROJECT.md) 的“现状”有变化才改；完成了 [GOALS.md](GOALS.md) 里的某一条，把它的状态改掉、打勾；仓库主人提了新要求，也加进 GOALS.md。

## 1. 这个项目是什么

- **网站 NPS Guide**（`src/`，Next.js）：美国国家公园行程规划，按日期排行程、算车程、提醒封路和预约。排行程的是**确定的代码**，不用 AI。
- **Copilot**（`copilot/`，Python）：课程 CSYE 7374 LLMOps 加的 AI 部分。用户随口说一句“6 月带爸妈去优胜美地玩 4 天”，AI 模型从里面摘出条件，代码检查、追问，齐了以后交给网站的排行程引擎，再写成说明。
- **模型**：谁稳谁准用谁，免费的先用（10-20 仓库主人定的，按评测成绩排）。全是免费档：聊天：Gemini 3.5 Flash Lite → OpenRouter 上的 MiniMax M3.1 Flash → Groq 上的 Qwen3.8 27B → 本机跑的 Qwen3.5 4B（通过 Ollama）；读 NPS 公告：MiniMax M3.1 Flash（推理开 high）→ Gemini → Qwen3.8 27B → 本机。10-21 仓库主人的 OpenAI key 没额度了，付费的 GPT-4.1 mini 不再放进默认顺序（`COPILOT_PROVIDER=openai` 还能单独用）。前一个出错（额度用完、服务忙）这一句就换下一个，`.env.local` 里没有那一家的 key 就跳过，什么 key 都没有就只用本机。评测、CI 用本机模型录好的回答回放，不调云端（比较的成绩见 RESULTS.md）。
- **CI/CD**：每个 PR 自动检查；推 `copilot-v*` 标签自动发版到 GHCR。

## 2. 装工具（只做一次）

| 工具 | 版本 | 做什么用 | 必须吗 |
|---|---|---|---|
| [Git](https://git-scm.com/) | 最新 | 下载代码、提交改动 | 必须 |
| [Node.js](https://nodejs.org/) | **24** | 网站、排行程引擎、网站测试 | 必须 |
| [Python](https://www.python.org/) | 3.11 以上（CI 用 3.12） | Copilot | 改 Copilot 才需要 |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | 最新 | 一键跑 Copilot + 模型 | 想跑 Copilot 的推荐装 |
| [GitHub CLI](https://cli.github.com/)（`gh`） | 最新 | 在命令行开 PR、看检查结果 | 可选 |
| NVIDIA 显卡 | 6 GB 显存以上 | 模型跑得快 | 可选，没有也能跑，只是慢 |

还要一个 GitHub 账号，并且被加为仓库协作者（找 momomojun）。仓库是公开的，不是协作者也能下载、运行，但不能推送分支。

## 3. 下载代码

```bash
git clone https://github.com/momomojun/Team.git
```

```bash
cd Team
```

```bash
npm install
```

Windows 上建议先运行一次 `git config --global core.autocrlf true`。`.gitattributes` 已经让提示词和评测录音保持 LF 换行。

## 4. 跑起来

### 网站

```bash
npm run dev
```

打开 http://localhost:3000 。`npm run dev`、`npm run build` 前会自动把 MapLibre 的 worker 复制到 `public/maplibre/`。构建版：`npm run build && npm run start`。

不配任何 key 也能用。想更稳，复制 `.env.example` 成 `.env.local`，按里面的说明自己申请免费 key 填进去。**`.env.local` 不会被提交；key 永远不要写进代码、文档或发到群里。**

| 环境变量 | 用途 | 不填时 |
|---|---|---|
| `DATA_GOV_API_KEY` | NPS、NLR 充电桩、GSA 接口通用的免费 key（https://api.data.gov/signup/） | 用 `DEMO_KEY`，每个 IP 每小时 30 次、每天 50 次 |
| `SERPAPI_API_KEY` | 机票实时价格（SerpApi 的 Google Flights 接口，免费每月 250 次） | 开发模式直接低频抓取 Google Flights 页面，部署后只给比价链接 |
| `DEEPL_API_KEY` | NPS 公告的中文翻译（DeepL API Free，每月 50 万字符） | 用免费的 MyMemory，额度用完时自用阶段再退到 Google 网页翻译 |
| `SELF_USE_SCRAPE` | 设成 `1`：部署后也打开自用抓取（Google Flights、AAA 油价、Google 网页翻译）；旧名 `PRICE_SCRAPE` 也认 | 开发模式开，构建版关 |
| `SITE_PASSWORD` | 访问密码，部署到公网时用 | 不要密码 |

### 测试

```bash
npm test
```

```bash
pip install -e "copilot[dev,api]"
```

```bash
python -m pytest -q copilot/tests
```

- `npm test`：网站的测试（约 130 个，几秒，不联网）。测试是怎么写的见 [DEVELOPMENT.md](DEVELOPMENT.md#测试是怎么写的)。
- `pytest`：Copilot 的测试（约 100 个，不联网、不要模型）。
- `npm run check:closures`：拿 NPS 最新公告和 `src/data/closures.ts` 对一遍，列出要人工看的临时关闭（联网）。
- 让 Copilot 排行程时用上最新的 NPS 公告（两周内出发的行程不排公告说关了的景点；清单超过 3 天就不用了，所以出发前一天跑一次）：

```bash
npm --prefix D:/LLM/Team run alerts:fetch
```

```bash
cd D:/LLM/Team/copilot && python -m nps_copilot alerts
```

  第二条：`.env.local` 里有 `GEMINI_API_KEY` 就用 Gemini 读（免费档），没有就用本机 Ollama（要开着）；读过的记在 `copilot/data/alerts/extracted.json`，下次只读新出现、改过的几条。其实不跑也行：用 Copilot 排两周内出发的行程时，要去的公园今天还没读过，它会当场只抓这几座公园的公告读一遍。GitHub 上每天也会自动抓一次，有新的关闭公告就开一个 `nps-alerts` 标签的 issue；仓库设置里加 secret `DATA_GOV_API_KEY` 更稳（不加用 DEMO_KEY，常常被限流）。

### Copilot：三种跑法，选一个

**A. 不要模型（最快，看看流程）**：回放录好的模型回答，CI 也是这样跑的。

```bash
cd copilot && python eval/run.py --replay eval/recordings/qwen3.5_4b-q4_K_M.jsonl --gate eval/baseline.json --plan
```

**B. 一键启动（推荐给组员）**：Docker 同时启动 Ollama（模型服务）和 Copilot，第一次自动下载模型，电脑上不用另外装 Ollama。

```bash
docker compose -f copilot/docker-compose.yml -f copilot/docker-compose.ollama.yml up -d --build
```

- 有 NVIDIA 显卡的，在 `up` 前面多加一个 `-f copilot/docker-compose.gpu.yml`，快很多。
- 第一次要下载约 7 GB（Ollama 镜像约 3.8 GB + 模型约 3.4 GB），之后不用再下。
- 它会等模型下载完、装进显卡（“预热”）才启动 Copilot，所以每次启动要等几分钟（momomojun 的电脑上：第一次连下载 17 分钟，之后约 3.5 分钟）；起来以后每句话几秒。模型留在显卡里 24 小时。
- 起来以后测一下，看到“冒烟测试通过”就好了：

```bash
python copilot/scripts/smoke.py http://127.0.0.1:8765 --wait 900
```

- 用完关掉（模型留在 Docker 卷里，下次不用重新下载）：

```bash
docker compose -f copilot/docker-compose.yml -f copilot/docker-compose.ollama.yml down
```

- 8765 端口被别的程序占了：命令前面加 `COPILOT_PORT=8766`（PowerShell 里先 `$env:COPILOT_PORT=8766`），测试地址也换成 8766。
- 已经在本机下好模型的，设 `OLLAMA_MODELS=<本机的 models 目录>` 就不再下载。
- Mac：Docker 里用不了苹果芯片的 GPU，很慢。建议直接装 [Ollama](https://ollama.com/download)，运行 `ollama pull qwen3.5:4b-q4_K_M`，然后用 C。

**C. 直接用 Python（改 Copilot 代码时最方便）**：自己开着 Ollama。

```bash
cd copilot && python -m nps_copilot chat --reference 2026-10-16
```

- `serve` 起 HTTP 服务（`POST /sessions`、`POST /sessions/{id}/messages`），`stats` 看运行统计，`version` 看版本。
- **在网站上用（行程页的对话框）**：开着 Copilot 服务和网站，打开 http://localhost:3000/zh-Hans/plan ，最上面会出现“Copilot · 用一句话说需求”；排出的行程直接放进下面的行程页，可以接着说要改什么。Copilot 没开时这一块不显示。

```bash
cd copilot && python -m nps_copilot serve --port 8765
```

- **对话存档（可选，LangGraph）**：装了 `python -m pip install "copilot[graph]"`，`serve` 就按 LangGraph 的流程图跑，对话存在 `copilot/data/sessions.sqlite`，Copilot 重启以后网站上接着聊不用重新说条件。
- **评测记到 MLflow（可选）**：`python -m pip install "copilot[experiments]"`，跑评测前设 `COPILOT_MLFLOW=1`（PowerShell 里 `$env:COPILOT_MLFLOW=1`），看成绩：

```bash
mlflow ui --backend-store-uri sqlite:///D:/LLM/Team/copilot/mlruns/mlflow.db
```

  打开 http://127.0.0.1:5000 ，在实验（单句理解、多轮对话、读公告、检索）里勾几条 run 比。
- **讲解版的配音（可选）**：行程页的“讲解版”默认用浏览器自带的声音，比较机械。想要像真人的配音，在开 Copilot 服务的那台电脑上装本机模型 Kokoro（免费、不联网），装好重启 `serve`，讲解版就自动换成它：

```bash
python -m pip install kokoro-onnx onnxruntime soundfile "misaki[zh]==0.9.4" --ignore-requires-python
```

  再到 https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1 下载 `kokoro-v1.1-zh.fp16.onnx`、`voices-v1.1-zh.bin`、`kokoro-v1.0.fp16.onnx`、`voices-v1.0.bin`（一共约 390 MB），放进 `copilot/models/kokoro/`。`--ignore-requires-python`：misaki 写着要 Python 3.12 以下，实际 3.13 上能用。
  8765 被占了（momomojun 的电脑上 ski-deals 用它）就换成 `--port 8766`，并在 `.env.local` 里写 `COPILOT_URL=http://127.0.0.1:8766`，再重启 `npm run dev`。用 Docker 起的 Copilot（B）也一样，网站默认连 8765。
- Ollama 地址默认 `http://127.0.0.1:11435`（momomojun 电脑上实验目录里的便携版，用 `powershell -File experiments/local-model-validation/start-local.ps1` 启动）。自己装的 Ollama 默认端口是 11434，先设 `OLLAMA_HOST_URL=http://127.0.0.1:11434`。其他环境变量见 [COPILOT.md](COPILOT.md#环境变量)。

### 直接调排行程引擎（plan_trip）

不经过 AI，直接给条件、拿行程。命令行（不联网，同样的输入和日期每次结果一样）：

```bash
REFERENCE_DATE=2026-10-16 npm run copilot:plan -- copilot/contracts/examples/yose-4d-fat.json
```

HTTP（开着 `npm run dev` 时）：

```bash
curl -X POST "http://localhost:3000/api/copilot/plan?reference=2026-10-16" -H "Content-Type: application/json" --data-binary @copilot/contracts/examples/zion-page-month-las.json
```

请求和返回的格式见 [COPILOT.md](COPILOT.md#契约copilot-和行程引擎之间的约定)。

## 5. 改东西

### 流程

```
从 main 拉新分支 → 改 → 本机跑测试 → 提交（中英双语）→ 推分支 → 开 PR → 检查全绿 → 合并
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

### 约定

- `main` 受保护：不能直接推，必须走 PR，3 项必需的检查（下表前三项）通过才能合并。合并不需要别人批准。
- 提交说明、PR 标题和描述都写**中文 + 英文**（看 `git log` 里的例子）。
- 一个 PR 做一件事；合并后删掉自己的分支。
- 不提交 key、密码、`.env.local`；不提交模型文件（几 GB，`.gitignore` 已经排除）。
- 事实以英文官方资料为准（NPS、Parks Canada、运营商官网），中英文一起改，记下来源。
- 改中文原文用 `scripts/rekey-zh.py`（直接改会让英文对不上），见 [ENGLISH.md](ENGLISH.md)。
- 网站界面：纸色底、墨色字的杂志风，不要默认 Tailwind 的“AI 味”；改完要在浏览器里实际看过（手机宽度也看）。
- 数据来源：不爬小红书；不登录任何网站；博主、明星、电影内容只转述加链接。别人的照片、剧照、视频不下载转存进仓库；要在页面上显示，用平台官方的嵌入（Instagram 帖子、YouTube 视频，点了才加载），只用本人、片方、发行方或官方授权的频道（10-19 仓库主人要明星照片和剧照放进网页时定的）。

### PR 上的检查

| 检查 | 查什么 | 没过怎么办 |
|---|---|---|
| Website (lint, types, tests) | 网站代码风格、TypeScript 类型、`npm test` | 本机跑 `npm run lint`、`npx next typegen`、`npx tsc --noEmit -p .`、`npm test` |
| Copilot (tests, replay eval gate) | Copilot 的 pytest、七组回放评测（三组单句、三组多轮对话、NPS 公告提取）不能低于基线 | 本机跑 `pytest` 和第 4 节 A 的命令（另两组见 `.github/workflows/ci.yml`） |
| Copilot image (build, smoke test) | Docker 镜像能构建、起来以后能排出行程 | 看 GitHub 上这项的日志 |
| Vercel / Vercel Preview Comments | 网站能在 Vercel 上构建出预览版（不是必需的） | 点进去看构建日志 |

### 改了什么，要多跑什么

| 你改了 | 还要做 |
|---|---|
| 景点、住宿数据（`src/data/attractions/` 等） | 按 [DEVELOPMENT.md](DEVELOPMENT.md#数据脚本) 重新生成；`npm run copilot:contracts`（Copilot 回答问题用的资料跟着更新）；`npm test` |
| 公园、机场（`src/data/parks.ts`、`airports.ts`） | `npm run copilot:contracts`；必要时 `python copilot/scripts/regional_names.py`（各地叫法，要联网） |
| Copilot 的 Python 代码 | `pytest`、七组回放门禁（命令见 `.github/workflows/ci.yml`）；**加了新汉字也要跑 `npm run copilot:contracts`**（繁简对照表按代码里的汉字生成，不跑网站测试会失败） |
| 提示词 | 见下面“改提示词” |
| 评测样例 | 见下面“加评测样例” |
| 中文文案 | 有英文版对应的，用 `scripts/rekey-zh.py` 改 |
| 网站界面 | 在浏览器里实际看过，再开 PR |

### 改提示词

1. 不改旧文件，新建下一版，比如 `copilot/nps_copilot/prompts/intake_v2.txt`。
2. 在本机用真模型把三组样例都录一遍（以开发集为例，另两组加 `--cases eval/cases/holdout-v1.jsonl`、`--cases eval/cases/regional-v1.jsonl`）：

```bash
cd copilot && COPILOT_PROMPT_INTAKE=v2 python eval/run.py --record --plan
```

   不是默认版本的提示词录到 `recordings/<模型>[-<样例>]-intake_v2.jsonl`，不会覆盖默认版本的录音。
3. 三组都不比现在差，才改 `prompts/defaults.json`：把新录音改名成默认的文件名、更新 `baseline*.json`，走 PR。有一组变差就不换，新版本留在仓库里当实验记录，成绩写进 [RESULTS.md](../copilot/eval/RESULTS.md)。

### 加评测样例

1. 新建 `copilot/eval/cases/<名字>.jsonl`，每行一组对话和期望（格式照着现有的写）。
2. **先提交期望，再第一次跑**，成绩才可信。
3. 用真模型跑并录音：`cd copilot && python eval/run.py --cases eval/cases/<名字>.jsonl --record --plan`。
4. 成绩写进 [RESULTS.md](../copilot/eval/RESULTS.md)；要当门禁就加一个 `baseline-<名字>.json`，在 `ci.yml` 和 `release.yml` 里各加一步。看过失败再修了代码的，那一批就不再算没见过的数据。

## 6. 部署网站

用 Vercel（个人用免费）：Vercel 用 GitHub 登录 → Add New → Project → 导入这个仓库 → 填环境变量 → Deploy。构建命令、输出目录都用默认的。现在的项目叫 team，网址 https://team-peach-five.vercel.app ，`main` 有新提交就自动部署，每个 PR 自动出预览版。

| 环境变量 | 部署时 |
|---|---|
| `SITE_PASSWORD` | 建议设。部署后的网址是公开的，而自用阶段的 Google Maps 评分快照、自用抓取都不适合公开 |
| `DATA_GOV_API_KEY` | 基本必填。`DEMO_KEY` 按 IP 限次数，Vercel 的出口 IP 是很多网站共用的 |
| `SELF_USE_SCRAPE` | 设了密码、只有自己用时才设成 `1`。Google 对云服务器的请求拦得更严，机票价格可能查不到，查不到就只给比价链接 |
| `DEEPL_API_KEY`、`SERPAPI_API_KEY` | 可选。MyMemory 的免费额度也是按 IP 算的，部署后翻译更容易用完，配 DeepL 更稳 |

- 手机上用：HTTPS 下 service worker 才能注册，所以离线功能要部署后才有；iPhone 用 Safari“添加到主屏幕”，安卓用 Chrome“安装应用”。
- 在微信里直接点 `*.vercel.app` 的链接可能会被拦，用手机浏览器打开，或者绑一个自己的域名。
- `vercel.app` 在中国大陆经常打不开；以后要给国内用户用，需要国内的服务器和备案（见 [DEVELOPMENT.md](DEVELOPMENT.md#以后做成微信小程序)）。
- 本机和手机连同一个 Wi-Fi 时也能临时看：`npm run build && npm run start`，手机打开 `http://电脑的局域网 IP:3000`。前提是电脑把这个网络设成“专用网络”并允许 Node.js 通过防火墙；公共 Wi-Fi 下别这么做。这种方式是 HTTP，离线功能不可用。

## 7. Copilot 的部署、发版、回滚

### 启动一个版本

- 电脑上没有 Ollama：用第 4 节的一键启动 B。不想自己构建、直接用发布好的版本，去掉 `--build`、设 `COPILOT_TAG=copilot-v0.2.0`（会从 GHCR 下载约 500 MB 的镜像）。
- 已经开着本机 Ollama（momomojun 的电脑）：只起 Copilot，容器通过 `host.docker.internal` 连宿主机的 Ollama（Ollama 只监听 127.0.0.1 也连得上）：

```bash
COPILOT_TAG=copilot-v0.2.0 docker compose -f copilot/docker-compose.yml up -d
```

```bash
python copilot/scripts/smoke.py http://127.0.0.1:8765 --expect-version 0.2.0
```

- 运行日志在 `copilot/runs/`（挂进容器的 `/data/runs`，不提交）。

### 发一个新版本

**什么时候发**（10-21 仓库主人定的）：每做完一个大功能就发一版，别攒太久（v0.2.1 到 v0.3.0 中间攒了 30 个 PR）。版本号三位：大功能升中间那位（0.3.0 → 0.4.0），只修问题升最后一位（0.3.0 → 0.3.1）；以后改了契约、接口不兼容了再升第一位。网站在 Vercel 上随 `main` 自动部署，不单独发版，网站的大改动一起写进这一版的说明。

1. 改 `copilot/nps_copilot/__init__.py` 的 `__version__` 和 `copilot/pyproject.toml` 的 `version`；在 `docs/releases/copilot-v<版本>.md` 写这一版新增了什么（中英文，照着上一版的写法，按 `docs/timeline/` 里上一版以后的文件整理），走 PR。
2. 合并以后打 tag 推上去：

```bash
git -C D:/LLM/Team tag copilot-v0.3.0 origin/main
```

```bash
git -C D:/LLM/Team push origin copilot-v0.3.0
```

3. `Copilot release` workflow 会检查 tag 和代码里的版本一致，再跑一遍测试和七组门禁，构建镜像、冒烟测试、推到 `ghcr.io/momomojun/team-copilot:<tag>` 和 `:latest`，从 GHCR 拉回来再冒烟一次，最后建 GitHub Release（附评测报告、镜像 digest、默认提示词版本，后面接上 `docs/releases/` 里这一版的说明）。任何一步没过都不发。

镜像在 GHCR 上是公开的（仓库公开，包跟着公开），任何人不用登录就能拉。发过的版本见仓库的 [Releases](https://github.com/momomojun/Team/releases)。

### 回滚

**换镜像**（新代码出了问题）：把 `COPILOT_TAG` 换成上一个 tag 再 `up -d`，用冒烟测试确认旧版本起来了：

```bash
COPILOT_TAG=copilot-v0.2.0 docker compose -f copilot/docker-compose.yml up -d
```

```bash
python copilot/scripts/smoke.py http://127.0.0.1:8765 --expect-version 0.2.0
```

**只换提示词**（新提示词让模型变差）：不换镜像，用环境变量指定旧版本：

```bash
COPILOT_TAG=copilot-v0.2.0 COPILOT_PROMPT_INTAKE=v1 docker compose -f copilot/docker-compose.yml up -d
```

回滚以后在代码里把 `prompts/defaults.json` 改回去（或者修好提示词出下一版），走 PR，再发版。

演示用：`copilot/scripts/rollback_demo.py` 按顺序启动几个版本，每个都确认 `/health` 的版本、发同一句话，最后列出每个版本的回复有什么不同（要开着本机 Ollama）：

```bash
python copilot/scripts/rollback_demo.py copilot-v0.2.1 copilot-v0.2.0 copilot-v0.2.1
```

2026-10-17 的提示词回滚、10-18 的换镜像回滚，过程和结果见 [RESULTS.md](../copilot/eval/RESULTS.md)。

### 监控：什么时候该回滚

```bash
docker compose -f copilot/docker-compose.yml exec -T copilot python -m nps_copilot stats --days 7
```

不在 Docker 里跑时：`cd copilot && python -m nps_copilot stats`。新版本上线后和上一个版本比，出现下面任何一种就回滚（指标的意思见 [COPILOT.md](COPILOT.md#监控指标)）：

- 排出行程的比例明显下降，或者追问变多；
- 出错（plan_trip 拒绝请求）增加；
- 被丢掉的片段增加：模型在编造原话里没有的东西；
- Writer 退回模板变多；
- 耗时中位数明显变长。

最后一段“模型用量”按模型列出调用次数、出错、token 和花费：Gemini 出错多、轮到 MiniMax、Qwen 甚至本机的变多，说明免费额度不够了（MiniMax 每天约 50 次、Groq 每分钟 8000 token）。

同样的数字也可以在网站的后台看：开着 Copilot 服务和网站时打开 http://localhost:3000/zh-Hans/admin （有每天的图、每个模型的花费、最近几轮对话、每晚读公告的结果，每 30 秒刷新）。

## 8. 和 AI 助手（Claude Code 等）一起改

- 仓库根目录的 `CLAUDE.md` 会被 Claude Code 自动读到，里面带着 README、本文件和 DEVELOPMENT.md。
- 让助手先读本文件、[PROJECT.md](PROJECT.md) 和 [GOALS.md](GOALS.md)（还没完成的目标）。
- 这个项目用的 Next.js 16 和助手训练时见过的版本不一样，改网站代码前先看 `node_modules/next/dist/docs/`（`AGENTS.md` 里写了）。
- 开发服务器用预览工具启动（`.claude/launch.json` 里的 `nps-guide`），不要用后台命令行起。
- 给人看的命令要能在任何目录下运行，比如用 `git -C`、`npm --prefix`、绝对路径。
- 推送、打 tag、发版、改仓库设置、删除东西之前先问仓库主人。
- PR 按主题合在一起，别拆得太细（10-19 仓库主人说“现在分的太细了”）；尽量别在没合并的 PR 上面再开 PR。交给仓库主人合并之前，把所有开着的 PR 都查一遍（`gh pr list`、`gh pr view <号> --json mergeable`），和 main、和彼此的冲突自己先修好，让仓库主人一次合完。
- 数据整理、核对事实的任务说明在 [archive/agent-briefs/](archive/agent-briefs/)，可以照着再派（组员接手的修复任务也写在这里，比如 `10-campground-seasons.md`，让自己的 AI 助手先读它）；派出去的调研任务要求“每做完一项马上写记录”，中途停下也不丢东西。
- 网页搜索额度：Claude Code 每个会话有上限（主对话和所有子助手共用，momomojun 的设置是 500 次，`CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`）。同时开的调研助手控制在 2–3 个；快用完时（约 400 次，或者第一次碰到额度报错）不再开新的调研，先把交接写进 [PROJECT.md](PROJECT.md)。

## 9. 常见问题

- **`npm ci` 报锁文件对不上**：Windows 生成的 `package-lock.json` 偶尔缺 Linux 的可选包。用 `npm install`；CI 会自动退回去并标警告。
- **CI 的类型检查报 `PageProps` 找不到**：先跑 `npx next typegen`，这些全局类型是 Next.js 生成的。
- **评测报“回放记录里没有这次调用”**：改了提示词或样例，录音对不上了，要用真模型重新录（见“改提示词”）。
- **Copilot 报“连不上本机 Ollama”**：Ollama 没开，或者地址、端口不对。用第 4 节的 B，或者设对 `OLLAMA_HOST_URL`。
- **一键启动后第一句话超时**：模型还没装进显卡。一键启动的预热步骤就是为这个加的；自己开的 Ollama 第一次调用前先 `ollama run qwen3.5:4b-q4_K_M` 一次。
- **Git Bash 里 `-e COPILOT_REPLAY=/app/...` 这类路径被改成 Windows 路径**：命令前加 `MSYS_NO_PATHCONV=1`。
- **不知道某个功能在哪个文件**：网站看 [DEVELOPMENT.md](DEVELOPMENT.md#代码结构)，Copilot 看 [COPILOT.md](COPILOT.md#文件)。
