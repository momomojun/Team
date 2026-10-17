// 检查英文内容组：没有空值、英文里没有汉字、JSON 合法，列出可能没换成英制的条目。
// 用法（在仓库根目录下）：node scripts/check-en.mjs attractions-zion parks ...
import { readFileSync } from "node:fs";
const HAN = /[\u3400-\u9fff]/;
let bad = 0;
for (const id of process.argv.slice(2)) {
  const text = readFileSync(`src/i18n/en/content/${id}.ts`, "utf8");
  let entries;
  try {
    entries = Object.entries(JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)));
  } catch (error) {
    console.log(`${id}: 不是合法的 JSON —— ${error.message}`);
    bad++;
    continue;
  }
  const empty = entries.filter(([, en]) => en === "");
  const han = entries.filter(([, en]) => HAN.test(en));
  const metric = entries.filter(([, en]) => /\d\s?(km|m|°C)\b|\bkilomet|\bmeters?\b/.test(en) && !/\(\d[^)]*(km|m)\)/.test(en));
  console.log(`${id}: ${entries.length} 条，空 ${empty.length}，英文里有汉字 ${han.length}，可能没换英制 ${metric.length}`);
  for (const [zh, en] of [...han, ...metric].slice(0, 20)) console.log(`   ${zh.slice(0, 30)} → ${en.slice(0, 80)}`);
  bad += empty.length + han.length;
}
console.log(bad ? `还有 ${bad} 处要处理` : "OK");
