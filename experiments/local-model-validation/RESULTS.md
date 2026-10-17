# 本地模型验证结果

## 解读与下一步

硬件验证通过：模型可以在本机 GPU 运行，37/37 层加载至 GPU。当前配置的需求理解测试未达可直接用于业务的程度（5/16）。此为首轮基线，没有改标签或反复改 prompt 刷分。

主要失败：缺失条件被补造（日期、天数、公园），老人条件遗漏，日期范围与天数冲突漏检。一条日期格式异常被校验器拒绝。需要将状态派生与硬约束检查移到代码，并进一步比较提示词、思考模式和候选模型；比较时另留独立测试集。

首请求日志中出现过 CUDA 探测超时，之后恢复；75.762 秒包含启动开销，不能代表稳态每请求延迟。没有实测并发或长上下文。测试结束后已卸载模型释放显存，服务和权重保留。

以下为程序生成的原始本轮统计。

运行时间（UTC）：2026-10-17T01:32:38.005310+00:00

- 模型：`qwen3:4b`；Ollama：`0.40.5`。
- GPU：NVIDIA GeForce RTX 2070 with Max-Q Design, 8192 MiB, 7484 MiB, 610.62。
- 模型推理仅访问本机接口，没有调用云端模型。
- 固定案例通过：5/16；结构合法：15/16。
- 首请求：75.762 秒；后续请求中位耗时：1.259 秒。
- 全部请求 p50：1.2755 秒；nearest-rank p95：75.762 秒。

## 逐项结果

| 案例 | 结果 | 耗时（秒） | 差异／错误 |
|---|---|---:|---|
| zh_complete | PASS | 75.762 | {} |
| zh_vague_date | FAIL | 1.293 | {"seniors": {"expected": true, "actual": null}} |
| zh_missing_origin | FAIL | 1.215 | {"status": {"expected": "needs_clarification", "actual": "ready"}, "missing_fields": {"expected": ["origin"], "actual": []}} |
| zh_missing_days | FAIL | 1.231 | {"days": {"expected": null, "actual": 1}, "status": {"expected": "needs_clarification", "actual": "ready"}, "missing_fields": {"expected": ["days"], "actual": []}} |
| zh_missing_park | FAIL | 1.259 | {"parks": {"expected": [], "actual": ["yose"]}, "status": {"expected": "needs_clarification", "actual": "ready"}, "missing_fields": {"expected": ["parks"], "actual": []}} |
| zh_no_year | PASS | 1.231 | {} |
| zh_month_only | FAIL | 1.247 | {"start_date": {"expected": null, "actual": "2027-10-01"}, "status": {"expected": "needs_clarification", "actual": "ready"}, "missing_fields": {"expected": ["start_date"], "actual": []}} |
| zh_no_seniors | FAIL | 1.292 | {"seniors": {"expected": false, "actual": null}} |
| en_complete | PASS | 1.354 | {} |
| en_missing_date | FAIL | 1.075 | {"status": {"expected": "needs_clarification", "actual": "ready"}, "missing_fields": {"expected": ["start_date"], "actual": []}} |
| mixed_language | FAIL | 1.317 | {"start_date": {"expected": "2027-09-02", "actual": "2:2027-09-02"}} |
| zh_date_range | PASS | 1.309 | {} |
| duration_conflict | FAIL | 1.195 | {"days": {"expected": null, "actual": 4}, "status": {"expected": "needs_clarification", "actual": "ready"}, "conflicts": {"expected": ["duration_conflict"], "actual": []}} |
| unsupported_park | FAIL | 1.481 | {"parks": {"expected": [], "actual": ["yell", "grte", "yose"]}, "status": {"expected": "unsupported", "actual": "needs_clarification"}} |
| many_missing | PASS | 1.253 | {} |
| ignore_injection | FAIL | 1.379 | {"start_date": {"expected": null, "actual": "2023-10-05"}, "pace": {"expected": null, "actual": "relaxed"}} |

## 运行时加载情况

```json
{
  "models": [
    {
      "name": "qwen3:4b",
      "model": "qwen3:4b",
      "size": 3180247121,
      "digest": "359d7dd4bcdab3d86b87d73ac27966f4dbb9f5efdfcc75d34a8764a09474fae7",
      "details": {
        "parent_model": "",
        "format": "gguf",
        "family": "qwen3",
        "families": [
          "qwen3"
        ],
        "parameter_size": "4.0B",
        "quantization_level": "Q4_K_M"
      },
      "expires_at": "2026-10-16T18:44:13.1480597-07:00",
      "size_vram": 3180247121,
      "context_length": 4096,
      "runner": "llamacpp"
    }
  ]
}
```

## 结论边界

这是 16 条固定输入的条件提取冒烟测试。prompt 包含公园和机场映射；输出受 schema 约束。不是独立留出集，不足以证明通用准确率或安全性。
未验证真实工具调用、路线算法接入、道路事实、来源引用、多 agent、多轮对话、并发或生产部署。首请求包含加载，后续延迟也会受缓存与输入长度影响。

完整输入、标签、原始模型回答、耗时、prompt hash 与模型元信息见 `results/report.json`。
