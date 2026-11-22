# 11-22：数据版本：每个回答记下用的哪份数据（分支 `feature/data-version`）

- 为什么做：对照计划书，最核心的一条没做完：“每个回答能追溯到模型、提示词、数据版本”（计划书 §3、§4、§6、§8 目标 1、2，GOALS 的 P9、P29、P32、P33、A4）。代码和提示词早有版本，数据没有：同一句话、同一个模型，今天和上个月排出来不一样，分不清是模型变了还是景点、封路数据变了。仓库主人 11-22 定先补这一条。
- 改了什么：
  - `copilot/nps_copilot/data_version.py`：网站数据 `src/data/`、给 Copilot 的资料 `copilot/contracts/`、各地叫法 `copilot/nps_copilot/data/` 各算一个 sha256（相对路径 + 内容），合成 12 位数据版本。换行统一成 LF：Windows 签出是 CRLF、镜像里是 LF，核对过和 git 里存的内容算出来一模一样。服务启动算一次，约 0.1 秒。
  - 实时公告单独记：排行程那一刻交给引擎的关闭清单（哪天读的、内容 hash、几条关闭）写进日志的 `plan.alerts_data`。
  - 记在哪：每轮日志的 `data`、镜像里还有 `build`（提交号，`git show <提交>:src/data/…` 就能拿回那一轮的数据原样）；`/health`、`python -m nps_copilot version`；评测报告、MLflow 参数；`stats` 按“版本 · 提示词 · 数据”分组；后台“服务”一栏。
  - 镜像：发版和 staging 多打一个 `sha-<提交>-p<提示词>-d<数据>` 标签（计划书 §6 写的“tag = git SHA + 提示词版本 + 数据 hash”），镜像 label 也写着；冒烟测试 `--expect-version repo` 核对镜像里的数据版本和这次提交一样，不一样就不发。
- 验证：新加 `copilot/tests/test_data_version.py`（内容变 hash 变、换行不同不变、缓存文件不算、公告快照、镜像标签格式、每轮日志有数据版本和提交号、统计按数据分组、`/health` 报数据版本）；漂移测试多查一步：用了公告清单的那次排行程记下了清单的日期和条数，没用的不记。Copilot 508 个测试通过，ruff 干净；单句、多轮、会自己查三组回放门禁照旧通过，报告里有了数据版本。网站 `tsc`、`eslint` 干净。镜像里的数据核对要等 CI 的镜像冒烟测试跑。
- 没做：`TripResult.engine.version` 还是写死的 "1"（引擎代码的版本由提交号管）；Neon 里的向量是按哪一版资料算的还没记（`vectors sync` 没跑时线上按意思找不到新资料，以后可以拿 contracts 的 hash 对一下）。
