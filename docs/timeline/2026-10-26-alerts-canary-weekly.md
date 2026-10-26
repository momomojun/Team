# 10-26：读公告的抽查改成每周一次、修好开关；issue 写实际读公告的模型（分支 `fix/alerts-canary-weekly`）

- 为什么改：查“网站能不能每天读公告更新”时发现两处不对。① 每晚抽查模型分数（读 26 条标好答案的旧公告）从 10-20 加上到现在一次都没跑过，日志里一直是 skipped；② 每天的 `nps-alerts` issue 写着“模型（Gemini）读了全文”，实际读的是 MiniMax。
- 抽查没跑的原因：条件 `vars.ALERTS_CANARY != '0'`，仓库没设这个变量时是空字符串，GitHub 的表达式比较时把 `''` 和 `'0'` 都转成数字 0，于是一直等于“关掉”。改成 `format('x{0}', vars.ALERTS_CANARY) != 'x0'`，按字符串比。
- 仓库主人选了每周跑一次（MiniMax 免费档一天约 50 次，每晚多 26 次会挤掉读新公告的额度）：定时触发的只在加州的星期一跑，手动触发照跑；`ALERTS_CANARY=0` 仍然能关。
- issue 里的模型名字：`alerts_report.py` 加 `--cache`（`extracted.json`），按这几条新公告各自记着的模型写，缓存里可能是前几晚别的模型读的；没给缓存就只写“模型读了全文”。
- 检查：`pytest` 全过（`test_nightly_report_shows_what_the_model_found` 改成断言写的是实际的模型）；工作流改动要等下一个星期一的定时触发、或者手动触发一次才能看到抽查真的跑了。
