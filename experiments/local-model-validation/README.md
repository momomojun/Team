# 本地 LLM 条件提取验证

目的：验证本机 Qwen3 4B 是否适合做 NPS Guide Copilot 的 Intake（需求提取）起点。本实验完整收纳在 Team 仓库的 `experiments/local-model-validation/` 下，与网站业务代码分开。

## 环境

- Windows，RTX 2070 Max-Q 8GB，系统内存约 16GB。
- Ollama 0.40.5 官方便携运行包；`ollama.exe` Windows 签名验证为 Valid，签名者 Ollama Inc.。
- 服务只监听 `127.0.0.1:11435`；`OLLAMA_NO_CLOUD=1`。
- 模型 `qwen3:4b`，4096 上下文，单并发，temperature=0，seed=42，think=false，最大生成 512 tokens。
- 没有更改系统 PATH、没有注册开机启动；Ollama 可能在用户目录生成 `.ollama` 本机密钥。模型、服务日志和测试文件在本目录。
- 本目录包含下载的运行包、runtime 和模型权重，不要整体提交 Git。

## 运行

第二版“原文提取 + 代码校验”请看 [v2/README.md](v2/README.md)。第二版结果保存在独立运行目录，原来的 `validate.py` 与首轮结果保留。

从 Team 仓库根目录打开 PowerShell。以下使用相对路径，换一台电脑也无需沿用原来的 D 盘目录：

```powershell
Set-Location .\experiments\local-model-validation

# 先确认没有已有服务占用 11435；只需启动一次
& .\start-local.ps1

# 模型首次下载（需要联网；后续推理不需要云端模型）
python .\pull-model.py

# 完整 16 案例验证（Python 标准库，无需额外 pip 包）
python .\validate.py

# 测试后释放显存，保留权重与本机服务
python .\unload-model.py
```

如系统 Python 版本不兼容，本次使用的解释器为：

`C:\Users\ZJ\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`

每次运行会覆盖 `results/cases.jsonl` 与 `results/report.json`。保留对比实验时，请先复制上一轮的 results 文件夹。不要在运行中修改 prompt 或标签。

## 评测口径

- 模型按 JSON Schema 约束输出；字段包括公园、日期、天数、出发机场、节奏、老人同行、状态、缺失项和冲突。
- 模糊日期或缺少年份时，不允许自动编造日期；不指定的非必填条件保留 null。
- 固定案例的期望标签由测试作者预先编写；本轮没有人工独立复核或外部 held-out 测试集。
- 数组按集合顺序无关比较；大多数案例检查全部字段，unsupported 案例仅检查指定的关键字段。
- PASS 要求 schema 合法、所标注字段匹配、没有因 token 上限截断。错误和超时计为 FAIL。
- 报告记录首请求（含模型加载）、后续请求延迟、模型版本与 digest、prompt hash、原始响应与逐字段差异。
- p95 采用 nearest-rank；16 条样本中相当于最大耗时，不应解释为生产性能指标。
- 输入本身给定三个公园与机场的映射，因此本测试不衡量开放域地名知识。

## 验证边界

此测试仅验证小样本结构化需求提取，不验证行程生成、真实工具调用、RAG、道路事实、引用正确性、多轮对话、并发、长期稳定性或多智能体效果。JSON 格式正确也不代表字段语义正确。

保留云端 provider 的方向已记录在 Team 开发记录中；本轮尚未实现 CloudProvider，也没有调用云端模型。

## 文件

- `validate.py`：prompt、schema、16 条输入与标签、执行和评分逻辑。
- `start-local.ps1`：仅本机服务启动脚本。
- `pull-model.py`：下载权重，不做云端推理。
- `results/report.json`：完成后生成的完整报告。
- `results/cases.jsonl`：运行中逐案例保存，失败也保留。
- `server.stderr.log` / `server.stdout.log`：运行日志。
- `RESULTS.md`：本次完成后的可读结论。

## 首轮实测摘要

16 条固定案例中，5 条全部字段通过，15 条结构及日期合法性通过。后续请求中位耗时 1.259 秒；首请求 75.762 秒，包含启动/加载及一次 GPU 探测超时恢复。37/37 层已加载至 GPU。

存在擅自补出日期/天数/公园、遗漏老人条件、未发现天数冲突等问题。硬件运行可行；这一套非思考模式、prompt 与模型组合尚不能直接作为可靠业务入口。不要把 JSON Schema 约束误认为语义正确性保证。

讨论记录：[LLMOPS_WORK_LOG.md](../../docs/LLMOPS_WORK_LOG.md)。

## 交接与版本管理

- 所有 16 条验证输入、预期标签、prompt、schema 与评分规则均在 `validate.py`，没有依赖 Team 外的验证目录。
- 完整原始结果保存在 `results/report.json` 和 `results/cases.jsonl`；通过与失败记录都保留。
- 首轮运行服务日志归档为 `results/baseline-server-stderr.txt` 和 `results/baseline-server-stdout.txt`，保留当时的原始路径；不属于待修改的运行配置。
- 本机权重、运行库、下载包也已搬入本目录，但通过 `.gitignore` 排除，避免把数 GB 二进制提交 Git。脚本、文档、验证集、原始报告及归档日志可以提交。
- 新接手的人从 Git clone 获取代码后，需要按照 `runtime-provenance.json` 下载对应官方 Windows 便携包，解压到 `runtime/`，再运行下载模型和验证命令。本机已保留这些文件，不需要重新下载。
- `migration-inventory.json` 是搬迁前文件名与大小清单；搬迁后的文档修订会使少量文本文件大小变化。
