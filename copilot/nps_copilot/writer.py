"""Writer：把 plan_trip 的结果写成给用户看的说明。

两种写法：
- template（默认、也是兜底）：按模板逐条写，只用结果里的事实，保证不编造；
- model：让模型把要点写得更自然。写完用 faithful() 检查：说明里出现的时间、数字、景点名都必须在结果或模板里出现过，
  有一条对不上就丢掉模型写的、用模板（记在 trace 里，评测时统计“编造率”）。
"""
from __future__ import annotations

import calendar

import re

from . import catalog, prompts
from .critic import Critique
from .providers import Provider, ProviderError

WRITER_SCHEMA = {
    "type": "object", "additionalProperties": False, "required": ["summary"],
    "properties": {"summary": {"type": "string", "minLength": 1, "maxLength": 1200}},
}

WARNINGS_ZH = {
    "tempClosed": "这天临时关闭", "maybeClosed": "可能还在临时关闭", "afterHours": "按这个时间已经过了开放或入场时间",
    "missDeparture": "赶不上最后一班", "noService": "这天不开", "lastShuttle": "可能赶不上末班班车",
    "farTransfer": "这一段车程太长", "missSunset": "赶不上日落", "offTime": "不在它的最佳时段", "dark": "结束时天已经黑了",
    "parkingFull": "到的时候停车场多半已经满了", "overloaded": "这天安排得太满", "lateReturn": "回住处太晚",
    "familySerious": "对同行的婴儿或老人风险高、很累，请务必慎重考虑（看这个景点的说明）",
}
WARNINGS_EN = {
    "tempClosed": "temporarily closed that day", "maybeClosed": "may still be temporarily closed", "afterHours": "arrives after hours or last entry",
    "missDeparture": "misses the last departure", "noService": "doesn't run that day", "lastShuttle": "may miss the last shuttle",
    "farTransfer": "a very long drive", "missSunset": "misses sunset", "offTime": "outside its best time", "dark": "ends after dark",
    "parkingFull": "the lot is likely full by then", "overloaded": "this day is packed", "lateReturn": "late return to lodging",
    "familySerious": "risky or very strenuous for the baby or seniors in your group, please think very carefully (see the stop's notes)",
}
SKIP_ZH = {"permit": "要抽签的许可证", "closed": "这几天不开放", "tooHard": "太难或太长", "noTime": "排不下",
           "tooFar": "离其他景点太远", "across": "季节性山路封着、要绕很远", "unsuitable": "不适合同行的人"}
SKIP_EN = {"permit": "lottery permit required", "closed": "closed on these dates", "tooHard": "too strenuous or long", "noTime": "no room",
           "tooFar": "too far from everything else", "across": "seasonal road closed, long detour", "unsuitable": "not suitable for your group"}
PACE_ZH = {"relaxed": "轻松", "normal": "适中", "packed": "多看一些"}
PACE_EN = {"relaxed": "relaxed", "normal": "balanced", "packed": "packed"}


def template(request: dict, result: dict, critique: Critique, language: str, preferences: dict | None = None) -> str:
    zh = language != "en"
    table = catalog.parks()
    days = result["days"]
    # 公园按行程里先去的排（以前按请求的顺序，第一天其实在第二座公园，看着乱）
    order = list(dict.fromkeys([stop["park"] for day in days for stop in day["stops"] if stop.get("park") in table] + list(request["parks"])))
    names = [table[code].name_zh if zh else table[code].name_en for code in order]
    multi = len(request["parks"]) > 1
    lines: list[str] = []
    first = days[0]["date"]
    when = first if days[0].get("dateIsExact") else first[:7]
    pace = (PACE_ZH if zh else PACE_EN)[request.get("pace", "normal")]
    if zh:
        lines.append(f"{'、'.join(names)} {len(days)} 天，从 {when} 开始，节奏{pace}。")
    else:
        lines.append(f"{len(days)} days in {', '.join(names)} starting {when}, at a {pace} pace.")
    origin = place_name(request.get("origin"), zh)
    previous = origin
    for day in days:
        stops = day["stops"]
        lodging = day.get("lodging")
        endpoint = bool(lodging) and lodging.get("kind") == "endpoint"
        # 早上几点从哪出发、开多久到第一站；晚上住哪；最后一天是开回机场（不是“住机场”）
        drive = stops[0]["driveMin"] if stops else 0
        leave = ""
        if day.get("departAt") and previous:
            leave = f"{day['departAt']} 从{spaced(previous)}出发" if zh else f"leave {previous} at {day['departAt']}"
            if drive >= 45:
                leave += f"（开车{duration(drive, zh)}）" if zh else f" ({duration(drive, zh)} drive)"
            leave += " → "
        # 几座公园的行程：每天写上在哪座（仓库主人 10-18：“我不知道哪一天是哪一个国家公园的”）
        where = ""
        if multi:
            here = list(dict.fromkeys(stop["park"] for stop in stops if stop.get("park") in table))
            where = ("，" if zh else ", ") + ("、" if zh else " & ").join(table[c].name_zh if zh else table[c].name_en for c in here) if here else ""
        if zh:
            head = f"第 {day['day']} 天（{day['date']}{where}）："
            body = "、".join(f"{stop['start']} {stop['nameZh']}" + (f"（当地 {stop['localStart']}）" if stop.get("localStart") else "") for stop in stops) or "路上 / 休息"
            if endpoint:
                end = f"；最后开回{spaced(lodging['nameZh'])}"
                if day.get("returnAt"):
                    end += f"，开车{duration(day.get('returnDriveMin', 0), zh)}，{day['returnAt']} 到"
            else:
                end = f"；晚上住{spaced(lodging['nameZh'])}" if lodging else ""
        else:
            head = f"Day {day['day']} ({day['date']}{where}): "
            body = ", ".join(f"{stop['start']} {stop['nameEn']}" + (f" ({stop['localStart']} local)" if stop.get("localStart") else "") for stop in stops) or "travel / rest"
            if endpoint:
                name = place_name(request.get("destination") or request.get("origin"), zh)
                end = f"; drive back to {name}"
                if day.get("returnAt"):
                    end += f" ({duration(day.get('returnDriveMin', 0), zh)}, arriving {day['returnAt']})"
            else:
                end = f"; overnight at {lodging['nameEn']}" if lodging else ""
        lines.append(head + leave + body + end)
        if lodging and not endpoint:
            previous = lodging["nameZh"] if zh else lodging["nameEn"]
    lines.extend(long_drive_notes(request, days, origin, zh))
    if request.get("lodgingPref") == "rental":
        links = [(day["day"], day["lodging"]) for day in days if day.get("lodging") and day["lodging"].get("airbnbUrl")]
        if links:
            lines.append("找民宿（Airbnb，已经填好日期）：" if zh else "Vacation rentals on Airbnb (dates filled in):")
            for night, place in links:
                lines.append(f"- 第 {night} 晚 {place['nameZh']}：{place['airbnbUrl']}" if zh else f"- Night {night}, {place['nameEn']}: {place['airbnbUrl']}")
    hard = critique.hard
    if hard:
        lines.append("要注意：" if zh else "Heads-up:")
        for finding in hard[:8]:
            label = (WARNINGS_ZH if zh else WARNINGS_EN).get(finding.code, finding.code)
            who = (finding.name_zh if zh else finding.name_en) or ""
            lines.append(f"- {'第' if zh else 'Day '}{finding.day}{' 天' if zh else ''} {who} {label}".replace("  ", " "))
    skipped = result.get("skipped", [])
    if skipped:
        reasons = SKIP_ZH if zh else SKIP_EN
        sample = skipped[:6]
        text = "；".join(f"{item['nameZh']}（{skip_reason(item, zh)}）" for item in sample) if zh else \
            "; ".join(f"{item['nameEn']} ({skip_reason(item, zh)})" for item in sample)
        more = f" 等 {len(skipped)} 处" if zh and len(skipped) > len(sample) else (f" and {len(skipped) - len(sample)} more" if len(skipped) > len(sample) else "")
        lines.append(("没排进去的：" if zh else "Not included: ") + text + more)
    if critique.reason == "relaxed_pace":
        lines.append("原来的节奏有几天太满，我改成了轻松再排了一次。" if zh else "Some days were too full at the default pace, so I re-planned at a relaxed pace.")
    if preferences:
        lines.append("你说的“" + "”“".join(preferences.values()) + "”已经记下，这一版还不能单独按这些排，看行程时可以留意。" if zh else
                     "I noted “" + "”, “".join(preferences.values()) + "”, but this version can't plan around those yet.")
    for note in result.get("assumptions", []):
        if note.startswith("drive-times") and "直线" in note:
            lines.append("出发地不是常用机场，车程是按直线距离估的。" if zh else "Your starting point isn't a common airport, so drive times are straight-line estimates.")
    return "\n".join(lines)


def spaced(name: str) -> str:
    """中文句子里夹英文名字时两边补空格（“从 El Portal 出发”），中文名字原样"""
    if not name:
        return name
    left = " " if name[0].isascii() and name[0].isalnum() else ""
    right = " " if name[-1].isascii() and name[-1].isalnum() else ""
    return f"{left}{name}{right}"


def describe_changes(before: dict, after: dict, zh: bool) -> list[str]:
    """用户改了条件以后先说改了什么（“住宿改成民宿”），再给新的行程"""
    items: list[str] = []
    table = catalog.parks()

    def park_names(request: dict) -> str:
        return ("、" if zh else ", ").join(table[code].name_zh if zh else table[code].name_en for code in request["parks"])

    if before.get("parks") != after.get("parks"):
        items.append(f"公园改成{park_names(after)}" if zh else f"parks: {park_names(after)}")
    if (before.get("startDate"), before.get("month")) != (after.get("startDate"), after.get("month")):
        when = after.get("startDate") or (f"{after.get('month')} 月" if zh else calendar.month_name[after.get("month") or 1])
        items.append(f"出发日期改成 {when}" if zh else f"start: {when}")
    if before.get("days") != after.get("days"):
        items.append(f"天数改成 {after['days']} 天" if zh else f"{after['days']} days")
    if before.get("origin") != after.get("origin"):
        items.append(f"出发地改成{place_name(after.get('origin'), zh)}" if zh else f"starting from {place_name(after.get('origin'), zh)}")
    if before.get("destination") != after.get("destination"):
        items.append(f"回程改成{place_name(after.get('destination') or after.get('origin'), zh)}" if zh else
                     f"returning via {place_name(after.get('destination') or after.get('origin'), zh)}")
    if before.get("pace") != after.get("pace"):
        items.append(f"节奏改成{PACE_ZH[after['pace']]}" if zh else f"{PACE_EN[after['pace']]} pace")
    if before.get("lodgingPref") != after.get("lodgingPref"):
        pref = after.get("lodgingPref", "any")
        items.append({"rental": "住宿改成民宿", "hotel": "住宿改成酒店", "any": "住宿不限"}[pref] if zh else
                     {"rental": "vacation rentals", "hotel": "hotels only", "any": "any lodging"}[pref])
    if before.get("party") != after.get("party"):
        items.append("同行的人更新了" if zh else "updated who's coming")
    # 用户加减的景点、指定的住处
    from .knowledge import get

    def name(doc_id: str) -> str:
        doc = get(doc_id)
        return (doc.title if zh else doc.names[-1]) if doc else doc_id

    for doc_id in [i for i in after.get("include", []) if i not in before.get("include", [])]:
        items.append(f"一定去{spaced(name(doc_id))}" if zh else f"must see {name(doc_id)}")
    for doc_id in [i for i in after.get("exclude", []) if i not in before.get("exclude", [])]:
        items.append(f"不去{spaced(name(doc_id))}" if zh else f"skip {name(doc_id)}")
    old_nights = {n["night"]: n["id"] for n in before.get("lodging", [])}
    for night in after.get("lodging", []):
        if old_nights.get(night["night"]) != night["id"]:
            items.append(f"第 {night['night']} 晚住{spaced(name(night['id']))}" if zh else f"night {night['night']} at {name(night['id'])}")
    return items


def lodging_changes(before: dict, after: dict, zh: bool) -> list[str]:
    """哪几晚换了住处：“第 1 晚：阿瓦尼酒店 → El Portal”"""
    changes = []
    for old, new in zip(before.get("days", []), after.get("days", [])):
        a, b = old.get("lodging"), new.get("lodging")
        if a and b and a.get("id") != b.get("id") and b.get("kind") != "endpoint":
            changes.append(f"第 {new['day']} 晚：{a['nameZh']} → {b['nameZh']}" if zh else f"Night {new['day']}: {a['nameEn']} → {b['nameEn']}")
    return changes


def duration(minutes: int, zh: bool) -> str:
    """“约 6 小时”“约 2 小时 30 分”“约 40 分钟”：按 10 分钟取整，别给人精确到分钟的错觉"""
    minutes = int(round(minutes / 10) * 10) if minutes >= 60 else int(round(minutes / 5) * 5)
    hours, rest = divmod(minutes, 60)
    if zh:
        if hours == 0:
            return f"约 {rest} 分钟"
        return f"约 {hours} 小时" + (f" {rest} 分" if rest else "")
    if hours == 0:
        return f"about {rest} min"
    return f"about {hours} h" + (f" {rest} min" if rest else "")


def place_name(place: dict | None, zh: bool) -> str:
    """出发地、回程地：机场写名字和三字码，任意地点写它的名字"""
    if not place:
        return ""
    code = place.get("airport")
    if code:
        airport = catalog.airports().get(code)
        if zh:
            return f"{airport.name_zh}（{code}）" if airport else code
        city = catalog.english_city(code)
        return f"{city} ({code})" if city else code
    return place.get("name", "")


def long_drive_notes(request: dict, days: list[dict], origin: str, zh: bool) -> list[str]:
    """从出发地开到第一站超过 4 小时：说清楚第一天几点才开始玩，列出去这座公园近一些的常用机场"""
    first = next((day["stops"][0] for day in days if day["stops"]), None)
    if not first or first["driveMin"] < 240 or not origin:
        return []
    park = catalog.parks()[request["parks"][0]]
    chosen = (request.get("origin") or {}).get("airport")
    closer = sorted((minutes, code) for code, minutes in park.airport_minutes if code != chosen and minutes < first["driveMin"] - 60)[:3]
    if zh:
        note = f"从{spaced(origin)}到第一站开车{duration(first['driveMin'], zh)}，第一天 {first['start']} 才开始玩。"
        if closer:
            note += f"去{park.name_zh}近一些的机场：" + "、".join(f"{place_name({'airport': code}, zh)}{duration(minutes, zh)}" for minutes, code in closer) + "。"
        return [note]
    note = f"It's {duration(first['driveMin'], zh)} from {origin} to the first stop, so day 1 starts at {first['start']}."
    if closer:
        note += f" Closer airports for {park.name_en}: " + ", ".join(f"{place_name({'airport': code}, zh)} {duration(minutes, zh)}" for minutes, code in closer) + "."
    return [note]


def skip_reason(item: dict, zh: bool) -> str:
    """没排进去的原因；季节性的说清楚一年里什么时候才有（“火瀑只在 2 月中下旬……出现”），别说得像过几天就开"""
    reason = item["reason"]
    if reason == "closed" and zh and item.get("noteZh") and "月" in item["noteZh"]:
        return item["noteZh"]
    months = item.get("openMonths")
    if reason == "closed" and months:
        span = month_span(months, zh)
        return f"只在 {span}开放" if zh else f"only in {span}"
    return (SKIP_ZH if zh else SKIP_EN)[reason]


def month_span(months: list[int], zh: bool) -> str:
    months = sorted(months)
    contiguous = months == list(range(months[0], months[-1] + 1))
    if zh:
        return f"{months[0]}–{months[-1]} 月" if contiguous and len(months) > 1 else "、".join(f"{m} 月" for m in months)
    names = [calendar.month_name[m] for m in months]
    return f"{names[0]}–{names[-1]}" if contiguous and len(months) > 1 else ", ".join(names)


def facts(result: dict) -> set[str]:
    """结果里能写进说明的事实：时间、日期、天数、景点和住处的名字、公园名"""
    found: set[str] = set()
    table = catalog.parks()
    for code in result["request"]["parks"]:
        found.update({table[code].name_zh, table[code].name_en})
    for day in result["days"]:
        found.update({day["date"], str(day["day"]), day.get("sunrise") or "", day.get("sunset") or "", day.get("departAt") or "", day.get("returnAt") or ""})
        found.update({str(day["driveMin"]), str(day["activeMin"])})
        if day.get("lodging"):
            found.update({day["lodging"]["nameZh"], day["lodging"]["nameEn"]})
        for stop in day["stops"]:
            found.update({stop["start"], stop["end"], stop.get("localStart") or "", stop["nameZh"], stop["nameEn"]})
    for item in result.get("skipped", []):
        found.update({item["nameZh"], item["nameEn"]})
    found.add(str(len(result["days"])))
    return {item for item in found if item}


TIME_RE = re.compile(r"\b\d{1,2}:\d{2}\b")
NUMBER_RE = re.compile(r"(?<![\d:])\d+(?![\d:])")


def faithful(text: str, result: dict, reference_text: str) -> list[str]:
    """说明里的时间和数字都要在结果或模板里出现过；返回对不上的（空列表 = 没发现编造）"""
    allowed = facts(result)
    allowed_text = "\n".join(allowed) + "\n" + reference_text
    problems = []
    for clock in TIME_RE.findall(text):
        normalized = clock.zfill(5)
        if normalized not in allowed and clock not in allowed_text:
            problems.append(clock)
    for number in NUMBER_RE.findall(TIME_RE.sub(" ", text)):
        if number not in allowed_text:
            problems.append(number)
    return sorted(set(problems))


def write(request: dict, result: dict, critique: Critique, language: str, provider: Provider | None,
          preferences: dict | None = None, use_model: bool = False) -> tuple[str, dict]:
    base = template(request, result, critique, language, preferences)
    trace: dict = {"writer": "template", "prompt": None}
    if not use_model or provider is None:
        return base, trace
    prompt = prompts.load("writer")
    trace.update(writer="model", prompt=prompt.id)
    try:
        completion = provider.complete_json("writer", prompt.text, base, WRITER_SCHEMA)
    except ProviderError as error:
        trace.update(writer="template", fallback="provider_error", error=str(error))
        return base, trace
    text = completion.data.get("summary", "")
    problems = faithful(text, result, base)
    trace.update(model=completion.model, latency_ms=completion.latency_ms, unsupported=problems, draft=text)
    if problems or not text.strip():
        trace.update(writer="template", fallback="unfaithful" if problems else "empty")
        return base, trace
    return text, trace
