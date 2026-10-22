/**
 * 行程页对话框的中转：浏览器 → 这里 → Copilot 服务（Python，copilot/nps_copilot/api.py）。浏览器不能直接连本机的
 * Copilot（跨域、端口），设了 SITE_PASSWORD 时这里也和别的接口一样要先登录。
 *
 * GET                               → {available, version}：Copilot 开着没有（行程页没连上就不显示对话框）
 * POST {text, session?}             → 没有 session 先开一个；返回 {session, status, text, question, trip}
 *
 * Copilot 的地址是 COPILOT_URL（默认 http://127.0.0.1:8765；8765 被别的程序占了就在 .env.local 里改，比如 :8766）。
 * 部署在 Vercel 上时连不到谁电脑上的 Copilot，GET 返回 available: false，对话框不出现，页面照旧能用
 */
import { copilotHeaders } from "@/lib/copilot/upstream";

const BASE = (process.env.COPILOT_URL || "http://127.0.0.1:8765").replace(/\/$/, "");
/** 模型几秒一句、排行程一两秒；第一次调用要把模型装进显卡，多等一会儿 */
const TIMEOUT_MS = 120_000;

interface CopilotReply {
  status: "needs_input" | "planned" | "error";
  text: string;
  question: { kind: string; text: string; options?: unknown[] } | null;
  result: { trip?: unknown } | null;
}

async function call(path: string, body?: unknown, timeout = TIMEOUT_MS, request?: Request): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { ...copilotHeaders(request), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
    cache: "no-store",
  });
}

export async function GET(request: Request) {
  void request.url; // 每次现查，不在构建时预先生成
  try {
    const response = await call("/health", undefined, 3_000);
    const health = (await response.json()) as { version?: string; plan_tool?: string };
    // 端口上可能是别的程序：要像 Copilot 的 /health 才算
    const available = response.ok && typeof health.version === "string" && health.plan_tool !== "missing";
    return Response.json({ available, version: available ? health.version : null });
  } catch {
    return Response.json({ available: false, version: null });
  }
}

export async function POST(request: Request) {
  let body: { text?: unknown; session?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 2000) : "";
  if (!text) return Response.json({ error: "empty" }, { status: 400 });
  try {
    let session = typeof body.session === "string" && /^[0-9a-f]{6,32}$/.test(body.session) ? body.session : null;
    if (!session) {
      const created = await call("/sessions", {}, TIMEOUT_MS, request);
      if (!created.ok) return Response.json({ error: "offline" }, { status: 503 });
      session = ((await created.json()) as { session: string }).session;
    }
    let response = await call(`/sessions/${session}/messages`, { text }, TIMEOUT_MS, request);
    if (response.status === 404) {
      // Copilot 重启过，会话没了：开个新的再说一遍（前面的对话它不记得了，回复里会再问）
      const created = await call("/sessions", {}, TIMEOUT_MS, request);
      session = ((await created.json()) as { session: string }).session;
      response = await call(`/sessions/${session}/messages`, { text }, TIMEOUT_MS, request);
    }
    // 发得太多（Copilot 放在公网时按来源限流，guard.py）：照原样告诉页面还要等几秒
    if (response.status === 429) {
      const wait = response.headers.get("Retry-After") ?? "60";
      return Response.json({ error: "rate_limited", retryAfter: Number(wait) }, { status: 429, headers: { "Retry-After": wait } });
    }
    if (!response.ok) return Response.json({ error: response.status === 503 ? "model" : "copilot" }, { status: 502 });
    const reply = (await response.json()) as CopilotReply;
    return Response.json({
      session,
      status: reply.status,
      text: reply.text,
      question: reply.question,
      trip: reply.status === "planned" ? (reply.result?.trip ?? null) : null,
    });
  } catch {
    return Response.json({ error: "offline" }, { status: 503 });
  }
}
