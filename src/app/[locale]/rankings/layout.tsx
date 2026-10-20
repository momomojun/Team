import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RankingsHashRedirect } from "@/components/rankings/rankings-hash-redirect";
import { SectionNav } from "@/components/site/section-nav";
import { headerPhoto } from "@/components/site/header-photo";
import { PageHeader } from "@/components/site/page-header";
import { fill } from "@/i18n/format";
import { loadRankingsPage } from "@/lib/rankings-page";

export async function generateMetadata({ params }: LayoutProps<"/[locale]/rankings">): Promise<Metadata> {
  const { locale } = await params;
  const view = loadRankingsPage(locale);
  if (!view) return {};
  return { title: { default: view.t.title, template: `%s · ${view.dict.site.name}` } };
}

export default async function RankingsLayout({ children, params }: LayoutProps<"/[locale]/rankings">) {
  const { locale } = await params;
  const view = loadRankingsPage(locale);
  if (!view) notFound();
  const { t, stats, total, oursUnits, hasPicks, hasHonors } = view;
  const base = `/${locale}/rankings`;

  return (
    <>
      <RankingsHashRedirect />
      <div className="mx-auto max-w-[1600px] px-5 pt-14 pb-14 sm:px-10">
        <PageHeader
          eyebrow={t.eyebrow}
          title={t.title}
          intro={fill(t.intro, { n: total, ours: oursUnits })}
          photo={headerPhoto("yell-grand-prismatic", view.locale)}
        />
        <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-line pt-6 lg:grid-cols-4">
          {stats.map(([label, value, note]) => (
            <div key={label} className="flex flex-col-reverse">
              <dt className="mt-2 text-xs leading-5 text-mute">
                <span className="eyebrow block text-mute">{label}</span>
                <span className="mt-1 block">{note}</span>
              </dt>
              <dd className="font-serif text-[clamp(1.8rem,3vw,2.6rem)] leading-none">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <SectionNav
        label={t.nav.label}
        items={[
          { id: "visits", label: t.nav.visits, href: base },
          { id: "timeline", label: t.nav.timeline, href: `${base}/timeline` },
          ...(hasPicks ? [{ id: "picks", label: t.nav.picks, href: `${base}/picks` }] : []),
          ...(hasHonors ? [{ id: "honors", label: t.nav.honors, href: `${base}/honors` }] : []),
        ]}
      />
      {children}
    </>
  );
}
