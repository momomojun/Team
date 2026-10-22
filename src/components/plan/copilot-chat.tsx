"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CommonsImage } from "@/components/commons-image";
import { IconArrowRight } from "@/components/icons";
import { buttonLarge } from "@/components/ui";
import { fill } from "@/i18n/format";
import type { Trip } from "@/lib/trip-store";
import type { PlannerPark, PlannerText } from "./types";

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
  parks,
  onTrip,
}: {
  text: PlannerText;
  english: boolean;
  /** 等的时候放这几座公园的首图 */
  parks: PlannerPark[];
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
      let reply: (ChatReply & { error?: string }) | null = null;
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
                  ? { ...current, steps: current.steps.includes(step) ? current.steps : [...current.steps, step], conditions: event.conditions ?? current.conditions }
                  : current,
              );
            } else if (event.type === "reply") reply = event;
            else if (event.type === "error") reply = { ...event, error: event.error ?? "copilot" };
          }
        }
      } else reply = (await response.json()) as ChatReply & { error?: string };
      if (!response.ok || !reply || reply.error) {
        setError(reply?.error === "offline" ? t.offline : t.error);
        return;
      }
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
                  <ChatProgress progress={progress} parks={parks} english={english} text={t} />
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

const STEPS: Step[] = ["understand", "read", "alerts", "plan", "write"];

/**
 * 等回复时的过渡：按 Copilot 真实做到的步骤打勾（理解需求 → 读 NPS 公告（真要现读才出现）→ 排每天的路线 → 写说明；
 * 只是问问题的是“查资料回答”），旁边写已经等了几秒；认出了公园、日期、天数先显示出来，不对可以早点改；
 * 下面放这几座公园的首图，几秒换一张
 */
function ChatProgress({
  progress,
  parks,
  english,
  text,
}: {
  progress: Progress;
  parks: PlannerPark[];
  english: boolean;
  text: PlannerText["plan"]["copilot"];
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);
  const seconds = Math.max(0, Math.floor((now - progress.started) / 1000));
  const answering = progress.steps.includes("answer") && !progress.steps.includes("plan");
  // 没读条件（调度员直接判断是提问）的不显示“读出条件”；真要现读公告才显示那一步
  const shown: Step[] = answering
    ? ["understand", "answer"]
    : STEPS.filter((step) => (step !== "alerts" || progress.steps.includes("alerts")) && (step !== "read" || !progress.steps.includes("plan") || progress.steps.includes("read")));
  const current: Step = progress.steps.at(-1) ?? "understand";
  const conditions = progress.conditions;
  const photos = (conditions?.parkCodes ?? []).flatMap((code) => {
    const park = parks.find((item) => item.code === code);
    return park?.photo ? [{ ...park.photo, name: english ? park.nameEn : park.nameZh }] : [];
  });
  const photo = photos.length ? photos[Math.floor(seconds / 5) % photos.length] : undefined;
  const t = text.progress;
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
    <div className="max-w-xl">
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow text-mute">{text.name}</p>
        <p className="text-xs text-mute tabular-nums">{fill(t.elapsed, { s: seconds })}</p>
      </div>
      {summary && <p className="mt-2 font-serif text-lg leading-snug lining-nums">{summary}</p>}
      <ol className="mt-3 space-y-1.5 text-sm">
        {shown.map((step) => {
          const done = progress.steps.includes(step) && step !== current;
          const active = step === current;
          return (
            <li key={step} className={`flex items-center gap-2.5 ${done ? "text-ink-soft" : active ? "text-ink" : "text-mute"}`}>
              <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
                {done ? (
                  <span className="text-[13px] text-clay-600">✓</span>
                ) : active ? (
                  <span className="size-1.5 animate-pulse rounded-full bg-clay-600 motion-reduce:animate-none" />
                ) : (
                  <span className="size-1.5 rounded-full border border-current" />
                )}
              </span>
              {t.steps[step]}
            </li>
          );
        })}
      </ol>
      {photo && (
        <figure className="relative mt-4 aspect-[16/7] w-full overflow-hidden bg-paper-deep">
          <CommonsImage key={photo.src} src={photo.src} alt="" fill sizes="576px" className="tour-pop object-cover" />
          <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-ink/70 to-transparent px-3 pt-8 pb-2 text-paper">
            <span className="font-serif text-base">{photo.name}</span>
            <span className="truncate text-[10px] text-paper/75">{photo.credit}</span>
          </figcaption>
        </figure>
      )}
    </div>
  );
}
