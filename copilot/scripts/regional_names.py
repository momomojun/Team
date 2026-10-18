"""各地中文叫法：从维基数据和中文维基百科取公园、机场所在城市在大陆、香港、澳门、台湾、新加坡、马来西亚的叫法，写到
nps_copilot/data/regional_names.json，Intake 认公园和出发地时当别名用。

  python copilot/scripts/regional_names.py          # 联网，几十个请求，一分钟左右

为什么要它：繁简对照表只能一个字换一个字，“三藩市”（香港、新马）和“旧金山”是不同的词，换字换不出来。
来源和取法：
1. 公园：英文维基的条目名 → 维基数据 → 中文维基的条目；机场：IATA 代码 → 维基数据里的机场 → 它服务的城市（P931）→ 中文维基的条目
2. 中文维基每个条目按地区显示的标题（varianttitles：zh-cn、zh-hk、zh-mo、zh-tw、zh-sg、zh-my），这是维基百科编者维护的各地用词转换
3. 指向这个条目的重定向（卡加利、卡加立 → 卡尔加里）：常见的别名、旧译名大多在这里；去掉带括号、带英文、太短、和别的地方重名的
4. 人工补的写在 MANUAL（附说明）；人工排除的写在 EXCLUDE
维基百科的写法不一定是当地最常用的，所以这只是“认得出来”的别名表，回答用户时还是用网站自己的中文名。
"""
from __future__ import annotations

import datetime as dt
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTRACTS = ROOT / "copilot" / "contracts"
OUT = ROOT / "copilot" / "nps_copilot" / "data" / "regional_names.json"
UA = {"User-Agent": "NPSGuideCopilot/0.2 (CSYE 7374 course project; https://github.com/momomojun/Team)"}
VARIANTS = ["zh-cn", "zh-hk", "zh-mo", "zh-tw", "zh-sg", "zh-my"]

# 英文维基的条目名和 nameEn 对不上的
EN_TITLES = {
    "seki": "Sequoia National Park",
    "redw": "Redwood National and State Parks",
    "hsbd": "Horseshoe Bend (Arizona)",
    "wave": "The Wave (Arizona)",
    "ante": "Antelope Canyon",
    "mova": "Monument Valley",
}

# 一个代码对应两座公园的：两边的叫法都收
EN_TITLES_EXTRA = {"seki": "Kings Canyon National Park"}

# 维基数据里机场没写服务哪个城市（P931），或者写的不是用户会说的那个城市
AIRPORT_CITY_EN = {
    "RDM": "Bend, Oregon",
    "GJT": "Grand Junction, Colorado",
    "MAF": "Midland, Texas",
    "OAK": "Oakland, California",  # 维基数据写的是整个旧金山湾区，会和 SFO、SJC 混在一起
}
AIRPORT_CITY_OVERRIDE = {"OAK"}

# 维基百科里没有、但用户常这么说的（只收不会和别的地方混淆的）
MANUAL = {
    "airports": {
        "LAS": {"aliases": ["赌城"], "note": "拉斯维加斯的俗称，各地中文媒体都这么叫"},
        "JAC": {"aliases": ["傑克森", "傑克森霍爾", "杰克逊霍尔"], "note": "傑克森是台湾对 Jackson 的通行译法；维基百科这个镇的条目只有杰克逊、傑克遜"},
    },
    "parks": {},
}

# 重定向里不当别名用的：太泛、指的是别的东西，或者是条目内的一个小节
EXCLUDE = {
    "parks": {
        # 网站里“红杉”是红杉与国王峡谷（seki），红木才是 Redwood；中文维基把 Redwood 叫红杉国家公园，两边都认会认错
        "redw": {"红杉国家公园", "红杉", "紅杉國家公園", "紅杉"},
        "bibe": {"大班", "大灣", "大灣國家公園", "大转弯", "大轉彎"},  # 大班是香港话的“老板”，大湾、大转弯太泛
        "drto": {"海龟", "海龟国家公园"},
        "chis": {"聖塔喀魯茲島國家公園", "聖塔喀魯茲島"},  # 只是其中一个岛
        # 去掉“国家公园”以后只剩树名、地貌的：“想看巨杉”“看冰河”不一定是说这座公园（优胜美地也有巨杉，阿拉斯加到处是冰河）
        "seki": {"巨杉", "美洲杉", "世界爺"},
        "glac": {"冰河", "冰和", "冰山", "冰山国家公园"},  # 冰山是 iceberg
        "ever": {"沼泽地", "沼澤地", "大沼澤", "大沼地"},
        "pefo": {"化石森林"},
    },
    "airports": {
        # 拉斯维加斯条目的重定向里有很多城区名
        "LAS": {"東拉斯維加斯", "图勒斯普林斯", "拉斯維加斯市中心", "拉斯維加斯舊城區", "西拉斯維加斯", "萨默林西", "萨默林北",
                "图勒泉", "拉马德雷山麓", "市中心南", "努瓦夫凱夫", "百年山", "兰乔", "凯尔峡谷"},
        "SFO": {"金山", "金山市", "金門城", "金門城市", "灣邊之城"},
        "FAI": {"費爾明斯克"},
        "CLT": {"奎尔霍洛中学"},
        "SAT": {"山旦寸"},
        "MRY": {"網自李", "網地李"},
    },
}


def get(url: str, params: dict) -> dict:
    params = {**params, "format": "json"}
    request = urllib.request.Request(url + "?" + urllib.parse.urlencode(params), headers=UA)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return json.load(response)
        except OSError:
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)
    raise AssertionError


def chunks(items: list, size: int):
    for start in range(0, len(items), size):
        yield items[start:start + size]


def wikidata_from_enwiki(titles: dict[str, str]) -> dict[str, str]:
    """{代码: 英文条目名} → {代码: Q 号}。先在英文维基上跟着重定向走到正式条目，再取它的维基数据 Q 号
    （维基数据给一些重定向单独建了项目，比如 Great Sand Dunes National Park，直接查会拿到没有中文条目的那个）"""
    found = {}
    for batch in chunks(list(titles.items()), 50):
        data = get("https://en.wikipedia.org/w/api.php", {
            "action": "query", "titles": "|".join(title for _, title in batch), "redirects": 1,
            "prop": "pageprops", "ppprop": "wikibase_item",
        })
        query = data["query"]
        hops = {item["from"]: item["to"] for key in ("normalized", "redirects") for item in query.get(key, [])}
        qids = {page["title"]: page.get("pageprops", {}).get("wikibase_item") for page in query["pages"].values()}
        for code, title in batch:
            target = title
            while target in hops:
                target = hops[target]
            if qids.get(target):
                found[code] = qids[target]
            else:
                print(f"  英文维基没找到：{code} {title}")
    return found


def airport_cities(codes: list[str]) -> dict[str, str]:
    """IATA 代码 → 机场服务的城市的 Q 号（同一个机场写了几个城市的取第一个）"""
    values = " ".join(f'"{code}"' for code in codes)
    query = f"SELECT ?iata ?city WHERE {{ VALUES ?iata {{ {values} }} ?airport wdt:P238 ?iata; wdt:P931 ?city. }}"
    data = get("https://query.wikidata.org/sparql", {"query": query})
    result: dict[str, str] = {}
    for row in data["results"]["bindings"]:
        result.setdefault(row["iata"]["value"], row["city"]["value"].rsplit("/", 1)[1])
    return result


def zhwiki_titles(qids: list[str]) -> dict[str, str]:
    result = {}
    for batch in chunks(sorted(set(qids)), 50):
        data = get("https://www.wikidata.org/w/api.php", {"action": "wbgetentities", "ids": "|".join(batch), "props": "sitelinks", "sitefilter": "zhwiki"})
        for qid, entity in data["entities"].items():
            title = entity.get("sitelinks", {}).get("zhwiki", {}).get("title")
            if title:
                result[qid] = title
    return result


def zhwiki_pages(titles: list[str]) -> dict[str, dict]:
    """中文维基条目 → {"variants": {地区: 标题}, "redirects": [...]}"""
    pages = {}
    for batch in chunks(sorted(set(titles)), 20):
        params = {"action": "query", "titles": "|".join(batch), "prop": "info|redirects", "inprop": "varianttitles",
                  "rdlimit": "max", "rdnamespace": "0"}
        while True:
            data = get("https://zh.wikipedia.org/w/api.php", params)
            for page in data["query"]["pages"].values():
                entry = pages.setdefault(page["title"], {"variants": {}, "redirects": []})
                entry["variants"].update({key: page["varianttitles"][key] for key in VARIANTS if key in page.get("varianttitles", {})})
                entry["redirects"] += [item["title"] for item in page.get("redirects", [])]
            if "continue" not in data:
                break
            params = {**params, **data["continue"]}
    return pages


SUFFIX = re.compile(r"(国家公园|國家公園)(群|(和|及|与|與|暨)?(自然)?(保护区|保護區|保留区|保留區|禁猎区|禁獵區|州立公园|州立公園))?$")
CJK_ONLY = re.compile(r"^[㐀-鿿·・]+$")


def names(title: str, kind: str) -> list[str]:
    """“锡安国家公园” → ["锡安国家公园", "锡安"]；“圣乔治 (犹他州)” → ["圣乔治"]"""
    base = re.sub(r"\s*[（(].*?[)）]\s*", "", title).strip()
    result = [base]
    short = SUFFIX.sub("", base)
    if kind == "park" and short != base and len(short) >= 2:
        result.append(short)
    if kind == "city":
        result.append(re.sub(r"(市|镇|鎮|村)$", "", base))
    return [name for name in result if len(name) >= 2]


def build() -> dict:
    parks = json.loads((CONTRACTS / "parks.json").read_text(encoding="utf-8"))
    airports = json.loads((CONTRACTS / "airports.json").read_text(encoding="utf-8"))

    en_titles = {}
    for park in parks:
        name = park["nameEn"]
        if park["code"] in EN_TITLES:
            en_titles[park["code"]] = EN_TITLES[park["code"]]
        elif park["kind"] == "site" or "National Park" in name:
            en_titles[park["code"]] = name
        else:
            en_titles[park["code"]] = f"{name} National Park"
    print(f"公园 {len(en_titles)} 座：查维基数据")
    park_qids = wikidata_from_enwiki(en_titles)
    extra_qids = wikidata_from_enwiki(EN_TITLES_EXTRA)
    print(f"机场 {len(airports)} 个：查服务的城市")
    city_qids = airport_cities([airport["code"] for airport in airports])
    city_qids.update(wikidata_from_enwiki({code: title for code, title in AIRPORT_CITY_EN.items()
                                           if code not in city_qids or code in AIRPORT_CITY_OVERRIDE}))
    missing = [airport["code"] for airport in airports if airport["code"] not in city_qids]
    if missing:
        print(f"  没找到服务哪个城市的机场：{', '.join(missing)}")
    zh_titles = zhwiki_titles([*park_qids.values(), *extra_qids.values(), *city_qids.values()])
    print(f"中文维基条目 {len(zh_titles)} 个：查各地标题和重定向")
    pages = zhwiki_pages(list(zh_titles.values()))

    def entry(qid: str | None, kind: str, manual: dict, exclude: set[str]) -> dict | None:
        if qid is None or qid not in zh_titles:
            return None
        title = zh_titles[qid]
        page = pages.get(title) or next((value for key, value in pages.items() if title in value["variants"].values()), {"variants": {}, "redirects": []})
        aliases = []
        for variant in page["variants"].values():
            aliases += names(variant, kind)
        for redirect in page["redirects"]:
            plain = re.sub(r"\s*[（(].*?[)）]\s*", "", redirect).strip()
            if redirect == plain and CJK_ONLY.match(plain) and len(plain) >= 2:
                aliases += names(plain, kind)
        aliases += manual.get("aliases", [])
        aliases = [alias for alias in dict.fromkeys(aliases) if alias not in exclude]
        result = {"wikidata": qid, "zhwiki": title, "variants": page["variants"], "aliases": aliases}
        if manual.get("note"):
            result["note"] = manual["note"]
        return result

    out_parks = {}
    for park in parks:
        item = entry(park_qids.get(park["code"]), "park", MANUAL["parks"].get(park["code"], {}), EXCLUDE["parks"].get(park["code"], set()))
        extra = entry(extra_qids.get(park["code"]), "park", {}, EXCLUDE["parks"].get(park["code"], set()))
        if item and extra:
            item["also"] = {"wikidata": extra["wikidata"], "zhwiki": extra["zhwiki"], "variants": extra["variants"]}
            item["aliases"] = list(dict.fromkeys(item["aliases"] + extra["aliases"]))
        if item:
            out_parks[park["code"]] = item
    out_airports = {}
    for airport in airports:
        item = entry(city_qids.get(airport["code"]), "city", MANUAL["airports"].get(airport["code"], {}), EXCLUDE["airports"].get(airport["code"], set()))
        if item:
            out_airports[airport["code"]] = item
    return {
        "generated": dt.date.today().isoformat(),
        "source": "Wikidata + 中文维基百科 varianttitles 和重定向（CC BY-SA 4.0），copilot/scripts/regional_names.py 生成，不要手改",
        "parks": out_parks,
        "airports": out_airports,
    }


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    data = build()
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    print(f"写好了：{len(data['parks'])} 座公园、{len(data['airports'])} 个机场 → {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
