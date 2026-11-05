import { randomUUID } from "node:crypto";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { normalizeTrip, type Trip } from "../trip-record";

type Sql = NeonQueryFunction<false, false>;

export interface SavedMessage {
  role: "user" | "copilot";
  text: string;
}

let ready: Promise<Sql> | null = null;

async function sql(): Promise<Sql | null> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (!ready) {
    const client = neon(url);
    ready = (async () => {
      await client`CREATE TABLE IF NOT EXISTS user_trips (
        user_id text PRIMARY KEY,
        trip jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )`;
      await client`CREATE TABLE IF NOT EXISTS chat_threads (
        id text PRIMARY KEY,
        user_id text NOT NULL,
        session_id text,
        messages jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )`;
      return client;
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

export async function loadTrip(userId: string): Promise<Trip | null> {
  const db = await sql();
  if (!db) return null;
  const rows = await db`SELECT trip FROM user_trips WHERE user_id = ${userId} LIMIT 1`;
  const trip = rows[0]?.trip;
  return normalizeTrip(typeof trip === "string" ? JSON.parse(trip) : trip);
}

export async function saveTrip(userId: string, trip: Trip): Promise<void> {
  const db = await sql();
  if (!db) throw new Error("DATABASE_URL is not set");
  const payload = JSON.stringify(trip);
  await db`
    INSERT INTO user_trips (user_id, trip, updated_at)
    VALUES (${userId}, ${payload}::jsonb, now())
    ON CONFLICT (user_id) DO UPDATE SET trip = EXCLUDED.trip, updated_at = now()
  `;
}

export async function loadLatestChat(userId: string): Promise<{ sessionId: string | null; messages: SavedMessage[] } | null> {
  const db = await sql();
  if (!db) return null;
  const rows = await db`
    SELECT session_id, messages FROM chat_threads
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
    LIMIT 1
  `;
  const row = rows[0] as { session_id: string | null; messages: unknown } | undefined;
  if (!row) return null;
  const messages = Array.isArray(row.messages) ? row.messages.flatMap(normalizeMessage) : [];
  return { sessionId: row.session_id, messages };
}

export async function saveChat(userId: string, sessionId: string | null, messages: SavedMessage[]): Promise<void> {
  const db = await sql();
  if (!db) throw new Error("DATABASE_URL is not set");
  const payload = JSON.stringify(messages);
  if (sessionId) {
    const existing = await db`SELECT id FROM chat_threads WHERE user_id = ${userId} AND session_id = ${sessionId} LIMIT 1`;
    const id = (existing[0] as { id: string } | undefined)?.id ?? randomUUID();
    await db`
      INSERT INTO chat_threads (id, user_id, session_id, messages, updated_at)
      VALUES (${id}, ${userId}, ${sessionId}, ${payload}::jsonb, now())
      ON CONFLICT (id) DO UPDATE SET messages = EXCLUDED.messages, updated_at = now()
    `;
    return;
  }
  const id = randomUUID();
  await db`
    INSERT INTO chat_threads (id, user_id, session_id, messages, updated_at)
    VALUES (${id}, ${userId}, ${null}, ${payload}::jsonb, now())
  `;
}

function normalizeMessage(value: unknown): SavedMessage[] {
  if (!value || typeof value !== "object") return [];
  const message = value as { role?: unknown; text?: unknown };
  if ((message.role === "user" || message.role === "copilot") && typeof message.text === "string") {
    return [{ role: message.role, text: message.text }];
  }
  return [];
}
