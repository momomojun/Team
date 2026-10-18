# Copilot 发版、部署、回滚 / Release, deploy, rollback

阶段 3（2026-10-17）。English summary: a release is a git tag `copilot-v<version>`. Pushing it runs `.github/workflows/release.yml`: tests and replay eval gates → Docker build → smoke test → push `ghcr.io/momomojun/team-copilot:<tag>` and `:latest` → pull and smoke test again → GitHub Release with the eval reports. Deployments pin an image with `COPILOT_TAG`. To roll back, change the tag and run `up -d` again. Prompts are versioned files; `COPILOT_PROMPT_INTAKE=v1` switches a running deployment back without a new image. `python -m nps_copilot stats` summarizes the run logs by Copilot version and prompt version, and that summary is the evidence for a rollback.

## 一个版本由什么组成

| 部分 | 在哪 | 怎么定版本 |
|---|---|---|
| 代码 | `copilot/nps_copilot/`、行程引擎 `src/` | `nps_copilot/__init__.py` 的 `__version__`（和 `pyproject.toml` 一起改），git tag `copilot-v<版本>` |
| 镜像 | `ghcr.io/momomojun/team-copilot:<tag>` | 和 git tag 同名；镜像里记着构建的提交（`/health` 的 `build`） |
| 提示词 | `nps_copilot/prompts/<任务>_v<n>.txt` | 默认用哪一版写在 `prompts/defaults.json`；部署时可以用环境变量临时换 |
| 模型 | 宿主机的 Ollama，不在镜像里 | `COPILOT_MODEL`（默认 `qwen3.5:4b-q4_K_M`） |

每轮对话的日志（`/data/runs/<日期>.jsonl`）都记着 Copilot 版本、每个提示词的版本和 hash、模型，事后能对上是哪个组合出的问题。`GET /health` 也报这几样。

## 发一个新版本

1. 改 `__version__` 和 `pyproject.toml` 的 `version`，走 PR。PR 上 CI 会跑：网站检查、pytest、两组回放评测门禁，还会构建镜像、用回放模型冒烟测试（`docker` 那个 job）。
2. 合并以后打 tag 推上去：

   ```bash
   git -C D:/LLM/Team tag copilot-v0.2.0 origin/main
   ```

   ```bash
   git -C D:/LLM/Team push origin copilot-v0.2.0
   ```

3. `Copilot release` workflow 会检查 tag 和代码里的版本一致，再跑一遍测试和门禁，构建、冒烟、推镜像，最后建 GitHub Release（附评测报告、镜像 digest、默认提示词版本）。任何一步没过都不发。

GHCR 的包第一次推上去默认是私有的：别的机器要拉，先 `docker login ghcr.io`（用有 `read:packages` 权限的 token，自己在终端里登录），或者在 GitHub 包的设置里改成公开。

## 部署（本机）

```bash
powershell -File D:/LLM/Team/experiments/local-model-validation/start-local.ps1
```

```bash
COPILOT_TAG=copilot-v0.2.0 docker compose -f D:/LLM/Team/copilot/docker-compose.yml up -d
```

```bash
python D:/LLM/Team/copilot/scripts/smoke.py http://127.0.0.1:8765 --expect-version 0.2.0
```

- 本机 8765 端口被占了（比如别的项目的服务）就加 `COPILOT_PORT=8766`，冒烟测试的地址跟着改。
- 容器通过 `host.docker.internal` 连宿主机的 Ollama；Ollama 只监听 127.0.0.1 也连得上（Docker Desktop 转发）。
- 运行日志在 `copilot/runs/`（挂进容器的 `/data/runs`，不提交）。
- 还没发过版、想先在本机试：`docker build -f copilot/Dockerfile -t ghcr.io/momomojun/team-copilot:dev .`（在仓库根目录），再用 `COPILOT_TAG=dev`。

## 回滚

**换镜像**（代码出了问题）：把 `COPILOT_TAG` 换成上一个 tag 再 `up -d`，用冒烟测试确认旧版本起来了：

```bash
COPILOT_TAG=copilot-v0.2.0 docker compose -f D:/LLM/Team/copilot/docker-compose.yml up -d
```

```bash
python D:/LLM/Team/copilot/scripts/smoke.py http://127.0.0.1:8765 --expect-version 0.2.0
```

**只换提示词**（新提示词让模型变差）：不换镜像，环境变量指定旧版本：

```bash
COPILOT_TAG=copilot-v0.2.0 COPILOT_PROMPT_INTAKE=v1 docker compose -f D:/LLM/Team/copilot/docker-compose.yml up -d
```

回滚以后在代码里把 `prompts/defaults.json` 改回去（或者修好提示词出下一版），走 PR，再发版。

## 提示词怎么改

- 不改旧文件，新建下一版（`intake_v2.txt`）；旧版留着才能回滚，也才能和旧的评测录音对上。
- 在本机用真模型把开发集和回归集都录一遍：

  ```bash
  cd D:/LLM/Team/copilot && COPILOT_PROMPT_INTAKE=v2 python eval/run.py --record --plan
  ```

  ```bash
  cd D:/LLM/Team/copilot && COPILOT_PROMPT_INTAKE=v2 python eval/run.py --cases eval/cases/holdout-v1.jsonl --record --plan
  ```

  不是默认版本的提示词录到 `recordings/<模型>[-<样例>]-intake_v2.jsonl`，不会覆盖默认版本的录音。
- 两组都不比现在差，才改 `defaults.json`：把新录音改名成默认的文件名、更新两个 baseline，走 PR（CI 门禁会用新录音检查）。有一组变差就不换，新版本留在仓库里当实验记录。

## 监控：什么时候该回滚

```bash
docker compose -f D:/LLM/Team/copilot/docker-compose.yml exec -T copilot python -m nps_copilot stats --days 7
```

按“Copilot 版本 · 提示词版本”分组，列出：对话数、排出行程 / 追问 / 出错的轮数、耗时中位数和 P90、模型编造被丢掉的片段、规则补的条件、Writer 退回模板的次数。新版本上线后和上一个版本比，出现下面任何一种就回滚：

- 排出行程的比例明显下降，或者追问变多（同样的用户，问得更多说明 Intake 变差了）；
- 出错（plan_trip 拒绝请求）增加；
- 被丢掉的片段增加：模型在编造原话里没有的东西；
- Writer 退回模板变多：模型改写的说明经常对不上结果；
- 耗时中位数明显变长。

不在 Docker 里跑时，直接 `cd copilot && python -m nps_copilot stats`（读 `copilot/runs/`）。

## 回滚演示（2026-10-17，本机）

intake 提示词 v2 想修回归集里模型漏摘的两组（H20 注入里混着两个天数、H38 回程地写在前面），例子换了别的公园和数字、没照抄样例。真模型录下来：

| | 开发集（25） | 回归集 holdout-v1（40） |
|---|---:|---:|
| intake v1（默认） | **25/25** | 37/40 |
| intake v2 | 24/25 | **39/40** |

v2 把那两组修好了，但开发集里一句英文（“Glacier for 4 days starting July 10, 2027, flying into Kalispell, relaxed pace”）出发地和天数都没摘出来。门禁挡住了它（`门禁没过：24 < 基线 25`），所以 **默认仍是 v1**，v2 留在仓库里当实验记录，录音是 `recordings/qwen3.5_4b-q4_K_M-intake_v2.jsonl` 和 `…-holdout-v1-intake_v2.jsonl`。

然后用本机构建的镜像（`COPILOT_TAG=dev`）演示上线后发现问题、只回滚提示词：

1. `COPILOT_PROMPT_INTAKE=v2 docker compose ... up -d`：`/health` 报 `intake/v2`；发那句英文 → 追问 “How many days do you have for the trip?”，冒烟测试失败。
2. `COPILOT_PROMPT_INTAKE=v1 docker compose ... up -d`（同一个镜像）：`/health` 报 `intake/v1`；同一句 → 排出冰川 4 天；默认的优胜美地冒烟测试也通过。
3. `stats` 分成两组：`intake/v2` 1 轮、排出 0、追问 1；`intake/v1` 2 轮、排出 2。

换镜像的回滚要等至少发过两个版本（`copilot-v0.1.0` 那时还没有 Dockerfile，第一个有镜像的版本是 `copilot-v0.2.0`）；步骤和上面一样，只是换 `COPILOT_TAG`。
