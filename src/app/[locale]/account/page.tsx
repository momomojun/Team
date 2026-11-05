import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountForm } from "@/components/account/account-form";
import { buttonLarge } from "@/components/ui";
import { signOutNeon } from "@/lib/auth/actions";
import { currentUser, neonAuth } from "@/lib/auth/server";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return { title: getDictionary(locale).account.title, robots: { index: false, follow: false } };
}

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const query = await searchParams;
  const t = getDictionary(locale).account;
  const mode = query.mode === "signup" ? "signup" : "login";
  const here = `/${locale}/account`;
  const home = `/${locale}`;
  const configured = neonAuth() !== null;
  const account = configured ? await currentUser() : null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-28">
      <p className="eyebrow text-mute">{t.eyebrow}</p>
      <h1 className="mt-5 font-serif text-[clamp(2rem,4vw,2.8rem)] leading-tight">{account ? t.hello : t.title}</h1>
      <p className="mt-4 text-sm leading-7 text-ink-soft">{account ? t.signedIn : t.intro}</p>

      {!configured && <p className="mt-8 text-sm leading-7 text-clay-800">{t.notConfigured}</p>}

      {account && (
        <div className="mt-12 space-y-8">
          <p className="text-sm leading-7">
            <span className="block text-lg">{account.name}</span>
            <span className="text-mute">{account.email}</span>
          </p>
          <form action={signOutNeon}>
            <input type="hidden" name="next" value={here} />
            <button type="submit" className={`${buttonLarge} border border-ink/25 text-ink hover:border-ink`}>
              {t.logout}
            </button>
          </form>
        </div>
      )}

      {!account && (
        <>
          <div className="mt-10 flex gap-6 text-sm tracking-[0.12em]">
            <a href={here} className={mode === "login" ? "link-line" : "text-mute hover:text-ink"}>
              {t.loginTab}
            </a>
            <a href={`${here}?mode=signup`} className={mode === "signup" ? "link-line" : "text-mute hover:text-ink"}>
              {t.signupTab}
            </a>
          </div>
          <AccountForm mode={mode} next={here} text={t} />
          <p className="mt-8 text-xs leading-6 text-mute">
            <a href={home} className="hover:text-ink">
              {t.backHome}
            </a>
          </p>
        </>
      )}
    </div>
  );
}
