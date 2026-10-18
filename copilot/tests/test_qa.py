"""回答问题：在网站资料里找得对不对、模型编了数字会不会被拦下来。不联网、不要模型。"""
from nps_copilot import qa
from nps_copilot.knowledge import search
from nps_copilot.providers import ScriptedProvider

TRIP = "优胜美地 3 天，从 2026-10-19 开始，节奏适中。\n第 1 天（2026-10-19）：08:00 从安大略国际机场（ONT）出发（开车约 5 小时） → 13:10 隧道观景点；晚上住 El Portal"


def ids(question: str, parks=("yose",)) -> list[str]:
    return [doc.id for doc in search(question, list(parks))]


def test_search_finds_the_named_place():
    assert ids("El Portal是什么地方，离园区多远啊")[0] == "yose-stay-el-portal"
    assert ids("马尾瀑布火瀑好像全年就那么几天开放吧")[0] == "yose-horsetail-fall"
    assert ids("带老人能去半穹顶吗")[0] == "yose-half-dome"
    assert ids("What's the best time to see Yosemite Falls?")[0] == "yose-yosemite-falls"


def test_search_matches_half_a_name_and_traditional_chinese():
    # “雾径 · 弗纳尔瀑布”只说了“雾径”；繁体提问先转成简体
    assert ids("雾径难不难走，要走多久")[0] == "yose-mist-trail"
    assert ids("霧徑難不難走")[0] == "yose-mist-trail"


def test_search_stays_in_the_trip_parks_unless_another_is_named():
    assert all(doc.park == "yose" for doc in search("哪里看日落最好", ["yose"]))
    assert "yell-old-faithful" in ids("黄石的老忠实泉多久喷一次")


def test_model_answer_is_used_and_cites_its_source():
    provider = ScriptedProvider([{"found": True, "answer": "El Portal 在优胜美地西侧园外，到山谷约 20 分钟。", "sources": [1]}])
    text, trace = qa.answer("El Portal是什么地方，离园区多远啊", ["yose"], TRIP, provider, zh=True)
    assert trace["answer"] == "model" and trace["retrieved"][0] == "yose-stay-el-portal"
    assert text.startswith("El Portal 在优胜美地西侧园外") and text.endswith("（资料：El Portal）")
    task, user = provider.calls[0]
    assert task == "qa" and "[0] 行程：" in user and "[1] El Portal：" in user


def test_made_up_numbers_fall_back_to_the_source_text():
    # 资料里写的是 20 分钟，模型说 45 分钟：不用模型写的，直接摘资料原文
    provider = ScriptedProvider([{"found": True, "answer": "El Portal 离山谷只有 45 分钟。", "sources": [1]}])
    text, trace = qa.answer("El Portal离园区多远", ["yose"], TRIP, provider, zh=True)
    assert trace["answer"] == "fallback" and trace["unsupported"] == ["45"]
    assert text.startswith("网站资料里关于“El Portal”是这样写的：") and "约 20 分钟" in text


def test_times_from_the_trip_are_allowed():
    provider = ScriptedProvider([{"found": True, "answer": "第 1 天 08:00 从安大略机场出发。", "sources": [0]}])
    text, trace = qa.answer("19号早上我什么时候出发啊", ["yose"], TRIP, provider, zh=True)
    assert trace["answer"] == "model" and text == "第 1 天 08:00 从安大略机场出发。"


def test_not_found_says_so_instead_of_guessing():
    provider = ScriptedProvider([{"found": False, "answer": "网站的资料里没写这个", "sources": []}])
    text, trace = qa.answer("园区里能用支付宝吗", ["yose"], TRIP, provider, zh=True)
    assert trace["answer"] == "not_found" and "没写" in text


def test_question_detection():
    assert qa.is_question("El Portal是什么地方") and qa.is_question("how far is El Portal")
    assert not qa.is_question("太棒了") and not qa.is_question("great")
