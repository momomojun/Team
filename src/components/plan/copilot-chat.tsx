"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { IconArrowRight } from "@/components/icons";
import { buttonLarge } from "@/components/ui";
import { fill } from "@/i18n/format";
import type { Trip } from "@/lib/trip-store";
import type { PlannerText } from "./types";

/**
 * 行程页的对话框：用一句话说需求，Copilot（本机模型 + 网站的排行程引擎）追问、排出行程，行程原样放进下面的行程页，
 * 之后还能接着说“第二天轻松一点”“第三晚住 Jackson”。经 /api/copilot/chat 中转；Copilot 没开（比如部署在 Vercel 上）
 * 就整块不显示，页面照旧能用
 */
interface Question {
  kind: string;
  text: string;
  /** 选公园、机场的是 {zh, en}；选节奏这类是 {label, note}（已经按对话的语言写好） */
  options?: { zh?: string; en?: string; label?: string; note?: string }[];
}

interface Message {
  role: "user" | "copilot";
  text: string;
  question?: Question | null;
  /** 这一句排出了新的行程，已经放进行程页 */
  applied?: boolean;
}

/** Copilot 边做边报的一步（真实的步骤，不是按时间假装走进度） */
type Step = "understand" | "read" | "alerts" | "plan" | "write" | "answer";
interface Conditions {
  parks: string[];
  parkCodes: string[];
  startDate?: string | null;
  month?: number | null;
  days?: number | null;
  origin?: string | null;
}
interface Progress {
  steps: Step[];
  conditions?: Conditions;
  started: number;
  /** 最近一步是什么时候报的 */
  at?: number;
  /** 回复到了：车开到头 */
  done?: boolean;
}

interface ChatReply {
  session: string;
  status: "needs_input" | "planned" | "error";
  text: string;
  question: Question | null;
  trip: Trip | null;
}

export function CopilotChat({
  text,
  english,
  onTrip,
}: {
  text: PlannerText;
  english: boolean;
  /** 排出了行程：放进行程页；返回 false 表示用户不想换掉现在的行程 */
  onTrip: (trip: Trip) => boolean;
}) {
  const t = text.plan.copilot;
  const [available, setAvailable] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const session = useRef<string | null>(null);
  // 上一次放进行程页的行程：只是回答问题、条件没变时不重新放（免得冲掉用户手动调整的）
  const lastTrip = useRef<string | null>(null);
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/copilot/chat")
      .then((response) => response.json())
      .then((health: { available: boolean }) => alive && setAvailable(health.available))
      .catch(() => alive && setAvailable(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    list.current?.lastElementChild?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages, busy]);

  if (!available) return null;

  const send = async (said: string) => {
    const message = said.trim();
    if (!message || busy) return;
    setMessages((current) => [...current, { role: "user", text: message }]);
    setDraft("");
    setBusy(true);
    setError(null);
    setProgress({ steps: [], started: Date.now() });
    try {
      const response = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message, session: session.current, stream: true }),
      });
      let reply: (ChatReply & { error?: string; retryAfter?: number }) | null = null;
      if (response.ok && response.headers.get("Content-Type")?.includes("ndjson") && response.body) {
        // 边做边报：一行一个 JSON，进度一到就显示，最后一行是这一轮的回复
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as { type: string; step?: Step; conditions?: Conditions } & ChatReply & { error?: string };
            if (event.type === "progress" && event.step) {
              const step = event.step;
              setProgress((current) =>
                current
                  ? current.steps.includes(step)
                    ? { ...current, conditions: event.conditions ?? current.conditions }
                    : { ...current, steps: [...current.steps, step], at: Date.now(), conditions: event.conditions ?? current.conditions }
                  : current,
              );
            } else if (event.type === "reply") reply = event;
            else if (event.type === "error") reply = { ...event, error: event.error ?? "copilot" };
          }
        }
      } else reply = (await response.json()) as ChatReply & { error?: string };
      if (!response.ok || !reply || reply.error) {
        setError(
          reply?.error === "offline"
            ? t.offline
            : reply?.error === "rate_limited"
              ? fill(t.rateLimited, { n: reply.retryAfter ?? 60 })
              : t.error,
        );
        return;
      }
      // 车开到终点、帐篷亮起来，再换成回复
      setProgress((current) => (current ? { ...current, done: true } : current));
      await new Promise((resolve) => setTimeout(resolve, 700));
      session.current = reply.session;
      let applied = false;
      if (reply.trip) {
        const key = JSON.stringify(reply.trip);
        if (key !== lastTrip.current && onTrip(reply.trip)) {
          lastTrip.current = key;
          applied = true;
        }
      }
      setMessages((current) => [...current, { role: "copilot", text: reply.text, question: reply.question, applied }]);
    } catch {
      setError(t.offline);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void send(draft);
  };
  const restart = () => {
    session.current = null;
    lastTrip.current = null;
    setMessages([]);
    setError(null);
  };
  const last = messages.at(-1);
  const options = last?.role === "copilot" ? (last.question?.options ?? []) : [];

  return (
    <section id="plan-copilot" className="scroll-mt-32 border-t border-ink pt-6 print:hidden">
      <div className="max-w-2xl">
        <p className="eyebrow text-mute">{t.eyebrow}</p>
        <h2 className="mt-4 font-serif text-2xl leading-snug">{t.title}</h2>
        <p className="mt-3 text-sm leading-7 text-ink-soft">{t.intro}</p>
      </div>
      <div className="mt-8">
        {messages.length === 0 ? (
          <div className="flex flex-wrap gap-2">
            {t.examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => void send(example)}
                className="border border-ink/20 px-3 py-1.5 text-left text-xs leading-5 text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                {example}
              </button>
            ))}
          </div>
        ) : (
          <ol ref={list} className="max-h-[28rem] space-y-5 overflow-y-auto pr-1" aria-live="polite">
            {messages.map((message, i) => (
              <li key={i} className={message.role === "user" ? "flex justify-end" : ""}>
                {message.role === "user" ? (
                  <p className="max-w-[85%] bg-ink px-4 py-2.5 text-sm leading-7 text-paper">{message.text}</p>
                ) : (
                  <div className="max-w-[92%] border-l-2 border-clay-600 pl-4">
                    <p className="eyebrow text-mute">{t.name}</p>
                    <p className="mt-1.5 whitespace-pre-line text-sm leading-7 text-ink">{message.text}</p>
                    {message.applied && (
                      <a href="#plan-overview" className="link-line mt-2 inline-block text-xs tracking-[0.1em] text-clay-700">
                        {t.applied}
                      </a>
                    )}
                  </div>
                )}
              </li>
            ))}
            {busy && (
              <li className="border-l-2 border-line pl-4">
                {progress ? (
                  <ChatProgress progress={progress} english={english} text={t} />
                ) : (
                  <span className="animate-pulse text-sm text-mute">{t.thinking}</span>
                )}
              </li>
            )}
          </ol>
        )}

        {options.length > 0 && !busy && (
          <div className="mt-4 flex flex-wrap gap-2">
            {options.map((option) => {
              const label = option.label ?? (english ? option.en : option.zh) ?? "";
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => void send(label)}
                    className="border border-ink/20 px-3 py-1.5 text-left text-xs transition-colors hover:border-ink"
                >
                  {label}
                  {option.note && <span className="ml-2 text-mute">{option.note}</span>}
                </button>
              );
            })}
          </div>
        )}

        <form onSubmit={submit} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{t.placeholder}</span>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                // 回车发送，Shift + 回车换行；输入法正在选字时的回车不算
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  void send(draft);
                }
              }}
              rows={2}
              maxLength={2000}
              placeholder={messages.length === 0 ? t.placeholder : t.followUp}
              className="w-full resize-none border-b border-ink/30 bg-transparent py-2 text-sm leading-7 focus:border-ink focus:outline-none"
            />
          </label>
          <div className="flex items-center gap-5">
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className={`${buttonLarge} bg-ink text-paper hover:bg-clay-700 disabled:opacity-50`}
            >
              {t.send}
              <IconArrowRight className="text-base" />
            </button>
            {messages.length > 0 && (
              <button type="button" onClick={restart} disabled={busy} className="link-line text-xs tracking-[0.1em]">
                {t.restart}
              </button>
            )}
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-clay-700">{error}</p>}
        <p className="mt-4 text-xs leading-6 text-mute">{t.note}</p>
      </div>
    </section>
  );
}

/** 每一步做完时进度条走到哪（0–1）；两步之间慢慢往下一步挪，不会停住，也不会超过下一步 */
const MARK: Record<Step, number> = { understand: 0.08, read: 0.22, alerts: 0.36, plan: 0.48, write: 0.82, answer: 0.4 };
const NEXT: Record<Step, number> = { understand: 0.2, read: 0.45, alerts: 0.46, plan: 0.8, write: 0.97, answer: 0.95 };

function progressOf(progress: Progress, now: number): number {
  if (progress.done) return 1;
  const step = progress.steps.at(-1);
  const from = step ? MARK[step] : 0;
  const to = step ? NEXT[step] : 0.07;
  const waited = Math.max(0, now - (progress.at ?? progress.started)) / 1000;
  return from + (to - from) * (1 - Math.exp(-waited / 9));
}

// 画面：远山、近山和松树，前面一条公路；车沿着路往右开，开过的路是砂岩红，太阳跟着升起来，开到头是今晚的帐篷
const W = 600;
const ROAD_FROM = 26;
const ROAD_TO = 566;
const roadY = (x: number) => 128 + 5 * Math.sin(x / 61 + 0.7);
const hillY = (x: number) => 103 + 5 * Math.sin(x / 47) + 4 * Math.sin(x / 113 + 1.3);
const trace = (f: (x: number) => number, from: number, to: number) =>
  Array.from({ length: Math.round((to - from) / 6) + 1 }, (_, i) => {
    const x = Math.min(to, from + i * 6);
    return `${i ? "L" : "M"}${x.toFixed(1)} ${f(x).toFixed(1)}`;
  }).join(" ");
const ROAD = trace(roadY, ROAD_FROM, ROAD_TO);
const HILL = trace(hillY, 0, W);
const RIDGE = "M0 88 L34 78 L70 84 L112 58 L144 70 L190 46 L226 66 L262 56 L300 74 L336 62 Q350 34 384 32 L388 32 L391 70 L430 60 L468 52 L506 70 L548 56 L600 66";
const PINES = [52, 63, 74, 206, 218, 418, 431, 512, 523, 534];
const POSTS = [0.25, 0.5, 0.75];

/**
 * 等回复时的过渡：一张国家公园公路旅行的小画，进度条就是那条路。进度按 Copilot 真实做到的步骤推（边做边报），
 * 但不把步骤念出来，下面一句话跟着进度换；认出了公园、日期、天数先写出来
 */
function ChatProgress({ progress, english, text }: { progress: Progress; english: boolean; text: PlannerText["plan"]["copilot"] }) {
  const t = text.progress;
  const answering = progress.steps.includes("answer") && !progress.steps.includes("plan");
  const lines = answering ? t.answer : t.plan;
  // 车、路、太阳每帧直接改 SVG（不经过 React）：显示的进度每帧往真实进度靠一点（新的一步报上来时不会一下跳过去），
  // 车每帧都按路的曲线算位置、跟着坡度转，不再是每 0.25 秒重画一次、靠 CSS 过渡走直线切弯。
  // 下面那句话、路边的里程桩、终点的帐篷只在变了的时候才改（React 状态）
  const progressRef = useRef(progress);
  const carRef = useRef<SVGGElement>(null);
  const sunRef = useRef<SVGGElement>(null);
  const roadRef = useRef<SVGPathElement>(null);
  const percentRef = useRef<HTMLParagraphElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [marks, setMarks] = useState({ line: 0, posts: 0, done: false });
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  const lineCount = lines.length;
  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let shown = progressOf(progressRef.current, Date.now());
    let last = performance.now();
    let raf = 0;
    let percent = -1;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(64, now - last);
      last = now;
      const target = progressOf(progressRef.current, Date.now());
      // 指数地追过去（回复到了追得快一点），只往前不往后
      shown = calm ? target : Math.max(shown, shown + (target - shown) * (1 - Math.exp(-dt / (progressRef.current.done ? 160 : 420))));
      const x = ROAD_FROM + shown * (ROAD_TO - ROAD_FROM);
      const tilt = (Math.atan((5 / 61) * Math.cos(x / 61 + 0.7)) * 180) / Math.PI;
      carRef.current?.setAttribute("transform", `translate(${x.toFixed(2)} ${roadY(x).toFixed(2)}) rotate(${tilt.toFixed(2)})`);
      sunRef.current?.setAttribute("transform", `translate(0 ${((1 - shown) * 62).toFixed(2)})`);
      if (roadRef.current) roadRef.current.style.strokeDasharray = `${shown.toFixed(4)} 1`;
      const rounded = Math.round(shown * 100);
      if (rounded !== percent) {
        percent = rounded;
        if (percentRef.current) percentRef.current.textContent = `${rounded}%`;
        rootRef.current?.setAttribute("aria-valuenow", String(rounded));
        const next = {
          line: Math.min(lineCount - 1, Math.floor(shown * lineCount)),
          posts: POSTS.filter((at) => shown >= at).length,
          done: shown >= 0.999,
        };
        setMarks((current) => (current.line === next.line && current.posts === next.posts && current.done === next.done ? current : next));
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [lineCount]);
  const line = lines[Math.min(lines.length - 1, marks.line)];
  const conditions = progress.conditions;
  const when = conditions?.startDate
    ? fill(t.from, { m: Number(conditions.startDate.slice(5, 7)), d: Number(conditions.startDate.slice(8, 10)) })
    : conditions?.month
      ? fill(t.month, { m: conditions.month })
      : null;
  const summary = conditions
    ? [
        conditions.parks.join(english ? " + " : "、"),
        when,
        conditions.days ? fill(t.days, { n: conditions.days }) : null,
        conditions.origin ? fill(t.origin, { origin: conditions.origin }) : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;
  return (
    <div ref={rootRef} className="max-w-xl" role="progressbar" aria-label={t.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow text-mute">{text.name}</p>
        <p ref={percentRef} className="font-serif text-sm text-ink-soft tabular-nums lining-nums">
          0%
        </p>
      </div>
      <svg viewBox={`0 0 ${W} 150`} className="mt-2 block w-full" aria-hidden="true">
        {/* 太阳：画在山后面，进度越多升得越高 */}
        <g ref={sunRef} transform="translate(0 62)">
          <circle cx={462} cy={36} r={12} className="fill-clay-300" opacity={0.85} />
        </g>
        <path d={`${RIDGE} L600 150 L0 150 Z`} className="fill-paper-deep" />
        <path d={RIDGE} fill="none" className="stroke-ink/25" strokeWidth={1} strokeLinejoin="round" />
        <path d={`${HILL} L600 150 L0 150 Z`} className="fill-paper" />
        <path d={HILL} fill="none" className="stroke-ink/50" strokeWidth={1} />
        {PINES.map((px, i) => {
          const h = 11 + (i % 3) * 3;
          const base = hillY(px) + 2;
          return <path key={px} d={`M${px - 3.6} ${base} L${px} ${base - h} L${px + 3.6} ${base} Z`} className="fill-ink-soft" />;
        })}
        {/* 路：还没开的是虚线，开过的是砂岩红 */}
        <path d={ROAD} fill="none" className="stroke-ink/12" strokeWidth={7} strokeLinecap="round" />
        <path d={ROAD} fill="none" pathLength={1} className="stroke-ink/40" strokeWidth={1.1} strokeDasharray="0.01 0.012" />
        <path ref={roadRef} d={ROAD} fill="none" pathLength={1} className="stroke-clay-600" strokeWidth={2.4} strokeLinecap="round" strokeDasharray="0 1" />
        {POSTS.map((at, index) => {
          const px = ROAD_FROM + at * (ROAD_TO - ROAD_FROM);
          const py = roadY(px) + 7;
          return (
            <path
              key={at}
              d={`M${px} ${py} V${py + 7}`}
              className={`${index < marks.posts ? "stroke-clay-600" : "stroke-ink/35"} transition-colors duration-300`}
              strokeWidth={1.4}
            />
          );
        })}
        {/* 起点的路牌、终点的帐篷（今晚住的地方） */}
        <path d={`M${ROAD_FROM - 6} ${roadY(ROAD_FROM) + 3} V${roadY(ROAD_FROM) - 16}`} className="stroke-ink" strokeWidth={1.4} />
        <rect x={ROAD_FROM - 13} y={roadY(ROAD_FROM) - 22} width={14} height={8} className="fill-clay-700" />
        <g transform={`translate(${ROAD_TO + 18} ${roadY(ROAD_TO) + 2})`}>
          <path
            d="M-13 0 L-1 -15 L1 -15 L13 0 Z"
            className={`${marks.done ? "fill-clay-600" : "fill-paper"} stroke-ink transition-colors duration-500`}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
          <path d="M-4 0 L0 -7 L4 0 Z" className="fill-ink" />
          <path d="M-1 -15 L-3 -18 M1 -15 L3 -18 M-17 0 H17" className="stroke-ink" strokeWidth={1} strokeLinecap="round" />
        </g>
        {/* 车 */}
        <g ref={carRef} transform={`translate(${ROAD_FROM} ${roadY(ROAD_FROM)})`}>
          <path d="M-9 -3.2 L-9 -7.6 Q-9 -8.6 -8 -8.6 L-5.4 -8.6 L-3 -12.4 L4.2 -12.4 L6.8 -8.6 L8.4 -8.6 Q9.4 -8.6 9.4 -7.6 L9.4 -3.2 Z" className="fill-ink" />
          <path d="M-2.2 -11.2 L-0.4 -11.2 L-0.4 -8.8 L-3.8 -8.8 Z M0.8 -11.2 L3.6 -11.2 L5.4 -8.8 L0.8 -8.8 Z" className="fill-paper/85" />
          <circle cx={-5} cy={-2.6} r={2.3} className="fill-ink stroke-paper" strokeWidth={0.9} />
          <circle cx={5.4} cy={-2.6} r={2.3} className="fill-ink stroke-paper" strokeWidth={0.9} />
        </g>
      </svg>
      <p key={line} className="tour-pop mt-1 text-sm text-ink-soft">
        {line}
      </p>
      {summary && <p className="mt-2 font-serif text-lg leading-snug lining-nums">{summary}</p>}
    </div>
  );
}
