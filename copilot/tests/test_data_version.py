"""数据版本（nps_copilot/data_version.py）：内容变了 hash 就变、换行不同不变；写进每轮日志、/health、统计分组"""
import datetime as dt
import json
import re

import pytest

from nps_copilot import data_version, monitor
from nps_copilot.pipeline import Session
from nps_copilot.providers import ScriptedProvider


def test_current_has_short_id_and_three_parts():
    version = data_version.current()
    assert re.fullmatch(r"[0-9a-f]{12}", version["id"])
    assert set(version["parts"]) == {"site", "contracts", "names"}
    assert all(re.fullmatch(r"[0-9a-f]{12}", value) for value in version["parts"].values())
    # 合成的 id 由三份完整 hash 算出来，同一份数据每次一样
    assert data_version.combine({name: data_version.digest(path) for name, path in data_version.PARTS.items()}) == version["id"]


def test_digest_ignores_line_endings_but_not_content(tmp_path):
    lf, crlf = tmp_path / "lf", tmp_path / "crlf"
    for folder, text in ((lf, "a\nb\n"), (crlf, "a\r\nb\r\n")):
        (folder / "sub").mkdir(parents=True)
        (folder / "sub" / "x.ts").write_bytes(text.encode())
    # Windows 签出是 CRLF、镜像里是 LF：算出来要一样，不然 CI 的冒烟测试会说镜像里的数据不对
    assert data_version.digest(lf) == data_version.digest(crlf)
    before = data_version.digest(lf)
    (lf / "sub" / "x.ts").write_bytes(b"a\nc\n")
    assert data_version.digest(lf) != before
    # 改文件名、加文件也算变了
    (lf / "sub" / "x.ts").rename(lf / "sub" / "y.ts")
    renamed = data_version.digest(lf)
    assert renamed not in (before, data_version.digest(crlf))
    (lf / "__pycache__").mkdir()
    (lf / "__pycache__" / "z.pyc").write_bytes(b"cache")
    assert data_version.digest(lf) == renamed  # 缓存文件不算
    assert data_version.digest(tmp_path / "missing") is None


def test_alerts_snapshot(tmp_path):
    path = tmp_path / "closures.json"
    path.write_text(json.dumps({"fetched": "2026-11-20", "closures": [{"id": 1}, {"id": 2}]}), encoding="utf-8")
    snap = data_version.alerts_snapshot(path)
    assert snap["fetched"] == "2026-11-20" and snap["closures"] == 2 and len(snap["hash"]) == 12
    path.write_text(json.dumps({"fetched": "2026-11-21", "closures": []}), encoding="utf-8")
    assert data_version.alerts_snapshot(path)["hash"] != snap["hash"]
    assert data_version.alerts_snapshot(None) is None
    assert data_version.alerts_snapshot(tmp_path / "missing.json") is None


def test_image_tag_has_commit_prompts_and_data():
    tag = data_version.image_tag("1b2c4dd9aa")
    assert re.fullmatch(r"sha-1b2c4dd-p[0-9a-f]{8}-d[0-9a-f]{12}", tag)
    assert tag.endswith(data_version.current()["id"])


def test_every_turn_logs_the_data_version(monkeypatch):
    session = Session(ScriptedProvider([]), reference_date="2026-10-16")
    turn = session.begin("你好")
    assert turn["trace"]["data"] == data_version.current()["id"]
    assert "build" not in turn["trace"]  # 本机跑没有提交号
    monkeypatch.setenv("COPILOT_BUILD_SHA", "1b2c4dd")
    assert session.begin("再来")["trace"]["build"] == "1b2c4dd"


def test_stats_split_by_data_version(tmp_path):
    today = dt.date.today().isoformat()
    base = {"version": "copilot/0.6.0", "prompts": {"intake/v1": "x"}, "status": "planned", "latency_ms": 1000, "intake": {}}
    rows = [{**base, "session": "a"}, {**base, "session": "b", "data": "aaaaaaaaaaaa"}, {**base, "session": "c", "data": "bbbbbbbbbbbb"}]
    (tmp_path / f"{today}.jsonl").write_text("\n".join(json.dumps(row) for row in rows) + "\n", encoding="utf-8")
    keys = sorted(monitor.summarize(monitor.load(7, tmp_path)))
    # 11-22 以前的日志没有数据版本，照旧按版本和提示词分；有的再按数据分开
    assert keys == ["copilot/0.6.0 · intake/v1", "copilot/0.6.0 · intake/v1 · data aaaaaaaaaaaa", "copilot/0.6.0 · intake/v1 · data bbbbbbbbbbbb"]


def test_health_reports_data_version(monkeypatch):
    pytest.importorskip("fastapi")
    from nps_copilot import api

    monkeypatch.setenv("COPILOT_PROVIDER", "scripted")
    health = api.health()
    assert health["data"] == data_version.current()
