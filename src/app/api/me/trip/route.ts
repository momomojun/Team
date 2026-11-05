import { currentUser } from "@/lib/auth/server";
import { loadTrip, saveTrip } from "@/lib/cloud/store";
import { normalizeTrip } from "@/lib/trip-record";

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const trip = await loadTrip(user.id);
  return Response.json({ trip }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const body = (await request.json().catch(() => null)) as { trip?: unknown; rev?: unknown } | null;
  const trip = normalizeTrip(body?.trip);
  if (!trip) return Response.json({ error: "invalid" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  // 修订号是浏览器里改行程那一刻的时间（毫秒）；没带的按收到的时间
  const rev = typeof body?.rev === "number" && Number.isFinite(body.rev) ? Math.round(body.rev) : Date.now();
  await saveTrip(user.id, trip, rev);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
