"""A local dialogue prototype: model extracts quotes, code owns state and questions."""
import copy
import datetime as dt
import importlib.util
from pathlib import Path
import re

_spec = importlib.util.spec_from_file_location("frozen_v2_intake", Path(__file__).resolve().parent.parent / "v2/intake.py")
base = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(base)
FIELDS = ("parks", "dates", "duration", "origin", "seniors", "preferences")
SCHEMA = {"type": "object", "additionalProperties": False, "properties": {
    key: ({"type": "array", "maxItems": 12, "items": {"type": "string", "minLength": 1, "maxLength": 96}}
          if key in ("parks", "dates", "preferences") else {"type": ["string", "null"], "minLength": 1, "maxLength": 96})
    for key in FIELDS}, "required": list(FIELDS)}
PACE_OPTIONS = [
    {"id": "1", "label": "轻松玩", "description": "每天少安排一些，多留休息和临时调整时间。"},
    {"id": "2", "label": "适中", "description": "覆盖主要景点，也留一些休息时间。"},
    {"id": "3", "label": "多看一些", "description": "希望安排更多景点；能否早起、走路多少会另外考虑。"},
    {"id": "4", "label": "还没想好", "description": "先暂按适中给草案，之后可以调整。"},
]
WELCOME = "告诉我想去哪里、什么时候出发、玩几天。没想好也没关系；可以说少走路、愿意早起或不想总换酒店，不必使用固定术语。"


def empty_raw():
    return {key: ([] if key in ("parks", "dates", "preferences") else None) for key in FIELDS}


def valid_raw(raw):
    if not isinstance(raw, dict) or set(raw) != set(FIELDS):
        return False
    for key, value in raw.items():
        is_list = key in ("parks", "dates", "preferences")
        if is_list and (not isinstance(value, list) or len(value) > 12):
            return False
        values = value if is_list else ([] if value is None else [value])
        if any(not isinstance(v, str) or not 1 <= len(v) <= 96 for v in values):
            return False
    return True


def yes(text):
    return bool(re.fullmatch(r"\s*(是|是的|对|对的|没错|确认|yes|y|correct)[。.!！\s]*", text, flags=re.I))


def month_day(spans):
    found = []
    for span in spans:
        match = re.search(r"(?<!\d)(\d{1,2})月\s*(\d{1,2})[日号]", span)
        if match:
            found.append((int(match[1]), int(match[2])))
            continue
        match = re.search(r"\b(" + base.MONTH_RE + r")\s+(\d{1,2})(?!\d)", span, re.I)
        if match:
            found.append((base.MONTHS[match[1].lower()], int(match[2])))
    return found[0] if len(set(found)) == 1 else None


class Conversation:
    def __init__(self, reference_date="2026-10-16", timezone="America/Los_Angeles"):
        # Explicit client date; never read the execution machine's date for decisions.
        self.reference = dt.date.fromisoformat(reference_date)
        self.timezone = timezone
        self.history = []
        self.raw = empty_raw()
        self.intent = "future_trip"
        self.confirmed_date = None
        self.date_source = None
        self.pending = None
        self.pace = None
        self.pace_source = None
        self.preferences = dict(walking_load=None, drive_pace=None, early_start=None, lodging_changes=None)
        self.evidence_errors = {}

    def _preferences(self, spans):
        for text in spans:
            if re.search(r"不想早起|不要早起|不愿意早起|don't want to start early", text, re.I):
                self.preferences["early_start"] = False
            elif re.search(r"愿意早起|不介意早起|可以早起|early start", text, re.I):
                self.preferences["early_start"] = True
            if re.search(r"少走路|不想走太多|less walking|不想徒步", text, re.I):
                self.preferences["walking_load"] = "low"
            if re.search(r"不赶路|不要赶路|unhurried", text, re.I):
                self.preferences["drive_pace"] = "unhurried"
            if re.search(r"不想每天换酒店|少换酒店|不想总换酒店|fewer hotel changes", text, re.I):
                self.preferences["lodging_changes"] = "minimize"
            pace = None
            if re.search(r"轻松|不要太累|不想太累|别安排太满|别排太满|少安排|\brelaxed\b", text, re.I):
                pace = "relaxed"
            elif re.search(r"适中|普通|\bnormal\b|\bmoderate\b", text, re.I):
                pace = "normal"
            elif re.search(r"多看一些|多看几个地方|紧凑|\bpacked\b", text, re.I):
                pace = "packed"
            if pace is not None:
                self.pace, self.pace_source = pace, "user_statement"

    def _bind_year(self, text):
        if not self.pending or self.pending["kind"] != "confirm_year":
            return False, False, None
        pending = self.pending
        stripped = text.strip(" 。.!！")
        if stripped in ("不是", "不对", "no", "不确定"):
            return True, True, "请告诉我你指的年份，例如 2027年；我不会替你确认。"
        year = None
        if yes(text):
            year = dt.date.fromisoformat(pending["proposed_date"]).year
        elif re.search(r"不是|不对|不要", text):
            return False, False, None
        else:
            explicit = re.findall(r"(?<!\d)(\d{4})年", text)
            if len(explicit) == 1 and not re.search(r"\d月|\d日|\d号", text):
                year = int(explicit[0])
            elif "今年" in text:
                year = self.reference.year
            elif "明年" in text:
                year = self.reference.year + 1
        if year is None:
            return False, False, None
        try:
            date = dt.date(year, *pending["month_day"])
        except ValueError:
            return True, True, f"{year}年不存在这个月日，请确认另一个年份或完整日期。"
        self.confirmed_date, self.date_source = date.isoformat(), "user_confirmation"
        self.pending = None
        pure = yes(text) or bool(re.fullmatch(r"(?:\d{4}年|今年|明年)", stripped))
        return True, pure, None

    def step(self, user, extractor):
        self.history.append(user)
        if re.search(r"回顾|已经去过|过去的行程", user):
            self.intent = "review"
        handled, pure, year_error = self._bind_year(user)
        if year_error:
            question = copy.deepcopy(self.pending)
            question["text"] = year_error
            return self._render(forced_question=question), {"route": "year_reply", "model_called": False}
        if handled and pure:
            return self._render(), {"route": "year_reply", "model_called": False}
        if self.pending and self.pending["kind"] == "pace":
            choice = user.strip(" 。.!！")
            mapping = {"1": "relaxed", "轻松玩": "relaxed", "2": "normal", "适中": "normal", "3": "packed", "多看一些": "packed", "4": "default", "还没想好": "default"}
            if choice in mapping:
                selected = mapping[choice]
                self.pace = "normal" if selected == "default" else selected
                self.pace_source = "assumed_default" if selected == "default" else "user_choice"
                self.pending = None
                return self._render(), {"route": "pace_choice", "model_called": False}
        raw = extractor(user)
        trace = {"route": "extraction", "model_called": True, "model_output": raw}
        if not valid_raw(raw):
            self.evidence_errors["shape"] = "模型返回结构不合法"
            return self._render(), trace
        cleaned = empty_raw()
        for field, value in raw.items():
            values = value if isinstance(value, list) else ([] if value is None else [value])
            accepted = [span for span in values if span in user]
            if len(accepted) != len(values):
                self.evidence_errors[field] = "提取片段不在当前用户原话中"
            elif accepted:
                self.evidence_errors.pop(field, None)
            cleaned[field] = accepted if isinstance(value, list) else (accepted[0] if accepted else None)
        for field in ("parks", "duration", "origin", "seniors"):
            if cleaned[field]:
                self.raw[field] = cleaned[field]
        if cleaned["dates"]:
            # A year-only answer bound to a pending month/day must not erase it.
            if not handled:
                self.raw["dates"] = cleaned["dates"]
                self.confirmed_date, self.date_source, self.pending = None, None, None
        self.raw["preferences"].extend(cleaned["preferences"])
        self._preferences(cleaned["preferences"])
        trace["cleaned"] = cleaned
        return self._render(), trace

    def _candidate(self):
        md = month_day(self.raw["dates"])
        if not md:
            return None
        direction = -1 if self.intent == "review" else 1
        for offset in range(9):
            try:
                date = dt.date(self.reference.year + direction * offset, *md)
            except ValueError:
                continue
            if (self.intent == "review" and date <= self.reference) or (self.intent != "review" and date >= self.reference):
                if self.intent == "review":
                    text = f"你是在回顾{date.year}年{md[0]}月{md[1]}日的行程，对吗？"
                elif date.year == self.reference.year:
                    text = f"你指的是今年，也就是{date.year}年{md[0]}月{md[1]}日出发，对吗？"
                else:
                    try:
                        dt.date(self.reference.year, *md)
                        reason = f"今年的{md[0]}月{md[1]}日已经过去"
                    except ValueError:
                        reason = "今年没有这个日期"
                    text = f"{reason}，下一个有效日期是{date.year}年{md[0]}月{md[1]}日，你指的是这一天吗？"
                return {"kind": "confirm_year", "text": text, "proposed_date": date.isoformat(), "month_day": list(md)}
        return None

    def _render(self, forced_question=None):
        old_raw = {k: self.raw[k] for k in ("parks", "dates", "duration", "origin", "seniors")}
        old_raw["pace"] = None
        normalized = base.normalize(old_raw, "\n".join(self.history))
        state = normalized["result"]
        if self.confirmed_date:
            state["start_date"] = self.confirmed_date
            state["missing_fields"] = [x for x in state["missing_fields"] if x != "start_date"]
        elif state["start_date"]:
            self.date_source = "user_statement"
        state.update(pace=self.pace, pace_source=self.pace_source, date_source=self.date_source,
                     preferences=copy.deepcopy(self.preferences), reference_date=self.reference.isoformat(), timezone=self.timezone, intent=self.intent)
        question = forced_question
        notice = "暂按适中节奏生成草案，这是未确认的默认假设，之后可以调整。" if self.pace_source == "assumed_default" else ""
        if question is None and self.evidence_errors:
            question = {"kind": "evidence", "text": "部分条件无法从你的原话确认，请重新说明：" + "、".join(self.evidence_errors)}
        if question is None and state["start_date"] is None and not normalized["unsupported_parks"]:
            question = self._candidate() if "invalid_date" not in state["conflicts"] else None
        if question is None and normalized["unsupported_parks"]:
            state["status"] = "unsupported"
        elif question is None and state["conflicts"]:
            question = {"kind": "conflict", "text": "需要确认这些条件：" + "、".join(state["conflicts"])}
        elif question is None and state["missing_fields"]:
            field = state["missing_fields"][0]
            texts = {"parks": "你想去哪些公园？", "start_date": "具体哪一天出发？请提供完整日期。", "days": "这次一共玩几天？", "origin": "从哪个城市或机场出发？"}
            question = {"kind": "date" if field == "start_date" else field, "text": texts[field]}
        elif question is None and self.pace is None and self.intent != "review":
            question = {"kind": "pace", "text": "这次更想怎么玩？可以选一个，也可以直接描述；还没想好可以先看适中草案。", "options": copy.deepcopy(PACE_OPTIONS)}
        if question is not None:
            state["status"] = "needs_clarification"
        elif state["status"] != "unsupported":
            state["status"] = "review_ready" if self.intent == "review" else "draft_ready"
        self.pending = copy.deepcopy(question)
        return {"state": state, "status": state["status"], "question": question, "notice": notice}
