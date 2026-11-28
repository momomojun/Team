/**
 * 把 Copilot 回的一段话拆成几种块，对话框按块排版（11-27，学 ChatGPT 把回复排成有层次的样子，不是一大段字）：
 * - day：Writer 模板写的每天一行（“第 2 天（6月11日，锡安）：08:00 从 Springdale 出发 → 09:10 天使降临、13:00 翡翠池；晚上住 Springdale”），
 *   拆成出发、各站（时间 + 名字）、住处，画成一条路线；
 * - heading：“要注意：”这种短的、冒号结尾的一行；
 * - list：“- ”开头的几行；
 * - para：别的都按原样一段。
 * 模型写的说明（Writer 用模型时）格式不固定：对不上的一律当段落，不会丢字。
 */
export interface DayStop {
  time: string;
  name: string;
  /** 别的时区的当地时间（“当地 09:10”） */
  local?: string;
}

export interface DayBlock {
  kind: "day";
  /** “第 2 天”“Day 2” */
  title: string;
  /** 括号里的：日期、哪座公园 */
  detail: string;
  leave?: { time: string; from: string; drive?: string };
  stops: DayStop[];
  /** 这天没有景点（“路上 / 休息”） */
  rest?: string;
  /** 晚上住哪 */
  stay?: string;
  /** 最后一天开回机场、城市，原样一句 */
  end?: string;
}

export type ReplyBlock =
  | DayBlock
  | { kind: "heading"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "para"; text: string };

const DAY_ZH = /^(第\s*\d+\s*天)（([^）]*)）[：:]\s*(.+)$/;
const DAY_EN = /^(Day \d+) \(([^)]*)\):\s*(.+)$/;
const LEAVE_ZH = /^(\d{1,2}:\d{2}) 从\s*(.+?)\s*出发(?:（开车\s*(.+)）)?$/;
const LEAVE_EN = /^leave (.+) at (\d{1,2}:\d{2})(?: \((.+) drive\))?$/;
const STOP = /^(\d{1,2}:\d{2})\s+(.+)$/;
const LOCAL_ZH = /（当地 (\d{1,2}:\d{2})）$/;
const LOCAL_EN = / \((\d{1,2}:\d{2}) local\)$/;

function parseStops(text: string, english: boolean): DayStop[] | null {
  const parts = text.split(english ? /, (?=\d{1,2}:\d{2} )/ : "、");
  const stops: DayStop[] = [];
  for (const part of parts) {
    const match = STOP.exec(part.trim());
    if (!match) return null;
    let name = match[2].trim();
    const local = (english ? LOCAL_EN : LOCAL_ZH).exec(name);
    if (local) name = name.slice(0, local.index).trim();
    stops.push({ time: match[1], name, ...(local ? { local: local[1] } : {}) });
  }
  return stops;
}

export function parseDay(line: string): DayBlock | null {
  const english = !DAY_ZH.test(line);
  const head = (english ? DAY_EN : DAY_ZH).exec(line);
  if (!head) return null;
  const [, title, detail, rest] = head;
  // 晚上住哪 / 最后开回哪：中文在第一个“；”后面，英文在“; ”后面
  const cut = rest.indexOf(english ? "; " : "；");
  const main = cut >= 0 ? rest.slice(0, cut) : rest;
  const tail = cut >= 0 ? rest.slice(cut + (english ? 2 : 1)).trim() : "";
  const arrow = main.indexOf(" → ");
  const leaveText = arrow >= 0 ? main.slice(0, arrow).trim() : "";
  const stopsText = (arrow >= 0 ? main.slice(arrow + 3) : main).trim();
  const block: DayBlock = { kind: "day", title, detail, stops: [] };
  if (leaveText) {
    const leave = (english ? LEAVE_EN : LEAVE_ZH).exec(leaveText);
    if (!leave) return null;
    block.leave = english ? { time: leave[2], from: leave[1], drive: leave[3] } : { time: leave[1], from: leave[2], drive: leave[3] };
  }
  if (/^(路上 \/ 休息|travel \/ rest)$/.test(stopsText)) block.rest = stopsText;
  else {
    const stops = parseStops(stopsText, english);
    if (!stops) return null;
    block.stops = stops;
  }
  if (tail) {
    const stay = (english ? /^overnight at (.+)$/ : /^晚上住\s*(.+)$/).exec(tail);
    if (stay) block.stay = stay[1].trim();
    else block.end = tail;
  }
  return block;
}

export function replyBlocks(text: string): ReplyBlock[] {
  const blocks: ReplyBlock[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (/^[-•]\s+/.test(line)) {
      const item = line.replace(/^[-•]\s+/, "");
      const last = blocks.at(-1);
      if (last?.kind === "list") last.items.push(item);
      else blocks.push({ kind: "list", items: [item] });
      continue;
    }
    const day = parseDay(line);
    // “没排进去的：天使降临（要抽签）；守望者步道（这几天不开放）；……”：一行好几项，拆成小标题加列表
    const labelled = /^([^：:，,。]{2,14})[：:]\s*(.+)$/.exec(line);
    const items = labelled ? labelled[2].split(/；|; /).map((item) => item.trim()).filter(Boolean) : [];
    if (day) blocks.push(day);
    else if (labelled && items.length >= 2) blocks.push({ kind: "heading", text: labelled[1] }, { kind: "list", items });
    else if (line.length <= 24 && /[：:]$/.test(line) && !/[。.!！?？，,]/.test(line.slice(0, -1)))
      blocks.push({ kind: "heading", text: line.replace(/[：:]$/, "") });
    else blocks.push({ kind: "para", text: line });
  }
  return blocks;
}
