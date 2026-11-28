"""镜像里的软要求检查冒烟测试：排一个行程，再用审查 agent 用的判分脚本（scripts/soft-check.mjs）检查两条要求，要有结果、不能出错。
在容器里跑：docker exec <容器> python copilot/scripts/smoke_team.py

为什么要它（11-27）：Dockerfile 没拷 soft-check.mjs，线上每次检查软要求都报错、被 TeamError 吞掉，
审查 agent 从 v0.7.0 起在线上一次都没跑过；原来的冒烟测试只排行程、查资料，没拦住。不调模型。"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from nps_copilot import team  # noqa: E402
from nps_copilot.plan_client import plan_trip  # noqa: E402

request = json.loads((ROOT / "contracts" / "examples" / "yose-4d-fat.json").read_text(encoding="utf-8"))
try:
    result = plan_trip(request, "2026-10-16").result
    checks = team.grade(result, [{"kind": "max_drive_per_day", "minutes": 600}, {"kind": "rest_days", "min": 1}])
except Exception as error:  # 脚本没拷进镜像、node 起不来
    sys.exit(f"软要求检查冒烟测试没过：{error}")
if len(checks) != 2 or not all(isinstance(check.get("ok"), bool) for check in checks):
    sys.exit(f"软要求检查冒烟测试没过：结果不对 {checks!r}")
print(f"软要求检查冒烟测试通过：{len(checks)} 条都判了（{[check['ok'] for check in checks]}）")
