// 路线动画的流畅度：用本机的 Chrome / Edge（puppeteer-core，无窗口）打开行程页，放一个锡安 3 天的行程，
// 点“播放路线”（或“讲解版”），录下这段时间里每一帧隔了多久、主线程忙了多久（脚本、排版、样式），打印一行 JSON。
// 改了动画以后跑一下，和改之前比（无窗口的 Chrome 用软件画 WebGL，帧率比真机低，看前后的差别）。
// 用法：开着网站（npm run dev），再 npm run perf:tour -- [--base http://localhost:3000] [--narrated] [--seconds 20] [--skip 5] [--profile]
import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const BASE = arg("--base", "http://localhost:3000");
const SECONDS = Number(arg("--seconds", 20));
/** --skip 5：点了以后先等 5 秒再开始录（开头准备地形、编译显卡程序那段画面本来就停着，只看真正播放的时候） */
const SKIP = Number(arg("--skip", 0));
const NARRATED = process.argv.includes("--narrated");
/** --profile：同时录 CPU 采样，最后列出最占时间的二十几个函数（找卡在哪） */
const PROFILE = process.argv.includes("--profile");
const BROWSERS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
];

// 锡安 3 天：每天两三站，住 Springdale、最后一晚 Hurricane
const TRIP = {
  version: 2,
  startDate: "2027-06-10",
  dayCount: 3,
  days: [
    ["zion-visitor-center", "zion-pa-rus", "zion-canyon-overlook"],
    ["zion-emerald-pools", "zion-riverside-walk", "zion-observation-point"],
    ["zion-kolob", "zion-checkerboard-mesa"],
  ].map((day) => day.map((id) => ({ id, status: "planned" }))),
  pool: [],
  nights: ["zion-stay-springdale", "zion-stay-springdale", "zion-stay-springdale", "zion-stay-hurricane"].map((id) => ({ kind: "option", id })),
};

const executablePath = BROWSERS.find((path) => existsSync(path));
if (!executablePath) throw new Error("找不到 Chrome 或 Edge");
const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--window-size=1280,860", "--autoplay-policy=no-user-gesture-required", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"],
  defaultViewport: { width: 1280, height: 860 },
});
try {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument((trip) => {
    try {
      localStorage.setItem("nps-guide:trip", JSON.stringify(trip));
    } catch {}
  }, TRIP);
  await page.goto(`${BASE}/zh-Hans/plan`, { waitUntil: "networkidle2", timeout: 120_000 });
  // 地图快滚到屏幕附近才加载；滚过去，等地图和真实道路（OSRM）都到了，“播放路线”才出来
  await page.evaluate(async () => {
    for (let y = 0; y < document.scrollingElement.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 150));
      if (document.querySelector(".maplibregl-canvas")) break;
    }
    document.querySelector(".maplibregl-canvas")?.scrollIntoView({ block: "center" });
  });
  const label = NARRATED ? "讲解版" : "播放路线";
  await page.waitForFunction((text) => [...document.querySelectorAll("button")].some((b) => b.textContent.includes(text)), { timeout: 60_000 }, label);
  await new Promise((resolve) => setTimeout(resolve, 4000));

  const session = await page.createCDPSession();
  await session.send("Performance.enable");
  const metrics = async () => Object.fromEntries((await session.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
  await page.evaluate(() => {
    window.__perf = { frames: [], long: [] };
    try {
      new PerformanceObserver((list) =>
        list.getEntries().forEach((e) => {
          if (e.startTime > (window.__perf.from ?? 0)) window.__perf.long.push(e.duration);
        }),
      ).observe({ type: "longtask" });
    } catch {}
  });
  if (PROFILE) {
    await session.send("Profiler.enable");
    await session.send("Profiler.setSamplingInterval", { interval: 200 });
    await session.send("Profiler.start");
  }
  await page.evaluate(
    (text, skip) => {
      const from = performance.now() + skip * 1000;
      window.__perf.from = from;
      let last = performance.now();
      const tick = (t) => {
        if (t > from) window.__perf.frames.push(t - last);
        last = t;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      [...document.querySelectorAll("button")].find((b) => b.textContent.includes(text)).click();
    },
    label,
    SKIP,
  );
  if (SKIP > 0) await new Promise((resolve) => setTimeout(resolve, SKIP * 1000));
  const before = await metrics();
  await new Promise((resolve) => setTimeout(resolve, SECONDS * 1000));
  const after = await metrics();
  const profile = PROFILE ? (await session.send("Profiler.stop")).profile : null;
  const { frames, long } = await page.evaluate(() => window.__perf);
  const sorted = frames.slice(3).sort((a, b) => a - b);
  const q = (p) => Math.round(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] * 10) / 10;
  const per = (key) => Math.round(((after[key] - before[key]) / SECONDS) * 1000);
  console.log(
    JSON.stringify({
      mode: NARRATED ? "narrated" : "follow",
      seconds: SECONDS,
      skip: SKIP,
      frames: sorted.length,
      fps: Math.round((sorted.length / SECONDS) * 10) / 10,
      frameMs: { p50: q(0.5), p90: q(0.9), p99: q(0.99), max: Math.round(sorted.at(-1)) },
      janky: { over33: sorted.filter((x) => x > 33.4).length, over50: sorted.filter((x) => x > 50).length, over100: sorted.filter((x) => x > 100).length },
      longTasks: { count: long.length, totalMs: Math.round(long.reduce((a, b) => a + b, 0)), maxMs: Math.round(Math.max(0, ...long)) },
      // 每秒主线程花了多少毫秒：总共 / 脚本 / 排版 / 算样式
      mainThreadMsPerSecond: { task: per("TaskDuration"), script: per("ScriptDuration"), layout: per("LayoutDuration"), style: per("RecalcStyleDuration") },
    }),
  );
  if (profile) {
    // 每个函数自己花的时间（不含它调用的），按函数名 + 文件 + 行合在一起
    const total = profile.endTime - profile.startTime;
    const counts = new Map();
    profile.samples.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
    const byFn = new Map();
    for (const node of profile.nodes) {
      const { functionName, url, lineNumber } = node.callFrame;
      const file = url.split("/").pop()?.split("?")[0] || "(native)";
      const key = `${functionName || "(anonymous)"} ${file}:${lineNumber + 1}`;
      byFn.set(key, (byFn.get(key) ?? 0) + (counts.get(node.id) ?? 0));
    }
    const samples = profile.samples.length;
    const rows = [...byFn].sort((a, b) => b[1] - a[1]).slice(0, 28);
    for (const [key, n] of rows) console.log(`${((n / samples) * 100).toFixed(1).padStart(5)}%  ${Math.round(((n / samples) * total) / 1000)}ms  ${key}`);
    // 每一次连着忙了 80 毫秒以上（一帧卡住）：那段时间里最占时间的几个函数，和它们是从哪一层调用进来的（栈底往上第二、三层）
    const byId = new Map(profile.nodes.map((node) => [node.id, node]));
    const parent = new Map();
    for (const node of profile.nodes) for (const child of node.children ?? []) parent.set(child, node.id);
    const name = (id) => {
      const { functionName, url, lineNumber } = byId.get(id).callFrame;
      return `${functionName || "(anonymous)"} ${url.split("/").pop()?.split("?")[0] || ""}:${lineNumber + 1}`;
    };
    const idle = (id) => ["(idle)", "(program)", "(garbage collector)"].includes(byId.get(id).callFrame.functionName);
    let t = profile.startTime;
    const times = profile.timeDeltas.map((d) => (t += d));
    let i = 0;
    const runs = [];
    while (i < profile.samples.length) {
      if (idle(profile.samples[i])) {
        i++;
        continue;
      }
      let j = i;
      while (j + 1 < profile.samples.length && !idle(profile.samples[j + 1])) j++;
      const ms = (times[j] - times[i]) / 1000;
      if (ms >= 80) runs.push({ from: i, to: j, ms });
      i = j + 1;
    }
    for (const run of runs.sort((a, b) => b.ms - a.ms).slice(0, 8)) {
      const self = new Map();
      const roots = new Map();
      for (let k = run.from; k <= run.to; k++) {
        const id = profile.samples[k];
        self.set(name(id), (self.get(name(id)) ?? 0) + 1);
        const chain = [];
        for (let at = id; at !== undefined; at = parent.get(at)) chain.push(at);
        const entry = chain.reverse().slice(1, 4).map(name).join(" > ");
        roots.set(entry, (roots.get(entry) ?? 0) + 1);
      }
      const top = (m) => [...m].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, n]) => `${k} ×${n}`).join(" | ");
      console.log(`
卡 ${Math.round(run.ms)}ms @${Math.round((times[run.from] - profile.startTime) / 1000)}ms：${top(self)}
  从：${top(roots)}`);
    }
  }
} finally {
  await browser.close();
}
