import datetime as dt
import json
import os
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "copilot"))
# 评测、测试不用本机的 NPS 公告关闭清单（每天会变），结果才能复现
os.environ.setdefault("COPILOT_LIVE", "0")
# 测试里的调用（假的网络回复）不记进真的计费总账；测总账的测试自己换成临时目录
os.environ["COPILOT_LEDGER"] = "off"

from nps_copilot.intake import Intake  # noqa: E402
from nps_copilot.providers import ScriptedProvider  # noqa: E402

REFERENCE = dt.date(2026, 10, 16)


def extraction(**fields):
    """模型摘出的片段；没写的字段按“没提到”"""
    base = {"parks": [], "dates": [], "party": [], "preferences": [], "duration": None, "origin": None, "destination": None}
    base.update(fields)
    return base


@pytest.fixture
def make_intake():
    def build(*outputs, reference=REFERENCE):
        return Intake(ScriptedProvider(list(outputs)), reference)
    return build


@pytest.fixture(scope="session")
def request_schema():
    return json.loads((ROOT / "copilot" / "contracts" / "trip-request.v1.schema.json").read_text(encoding="utf-8"))
