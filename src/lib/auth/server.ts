import { createNeonAuth } from "@neondatabase/auth/next/server";

type NeonAuth = ReturnType<typeof createNeonAuth>;

let cached: NeonAuth | null | undefined;

/** Neon Auth（Better Auth）。没在控制台打开 Auth、或没配 NEON_AUTH_BASE_URL 时返回 null，网站其余部分照常用 */
export function neonAuth(): NeonAuth | null {
  if (cached !== undefined) return cached;
  const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim();
  const secret = process.env.NEON_AUTH_COOKIE_SECRET?.trim();
  if (!baseUrl || !secret || secret.length < 32) {
    cached = null;
    return null;
  }
  cached = createNeonAuth({ baseUrl, cookies: { secret } });
  return cached;
}

export async function currentUser(): Promise<{ id: string; email: string; name: string } | null> {
  const auth = neonAuth();
  if (!auth) return null;
  try {
    const { data } = await auth.getSession();
    const user = data?.user;
    if (!user?.id || !user.email) return null;
    return { id: user.id, email: user.email, name: user.name ?? user.email };
  } catch {
    return null;
  }
}
