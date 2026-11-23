/**
 * 后台“测试和评测”页的数据（11-22）：按 copilot/eval/RESULTS.md 整理（引擎打分那一轮来自 docs/TRUST.md），数字照抄原文。
 * RESULTS.md 加了新的一轮，就在 EVAL_ROUNDS 末尾补一条；门禁的数字和 .github 的 PR 评论表一样（基线见 copilot/eval/baseline*.json）
 */

export type EvalKind = "intake" | "conversation" | "alerts" | "retrieval" | "agent" | "soft" | "engine" | "robustness" | "models" | "prompt" | "other";

export const KIND_LABEL: Record<EvalKind, { zh: string; en: string }> = {
  intake: { zh: "单句理解", en: "Intake" },
  conversation: { zh: "多轮对话", en: "Multi-turn" },
  alerts: { zh: "读公告", en: "Alerts" },
  retrieval: { zh: "找资料", en: "Retrieval" },
  agent: { zh: "search agent", en: "Search agent" },
  soft: { zh: "多 agent", en: "Multi-agent" },
  engine: { zh: "行程引擎", en: "Engine" },
  robustness: { zh: "稳不稳", en: "Robustness" },
  models: { zh: "换模型", en: "Models" },
  prompt: { zh: "提示词", en: "Prompt" },
  other: { zh: "试用", en: "Trial" },
};

export interface EvalRound {
  date: string;
  titleZh: string;
  titleEn: string;
  kind: EvalKind;
  summaryZh: string;
  summaryEn: string;
  results: { suite: string; model: string; score: string; note?: string }[];
}

/** 测试一共几层：数量是 11-22 本机跑的 */
export const TEST_LAYERS = [
  { nameZh: "网站测试", nameEn: "Website tests", count: "235", whatZh: "排行程、时间线、预算、数据完整、英文版不漏字；不联网，几秒", whatEn: "Planning, timelines, budget, data integrity, nothing missing in English; offline, seconds", command: "npm test" },
  { nameZh: "Copilot 测试", nameEn: "Copilot tests", count: "533", whatZh: "规则逐条、调度员、多 agent 核对、故障注入；不要模型", whatEn: "Rule by rule, dispatcher, multi-agent checks, fault injection; no model", command: "pytest copilot/tests" },
  { nameZh: "回放门禁", nameEn: "Replay gates", count: "10 组", countEn: "10 suites", whatZh: "回放录好的模型回答跑完整的 Copilot，低于基线不能合并", whatEn: "Replays recorded model answers through the whole Copilot; below baseline blocks the merge", command: "ci.yml" },
  { nameZh: "引擎对照真实行程", nameEn: "Engine vs real trips", count: "73 + 110", whatZh: "73 条博主和 NPS 的真实行程、110 条按论文方法打分的请求，都是门禁", whatEn: "73 creator and NPS itineraries and 110 paper-style scored requests, both gated", command: "npm run eval:routes · eval:quality" },
  { nameZh: "软要求题", nameEn: "Soft-wish cases", count: "30 + 20", whatZh: "多 agent 对照调度员：30 道有软要求、20 道对照题（一半英文）", whatEn: "Multi-agent vs dispatcher: 30 with soft wishes, 20 controls (half English)", command: "python eval/soft.py" },
  { nameZh: "换模型对照", nameEn: "Model comparisons", count: "4 个", countEn: "4 models", whatZh: "同一套题换本机、云端模型跑，用真模型、不回放", whatEn: "The same suites on local and cloud models, live, not replayed", command: "--record" },
] as const;

/** 门禁：和 PR 评论表的“这次”一样（copilot/eval/pr_summary.py 写的） */
export const GATES = [
  { suiteZh: "单句（开发集）", suiteEn: "Single sentence (dev set)", score: "25/25", baseline: "≥ 25" },
  { suiteZh: "单句 held-out v1", suiteEn: "Single sentence, held-out v1", score: "37/40", baseline: "≥ 37" },
  { suiteZh: "单句 held-out v2（约四成刁难）", suiteEn: "Single sentence, held-out v2 (~40% adversarial)", score: "70/70", baseline: "≥ 70" },
  { suiteZh: "各地叫法（港台新马）", suiteEn: "Regional wording (HK, TW, SG, MY)", score: "17/17", baseline: "≥ 17" },
  { suiteZh: "多轮对话 v1", suiteEn: "Multi-turn v1", score: "20/20 组 · 52/52 轮", scoreEn: "20/20 · 52/52 turns", baseline: "≥ 20 · 52" },
  { suiteZh: "多轮对话 v2", suiteEn: "Multi-turn v2", score: "15/15 组 · 34/34 轮", scoreEn: "15/15 · 34/34 turns", baseline: "≥ 15 · 34" },
  { suiteZh: "多轮对话 v3（仓库主人试用）", suiteEn: "Multi-turn v3 (owner's trial)", score: "1/2 组 · 14/15 轮", scoreEn: "1/2 · 14/15 turns", baseline: "≥ 1 · 14" },
  { suiteZh: "NPS 公告提取", suiteEn: "NPS alert extraction", score: "类型 0.755 · F1 0.333", scoreEn: "type 0.755 · F1 0.333", baseline: "≥ 0.755 · 0.333" },
  { suiteZh: "找资料（按意思 · 关键词）", suiteEn: "Retrieval (semantic · keyword)", score: "召回@5 1.0 · 0.812", scoreEn: "recall@5 1.0 · 0.812", baseline: "≥ 1.0 · 0.812" },
  { suiteZh: "回答问题（search agent · 找一次就答）", suiteEn: "Q&A (search agent · retrieve once)", score: "39/44 · 19/44", baseline: "≥ 39 · 19" },
] as const;

/**
 * 软要求题（copilot/eval/soft.py）。v1：team 是 11-22（三）修了“无中生有”以后的回放，teamFixed 是修了 S07、S13、S20（代码按原话认天数、
 * 一天一个片区先挑片区再整片分天、园里的地方不当成公园）以后的回放。v2：20 道对照题第一次跑（本机三个模型和 Gemini，录了音）
 */
export const SOFT = {
  v1Total: 30,
  v2Total: 20,
  v1: [
    { model: "Qwen3.5 4B", dispatcher: 7, team: 25, teamFixed: 27 },
    { model: "Qwen3.5 35B-A3B", dispatcher: 7, team: 27, teamFixed: 29 },
    { model: "gpt-oss 20B", dispatcher: 7, team: 27, teamFixed: 27 },
    { model: "Gemini 3.5 Flash Lite", dispatcher: 7, team: 26, teamFixed: 28 },
  ],
  v2: [
    { model: "Qwen3.5 4B", dispatcher: 20, team: 20, invented: 0, caught: 20 },
    { model: "Qwen3.5 35B-A3B", dispatcher: 20, team: 20, invented: 0, caught: 3 },
    { model: "gpt-oss 20B", dispatcher: 20, team: 20, invented: 0, caught: 0 },
    { model: "Gemini 3.5 Flash Lite", dispatcher: 20, team: 20, invented: 0, caught: 0 },
  ] as { model: string; dispatcher: number; team: number; invented: number; caught: number }[],
};

/** 本机模型对照（RESULTS.md 2026-11-22（二）的表，软要求多 agent 一行和 Gemini 来自（三）） */
export const MODEL_MATRIX = {
  "models": [
    "Qwen3.5 4B",
    "Qwen3.5 35B-A3B",
    "gpt-oss 20B",
    "Gemini 3.5 Flash Lite"
  ],
  "rows": [
    {
      "suiteZh": "单句理解 · 开发集",
      "suiteEn": "Intake · dev set",
      "values": [
        "25/25",
        "25/25",
        "23/25",
        "—"
      ]
    },
    {
      "suiteZh": "单句理解 · 没见过的 v1",
      "suiteEn": "Intake · held-out v1",
      "values": [
        "37/40",
        "38/40",
        "36/40",
        "—"
      ]
    },
    {
      "suiteZh": "单句理解 · 没见过的 v2",
      "suiteEn": "Intake · held-out v2",
      "values": [
        "70/70",
        "70/70",
        "69/70",
        "—"
      ]
    },
    {
      "suiteZh": "单句理解 · 各地叫法",
      "suiteEn": "Intake · regional wording",
      "values": [
        "17/17",
        "17/17",
        "17/17",
        "—"
      ]
    },
    {
      "suiteZh": "多轮对话 v1（组全对）",
      "suiteEn": "Multi-turn v1 (whole conversations)",
      "values": [
        "20/20",
        "19/20",
        "18/20",
        "—"
      ]
    },
    {
      "suiteZh": "多轮对话 v2",
      "suiteEn": "Multi-turn v2",
      "values": [
        "15/15",
        "14/15",
        "13/15",
        "—"
      ]
    },
    {
      "suiteZh": "多轮对话 v3（真人试用的两长段）",
      "suiteEn": "Multi-turn v3 (owner trials)",
      "values": [
        "1/2",
        "1/2",
        "0/2",
        "—"
      ]
    },
    {
      "suiteZh": "读 NPS 公告 · 类型准确率（模型）",
      "suiteEn": "NPS alerts · type accuracy (model)",
      "values": [
        "76%",
        "82%",
        "65%",
        "—"
      ]
    },
    {
      "suiteZh": "读 NPS 公告 · 日期对的（模型）",
      "suiteEn": "NPS alerts · correct dates (model)",
      "values": [
        "16/24",
        "20/24",
        "10/24",
        "—"
      ]
    },
    {
      "suiteZh": "读 NPS 公告 · 景点 F1（规则 + 模型）",
      "suiteEn": "NPS alerts · place F1 (rules + model)",
      "values": [
        "0.43",
        "0.43",
        "0.41",
        "—"
      ]
    },
    {
      "suiteZh": "回答问题 · 找一次就答",
      "suiteEn": "Q&A · retrieve once",
      "values": [
        "17/44",
        "18/44",
        "17/44",
        "—"
      ]
    },
    {
      "suiteZh": "回答问题 · search agent 自己查",
      "suiteEn": "Q&A · search agent",
      "values": [
        "27/44",
        "33/44",
        "17/44",
        "—"
      ]
    },
    {
      "suiteZh": "软要求 · 调度员",
      "suiteEn": "Soft wishes · dispatcher",
      "values": [
        "7/30",
        "7/30",
        "7/30",
        "—"
      ]
    },
    {
      "suiteZh": "软要求 · 多 agent",
      "suiteEn": "Soft wishes · multi-agent",
      "values": [
        "25/30",
        "27/30",
        "27/30",
        "26/30"
      ]
    },
    {
      "suiteZh": "软要求 · 多 agent（修了 S07、S13、S20 以后）",
      "suiteEn": "Soft wishes · multi-agent (after the S07, S13, S20 fixes)",
      "values": ["27/30", "29/30", "27/30", "28/30"]
    },
    {
      "suiteZh": "对照题 · 不能无中生有（soft-v2）",
      "suiteEn": "Control cases · nothing invented (soft-v2)",
      "values": ["20/20", "20/20", "20/20", "20/20"]
    }
  ],
  "speedZh": "每题耗时中位数（同一台电脑、同一天）——软要求 · 调度员：4B 1.1 s，35B-A3B 7.3 s，gpt-oss 20B 11.3 s；软要求 · 多 agent：3.7 s，11.8 s，18.5 s；回答问题 · search agent：3.7 s，7.6 s，4.4 s（多半退回了）；单句理解（每次调用）：4B —，35B-A3B 约 3.4 s，gpt-oss 20B 约 4.8 s。（4B 单句理解、多轮对话的录音是 10 月在仓库主人另一台电脑上录的，耗时不能和这里比，不列。） gpt-oss 的 search agent 44 题里 37 题第一步就出错、退回找一次就答。Gemini 那一列只有软要求，别的成绩是在旧代码上测的，不能比。",
  "speedEn": "Median time per case (same computer, same day): soft wishes · dispatcher 4B 1.1 s, 35B-A3B 7.3 s, gpt-oss 20B 11.3 s; soft wishes · multi-agent 3.7 s, 11.8 s, 18.5 s; Q&A · search agent 3.7 s, 7.6 s, 4.4 s (gpt-oss mostly fell back: 37 of 44 failed at the first step). Gemini's column only has soft wishes because its other scores were measured on older code."
} as const;

export const EVAL_ROUNDS: EvalRound[] = [
  {
    "date": "2026-10-17",
    "titleZh": "第一次单句理解评测",
    "titleEn": "First intake evaluation",
    "kind": "intake",
    "summaryZh": "25 组开发集对话测“一句话摘出条件”。修了代码、加了补天数的规则以后，Qwen3.5 4B 到 25/25；Qwen3 4B 只有 20/25，还编造了 6 个片段。",
    "summaryEn": "25 development-set dialogues tested extracting trip conditions from one message. After code fixes and a day-count rule, Qwen3.5 4B reached 25/25; Qwen3 4B got 20/25 and fabricated 6 fragments.",
    "results": [
      {
        "suite": "单句（开发集 25 组）",
        "model": "Qwen3.5 4B，第一次",
        "score": "14/25",
        "note": "中位 2.55 s"
      },
      {
        "suite": "单句（开发集 25 组）",
        "model": "Qwen3.5 4B，修完代码",
        "score": "23/25",
        "note": "中位 2.54 s"
      },
      {
        "suite": "单句（开发集 25 组）",
        "model": "Qwen3 4B，同一版代码",
        "score": "20/25",
        "note": "丢掉的片段（编造）6；中位 1.95 s"
      },
      {
        "suite": "单句（开发集 25 组）",
        "model": "Qwen3.5 4B 回放，加上天数规则（当前基线）",
        "score": "25/25",
        "note": "规则补的 2；条件齐了能排出行程 22/22"
      }
    ]
  },
  {
    "date": "2026-10-17",
    "titleZh": "试更大的 Qwen3.5 9B",
    "titleEn": "Trying the larger Qwen3.5 9B",
    "kind": "models",
    "summaryZh": "9B 和 4B 在摘条件、写说明两件事上都没有明显更好，而且更慢，所以不换，默认继续用 Qwen3.5 4B。",
    "summaryEn": "The 9B model was not clearly better than 4B at extracting conditions or writing explanations, and it was slower, so the default stayed Qwen3.5 4B.",
    "results": [
      {
        "suite": "单句（开发集 25 组）",
        "model": "Qwen3.5 9B",
        "score": "25/25",
        "note": "不靠规则 21，规则补 4（都是公园名）；中位 3.2 s"
      },
      {
        "suite": "单句（开发集 25 组）",
        "model": "Qwen3.5 4B（默认）",
        "score": "25/25",
        "note": "不靠规则 23，规则补 2（都是天数）；中位 2.4 s"
      },
      {
        "suite": "单句（开发集 25 组）",
        "model": "Qwen3 4B",
        "score": "20/25",
        "note": "编造的片段 6；中位 1.7 s"
      },
      {
        "suite": "Writer 没有编造（22 个行程）",
        "model": "Qwen3.5 9B",
        "score": "21/22",
        "note": "中位 15.4 s"
      },
      {
        "suite": "Writer 没有编造（22 个行程）",
        "model": "Qwen3.5 4B",
        "score": "21/22",
        "note": "中位 8.7 s"
      },
      {
        "suite": "Writer 没有编造（输出上限改成 1536 以后）",
        "model": "Qwen3.5 9B / Qwen3.5 4B",
        "score": "22/22",
        "note": "两个模型都是"
      }
    ]
  },
  {
    "date": "2026-10-17",
    "titleZh": "40 组没见过的复杂对话",
    "titleEn": "Held-out v1: 40 unseen hard cases",
    "kind": "intake",
    "summaryZh": "另写 40 组写代码时没看过的复杂对话，第一次 27/40，13 组失败里 11 组是代码问题。修完 37/40，但看过失败了，不再算没见过的数据。",
    "summaryEn": "40 new dialogues unseen during development scored 27/40 on the first run; 11 of 13 failures were code bugs. After fixes it reached 37/40, which no longer counts as unseen data.",
    "results": [
      {
        "suite": "held-out v1（40 组）",
        "model": "Qwen3.5 4B，冻结时的代码",
        "score": "27/40",
        "note": "没见过的数据上的成绩；追问类型对 96%"
      },
      {
        "suite": "held-out v1（40 组）",
        "model": "Qwen3.5 4B，修完",
        "score": "37/40",
        "note": "不再是 held-out；追问类型对 98%"
      },
      {
        "suite": "排出来的行程有没有硬问题",
        "model": "Qwen3.5 4B",
        "score": "0",
        "note": "第一次和修完都是 0"
      },
      {
        "suite": "Writer 没有编造",
        "model": "Qwen3.5 4B，第一次",
        "score": "26/26"
      },
      {
        "suite": "Writer 没有编造",
        "model": "Qwen3.5 4B，修完",
        "score": "29/29"
      },
      {
        "suite": "单句（开发集）",
        "model": "Qwen3.5 4B，修完",
        "score": "25/25"
      }
    ]
  },
  {
    "date": "2026-10-17",
    "titleZh": "提示词 v2 没采用",
    "titleEn": "Prompt intake v2, not adopted",
    "kind": "prompt",
    "summaryZh": "v2 修好了回归集里模型漏摘的两组（39/40），却让开发集里一句英文变差（24/25），开发集门禁没过，默认继续用 v1。说明 4B 模型对提示词很敏感。",
    "summaryEn": "Prompt v2 fixed two missed extractions on the regression set (39/40) but broke an English case on the dev set (24/25). The dev gate failed, so v1 stayed the default; the 4B model is very prompt-sensitive.",
    "results": [
      {
        "suite": "单句（开发集 25）",
        "model": "intake v1（默认）",
        "score": "25/25"
      },
      {
        "suite": "单句（开发集 25）",
        "model": "intake v2",
        "score": "24/25"
      },
      {
        "suite": "回归集 holdout-v1（40）",
        "model": "intake v1（默认）",
        "score": "37/40"
      },
      {
        "suite": "回归集 holdout-v1（40）",
        "model": "intake v2",
        "score": "39/40"
      }
    ]
  },
  {
    "date": "2026-10-17",
    "titleZh": "各地中文写法",
    "titleEn": "Regional Chinese variants",
    "kind": "intake",
    "summaryZh": "加了香港、台湾、新马的叫法和繁简对照后，另写 17 组各地写法的对话：先提交期望再跑，第一次 14/17，修完 17/17（修完的不算没见过的数据）。",
    "summaryEn": "After adding Hong Kong, Taiwan and Singapore/Malaysia names, 17 regional dialogues were written with expectations committed first: 14/17 on the first run, 17/17 after fixes (no longer unseen).",
    "results": [
      {
        "suite": "regional-v1（17 组）",
        "model": "Qwen3.5 4B，第一次",
        "score": "14/17"
      },
      {
        "suite": "regional-v1（17 组）",
        "model": "Qwen3.5 4B，修完",
        "score": "17/17",
        "note": "1 组靠规则补的天数"
      },
      {
        "suite": "单句（开发集）",
        "model": "Qwen3.5 4B",
        "score": "25/25",
        "note": "不变"
      },
      {
        "suite": "回归集 holdout-v1",
        "model": "Qwen3.5 4B",
        "score": "37/40",
        "note": "不变"
      }
    ]
  },
  {
    "date": "2026-10-18",
    "titleZh": "真人试用暴露多轮问题",
    "titleEn": "Owner trial exposed multi-turn gaps",
    "kind": "other",
    "summaryZh": "三组单句评测都满分，真人一用多轮对话却很差：82 组样例全是“一句话摘条件”，没测排完以后接着聊。修了相对日期、年份、回复内容等，三组门禁不变。",
    "summaryEn": "All three single-message suites were perfect, yet a real multi-turn session went badly: all 82 cases tested one-shot extraction, none tested follow-up chat. Relative dates, years and replies were fixed; the three gates were unchanged.",
    "results": [
      {
        "suite": "单句（开发集）",
        "model": "Qwen3.5 4B",
        "score": "25/25",
        "note": "用真模型重新录了一遍"
      },
      {
        "suite": "回归集 holdout-v1",
        "model": "Qwen3.5 4B",
        "score": "37/40"
      },
      {
        "suite": "regional-v1",
        "model": "Qwen3.5 4B",
        "score": "17/17"
      }
    ]
  },
  {
    "date": "2026-10-18",
    "titleZh": "能回答问题（RAG）",
    "titleEn": "Answering questions (RAG)",
    "kind": "other",
    "summaryZh": "排好行程以后的提问改成先查网站资料再答。这一节只是试用、不是评测；三组单句门禁不受影响。",
    "summaryEn": "Follow-up questions are now answered from the site's own data (RAG). This round was a trial, not an evaluation; the three single-message gates were unaffected.",
    "results": [
      {
        "suite": "单句（开发集）",
        "model": "Qwen3.5 4B",
        "score": "25/25",
        "note": "不变"
      },
      {
        "suite": "回归集 holdout-v1",
        "model": "Qwen3.5 4B",
        "score": "37/40",
        "note": "不变"
      },
      {
        "suite": "regional-v1",
        "model": "Qwen3.5 4B",
        "score": "17/17",
        "note": "不变"
      }
    ]
  },
  {
    "date": "2026-10-18",
    "titleZh": "规则改成模型调度员",
    "titleEn": "Rules replaced by a dispatcher",
    "kind": "conversation",
    "summaryZh": "每一轮先让模型决定做哪几件事、代码去做和核对。在没见过的多轮对话 v2 上，调度员 14/15 组，原来的规则只有 6/15；真人原话写成的 v3 修完到 13/14 轮。",
    "summaryEn": "Each turn the model now decides which actions to take and code executes and verifies them. On unseen multi-turn set v2 the dispatcher got 14/15 groups versus 6/15 for the old rules; the owner-trial set v3 reached 13/14 turns after fixes.",
    "results": [
      {
        "suite": "conversation-v1（开发集）",
        "model": "原来的代码（规则）",
        "score": "12/20 组、44/52 轮"
      },
      {
        "suite": "conversation-v1（开发集）",
        "model": "调度员",
        "score": "20/20、52/52"
      },
      {
        "suite": "conversation-v2（第一次跑）",
        "model": "原来的代码（规则，COPILOT_DISPATCH=0）",
        "score": "6/15、24/34"
      },
      {
        "suite": "conversation-v2（第一次跑）",
        "model": "调度员",
        "score": "14/15、33/34",
        "note": "没见过的数据上的成绩"
      },
      {
        "suite": "conversation-v2（修了一处以后）",
        "model": "调度员",
        "score": "15/15、34/34"
      },
      {
        "suite": "conversation-v3（仓库主人原话）",
        "model": "调度员第一版",
        "score": "0/2、3/14"
      },
      {
        "suite": "conversation-v3（仓库主人原话）",
        "model": "第三次试用修完",
        "score": "1/2、13/14"
      },
      {
        "suite": "conversation-v2",
        "model": "第三次试用修完",
        "score": "14/15、33/34",
        "note": "V07 掉了一轮"
      },
      {
        "suite": "每轮中位耗时",
        "model": "规则 / 调度员",
        "score": "约 3.6 秒 / 约 4.2 秒"
      }
    ]
  },
  {
    "date": "2026-10-19",
    "titleZh": "模型读 NPS 公告",
    "titleEn": "Reading NPS alerts with a model",
    "kind": "alerts",
    "summaryZh": "151 条公告的考卷：模型判断关闭更准、能读出日期（规则一个都读不出），但常把整段关闭说成部分关闭。模型和规则取并集景点 F1 最高（0.43）。",
    "summaryEn": "On 151 alerts the model judged closures more precisely and read dates (rules read none), but often called full closures partial. Taking the union of model and rules gave the best attraction F1 (0.43).",
    "results": [
      {
        "suite": "公告 151 条",
        "model": "规则（网站现有的）",
        "score": "类型 58% · 景点 F1 0.31 · 日期 0/24"
      },
      {
        "suite": "公告 151 条",
        "model": "Qwen3.5 4B，第一次跑",
        "score": "类型 75.5% · 景点 F1 0.31 · 日期 16/24"
      },
      {
        "suite": "公告 151 条",
        "model": "Qwen3.5 4B + “景点要在公告里提到”的检查",
        "score": "类型 75.5% · 景点 F1 0.33 · 日期 16/24",
        "note": "看过错题后加的检查"
      },
      {
        "suite": "公告 151 条",
        "model": "模型和规则一起（并集）",
        "score": "类型 76% · 景点 F1 0.43 · 日期 16/24",
        "note": "看过错题后加的"
      }
    ]
  },
  {
    "date": "2026-10-19",
    "titleZh": "读公告：本机 vs 商业模型",
    "titleEn": "Alerts: local vs commercial models",
    "kind": "alerts",
    "summaryZh": "同一份 151 条公告只换模型：GPT-4.1 mini 最准，Gemini 3.5 Flash Lite 免费、差得不多，本机 4B 明显落后；最便宜的 GPT-5 nano 最差。",
    "summaryEn": "Same 151 alerts, only the model changed: GPT-4.1 mini was most accurate, free Gemini 3.5 Flash Lite was close behind, local 4B lagged, and the cheapest GPT-5 nano was worst.",
    "results": [
      {
        "suite": "公告 151 条",
        "model": "GPT-4.1 mini",
        "score": "类型 81% · 景点 F1 0.61 · 日期 23/24",
        "note": "每 1000 条约 $0.41"
      },
      {
        "suite": "公告 151 条",
        "model": "Gemini 3.5 Flash Lite",
        "score": "类型 80% · 景点 F1 0.54 · 日期 15/24",
        "note": "免费档 $0"
      },
      {
        "suite": "公告 151 条",
        "model": "GPT-6 luna",
        "score": "类型 83% · 景点 F1 0.48 · 日期 19/24",
        "note": "每 1000 条约 $0.12"
      },
      {
        "suite": "公告 151 条",
        "model": "Qwen3.5 4B（本机）",
        "score": "类型 76% · 景点 F1 0.33 · 日期 16/24",
        "note": "$0"
      },
      {
        "suite": "公告 151 条",
        "model": "GPT-5 nano",
        "score": "类型 50% · 景点 F1 0.14 · 日期 6/24",
        "note": "每 1000 条约 $0.07"
      },
      {
        "suite": "公告 151 条",
        "model": "Gemma 4 31B",
        "score": "无效",
        "note": "151 条里 92 条出错"
      }
    ]
  },
  {
    "date": "2026-10-19",
    "titleZh": "聊天：本机 vs 商业模型",
    "titleEn": "Chat steps: local vs commercial",
    "kind": "models",
    "summaryZh": "摘条件、调度、回答问题只换模型。在较公平的没见过的单句和真人对话 v3 上 GPT-4.1 mini 最好，Gemini 在 v3 上也全对；开发集和 v1/v2 是照着 4B 的错修过的，对 4B 有利。",
    "summaryEn": "Only the model changed for extraction, dispatch and QA. On the fairer unseen and owner-trial sets GPT-4.1 mini was best and Gemini was perfect on v3; dev, v1 and v2 were tuned on 4B's errors and favor it.",
    "results": [
      {
        "suite": "单句·没见过的 40 组（holdout-v1）",
        "model": "GPT-4.1 mini",
        "score": "38/40",
        "note": "本机 4B 37/40"
      },
      {
        "suite": "多轮对话 v1：20 组 / 52 轮",
        "model": "Qwen3.5 4B",
        "score": "20/20 · 52/52"
      },
      {
        "suite": "多轮对话 v1：20 组 / 52 轮",
        "model": "Gemini 3.5 Flash Lite",
        "score": "19/20 · 51/52"
      },
      {
        "suite": "多轮对话 v1：20 组 / 52 轮",
        "model": "GPT-4.1 mini",
        "score": "18/20 · 50/52"
      },
      {
        "suite": "多轮对话 v2：15 组 / 34 轮",
        "model": "Qwen3.5 4B",
        "score": "14/15 · 33/34"
      },
      {
        "suite": "多轮对话 v2：15 组 / 34 轮",
        "model": "Gemini 3.5 Flash Lite",
        "score": "13/15 · 32/34"
      },
      {
        "suite": "多轮对话 v2：15 组 / 34 轮",
        "model": "GPT-4.1 mini",
        "score": "15/15 · 34/34"
      },
      {
        "suite": "真实对话 v3：2 组 / 15 轮",
        "model": "Qwen3.5 4B",
        "score": "1/2 · 14/15"
      },
      {
        "suite": "真实对话 v3：2 组 / 15 轮",
        "model": "Gemini 3.5 Flash Lite",
        "score": "2/2 · 15/15"
      },
      {
        "suite": "真实对话 v3：2 组 / 15 轮",
        "model": "GPT-4.1 mini",
        "score": "2/2 · 15/15"
      }
    ]
  },
  {
    "date": "2026-10-19",
    "titleZh": "打错字时反问",
    "titleEn": "Asking back on typos",
    "kind": "conversation",
    "summaryZh": "认不出的公园叫法先和已知叫法比像不像，像就反问一句（不再把错字当别名）。v3 的期望按新规则改了，成绩 1/2、14/15，v1、v2 回放不变。",
    "summaryEn": "Unrecognized park names are now compared to known names and the user is asked to confirm likely typos instead of adding aliases. v3 expectations were updated for the new rule: 1/2, 14/15; v1 and v2 unchanged.",
    "results": [
      {
        "suite": "conversation-v3",
        "model": "Qwen3.5 4B",
        "score": "1/2、14/15",
        "note": "期望改成反问、加了一轮"
      },
      {
        "suite": "conversation-v1",
        "model": "Qwen3.5 4B 回放",
        "score": "20/20",
        "note": "不变"
      },
      {
        "suite": "conversation-v2",
        "model": "Qwen3.5 4B 回放",
        "score": "14/15",
        "note": "不变"
      }
    ]
  },
  {
    "date": "2026-10-19",
    "titleZh": "Groq 上的开源模型",
    "titleEn": "Open models on Groq",
    "kind": "models",
    "summaryZh": "Qwen3.8 27B 是免费模型里最好的，没见过的单句和 GPT-4.1 mini 一样 38/40；gpt-oss-120b 常不按给的格式填。Groq 很快，但免费档 token 额度太紧，只适合当备用。",
    "summaryEn": "Qwen3.8 27B was the best free model, matching GPT-4.1 mini at 38/40 on unseen messages; gpt-oss-120b often ignored the schema. Groq is fast but its free token quota is too tight for more than a backup.",
    "results": [
      {
        "suite": "单句·没见过的 40 组（holdout-v1）",
        "model": "gpt-oss-120b",
        "score": "35/40"
      },
      {
        "suite": "单句·没见过的 40 组（holdout-v1）",
        "model": "Qwen3.8 27B",
        "score": "38/40"
      },
      {
        "suite": "真实对话 v3：2 组 / 15 轮",
        "model": "gpt-oss-120b",
        "score": "0/2 · 13/15"
      },
      {
        "suite": "真实对话 v3：2 组 / 15 轮",
        "model": "Qwen3.8 27B",
        "score": "1/2 · 14/15"
      },
      {
        "suite": "读公告：同一批 26 条，景点 F1",
        "model": "gpt-oss-120b",
        "score": "0.27"
      },
      {
        "suite": "读公告：同一批 26 条，景点 F1",
        "model": "Qwen3.8 27B",
        "score": "0.44",
        "note": "对照：GPT-4.1 mini 0.67，本机 4B 0.27"
      },
      {
        "suite": "一次调用（中位）",
        "model": "gpt-oss-120b / Qwen3.8 27B",
        "score": "0.5–0.7 秒 / 0.5–0.9 秒"
      }
    ]
  },
  {
    "date": "2026-10-20",
    "titleZh": "补齐 Gemini 和 MiniMax",
    "titleEn": "Filling in Gemini and MiniMax",
    "kind": "models",
    "summaryZh": "Gemini 3.5 Flash Lite 单句三组 25/25、39/40、17/17，没见过的 holdout 是所有模型里最好的。MiniMax 改了 schema 写法后真人对话 15/15 全对，推理开 high 读公告明显变好。",
    "summaryEn": "Gemini 3.5 Flash Lite scored 25/25, 39/40 and 17/17 on the three single-message suites, best of all models on unseen holdout. After a schema fix MiniMax got 15/15 on owner-trial turns, and high reasoning clearly improved its alert reading.",
    "results": [
      {
        "suite": "单句·开发集 25",
        "model": "Gemini 3.5 Flash Lite",
        "score": "25/25"
      },
      {
        "suite": "单句·没见过的 40（holdout-v1）",
        "model": "Gemini 3.5 Flash Lite",
        "score": "39/40"
      },
      {
        "suite": "各地写法 17",
        "model": "Gemini 3.5 Flash Lite",
        "score": "17/17"
      },
      {
        "suite": "真实对话 v3",
        "model": "MiniMax M3.1 Flash",
        "score": "2/2 组、15/15 轮",
        "note": "改成 anyOf 以后；每轮约 6.7 秒"
      },
      {
        "suite": "读公告 26 条（类型 / 景点 F1）",
        "model": "MiniMax M3.1 Flash，推理 low",
        "score": "85% / 0.50"
      },
      {
        "suite": "读公告 26 条（类型 / 景点 F1）",
        "model": "MiniMax M3.1 Flash，推理 high",
        "score": "92% / 0.67",
        "note": "没争议的 23 条景点 F1 0.86"
      }
    ]
  },
  {
    "date": "2026-10-20",
    "titleZh": "故障、混沌、漂移和裁判",
    "titleEn": "Faults, chaos, drift and judges",
    "kind": "robustness",
    "summaryZh": "让 30% 的模型调用失败，三组多轮对话都没有一轮报错，有备用模型时成绩和正常一样。新公告从要等 11–16.5 小时缩到几秒进行程。两个模型当裁判都靠得住，但偏向自己。",
    "summaryEn": "With 30% of model calls failing, no turn crashed, and with a backup model scores matched normal. New alerts now reach itineraries in seconds instead of 11–16.5 hours. Both LLM judges were reliable but favored themselves.",
    "results": [
      {
        "suite": "混沌 · 多轮 v1（20 组 / 52 轮）",
        "model": "30% 失败、没有备用模型",
        "score": "14/20 · 44/52",
        "note": "正常 20/20 · 52/52"
      },
      {
        "suite": "混沌 · 多轮 v1（20 组 / 52 轮）",
        "model": "30% 失败、有备用模型",
        "score": "20/20 · 52/52"
      },
      {
        "suite": "混沌 · 多轮 v2（15 组 / 34 轮）",
        "model": "30% 失败、没有备用模型",
        "score": "6/15 · 21/34",
        "note": "正常 14/15 · 33/34"
      },
      {
        "suite": "混沌 · 多轮 v2（15 组 / 34 轮）",
        "model": "30% 失败、有备用模型",
        "score": "14/15 · 33/34"
      },
      {
        "suite": "漂移 · 新公告多久进行程",
        "model": "以前的做法 / 现在的做法",
        "score": "11–16.5 小时 / ≈ 3.7–5.3 秒",
        "note": "最晚的情况最多 6 小时"
      },
      {
        "suite": "裁判打分 · 每句都有依据 / 平均分",
        "model": "Qwen3.5 4B（Gemini 当裁判 / GPT-4.1 mini 当裁判）",
        "score": "22/25 · 4.76 / 24/25 · 4.92"
      },
      {
        "suite": "裁判打分 · 每句都有依据 / 平均分",
        "model": "Gemini 3.5 Flash Lite（Gemini 当裁判 / GPT-4.1 mini 当裁判）",
        "score": "27/28 · 4.89 / 24/28 · 4.86"
      },
      {
        "suite": "裁判打分 · 每句都有依据 / 平均分",
        "model": "GPT-4.1 mini（Gemini 当裁判 / GPT-4.1 mini 当裁判）",
        "score": "25/26 · 4.92 / 26/26 · 5.00"
      },
      {
        "suite": "裁判校准题抓到",
        "model": "Gemini 3.5 Flash Lite / GPT-4.1 mini",
        "score": "23/24 / 24/24"
      }
    ]
  },
  {
    "date": "2026-10-22",
    "titleZh": "找资料：关键词 vs 向量",
    "titleEn": "Retrieval: keyword vs vector",
    "kind": "retrieval",
    "summaryZh": "48 个问题比三种找资料的办法：点名的问题都一样好，英文和不点名的问题向量检索明显更好。当时因为线上跑不了嵌入模型，照旧用关键词。",
    "summaryEn": "48 questions compared three retrieval methods: equal on named questions, but vector search was clearly better for English and descriptive ones. Keywords stayed in production because the embedding model could not run online yet.",
    "results": [
      {
        "suite": "全部 48 · R@5 / R@1",
        "model": "关键词 BM25（现在用的）",
        "score": "0.81 / 0.46",
        "note": "MRR@10 0.60；10 ms"
      },
      {
        "suite": "全部 48 · R@5 / R@1",
        "model": "向量（bge-m3）",
        "score": "0.92 / 0.56",
        "note": "MRR@10 0.72；37 ms"
      },
      {
        "suite": "全部 48 · R@5 / R@1",
        "model": "混合（RRF）",
        "score": "0.90 / 0.52",
        "note": "MRR@10 0.68；47 ms"
      },
      {
        "suite": "英文的 16 · R@5 / R@1",
        "model": "关键词 BM25",
        "score": "0.56 / 0.19"
      },
      {
        "suite": "英文的 16 · R@5 / R@1",
        "model": "向量（bge-m3）",
        "score": "0.81 / 0.31"
      },
      {
        "suite": "英文的 16 · R@5 / R@1",
        "model": "混合（RRF）",
        "score": "0.75 / 0.31"
      }
    ]
  },
  {
    "date": "2026-10-27",
    "titleZh": "引擎对照 73 条真实行程",
    "titleEn": "Engine vs 73 real itineraries",
    "kind": "engine",
    "summaryZh": "拿 73 条博主和 NPS 官方的真实行程对照排行程引擎：有名的景点 86% 都排了；引擎“正常”节奏和 NPS 官方几乎一样，比博主满得多。",
    "summaryEn": "The trip engine was compared with 73 real itineraries from creators and NPS: it included 86% of well-known stops; its normal pace matches NPS recommendations but is much busier than creators'.",
    "results": [
      {
        "suite": "真人去了的景点，引擎也排了",
        "model": "行程引擎",
        "score": "67%",
        "note": "博主 76%、NPS 58%"
      },
      {
        "suite": "其中有名的（必去或园内热度前 5）",
        "model": "行程引擎",
        "score": "86%（210 / 243）"
      },
      {
        "suite": "每天几站：真人 / “正常” / “轻松”",
        "model": "博主",
        "score": "3.3 / 5.6 / 4.9"
      },
      {
        "suite": "每天几站：真人 / “正常” / “轻松”",
        "model": "NPS",
        "score": "5.0 / 5.0 / 4.1"
      },
      {
        "suite": "真人的整天行程按我们的规则排，出现“去不了、赶不上”的",
        "model": "行程引擎的规则",
        "score": "3 / 40 条"
      }
    ]
  },
  {
    "date": "2026-10-28",
    "titleZh": "新增“悠闲”节奏",
    "titleEn": "Adding a “leisurely” pace",
    "kind": "engine",
    "summaryZh": "博主比“轻松”还慢，于是加了最慢一档“悠闲”（一天最多四站）。排出来每天 3.5 站、站间开车 74 分钟，和博主的 3.3 站、68 分钟接近。",
    "summaryEn": "Creators were slower than even the relaxed pace, so a leisurely pace (max four stops a day) was added. It yields 3.5 stops and 74 minutes between stops per day, close to creators' 3.3 and 68.",
    "results": [
      {
        "suite": "博主（31 条整天的）· 每天几站 / 站间开车（分钟）",
        "model": "真人",
        "score": "3.3 / 68"
      },
      {
        "suite": "博主（31 条整天的）· 每天几站 / 站间开车（分钟）",
        "model": "正常",
        "score": "5.6 / 132"
      },
      {
        "suite": "博主（31 条整天的）· 每天几站 / 站间开车（分钟）",
        "model": "轻松",
        "score": "4.9 / 116"
      },
      {
        "suite": "博主（31 条整天的）· 每天几站 / 站间开车（分钟）",
        "model": "悠闲",
        "score": "3.5 / 74"
      },
      {
        "suite": "NPS 官方（9 条整天的）· 每天几站 / 站间开车（分钟）",
        "model": "真人",
        "score": "5.0 / 130"
      },
      {
        "suite": "NPS 官方（9 条整天的）· 每天几站 / 站间开车（分钟）",
        "model": "悠闲",
        "score": "3.0 / 59"
      }
    ]
  },
  {
    "date": "2026-10-28",
    "titleZh": "按论文方法给行程打分",
    "titleEn": "Plan quality, paper-style scoring",
    "kind": "engine",
    "summaryZh": "照 TravelPlanner 和 TripCraft 两篇论文的方法给 110 条固定请求打分。修之前没过的 5 条都是真问题，修完最终通过率 100%。",
    "summaryEn": "110 fixed requests were scored with the TravelPlanner and TripCraft methods. The 5 failures before the fix were all real bugs; after fixing, the final pass rate was 100%.",
    "results": [
      {
        "suite": "最终通过率（常识约束、用户硬约束都全过）",
        "model": "行程引擎，修之前",
        "score": "95.5%（105 / 110）"
      },
      {
        "suite": "最终通过率（常识约束、用户硬约束都全过）",
        "model": "行程引擎，修之后",
        "score": "100%（110 / 110）"
      },
      {
        "suite": "时间分",
        "model": "修之前 / 修之后",
        "score": "0.742 / 0.770"
      },
      {
        "suite": "空间分",
        "model": "修之前 / 修之后",
        "score": "0.998 / 0.998"
      },
      {
        "suite": "顺序分",
        "model": "修之前 / 修之后",
        "score": "0.972 / 0.978"
      },
      {
        "suite": "同行的人",
        "model": "修之前 / 修之后",
        "score": "0.851 / 0.851"
      }
    ]
  },
  {
    "date": "2026-10-28",
    "titleZh": "DeepSeek 和新的免费模型",
    "titleEn": "DeepSeek and a new free model",
    "kind": "models",
    "summaryZh": "DeepSeek Flash 单句比 Gemini 差一截，多轮对话差不多，全套才 $0.08，定为付费备用。OpenRouter 的免费模型换成 Nemotron 3.5 Super（各地写法 16/17）。",
    "summaryEn": "DeepSeek Flash trailed Gemini on single messages but was similar on multi-turn, costing $0.08 for the full suite, so it became the paid backup. The free OpenRouter model became Nemotron 3.5 Super (16/17 on regional cases).",
    "results": [
      {
        "suite": "单句·开发集 25",
        "model": "DeepSeek Flash",
        "score": "23/25"
      },
      {
        "suite": "单句·没见过的 40",
        "model": "DeepSeek Flash",
        "score": "34/40",
        "note": "Gemini 39/40"
      },
      {
        "suite": "各地写法 17",
        "model": "DeepSeek Flash",
        "score": "16/17"
      },
      {
        "suite": "多轮 v1 · 52 轮",
        "model": "DeepSeek Flash",
        "score": "51/52"
      },
      {
        "suite": "多轮 v2 · 34 轮",
        "model": "DeepSeek Flash",
        "score": "32/34"
      },
      {
        "suite": "真实对话 v3 · 15 轮",
        "model": "DeepSeek Flash",
        "score": "15/15"
      },
      {
        "suite": "花费",
        "model": "DeepSeek Flash",
        "score": "全套 268 次 $0.08",
        "note": "上限，约 ¥0.58"
      },
      {
        "suite": "各地写法 17 句",
        "model": "Nemotron 3.5 Super VL（免费版）",
        "score": "16/17",
        "note": "编造 0；中位 4.9 秒"
      },
      {
        "suite": "各地写法 17 句",
        "model": "dots-3-note-preview",
        "score": "13/17",
        "note": "编造 2；中位 5.1 秒"
      }
    ]
  },
  {
    "date": "2026-10-28",
    "titleZh": "70 组新的没见过样例",
    "titleEn": "Held-out v2: 70 unseen cases",
    "kind": "intake",
    "summaryZh": "另写 70 组没见过的样例（约四成故意刁难），先提交期望再跑：第一次 61/70，没过的 9 组都是规则漏了、不是模型的错。修完 70/70，之后算开发集。",
    "summaryEn": "70 new unseen cases (about 40% adversarial) were committed before running: 61/70 on the first run, with all 9 failures due to rule gaps, not the model. After fixes it reached 70/70 and now counts as a dev set.",
    "results": [
      {
        "suite": "holdout-v2（70 组）",
        "model": "Qwen3.5 4B，冻结时的代码",
        "score": "61/70",
        "note": "追问类型 100%；排出行程 51/51；编造 1"
      },
      {
        "suite": "holdout-v2（70 组）",
        "model": "Qwen3.5 4B，改了规则以后（回放）",
        "score": "70/70",
        "note": "排出行程 58/58"
      },
      {
        "suite": "其他七组门禁",
        "model": "Qwen3.5 4B 回放",
        "score": "25/25、37/40、17/17、20 组 52 轮、14 组 33 轮、1 组 14 轮、公告 0.755",
        "note": "不变"
      }
    ]
  },
  {
    "date": "2026-11-04",
    "titleZh": "代码检查查出正则 bug",
    "titleEn": "Linter caught two regex bugs",
    "kind": "conversation",
    "summaryZh": "Ruff 发现两个正则里写进了退格字符，从来没匹配上过。改好、补录 30 次调用以后，多轮对话 v2 从 14 组 / 33 轮升到 15 组 / 34 轮。",
    "summaryEn": "Ruff found backspace characters in two regexes that had never matched. After fixing and re-recording 30 calls, multi-turn v2 rose from 14 groups / 33 turns to 15 / 34.",
    "results": [
      {
        "suite": "多轮对话 v1",
        "model": "修之前 / 修好、补录以后",
        "score": "20 组 / 52 轮 → 20 组 / 52 轮"
      },
      {
        "suite": "多轮对话 v2",
        "model": "修之前 / 修好、补录以后",
        "score": "14 组 / 33 轮 → 15 组 / 34 轮",
        "note": "基线抬到 15 / 34"
      },
      {
        "suite": "多轮对话 v3",
        "model": "修之前 / 修好、补录以后",
        "score": "1 组 / 14 轮 → 1 组 / 14 轮"
      },
      {
        "suite": "其他五组",
        "model": "修好、补录以后",
        "score": "25/25、37/40、70/70、17/17、公告 0.755 / 0.333",
        "note": "不变"
      }
    ]
  },
  {
    "date": "2026-11-10",
    "titleZh": "线上向量检索与 A/B/C",
    "titleEn": "Online vector search, A/B/C",
    "kind": "retrieval",
    "summaryZh": "换成线上能用的 Gemini 嵌入 + Neon 存向量：gemini-embedding-2 前 5 条全对、第 1 条就对 0.88。回答问题时给按意思找的资料，答到点子上从 0.73 升到 0.94，英文问题从 0.44 升到 0.88。",
    "summaryEn": "With Gemini embeddings stored in Neon, gemini-embedding-2 hit R@5 1.00 and R@1 0.88. Feeding semantically retrieved context raised on-point answers from 0.73 to 0.94, and English questions from 0.44 to 0.88.",
    "results": [
      {
        "suite": "找资料 · 全部 48 · R@5 / R@1",
        "model": "关键词 BM25（原来线上用的）",
        "score": "0.81 / 0.46",
        "note": "MRR@10 0.60"
      },
      {
        "suite": "找资料 · 全部 48 · R@5 / R@1",
        "model": "按意思 · gemini-embedding-001",
        "score": "1.00 / 0.73",
        "note": "MRR@10 0.85"
      },
      {
        "suite": "找资料 · 全部 48 · R@5 / R@1",
        "model": "按意思 · gemini-embedding-2",
        "score": "1.00 / 0.88",
        "note": "MRR@10 0.93"
      },
      {
        "suite": "找资料 · 全部 48 · R@5 / R@1",
        "model": "两样合起来（RRF）· 2",
        "score": "0.92 / 0.60",
        "note": "MRR@10 0.76"
      },
      {
        "suite": "回答问题 · 答到点子上",
        "model": "A 不给资料",
        "score": "0.00"
      },
      {
        "suite": "回答问题 · 答到点子上",
        "model": "B 关键词",
        "score": "0.73"
      },
      {
        "suite": "回答问题 · 答到点子上",
        "model": "C 按意思（gemini-embedding-2）",
        "score": "0.94"
      },
      {
        "suite": "回答问题 · 英文问题答到点子上",
        "model": "A / B / C",
        "score": "0.00 / 0.44 / 0.88"
      }
    ]
  },
  {
    "date": "2026-11-14",
    "titleZh": "会自己查的 agent",
    "titleEn": "Search agent vs single lookup",
    "kind": "agent",
    "summaryZh": "44 道题、同一个模型：会自己分步查的 agent 36/44，找一次就答只有 19/44。差在一句问两件事、要接着查、按季节比公园这几类；代价是调用多、慢一些。",
    "summaryEn": "On 44 questions with the same model, the step-by-step search agent got 36/44 versus 19/44 for single lookup, winning on multi-part, chained and seasonal questions, at the cost of more calls and latency.",
    "results": [
      {
        "suite": "agent-v1 全对（44 题）",
        "model": "qa（找一次就答）",
        "score": "19 / 44"
      },
      {
        "suite": "agent-v1 全对（44 题）",
        "model": "agent（自己查）",
        "score": "36 / 44"
      },
      {
        "suite": "multi（一句话问两件事）",
        "model": "qa / agent",
        "score": "2 / 8 / 6 / 8"
      },
      {
        "suite": "chain（后一步用前一步）",
        "model": "qa / agent",
        "score": "1 / 6 / 5 / 6"
      },
      {
        "suite": "season（按季节比公园）",
        "model": "qa / agent",
        "score": "1 / 9 / 6 / 9"
      },
      {
        "suite": "adversarial（刁难的）",
        "model": "qa / agent",
        "score": "4 / 5 / 5 / 5"
      },
      {
        "suite": "每题耗时中位数",
        "model": "qa / agent",
        "score": "1.4 s / 3.6 s"
      },
      {
        "suite": "每千题（付费档标价折算）",
        "model": "qa / agent",
        "score": "$0.52 / $1.35"
      }
    ]
  },
  {
    "date": "2026-11-14",
    "titleZh": "agent 提示词 v2",
    "titleEn": "Agent prompt v2",
    "kind": "agent",
    "summaryZh": "修了几处代码、换了提示词 agent_v2 后重录：agent 从 36/44 升到 38/44，上次没过的 5 题修好；剩下 6 题里 3 题是判分偏严。",
    "summaryEn": "After code fixes and prompt agent_v2, the agent rose from 36/44 to 38/44, fixing the 5 earlier misses; 3 of the remaining 6 failures were overly strict grading.",
    "results": [
      {
        "suite": "agent-v1 全对（44 题）",
        "model": "qa",
        "score": "19 / 44"
      },
      {
        "suite": "agent-v1 全对（44 题）",
        "model": "agent（agent_v1）",
        "score": "36 / 44"
      },
      {
        "suite": "agent-v1 全对（44 题）",
        "model": "agent（agent_v2）",
        "score": "38 / 44"
      },
      {
        "suite": "chain",
        "model": "agent（agent_v2）",
        "score": "6 / 6"
      },
      {
        "suite": "season",
        "model": "agent（agent_v2）",
        "score": "8 / 9"
      },
      {
        "suite": "mixed",
        "model": "agent（agent_v2）",
        "score": "4 / 4"
      },
      {
        "suite": "multi",
        "model": "agent（agent_v2）",
        "score": "4 / 8"
      },
      {
        "suite": "每题耗时中位数",
        "model": "agent（agent_v2）",
        "score": "3.4 s（最长 7.8 s）"
      }
    ]
  },
  {
    "date": "2026-11-14",
    "titleZh": "修日期和“几月最好”",
    "titleEn": "Fixing past dates and best month",
    "kind": "agent",
    "summaryZh": "没写年份的过去日期改按下一次算，只重录受影响的 10 题。总分还是 38/44：A05 修好，D04 仍只说一个月，D08 因判分偏严新错。",
    "summaryEn": "Past dates without a year now roll to the next occurrence; only 10 affected questions were re-recorded. The total stayed 38/44: A05 fixed, D04 still named only one month, D08 newly failed on strict grading.",
    "results": [
      {
        "suite": "agent-v1 全对（44 题）",
        "model": "qa",
        "score": "19 / 44"
      },
      {
        "suite": "agent-v1 全对（44 题）",
        "model": "agent（这次）",
        "score": "38 / 44"
      },
      {
        "suite": "single",
        "model": "agent（这次）",
        "score": "6 / 6"
      },
      {
        "suite": "season",
        "model": "agent（这次）",
        "score": "7 / 9"
      },
      {
        "suite": "每题耗时中位数",
        "model": "agent（这次）",
        "score": "3.3 s（最长 6.5 s）"
      }
    ]
  },
  {
    "date": "2026-11-16",
    "titleZh": "按代码审阅修几处",
    "titleEn": "Fixes from code review",
    "kind": "agent",
    "summaryZh": "按代码审阅意见修了气温说法、营地规则和出处检查，重录 9 题：agent 升到 39/44，剩下 5 题里 3 题是判分偏严。",
    "summaryEn": "Review-driven fixes to temperature wording, campground rules and citation checks, with 9 questions re-recorded, lifted the agent to 39/44; 3 of the 5 remaining failures were strict grading.",
    "results": [
      {
        "suite": "agent-v1 全对（44 题）",
        "model": "qa",
        "score": "19 / 44"
      },
      {
        "suite": "agent-v1 全对（44 题）",
        "model": "agent（这次）",
        "score": "39 / 44"
      },
      {
        "suite": "season",
        "model": "agent（这次）",
        "score": "8 / 9"
      },
      {
        "suite": "每题耗时中位数",
        "model": "agent（这次）",
        "score": "3.3 s（最长 6.7 s）"
      }
    ]
  },
  {
    "date": "2026-11-16",
    "titleZh": "再修 3 处，成绩不变",
    "titleEn": "Three more fixes, same score",
    "kind": "agent",
    "summaryZh": "按审阅意见再修 3 处，只重录 B04 一题，成绩不变。",
    "summaryEn": "Three more review fixes; only question B04 was re-recorded, and scores were unchanged.",
    "results": [
      {
        "suite": "agent-v1 全对（44 题）",
        "model": "agent（自己查）",
        "score": "39 / 44"
      },
      {
        "suite": "agent-v1 全对（44 题）",
        "model": "qa（找一次就答）",
        "score": "19 / 44"
      }
    ]
  },
  {
    "date": "2026-11-22",
    "titleZh": "门禁拦不拦得住变差",
    "titleEn": "Do the gates catch regressions?",
    "kind": "robustness",
    "summaryZh": "故意放进更差的提示词、更弱的模型和坏数据，看门禁拦不拦：9 种情况全部符合预期，5 秒跑完。",
    "summaryEn": "Worse prompts, weaker models and corrupted data were deliberately injected to test the gates: all 9 cases behaved as expected, in 5 seconds.",
    "results": [
      {
        "suite": "回归注入",
        "model": "全部 9 种",
        "score": "9 / 9 符合预期"
      },
      {
        "suite": "对照：现在的默认组合",
        "model": "本机 Qwen3.5 4B 录音、默认提示词",
        "score": "放行",
        "note": "25 ≥ 基线 25"
      },
      {
        "suite": "更差的提示词",
        "model": "intake v2",
        "score": "拦下",
        "note": "24 < 基线 25"
      },
      {
        "suite": "更弱的模型",
        "model": "Qwen3 4B",
        "score": "拦下",
        "note": "20 < 基线 25"
      },
      {
        "suite": "更弱的模型",
        "model": "Qwen3.5 9B",
        "score": "拦下",
        "note": "24 < 基线 25"
      },
      {
        "suite": "坏数据（4 种：字段改名、时区写错、机场不在表里、景点 id 重复）",
        "model": "数据快照校验",
        "score": "拦下",
        "note": "4 种都拦下"
      }
    ]
  },
  {
    "date": "2026-11-22",
    "titleZh": "让模型自己排行程行不行",
    "titleEn": "Can the model plan trips itself?",
    "kind": "engine",
    "summaryZh": "30 条请求比三种排法：只靠模型 40% 全对且 41% 的站对不上景点库；给了资料 63%，对得上但不守规矩；完整系统（确定的引擎）83%，几乎不花时间和钱。",
    "summaryEn": "30 requests, three ways to plan: model only was 40% clean with 41% of stops unverifiable; model plus data 63%, verifiable but rule-breaking; the full system with the deterministic engine 83%, near-instant and free.",
    "results": [
      {
        "suite": "全对的行程",
        "model": "A 只靠模型 / B 模型 + 景点资料 / C 完整系统",
        "score": "40% / 63% / 83%"
      },
      {
        "suite": "每条行程几处违规",
        "model": "A / B / C",
        "score": "1.03 / 0.80 / 0.27"
      },
      {
        "suite": "每 100 站几处违规",
        "model": "A / B / C",
        "score": "11.7 / 7.8 / 2.6"
      },
      {
        "suite": "每 100 站有几站对不上景点库",
        "model": "A / B / C",
        "score": "41 / 0 / 0"
      },
      {
        "suite": "耗时中位数 / p95",
        "model": "A / B / C",
        "score": "1.5 s / 2.2 s；1.5 s / 2.2 s；0.03 s / 0.18 s"
      },
      {
        "suite": "每千次花费（付费档标价折算）",
        "model": "A / B / C",
        "score": "$0.40 / $0.81 / $0"
      }
    ]
  },
  {
    "date": "2026-11-22",
    "titleZh": "多 agent 对照调度员",
    "titleEn": "Multi-agent vs dispatcher",
    "kind": "soft",
    "summaryZh": "30 道“软要求”题（休息日、开车上限、只住一家……）：加了规划 agent 和审查 agent 以后，4B 从 7/30 到 25/30，Gemini 从 7/30 到 26/30，没有一题变差；代价是调用多约一半、每题多几秒。",
    "summaryEn": "On 30 soft-requirement tasks (rest days, driving caps, one hotel…), adding planner and reviewer agents raised 4B from 7/30 to 25/30 and Gemini from 7/30 to 26/30 with no regressions, at about 50% more calls and a few extra seconds each.",
    "results": [
      {
        "suite": "soft-v1（第 3 次，正式）",
        "model": "Qwen3.5 4B · 调度员",
        "score": "7/30",
        "note": "34 条检查做到 11；中位 1.1 s"
      },
      {
        "suite": "soft-v1（第 3 次，正式）",
        "model": "Qwen3.5 4B · 多 agent",
        "score": "25/30",
        "note": "34 条检查做到 30；中位 3.7 s"
      },
      {
        "suite": "soft-v1（第 3 次，正式）",
        "model": "Gemini 3.5 Flash Lite · 调度员",
        "score": "7/30",
        "note": "34 条检查做到 11；中位 1.1 s"
      },
      {
        "suite": "soft-v1（第 3 次，正式）",
        "model": "Gemini 3.5 Flash Lite · 多 agent",
        "score": "26/30",
        "note": "34 条检查做到 31；中位 5.5 s"
      },
      {
        "suite": "soft-v1（第 1 次，评测不回答追问）",
        "model": "4B 调度员 / 4B 多 agent / Gemini 调度员 / Gemini 多 agent",
        "score": "0/30 / 3/30 / 0/30 / 0/30"
      },
      {
        "suite": "soft-v1（第 2 次，有 bug）",
        "model": "4B 调度员 / 4B 多 agent / Gemini 调度员 / Gemini 多 agent",
        "score": "9/30 / 23/30 / 9/30 / 9/30"
      }
    ]
  },
  {
    "date": "2026-11-22",
    "titleZh": "本机换更大的 MoE 模型",
    "titleEn": "Larger local MoE models",
    "kind": "models",
    "summaryZh": "本机试了 Qwen3.5 35B-A3B 和 gpt-oss 20B：35B-A3B 在要理解、要推理的几组明显更好，但慢 2–6 倍；gpt-oss 20B 不合适。",
    "summaryEn": "Locally tested Qwen3.5 35B-A3B and gpt-oss 20B: 35B-A3B was clearly better on reasoning-heavy suites but 2–6× slower; gpt-oss 20B was not suitable.",
    "results": [
      {
        "suite": "回答问题 · search agent 自己查",
        "model": "Qwen3.5 4B / Qwen3.5 35B-A3B / gpt-oss 20B",
        "score": "27/44 / 33/44 / 17/44"
      },
      {
        "suite": "软要求 · 多 agent",
        "model": "Qwen3.5 4B / Qwen3.5 35B-A3B / gpt-oss 20B",
        "score": "25/30 / 27/30 / 27/30"
      },
      {
        "suite": "读 NPS 公告 · 日期对的（模型）",
        "model": "Qwen3.5 4B / Qwen3.5 35B-A3B / gpt-oss 20B",
        "score": "16/24 / 20/24 / 10/24"
      },
      {
        "suite": "读 NPS 公告 · 类型准确率（模型）",
        "model": "Qwen3.5 4B / Qwen3.5 35B-A3B / gpt-oss 20B",
        "score": "76% / 82% / 65%"
      },
      {
        "suite": "单句理解 · 没见过的 v1",
        "model": "Qwen3.5 4B / Qwen3.5 35B-A3B / gpt-oss 20B",
        "score": "37/40 / 38/40 / 36/40"
      },
      {
        "suite": "多轮对话 v1（组全对）",
        "model": "Qwen3.5 4B / Qwen3.5 35B-A3B / gpt-oss 20B",
        "score": "20/20 / 19/20 / 18/20"
      },
      {
        "suite": "软要求 · 多 agent 每题耗时中位数",
        "model": "Qwen3.5 4B / Qwen3.5 35B-A3B / gpt-oss 20B",
        "score": "3.7 s / 11.8 s / 18.5 s"
      }
    ]
  },
  {
    "date": "2026-11-22",
    "titleZh": "多 agent 打开后门禁查出问题",
    "titleEn": "Gates caught a multi-agent issue",
    "kind": "soft",
    "summaryZh": "多 agent 默认打开后，多轮对话门禁变差 4 组：规划 agent 在普通对话里硬摘出要求。加了一道“原话要说到这件事”的检查，读错的 25 条都拦下，真要求一条没丢，门禁恢复。",
    "summaryEn": "Turning multi-agent on by default cost 4 groups on the multi-turn gates because the planner invented requirements in ordinary chats. A check that the quoted words must mention the requirement blocked all 25 misreads without losing any real one, restoring the gates.",
    "results": [
      {
        "suite": "conversation-v1（多 agent 打开、修之前）",
        "model": "Qwen3.5 4B",
        "score": "20 → 18 组"
      },
      {
        "suite": "conversation-v2（多 agent 打开、修之前）",
        "model": "Qwen3.5 4B",
        "score": "15 → 13 组"
      },
      {
        "suite": "soft-v1 多 agent（修了以后，回放）",
        "model": "4B / Gemini / 35B-A3B / gpt-oss",
        "score": "25/30 / 26/30 / 27/30 / 27/30",
        "note": "和修之前一样"
      },
      {
        "suite": "conversation-v1（多 agent 打开、修了以后）",
        "model": "4B（CI 门禁） / 35B-A3B",
        "score": "20/20 / 20/20",
        "note": "35B 关着时 19"
      },
      {
        "suite": "conversation-v2（多 agent 打开、修了以后）",
        "model": "4B（CI 门禁） / 35B-A3B",
        "score": "15/15 / 14/15"
      },
      {
        "suite": "conversation-v3（多 agent 打开、修了以后）",
        "model": "4B（CI 门禁） / 35B-A3B",
        "score": "1/2 / 1/2"
      },
      {
        "suite": "片段检查核对",
        "model": "四个模型摘出的 92 条片段",
        "score": "读错的 25 条都拦下，真要求一条没丢"
      }
    ]
  },
{
    "date": "2026-11-22",
    "titleZh": "补对照题、修 S07 和 S13",
    "titleEn": "Control cases, S07 and S13 fixed",
    "kind": "soft",
    "summaryZh": "补了 20 道没有软要求的对照题（一半英文），三个本机模型和 Gemini 都 20/20、没有无中生有（4B 编了 20 条、35B 编了 3 条，都被代码核对拦下）。修了天数按原话认、一天一个片区先挑片区再整片分天、园里的地方不当成公园以后，soft-v1 多 agent 4B 27、35B 29、gpt-oss 27、Gemini 28。",
    "summaryEn": "Added 20 control cases with no soft wishes (half English): all three local models and Gemini scored 20/20 with nothing invented (4B made up 20 wishes and 35B 3, all caught by the code check). After reading day numbers from the user's words, choosing areas first for one-area-a-day, and not treating places inside a park as parks, soft-v1 multi-agent reached 4B 27, 35B 29, gpt-oss 27, Gemini 28.",
    "results": [
      {
        "suite": "soft-v2 对照题",
        "model": "4B / 35B-A3B / gpt-oss / Gemini · 调度员",
        "score": "20/20 · 20/20 · 20/20 · 20/20"
      },
      {
        "suite": "soft-v2 对照题",
        "model": "4B / 35B-A3B / gpt-oss / Gemini · 多 agent",
        "score": "20/20 · 20/20 · 20/20 · 20/20"
      },
      {
        "suite": "soft-v2 模型编的、代码拦下",
        "model": "4B / 35B-A3B / gpt-oss / Gemini",
        "score": "20 · 3 · 0 · 0"
      },
      {
        "suite": "soft-v1 多 agent（修了以后，回放）",
        "model": "4B / 35B-A3B / gpt-oss / Gemini",
        "score": "27 · 29 · 27 · 28"
      },
      {
        "suite": "soft-v1 调度员",
        "model": "四个模型",
        "score": "7/30"
      }
    ]
  }
];
