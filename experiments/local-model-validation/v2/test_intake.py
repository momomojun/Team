import copy
import json
from pathlib import Path
import unittest

from intake import evidence_differences, normalize, shape_valid

ROOT = Path(__file__).resolve().parent


def compare(actual, expected):
    return {k: (v, actual.get(k)) for k, v in expected.items()
            if (sorted(actual.get(k, [])) != sorted(v) if isinstance(v, list) else actual.get(k) != v)}


def fixtures():
    baseline = json.loads((ROOT.parent / "results/report.json").read_text(encoding="utf-8"))
    annotations = json.loads((ROOT / "regression-raw.json").read_text(encoding="utf-8"))
    return [dict(id=c["id"], input=c["input"], expected=c["expected"], raw=annotations[c["id"]]) for c in baseline["cases"]] + json.loads((ROOT / "heldout.json").read_text(encoding="utf-8"))


class IntakeRulesTest(unittest.TestCase):
    def test_gold_extraction_produces_expected_decision(self):
        for case in fixtures():
            with self.subTest(case=case["id"]):
                out = normalize(case["raw"], case["input"])
                self.assertEqual(out["evidence_errors"], [])
                self.assertEqual(compare(out["result"], case["expected"]), {})

    def test_invented_date_is_rejected_not_completed(self):
        case = fixtures()[1]
        raw = copy.deepcopy(case["raw"])
        raw["dates"] = ["2027年10月1日"]
        out = normalize(raw, case["input"])
        self.assertIsNone(out["result"]["start_date"])
        self.assertIn("invalid_evidence", out["result"]["conflicts"])
        self.assertEqual(out["result"]["status"], "needs_clarification")

    def test_model_omission_is_not_silently_repaired(self):
        case = fixtures()[0]
        raw = copy.deepcopy(case["raw"])
        raw["seniors"] = None
        out = normalize(raw, case["input"])
        self.assertIsNone(out["result"]["seniors"])
        self.assertIn("seniors", evidence_differences(raw, case["raw"]))

    def test_two_unrelated_dates_are_not_assumed_range(self):
        text = "2028年6月1日或者2028年6月8日，从盐湖城去黄石三天。"
        raw = dict(parks=["黄石"], dates=["2028年6月1日", "2028年6月8日"], duration="三天", origin="盐湖城", pace=None, seniors=None)
        out = normalize(raw, text)
        self.assertIn("ambiguous_dates", out["result"]["conflicts"])
        self.assertIsNone(out["result"]["start_date"])

    def test_split_range_quotes_and_leap_year(self):
        text = "2028年2月28日至2028年3月1日，从盐湖城去黄石。"
        raw = dict(parks=["黄石"], dates=["2028年2月28日", "2028年3月1日"], duration=None, origin="盐湖城", pace=None, seniors=None)
        self.assertEqual(normalize(raw, text)["result"]["days"], 3)

    def test_out_of_range_duration_cannot_be_ready(self):
        text = "2028年6月1日从盐湖城去黄石，玩20天。"
        raw = dict(parks=["黄石"], dates=["2028年6月1日"], duration="20天", origin="盐湖城", pace=None, seniors=None)
        out = normalize(raw, text)["result"]
        self.assertIn("days_out_of_range", out["conflicts"])
        self.assertEqual(out["status"], "needs_clarification")

    def test_invalid_shape_rejected(self):
        self.assertFalse(shape_valid({"parks": ["黄石"]}))
        raw = copy.deepcopy(fixtures()[0]["raw"])
        raw["origin"] = ""
        self.assertFalse(shape_valid(raw))

    def test_unknown_origin_requires_clarification(self):
        text = "2028年6月1日从上海去黄石三天。"
        raw = dict(parks=["黄石"], dates=["2028年6月1日"], duration="三天", origin="上海", pace=None, seniors=None)
        out = normalize(raw, text)["result"]
        self.assertIn("unparsed_origin", out["conflicts"])
        self.assertIn("origin", out["missing_fields"])


if __name__ == "__main__":
    unittest.main()
