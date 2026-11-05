"use client";

import { useState, type FormEvent } from "react";
import { buttonLarge } from "@/components/ui";
import { signInWithNeon, signUpWithNeon } from "@/lib/auth/actions";

const field =
  "mt-3 block w-full border-b border-ink/30 bg-transparent py-2 text-base tracking-normal normal-case text-ink outline-none focus:border-ink";

interface AccountText {
  name: string;
  email: string;
  password: string;
  passwordHint: string;
  loginSubmit: string;
  signupSubmit: string;
  errors: { invalid: string; credentials: string; taken: string; config: string };
}

export function AccountForm({
  mode,
  next,
  text,
}: {
  mode: "login" | "signup";
  next: string;
  text: AccountText;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    try {
      const result = mode === "signup" ? await signUpWithNeon(data) : await signInWithNeon(data);
      if (result?.error) setError(messageOf(result.error, mode, text));
    } catch {
      setError(text.errors.config);
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-8 space-y-8">
      <input type="hidden" name="next" value={next} />
      {mode === "signup" && (
        <label className="eyebrow block text-mute">
          {text.name}
          <input type="text" name="name" required autoComplete="name" maxLength={80} className={field} />
        </label>
      )}
      <label className="eyebrow block text-mute">
        {text.email}
        <input type="email" name="email" required autoComplete="email" className={field} />
      </label>
      <label className="eyebrow block text-mute">
        {text.password}
        <input
          type="password"
          name="password"
          required
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          minLength={8}
          className={field}
        />
      </label>
      {mode === "signup" && <p className="text-xs leading-6 text-mute">{text.passwordHint}</p>}
      {error && <p className="text-sm text-clay-700">{error}</p>}
      <button type="submit" disabled={pending} className={`${buttonLarge} bg-ink text-paper hover:bg-clay-700 disabled:opacity-60`}>
        {mode === "signup" ? text.signupSubmit : text.loginSubmit}
      </button>
    </form>
  );
}

function messageOf(error: string, mode: "login" | "signup", text: AccountText): string {
  if (error === "config") return text.errors.config;
  if (/already|exists|taken/i.test(error)) return text.errors.taken;
  return mode === "login" ? text.errors.credentials : text.errors.invalid;
}
