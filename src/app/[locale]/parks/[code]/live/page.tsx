import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AirSection } from "@/components/park/air-section";
import { AlertsSection } from "@/components/park/alerts-section";
import { ChargersSection } from "@/components/park/chargers-section";
import { FeesSection } from "@/components/park/fees-section";
import { SignalSection } from "@/components/park/signal-section";
import { SectionSkeleton } from "@/components/section";
import { npsCodeOf } from "@/data/parks";
import { isUsingDemoKey } from "@/lib/datagov";
import { loadParkPage, parkContainer } from "@/lib/park-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/parks/[code]/live">): Promise<Metadata> {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view) return {};
  return { title: `${view.t.nav.live} · ${view.title}` };
}

export default async function LivePage({ params }: PageProps<"/[locale]/parks/[code]/live">) {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view) notFound();
  const { park, dict, t } = view;

  return (
    <section className="bg-paper-deep">
      <div className={`${parkContainer} py-20 lg:py-28`}>
      <p className="eyebrow text-mute">{t.infoEyebrow}</p>
      <h2 className="mt-5 font-serif text-[clamp(2rem,3.5vw,3.2rem)] leading-tight">{t.infoTitle}</h2>
      {isUsingDemoKey() && (
        <p className="mt-8 max-w-3xl border-l border-mute pl-5 text-xs leading-6 text-mute">{dict.common.demoKeyNotice}</p>
      )}
      <div className="mt-14 grid items-start gap-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Suspense fallback={<SectionSkeleton title={t.alerts.title} />}>
            <AlertsSection parkCode={npsCodeOf(park)} officialUrl={park.officialUrl} dict={dict} locale={view.locale} />
          </Suspense>
        </div>
        <div className="lg:col-span-5">
          <Suspense fallback={<SectionSkeleton title={t.fees.title} />}>
            <FeesSection parkCode={park.code} npsCode={npsCodeOf(park)} dict={dict} locale={view.locale} />
          </Suspense>
        </div>
      </div>
      <div className="mt-20 grid items-start gap-16 lg:grid-cols-2">
        <Suspense fallback={<SectionSkeleton title={t.air.title} />}>
          <AirSection park={park} dict={dict} />
        </Suspense>
        <SignalSection attractions={view.attractions} locale={view.locale} code={view.code} dict={dict} />
      </div>
      <div className="mt-16">
        <Suspense fallback={<SectionSkeleton title={t.chargers.title} />}>
          <ChargersSection park={park} dict={dict} />
        </Suspense>
      </div>
      </div>
    </section>
  );
}
