import assert from "node:assert/strict";
import test from "node:test";
import { pickVoice } from "../src/lib/speech";

test("朗读挑声音：语言完全对上的优先，同一档里自然的声音（Natural、Google）优先，没有这种语言就不挑", () => {
  const voices = [
    { lang: "en-US", name: "Microsoft David", default: true },
    { lang: "zh-CN", name: "Microsoft Huihui", default: false },
    { lang: "zh-CN", name: "Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)", default: false },
    { lang: "zh-TW", name: "Google 國語（臺灣）", default: false },
  ];
  assert.equal(pickVoice(voices, "zh-CN")?.name, "Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)");
  assert.equal(pickVoice(voices, "zh-TW")?.name, "Google 國語（臺灣）");
  assert.equal(pickVoice(voices.slice(0, 2), "zh-TW")?.name, "Microsoft Huihui", "没有台湾的声音就用同一种语言的");
  assert.equal(pickVoice(voices, "en-US")?.name, "Microsoft David");
  assert.equal(pickVoice(voices, "ja-JP"), undefined);
});
