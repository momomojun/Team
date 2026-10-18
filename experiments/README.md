# LLMOps 实验与验证

本目录保存 NPS Guide Copilot 的可复现实验，包含脚本、验证输入与标签、配置、原始结果和结论。

## 本地模型首轮验证

- [运行和交接说明](local-model-validation/README.md)
- [结果与限制](local-model-validation/RESULTS.md)
- [完整验证集、prompt、schema 和评分脚本](local-model-validation/validate.py)
- [机器可读完整报告](local-model-validation/results/report.json)
- [逐案例原始结果](local-model-validation/results/cases.jsonl)
- [项目讨论与工作记录](../docs/archive/LLMOPS_WORK_LOG.md)

> 2026-10-17 用户决定本机只留 Qwen3.5 4B（默认）和 Qwen3.5 9B（对照），删掉 Qwen3 4B（`qwen3:4b`）。下面 V1–V3 和模型对照的记录照旧保留（都是用 Qwen3 4B 跑的）；要复现，先 `ollama pull qwen3:4b`（约 2.5 GB）。现在 Copilot 的评测在 [copilot/eval/](../copilot/eval/RESULTS.md)。

当前基线：Qwen3 4B Q4_K_M，16 个固定案例，5 个完全通过；本地 GPU 运行可行，需求理解尚未达到业务接入标准。完整测试不是独立留出集，不代表模型通用准确率。

模型权重、便携运行库与压缩包留在实验目录供本机继续使用，但不纳入 Git。新机器按运行说明准备环境。

## 第二版：拆分模型与代码的职责

- [设计、复测步骤与评分口径](local-model-validation/v2/README.md)
- [提取提示词](local-model-validation/v2/prompt.txt)
- [规则实现](local-model-validation/v2/intake.py)
- [第二版实测结论与剩余问题](local-model-validation/v2/RESULTS.md)
- [新预冻结集与完整标签](local-model-validation/v2/heldout.json)
- [运行结果目录](local-model-validation/v2/runs/)

第二版结果独立保存；第一版是历史基线，不能把规则测试通过等同于模型正确率。

本轮结果：原回归集完整流程从 5/16 提高到 15/16；同一批新 16 条上，旧方案 3/16、新方案 13/16。规则单元测试通过；仍有模型漏提取天数、字段混淆等失败。详见第二版结论中的评测限制。

## 第三版：年份确认与生活化偏好

- [结果、真实失败与后续优先级](local-model-validation/v3/RESULTS.md)
- [多轮实现与复测](local-model-validation/v3/README.md)
- [18 组脚本对话与逐轮预期](local-model-validation/v3/scenarios.json)

主实验 17/18 组、35/36 轮通过；额外代码边界检查 3 项均失败，分别涉及否定后误确认、补日期丢年份、自然选项指代。详情完整记录，不与 V2 单轮分数直接比较，也不能据此声称可可靠部署。

## Qwen3.5 4B 模型对照

- [与 Qwen3 4B 的同任务实测、改善与回退](local-model-validation/model-comparison/RESULTS.md)
- [完整对照运行方法](local-model-validation/model-comparison/README.md)

本轮双方重跑：单轮合计旧模型 28/32、候选 27/32；多轮场景旧模型 17/18、候选 18/18。严格原文检查包含一项空白差异导致的失败，需与真实理解错误区分。历史版本、原始结果和全部失败保留。
