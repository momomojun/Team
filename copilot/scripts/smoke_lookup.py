"""镜像里的查询工具冒烟测试：网站的 8 种查询（找资料在 Python 里，不用 node）各跑一次，都要有结果、不能出错。
在容器里跑：docker exec <容器> python copilot/scripts/smoke_lookup.py

为什么要它（11-20）：查询工具加了季节打分以后，引到了只在网站里有的 npm 包（server-only），
镜像里没装 npm 包，所有查询都报错；原来的冒烟测试只排行程（plan_trip），没拦住。"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from nps_copilot import tools  # noqa: E402

REQUESTS = [
    {"tool": "is_open", "attraction": "yose-glacier-point", "date": "2026-11-20"},
    {"tool": "drive_time", "from": "yose-stay-valley-lodge", "to": "yose-glacier-point"},
    {"tool": "search", "parks": ["arch"], "limit": 3},
    {"tool": "season_rank", "today": "2026-11-20", "month": 11},
    {"tool": "fees", "park": "zion"},
    {"tool": "sun_times", "attraction": "yose-glacier-point", "date": "2026-11-20"},
    {"tool": "booking", "park": "zion", "date": "2026-12-05"},
    {"tool": "crowd", "park": "yell"},
]

try:
    results = tools.call(REQUESTS)
except Exception as error:  # node 起不来（缺包、语法错）
    sys.exit(f"查询工具冒烟测试没过：{error}")
problems = [f"{request['tool']}: {result.get('error') if isinstance(result, dict) else result!r}"
            for request, result in zip(REQUESTS, results) if not isinstance(result, dict) or result.get("error")]
if len(results) != len(REQUESTS):
    problems.append(f"只返回了 {len(results)} / {len(REQUESTS)} 条")
if problems:
    sys.exit("查询工具冒烟测试没过：" + "；".join(problems))
print(f"查询工具冒烟测试通过：{len(REQUESTS)} 种查询都有结果")
