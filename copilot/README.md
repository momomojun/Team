# NPS Guide Copilot

LLMOps 课程项目的 Copilot 部分。总体计划见 [docs/LLMOPS_PLAN.md](../docs/LLMOPS_PLAN.md)；这里说已经做好的部分怎么用。

## 现在有什么（阶段 1：契约和工具，2026-10-17）

原则：**LLM 负责理解需求和解释结果，行程由网站现有的确定性引擎排**。Copilot 把用户的话整理成一个 `TripRequest`，交给 `plan_trip` 工具，拿回 `TripResult` 再去检查、解释。

| 文件 | 内容 |
|---|---|
| `contracts/trip-request.v1.schema.json` | 输入契约（JSON Schema 2020-12）：公园（1–4 座，第一座是主公园，其余要在它的 `nearby` 里）、`startDate` 或 `month`、天数（1–14）、出发地和回程地（常用机场三字码，或者名字加坐标）、节奏、住宿偏好、同行的人（最小孩子几岁、婴儿车、老人、轮椅），以及每个字段的来源 `provenance`（用户原话 / 用户确认 / 默认值 / 推断，附原文片段）。和网站“自动生成攻略”的表单 `WizardInput` 一一对应 |
| `contracts/trip-result.v1.schema.json` | 输出契约：每天的日期、时区、日出日落、出发和回住处的时间、开车和活动分钟数、当晚住处、每一站几点到几点（别的时区的景点另给 `localStart`）、提醒代码（`afterHours`、`tempClosed`、`parkingFull`……，见 `src/lib/copilot/contract.ts` 的 `STOP_WARNINGS`），没排进去的景点和原因，以及这次计算的假设（`assumptions`） |
| `contracts/parks.json`、`contracts/airports.json` | 59 座公园和名胜（代码、简繁英名字和别名、时区、常用机场、常一起玩的公园）、86 个机场。Intake 认公园名、机场就用这两个，不要在 Python 里另写一份 |
| `contracts/examples/` | 样例请求 |

这些 JSON 都是 `npm run copilot:contracts` 从 TypeScript 生成的（来源是 `src/lib/copilot/contract.ts`、`src/data/parks.ts`、`src/data/airports.ts`），不要手改；`tests/copilot-plan.test.ts` 检查文件和代码一致。改契约字段要升版本号（`trip-request/v2`），旧的评测记录才对得上。

## 怎么调用 plan_trip

命令行（不联网，同样的输入和日期每次结果一样）：

```bash
REFERENCE_DATE=2026-10-16 npm run copilot:plan -- copilot/contracts/examples/yose-4d-fat.json
```

HTTP（开着 `npm run dev` 时）：

```bash
curl -X POST "http://localhost:3000/api/copilot/plan?reference=2026-10-16" -H "Content-Type: application/json" --data-binary @copilot/contracts/examples/zion-page-month-las.json
```

- `reference` / `REFERENCE_DATE` 是“今天”：只给了月份时按它算最近的那个月（2026-10-16 时说 3 月就是 2027 年 3 月）。评测时一定要固定，结果才能复现。
- 请求不合格：命令行退出码 2，HTTP 返回 400，内容是 `{"error": "invalid_request", "issues": [{"path": "/days", "message": "不能大于 14"}]}`。`path` 是 JSON Pointer，Copilot 可以按它追问用户。
- 网站设了 `SITE_PASSWORD` 时，HTTP 接口和别的接口一样要先登录；本机开发不设密码就不用。

## 和行程页不一样的地方（结果的 `assumptions` 里会写）

- 行程页从机场到各景点的车程是浏览器里现查 OSRM；这里用预先算好的“机场 → 公园定位点 → 景点”，可能差几十分钟。不是常用机场的地点按直线距离估算。
- 不读 NPS 实时公告，只按仓库里整理的临时关闭（`src/data/closures.ts`）。要的话调用方查好，用 `live` 传进 `planTrip`。
- 只给了月份时，日出日落、班次、临时关闭按那个月 15 号起算。

## 下一步（阶段 2）

在这个目录下加 Python 服务：Intake（沿用 `experiments/local-model-validation/v3` 的做法，先修好 LLMOPS_PLAN 里列的几个状态机问题，输出改成 `TripRequest`）→ 调 `plan_trip` → Critic（按 `warnings`、`skipped` 检查硬约束，有问题带着原因再排一次）→ Writer（只根据 `TripResult` 写说明、附来源）。Provider：本机 Ollama（默认）、回放录好的输出（CI 用）、云端（留接口、默认关）。
