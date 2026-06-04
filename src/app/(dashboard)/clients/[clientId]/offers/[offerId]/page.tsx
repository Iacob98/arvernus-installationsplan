import { notFound } from "next/navigation";
import { getOffer, type OfferDetailForClient } from "@/lib/actions/offers";
import { OfferDetailPage } from "@/components/offers/offer-detail-page";
import { serializeDecimals } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export default async function OfferPage({
  params,
}: {
  params: Promise<{ clientId: string; offerId: string }>;
}) {
  const { clientId, offerId } = await params;
  const offer = await getOffer(offerId);
  if (!offer || offer.clientId !== clientId) notFound();
  const serialized: OfferDetailForClient = serializeDecimals(offer);
  return <OfferDetailPage offer={serialized} />;
}
