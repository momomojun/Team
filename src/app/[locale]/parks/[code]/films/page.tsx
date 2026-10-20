import { notFound, redirect } from "next/navigation";
import { loadParkPage } from "@/lib/park-page";

/** 公园页不再展开影视同款，直接去专题页并筛好这座公园 */
export default async function FilmsPage({ params }: PageProps<"/[locale]/parks/[code]/films">) {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view || view.parkFilms.length === 0) notFound();
  redirect(`/${locale}/routes?park=${code}#films`);
}
