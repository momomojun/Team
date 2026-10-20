import { notFound, redirect } from "next/navigation";
import { loadParkPage } from "@/lib/park-page";

/** 公园页不再展开博主卡片，直接去专题页并筛好这座公园 */
export default async function CreatorsPage({ params }: PageProps<"/[locale]/parks/[code]/creators">) {
  const { locale, code } = await params;
  const view = loadParkPage(locale, code);
  if (!view || view.parkCreators.length === 0) notFound();
  redirect(`/${locale}/routes?park=${code}`);
}
