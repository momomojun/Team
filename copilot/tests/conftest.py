import datetime as dt
import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "copilot"))

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
