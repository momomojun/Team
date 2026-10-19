import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingsSection } from "@/components/park/bookings-section";
import { loadParkPage, parkContainer } from "@/lib/park-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/parks/[code]/bookings">): Promise<Metadata> {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view) return {};
  return { title: `${view.t.nav.bookings} · ${view.title}` };
}

export default async function BookingsPage({ params }: PageProps<"/[locale]/parks/[code]/bookings">) {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view || !view.hasBookings) notFound();
  const { park, parkBookings, parkShuttles, parkParking, dict } = view;

  return (
    <div className={`${parkContainer} py-20 lg:py-28`}>
      <p className="eyebrow mb-12 text-mute">{dict.park.bookings.eyebrow}</p>
      <BookingsSection
        rules={parkBookings}
        shuttles={parkShuttles}
        parking={parkParking}
        planHref={`/${locale}/plan?park=${park.code}`}
        dict={dict}
      />
    </div>
  );
}
