"use client";

/**
 * 后台的架构图（11-20 仓库主人要的：不只是模型调用，整个网站、search agent、开发到上线都画出来）。
 * 四张，上面切换：整体架构 / 一句话怎么走（原来的模型调用架构）/ search agent 的一圈 / 开发到上线。
 * 纯 SVG，中英文两套字（后台英文版给老师看）；颜色和框沿用 architecture-diagram.tsx：
 * 砂岩红框调模型、黑框是确定的代码、绿框是排行程引擎（不用模型）
 */

import { useState } from "react";
import { ArchitectureDiagram, Arrow, Box, CLAY, INK, Markers, MUTE, PINE, type AdminLang } from "./architecture-diagram";

type Tab = "overview" | "turn" | "agent" | "delivery";

const TABS: Record<AdminLang, Record<Tab, string>> = {
  zh: { overview: "整体架构", turn: "一句话怎么走", agent: "search agent 的一圈", delivery: "开发到上线" },
  en: { overview: "System overview", turn: "One message, step by step", agent: "Search agent loop", delivery: "From PR to production" },
};

const TEXT = {
  zh: {
    overview: {
      user: ["用户", "浏览器 · 手机装到主屏", "看过的页面离线也能开"],
      vercel: "Vercel · Next.js 16 网站",
      pages: ["页面（服务端渲染）", "公园、行程、什么时候去、榜单、价格……"],
      engine: ["行程引擎（在浏览器里跑）", "排行程、时间线、预算；行程存在本机"],
      apis: ["数据接口", "/api/alerts · weather · prices · services"],
      relay: ["Copilot 中转 · 后台", "/api/copilot/chat · plan · admin · tts"],
      guard: "访问密码（proxy）· 账号 /api/auth、/api/me",
      modal: "Modal · Copilot（staging 和正式两个环境）",
      service: ["Copilot 服务", "Python · FastAPI · LangGraph · 口令 + 限流"],
      models: ["模型", "Gemini 先，出错依次换"],
      tsEngine: ["同一份引擎", "node：plan_trip、8 种查询"],
      volume: ["Volume（Modal 的存储）", "对话存档 · 计费总账 · 运行日志"],
      staging: "staging：合进 main 自动部署，配 Vercel Preview",
      prod: "正式：发版（copilot-v*）才部署，配 Vercel Production",
      neon: ["Neon Postgres", "账号（Neon Auth）· 行程和对话", "资料向量（pgvector，Copilot 用）"],
      repo: ["仓库里的数据（src/data）", "脚本预先生成：景点、车程、步道、", "往年天气、照片、营地……"],
      live: ["实时外部接口", "NPS 公告和门票 · Open-Meteo · NWS", "AAA 油价 · Google Flights · DeepL"],
      actions: ["GitHub Actions 定时", "每晚读公告 → data/alerts-live", "每周营地对照 · 每月数据保质期"],
      foot: "没有自己的服务器：网站是 Vercel 上的 Next.js，Copilot 是 Modal 上按秒计费的一台小机器，数据大多是脚本从开放数据预先生成、提交进仓库的。",
    },
    agent: {
      question: ["问题和上下文", "原话 + 调度员补全的问法", "今天的日期 · 已经排好的行程"],
      step: ["模型这一步", "说要查什么（一步最多 3 个）", "或者直接回答"],
      check: ["代码核对", "地名 → 网站的 id · 日期查真假", "过去的日子换成下一次 · 去重"],
      tools: ["网站查询工具（node）", "开没开 · 车程 · 找景点 · 季节", "门票 · 日出日落 · 预约 · 人多不多"],
      notes: ["网站资料", "按意思找（Neon），出错退回关键词"],
      results: ["查到的结果", "编号 [1] [2] …，没查成的写原因"],
      lookup: "要查",
      loop: "看了结果再决定：再查，还是回答",
      limits: "最多 4 次模型、20 秒；最后一次只能回答",
      answer: "回答",
      verify: ["检查回答", "数字、时间要在查到的结果里", "出处有效 · 不说工具名 · 说没写就不附出处"],
      reply: ["回复", "带出处（资料：……）"],
      passed: "过了",
      failed: "没过",
      fallback: ["没过、出错、超时", "查到了东西：直接给查到的结果", "什么都没查到：退回“找一次就答”"],
      foot1: "开关是 Modal Secret 里的 COPILOT_QA_AGENT=1，不开就是“找一次就答”（代码按关键词认出查什么、找一次资料就答）。评测 44 题：自己查 39，找一次就答 19。",
      foot2: "每一步都记进日志：下面“最近几轮”的备注里写着走了几步、每步查了什么、没查成的原因、为什么停下。",
    },
    delivery: {
      branch: ["开分支、改代码", "提交写中英文"],
      pr: ["开 PR", "说明中英文"],
      checks: ["三项必需的检查", "网站：lint · 类型 · 测试", "Copilot：Ruff · pytest · 十组回放门禁", "镜像：构建 · 排行程 · 镜像里 8 种查询"],
      side: ["旁边还有（不拦合并）", "CodeRabbit 审代码 · 评测成绩贴到 PR", "Vercel Preview：连 Modal staging"],
      merge: ["合并进 main", "仓库主人点"],
      prod: ["Vercel Production", "网站自动上线"],
      staging: ["Modal staging", "Copilot 自动部署", "镜像 main-<提交>"],
      tag: ["打 tag copilot-v*", "做完一个大功能发一版"],
      release: ["Copilot release", "检查版本号 · 测试 · 十组门禁 · 镜像冒烟", "推到 GHCR · 拉回来再测 · GitHub Release"],
      main: ["Modal main（正式）", "部署测过的同一个镜像", "配 Vercel Production"],
      after: "合并以后",
      foot1: "预览配预览：Vercel Preview ↔ Modal staging；正式配正式：Vercel Production ↔ Modal main（Copilot 只在发版时更新）。",
      foot2: "回滚：Modal 上重新部署上一个 tag（Actions 里的 “Deploy Copilot to Modal”）；只关掉一个功能就删掉它的开关，比如 COPILOT_QA_AGENT。",
    },
  },
  en: {
    overview: {
      user: ["User", "Browser · phone home screen", "Viewed pages work offline"],
      vercel: "Vercel · Next.js 16 website",
      pages: ["Pages (server-rendered)", "Parks, trip, when to go, rankings, prices…"],
      engine: ["Trip planner (runs in the browser)", "Plans, timelines, budget; trip kept locally"],
      apis: ["Data APIs", "/api/alerts · weather · prices · services"],
      relay: ["Copilot relay · dashboard", "/api/copilot/chat · plan · admin · tts"],
      guard: "Site password (proxy) · accounts at /api/auth, /api/me",
      modal: "Modal · Copilot (staging and production)",
      service: ["Copilot service", "Python · FastAPI · LangGraph · token + rate limits"],
      models: ["Models", "Gemini first, then fallbacks"],
      tsEngine: ["Same engine", "node: plan_trip, 8 lookups"],
      volume: ["Volume (Modal storage)", "Chat checkpoints · billing ledger · run logs"],
      staging: "staging: deployed on every merge to main, used by Vercel Preview",
      prod: "production: deployed on a release (copilot-v*), used by Vercel Production",
      neon: ["Neon Postgres", "Accounts (Neon Auth) · trips and chats", "Note vectors (pgvector, for the Copilot)"],
      repo: ["Data in the repo (src/data)", "Generated by scripts: sights, drive times,", "trails, past weather, photos, campgrounds…"],
      live: ["Live external APIs", "NPS alerts and fees · Open-Meteo · NWS", "AAA gas · Google Flights · DeepL"],
      actions: ["Scheduled GitHub Actions", "Nightly alerts → data/alerts-live", "Weekly campgrounds · monthly freshness"],
      foot: "No servers of our own: the site is Next.js on Vercel, the Copilot is one small per-second-billed machine on Modal, and most data is generated from open data by scripts and committed to the repo.",
    },
    agent: {
      question: ["Question and context", "User's words + dispatcher's rewrite", "Today's date · the planned trip"],
      step: ["Model step", "Asks for lookups (up to 3 a step)", "or answers"],
      check: ["Code checks", "Place names → site ids · real dates", "Past days → next occurrence · dedupe"],
      tools: ["Site lookup tools (node)", "Open? · drive time · sights · seasons", "Fees · sun times · bookings · crowds"],
      notes: ["Site notes", "Semantic search (Neon), keyword fallback"],
      results: ["Results", "Numbered [1] [2] …, failures explained"],
      lookup: "look up",
      loop: "Reads the results, then looks further or answers",
      limits: "At most 4 model calls and 20 s; the last call must answer",
      answer: "answer",
      verify: ["Answer checks", "Numbers and times must be in the results", "Valid sources · no tool names · no sources if “not covered”"],
      reply: ["Reply", "With sources"],
      passed: "pass",
      failed: "fail",
      fallback: ["Failed, error or timeout", "Found something: show the lookup results", "Found nothing: fall back to retrieve-once"],
      foot1: "Switched on by COPILOT_QA_AGENT=1 in the Modal secret; otherwise retrieve-once is used (code picks lookups by keyword, then one retrieval and one answer). Eval of 44 questions: search agent 39, retrieve-once 19.",
      foot2: "Every step is logged: the recent-turns notes below show the number of steps, what each looked up, why lookups failed and why the loop stopped.",
    },
    delivery: {
      branch: ["Branch and code", "Bilingual commits"],
      pr: ["Open a PR", "Bilingual description"],
      checks: ["Three required checks", "Website: lint · types · tests", "Copilot: Ruff · pytest · 10 replay gates", "Image: build · plan a trip · 8 lookups inside"],
      side: ["Also on the PR (not blocking)", "CodeRabbit review · eval scores comment", "Vercel Preview, wired to Modal staging"],
      merge: ["Merge to main", "By the repo owner"],
      prod: ["Vercel Production", "Website goes live"],
      staging: ["Modal staging", "Copilot deployed", "Image main-<commit>"],
      tag: ["Push tag copilot-v*", "One release per big feature"],
      release: ["Copilot release", "Version check · tests · 10 gates · image smoke", "Push to GHCR · pull and retest · GitHub Release"],
      main: ["Modal main (production)", "Deploys the tested image", "Used by Vercel Production"],
      after: "after merging",
      foot1: "Preview pairs with preview: Vercel Preview ↔ Modal staging; production with production: Vercel Production ↔ Modal main (the Copilot updates only on a release).",
      foot2: "Rollback: redeploy the previous tag on Modal (the “Deploy Copilot to Modal” action); to switch off one feature, remove its flag, e.g. COPILOT_QA_AGENT.",
    },
  },
} as const;

function Frame({ x, y, w, h, label }: { x: number; y: number; w: number; h: number; label: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={INK} strokeWidth={1} strokeDasharray="2 3" />
      <text x={x + 16} y={y + 24} fontSize={12} fill={MUTE} style={{ fontFamily: "var(--font-jost)" }}>
        {label}
      </text>
    </g>
  );
}

function Note({ x, y, children, color = MUTE }: { x: number; y: number; children: string; color?: string }) {
  return (
    <text x={x} y={y} fontSize={11.5} fill={color}>
      {children}
    </text>
  );
}

function Legend({ lang }: { lang: AdminLang }) {
  return (
    <figcaption className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-ink-soft">
      <span>
        <i className="mr-1.5 inline-block size-2.5 border border-clay-600 bg-[#f7ece5] align-middle" />
        {lang === "zh" ? "调模型的步骤" : "Calls a model"}
      </span>
      <span>
        <i className="mr-1.5 inline-block size-2.5 border border-ink bg-paper align-middle" />
        {lang === "zh" ? "确定的代码、存储" : "Deterministic code, storage"}
      </span>
      <span>
        <i className="mr-1.5 inline-block size-2.5 border border-[#4f6b3f] bg-[#e4eadc] align-middle" />
        {lang === "zh" ? "排行程引擎（不用模型）" : "Trip planner (no model)"}
      </span>
      <span>
        <i className="mr-1.5 inline-block h-0 w-4 border-t border-dashed border-ink align-middle" />
        {lang === "zh" ? "虚线：读数据、出问题时的路" : "Dashed: data reads, failure paths"}
      </span>
    </figcaption>
  );
}

function Canvas({ height, label, children }: { height: number; label: string; children: React.ReactNode }) {
  return (
    <div className="no-scrollbar overflow-x-auto bg-[#f4efe7] p-3 [--color-paper:#f4efe7] [--color-paper-deep:#ebe4d8]">
      <svg viewBox={`0 0 1200 ${height}`} className="block h-auto w-full min-w-[920px]" role="img" aria-label={label}>
        <Markers />
        {children}
      </svg>
    </div>
  );
}

function Overview({ lang }: { lang: AdminLang }) {
  const t = TEXT[lang].overview;
  const llm = lang === "zh" ? "模型" : "LLM";
  return (
    <figure className="mt-6">
      <Canvas height={640} label={TABS[lang].overview}>
        <Box x={20} y={40} w={200} h={82} lines={t.user} kind="plain" />
        <Arrow d="M220 88 H264" />

        <Frame x={250} y={20} w={440} h={400} label={t.vercel} />
        <Box x={268} y={56} w={404} lines={t.pages} kind="code" />
        <Box x={268} y={136} w={404} lines={t.engine} kind="engine" />
        <Box x={268} y={216} w={404} lines={t.apis} kind="code" />
        <Box x={268} y={296} w={404} lines={t.relay} kind="code" />
        <Note x={268} y={396}>{t.guard}</Note>

        <Frame x={720} y={20} w={460} h={400} label={t.modal} />
        <Box x={740} y={56} w={420} lines={t.service} kind="code" />
        <Box x={740} y={150} w={205} lines={t.models} kind="llm" tag={llm} />
        <Box x={955} y={150} w={205} lines={t.tsEngine} kind="engine" />
        <Box x={740} y={236} w={420} lines={t.volume} kind="code" />
        <Note x={740} y={336}>{t.staging}</Note>
        <Note x={740} y={356}>{t.prod}</Note>
        <Arrow d="M842 120 V146" color={CLAY} />
        <Arrow d="M1057 120 V146" color={PINE} />
        <Arrow d="M1160 100 H1172 V268 H1164" dashed />
        {/* 网站的中转连到 Copilot */}
        <Arrow d="M672 328 C704 328 704 88 736 88" />

        {/* 底下一排：数据和外面的服务 */}
        <Box x={20} y={460} w={275} h={82} lines={t.neon} kind="code" />
        <Box x={315} y={460} w={275} h={82} lines={t.repo} kind="code" />
        <Box x={610} y={460} w={275} h={82} lines={t.live} kind="code" />
        <Box x={905} y={460} w={275} h={82} lines={t.actions} kind="code" />
        <Arrow d="M300 420 C300 440 160 440 160 456" dashed />
        <Arrow d="M460 420 V456" dashed />
        <Arrow d="M640 420 C640 440 740 440 740 456" dashed />
        {/* Copilot 的引擎用的也是仓库里的数据；按意思找资料连 Neon */}
        <Arrow d="M1000 420 C1000 444 560 432 560 456" dashed color={PINE} />
        <Arrow d="M760 420 C760 448 240 430 240 456" dashed color={CLAY} />
        {/* 每晚读公告的结果，网站和 Copilot 都读 */}
        <Arrow d="M1100 460 V424" dashed color={PINE} />

        <Note x={20} y={590}>{t.foot}</Note>
      </Canvas>
      <Legend lang={lang} />
    </figure>
  );
}

function AgentLoop({ lang }: { lang: AdminLang }) {
  const t = TEXT[lang].agent;
  const llm = lang === "zh" ? "模型" : "LLM";
  return (
    <figure className="mt-6">
      <Canvas height={540} label={TABS[lang].agent}>
        <Box x={20} y={40} w={230} h={82} lines={t.question} kind="code" />
        <Box x={300} y={40} w={240} h={82} lines={t.step} kind="llm" tag={llm} />
        <Box x={590} y={40} w={250} h={82} lines={t.check} kind="code" />
        <Box x={890} y={20} w={290} h={82} lines={t.tools} kind="engine" />
        <Box x={890} y={116} w={290} lines={t.notes} kind="code" />
        <Box x={590} y={214} w={250} lines={t.results} kind="code" />

        <Arrow d="M250 81 H296" />
        <Arrow d="M540 81 H586" />
        <Note x={548} y={72}>{t.lookup}</Note>
        <Arrow d="M840 61 H886" />
        <Arrow d="M840 102 C866 102 866 148 886 148" />
        <Arrow d="M1035 180 V246 H844" />
        {/* 结果回到模型：再查还是回答 */}
        <Arrow d="M590 246 H500 V126" color={CLAY} />
        <Note x={590} y={300} color={CLAY}>{t.loop}</Note>
        <Note x={590} y={317}>{t.limits}</Note>

        {/* 回答那一路 */}
        <Arrow d="M340 122 V326" />
        <Note x={348} y={190}>{t.answer}</Note>
        <Box x={230} y={330} w={300} h={82} lines={t.verify} kind="code" />
        <Box x={590} y={330} w={210} lines={t.reply} kind="plain" />
        <Arrow d="M530 362 H586" />
        <Note x={540} y={354}>{t.passed}</Note>
        <Box x={850} y={330} w={330} h={82} lines={t.fallback} kind="code" />
        <Arrow d="M380 412 V440 H1015 V416" dashed color={CLAY} />
        <Note x={700} y={458} color={CLAY}>{t.failed}</Note>

        <Note x={20} y={496}>{t.foot1}</Note>
        <Note x={20} y={516}>{t.foot2}</Note>
      </Canvas>
      <Legend lang={lang} />
    </figure>
  );
}

function Delivery({ lang }: { lang: AdminLang }) {
  const t = TEXT[lang].delivery;
  return (
    <figure className="mt-6">
      <Canvas height={500} label={TABS[lang].delivery}>
        <Box x={20} y={40} w={170} lines={t.branch} kind="plain" />
        <Box x={226} y={40} w={150} lines={t.pr} kind="plain" />
        <Box x={412} y={22} w={340} h={100} lines={t.checks} kind="code" />
        <Box x={412} y={150} w={340} h={82} lines={t.side} kind="plain" />
        <Box x={790} y={40} w={170} lines={t.merge} kind="code" />
        <Box x={1000} y={20} w={180} lines={t.prod} kind="code" />
        <Box x={1000} y={108} w={180} h={82} lines={t.staging} kind="code" />

        <Arrow d="M190 72 H222" />
        <Arrow d="M376 72 H408" />
        <Arrow d="M752 72 H786" />
        <Arrow d="M376 92 C394 92 394 190 408 190" dashed />
        <Arrow d="M960 60 C980 60 980 52 996 52" />
        <Arrow d="M960 90 C980 90 980 148 996 148" />

        <Arrow d="M875 104 V250 H130 V286" dashed />
        <Note x={140} y={268}>{t.after}</Note>
        <Box x={20} y={290} w={220} lines={t.tag} kind="plain" />
        <Box x={290} y={290} w={480} h={82} lines={t.release} kind="code" />
        <Box x={1000} y={290} w={180} h={82} lines={t.main} kind="code" />
        <Arrow d="M240 322 H286" />
        <Arrow d="M770 322 H996" />

        <Note x={20} y={430}>{t.foot1}</Note>
        <Note x={20} y={450}>{t.foot2}</Note>
      </Canvas>
      <Legend lang={lang} />
    </figure>
  );
}

export function SystemDiagrams({ lang, chain }: { lang: AdminLang; chain?: string[] | null }) {
  const [tab, setTab] = useState<Tab>("overview");
  return (
    <div>
      <div role="tablist" className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-b border-ink/15 text-[13px]">
        {(Object.keys(TABS[lang]) as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 pb-2 transition-colors ${tab === key ? "border-clay-600 text-ink" : "border-transparent text-mute hover:text-ink"}`}
          >
            {TABS[lang][key]}
          </button>
        ))}
      </div>
      {tab === "overview" && <Overview lang={lang} />}
      {tab === "turn" && <ArchitectureDiagram lang={lang} chain={chain} />}
      {tab === "agent" && <AgentLoop lang={lang} />}
      {tab === "delivery" && <Delivery lang={lang} />}
    </div>
  );
}
