"""NPS 公告关闭清单的“只读新的”和“聊天时现读”（10-19 仓库主人定的：每晚在 GitHub 上读、聊天时也补一道）。

- 读过的公告记在缓存里（按公告 id + 更新时间 + 提示词版本），同一条没改过就不再交给模型，每晚只读新出现、改过的几条；
  模型出错（额度用完、服务忙）的那条这次按规则算、不进缓存，下次再试
- 读公告用哪个模型：COPILOT_ALERTS_PROVIDER（gemini / openai / openrouter / groq / ollama / rules）；没设时按
  providers.alerts_chain 的顺序（MiniMax 推理开 high → GPT-4.1 mini → Gemini）再加本机，没配 key 的跳过；COPILOT_ALERTS_MODEL 换型号
- 聊天时（plan_client 调行程引擎之前）：两周内出发、要去的公园今天还没读过公告，就当场只抓这几座公园的公告读一遍，
  合进关闭清单（每座公园记下哪天读的，src/lib/copilot/live.ts 按要去的公园看新不新）
"""
from __future__ import annotations

import datetime as dt
import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

from . import prompts
from .alerts import combined, extract, rules_extract
from .providers import (GeminiProvider, GroqProvider, OllamaProvider, OpenAIProvider, OpenRouterProvider, Provider, ProviderChain, ProviderError,
                        alerts_chain, secret)

DATA = Path(__file__).resolve().parents[1] / "data" / "alerts"
CLOSURES = DATA / "closures-latest.json"
CACHE = DATA / "extracted.json"
CONTRACTS = Path(__file__).resolve().parents[1] / "contracts"
LIVE_DAYS = 14  # 和 src/lib/alert-match.ts 的 LIVE_ALERT_DAYS 一样
USER_AGENT = "NPS-Guide-Copilot (+https://github.com/momomojun/Team)"


def alerts_provider() -> Provider | None:
    """读公告用的模型；None 表示只用规则"""
    kind = os.environ.get("COPILOT_ALERTS_PROVIDER")
    if not kind:
        # 没指定：MiniMax（推理开 high）→ GPT-4.1 mini → Gemini → 本机，没配 key 的跳过；一次读一批，按免费档放慢
        chain = alerts_chain()
        return ProviderChain([*chain, OllamaProvider()]) if chain else OllamaProvider()
    model = os.environ.get("COPILOT_ALERTS_MODEL")
    if kind == "rules":
        return None
    if kind == "gemini":
        return GeminiProvider(**({"model": model} if model else {}))
    if kind == "openai":
        return OpenAIProvider(**({"model": model} if model else {}))
    if kind == "openrouter":
        return OpenRouterProvider(**({"model": model} if model else {}))
    if kind == "groq":
        return GroqProvider(**({"model": model} if model else {}))
    if kind == "ollama":
        return OllamaProvider(**({"model": model} if model else {}))
    raise ProviderError(f"不认识的 COPILOT_ALERTS_PROVIDER：{kind}（gemini / openai / openrouter / groq / ollama / rules）")


def status() -> dict:
    """后台看的：关闭清单是哪天的、几条（几条是代码也确认了的）、各公园最旧的是哪天；读过的公告缓存了几条"""
    out: dict = {"closures_file": CLOSURES.exists(), "cache_entries": 0}
    if CLOSURES.exists():
        data = json.loads(CLOSURES.read_text(encoding="utf-8"))
        closures = data.get("closures", [])
        parks = data.get("parks") or {}
        out.update({
            "fetched": data.get("fetched"), "closures": len(closures),
            "strict": sum(1 for item in closures if item.get("strict")),
            "model_only": sum(1 for item in closures if item.get("found_by") == ["model"]),
            "parks": len(parks), "oldest_park": min(parks.values()) if parks else None,
            "prompts": data.get("prompts", {}).get("alerts"),
        })
    if CACHE.exists():
        out["cache_entries"] = len(json.loads(CACHE.read_text(encoding="utf-8")))
    return out


def _cache_key(alert: dict) -> str:
    return f"{alert['id']}|{alert.get('updated') or ''}|{prompts.current().get('alerts', '')}"


def read_alerts(alerts: list[dict], provider: Provider | None, reference: dt.date, cache: dict) -> tuple[list[dict], dict]:
    """一批公告 → 关闭清单里的条目；缓存里有的直接用。返回（条目, 统计：新读了几条、用了缓存几条、按规则算的几条）"""
    stats = {"read": 0, "cached": 0, "rules_only": 0}
    closures = []
    for alert in alerts:
        key = _cache_key(alert)
        entry = cache.get(key)
        if entry is not None:
            stats["cached"] += 1
        else:
            rules = rules_extract(alert)
            model = extract(alert, provider, reference) if provider is not None else None
            if model is None or "error" in model.trace:
                # 没有模型，或者这次模型出错：按规则算，不进缓存，下次再让模型读
                stats["rules_only"] += 1
                entry = {"type": rules.type, "closed": rules.closed if rules.type == "full" else [], "strict": rules.closed if rules.type == "full" else [],
                         "from": None, "reopen": None, "evidence": "", "found_by": ["rules"] if rules.type == "full" and rules.closed else []}
            else:
                stats["read"] += 1
                result = combined(model, rules)
                entry = {"type": result.type, "closed": result.closed, "strict": result.trace.get("strict", []), "from": result.start,
                         "reopen": result.reopen, "evidence": result.evidence, "found_by": result.trace.get("found_by", []),
                         "model": model.trace.get("model")}
                cache[key] = entry
        if entry["type"] == "full" and entry["closed"]:
            closures.append({"alert": alert["id"], "park": alert["park"], "attractions": entry["closed"], "from": entry["from"],
                             "reopen": entry["reopen"], "evidence": entry["evidence"], "found_by": entry["found_by"],
                             "strict": entry["strict"], "title": alert["title"], "url": alert.get("url")})
    return closures, stats


def load_json(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return default


def save_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=1), encoding="utf-8")


def closures_file(snapshot: dict, provider: Provider | None, cache_path: Path = CACHE) -> tuple[dict, dict]:
    """整份公告快照 → 关闭清单（每晚、命令行用）；读过的记进缓存文件"""
    cache = load_json(cache_path, {})
    reference = dt.date.fromisoformat(snapshot["fetched"])
    closures, stats = read_alerts(snapshot["alerts"], provider, reference, cache)
    # 快照里已经没有的公告，缓存里也去掉（免得越积越大）
    live = {_cache_key(alert) for alert in snapshot["alerts"]}
    save_json(cache_path, {key: value for key, value in cache.items() if key in live})
    covered = sorted({alert["park"] for alert in snapshot["alerts"]} | set(nps_codes()) - set(snapshot.get("failed") or []))
    out = {"fetched": snapshot["fetched"], "prompts": prompts.current(), "parks": {code: snapshot["fetched"] for code in covered},
           "closures": closures}
    return out, stats


def nps_codes() -> dict[str, str]:
    """网站的公园代码 → 查 NPS 公告用的代码（加拿大的公园、大多数园外名胜没有）"""
    table = json.loads((CONTRACTS / "parks.json").read_text(encoding="utf-8"))
    return {park["code"]: park["nps"] for park in table if park.get("nps")}


def fetch_alerts(parks: list[str], timeout: float = 20.0) -> list[dict]:
    """抓这几座公园现在的 NPS 公告（和 scripts/fetch-alerts.mjs 一样的格式）；key 用 DATA_GOV_API_KEY，没有就 DEMO_KEY"""
    try:
        key = secret("DATA_GOV_API_KEY")
    except ProviderError:
        key = "DEMO_KEY"
    codes = {code: nps for code, nps in nps_codes().items() if code in parks}
    if not codes:
        return []
    query = ",".join(sorted(set(codes.values())))
    request = urllib.request.Request(f"https://developer.nps.gov/api/v1/alerts?parkCode={query}&limit=500",
                                     headers={"X-Api-Key": key, "User-Agent": USER_AGENT})
    for wait in (0, 3, 10):
        time.sleep(wait)
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                data = json.loads(response.read().decode("utf-8"))
            break
        except urllib.error.HTTPError as error:
            if error.code != 429 and error.code < 500:
                raise ProviderError(f"NPS 公告接口出错（{error.code}）") from error
        except OSError:
            pass
    else:
        raise ProviderError("NPS 公告接口连不上或一直限流")
    alerts = []
    for item in data.get("data", []):
        for code, nps in codes.items():
            if nps == item.get("parkCode"):
                alerts.append({"id": item["id"], "park": code, "category": item.get("category"), "title": (item.get("title") or "").strip(),
                               "description": (item.get("description") or "").strip(), "url": item.get("url"), "updated": item.get("lastIndexedDate")})
    return alerts


def refresh_for(request: dict, reference_date: str, path: Path = CLOSURES, cache_path: Path = CACHE) -> dict:
    """聊天时：两周内出发、要去的公园今天还没读过公告，就当场抓这几座公园的公告读一遍，合进关闭清单。
    出错（没网、接口限流、模型出错）就用原来的清单，不影响排行程。返回发生了什么（写进 trace）"""
    start = request.get("startDate")
    if not start:
        return {"refreshed": False, "why": "month-only"}
    today = dt.date.fromisoformat(reference_date)
    if dt.date.fromisoformat(start) > today + dt.timedelta(days=LIVE_DAYS):
        return {"refreshed": False, "why": "too-far"}
    current = load_json(path, {"fetched": reference_date, "parks": {}, "closures": []})
    stale = [code for code in request.get("parks", []) if code in nps_codes() and (current.get("parks") or {}).get(code) != reference_date]
    if not stale:
        return {"refreshed": False, "why": "fresh"}
    try:
        alerts = fetch_alerts(stale)
        cache = load_json(cache_path, {})
        closures, stats = read_alerts(alerts, alerts_provider(), today, cache)
    except ProviderError as error:
        return {"refreshed": False, "why": "error", "error": str(error)[:200]}
    save_json(cache_path, cache)
    kept = [c for c in current.get("closures", []) if c.get("park") not in stale]
    parks = dict(current.get("parks") or {})
    if "parks" not in current:
        # 旧格式（只有一个 fetched）：清单里原来的公园都按那天算
        parks.update({code: current.get("fetched") for code in nps_codes()})
    parks.update({code: reference_date for code in stale})
    save_json(path, {"fetched": max(current.get("fetched") or reference_date, reference_date) if current.get("closures") else reference_date,
                     "prompts": prompts.current(), "parks": parks, "closures": kept + closures})
    return {"refreshed": True, "parks": stale, "alerts": len(alerts), **stats}
