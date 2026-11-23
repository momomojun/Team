/**
 * 后台的“测试和评测”页（/[locale]/admin/evals，11-22 仓库主人：把测试写进后台，从后台点进去看几轮测试的结果和对比）。
 * 数据是 src/data/eval-history.ts（按 copilot/eval/RESULTS.md 整理的静态数据，RESULTS.md 加了新的一轮就在那里补一条），
 * 不连 Copilot 服务；中英两套字写在这里和数据里，不进网站的翻译表
 */
import Link from "next/link";
import type { AdminLang } from "./architecture-diagram";
import { EVAL_ROUNDS, GATES, KIND_LABEL, MODEL_MATRIX, SOFT, TEST_LAYERS, type EvalKind } from "@/data/eval-history";

const TEXT = {
  zh: {
    eyebrow: "Copilot 后台",
    heading: "测试和评测",
    intro:
      "网站和 Copilot 每一轮测试的成绩和对比。门禁每个 PR 都跑（回放录好的模型回答，不调云端）；模型对照、多 agent 对照是在本机或用免费额度单独跑的，每一轮都记在 copilot/eval/RESULTS.md。",
    back: "← 回到后台",
    layers: "测试一共几层",
    layersNote: "从最快、最便宜的到最慢、要模型的",
    soft: "多 agent 对照调度员",
    softNote: "软要求题：用户说了“中间休息一天”“每天开车不超过 3 小时”这类要求，排出来的行程做到了没有（代码逐条判）",
    softV1: "soft-v1：30 道有软要求的题（10 道英文、2 道多轮）",
    softV2: "soft-v2：20 道对照题（10 道中文、10 道英文），用户什么软要求都没提，不能无中生有",
    dispatcher: "调度员（原来的）",
    team: "多 agent",
    afterFix: "修了 S07、S13 以后",
    caught: (n: number) => `模型编了 ${n} 条，代码核对拦下`,
    invented: (n: number) => `无中生有 ${n} 题`,
    models: "本机模型对照",
    modelsNote: "同一套题换模型跑：Qwen3.5 4B（原来的）、Qwen3.5 35B-A3B（现在默认）、gpt-oss 20B；粗体是这一行最好的",
    suite: "评测组",
    gates: "门禁：每个 PR 都跑",
    gatesNote: "回放本机 Qwen3.5 4B 录好的回答（找资料、search agent 两组回放 Gemini），低于基线不能合并",
    thisRun: "现在",
    baseline: "基线",
    rounds: "历次评测",
    roundsNote: "新的在上面；只列每一轮的主要数字，细节在 RESULTS.md",
    result: "结果",
    model: "模型 / 做法",
    score: "成绩",
  },
  en: {
    eyebrow: "Copilot dashboard",
    heading: "Tests and evals",
    intro:
      "Every round of results and comparisons for the site and the Copilot. The gates run on every PR (replaying recorded model answers, no cloud calls); model and multi-agent comparisons are run separately, locally or on free tiers, and each round is logged in copilot/eval/RESULTS.md.",
    back: "← Back to the dashboard",
    layers: "Layers of testing",
    layersNote: "From the fastest and cheapest to the slowest, model-backed ones",
    soft: "Multi-agent vs the dispatcher",
    softNote: "Soft-wish cases: the user asks for things like “a rest day in the middle” or “no more than 3 hours of driving a day”; code checks each one against the planned trip",
    softV1: "soft-v1: 30 cases with soft wishes (10 in English, 2 multi-turn)",
    softV2: "soft-v2: 20 control cases (10 Chinese, 10 English) with no soft wishes; nothing may be invented",
    dispatcher: "Dispatcher (before)",
    team: "Multi-agent",
    afterFix: "after fixing S07 and S13",
    caught: (n: number) => `${n} invented by the model, caught by the code check`,
    invented: (n: number) => `${n} invented`,
    models: "Local models compared",
    modelsNote: "The same suites on Qwen3.5 4B (before), Qwen3.5 35B-A3B (now the default) and gpt-oss 20B; bold is the best in each row",
    suite: "Suite",
    gates: "Gates: run on every PR",
    gatesNote: "Replays answers recorded with local Qwen3.5 4B (retrieval and search agent replay Gemini); anything below baseline blocks the merge",
    thisRun: "Now",
    baseline: "Baseline",
    rounds: "Every round",
    roundsNote: "Newest first; headline numbers only, details in RESULTS.md. Result labels are quoted as written there, in Chinese",
    result: "Results",
    model: "Model / variant",
    score: "Score",
  },
} as const;

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="mt-16">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line pb-3">
        <h2 className="font-serif text-2xl">{title}</h2>
        {note && <p className="max-w-3xl text-[11px] leading-5 text-mute">{note}</p>}
      </div>
      {children}
    </section>
  );
}

/** 一根横条：passed / total，颜色区分做法 */
function Bar({ label, passed, total, tone, sub }: { label: string; passed: number; total: number; tone: "pine" | "clay" | "mute"; sub?: string }) {
  const color = tone === "pine" ? "bg-pine-500" : tone === "clay" ? "bg-clay-600" : "bg-ink/25";
  return (
    <div className="grid grid-cols-[8.5rem_1fr_3.5rem] items-center gap-3 py-1.5 text-[13px]">
      <span className="truncate text-ink-soft" title={label}>{label}</span>
      <span className="relative h-3 bg-paper-deep">
        <span className={`absolute inset-y-0 left-0 ${color}`} style={{ width: `${(passed / total) * 100}%` }} />
      </span>
      <span className="text-right tabular-nums">
        {passed}/{total}
      </span>
      {sub && <span className="col-span-3 -mt-1 pl-[9.25rem] text-[11px] text-mute">{sub}</span>}
    </div>
  );
}

/** “25/25”“0.755”“82%”这类成绩换成可比的数（越大越好）；比不了的是 null */
function value(score: string): number | null {
  const ratio = score.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (ratio) return Number(ratio[1]) / Number(ratio[2]);
  const pct = score.match(/^(\d+(?:\.\d+)?)%/);
  if (pct) return Number(pct[1]) / 100;
  const num = score.match(/^\d+(?:\.\d+)?$/);
  return num ? Number(score) : null;
}

export function EvalReport({ lang, locale }: { lang: AdminLang; locale: string }) {
  const t = TEXT[lang];
  const zh = lang === "zh";
  const rounds = [...EVAL_ROUNDS].reverse();
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pt-28 pb-24 sm:px-10">
      <Link href={`/${locale}/admin`} className="text-[12px] text-mute hover:text-ink">
        {t.back}
      </Link>
      <p className="eyebrow mt-6 text-mute">{t.eyebrow}</p>
      <h1 className="mt-4 font-serif text-[clamp(2.2rem,4vw,3.4rem)] leading-tight">{t.heading}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-soft">{t.intro}</p>

      <Section title={t.layers} note={t.layersNote}>
        <div className="mt-4 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {TEST_LAYERS.map((layer) => (
            <div key={layer.nameEn} className="border-b border-line py-4">
              <p className="eyebrow text-mute">{zh ? layer.nameZh : layer.nameEn}</p>
              <p className="mt-2 font-serif text-[1.9rem] leading-none tabular-nums">{zh ? layer.count : ("countEn" in layer ? layer.countEn : layer.count)}</p>
              <p className="mt-2 text-[12px] leading-5 text-ink-soft">{zh ? layer.whatZh : layer.whatEn}</p>
              <p className="mt-1 text-[11px] text-mute">
                <code>{layer.command}</code>
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t.soft} note={t.softNote}>
        <div className="mt-6 grid gap-x-12 gap-y-8 lg:grid-cols-2">
          <div>
            <p className="text-[13px] font-medium">{t.softV1}</p>
            {SOFT.v1.map((row) => (
              <div key={row.model} className="mt-3">
                <p className="eyebrow text-mute">{row.model}</p>
                <Bar label={t.dispatcher} passed={row.dispatcher} total={SOFT.v1Total} tone="mute" />
                <Bar label={t.team} passed={row.team} total={SOFT.v1Total} tone="pine" />
                {row.teamFixed !== undefined && row.teamFixed !== row.team && (
                  <Bar label={`${t.team} · ${t.afterFix}`} passed={row.teamFixed} total={SOFT.v1Total} tone="clay" />
                )}
              </div>
            ))}
          </div>
          <div>
            <p className="text-[13px] font-medium">{t.softV2}</p>
            {SOFT.v2.length === 0 && <p className="mt-3 text-sm text-mute">—</p>}
            {SOFT.v2.map((row) => (
              <div key={row.model} className="mt-3">
                <p className="eyebrow text-mute">{row.model}</p>
                <Bar label={t.dispatcher} passed={row.dispatcher} total={SOFT.v2Total} tone="mute" />
                <Bar
                  label={t.team}
                  passed={row.team}
                  total={SOFT.v2Total}
                  tone="pine"
                  sub={[row.invented > 0 ? t.invented(row.invented) : "", row.caught > 0 ? t.caught(row.caught) : ""].filter(Boolean).join(" · ") || undefined}
                />
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title={t.models} note={t.modelsNote}>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="eyebrow py-2.5 pr-4 text-left font-normal text-mute">{t.suite}</th>
                {MODEL_MATRIX.models.map((model) => (
                  <th key={model} className="eyebrow py-2.5 pr-4 text-right font-normal whitespace-nowrap text-mute">
                    {model}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODEL_MATRIX.rows.map((row) => {
                const numbers = row.values.map(value);
                const best = Math.max(...numbers.map((n) => n ?? -Infinity));
                return (
                  <tr key={row.suiteEn} className="border-b border-line/60">
                    <td className="py-2 pr-4 text-ink-soft">{zh ? row.suiteZh : row.suiteEn}</td>
                    {row.values.map((cell, index) => (
                      <td key={index} className={`py-2 pr-4 text-right tabular-nums ${numbers[index] === best && numbers.filter((n) => n === best).length < numbers.filter((n) => n !== null).length ? "font-semibold" : ""}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-mute">{zh ? MODEL_MATRIX.speedZh : MODEL_MATRIX.speedEn}</p>
      </Section>

      <Section title={t.gates} note={t.gatesNote}>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="eyebrow py-2.5 pr-4 text-left font-normal text-mute">{t.suite}</th>
                <th className="eyebrow py-2.5 pr-4 text-right font-normal text-mute">{t.thisRun}</th>
                <th className="eyebrow py-2.5 pr-4 text-right font-normal text-mute">{t.baseline}</th>
              </tr>
            </thead>
            <tbody>
              {GATES.map((gate) => (
                <tr key={gate.suiteEn} className="border-b border-line/60">
                  <td className="py-2 pr-4 text-ink-soft">{zh ? gate.suiteZh : gate.suiteEn}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{zh ? gate.score : ("scoreEn" in gate ? gate.scoreEn : gate.score)}</td>
                  <td className="py-2 pr-4 text-right tabular-nums text-mute">{gate.baseline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={t.rounds} note={t.roundsNote}>
        <ol className="mt-2">
          {rounds.map((round) => (
            <li key={`${round.date}-${round.titleEn}`} className="grid gap-x-8 gap-y-2 border-b border-line py-6 lg:grid-cols-[11rem_1fr_1.1fr]">
              <div>
                <p className="tabular-nums text-[13px]">{round.date}</p>
                <p className="mt-1 inline-block border border-line px-1.5 py-0.5 text-[10px] tracking-wide text-mute uppercase">
                  {KIND_LABEL[round.kind as EvalKind][lang]}
                </p>
              </div>
              <div>
                <h3 className="font-serif text-lg leading-snug">{zh ? round.titleZh : round.titleEn}</h3>
                <p className="mt-2 text-[13px] leading-6 text-ink-soft">{zh ? round.summaryZh : round.summaryEn}</p>
              </div>
              {round.results.length > 0 && (
                <table className="w-full self-start border-collapse text-[12.5px]">
                  <tbody>
                    {round.results.map((result, index) => (
                      <tr key={index} className="border-b border-line/50 last:border-b-0">
                        <td className="py-1 pr-3 text-ink-soft">{result.suite}</td>
                        <td className="py-1 pr-3 text-mute">{result.model}</td>
                        <td className="py-1 text-right whitespace-nowrap tabular-nums" title={result.note}>
                          {result.score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}
