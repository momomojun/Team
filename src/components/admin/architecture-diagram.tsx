/**
 * 后台的“模型调用架构图”：一句话从网站进来，经过 Copilot 的哪几步，哪几步调模型、按什么顺序换模型，
 * 每晚读 NPS 公告的那一路，排行程本身不用模型。和 docs/COPILOT.md 的设计一致；模型顺序优先用 /health 报的实际顺序（chain）。
 * 纯 SVG，中英文两套字（后台英文版给老师看）
 */

export type AdminLang = "zh" | "en";

/** 模型的叫法：/health 报的是型号 id */
const MODEL_NAMES: Record<string, { name: string; via: string; paid?: boolean }> = {
  "gemini-3.5-flash-lite": { name: "Gemini 3.5 Flash Lite", via: "Google" },
  "minimax/minimax-m3.1-flash:free": { name: "MiniMax M3.1 Flash", via: "OpenRouter" },
  "nvidia/nemotron-3.5-super-vl:free": { name: "Nemotron 3.5 Super", via: "OpenRouter" },
  "deepseek-flash": { name: "DeepSeek Flash", via: "DeepSeek", paid: true },
  "qwen/qwen3.8-27b": { name: "Qwen3.8 27B", via: "Groq" },
  "qwen3.5:4b-q4_K_M": { name: "Qwen3.5 4B", via: "Ollama" },
  "gpt-4.1-mini": { name: "GPT-4.1 mini", via: "OpenAI" },
};
// 免费的三家在前，付费的 DeepSeek 排在它们后面当备用（10-28 仓库主人定的），本机模型最后
const CHAT_DEFAULT = ["gemini-3.5-flash-lite", "nvidia/nemotron-3.5-super-vl:free", "qwen/qwen3.8-27b", "deepseek-flash", "qwen3.5:4b-q4_K_M"];
const ALERTS_DEFAULT = ["gemini-3.5-flash-lite", "nvidia/nemotron-3.5-super-vl:free", "qwen/qwen3.8-27b", "deepseek-flash", "qwen3.5:4b-q4_K_M"];

const TEXT = {
  zh: {
    title: "模型调用架构",
    note: "一句话从网站进来到回复出去经过哪几步；砂岩红框是调模型的步骤，黑框是确定的代码，绿框是排行程引擎（不用模型）",
    user: ["用户", "行程页的对话框"],
    relay: ["Next.js 中转", "/api/copilot/chat · 边做边报"],
    service: "Copilot 服务 · Python · FastAPI · LangGraph（一轮对话 = understand → dispatch / legacy → finish）",
    dispatch: ["调度员", "这句话要做哪几件事"],
    intake: ["摘条件", "公园、日期、天数、出发地"],
    intakeCode: "代码核对、追问",
    plan: ["plan_trip 行程引擎", "TypeScript · 同输入同结果"],
    critic: ["Critic 检查", "太满、赶不上就放松一次"],
    writer: ["Writer 写说明", "模型出错就用模板"],
    tools: ["查询工具", "开没开、车程、找景点"],
    qa: ["回答问题", "BM25 检索网站资料，只按资料说"],
    finish: ["收尾", "JSONL 日志 · 检查点（SQLite）"],
    stream: "每一步报给网站：进度条",
    llm: "模型",
    chatTitle: "聊天的四步按这个顺序调模型",
    chatNote: "前一个出错、20 秒没回、没配 key 就换下一个；都不行用本机模型。",
    chatNote2: "前三家是免费档，免费的都用完才轮到付费的 DeepSeek。",
    live: "现在服务实际用的",
    liveDiffers: "（和默认的不一样：比如只开了本机模型，或者某一家没配 key）",
    colon: "：",
    defaults: "设计的顺序（.env.local 里每一家都配了 key 时）",
    alertsTitle: "每晚读 NPS 公告（GitHub Actions）",
    alertsFlow: ["NPS API 公告", "读公告：关了哪个景点", "关闭清单", "两周内出发的行程不排"],
    alertsNote: "推理开 high；只读新出现、改过的几条",
    observe: "日志 → /stats → 本后台；CI 用本机模型录好的回答回放 7 组评测，分数低于基线不让合并；评测成绩记到 MLflow",
  },
  en: {
    title: "Model call architecture",
    note: "The path a message takes from the website to the reply. Sandstone boxes call a model, black boxes are deterministic code, and the green box is the trip planner, which uses no model",
    user: ["User", "Chat on the trip page"],
    relay: ["Next.js relay", "/api/copilot/chat · streams progress"],
    service: "Copilot service · Python · FastAPI · LangGraph (one turn = understand → dispatch / legacy → finish)",
    dispatch: ["Dispatcher", "What does this message ask?"],
    intake: ["Intake", "Parks, dates, days, origin"],
    intakeCode: "Code checks, follow-ups",
    plan: ["plan_trip engine", "TypeScript · deterministic"],
    critic: ["Critic", "Too packed? Relax once"],
    writer: ["Writer", "Template if the model fails"],
    tools: ["Lookup tools", "Open? Drive time? Find sights"],
    qa: ["Q&A", "BM25 over site data, cites sources"],
    finish: ["Finish", "JSONL log · checkpoint (SQLite)"],
    stream: "Each step is streamed to the site's progress bar",
    llm: "LLM",
    chatTitle: "The four chat steps call models in this order",
    chatNote: "On an error, a 20 s timeout or a missing key, the next one is tried; the local model is last.",
    chatNote2: "The first three are free tiers; paid DeepSeek is used only after they all fail.",
    live: "The running service is using",
    liveDiffers: " (differs from the default, e.g. only the local model is on or a provider has no key)",
    colon: ": ",
    defaults: "Designed order (when every provider has a key in .env.local)",
    alertsTitle: "Nightly NPS alerts (GitHub Actions)",
    alertsFlow: ["NPS API alerts", "Which sight is closed?", "Closure list", "Trips within 2 weeks skip it"],
    alertsNote: "High reasoning effort; only new or changed alerts are read",
    observe: "Logs → /stats → this dashboard. CI replays 7 eval sets recorded with the local model and blocks merges that fall below baseline; eval scores go to MLflow",
  },
} as const;

const CLAY = "#a04c2e";
const INK = "#1c1b18";
const PINE = "#4f6b3f";
const MUTE = "#68615a";

function Box({
  x,
  y,
  w,
  h = 64,
  lines,
  kind,
  tag,
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  lines: readonly string[];
  kind: "llm" | "code" | "engine" | "plain";
  tag?: string;
}) {
  const stroke = kind === "llm" ? CLAY : kind === "engine" ? PINE : INK;
  const fill = kind === "engine" ? "#e4eadc" : kind === "llm" ? "#f7ece5" : "var(--color-paper)";
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={kind === "plain" ? 1 : 1.4} />
      {tag && (
        <g>
          <rect x={x + w - 46} y={y - 9} width={40} height={18} fill={CLAY} />
          <text x={x + w - 26} y={y + 4} textAnchor="middle" fontSize={11} fill="#fff" style={{ fontFamily: "var(--font-jost)" }}>
            {tag}
          </text>
        </g>
      )}
      <text x={x + 14} y={y + 27} fontSize={16} fill={INK} style={{ fontFamily: "var(--font-serif)" }}>
        {lines[0]}
      </text>
      {lines[1] && (
        <text x={x + 14} y={y + 48} fontSize={12} fill={MUTE}>
          {lines[1]}
        </text>
      )}
    </g>
  );
}

function Arrow({ d, dashed, color = INK }: { d: string; dashed?: boolean; color?: string }) {
  return <path d={d} fill="none" stroke={color} strokeWidth={1.3} strokeDasharray={dashed ? "5 4" : undefined} markerEnd={`url(#arrow-${color === CLAY ? "clay" : color === PINE ? "pine" : "ink"})`} />;
}

/** 一排模型：第一个最先试，后面的依次接着 */
function Chain({ x, y, models, width, lang }: { x: number; y: number; models: string[]; width: number; lang: AdminLang }) {
  const gap = 22;
  const w = (width - gap * (models.length - 1)) / models.length;
  return (
    <g>
      {models.map((id, i) => {
        const known = MODEL_NAMES[id];
        const left = x + i * (w + gap);
        // 五个模型时一格只有一百来宽：名字放不下就在中间的空格处折成两行（“Gemini 3.5 / Flash Lite”）
        const name = known?.name ?? id;
        const words = name.split(" ");
        const cut = name.length * 6.2 + 16 > w && words.length > 1 ? Math.ceil(words.length / 2) : words.length;
        const lines = [words.slice(0, cut).join(" "), words.slice(cut).join(" ")].filter(Boolean);
        return (
          <g key={`${id}-${i}`}>
            <rect x={left} y={y} width={w} height={60} fill={i === models.length - 1 && known?.via === "Ollama" ? "var(--color-paper-deep)" : "#f7ece5"} stroke={CLAY} strokeWidth={1.2} />
            <text x={left + 8} y={y + 18} fontSize={11.5} fill={INK}>
              <tspan fill={CLAY} style={{ fontFamily: "var(--font-jost)" }}>{i + 1} </tspan>
              {lines[0]}
              {lines[1] && (
                <tspan x={left + 18} dy={14}>
                  {lines[1]}
                </tspan>
              )}
            </text>
            <text x={left + 10} y={y + 50} fontSize={11} fill={MUTE}>
              {known?.via ?? ""}
              {known?.paid && <tspan fill={CLAY}>{lang === "zh" ? " · 付费" : " · paid"}</tspan>}
            </text>
            {i < models.length - 1 && <Arrow d={`M${left + w + 3} ${y + 30} H${left + w + gap - 3}`} color={CLAY} />}
          </g>
        );
      })}
    </g>
  );
}

export function ArchitectureDiagram({ lang, chain }: { lang: AdminLang; chain?: string[] | null }) {
  const t = TEXT[lang];
  // 图上总是画设计的顺序；服务报的实际顺序不一样（比如本机只开了 Ollama、某一家没配 key）就在下面另写一行
  const live = chain && chain.length > 0 ? chain : null;
  const differs = live !== null && live.join("|") !== CHAT_DEFAULT.join("|");
  return (
    <figure className="mt-6">
      <div className="no-scrollbar overflow-x-auto">
        <svg viewBox="0 0 1200 760" className="block h-auto w-full min-w-[920px]" role="img" aria-label={t.title}>
          <defs>
            {[
              ["ink", INK],
              ["clay", CLAY],
              ["pine", PINE],
            ].map(([id, color]) => (
              <marker key={id} id={`arrow-${id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" fill={color} />
              </marker>
            ))}
          </defs>

          {/* 网站这一头 */}
          <Box x={20} y={20} w={230} lines={t.user} kind="plain" />
          <Box x={320} y={20} w={330} lines={t.relay} kind="code" />
          <Arrow d="M250 52 H316" />
          <Arrow d="M485 84 V136" />
          <text x={500} y={116} fontSize={11} fill={MUTE}>
            {t.stream}
          </text>

          {/* Copilot 服务 */}
          <rect x={20} y={140} width={1160} height={310} fill="none" stroke={INK} strokeWidth={1} strokeDasharray="2 3" />
          <text x={36} y={164} fontSize={12} fill={MUTE} style={{ fontFamily: "var(--font-jost)" }}>
            {t.service}
          </text>

          <Box x={44} y={268} w={190} lines={t.dispatch} kind="llm" tag={t.llm} />
          {/* 改条件、排行程那一路 */}
          <Box x={290} y={192} w={210} lines={t.intake} kind="llm" tag={t.llm} />
          <text x={304} y={274} fontSize={11} fill={MUTE}>
            + {t.intakeCode}
          </text>
          <Box x={540} y={192} w={220} lines={t.plan} kind="engine" />
          <Box x={800} y={192} w={170} lines={t.critic} kind="code" />
          <Box x={1000} y={192} w={160} lines={t.writer} kind="llm" tag={t.llm} />
          {/* 问问题那一路 */}
          <Box x={290} y={350} w={210} lines={t.tools} kind="code" />
          <Box x={540} y={350} w={300} lines={t.qa} kind="llm" tag={t.llm} />
          <Box x={880} y={350} w={280} lines={t.finish} kind="code" />

          <Arrow d="M234 290 C262 290 262 224 286 224" />
          <Arrow d="M234 310 C262 310 262 382 286 382" />
          <Arrow d="M500 224 H536" />
          <Arrow d="M760 224 H796" />
          <Arrow d="M970 224 H996" />
          <Arrow d="M500 382 H536" />
          <Arrow d="M840 382 H876" />
          <Arrow d="M1080 256 V346" />
          {/* 回复回到网站 */}
          <Arrow d="M1160 350 V100 C1160 52 1100 52 1060 52 H654" dashed />

          {/* 模型顺序 */}
          <rect x={20} y={480} width={640} height={210} fill="none" stroke={CLAY} strokeWidth={1} />
          <text x={36} y={508} fontSize={16} fill={INK} style={{ fontFamily: "var(--font-serif)" }}>
            {t.chatTitle}
          </text>
          <text x={36} y={530} fontSize={11} fill={MUTE}>
            {t.defaults}
          </text>
          <Chain x={36} y={548} models={CHAT_DEFAULT} width={608} lang={lang} />
          <text x={36} y={630} fontSize={11.5} fill={MUTE}>
            {t.chatNote}
          </text>
          <text x={36} y={647} fontSize={11.5} fill={MUTE}>
            {t.chatNote2}
          </text>
          {live && (
            <text x={36} y={666} fontSize={11.5} fill={differs ? CLAY : PINE}>
              ● {t.live}
              {t.colon}
              {live.map((id) => MODEL_NAMES[id]?.name ?? id).join(" → ")}
            </text>
          )}
          {differs && (
            <text x={36} y={682} fontSize={11} fill={MUTE}>
              {t.liveDiffers.trim()}
            </text>
          )}
          {/* 四个调模型的步骤都走这一排 */}
          <Arrow d="M139 336 V476" dashed color={CLAY} />

          {/* 每晚读公告 */}
          <rect x={690} y={480} width={490} height={210} fill="none" stroke={INK} strokeWidth={1} strokeDasharray="2 3" />
          <text x={706} y={508} fontSize={16} fill={INK} style={{ fontFamily: "var(--font-serif)" }}>
            {t.alertsTitle}
          </text>
          {t.alertsFlow.map((label, i) => {
            const x = 706 + i * 118;
            const llm = i === 1;
            return (
              <g key={label}>
                <rect x={x} y={526} width={104} height={54} fill={llm ? "#f7ece5" : "var(--color-paper)"} stroke={llm ? CLAY : INK} strokeWidth={1.2} />
                {wrap(label, lang === "zh" ? 7 : 14).map((line, j) => (
                  <text key={j} x={x + 8} y={546 + j * 16} fontSize={11.5} fill={INK}>
                    {line}
                  </text>
                ))}
                {i < 3 && <Arrow d={`M${x + 106} 553 H${x + 116}`} />}
              </g>
            );
          })}
          <text x={706} y={604} fontSize={11} fill={MUTE}>
            {ALERTS_DEFAULT.map((id) => MODEL_NAMES[id]?.name ?? id).join(" → ")}
          </text>
          <text x={706} y={622} fontSize={11} fill={MUTE}>
            {t.alertsNote}
          </text>
          {/* 关闭清单交给行程引擎 */}
          <Arrow d="M1000 526 V466 H520 V300 H650 V260" dashed color={PINE} />

          <text x={20} y={724} fontSize={12} fill={MUTE}>
            {t.observe}
          </text>
        </svg>
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-ink-soft">
        <span>
          <i className="mr-1.5 inline-block size-2.5 border border-clay-600 bg-[#f7ece5] align-middle" />
          {lang === "zh" ? "调模型的步骤" : "Calls a model"}
        </span>
        <span>
          <i className="mr-1.5 inline-block size-2.5 border border-ink bg-paper align-middle" />
          {lang === "zh" ? "确定的代码" : "Deterministic code"}
        </span>
        <span>
          <i className="mr-1.5 inline-block size-2.5 border border-[#4f6b3f] bg-[#e4eadc] align-middle" />
          {lang === "zh" ? "排行程引擎（不用模型）" : "Trip planner (no model)"}
        </span>
        <span className="text-mute">{t.note}</span>
      </figcaption>
    </figure>
  );
}

/** 短框里的字按字数换行（中文按字，英文按词） */
function wrap(text: string, max: number): string[] {
  if (/[一-鿿]/.test(text)) {
    const out: string[] = [];
    for (let i = 0; i < text.length; i += max) out.push(text.slice(i, i + max));
    return out;
  }
  const out: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if ((line + " " + word).trim().length > max && line) {
      out.push(line);
      line = word;
    } else line = (line + " " + word).trim();
  }
  if (line) out.push(line);
  return out;
}
