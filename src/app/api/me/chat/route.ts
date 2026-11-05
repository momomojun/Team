import { currentUser } from "@/lib/auth/server";
import { loadLatestChat, saveChat, type SavedMessage } from "@/lib/cloud/store";

function messagesOf(value: unknown): SavedMessage[] | null {
  if (!Array.isArray(value)) return null;
  const messages: SavedMessage[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const message = item as { role?: unknown; text?: unknown };
    if ((message.role !== "user" && message.role !== "copilot") || typeof message.text !== "string") return null;
    messages.push({ role: message.role, text: message.text.slice(0, 8000) });
  }
  return messages.slice(-80);
}

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const chat = await loadLatestChat(user.id);
  return Response.json(chat ?? { sessionId: null, messages: [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const body = (await request.json().catch(() => null)) as { sessionId?: unknown; messages?: unknown } | null;
  const messages = messagesOf(body?.messages);
  if (!messages) return Response.json({ error: "invalid" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId.slice(0, 200) : null;
  await saveChat(user.id, sessionId, messages);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
