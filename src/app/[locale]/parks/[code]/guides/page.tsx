import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuidesSection } from "@/components/park/guides-section";
import { loadParkPage, parkContainer } from "@/lib/park-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/parks/[code]/guides">): Promise<Metadata> {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view) return {};
  return { title: `${view.t.nav.guides} · ${view.title}` };
}

export default async function GuidesPage({ params }: PageProps<"/[locale]/parks/[code]/guides">) {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view) notFound();

  return (
    <div className={`${parkContainer} py-20 lg:py-28`}>
      <GuidesSection parkCode={view.park.code} text={view.t.guides} />
    </div>
  );
}
