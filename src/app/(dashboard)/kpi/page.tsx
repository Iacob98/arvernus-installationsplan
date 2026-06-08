import { getKpi, type KpiPeriod } from "@/lib/actions/kpi";
import { KpiPageContent } from "@/components/kpi/kpi-page-content";

export const dynamic = "force-dynamic";

const VALID_PERIODS: KpiPeriod[] = ["today", "week", "month", "all"];

export default async function KpiPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const period: KpiPeriod = VALID_PERIODS.includes(sp.period as KpiPeriod)
    ? (sp.period as KpiPeriod)
    : "week";

  const data = await getKpi(period, { from: sp.from, to: sp.to });
  return <KpiPageContent data={data} />;
}
