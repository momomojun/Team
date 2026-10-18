"""Writer：把 plan_trip 的结果写成给用户看的说明。

两种写法：
- template（默认、也是兜底）：按模板逐条写，只用结果里的事实，保证不编造；
- model：让模型把要点写得更自然。写完用 faithful() 检查：说明里出现的时间、数字、景点名都必须在结果或模板里出现过，
  有一条对不上就丢掉模型写的、用模板（记在 trace 里，评测时统计“编造率”）。
"""
from __future__ import annotations

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
}
WARNINGS_EN = {
    "tempClosed": "temporarily closed that day", "maybeClosed": "may still be temporarily closed", "afterHours": "arrives after hours or last entry",
    "missDeparture": "misses the last departure", "noService": "doesn't run that day", "lastShuttle": "may miss the last shuttle",
    "farTransfer": "a very long drive", "missSunset": "misses sunset", "offTime": "outside its best time", "dark": "ends after dark",
    "parkingFull": "the lot is likely full by then", "overloaded": "this day is packed", "lateReturn": "late return to lodging",
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
    names = [table[code].name_zh if zh else table[code].name_en for code in request["parks"]]
    days = result["days"]
    lines: list[str] = []
    first = days[0]["date"]
    when = first if days[0].get("dateIsExact") else first[:7]
    pace = (PACE_ZH if zh else PACE_EN)[request.get("pace", "normal")]
    if zh:
        lines.append(f"{'、'.join(names)} {len(days)} 天，从 {when} 开始，节奏{pace}。")
    else:
        lines.append(f"{len(days)} days in {', '.join(names)} starting {when}, at a {pace} pace.")
    for day in days:
        stops = day["stops"]
        if zh:
            head = f"第 {day['day']} 天（{day['date']}）："
            body = "、".join(f"{stop['start']} {stop['nameZh']}" + (f"（当地 {stop['localStart']}）" if stop.get("localStart") else "") for stop in stops) or "路上 / 休息"
            lodging = f"；晚上住 {day['lodging']['nameZh']}" if day.get("lodging") else ""
        else:
            head = f"Day {day['day']} ({day['date']}): "
            body = ", ".join(f"{stop['start']} {stop['nameEn']}" + (f" ({stop['localStart']} local)" if stop.get("localStart") else "") for stop in stops) or "travel / rest"
            lodging = f"; overnight at {day['lodging']['nameEn']}" if day.get("lodging") else ""
        lines.append(head + body + lodging)
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
        text = "；".join(f"{item['nameZh']}（{reasons[item['reason']]}）" for item in sample) if zh else \
            "; ".join(f"{item['nameEn']} ({reasons[item['reason']]})" for item in sample)
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
