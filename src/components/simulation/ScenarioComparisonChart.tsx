import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useTranslation } from "react-i18next";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { buildScenarioComparison } from "@/lib/simulation/engine";
import { formatCompactCurrency, resolveCurrencyLocale } from "@/lib/simulation/format";
import type { CurrencyCode, SimulationResult } from "@/lib/simulation/types";

/** Yearly revenue per scenario — the headline comparison for a project. */
export const ScenarioComparisonChart = ({
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
  const data = buildScenarioComparison(result);

  const config = {
    optimisticRevenue: { label: t("scenario.optimistic"), color: "hsl(var(--scenario-optimistic))" },
    baseRevenue: { label: t("scenario.base"), color: "hsl(var(--scenario-base))" },
    pessimisticRevenue: { label: t("scenario.pessimistic"), color: "hsl(var(--scenario-pessimistic))" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className={className}>
      <BarChart data={data} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="year"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value: number) => t("simulation.yearLabel", { year: value })}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={68}
          tickFormatter={(value: number) => formatCompactCurrency(value, currency, locale)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="dot"
              formatter={(value) => formatCompactCurrency(Number(value), currency, locale)}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="optimisticRevenue" fill="var(--color-optimisticRevenue)" radius={3} />
        <Bar dataKey="baseRevenue" fill="var(--color-baseRevenue)" radius={3} />
        <Bar dataKey="pessimisticRevenue" fill="var(--color-pessimisticRevenue)" radius={3} />
      </BarChart>
    </ChartContainer>
  );
};
