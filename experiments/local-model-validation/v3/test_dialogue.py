import json
from pathlib import Path
import unittest

from dialogue import Conversation, empty_raw

ROOT = Path(__file__).resolve().parent


def scenarios():
    return json.loads((ROOT / "scenarios.json").read_text(encoding="utf-8"))


def at_path(value, path):
    for part in path.split("."):
        value = value[int(part)] if isinstance(value, list) else value[part]
    return value


def differences(response, expected):
    result = {}
    for path, wanted in expected.items():
        contains = path.endswith("_contains")
        actual_path = path[:-9] if contains else path
        try:
            got = at_path(response, actual_path)
            okay = wanted in got if contains else got == wanted
        except (KeyError, IndexError, TypeError):
            got, okay = "<missing>", False
        if not okay:
            result[path] = {"expected": wanted, "actual": got}
    return result


class DialogueRulesTest(unittest.TestCase):
    def test_all_gold_conversations(self):
        for case in scenarios():
            with self.subTest(case=case["id"]):
                session = Conversation()
                for index, turn in enumerate(case["turns"]):
                    supplied = {**empty_raw(), **turn.get("gold", {})}
                    response, trace = session.step(turn["user"], lambda _: supplied)
                    self.assertEqual(differences(response, turn["expected"]), {}, f"turn {index + 1}: {response}")

    def test_clock_is_injected_not_machine_date(self):
        session = Conversation(reference_date="2030-12-31")
        raw = dict(empty_raw(), dates=["1月1日"])
        response, _ = session.step("1月1日", lambda _: raw)
        self.assertEqual(response["question"]["proposed_date"], "2031-01-01")
        self.assertIsNone(response["state"]["start_date"])

    def test_unconfirmed_date_never_becomes_start_date(self):
        session = Conversation()
        response, _ = session.step("12月19日", lambda _: dict(empty_raw(), dates=["12月19日"]))
        self.assertIsNone(response["state"]["start_date"])
        response, _ = session.step("不是", lambda _: self.fail("No model needed for exact no"))
        self.assertIsNone(response["state"]["start_date"])

    def test_missing_year_not_confirmed_by_negative_year(self):
        session = Conversation()
        session.step("12月19日", lambda _: dict(empty_raw(), dates=["12月19日"]))
        response, _ = session.step("不是2026年", lambda _: empty_raw())
        self.assertIsNone(response["state"]["start_date"])

    def test_fake_evidence_cannot_make_ready(self):
        session = Conversation()
        response, _ = session.step("黄石三天", lambda _: dict(empty_raw(), parks=["黄石"], duration="三天", dates=["2027年5月12日"]))
        self.assertEqual(response["question"]["kind"], "evidence")
        self.assertIsNone(response["state"]["start_date"])

    def test_walking_does_not_imply_pace(self):
        session = Conversation()
        session.step("少走路", lambda _: dict(empty_raw(), preferences=["少走路"]))
        self.assertEqual(session.preferences["walking_load"], "low")
        self.assertIsNone(session.pace)


if __name__ == "__main__":
    unittest.main()
