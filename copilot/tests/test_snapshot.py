"""数据快照校验（nps_copilot/snapshot.py，计划书 §4、GOALS P6）：现在的资料能过；故意弄坏的每一种都能拦下、说清楚是哪一处"""
import json
import shutil

import pytest

from nps_copilot import snapshot


def test_current_snapshot_passes():
    counts = snapshot.check()
    assert counts["parks"] >= 70 and counts["airports"] >= 100 and counts["attractions"] >= 900 and counts["knowledge"] >= 1900


@pytest.fixture
def copy(tmp_path):
    contracts, data = tmp_path / "contracts", tmp_path / "data"
    shutil.copytree(snapshot.CONTRACTS, contracts)
    shutil.copytree(snapshot.DATA, data)
    return contracts, data


def rewrite(path, change):
    rows = json.loads(path.read_text(encoding="utf-8"))
    change(rows)
    path.write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")


def problems(contracts, data):
    with pytest.raises(snapshot.SnapshotError) as error:
        snapshot.check(contracts, data)
    return error.value.problems


def test_renamed_field_is_caught(copy):
    """网站那边把 nameZh 改了名：原来要等聊天时 KeyError，现在启动时就说哪一条、哪个字段"""
    contracts, data = copy
    rewrite(contracts / "parks.json", lambda rows: rows[0].update(nameZhHans=rows[0].pop("nameZh")))
    assert problems(contracts, data) == ["parks.json 第 1 条（yose）nameZh：Field required"]


def test_bad_values_are_caught(copy):
    contracts, data = copy

    def breaks(rows):
        rows[0]["timeZone"] = "America/Yosemite"
        rows[1]["airports"].append("XXX")
        rows[2]["nearby"].append("zzzz")
        rows[3]["kind"] = "forest"

    rewrite(contracts / "parks.json", breaks)
    rewrite(contracts / "airports.json", lambda rows: rows[0].update(lat=137.6))
    found = "\n".join(problems(contracts, data))
    assert "timeZone：Value error, 不是有效的时区：America/Yosemite" in found
    assert "常用机场 XXX 不在机场表里" in found and "顺路的公园 zzzz 不存在" in found
    assert "kind：Input should be 'park' or 'site'" in found
    assert "airports.json 第 1 条（SFO）lat" in found


def test_cross_references_are_caught(copy):
    contracts, data = copy
    rewrite(contracts / "attractions.json", lambda rows: rows.extend([{**rows[0]}, {**rows[0], "id": "zion-x", "park": "yose"}]))
    lines = (contracts / "knowledge.jsonl").read_text(encoding="utf-8").splitlines()
    first = json.loads(lines[0])
    lines.append(json.dumps({**first, "id": "orphan", "park": "abcd"}, ensure_ascii=False))
    (contracts / "knowledge.jsonl").write_text("\n".join(lines) + "\n", encoding="utf-8")
    found = problems(contracts, data)
    assert "attractions.json：yose-tunnel-view 重复" in found
    assert "attractions.json zion-x：id 要以所在公园 yose- 开头" in found
    assert "knowledge.jsonl orphan：公园 abcd 不存在" in found


def test_one_bad_park_does_not_cascade(copy):
    """一座公园自己哪个字段不对，只报那一处，不连带报它的几十个景点、资料都“公园不存在”"""
    contracts, data = copy
    rewrite(contracts / "parks.json", lambda rows: rows[0].update(country="MX"))
    assert len(problems(contracts, data)) == 1


def test_server_checks_on_startup_and_reports_counts():
    """serve 启动时就验（api.py 在导入时调 snapshot.check()，坏数据直接抛错、起不来，Docker 冒烟测试会拦住），/health 报每份几条"""
    pytest.importorskip("fastapi")
    from nps_copilot import api

    assert api.SNAPSHOT == snapshot.check()
    assert api.health()["snapshot"] == api.SNAPSHOT
