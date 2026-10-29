/**
 * 后台（/admin）的数据：Copilot 服务的 /health 和 /stats（运行日志的统计、按模型的调用和花费、最近几轮、读公告的状态），
 * 加上 GitHub 上每晚读公告的 workflow 最近几次跑得怎么样、还开着的 nps-alerts issue，和每晚调用模型的计费总账
 * （data/alerts-live 分支的 usage.json，copilot/scripts/publish_usage.py 写的；本机服务的那一份在 stats.billing 里，后台加起来）。
 *
 * GET ?days=7 → {available, health, stats, nightly}
 *
 * 最近几轮里有用户说的原话：部署到公网又没设访问密码（SITE_PASSWORD）时不给，返回 404。
 * Copilot 没开（或者部署在 Vercel 上连不到）时 available: false，GitHub 那部分照样给
 */
import { copilotHeaders } from "@/lib/copilot/upstream";

const BASE = (process.env.COPILOT_URL || "http://127.0.0.1:8765").replace(/\/$/, "");
const REPO = "momomojun/Team";
const WORKFLOW = "alerts-nightly.yml";
/** GitHub 不登录每小时 60 次：5 分钟内只查一次 */
const GITHUB_TTL_MS = 5 * 60_000;

interface Nightly {
  runs: { id: number; status: string; conclusion: string | null; created: string; url: string; event: string }[];
  issues: { number: number; title: string; created: string; url: string }[];
  /** 每晚 GitHub 上调用模型的计费总账（还没发布过、读不到时是 null） */
  billing: { rows: unknown[]; limits: unknown[] } | null;
  error?: string;
}

let githubCache: { at: number; data: Nightly } | null = null;

async function getJson(url: string, timeout: number, headers?: Record<string, string>) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(timeout), cache: "no-store" });
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}

async function nightly(): Promise<Nightly> {
  if (githubCache && Date.now() - githubCache.at < GITHUB_TTL_MS) return githubCache.data;
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "nps-guide-admin" };
  try {
    const [runs, issues, billing] = await Promise.all([
      getJson(`https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/runs?per_page=7`, 8_000, headers),
      getJson(`https://api.github.com/repos/${REPO}/issues?labels=nps-alerts&state=open&per_page=10`, 8_000, headers),
      // raw 文件不算进 GitHub 接口每小时 60 次的额度；还没发布过是 404
      getJson(`https://raw.githubusercontent.com/${REPO}/data/alerts-live/usage.json`, 8_000).catch(() => null),
    ]);
    const data: Nightly = {
      runs: (runs.workflow_runs ?? []).map((run: Record<string, unknown>) => ({
        id: run.id,
        status: run.status,
        conclusion: run.conclusion,
        created: run.created_at,
        url: run.html_url,
        event: run.event,
      })),
      issues: (issues ?? [])
        .filter((issue: Record<string, unknown>) => !issue.pull_request)
        .map((issue: Record<string, unknown>) => ({
          number: issue.number,
          title: issue.title,
          created: issue.created_at,
          url: issue.html_url,
        })),
      billing: billing && Array.isArray(billing.rows) ? billing : null,
    };
    githubCache = { at: Date.now(), data };
    return data;
  } catch (error) {
    return { runs: [], issues: [], billing: null, error: error instanceof Error ? error.message : "github" };
  }
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production" && !process.env.SITE_PASSWORD) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  const asked = Number(new URL(request.url).searchParams.get("days"));
  const days = Number.isFinite(asked) && asked >= 1 ? Math.min(Math.round(asked), 90) : 7;
  const github = nightly();
  try {
    const [health, stats] = await Promise.all([
      getJson(`${BASE}/health`, 4_000, copilotHeaders()),
      getJson(`${BASE}/stats?days=${days}`, 15_000, copilotHeaders()),
    ]);
    // 端口上可能是别的程序：要像 Copilot 的 /health 才算
    const available = typeof health.version === "string" && stats && typeof stats === "object" && "usage" in stats;
    return Response.json({ available, health: available ? health : null, stats: available ? stats : null, nightly: await github });
  } catch {
    return Response.json({ available: false, health: null, stats: null, nightly: await github });
  }
}
