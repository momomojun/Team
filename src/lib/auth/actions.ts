"use server";

import { redirect } from "next/navigation";
import { neonAuth } from "./server";

/** 登录、注册、退出以后跳回哪：只许本站的路径；“//别的网站”“/\别的网站”浏览器会当成别的网站（开放重定向） */
function safeNext(value: FormDataEntryValue | null): string {
  const next = String(value ?? "/");
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}

export async function signUpWithNeon(formData: FormData): Promise<{ error: string } | void> {
  const auth = neonAuth();
  if (!auth) return { error: "config" };
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const next = safeNext(formData.get("next"));
  try {
    const { error } = await auth.signUp.email({ email, password, name });
    if (error) return { error: error.message || "invalid" };
  } catch {
    return { error: "config" };
  }
  redirect(next);
}

export async function signInWithNeon(formData: FormData): Promise<{ error: string } | void> {
  const auth = neonAuth();
  if (!auth) return { error: "config" };
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  try {
    const { error } = await auth.signIn.email({ email, password });
    if (error) return { error: error.message || "credentials" };
  } catch {
    return { error: "config" };
  }
  redirect(next);
}

export async function signOutNeon(formData: FormData): Promise<void> {
  const auth = neonAuth();
  const next = safeNext(formData.get("next"));
  if (auth) {
    const result = await auth.signOut();
    if (result?.error) throw new Error(`sign-out failed: ${result.error.message ?? "unknown"}`);
  }
  redirect(next);
}
