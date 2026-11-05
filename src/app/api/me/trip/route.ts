import { currentUser } from "@/lib/auth/server";
import { loadTrip, saveTrip } from "@/lib/cloud/store";
import { normalizeTrip } from "@/lib/trip-record";

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const trip = await loadTrip(user.id);
  return Response.json({ trip });
}

export async function PUT(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { trip?: unknown } | null;
  const trip = normalizeTrip(body?.trip);
  if (!trip) return Response.json({ error: "invalid" }, { status: 400 });
  await saveTrip(user.id, trip);
  return Response.json({ ok: true });
}
