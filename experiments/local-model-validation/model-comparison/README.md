# 模型对照：Qwen3 4B 与 Qwen3.5 4B

用户要求先测试 Qwen3.5 4B。本实验使用现有 Team 内的 Ollama 服务与权重目录；不改动 V1/V2/V3 的冻结实现、样本、提示词或历史报告，也不接入网站。

已完成：[本轮实测结论与失败解释](RESULTS.md)。候选 V2 合计 27/32（旧模型 28/32）、V3 场景 18/18（旧模型 17/18）；有改善也有退步，不能仅凭一个指标定型。

## 对照口径

- 基线 `qwen3:4b` 与候选 `qwen3.5:4b-q4_K_M` 均在本机运行。
- 两个模型分别跑 V2 的 32 条条件提取案例、V3 的 18 组/36 轮脚本对话。
- 同一任务使用完全相同的 prompt、JSON Schema、标准化、日期规则、状态机与断言。
- 同时显式固定 temperature=0、seed=42、num_ctx=4096、num_predict=512、top_k=20、top_p=0.95、min_p=0、repeat_penalty=1、presence_penalty=0、frequency_penalty=0、think=false。
- 原来的历史运行未显式固定所有采样参数，因此本次会重新运行原模型，主对照以本轮双方结果为准。
- 每个模型先做单独 preflight 检查加载、非思考响应及 schema 兼容，不计入质量分数；之后连续跑全部任务，避免频繁交换显存中的模型。
- 所有调用仅访问 `127.0.0.1:11435`，无云端模型推理。下载权重需要联网。

## 运行

从本目录运行；需先按上一级说明启动 Ollama：

```powershell
python pull.py
python -m unittest -v test_replay
python run.py

# 可指定已有的其他本地模型，另建运行目录
python run.py --models qwen3:4b qwen3.5:4b-q4_K_M
```

`run.py` 检查冻结摘要，然后创建 `runs/<UTC运行ID>/`。模型权重仍位于 `../models/` 并由 Git 忽略。运行完成后自动卸载每个模型，保留权重和服务。

## 文件

- `pull.py`：下载明确指定的本地模型，默认是用户选择的 Qwen3.5 4B Q4 标签。
- `run.py`：两个模型的受控对照，导入原有冻结工作流，不复制修改其规则。
- `test_replay.py`：3 个离线检查，验证评分能复现保留的 V2 分数、V3 状态，且拒绝截断或意外思考输出。
- `frozen-manifest.json`：首次对照推理前固定本轮代码和历史冻结摘要。
- `runs/.../report.json`：完整原始结果、模型 digest、模型模板/默认参数、显式采样参数、状态和差异。
- `runs/.../INPUT_OUTPUTS.md`：两模型全部实际输入输出。
- `runs/.../records.jsonl`：运行中逐次保存，失败也保留。
- `RESULTS.md`：完成后整理的对比结论。

## 解释限制

这是同一批已公开、同作者编写案例上的单次回归对照，不是独立盲测或通用模型能力排名。

两模型的架构、tokenizer、聊天模板不同；共同的固定解码设置便于控制变量，但不是各自官方推荐配置的最优效果。若以后测试推荐设置，应作为另一实验单独记录。

V2 原文覆盖与最终正确性分别报告，V3 确认与选项绑定主要由代码完成。之前复现的状态机问题仍然存在，换模型不会自动修复它们。

Qwen3.5 为多模态模型，但本实验仅传入文本，不测试图片能力。尚不涉及 RAG、真实工具调用、行程生成或生产并发。

官方资料：

- https://huggingface.co/Qwen/Qwen3.5-4B
- https://ollama.com/library/qwen3.5:4b-q4_K_M

官方模型卡支持通过服务参数切换非思考模式；本实验检查返回是否意外包含 thinking 或被 token 上限截断，避免把模式不一致的输出计入有效对照。
