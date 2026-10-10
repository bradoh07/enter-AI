import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatMonths, formatPercent, resolveCurrencyLocale } from "@/lib/simulation/format";
import { scenarioLabel } from "@/lib/domain/options";
import { SCENARIO_KEYS, type CurrencyCode, type SimulationResult } from "@/lib/simulation/types";

/** Side-by-side reading of the three scenarios, all values engine-computed. */
export const ScenarioSummaryTable = ({
  result,
  currency,
  className,
}: {
  result: SimulationResult;
  currency: CurrencyCode;
  className?: string;
}) => {
  const { t, i18n } = useTranslation();
  const locale = resolveCurrencyLocale(currency, i18n.language);

  const money = (value: number) => formatCurrency(value, currency, locale);
  const months = (value: number | null) =>
    value === null
      ? t("simulation.value.beyondHorizon")
      : t("simulation.value.months", { months: formatMonths(value, locale) });

  const rows: Array<{ label: string; render: (key: (typeof SCENARIO_KEYS)[number]) => string; tone?: (key: (typeof SCENARIO_KEYS)[number]) => string }> = [
    {
      label: t("simulation.kpi.totalInvestment"),
      render: (key) => money(result.scenarios[key].kpis.totalInvestment),
    },
    {
      label: t("simulation.kpi.peakFunding"),
      render: (key) => money(result.scenarios[key].kpis.peakFundingRequirement),
    },
    {
      label: t("simulation.kpi.yearOneRevenue"),
      render: (key) => money(result.scenarios[key].kpis.yearOneRevenue),
    },
    {
      label: t("simulation.kpi.horizonRevenue"),
      render: (key) => money(result.scenarios[key].kpis.horizonRevenue),
    },
    {
      label: t("simulation.kpi.horizonOperatingProfit"),
      render: (key) => money(result.scenarios[key].kpis.horizonOperatingProfit),
      tone: (key) =>
        result.scenarios[key].kpis.horizonOperatingProfit >= 0
          ? "text-success"
          : "text-destructive",
    },
    {
      label: t("simulation.kpi.operatingMargin"),
      render: (key) =>
        formatPercent(result.scenarios[key].kpis.operatingMarginPct, 1, locale),
      tone: (key) =>
        result.scenarios[key].kpis.operatingMarginPct >= 0 ? "text-success" : "text-destructive",
    },
    {
      label: t("simulation.kpi.firstProfitable"),
      render: (key) => {
        const month = result.scenarios[key].kpis.firstProfitableMonth;
        return month === null
          ? t("simulation.value.notRecovered")
          : t("simulation.value.monthNumber", { month });
      },
    },
    {
      label: t("simulation.kpi.payback"),
      render: (key) => months(result.scenarios[key].kpis.paybackMonths),
    },
    {
      label: t("simulation.kpi.npv"),
      render: (key) => money(result.scenarios[key].kpis.npv),
      tone: (key) => (result.scenarios[key].kpis.npv >= 0 ? "text-success" : "text-destructive"),
    },
    {
      label: t("simulation.kpi.irr"),
      render: (key) => {
        const irr = result.scenarios[key].kpis.irrAnnualPct;
        return irr === null ? t("simulation.value.notApplicable") : formatPercent(irr, 1, locale);
      },
    },
    {
      label: t("simulation.kpi.roi"),
      render: (key) => formatPercent(result.scenarios[key].kpis.roiPct, 1, locale),
    },
  ];

  return (
    <div className={className}>
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
        {t("simulation.computedNotice")}
      </p>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[12rem]">{t("simulation.metricColumn")}</TableHead>
              {SCENARIO_KEYS.map((key) => (
                <TableHead key={key} className="text-right">
                  <span className="inline-flex items-center gap-2">
                    <Badge variant={key}>{scenarioLabel(t, key)}</Badge>
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="text-sm text-muted-foreground">{row.label}</TableCell>
                {SCENARIO_KEYS.map((key) => (
                  <TableCell
                    key={key}
                    className={`tabular text-right text-sm font-medium ${row.tone ? row.tone(key) : "text-foreground"}`}
                  >
                    {row.render(key)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
