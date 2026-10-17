"""Post-run exploratory CODE probes. No LLM calls, not part of frozen scores."""
import json
from pathlib import Path

from dialogue import Conversation, empty_raw

ROOT = Path(__file__).resolve().parent


def step(session, user, raw=None):
    response, trace = session.step(user, lambda _: {**empty_raw(), **(raw or {})})
    return dict(user=user, supplied_extraction=raw, response=response, trace=trace)


def main():
    probes = []
    session = Conversation()
    turns = [step(session, "12月19日从盐湖城去黄石三天，适中。", dict(parks=["黄石"], dates=["12月19日"], duration="三天", origin="盐湖城", preferences=["适中"]))]
    turns.append(step(session, "不是"))
    turns.append(step(session, "是的"))
    probes.append(dict(id="rejected_candidate_then_ambiguous_yes", expected="A rejected candidate must not be confirmed by an ambiguous yes to a request for an explicit year.",
                       passed=turns[-1]["response"]["state"]["start_date"] is None, turns=turns))
    session = Conversation()
    turns = [step(session, "2027年12月从博兹曼去黄石三天，适中。", dict(parks=["黄石"], dates=["2027年12月"], duration="三天", origin="博兹曼", preferences=["适中"]))]
    turns.append(step(session, "12月19日", dict(dates=["12月19日"])))
    response = turns[-1]["response"]
    probes.append(dict(id="retain_explicit_year_when_day_added", expected="Preserve explicitly supplied 2027; never propose 2026 after the user supplies the missing day.",
                       passed=response["state"]["start_date"] == "2027-12-19" or (response.get("question") or {}).get("proposed_date") == "2027-12-19", turns=turns))
    session = Conversation()
    turns = [step(session, "2027年6月18日从盐湖城去黄石五天。", dict(parks=["黄石"], dates=["2027年6月18日"], duration="五天", origin="盐湖城"))]
    turns.append(step(session, "我选第二种", dict(preferences=["第二种"])))
    probes.append(dict(id="natural_option_reference", expected="Resolve 第二种 against the displayed pace choices, and select normal.",
                       passed=turns[-1]["response"]["state"]["pace"] == "normal", turns=turns))
    report = dict(note="Exploratory code-only probes added after the frozen main run; supplied extraction is synthetic gold, not model output. Do not mix these with 18-scene/36-turn model scores.", probes=probes)
    (ROOT / "EXPLORATORY_PROBES.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({p["id"]: p["passed"] for p in probes}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
