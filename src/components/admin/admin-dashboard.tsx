"use client";

import { useCallback, useEffect, useState } from "react";
import { buttonPrimary, buttonSecondary } from "@/components/ui";
import { ArchitectureDiagram, type AdminLang } from "./architecture-diagram";

/**
 * 后台页面：读 /api/copilot/admin（Copilot 服务的 /health、/stats 和 GitHub 上每晚读公告的结果），每 30 秒刷新一次。
 * 数字的意思见 docs/COPILOT.md 的“监控指标”；什么时候该回滚见 docs/GUIDE.md。
 * 中英两套字（/en/admin 给老师看，10-22）：后台不进网站的翻译表，字都写在下面的 TEXT 里
 */

interface ModelUsage {
  calls: number;
  errors: number;
  fallback_to: number;
  prompt_tokens: number;
  output_tokens: number;
  thinking_tokens: number;
  cost: number;
  unpriced: number;
}

interface VersionSummary {
  turns: number;
  sessions: number;
  planned: number;
  needs_input: number;
  error: number;
  median_latency_ms: number | null;
  p90_latency_ms: number | null;
  dropped_spans: number;
  rule_fills: number;
  writer_fallback: number;
  dispatch_errors: number;
  dispatch_dropped: number;
  legacy: number;
  questions: number;
  qa_fallback: number;
  qa_not_found: number;
}

interface Day {
  day: string;
  turns: number;
  sessions: number;
  planned: number;
  needs_input: number;
  error: number;
  median_latency_ms: number | null;
  calls: number;
  call_errors: number;
  fallbacks: number;
  tokens: number;
  cost: number;
  unpriced: number;
}

interface Turn {
  day: string;
  at?: string;
  session: string;
  turn: number;
  message: string;
  status: string;
  latency_ms: number | null;
  route: string | null;
  models: string[];
  calls: number;
  call_errors: number;
  fallback: boolean;
  tokens: number;
  dropped: number;
  writer_fallback: boolean;
  /** 这一轮记了模型调用（10-19 以前的日志没记） */
  logged?: boolean;
}

interface AlertsStatus {
  closures_file: boolean;
  fetched?: string;
  closures?: number;
  strict?: number;
  model_only?: number;
  parks?: number;
  oldest_park?: string | null;
  prompts?: string;
  cache_entries: number;
}

/** 计费总账的一格（copilot/nps_copilot/monitor.py 的 billing）：某一天、谁调用的、哪个模型 */
interface BillingRow {
  day: string;
  source: string;
  model: string;
  provider: string;
  calls: number;
  prompt_tokens: number;
  output_tokens: number;
  thinking_tokens: number;
  estimated: number;
  cost: number;
  unpriced: number;
  list_cost: number;
  unlisted: number;
}
/** 免费档每天的上限（monitor.FREE_LIMITS） */
interface FreeLimit {
  id: string;
  provider: string;
  models?: string[];
  free?: boolean;
  requests: number | null;
  tokens: number | null;
  note: string;
}
interface Billing {
  rows: BillingRow[];
  limits: FreeLimit[];
}

interface AdminData {
  available: boolean;
  health: {
    version: string;
    build: string | null;
    model: string | null;
    chain?: string[];
    /** COPILOT_STEP_MODELS 单独换了模型的步骤：{步骤: [先试的, 出错再按平常的顺序]} */
    steps?: Record<string, string[]>;
    /** 模型配置写错了（比如 COPILOT_STEP_MODELS 看不懂、没配 key） */
    error?: string;
    prompts: Record<string, string>;
    plan_tool: string;
  } | null;
  stats: {
    days: number;
    versions: Record<string, VersionSummary>;
    usage: { turns: number; alerts_read: number; models: Record<string, ModelUsage>; days: Record<string, number> };
    daily: Day[];
    recent: Turn[];
    alerts: AlertsStatus;
    /** 这台机器上的计费总账（旧版本的服务没有） */
    billing?: Billing;
  } | null;
  nightly: {
    runs: { id: number; status: string; conclusion: string | null; created: string; url: string; event: string }[];
    issues: { number: number; title: string; created: string; url: string }[];
    /** 每晚 GitHub 上调用模型的计费总账 */
    billing?: Billing | null;
    error?: string;
  };
}

const PERIODS = [1, 7, 30];
/** 和 src/lib/copilot/live.ts 的 LIVE_STALE_DAYS 一样：关闭清单超过 3 天就不用了 */
const STALE_DAYS = 3;

const TEXT = {
  zh: {
    steps: { dispatch: "调度员", intake: "摘条件", qa: "回答问题", writer: "写说明" } as Record<string, string>,
    status: { planned: "排出行程", needs_input: "追问", error: "出错" } as Record<string, string>,
    seconds: "秒",
    unknown: "不知道",
    locale: "zh-CN",
    eyebrow: "后台 · Copilot",
    heading: "运行情况",
    intro: "Copilot 每回答一句都记一条日志：用了哪几个模型、多少 token、花了多少、排没排出行程。这里把最近几天的汇总在一起；每 30 秒自动刷新。",
    today: "今天",
    lastDays: (n: number) => `最近 ${n} 天`,
    refresh: "刷新",
    updated: (time: string) => `更新于 ${time}`,
    failed: "读不到后台数据（/api/copilot/admin）。网站部署到公网又没设访问密码时，这里不给数据。",
    loading: "读取中…",
    running: "Copilot 在运行",
    chain: "模型顺序",
    stepModels: "单独换了模型",
    prompts: "提示词",
    planTool: "行程引擎",
    noNode: "找不到 node",
    offline: "Copilot 没开（或者连不上 COPILOT_URL）。下面只有架构图和 GitHub 上每晚读公告的结果。",
    startHint: "在本机启动：",
    startEnv: "，并在 .env.local 里写 COPILOT_URL=http://127.0.0.1:8766",
    turns: "对话",
    turnsSub: (n: number) => `${n} 个会话的轮数`,
    planned: "排出行程",
    plannedSub: (planned: number, needs: number) => `${planned} 轮；追问 ${needs} 轮`,
    errors: "出错",
    errorsSub: "plan_trip 拒绝了请求",
    latency: "耗时（中位）",
    latencySub: "每天中位数的中位数",
    calls: "模型调用",
    callsSub: (turns: number, errors: number, fallbacks: number) => `${turns} 轮记了调用；出错 ${errors}，换备用模型 ${fallbacks}`,
    cost: "花费",
    costUnpriced: (n: number) => `${n} 次调用的模型没有价格`,
    costFree: "免费档、本机按 $0 算",
    archTitle: "模型调用架构",
    archNote: "每一步调不调模型、按什么顺序换模型；模型顺序是服务现在报的",
    daily: "每天",
    noLogs: "这段时间没有日志。",
    chartLabel: "每天的对话轮数和花费",
    chartTitle: (day: string, turns: number, cost: string) => `${day}：${turns} 轮，${cost}`,
    chartPlanned: "排出行程",
    chartNeeds: "追问",
    chartError: "出错",
    chartCost: "柱子上的数字是那天的花费",
    usage: "模型用量",
    usageNote: "按真正回答的那个模型算；前一个模型出错、换到它的，算在“换来的”里",
    usageHead: ["模型", "调用", "换来的", "出错", "输入 token", "输出 token", "思考 token", "花费"],
    usageEmpty: "这段时间的日志里还没有记模型调用（10-19 以后的版本才记）。",
    billing: {
      title: "计费（所有模型）",
      note: "自己记的账：每次调用模型都记一笔（聊天、每晚读公告、评测、裁判），免费档的 API 在各家后台看不到用了多少，在这里看",
      calls: "调用",
      callsSub: (estimated: number) => (estimated ? `其中 ${estimated} 次没回报 token、按字数估的` : "token 都是模型回报的"),
      cost: "实际花费",
      costSub: "付费的按官网价，免费档、本机按 $0",
      list: "按付费标价算",
      listSub: "要是免费档都换成付费档，大概要花这么多",
      head: ["模型", "调用", "聊天", "读公告", "评测", "裁判", "输入 token", "输出 token", "实际花费", "按标价算"],
      quota: "今天的免费额度",
      quotaHead: ["哪一家", "今天的调用", "上限", "今天的 token", "上限", "说明"],
      none: "—",
      unknownLimit: "看说明",
      empty: "这段时间计费总账里还没有调用：10-28 以后的版本才记，每晚读公告的那一份第一次跑完以后才有。",
      parts: (local: boolean, nightly: boolean) =>
        `这里加起来的是：${[local ? "本机 Copilot 服务的总账" : null, nightly ? "每晚 GitHub 上读公告的总账" : null].filter(Boolean).join("、") || "（都还没有）"}`,
      noList: "没有付费版",
      noListCalls: (n: number) => `其中 ${n} 次调用的模型没有付费版`,
    },
    alertsRead: (n: number) => `聊天时现读了 ${n} 条 NPS 公告，那部分的 token 不在上表里。`,
    quality: "质量",
    qualityNote: "按 Copilot 版本和提示词版本分，最近用上的在上面；新版本上线后和上一版比，变差就回滚（docs/GUIDE.md）",
    qualityHead: ["版本", "轮数", "排出", "追问", "出错", "中位", "P90", "编造被丢", "规则补", "Writer 退回", "调度员失败", "回答改摘原文"],
    alerts: "NPS 公告",
    alertsNote: "Copilot 读公告提取的关闭清单；两周内出发的行程用它，超过 3 天就不用了",
    localList: "本机的关闭清单",
    localOff: "Copilot 没开，看不到。",
    localMissing: "还没有关闭清单：先跑 npm run alerts:fetch 和 python -m nps_copilot alerts。",
    fetched: "公告抓取",
    fetchedAgo: (days: number, stale: boolean) => `（${days} 天前${stale ? "，已经不用了" : ""}）`,
    closed: "关了网站景点",
    closedLine: (all?: number, strict?: number, model?: number) => `${all} 条：代码也确认的 ${strict}，只有模型找到的 ${model}（照排、提醒）`,
    parks: "覆盖公园",
    parksLine: (n?: number, oldest?: string | null) => `${n} 座，最旧的是 ${oldest}`,
    cache: "读过的公告",
    cacheLine: (n: number) => `缓存 ${n} 条（没改过的不再读）`,
    nightly: "GitHub 上每晚读公告",
    nightlyError: (error: string) => `查不到 GitHub（${error}）。`,
    runRunning: "在跑",
    runOk: "成功",
    runSkipped: "跳过",
    scheduled: "定时",
    noRuns: "还没跑过。",
    issues: "还开着的 nps-alerts issue",
    recent: "最近的对话",
    recentNote: "最新的在上面，最多 30 轮；原话只截前 120 个字",
    recentHead: ["时间", "说了什么", "结果", "耗时", "模型", "调用", "token", "备注"],
    oldLog: "旧日志没记",
    fallback: "换了备用模型",
    callErrors: (n: number) => `${n} 次调用出错`,
    dropped: (n: number) => `丢掉编造 ${n}`,
    writerFallback: "说明退回模板",
    sep: "；",
    listSep: "、",
    recentEmpty: "这段时间没有对话。",
  },
  en: {
    steps: { dispatch: "Dispatcher", intake: "Intake", qa: "Q&A", writer: "Writer" } as Record<string, string>,
    status: { planned: "Planned", needs_input: "Follow-up", error: "Error" } as Record<string, string>,
    seconds: "s",
    unknown: "unknown",
    locale: "en-US",
    eyebrow: "Dashboard · Copilot",
    heading: "How the Copilot is running",
    intro: "The Copilot logs every reply: which models it called, how many tokens, what it cost, and whether a trip was planned. This page sums up the last few days and refreshes every 30 seconds.",
    today: "Today",
    lastDays: (n: number) => `Last ${n} days`,
    refresh: "Refresh",
    updated: (time: string) => `Updated ${time}`,
    failed: "Can't read the dashboard data (/api/copilot/admin). A public deployment without a site password returns nothing here.",
    loading: "Loading…",
    running: "Copilot is running",
    chain: "Model order",
    stepModels: "Per-step models",
    prompts: "Prompts",
    planTool: "Trip engine",
    noNode: "node not found",
    offline: "The Copilot is off (or COPILOT_URL can't be reached). Only the architecture and the nightly alerts runs on GitHub are shown below.",
    startHint: "Start it locally: ",
    startEnv: ", and set COPILOT_URL=http://127.0.0.1:8766 in .env.local",
    turns: "Turns",
    turnsSub: (n: number) => `across ${n} sessions`,
    planned: "Planned",
    plannedSub: (planned: number, needs: number) => `${planned} turns; ${needs} follow-ups`,
    errors: "Errors",
    errorsSub: "plan_trip rejected the request",
    latency: "Latency (median)",
    latencySub: "median of daily medians",
    calls: "Model calls",
    callsSub: (turns: number, errors: number, fallbacks: number) => `${turns} turns logged calls; ${errors} errors, ${fallbacks} fallbacks`,
    cost: "Cost",
    costUnpriced: (n: number) => `${n} calls used a model with no price`,
    costFree: "free tiers and the local model count as $0",
    archTitle: "Model call architecture",
    archNote: "Which steps call a model and in what order models are tried; the order comes from the running service",
    daily: "By day",
    noLogs: "No logs in this period.",
    chartLabel: "Turns and cost per day",
    chartTitle: (day: string, turns: number, cost: string) => `${day}: ${turns} turns, ${cost}`,
    chartPlanned: "Planned",
    chartNeeds: "Follow-up",
    chartError: "Error",
    chartCost: "the number above each bar is that day's cost",
    usage: "Model usage",
    usageNote: "Counted for the model that actually answered; calls it took over after an earlier model failed are under \"fallback\"",
    usageHead: ["Model", "Calls", "Fallback", "Errors", "Input tokens", "Output tokens", "Thinking tokens", "Cost"],
    usageEmpty: "No model calls logged in this period (versions from 10-19 on log them).",
    billing: {
      title: "Billing (all models)",
      note: "Our own ledger: every model call is recorded (chat, nightly alert reading, evals, the judge), so free-tier APIs whose consoles don't show usage can be tracked here",
      calls: "Calls",
      callsSub: (estimated: number) => (estimated ? `${estimated} didn't report tokens and were estimated from length` : "all token counts reported by the models"),
      cost: "Actual cost",
      costSub: "paid models at list price; free tiers and the local model at $0",
      list: "At paid list prices",
      listSub: "roughly what it would cost if the free tiers were paid tiers",
      head: ["Model", "Calls", "Chat", "Alerts", "Evals", "Judge", "Input tokens", "Output tokens", "Actual cost", "At list price"],
      quota: "Today's free quota",
      quotaHead: ["Provider", "Calls today", "Limit", "Tokens today", "Limit", "Notes"],
      none: "—",
      unknownLimit: "see notes",
      empty: "No calls in the ledger for this period yet: versions from 10-28 on record them, and the nightly part appears after its first run.",
      parts: (local: boolean, nightly: boolean) =>
        `Combined here: ${[local ? "the local Copilot service's ledger" : null, nightly ? "the nightly GitHub alerts ledger" : null].filter(Boolean).join(" and ") || "(neither yet)"}`,
      noList: "no paid version",
      noListCalls: (n: number) => `${n} ${n === 1 ? "call" : "calls"} used a model with no paid version`,
    },
    alertsRead: (n: number) => `${n} NPS alerts were read live during chats; those tokens aren't in the table above.`,
    quality: "Quality",
    qualityNote: "By Copilot and prompt version, newest first. Compare a new release with the previous one and roll back if it is worse (docs/GUIDE.md)",
    qualityHead: ["Version", "Turns", "Planned", "Follow-up", "Errors", "Median", "P90", "Made-up spans dropped", "Rule fills", "Writer fallback", "Dispatcher failed", "Q&A quoted source"],
    alerts: "NPS alerts",
    alertsNote: "Closure list the Copilot extracts from NPS alerts; used for trips within two weeks, ignored after 3 days",
    localList: "Local closure list",
    localOff: "The Copilot is off, so this isn't available.",
    localMissing: "No closure list yet: run npm run alerts:fetch and python -m nps_copilot alerts first.",
    fetched: "Alerts fetched",
    fetchedAgo: (days: number, stale: boolean) => ` (${days} days ago${stale ? ", no longer used" : ""})`,
    closed: "Closes site sights",
    closedLine: (all?: number, strict?: number, model?: number) => `${all}: ${strict} confirmed by code, ${model} found only by the model (still planned, with a warning)`,
    parks: "Parks covered",
    parksLine: (n?: number, oldest?: string | null) => `${n}; oldest is ${oldest}`,
    cache: "Alerts read",
    cacheLine: (n: number) => `${n} cached (unchanged ones aren't read again)`,
    nightly: "Nightly alerts runs on GitHub",
    nightlyError: (error: string) => `Can't reach GitHub (${error}).`,
    runRunning: "running",
    runOk: "success",
    runSkipped: "skipped",
    scheduled: "scheduled",
    noRuns: "No runs yet.",
    issues: "Open nps-alerts issues",
    recent: "Recent turns",
    recentNote: "Newest first, up to 30; messages cut to the first 120 characters",
    recentHead: ["Time", "Message", "Result", "Latency", "Models", "Calls", "Tokens", "Notes"],
    oldLog: "not logged (old)",
    fallback: "used a fallback model",
    callErrors: (n: number) => `${n} call errors`,
    dropped: (n: number) => `${n} made-up spans dropped`,
    writerFallback: "writer used the template",
    sep: "; ",
    listSep: ", ",
    recentEmpty: "No turns in this period.",
  },
};
type AdminText = (typeof TEXT)["zh"];

const makeFormat = (t: AdminText) => ({
  ms: (value: number | null | undefined) =>
    value == null ? "—" : value >= 1000 ? `${(value / 1000).toFixed(1)} ${t.seconds}` : `${Math.round(value)} ms`,
  money: (value: number, unpriced = 0) => (unpriced ? t.unknown : value === 0 ? "$0" : value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`),
  clock: (iso?: string) => (iso ? new Date(iso).toLocaleString(t.locale, { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""),
});
const big = (value: number) => (value >= 10_000 ? `${(value / 1000).toFixed(value >= 100_000 ? 0 : 1)}k` : value.toLocaleString("en-US"));
const percent = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "—");
const daysAgo = (date: string) => Math.round((Date.now() - new Date(`${date}T12:00:00`).getTime()) / 86_400_000);

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="mt-16">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink pb-3">
        <h2 className="font-serif text-2xl">{title}</h2>
        {note && <p className="text-[11px] leading-5 text-mute">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Figure({ label, value, sub, warn }: { label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <div className="border-b border-line py-4 sm:border-r sm:pr-6 sm:last:border-r-0">
      <p className="eyebrow text-mute">{label}</p>
      <p className={`mt-2 font-serif text-[2rem] leading-none tabular-nums ${warn ? "text-clay-700" : ""}`}>{value}</p>
      {sub && <p className="mt-2 text-[11px] leading-5 text-mute">{sub}</p>}
    </div>
  );
}

/** 选的这段时间里每一天（没有日志的天是空的） */
function fillDays(daily: Day[], period: number): Day[] {
  const byDay = new Map(daily.map((day) => [day.day, day]));
  const today = new Date();
  return Array.from({ length: period }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (period - 1 - index));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return (
      byDay.get(key) ?? {
        day: key, turns: 0, sessions: 0, planned: 0, needs_input: 0, error: 0, median_latency_ms: null,
        calls: 0, call_errors: 0, fallbacks: 0, tokens: 0, cost: 0, unpriced: 0,
      }
    );
  });
}

/** 每天多少轮（排出行程 / 追问 / 出错叠起来），柱子上方写花费 */
function DailyChart({ days, t }: { days: Day[]; t: AdminText }) {
  const { money } = makeFormat(t);
  const max = Math.max(1, ...days.map((day) => day.turns));
  return (
    <div className="mt-6">
      <div className="flex h-48 items-end gap-1.5 border-b border-ink/40" role="img" aria-label={t.chartLabel}>
        {days.map((day) => (
          <div key={day.day} className="relative flex h-full min-w-0 max-w-16 flex-1 flex-col justify-end" title={t.chartTitle(day.day, day.turns, money(day.cost, day.unpriced))}>
            <span className="mb-1 truncate text-center text-[10px] tabular-nums text-mute">{day.cost > 0 ? money(day.cost) : ""}</span>
            <div className="flex flex-col-reverse" style={{ height: `${(day.turns / max) * 85}%` }}>
              <div className="bg-pine-500" style={{ flexGrow: day.planned }} />
              <div className="bg-clay-200" style={{ flexGrow: day.needs_input }} />
              <div className="bg-clay-700" style={{ flexGrow: day.error }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {days.map((day, index) => (
          <span key={day.day} className="min-w-0 max-w-16 flex-1 truncate text-center text-[10px] tabular-nums text-mute">
            {days.length <= 10 || index % Math.ceil(days.length / 8) === 0 ? day.day.slice(5) : ""}
          </span>
        ))}
      </div>
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-ink-soft">
        <span><i className="mr-1.5 inline-block size-2 bg-pine-500 align-middle" />{t.chartPlanned}</span>
        <span><i className="mr-1.5 inline-block size-2 bg-clay-200 align-middle" />{t.chartNeeds}</span>
        <span><i className="mr-1.5 inline-block size-2 bg-clay-700 align-middle" />{t.chartError}</span>
        <span className="text-mute">{t.chartCost}</span>
      </p>
    </div>
  );
}

function Table({ head, rows, align }: { head: string[]; rows: React.ReactNode[][]; align?: ("l" | "r")[] }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            {head.map((cell, index) => (
              <th key={cell} className={`eyebrow py-2.5 pr-4 font-normal whitespace-nowrap text-mute ${align?.[index] === "r" ? "text-right" : "text-left"}`}>
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-line align-top">
              {row.map((cell, index) => (
                <td key={index} className={`py-2.5 pr-4 ${align?.[index] === "r" ? "text-right tabular-nums" : ""}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const flag = (value: number) => <span className={value ? "text-clay-700" : "text-mute"}>{value}</span>;

/** 本地日期 YYYY-MM-DD（总账按机器当地的日子记） */
const isoDay = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

type BillingKey = "calls" | "prompt_tokens" | "output_tokens" | "thinking_tokens" | "estimated" | "cost" | "unpriced" | "list_cost" | "unlisted";
const BILLING_KEYS: BillingKey[] = ["calls", "prompt_tokens", "output_tokens", "thinking_tokens", "estimated", "cost", "unpriced", "list_cost", "unlisted"];

/**
 * 计费：本机 Copilot 服务的总账（stats.billing）和每晚 GitHub 上读公告的总账（nightly.billing）加起来，按模型列；
 * 再按免费档每天的上限看今天用了多少。价格都是 Python 那边算好的，这里只加
 */
function BillingSection({ local, nightly, days, t }: { local?: Billing; nightly?: Billing | null; days: number; t: AdminText }) {
  const b = t.billing;
  const { money } = makeFormat(t);
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  const sinceDay = isoDay(since);
  const today = isoDay(new Date());
  const rows = [...(local?.rows ?? []), ...(nightly?.rows ?? [])].filter((row) => row.day >= sinceDay);
  const limits = local?.limits ?? nightly?.limits ?? [];
  const byModel = new Map<string, BillingRow & { sources: Record<string, number> }>();
  for (const row of rows) {
    const item = byModel.get(row.model) ?? { ...row, ...Object.fromEntries(BILLING_KEYS.map((key) => [key, 0])), sources: {} };
    for (const key of BILLING_KEYS) item[key] += row[key];
    item.sources[row.source] = (item.sources[row.source] ?? 0) + row.calls;
    byModel.set(row.model, item);
  }
  const models = [...byModel.values()].sort((a, c) => c.calls - a.calls);
  const sum = (key: BillingKey) => models.reduce((total, item) => total + item[key], 0);
  const matches = (limit: FreeLimit, row: BillingRow) =>
    row.provider === limit.provider && (!limit.models || limit.models.includes(row.model)) && (!limit.free || row.model.endsWith(":free"));
  const quota = limits.map((limit) => {
    const used = rows.filter((row) => row.day === today && matches(limit, row));
    return {
      limit,
      calls: used.reduce((total, row) => total + row.calls, 0),
      tokens: used.reduce((total, row) => total + row.prompt_tokens + row.output_tokens + row.thinking_tokens, 0),
    };
  });
  const share = (used: number, cap: number | null) => (cap ? `${big(used)} (${percent(used, cap)})` : big(used));
  return (
    <Section title={b.title} note={b.note}>
      {models.length ? (
        <>
          <div className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-3">
            <Figure label={b.calls} value={big(sum("calls"))} sub={b.callsSub(sum("estimated"))} />
            <Figure label={b.cost} value={money(sum("cost"), sum("unpriced"))} sub={b.costSub} />
            <Figure label={b.list} value={money(sum("list_cost"))} sub={sum("unlisted") ? `${b.listSub} · ${b.noListCalls(sum("unlisted"))}` : b.listSub} />
          </div>
          <Table
            head={b.head}
            align={["l", "r", "r", "r", "r", "r", "r", "r", "r", "r"]}
            rows={models.map((item) => [
              <span key="m" className="font-medium">{item.model}</span>,
              big(item.calls),
              big(item.sources.chat ?? 0),
              big(item.sources.alerts ?? 0),
              big(item.sources.eval ?? 0),
              big(item.sources.judge ?? 0),
              big(item.prompt_tokens),
              big(item.output_tokens + item.thinking_tokens),
              money(item.cost, item.unpriced),
              item.unlisted === item.calls ? b.noList : money(item.list_cost),
            ])}
          />
        </>
      ) : (
        <p className="mt-4 text-sm text-mute">{b.empty}</p>
      )}
      <h3 className="eyebrow mt-10 text-mute">{b.quota}</h3>
      <Table
        head={b.quotaHead}
        align={["l", "r", "r", "r", "r", "l"]}
        rows={quota.map(({ limit, calls, tokens }) => [
          <span key="p" className="font-medium">{limit.models?.join(", ") ?? limit.provider}</span>,
          share(calls, limit.requests),
          limit.requests == null ? b.unknownLimit : big(limit.requests),
          share(tokens, limit.tokens),
          limit.tokens == null ? b.none : big(limit.tokens),
          <span key="n" className="text-[12px] leading-5 text-ink-soft">{limit.note}</span>,
        ])}
      />
      <p className="mt-3 text-[11px] text-mute">{b.parts(Boolean(local), Boolean(nightly))}</p>
    </Section>
  );
}

export function AdminDashboard({ lang = "zh" }: { lang?: AdminLang }) {
  const t = TEXT[lang];
  const { ms, money, clock } = makeFormat(t);
  const [days, setDays] = useState(7);
  const [data, setData] = useState<AdminData | null>(null);
  const [failed, setFailed] = useState(false);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    let alive = true;
    fetch(`/api/copilot/admin?days=${days}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((next: AdminData) => {
        if (!alive) return;
        setData(next);
        setFailed(false);
        setLoadedAt(new Date().toLocaleTimeString(t.locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [days, tick, t.locale]);

  useEffect(() => {
    const timer = window.setInterval(refresh, 30_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const stats = data?.stats;
  const health = data?.health;
  const totals = stats
    ? Object.values(stats.versions).reduce(
        (sum, item) => ({
          turns: sum.turns + item.turns,
          sessions: sum.sessions + item.sessions,
          planned: sum.planned + item.planned,
          needs: sum.needs + item.needs_input,
          error: sum.error + item.error,
        }),
        { turns: 0, sessions: 0, planned: 0, needs: 0, error: 0 },
      )
    : null;
  const models = stats ? Object.entries(stats.usage.models).sort((a, b) => b[1].calls - a[1].calls) : [];
  const calls = models.reduce((sum, [, item]) => sum + item.calls, 0);
  const callErrors = models.reduce((sum, [, item]) => sum + item.errors, 0);
  const fallbacks = models.reduce((sum, [, item]) => sum + item.fallback_to, 0);
  const cost = models.reduce((sum, [, item]) => sum + item.cost, 0);
  const unpriced = models.reduce((sum, [, item]) => sum + item.unpriced, 0);
  const latencies = stats?.daily.map((day) => day.median_latency_ms).filter((value): value is number => value != null) ?? [];
  const alerts = stats?.alerts;
  const stale = alerts?.fetched ? daysAgo(alerts.fetched) > STALE_DAYS : false;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pt-28 pb-24 sm:px-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-mute">{t.eyebrow}</p>
          <h1 className="mt-4 font-serif text-[clamp(2.2rem,4vw,3.4rem)] leading-tight">{t.heading}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">{t.intro}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setDays(period)}
              aria-pressed={days === period}
              className={days === period ? buttonPrimary : buttonSecondary}
            >
              {period === 1 ? t.today : t.lastDays(period)}
            </button>
          ))}
          <button type="button" onClick={refresh} className={buttonSecondary}>
            {t.refresh}
          </button>
          {loadedAt && <span className="text-[11px] text-mute">{t.updated(loadedAt)}</span>}
        </div>
      </div>

      {/* 服务状态 */}
      <div className="mt-10 border-y border-ink py-4 text-sm">
        {failed ? (
          <p className="text-clay-700">{t.failed}</p>
        ) : !data ? (
          <p className="text-mute">{t.loading}</p>
        ) : data.available && health ? (
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <span className="flex items-center gap-2">
              <i className="inline-block size-2 rounded-full bg-pine-500" />
              {t.running} <span className="tabular-nums text-mute">{health.version}{health.build ? ` · ${health.build.slice(0, 7)}` : ""}</span>
            </span>
            <span>
              <span className="text-mute">{t.chain} </span>
              {health.error ? <span className="text-clay-700">{health.error}</span> : (health.chain ?? [health.model ?? "?"]).join(" → ")}
            </span>
            {health.steps && Object.keys(health.steps).length > 0 && (
              <span>
                <span className="text-mute">{t.stepModels} </span>
                {Object.entries(health.steps)
                  .map(([step, models]) => `${t.steps[step] ?? step} ${models[0]}`)
                  .join(t.sep)}
              </span>
            )}
            <span>
              <span className="text-mute">{t.prompts} </span>
              {Object.keys(health.prompts).join(t.listSep) || "—"}
            </span>
            <span>
              <span className="text-mute">{t.planTool} </span>
              {health.plan_tool === "missing" ? <span className="text-clay-700">{t.noNode}</span> : health.plan_tool}
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="flex items-center gap-2">
              <i className="inline-block size-2 rounded-full bg-clay-700" />
              {t.offline}
            </p>
            <p className="text-[12px] text-mute">
              {t.startHint}
              <code className="bg-paper-deep px-1.5 py-0.5">cd copilot && python -m nps_copilot serve --port 8766</code>
              {t.startEnv}
            </p>
          </div>
        )}
      </div>

      <Section title={t.archTitle} note={t.archNote}>
        <ArchitectureDiagram lang={lang} chain={data?.available && !health?.error ? health?.chain : null} />
      </Section>

      {stats && totals && (
        <>
          <div className="mt-2 grid grid-cols-2 gap-x-6 lg:grid-cols-6">
            <Figure label={t.turns} value={big(totals.turns)} sub={t.turnsSub(totals.sessions)} />
            <Figure label={t.planned} value={percent(totals.planned, totals.turns)} sub={t.plannedSub(totals.planned, totals.needs)} />
            <Figure label={t.errors} value={String(totals.error)} sub={t.errorsSub} warn={totals.error > 0} />
            <Figure label={t.latency} value={ms(latencies.length ? [...latencies].sort((a, b) => a - b)[Math.floor(latencies.length / 2)] : null)} sub={t.latencySub} />
            <Figure
              label={t.calls}
              value={big(calls)}
              sub={t.callsSub(stats.usage.turns, callErrors, fallbacks)}
              warn={callErrors > 0 || fallbacks > 0}
            />
            <Figure label={t.cost} value={money(cost, unpriced)} sub={unpriced ? t.costUnpriced(unpriced) : t.costFree} />
          </div>

          <Section title={t.daily} note={stats.days === 1 ? t.today : t.lastDays(stats.days)}>
            {stats.daily.length ? <DailyChart days={fillDays(stats.daily, stats.days)} t={t} /> : <p className="mt-4 text-sm text-mute">{t.noLogs}</p>}
          </Section>

          <Section title={t.usage} note={t.usageNote}>
            {models.length ? (
              <Table
                head={t.usageHead}
                align={["l", "r", "r", "r", "r", "r", "r", "r"]}
                rows={models.map(([model, item]) => [
                  <span key="m" className="font-medium">{model}</span>,
                  big(item.calls),
                  flag(item.fallback_to),
                  flag(item.errors),
                  big(item.prompt_tokens),
                  big(item.output_tokens),
                  big(item.thinking_tokens),
                  money(item.cost, item.unpriced),
                ])}
              />
            ) : (
              <p className="mt-4 text-sm text-mute">{t.usageEmpty}</p>
            )}
            {stats.usage.alerts_read > 0 && (
              <p className="mt-3 text-[11px] text-mute">{t.alertsRead(stats.usage.alerts_read)}</p>
            )}
          </Section>

          <Section title={t.quality} note={t.qualityNote}>
            <Table
              head={t.qualityHead}
              align={["l", "r", "r", "r", "r", "r", "r", "r", "r", "r", "r", "r"]}
              rows={Object.entries(stats.versions).reverse().map(([version, item]) => [
                <span key="v" className="text-[12px] leading-5">{version}</span>,
                item.turns,
                item.planned,
                item.needs_input,
                flag(item.error),
                ms(item.median_latency_ms),
                ms(item.p90_latency_ms),
                flag(item.dropped_spans + item.dispatch_dropped),
                item.rule_fills,
                flag(item.writer_fallback),
                flag(item.dispatch_errors),
                flag(item.qa_fallback),
              ])}
            />
          </Section>
        </>
      )}

      <BillingSection local={stats?.billing} nightly={data?.nightly.billing} days={days} t={t} />

      <Section title={t.alerts} note={t.alertsNote}>
        <div className="mt-4 grid gap-x-10 gap-y-6 lg:grid-cols-2">
          <div>
            <h3 className="eyebrow text-mute">{t.localList}</h3>
            {!alerts ? (
              <p className="mt-3 text-sm text-mute">{t.localOff}</p>
            ) : !alerts.closures_file ? (
              <p className="mt-3 text-sm text-clay-700">{t.localMissing}</p>
            ) : (
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-mute">{t.fetched}</dt>
                <dd className={stale ? "text-clay-700" : ""}>
                  {alerts.fetched}
                  {t.fetchedAgo(daysAgo(alerts.fetched ?? ""), stale)}
                </dd>
                <dt className="text-mute">{t.closed}</dt>
                <dd>{t.closedLine(alerts.closures, alerts.strict, alerts.model_only)}</dd>
                {alerts.parks ? (
                  <>
                    <dt className="text-mute">{t.parks}</dt>
                    <dd>{t.parksLine(alerts.parks, alerts.oldest_park)}</dd>
                  </>
                ) : null}
                <dt className="text-mute">{t.cache}</dt>
                <dd>
                  {t.cacheLine(alerts.cache_entries)}
                  {alerts.prompts ? ` · ${alerts.prompts}` : ""}
                </dd>
              </dl>
            )}
          </div>
          <div>
            <h3 className="eyebrow text-mute">{t.nightly}</h3>
            {data?.nightly.error ? (
              <p className="mt-3 text-sm text-mute">{t.nightlyError(data.nightly.error)}</p>
            ) : (
              <ul className="mt-3 text-sm">
                {data?.nightly.runs.map((run) => {
                  const ok = run.conclusion === "success";
                  const label = run.status !== "completed" ? t.runRunning : ok ? t.runOk : run.conclusion === "skipped" ? t.runSkipped : run.conclusion ?? "?";
                  return (
                    <li key={run.id} className="flex items-baseline justify-between gap-4 border-b border-line py-2">
                      <a href={run.url} target="_blank" rel="noreferrer" className="hover:text-clay-700">
                        {clock(run.created)}
                        <span className="ml-2 text-[11px] text-mute">{run.event === "schedule" ? t.scheduled : run.event}</span>
                      </a>
                      <span className={ok ? "text-pine-600" : run.status !== "completed" || label === t.runSkipped ? "text-mute" : "text-clay-700"}>{label}</span>
                    </li>
                  );
                })}
                {data && !data.nightly.runs.length && <li className="py-2 text-mute">{t.noRuns}</li>}
              </ul>
            )}
            {data?.nightly.issues.length ? (
              <div className="mt-5">
                <h3 className="eyebrow text-mute">{t.issues}</h3>
                <ul className="mt-2 text-sm">
                  {data.nightly.issues.map((issue) => (
                    <li key={issue.number} className="border-b border-line py-2">
                      <a href={issue.url} target="_blank" rel="noreferrer" className="hover:text-clay-700">
                        #{issue.number} {issue.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </Section>

      {stats && (
        <Section title={t.recent} note={t.recentNote}>
          {stats.recent.length ? (
            <Table
              head={t.recentHead}
              align={["l", "l", "l", "r", "l", "r", "r", "l"]}
              rows={stats.recent.map((turn) => [
                <span key="t" className="whitespace-nowrap text-[12px] text-mute">
                  {turn.at ? clock(turn.at) : turn.day.slice(5)}
                  <span className="block text-[10px]">#{turn.session.slice(0, 6)} · {turn.turn}</span>
                </span>,
                <span key="m" className="block max-w-[28rem] leading-6">{turn.message}</span>,
                <span key="s" className={turn.status === "error" ? "text-clay-700" : turn.status === "planned" ? "text-pine-600" : ""}>
                  {t.status[turn.status] ?? turn.status}
                </span>,
                ms(turn.latency_ms),
                <span key="md" className="text-[12px]">{turn.logged === false ? <span className="text-mute">{t.oldLog}</span> : turn.models.join(t.listSep) || "—"}</span>,
                turn.calls,
                big(turn.tokens),
                <span key="n" className="text-[12px] text-clay-700">
                  {[
                    turn.fallback && t.fallback,
                    turn.call_errors && t.callErrors(turn.call_errors),
                    turn.dropped && t.dropped(turn.dropped),
                    turn.writer_fallback && t.writerFallback,
                  ]
                    .filter(Boolean)
                    .join(t.sep)}
                </span>,
              ])}
            />
          ) : (
            <p className="mt-4 text-sm text-mute">{t.recentEmpty}</p>
          )}
        </Section>
      )}
    </div>
  );
}
