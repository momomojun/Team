import { planTrip, TripRequestError } from "@/lib/copilot/plan-tool";

/**
 * plan_trip 工具的 HTTP 入口，给 Copilot 服务调用：POST 一个 TripRequest（copilot/contracts/trip-request.v1.schema.json），
 * 返回 TripResult。?reference=2026-10-16 固定“今天”（只给了月份时按它算最近的那个月，评测时用）。
 * 请求不合格返回 400 和 {error: "invalid_request", issues}。设了 SITE_PASSWORD 时和别的接口一样要先登录
 */
export async function POST(request: Request) {
  const reference = new URL(request.url).searchParams.get("reference");
  const referenceDate = reference && /^\d{4}-\d{2}-\d{2}$/.test(reference) ? reference : new Date().toISOString().slice(0, 10);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  try {
    return Response.json(planTrip(body, { referenceDate }));
  } catch (error) {
    if (error instanceof TripRequestError) return Response.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    throw error;
  }
}
