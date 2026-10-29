# 10-28：多写测试——held-out v2 70 组、规则层逐条测试 216 个（分支 `feature/deepseek`）

- 为什么做：仓库主人说“测试案例过少，不够扎实，靠谱”（O90）。
- held-out v2（`copilot/eval/cases/holdout-v2.jsonl`，70 组）：约四成故意刁难（不存在的和过去的日期、注入、不是排行程的话、否定、打错字、有好几个机场的城市、离得太远、超过 14 天），其余是东部和海外新加的公园、相对日期、几晚、最慢一档节奏、露营和民宿、同行的人、多轮改条件。先提交期望和冻结记录（`holdout-v2.manifest.json`），再用本机 Qwen3.5 4B 第一次跑：61/70。没过的 9 组都是规则漏了，改了以后回放 70/70，`baseline-holdout-v2.json` 当第八组门禁（`ci.yml`、`release.yml`）。
- 改的规则（`intake.py`、`dates.py`、`data/airport_cities_en.json`）：18 个机场补英文城市名；认不出的公园片段是机场城市就当出发地；模型漏了出发地、原话里只有一个机场就补；同一个月里的日期范围（“June 3-7 2027”“6月3日到7日”）；写明年份、已经过去的日期要再问；“kids aged 6 and 9”；节奏的说法在同行的人那格里也算。
- 规则层逐条测试（`copilot/tests/test_rules.py`，216 个，不调模型）：写的时候又修了“不错/nice/now/November 被当成否定”“最后一个选不到”“18岁的儿子还问几岁”“3-7 天当成 7 天”。
- 检查：Copilot `pytest` 439 个全过，八组回放门禁全过（其他七组分数没变），网站 `npm test` 202 个全过。成绩写在 RESULTS.md 最后一节。
