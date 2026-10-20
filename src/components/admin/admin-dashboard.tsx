"use client";

import { useCallback, useEffect, useState } from "react";
import { buttonPrimary, buttonSecondary } from "@/components/ui";

/**
 * 后台页面：读 /api/copilot/admin（Copilot 服务的 /health、/stats 和 GitHub 上每晚读公告的结果），每 30 秒刷新一次。
 * 数字的意思见 docs/COPILOT.md 的“监控指标”；什么时候该回滚见 docs/GUIDE.md
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

interface AdminData {
  available: boolean;
  health: {
    version: string;
    build: string | null;
    model: string | null;
    chain?: string[];
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
  } | null;
  nightly: {
    runs: { id: number; status: string; conclusion: string | null; created: string; url: string; event: string }[];
    issues: { number: number; title: string; created: string; url: string }[];
    error?: string;
  };
}

const PERIODS = [1, 7, 30];
/** 和 src/lib/copilot/live.ts 的 LIVE_STALE_DAYS 一样：关闭清单超过 3 天就不用了 */
const STALE_DAYS = 3;
const STATUS_TEXT: Record<string, string> = { planned: "排出行程", needs_input: "追问", error: "出错" };

const ms = (value: number | null | undefined) =>
  value == null ? "—" : value >= 1000 ? `${(value / 1000).toFixed(1)} 秒` : `${Math.round(value)} ms`;
const money = (value: number, unpriced = 0) => (unpriced ? "不知道" : value === 0 ? "$0" : value < 0.01 ? `$${value.toFixed(4)}` : `$${value.toFixed(2)}`);
const big = (value: number) => (value >= 10_000 ? `${(value / 1000).toFixed(value >= 100_000 ? 0 : 1)}k` : value.toLocaleString("en-US"));
const percent = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "—");
const daysAgo = (date: string) => Math.round((Date.now() - new Date(`${date}T12:00:00`).getTime()) / 86_400_000);
const clock = (iso?: string) => (iso ? new Date(iso).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "");

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
function DailyChart({ days }: { days: Day[] }) {
  const max = Math.max(1, ...days.map((day) => day.turns));
  return (
    <div className="mt-6">
      <div className="flex h-48 items-end gap-1.5 border-b border-ink/40" role="img" aria-label="每天的对话轮数和花费">
        {days.map((day) => (
          <div key={day.day} className="relative flex h-full min-w-0 max-w-16 flex-1 flex-col justify-end" title={`${day.day}：${day.turns} 轮，${money(day.cost, day.unpriced)}`}>
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
        <span><i className="mr-1.5 inline-block size-2 bg-pine-500 align-middle" />排出行程</span>
        <span><i className="mr-1.5 inline-block size-2 bg-clay-200 align-middle" />追问</span>
        <span><i className="mr-1.5 inline-block size-2 bg-clay-700 align-middle" />出错</span>
        <span className="text-mute">柱子上的数字是那天的花费</span>
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

export function AdminDashboard() {
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
        setLoadedAt(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [days, tick]);

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
          <p className="eyebrow text-mute">后台 · Copilot</p>
          <h1 className="mt-4 font-serif text-[clamp(2.2rem,4vw,3.4rem)] leading-tight">运行情况</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-soft">
            Copilot 每回答一句都记一条日志：用了哪几个模型、多少 token、花了多少、排没排出行程。这里把最近几天的汇总在一起；每 30 秒自动刷新。
          </p>
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
              {period === 1 ? "今天" : `最近 ${period} 天`}
            </button>
          ))}
          <button type="button" onClick={refresh} className={buttonSecondary}>
            刷新
          </button>
          {loadedAt && <span className="text-[11px] text-mute">更新于 {loadedAt}</span>}
        </div>
      </div>

      {/* 服务状态 */}
      <div className="mt-10 border-y border-ink py-4 text-sm">
        {failed ? (
          <p className="text-clay-700">读不到后台数据（/api/copilot/admin）。网站部署到公网又没设访问密码时，这里不给数据。</p>
        ) : !data ? (
          <p className="text-mute">读取中…</p>
        ) : data.available && health ? (
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <span className="flex items-center gap-2">
              <i className="inline-block size-2 rounded-full bg-pine-500" />
              Copilot 在运行 <span className="tabular-nums text-mute">{health.version}{health.build ? ` · ${health.build.slice(0, 7)}` : ""}</span>
            </span>
            <span>
              <span className="text-mute">模型顺序 </span>
              {(health.chain ?? [health.model ?? "?"]).join(" → ")}
            </span>
            <span>
              <span className="text-mute">提示词 </span>
              {Object.keys(health.prompts).join("、") || "—"}
            </span>
            <span>
              <span className="text-mute">行程引擎 </span>
              {health.plan_tool === "missing" ? <span className="text-clay-700">找不到 node</span> : health.plan_tool}
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="flex items-center gap-2">
              <i className="inline-block size-2 rounded-full bg-clay-700" />
              Copilot 没开（或者连不上 COPILOT_URL）。下面只有 GitHub 上每晚读公告的结果。
            </p>
            <p className="text-[12px] text-mute">
              在本机启动：<code className="bg-paper-deep px-1.5 py-0.5">cd copilot && python -m nps_copilot serve --port 8766</code>，并在 .env.local 里写 COPILOT_URL=http://127.0.0.1:8766
            </p>
          </div>
        )}
      </div>

      {stats && totals && (
        <>
          <div className="mt-2 grid grid-cols-2 gap-x-6 lg:grid-cols-6">
            <Figure label="对话" value={big(totals.turns)} sub={`${totals.sessions} 个会话的轮数`} />
            <Figure label="排出行程" value={percent(totals.planned, totals.turns)} sub={`${totals.planned} 轮；追问 ${totals.needs} 轮`} />
            <Figure label="出错" value={String(totals.error)} sub="plan_trip 拒绝了请求" warn={totals.error > 0} />
            <Figure label="耗时（中位）" value={ms(latencies.length ? [...latencies].sort((a, b) => a - b)[Math.floor(latencies.length / 2)] : null)} sub="每天中位数的中位数" />
            <Figure
              label="模型调用"
              value={big(calls)}
              sub={`${stats.usage.turns} 轮记了调用；出错 ${callErrors}，换备用模型 ${fallbacks}`}
              warn={callErrors > 0 || fallbacks > 0}
            />
            <Figure label="花费" value={money(cost, unpriced)} sub={unpriced ? `${unpriced} 次调用的模型没有价格` : "免费档、本机按 $0 算"} />
          </div>

          <Section title="每天" note={stats.days === 1 ? "今天" : `最近 ${stats.days} 天`}>
            {stats.daily.length ? <DailyChart days={fillDays(stats.daily, stats.days)} /> : <p className="mt-4 text-sm text-mute">这段时间没有日志。</p>}
          </Section>

          <Section title="模型用量" note="按真正回答的那个模型算；前一个模型出错、换到它的，算在“换来的”里">
            {models.length ? (
              <Table
                head={["模型", "调用", "换来的", "出错", "输入 token", "输出 token", "思考 token", "花费"]}
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
              <p className="mt-4 text-sm text-mute">这段时间的日志里还没有记模型调用（10-19 以后的版本才记）。</p>
            )}
            {stats.usage.alerts_read > 0 && (
              <p className="mt-3 text-[11px] text-mute">聊天时现读了 {stats.usage.alerts_read} 条 NPS 公告，那部分的 token 不在上表里。</p>
            )}
          </Section>

          <Section title="质量" note="按 Copilot 版本和提示词版本分，最近用上的在上面；新版本上线后和上一版比，变差就回滚（docs/GUIDE.md）">
            <Table
              head={["版本", "轮数", "排出", "追问", "出错", "中位", "P90", "编造被丢", "规则补", "Writer 退回", "调度员失败", "回答改摘原文"]}
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

      <Section title="NPS 公告" note="Copilot 读公告提取的关闭清单；两周内出发的行程用它，超过 3 天就不用了">
        <div className="mt-4 grid gap-x-10 gap-y-6 lg:grid-cols-2">
          <div>
            <h3 className="eyebrow text-mute">本机的关闭清单</h3>
            {!alerts ? (
              <p className="mt-3 text-sm text-mute">Copilot 没开，看不到。</p>
            ) : !alerts.closures_file ? (
              <p className="mt-3 text-sm text-clay-700">还没有关闭清单：先跑 npm run alerts:fetch 和 python -m nps_copilot alerts。</p>
            ) : (
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-mute">公告抓取</dt>
                <dd className={stale ? "text-clay-700" : ""}>
                  {alerts.fetched}（{daysAgo(alerts.fetched ?? "")} 天前{stale ? "，已经不用了" : ""}）
                </dd>
                <dt className="text-mute">关了网站景点</dt>
                <dd>
                  {alerts.closures} 条：代码也确认的 {alerts.strict}，只有模型找到的 {alerts.model_only}（照排、提醒）
                </dd>
                {alerts.parks ? (
                  <>
                    <dt className="text-mute">覆盖公园</dt>
                    <dd>{alerts.parks} 座，最旧的是 {alerts.oldest_park}</dd>
                  </>
                ) : null}
                <dt className="text-mute">读过的公告</dt>
                <dd>缓存 {alerts.cache_entries} 条（没改过的不再读）{alerts.prompts ? ` · ${alerts.prompts}` : ""}</dd>
              </dl>
            )}
          </div>
          <div>
            <h3 className="eyebrow text-mute">GitHub 上每晚读公告</h3>
            {data?.nightly.error ? (
              <p className="mt-3 text-sm text-mute">查不到 GitHub（{data.nightly.error}）。</p>
            ) : (
              <ul className="mt-3 text-sm">
                {data?.nightly.runs.map((run) => {
                  const ok = run.conclusion === "success";
                  const label = run.status !== "completed" ? "在跑" : ok ? "成功" : run.conclusion === "skipped" ? "跳过" : run.conclusion ?? "?";
                  return (
                    <li key={run.id} className="flex items-baseline justify-between gap-4 border-b border-line py-2">
                      <a href={run.url} target="_blank" rel="noreferrer" className="hover:text-clay-700">
                        {clock(run.created)}
                        <span className="ml-2 text-[11px] text-mute">{run.event === "schedule" ? "定时" : run.event}</span>
                      </a>
                      <span className={ok ? "text-pine-600" : run.status !== "completed" || label === "跳过" ? "text-mute" : "text-clay-700"}>{label}</span>
                    </li>
                  );
                })}
                {data && !data.nightly.runs.length && <li className="py-2 text-mute">还没跑过。</li>}
              </ul>
            )}
            {data?.nightly.issues.length ? (
              <div className="mt-5">
                <h3 className="eyebrow text-mute">还开着的 nps-alerts issue</h3>
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
        <Section title="最近的对话" note="最新的在上面，最多 30 轮；原话只截前 120 个字">
          {stats.recent.length ? (
            <Table
              head={["时间", "说了什么", "结果", "耗时", "模型", "调用", "token", "备注"]}
              align={["l", "l", "l", "r", "l", "r", "r", "l"]}
              rows={stats.recent.map((turn) => [
                <span key="t" className="whitespace-nowrap text-[12px] text-mute">
                  {turn.at ? clock(turn.at) : turn.day.slice(5)}
                  <span className="block text-[10px]">#{turn.session.slice(0, 6)} · {turn.turn}</span>
                </span>,
                <span key="m" className="block max-w-[28rem] leading-6">{turn.message}</span>,
                <span key="s" className={turn.status === "error" ? "text-clay-700" : turn.status === "planned" ? "text-pine-600" : ""}>
                  {STATUS_TEXT[turn.status] ?? turn.status}
                </span>,
                ms(turn.latency_ms),
                <span key="md" className="text-[12px]">{turn.logged === false ? <span className="text-mute">旧日志没记</span> : turn.models.join("、") || "—"}</span>,
                turn.calls,
                big(turn.tokens),
                <span key="n" className="text-[12px] text-clay-700">
                  {[
                    turn.fallback && "换了备用模型",
                    turn.call_errors && `${turn.call_errors} 次调用出错`,
                    turn.dropped && `丢掉编造 ${turn.dropped}`,
                    turn.writer_fallback && "说明退回模板",
                  ]
                    .filter(Boolean)
                    .join("；")}
                </span>,
              ])}
            />
          ) : (
            <p className="mt-4 text-sm text-mute">这段时间没有对话。</p>
          )}
        </Section>
      )}
    </div>
  );
}
