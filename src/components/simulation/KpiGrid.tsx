import { useTranslation } from "react-i18next";

import { MetricCard } from "@/components/common/MetricCard";
import { DataSourceBadge } from "@/components/common/DataSourceBadge";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatMonths, formatPercent, resolveCurrencyLocale } from "@/lib/simulation/format";
import { scenarioLabel } from "@/lib/domain/options";
import type { CurrencyCode, KpiSet, ScenarioKey } from "@/lib/simulation/types";

export const KpiGrid = ({
  kpis,
  currency,
  scenarioKey,
  className,
}: {
  kpis: KpiSet;
  currency: CurrencyCode;
  scenarioKey: ScenarioKey;
  className?: string;
}) => {
  const { t, i18n } = useTranslation();
  const locale = resolveCurrencyLocale(currency, i18n.language);

  const money = (value: number) => formatCurrency(value, currency, locale);

  const notRecovered = t("simulation.value.notRecovered");

  return (
    <div className={className}>
      <div className="mb-3 flex items-center gap-2">
        <Badge variant={scenarioKey}>{scenarioLabel(t, scenarioKey)}</Badge>
        <DataSourceBadge source="computed" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t("simulation.kpi.totalInvestment")}
          value={money(kpis.totalInvestment)}
          hint={t("simulation.kpi.totalInvestmentHint")}
        />
        <MetricCard
          label={t("simulation.kpi.peakFunding")}
          value={money(kpis.peakFundingRequirement)}
          hint={t("simulation.kpi.peakFundingHint")}
          tone={kpis.peakFundingRequirement > 0 ? "warning" : "default"}
        />
        <MetricCard
          label={t("simulation.kpi.yearOneRevenue")}
          value={money(kpis.yearOneRevenue)}
          hint={t("simulation.kpi.horizonRevenueHint", {
            amount: money(kpis.horizonRevenue),
          })}
        />
        <MetricCard
          label={t("simulation.kpi.operatingMargin")}
          value={formatPercent(kpis.operatingMarginPct, 1, locale)}
          hint={t("simulation.kpi.operatingProfitHint", {
            amount: money(kpis.horizonOperatingProfit),
          })}
          tone={kpis.operatingMarginPct >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          label={t("simulation.kpi.firstProfitable")}
          value={
            kpis.firstProfitableMonth === null
              ? notRecovered
              : t("simulation.value.monthNumber", { month: kpis.firstProfitableMonth })
          }
          hint={t("simulation.kpi.firstProfitableHint")}
        />
        <MetricCard
          label={t("simulation.kpi.payback")}
          value={
            kpis.paybackMonths === null
              ? t("simulation.value.beyondHorizon")
              : t("simulation.value.months", {
                  months: formatMonths(kpis.paybackMonths, locale),
                })
          }
          hint={t("simulation.kpi.paybackHint")}
          tone={kpis.paybackMonths === null ? "warning" : "default"}
        />
        <MetricCard
          label={t("simulation.kpi.npv")}
          value={money(kpis.npv)}
          hint={t("simulation.kpi.npvHint")}
          tone={kpis.npv >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          label={t("simulation.kpi.irr")}
          value={
            kpis.irrAnnualPct === null
              ? t("simulation.value.notApplicable")
              : formatPercent(kpis.irrAnnualPct, 1, locale)
          }
          hint={t("simulation.kpi.roiHint", {
            roi: formatPercent(kpis.roiPct, 1, locale),
          })}
          tone={kpis.irrAnnualPct !== null && kpis.irrAnnualPct > 0 ? "positive" : "default"}
        />
      </div>
    </div>
  );
};
