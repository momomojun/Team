/**
 * 讲解版的配音中转：浏览器 → 这里 → Copilot 服务的 /tts（本机 Kokoro，copilot/nps_copilot/tts.py）。
 *
 * GET                       → {available}：Copilot 开着、模型也装好了没有（讲解版据此决定用本机配音还是浏览器的声音）
 * GET ?text=…&lang=zh-CN    → 这一句的 MP3；Copilot 没开、没装模型时 503，讲解版退回浏览器自带的声音
 *
 * 同一句话的配音不会变，浏览器可以一直缓存；Copilot 那边也按句存着，同一句只生成一次。
 */
import { copilotHeaders } from "@/lib/copilot/upstream";

const BASE = (process.env.COPILOT_URL || "http://127.0.0.1:8765").replace(/\/$/, "");
/** 第一次要把模型装进内存（几秒），之后一句一两秒 */
const TIMEOUT_MS = 30_000;
const MAX_CHARS = 400;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const text = (params.get("text") ?? "").trim().slice(0, MAX_CHARS);
  if (!text) {
    try {
      const response = await fetch(`${BASE}/health`, { headers: copilotHeaders(request), signal: AbortSignal.timeout(3_000), cache: "no-store" });
      const health = (await response.json()) as { tts?: string | null };
      return Response.json({ available: response.ok && Boolean(health.tts) });
    } catch {
      return Response.json({ available: false });
    }
  }
  const lang = params.get("lang") === "en-US" ? "en-US" : "zh-CN";
  try {
    const response = await fetch(`${BASE}/tts?${new URLSearchParams({ text, lang })}`, {
      headers: copilotHeaders(request),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) return Response.json({ error: "tts" }, { status: 503 });
    return new Response(await response.arrayBuffer(), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return Response.json({ error: "offline" }, { status: 503 });
  }
}
