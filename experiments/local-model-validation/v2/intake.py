"""Evidence validation and deterministic intake rules; no model or network calls."""
import calendar
import datetime as dt
import re

FIELDS = ("parks", "dates", "duration", "origin", "pace", "seniors")
SCHEMA = {"type": "object", "additionalProperties": False, "properties": {
    key: ({"type": "array", "maxItems": 8, "items": {"type": "string", "minLength": 1, "maxLength": 96}}
          if key in ("parks", "dates") else {"type": ["string", "null"], "minLength": 1, "maxLength": 96})
    for key in FIELDS}, "required": list(FIELDS)}
PARKS = {"yell": ("黄石", "Yellowstone"), "grte": ("大提顿", "Grand Teton"), "yose": ("优胜美地", "Yosemite")}
ORIGINS = {"SLC": ("盐湖城", "Salt Lake City", "SLC"), "BZN": ("博兹曼", "Bozeman", "BZN"), "FAT": ("弗雷斯诺", "Fresno", "FAT")}
MONTHS = {name.lower(): i for i, name in enumerate(calendar.month_name) if name}
MONTH_RE = "|".join(MONTHS)
DATE_RE = re.compile(r"(?P<iso>\d{4}-\d{1,2}-\d{1,2})|(?P<zh>\d{4}年\s*\d{1,2}月\s*\d{1,2}[日号])|(?P<en>(?:" + MONTH_RE + r")\s+\d{1,2},?\s+\d{4})", re.I)
NUMBERS = {"一": 1, "二": 2, "两": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10,
           **dict(zip("one two three four five six seven eight nine ten eleven twelve thirteen fourteen".split(), range(1, 15)))}


def shape_valid(raw):
    if not isinstance(raw, dict) or set(raw) != set(FIELDS):
        return False
    for key, value in raw.items():
        if key in ("parks", "dates"):
            if not isinstance(value, list) or len(value) > 8:
                return False
            values = value
        else:
            values = [] if value is None else [value]
        if any(not isinstance(v, str) or not 1 <= len(v) <= 96 for v in values):
            return False
    return True


def literal_evidence(raw, user):
    """Require exact source substrings. This is grounding, not an entailment proof."""
    cleaned, issues = {}, []
    for key in FIELDS:
        value = raw[key]
        values = value if isinstance(value, list) else ([] if value is None else [value])
        kept = []
        for span in values:
            if span in user:
                kept.append(span)
            else:
                issues.append({"field": key, "reason": "not_in_input", "span": span})
        cleaned[key] = kept if key in ("parks", "dates") else (kept[0] if kept else None)
    return cleaned, issues


def aliases_in(text, table):
    result = []
    for code, aliases in table.items():
        if any(re.search(re.escape(a) if not a.isascii() else r"(?<![A-Za-z])" + re.escape(a) + r"(?![A-Za-z])", text, re.I) for a in aliases):
            result.append(code)
    return result


def park_codes(spans):
    result, unknown = [], []
    for span in spans:
        codes = aliases_in(span, PARKS)
        result.extend(codes)
        residual = span
        for aliases in PARKS.values():
            for alias in aliases:
                residual = re.sub(re.escape(alias), "", residual, flags=re.I)
        residual = re.sub(r"national parks?|国家公园|公园|\band\b|\bplus\b|[和与及加、，,\s]", "", residual, flags=re.I)
        if residual:
            unknown.append(span)
    return list(dict.fromkeys(result)), unknown


def parse_day_count(text):
    if text is None:
        return None
    pattern = r"(\d+|[一二两三四五六七八九十]+|" + "|".join(sorted((k for k in NUMBERS if k.isascii()), key=len, reverse=True)) + r")\s*(?:天|days?\b)"
    matches = re.findall(pattern, text, flags=re.I)
    if len(matches) != 1:
        return None
    token = matches[0].lower()
    if token.isdecimal():
        return int(token)
    if token in NUMBERS:
        return NUMBERS[token]
    if "十" in token:
        left, right = token.split("十", 1)
        return (NUMBERS.get(left, 1) * 10) + NUMBERS.get(right, 0)
    return None


def parse_dates(spans, user):
    parsed, errors, positions = [], [], []
    for span in spans:
        offset = user.find(span)
        for match in DATE_RE.finditer(span):
            text = match.group()
            try:
                if match.group("en"):
                    parts = re.match(r"([A-Za-z]+)\s+(\d+),?\s+(\d+)", text)
                    date = dt.date(int(parts[3]), MONTHS[parts[1].lower()], int(parts[2]))
                else:
                    year, month, day = map(int, re.findall(r"\d+", text))
                    date = dt.date(year, month, day)
                if date not in parsed:
                    parsed.append(date)
                    positions.append((offset + match.start(), offset + match.end()))
            except (ValueError, TypeError):
                errors.append("invalid_date")
    if errors:
        return None, None, list(dict.fromkeys(errors))
    if not parsed:
        return None, None, []
    if len(parsed) == 1:
        return parsed[0].isoformat(), None, []
    if len(parsed) != 2:
        return None, None, ["ambiguous_dates"]
    connector = user[positions[0][1]:positions[1][0]]
    if not re.search(r"至|到|[—–~～]|\bto\b|\bthrough\b|\s-\s", connector, flags=re.I):
        return None, None, ["ambiguous_dates"]
    if parsed[1] < parsed[0]:
        return None, None, ["date_order"]
    return parsed[0].isoformat(), (parsed[1] - parsed[0]).days + 1, []


def normalize(raw, user):
    """Never re-scan user text to repair omitted model fields using an oracle."""
    if not shape_valid(raw):
        return {"result": None, "evidence_errors": [{"reason": "invalid_shape"}], "cleaned": None}
    cleaned, evidence_errors = literal_evidence(raw, user)
    parks, unknown_parks = park_codes(cleaned["parks"])
    date, range_days, conflicts = parse_dates(cleaned["dates"], user)
    stated_days = parse_day_count(cleaned["duration"])
    days = stated_days if stated_days is not None else range_days
    if stated_days is not None and range_days is not None and stated_days != range_days:
        days = None
        conflicts.append("duration_conflict")
    if days is not None and not 1 <= days <= 14:
        days = None
        conflicts.append("days_out_of_range")
    origin_codes = aliases_in(cleaned["origin"] or "", ORIGINS)
    origin = origin_codes[0] if len(origin_codes) == 1 else None
    if len(origin_codes) > 1:
        conflicts.append("ambiguous_origin")
    pace_text = cleaned["pace"] or ""
    pace = None
    for code, pattern in (("relaxed", r"轻松|不要太累|\brelaxed\b"), ("normal", r"普通|\bnormal\b"), ("packed", r"紧凑|\bpacked\b")):
        if re.search(pattern, pace_text, re.I):
            if pace is not None:
                conflicts.append("ambiguous_pace")
            pace = code
    seniors = None
    senior_text = cleaned["seniors"] or ""
    if re.search(r"老人|\belderly\b|\bseniors?\b", senior_text, re.I):
        seniors = not bool(re.search(r"没有|不带|无老人|\bno\b|\bwithout\b", senior_text, re.I))
    if evidence_errors:
        conflicts.append("invalid_evidence")
    # Unknown non-empty optional phrases require clarification instead of silently disappearing.
    for field, value in (("duration", stated_days), ("origin", origin), ("pace", pace), ("seniors", seniors)):
        if cleaned[field] is not None and value is None:
            conflicts.append("unparsed_" + field)
    missing = []
    for field, value in (("parks", parks), ("start_date", date), ("days", days), ("origin", origin)):
        if not value and not (field == "days" and "duration_conflict" in conflicts):
            missing.append(field)
    status = "unsupported" if unknown_parks else ("needs_clarification" if missing or conflicts else "ready")
    result = dict(parks=parks, start_date=date, days=days, origin=origin, pace=pace, seniors=seniors,
                  status=status, missing_fields=missing, conflicts=list(dict.fromkeys(conflicts)))
    return {"result": result, "cleaned": cleaned, "evidence_errors": evidence_errors, "unsupported_parks": unknown_parks}


def evidence_differences(actual, gold):
    """Annotation coverage, allowing slightly wider verbatim quotes; not semantic accuracy."""
    differences = {}
    for field in FIELDS:
        wanted = gold[field]
        got = actual.get(field)
        wanted = wanted if isinstance(wanted, list) else ([] if wanted is None else [wanted])
        got = got if isinstance(got, list) else ([] if got is None else [got])
        if field == "dates":
            wanted = [part for span in wanted for part in ([m.group() for m in DATE_RE.finditer(span)] or [span])]
        correct = (all(any(anchor in quote for quote in got) for anchor in wanted)
                   and all(any(anchor in quote for anchor in wanted) for quote in got))
        if not correct:
            differences[field] = {"expected_anchors": wanted, "actual_quotes": got}
    return differences
