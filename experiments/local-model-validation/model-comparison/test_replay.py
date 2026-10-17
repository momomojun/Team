"""Offline checks: comparison evaluator must reproduce the preserved baseline scores."""
import json
from pathlib import Path
import unittest

import run as comparison

ROOT = Path(__file__).resolve().parent.parent


class ComparisonReplayTest(unittest.TestCase):
    def test_v2_preserved_outputs_reproduce_scores(self):
        report = json.loads((ROOT / "v2/runs/20261017T020042Z/report.json").read_text(encoding="utf-8"))
        count = 0
        for row in report["cases"]:
            if row["version"] != "v2":
                continue
            result = comparison.v2.normalize(row["model_output"], row["input"])
            diff = comparison.v2test.compare(result["result"], row["expected"])
            passed = not diff and not result["evidence_errors"]
            self.assertEqual(passed, row["passed"], row["id"])
            count += passed
        self.assertEqual(count, 28)

    def test_v3_preserved_outputs_reproduce_states(self):
        report = json.loads((ROOT / "v3/runs/20261017T025427Z/report.json").read_text(encoding="utf-8"))
        for case in report["scenarios"]:
            session = comparison.v3.Conversation("2026-10-16", "America/Los_Angeles")
            for row in case["turns"]:
                def extract(_):
                    return row["trace"]["model_output"]
                response, trace = session.step(row["user"], extract)
                self.assertEqual(response, row["response"], (case["id"], row["turn"]))

    def test_truncation_or_unexpected_thinking_rejected(self):
        with self.assertRaises(ValueError):
            comparison.content({"done_reason": "length", "message": {"content": "{}"}})
        with self.assertRaises(ValueError):
            comparison.content({"message": {"content": "{}", "thinking": "unexpected"}})


if __name__ == "__main__":
    unittest.main()
