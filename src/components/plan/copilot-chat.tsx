"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CommonsImage } from "@/components/commons-image";
import { IconArrowDown, IconArrowUp, IconCheck } from "@/components/icons";
import type { HeaderPhoto } from "@/components/site/page-header";
import { fill } from "@/i18n/format";
import { replyBlocks, type DayBlock, type ReplyBlock } from "@/lib/copilot/reply-blocks";
import { useTrip, type Trip } from "@/lib/trip-store";
import type { PlannerText } from "./types";

/**
 * 行程页的对话框：用一句话说需求，Copilot（AI 模型 + 网站的排行程引擎）追问、排出行程，行程原样放进下面的行程页，
 * 之后还能接着说“第二天轻松一点”“第三晚住 Jackson”。经 /api/copilot/chat 中转。
 * 11-20 改版：放在行程页最上面当首屏（大照片做底），一直显示：还在确认 Copilot 开没开时写“正在唤醒”，连不上就写“暂时用不了”。
 * 11-27 改版（仓库主人：规划行程时 ChatGPT 的交互最好，照着学）：
 * - 还没开始时是首屏（大标题 + 输入框 + 几句例子）；一开始说话就变成对话：上面一条细标题和“新对话”，中间一栏对话可以滚动，输入框在下面；
 * - 回复按块排版（reply-blocks.ts）：每天一段路线（出发、各站的时间、住哪），列表、小标题分开，不再是一大段字；
 * - 新的回复一块一块出来（像 ChatGPT 边写边出），出完才显示选项、按钮；系统设了“减少动画”的一下子全出来；
 * - 等回复时写着真实做到哪一步、用了几秒；回复下面一行写这一轮哪几个角色做了事（点开看每一步），模型做的是金点；
 * - 追问的选项放在这条回复里面，带编号（直接打“2”也行）；排好以后给几句接着说的例子；
 * - 每条回复能复制；等回复时发送键变成“停止”；往上翻了，右下角出“回到最新”；出错了能“再试一次”
 */
interface Question {
  kind: string;
  text: string;
  /** 选公园、机场的是 {zh, en}；选节奏这类是 {label, note}（已经按对话的语言写好） */
  options?: { zh?: string; en?: string; label?: string; note?: string }[];
}

/** 这一轮谁做了什么（Copilot 的 steps，11-23）：调度员、search agent、规划 agent、行程引擎、审查 agent…… */
interface AgentStep {
  who: string;
  text: string;
  /** 这一步调了模型（不然是确定的代码） */
  model: boolean;
}

interface Message {
  id: number;
  /** note：网站自己说的一句（停下了、出错了），不存、不算对话 */
  role: "user" | "copilot" | "note";
  text: string;
  question?: Question | null;
  steps?: AgentStep[];
  /** 这一句排出了新的行程，已经放进行程页 */
  applied?: boolean;
  planned?: boolean;
  /** 这一轮用了多少毫秒 */
  ms?: number;
  /** 刚到的回复：一块一块出来；恢复出来的旧对话直接全显示 */
  fresh?: boolean;
  /** 出错的 note：可以再试一次 */
  retry?: string;
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

function persistChat(sessionId: string | null, messages: Message[]) {
  void fetch("/api/me/chat", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      messages: messages.filter((message) => message.role !== "note").map((message) => ({ role: message.role, text: message.text })),
    }),
  }).catch(() => undefined);
}

interface ChatReply {
  session: string;
  status: "needs_input" | "planned" | "error";
  text: string;
  question: Question | null;
  steps?: AgentStep[];
  trip: Trip | null;
}

type ChatText = PlannerText["plan"]["copilot"];

let nextId = 1;
const newId = () => nextId++;

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function CopilotChat({
  text,
  english,
  onTrip,
  photo,
}: {
  text: PlannerText;
  english: boolean;
  /** 排出了行程：放进行程页；返回 false 表示用户不想换掉现在的行程 */
  onTrip: (trip: Trip) => boolean;
  /** 首屏的底图（行程里第一座公园的首图） */
  photo?: HeaderPhoto;
}) {
  const t = text.plan.copilot;
  const [available, setAvailable] = useState<boolean | null>(null);
  const trip = useTrip();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  // 从首页搜索框、“照这句话排”过来的（?q=一句话）：先填进输入框，等用户按发送（Copilot 可能还在唤醒）
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q")?.trim();
    if (!q) return;
    const timer = setTimeout(() => setDraft(q.slice(0, 2000)));
    return () => clearTimeout(timer);
  }, []);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  // 最新那条回复还在一块一块地出：出完才显示选项、接着说的例子
  const [revealing, setRevealing] = useState<number | null>(null);
  const session = useRef<string | null>(null);
  // 上一次放进行程页的行程：只是回答问题、条件没变时不重新放（免得冲掉用户手动调整的）
  const lastTrip = useRef<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);
  // 用户往上翻了就不再自动滚到底，右下角给一个“回到最新”
  const stick = useRef(true);
  const [awayFromBottom, setAwayFromBottom] = useState(false);

  useEffect(() => {
    // 网站这边最多等 30 秒；Modal 冷启动偶尔更久，没连上就隔 10 秒再问，一共问 4 次（约 1 分半）才说“暂时用不了”
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = (left: number) =>
      fetch("/api/copilot/chat")
        .then((response) => response.json())
        .then((health: { available: boolean }) => health.available)
        .catch(() => false)
        .then((ok) => {
          if (!alive) return;
          if (ok || left <= 1) setAvailable(ok);
          else timer = setTimeout(() => void check(left - 1), 10_000);
        });
    void check(4);
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let cancel = false;
    fetch("/api/me/chat")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { sessionId?: string | null; messages?: { role: "user" | "copilot"; text: string }[] } | null) => {
        // 已经开始新的对话了（会话号有了）就不再接上次的
        if (cancel || !data?.messages?.length || session.current !== null) return;
        const restored = data.messages.map((message) => ({ id: newId(), role: message.role, text: message.text }));
        session.current = data.sessionId ?? null;
        setMessages((current) => (current.length ? current : restored));
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, []);

  const toBottom = useCallback((smooth = false) => {
    const box = scroller.current;
    if (box) box.scrollTo({ top: box.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);
  const follow = useCallback(() => {
    if (stick.current) toBottom();
  }, [toBottom]);
  useLayoutEffect(() => {
    follow();
  }, [messages, busy, follow]);
  const onScroll = () => {
    const box = scroller.current;
    if (!box) return;
    const away = box.scrollHeight - box.scrollTop - box.clientHeight > 80;
    stick.current = !away;
    setAwayFromBottom(away);
  };

  // Copilot 回了一句以后存一次（只存回复以后的，不存恢复出来的）
  const saveAfterRender = useRef(false);
  useEffect(() => {
    if (!saveAfterRender.current) return;
    saveAfterRender.current = false;
    persistChat(session.current, messages);
  }, [messages]);

  // 输入框跟着字数长高，最多八行左右，再多就在框里滚
  useLayoutEffect(() => {
    const box = input.current;
    if (!box) return;
    box.style.height = "auto";
    box.style.height = `${Math.min(box.scrollHeight, 208)}px`;
  }, [draft]);

  const send = async (said: string) => {
    const message = said.trim();
    if (!message || busy || !available) return;
    stick.current = true;
    setAwayFromBottom(false);
    setMessages((current) => [...current.filter((item) => !item.retry), { id: newId(), role: "user", text: message }]);
    setDraft("");
    setBusy(true);
    setRevealing(null);
    const started = Date.now();
    setProgress({ steps: [], started });
    const controller = new AbortController();
    abort.current = controller;
    const note = (textOf: string, retry?: string) =>
      setMessages((current) => [...current, { id: newId(), role: "note", text: textOf, ...(retry ? { retry } : {}) }]);
    try {
      const response = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message, session: session.current, stream: true }),
        signal: controller.signal,
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
        note(
          reply?.error === "offline" ? t.offline : reply?.error === "rate_limited" ? fill(t.rateLimited, { n: reply.retryAfter ?? 60 }) : t.error,
          message,
        );
        return;
      }
      // 车开到终点、帐篷亮起来，再换成回复
      setProgress((current) => (current ? { ...current, done: true } : current));
      await new Promise((resolve) => setTimeout(resolve, reducedMotion() ? 0 : 500));
      session.current = reply.session;
      let applied = false;
      if (reply.trip) {
        const key = JSON.stringify(reply.trip);
        if (key !== lastTrip.current && onTrip(reply.trip)) {
          lastTrip.current = key;
          applied = true;
        }
      }
      const saved = reply;
      const id = newId();
      // 存进 Neon 在下面的 effect 里做：setState 的更新函数要保持“纯”，React 可能跑两遍
      saveAfterRender.current = true;
      setRevealing(id);
      setMessages((current) => [
        ...current,
        {
          id,
          role: "copilot" as const,
          text: saved.text,
          question: saved.question,
          steps: saved.steps,
          applied,
          planned: saved.status === "planned",
          ms: Date.now() - started,
          fresh: true,
        },
      ]);
    } catch {
      if (controller.signal.aborted) note(t.stopped);
      else note(t.offline, message);
    } finally {
      abort.current = null;
      setBusy(false);
      setProgress(null);
    }
  };

  const retry = (said: string) => {
    // 把出错那句的原话拿掉再发一遍（send 会重新加上）
    setMessages((current) => {
      let lastUser = -1;
      current.forEach((item, index) => {
        if (item.role === "user" && item.text === said) lastUser = index;
      });
      return current.filter((item, index) => index !== lastUser && !item.retry);
    });
    void send(said);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) abort.current?.abort();
    else void send(draft);
  };
  const restart = () => {
    abort.current?.abort();
    session.current = null;
    lastTrip.current = null;
    setMessages([]);
    setRevealing(null);
    input.current?.focus();
  };

  const lastCopilot = [...messages].reverse().find((message) => message.role === "copilot");
  const last = messages.at(-1);
  const settled = !busy && last?.role === "copilot" && revealing !== last.id;
  // Copilot 还在追问、这次对话还没排出行程，下面显示的却是以前的行程：说一声，免得当成排错了（11-05 仓库主人就误会了）
  const oldTripBelow =
    settled &&
    Boolean(last?.question) &&
    !messages.some((message) => message.applied) &&
    (trip.pool.length > 0 || trip.days.some((day) => day.length > 0));

  const status = available === null ? t.waking : available === false ? t.unavailable : null;
  const chatting = messages.length > 0;

  const composer = (
    <form onSubmit={submit} className={`w-full ${chatting ? "" : "mt-10"}`}>
      <div className="flex items-end gap-2 border border-white/20 bg-night/70 p-2 backdrop-blur-sm transition-colors focus-within:border-clay-600/80">
        <label className="min-w-0 flex-1">
          <span className="sr-only">{t.placeholder}</span>
          <textarea
            ref={input}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // 回车发送，Shift + 回车换行；输入法正在选字时的回车不算
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                if (!busy) void send(draft);
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder={chatting ? t.followUp : t.placeholder}
            className="block max-h-52 min-h-12 w-full resize-none bg-white px-4 py-3 text-left font-serif text-base leading-6 text-[#1a150e] placeholder:text-[#8a8278] focus:outline-none"
          />
        </label>
        {busy ? (
          <button
            type="submit"
            aria-label={t.stop}
            title={t.stop}
            className="flex size-12 shrink-0 items-center justify-center border border-white/40 text-white transition-colors hover:border-clay-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-600"
          >
            <i aria-hidden className="block size-3 bg-current" />
          </button>
        ) : (
          <button
            type="submit"
            aria-label={t.send}
            title={t.send}
            disabled={!draft.trim() || !available}
            className="flex size-12 shrink-0 items-center justify-center bg-gold text-on-gold transition-colors hover:bg-gold-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-600 disabled:opacity-40"
          >
            <IconArrowUp className="text-lg" />
          </button>
        )}
      </div>
    </form>
  );

  const footer = (
    <p
      className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-white/65 ${chatting ? "mt-2.5 justify-between" : "mt-6 justify-center text-[13px]"}`}
      aria-live="polite"
    >
      {status ? (
        <span>
          <span aria-hidden className={available === null ? "mr-1.5 animate-pulse text-clay-600" : "mr-1.5 text-white/50"}>
            ●
          </span>
          {status}
        </span>
      ) : (
        chatting && <span className="hidden sm:inline">{t.hint}</span>
      )}
      <a href="#plan-wizard" className="link-line text-clay-600">
        {t.manual}
      </a>
    </p>
  );

  return (
    <section id="plan-copilot" className="theme-dark relative -mx-5 scroll-mt-16 overflow-hidden bg-night text-white sm:-mx-10 print:hidden">
      {photo && <CommonsImage src={photo.src} alt="" fill priority sizes="100vw" className="animate-drift object-cover" />}
      {/* 照片上压一层夜色，保证字看得清；开始对话以后压得更深，长回复读着不累 */}
      <div aria-hidden className={`absolute inset-0 transition-colors duration-700 ${chatting ? "bg-night/90" : "bg-black/55"}`} />

      {!chatting ? (
        <div className="relative mx-auto flex min-h-[560px] max-w-4xl flex-col items-center justify-center px-5 py-16 text-center sm:px-10 sm:py-24">
          <p className="eyebrow text-clay-600">{t.eyebrow}</p>
          <h1 className="mt-6 font-serif text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.12] text-balance [word-break:keep-all]">{t.title}</h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-8 text-white/80">{t.intro}</p>
          {composer}
          <ul className="mt-5 grid w-full gap-2 sm:grid-cols-3">
            {t.examples.map((example) => (
              <li key={example}>
                <button
                  type="button"
                  onClick={() => void send(example)}
                  disabled={!available}
                  className="h-full w-full border border-white/20 bg-night/40 px-4 py-3 text-left font-serif text-[14px] leading-6 text-white/85 transition-colors hover:border-clay-600 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-600 disabled:cursor-default disabled:hover:border-white/20"
                >
                  {example}
                </button>
              </li>
            ))}
          </ul>
          {footer}
          <p className="mt-6 max-w-2xl text-[11px] leading-5 text-white/55">{t.note}</p>
        </div>
      ) : (
        <div className="relative mx-auto flex max-w-3xl flex-col px-5 pt-6 pb-6 sm:px-8 sm:pt-8">
          <header className="flex items-center justify-between gap-4 border-b border-white/12 pb-3">
            <h1 className="min-w-0 truncate font-serif text-lg text-white/90">
              <span className="mr-2.5 text-clay-600">{t.name}</span>
              <span className="text-white/60">{t.title}</span>
            </h1>
            <button
              type="button"
              onClick={restart}
              className="shrink-0 border border-white/25 px-3 py-1.5 text-[12px] tracking-[0.06em] text-white/85 transition-colors hover:border-clay-600 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-600"
            >
              {t.newChat}
            </button>
          </header>

          <div className="relative">
            <div
              ref={scroller}
              onScroll={onScroll}
              className="h-[min(66vh,680px)] min-h-[380px] overflow-y-auto overscroll-contain py-6 pr-1 [scrollbar-color:rgba(255,255,255,0.2)_transparent] [scrollbar-width:thin]"
            >
              <ol className="space-y-7" aria-live="polite">
                {messages.map((message) => (
                  <li key={message.id}>
                    {message.role === "user" ? (
                      <div className="flex justify-end">
                        <p className="max-w-[85%] border border-white/10 bg-paper-deep px-4 py-2.5 text-[15px] leading-7 whitespace-pre-line text-white">
                          {message.text}
                        </p>
                      </div>
                    ) : message.role === "note" ? (
                      <p className="flex flex-wrap items-center gap-3 border-l-2 border-clay-600/60 pl-3 text-[13px] leading-6 text-white/70">
                        <span>{message.text}</span>
                        {message.retry && (
                          <button
                            type="button"
                            onClick={() => retry(message.retry!)}
                            disabled={busy || !available}
                            className="link-line text-clay-600 disabled:opacity-50"
                          >
                            {t.retry}
                          </button>
                        )}
                      </p>
                    ) : (
                      <CopilotMessage
                        message={message}
                        t={t}
                        english={english}
                        animate={message.id === revealing}
                        latest={message.id === lastCopilot?.id && settled}
                        onRevealed={() => setRevealing((current) => (current === message.id ? null : current))}
                        onGrow={follow}
                        onSend={(said) => void send(said)}
                      />
                    )}
                  </li>
                ))}
                {busy && (
                  <li>
                    <ChatProgress progress={progress ?? { steps: [], started: Date.now() }} english={english} text={t} />
                  </li>
                )}
              </ol>
              {oldTripBelow && <p className="mt-6 text-xs leading-6 text-white/65">{t.oldTrip}</p>}
            </div>
            {awayFromBottom && (
              <button
                type="button"
                onClick={() => {
                  stick.current = true;
                  setAwayFromBottom(false);
                  toBottom(true);
                }}
                className="absolute right-0 bottom-3 flex items-center gap-1.5 border border-white/25 bg-night/90 px-3 py-1.5 text-[12px] text-white/85 backdrop-blur-sm transition-colors hover:border-clay-600"
              >
                <IconArrowDown />
                {t.latest}
              </button>
            )}
          </div>

          {composer}
          {footer}
        </div>
      )}
      {photo && !chatting && (
        <a
          href={photo.href}
          target="_blank"
          rel="noreferrer"
          className="absolute right-4 bottom-3 text-[10px] tracking-[0.06em] text-white/55 hover:text-white sm:right-10"
        >
          {photo.caption} · {photo.credit}
        </a>
      )}
    </section>
  );
}

/** 一条 Copilot 回复：按块排版，新的一块一块出；下面是这一轮谁做了什么、追问的选项、复制和看行程、接着说的例子 */
function CopilotMessage({
  message,
  t,
  english,
  animate,
  latest,
  onRevealed,
  onGrow,
  onSend,
}: {
  message: Message;
  t: ChatText;
  english: boolean;
  animate: boolean;
  latest: boolean;
  onRevealed: () => void;
  onGrow: () => void;
  onSend: (said: string) => void;
}) {
  const blocks = useMemo(() => replyBlocks(message.text), [message.text]);
  // 父组件每次渲染都给新的回调：放进 ref，免得一块一块出的计时器被重置
  const revealed = useRef(onRevealed);
  useEffect(() => {
    revealed.current = onRevealed;
  }, [onRevealed]);
  const [shown, setShown] = useState(() => (animate && !reducedMotion() ? 1 : blocks.length));
  const done = shown >= blocks.length;
  useEffect(() => {
    if (done) {
      revealed.current();
      return;
    }
    // 一块一块出：长的一天（站多）停得久一点，整条回复一般一两秒出完
    const block = blocks[shown - 1];
    const wait = block?.kind === "day" ? 90 + block.stops.length * 30 : 110;
    const timer = setTimeout(() => setShown((count) => count + 1), wait);
    return () => clearTimeout(timer);
  }, [shown, done, blocks]);
  useLayoutEffect(() => {
    onGrow();
  }, [shown, onGrow]);

  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard?.writeText(message.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };
  const options = latest ? (message.question?.options ?? []) : [];

  return (
    <article className="text-left">
      {message.steps && message.steps.length > 0 && <AgentSteps steps={message.steps} ms={message.ms} t={t} />}
      <div className="space-y-3.5">
        {blocks.slice(0, shown).map((block, index) => (
          <div key={index} className={animate ? "chat-in" : undefined}>
            <Block block={block} t={t} />
          </div>
        ))}
      </div>

      {done && options.length > 0 && (
        <div className="chat-in mt-4">
          <p className="text-[12px] text-white/55">{t.pick}</p>
          <ol className="mt-2 flex flex-wrap gap-2">
            {options.map((option, index) => {
              const label = option.label ?? (english ? option.en : option.zh) ?? "";
              return (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => onSend(label)}
                    className="flex min-h-11 items-baseline gap-2.5 border border-white/25 px-3.5 py-2 text-left text-[14px] transition-colors hover:border-clay-600 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-600"
                  >
                    <span className="font-serif text-[13px] text-clay-600 tabular-nums">{index + 1}</span>
                    <span>{label}</span>
                    {option.note && <span className="text-[12px] text-white/55">{option.note}</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {done && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-white/55">
          <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 transition-colors hover:text-white">
            {copied ? <IconCheck /> : <CopyGlyph />}
            {copied ? t.copied : t.copy}
          </button>
          {message.applied && (
            <a href="#plan-overview" className="inline-flex items-center gap-1.5 text-clay-600 transition-colors hover:text-clay-700">
              <IconArrowDown />
              {t.viewTrip}
            </a>
          )}
        </div>
      )}

      {done && latest && message.planned && !message.question && (
        <ul className="chat-in mt-4 flex flex-wrap gap-2">
          {t.followUps.map((said) => (
            <li key={said}>
              <button
                type="button"
                onClick={() => onSend(said)}
                className="min-h-9 border border-white/15 px-3 py-1.5 text-[13px] text-white/75 transition-colors hover:border-clay-600 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-600"
              >
                {said}
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

const CopyGlyph = () => (
  <svg viewBox="0 0 16 16" aria-hidden className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.3}>
    <rect x="5.5" y="5.5" width="8" height="8" />
    <path d="M3 10.5H2.5V2.5H10.5V3" />
  </svg>
);

/** 把网址变成链接（民宿的 Airbnb 链接） */
function linkify(textOf: string): ReactNode {
  const parts = textOf.split(/(https?:\/\/\S+)/);
  if (parts.length === 1) return textOf;
  return parts.map((part, index) =>
    /^https?:\/\//.test(part) ? (
      <a key={index} href={part} target="_blank" rel="noreferrer" className="link-line break-all text-clay-600">
        {part.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
      </a>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

function Block({ block, t }: { block: ReplyBlock; t: ChatText }) {
  if (block.kind === "day") return <DayRoute day={block} t={t} />;
  if (block.kind === "heading") return <h3 className="pt-1 text-[13px] tracking-[0.04em] text-clay-600">{block.text}</h3>;
  if (block.kind === "list")
    return (
      <ul className="space-y-1.5">
        {block.items.map((item, index) => (
          <li key={index} className="relative pl-4 font-serif text-[15px] leading-7 text-white/85">
            <i aria-hidden className="absolute top-[0.8em] left-0 block h-px w-2 bg-clay-600/70" />
            {linkify(item)}
          </li>
        ))}
      </ul>
    );
  return <p className="font-serif text-[16px] leading-8 text-white/92">{linkify(block.text)}</p>;
}

/**
 * 一天：左边一条金色的路线，每一站是路上的一个点，时间在前；早上从哪出发、开多久写在最上面，晚上住哪写在最下面（“住”）。
 * 这是对话框里唯一花了心思的样子，别的都保持安静
 */
function DayRoute({ day, t }: { day: DayBlock; t: ChatText }) {
  const row = "grid grid-cols-[3.4rem_1fr] items-baseline gap-x-3";
  return (
    <section className="pt-2">
      <h3 className="flex flex-wrap items-baseline gap-x-3 font-serif">
        <span className="text-[17px] text-white">{day.title}</span>
        <span className="text-[13px] text-white/55">{day.detail}</span>
      </h3>
      <ol className="relative mt-2 ml-[0.2rem] space-y-1.5 border-l border-clay-600/45 pl-4">
        {day.leave && (
          <li className={`${row} text-[13px] text-white/60`}>
            <time className="tabular-nums lining-nums">{day.leave.time}</time>
            <span>
              {fill(t.leave, { from: day.leave.from })}
              {day.leave.drive && <span className="ml-1.5 text-white/45">{fill(t.drive, { d: day.leave.drive })}</span>}
            </span>
          </li>
        )}
        {day.rest && <li className="text-[14px] text-white/60">{day.rest}</li>}
        {day.stops.map((stop, index) => (
          <li key={index} className={`${row} relative`}>
            <i aria-hidden className="absolute top-[0.62em] -left-[20px] block size-[7px] rounded-full bg-clay-600 ring-[3px] ring-night" />
            <time className="font-serif text-[14px] text-clay-700 tabular-nums lining-nums">{stop.time}</time>
            <span className="font-serif text-[15px] leading-7 text-white/92">
              {stop.name}
              {stop.local && <span className="ml-1.5 text-[12px] text-white/45">{stop.local}</span>}
            </span>
          </li>
        ))}
        {(day.stay || day.end) && (
          <li className={`${row} text-[13px] text-white/65`}>
            <span className="text-clay-600">{day.stay ? t.stay : ""}</span>
            <span>{day.stay ?? day.end}</span>
          </li>
        )}
      </ol>
    </section>
  );
}

/**
 * 回复上面一行小字：这一轮哪几个角色做了事（模型做的是金点，确定的代码是白点）、用了几秒；点开看每一步具体做了什么。
 * 11-23 仓库主人：看不出 search agent 和多 agent 在哪里——所以角色名一直写在外面，细节收起来（ChatGPT 的“已思考 12 秒”）
 */
function AgentSteps({ steps, ms, t }: { steps: AgentStep[]; ms?: number; t: ChatText }) {
  const roles = t.roles as Record<string, string>;
  const names = steps.map((step) => roles[step.who] ?? step.who);
  return (
    <details className="group mb-3 text-[12px] leading-6 text-white/55">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-2 gap-y-1 marker:hidden hover:text-white/80 [&::-webkit-details-marker]:hidden">
        <span className="text-white/45">{t.steps}</span>
        {names.map((name, index) => (
          <span key={index} className="inline-flex items-center gap-1.5">
            {index > 0 && <span aria-hidden className="text-white/25">›</span>}
            <i aria-hidden className={`inline-block size-1.5 rounded-full ${steps[index].model ? "bg-clay-600" : "bg-white/50"}`} />
            {name}
          </span>
        ))}
        {ms !== undefined && <span className="text-white/40 tabular-nums">{fill(t.seconds, { n: Math.max(1, Math.round(ms / 1000)) })}</span>}
        <span aria-hidden className="text-white/40 transition-transform group-open:rotate-90">›</span>
      </summary>
      <ol className="mt-1.5 space-y-0.5 border-l border-white/15 pl-3">
        {steps.map((step, index) => (
          <li key={index} className="flex gap-2">
            <i aria-hidden className={`mt-[9px] inline-block size-1.5 shrink-0 rounded-full ${step.model ? "bg-clay-600" : "bg-white/50"}`} />
            <span>{step.text}</span>
          </li>
        ))}
      </ol>
    </details>
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
 * 等回复时的过渡：一张国家公园公路旅行的小画，进度条就是那条路。进度按 Copilot 真实做到的步骤推（边做边报）；
 * 最上面一行写真实的这一步（“在排每天的路线”）和用了几秒，下面一句话跟着进度换；认出了公园、日期、天数先写出来
 */
function ChatProgress({ progress, english, text }: { progress: Progress; english: boolean; text: ChatText }) {
  const t = text.progress;
  const answering = progress.steps.includes("answer") && !progress.steps.includes("plan");
  const lines = answering ? t.answer : t.plan;
  // 车、路、太阳每帧直接改 SVG（不经过 React）：显示的进度每帧往真实进度靠一点（新的一步报上来时不会一下跳过去），
  // 车每帧都按路的曲线算位置、跟着坡度转。下面那句话、路边的里程桩、终点的帐篷、秒数只在变了的时候才改（React 状态）
  const progressRef = useRef(progress);
  const carRef = useRef<SVGGElement>(null);
  const sunRef = useRef<SVGGElement>(null);
  const roadRef = useRef<SVGPathElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [marks, setMarks] = useState({ line: 0, posts: 0, done: false, seconds: 0 });
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  const lineCount = lines.length;
  useEffect(() => {
    const calm = reducedMotion();
    let shown = progressOf(progressRef.current, Date.now());
    let last = performance.now();
    let raf = 0;
    let percent = -1;
    let seconds = -1;
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
      const elapsed = Math.floor((Date.now() - progressRef.current.started) / 1000);
      if (rounded !== percent || elapsed !== seconds) {
        percent = rounded;
        seconds = elapsed;
        rootRef.current?.setAttribute("aria-valuenow", String(rounded));
        const next = {
          line: Math.min(lineCount - 1, Math.floor(shown * lineCount)),
          posts: POSTS.filter((at) => shown >= at).length,
          done: shown >= 0.999,
          seconds: elapsed,
        };
        setMarks((current) =>
          current.line === next.line && current.posts === next.posts && current.done === next.done && current.seconds === next.seconds ? current : next,
        );
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [lineCount]);
  const line = lines[Math.min(lines.length - 1, marks.line)];
  const step = progress.steps.at(-1);
  const working = step ? (text.working as Record<Step, string>)[step] : text.thinking;
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
        .join(english ? ", " : "，")
    : null;
  return (
    <div ref={rootRef} className="max-w-lg" role="progressbar" aria-label={t.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
      <p className="flex items-baseline gap-3 text-[13px]">
        <span key={working} className="chat-shimmer">
          {working}
        </span>
        <span className="text-white/40 tabular-nums">{fill(text.seconds, { n: marks.seconds })}</span>
      </p>
      {summary && <p className="mt-2 font-serif text-lg leading-snug lining-nums">{summary}</p>}
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
    </div>
  );
}
