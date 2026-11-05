"use server";

import { redirect } from "next/navigation";
import { neonAuth } from "./server";

export async function signUpWithNeon(formData: FormData): Promise<{ error: string } | void> {
  const auth = neonAuth();
  if (!auth) return { error: "config" };
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const next = String(formData.get("next") ?? "/");
  try {
    const { error } = await auth.signUp.email({ email, password, name });
    if (error) return { error: error.message || "invalid" };
  } catch {
    return { error: "config" };
  }
  redirect(next.startsWith("/") ? next : "/");
}

export async function signInWithNeon(formData: FormData): Promise<{ error: string } | void> {
  const auth = neonAuth();
  if (!auth) return { error: "config" };
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");
  try {
    const { error } = await auth.signIn.email({ email, password });
    if (error) return { error: error.message || "credentials" };
  } catch {
    return { error: "config" };
  }
  redirect(next.startsWith("/") ? next : "/");
}

export async function signOutNeon(formData: FormData): Promise<void> {
  const auth = neonAuth();
  const next = String(formData.get("next") ?? "/");
  if (auth) await auth.signOut().catch(() => undefined);
  redirect(next.startsWith("/") ? next : "/");
}
