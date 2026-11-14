"""search agent 的评测题（eval/cases/agent-v1.jsonl）本身没写错：工具名、参数里的景点和住处 id、标准答案里的公园名都对得上网站的数据。
不调模型、不跑 agent，只检查题目"""
import datetime as dt
import json
from pathlib import Path

from nps_copilot import catalog, knowledge

CASES = Path(__file__).resolve().parents[1] / "eval" / "cases" / "agent-v1.jsonl"
TOOLS = {"search_knowledge", "is_open", "drive_time", "find_attractions", "season_rank"}
KINDS = {"single", "multi", "chain", "season", "mixed", "out_of_scope", "adversarial"}
EXPECT_KEYS = {"tools", "args", "min_calls", "max_calls", "facts", "relevant", "recommend", "not_recommend", "found",
               "needs_web", "forbid"}


def cases() -> list[dict]:
    return [json.loads(line) for line in CASES.read_text(encoding="utf-8").splitlines() if line.strip()]


def place_ids() -> set[str]:
    attractions = json.loads((CASES.parents[2] / "contracts" / "attractions.json").read_text(encoding="utf-8"))
    rows = attractions if isinstance(attractions, list) else attractions.get("attractions", [])
    docs = knowledge.index()[0]
    return {row["id"] for row in rows} | {doc.id for doc in docs if doc.type == "lodging"} | set(catalog.airports())


def test_ids_unique_and_fields_known():
    rows = cases()
    assert len(rows) >= 40
    assert len({row["id"] for row in rows}) == len(rows)
    for row in rows:
        assert row["kind"] in KINDS, row["id"]
        assert row["lang"] in ("zh", "en"), row["id"]
        dt.date.fromisoformat(row["reference"])
        assert set(row["expect"]) <= EXPECT_KEYS, (row["id"], set(row["expect"]) - EXPECT_KEYS)
        assert isinstance(row["expect"]["found"], bool), row["id"]
        assert all(code in catalog.parks() for code in row["parks"]), row["id"]


def test_tools_and_args_reference_real_things():
    places = place_ids()
    for row in cases():
        expect = row["expect"]
        for group in expect.get("tools", []):
            assert group and set(group) <= TOOLS, (row["id"], group)
        for tool, args in expect.get("args", {}).items():
            assert tool in TOOLS, row["id"]
            # 参数里要的工具，必须在“要调的工具”里
            assert any(tool in group for group in expect.get("tools", [])), (row["id"], tool)
            for key in ("attraction", "from", "to"):
                if key in args:
                    assert args[key] in places, (row["id"], args[key])
            if "date" in args:
                dt.date.fromisoformat(args["date"])
            for code in args.get("parks", []):
                assert code in catalog.parks(), (row["id"], code)
        for tool in {**expect.get("min_calls", {})}:
            assert tool in TOOLS, row["id"]


def test_answers_are_well_formed():
    for row in cases():
        expect = row["expect"]
        for group in expect.get("facts", []):
            # 每组是几种都算对的说法；判分时去掉空格再比，所以这里不能带空格
            assert group and all(isinstance(text, str) and text and " " not in text for text in group), (row["id"], group)
        for doc_id in expect.get("relevant", []):
            assert knowledge.get(doc_id) is not None, (row["id"], doc_id)
        if "recommend" in expect:
            names = expect["recommend"]["names"]
            assert 1 <= expect["recommend"]["min"] <= len(names), row["id"]
            # 推荐的和不该推荐的不能有重叠
            assert not set(names) & set(expect.get("not_recommend", [])), row["id"]
        if not expect["found"]:
            # 答不了的题不该要求一定调某个工具
            assert not expect.get("tools"), row["id"]


def test_park_names_in_answers_exist():
    """推荐、不推荐里的中文公园名都是网站上的公园（窗户区这类景点名在 recommend 里也可以出现，只查季节题）"""
    names = {park.name_zh for park in catalog.parks().values()}
    for row in cases():
        if row["kind"] != "season" or row["lang"] != "zh":
            continue
        expect = row["expect"]
        for name in [*expect.get("recommend", {}).get("names", []), *expect.get("not_recommend", [])]:
            assert name in names, (row["id"], name)
