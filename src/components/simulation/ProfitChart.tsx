import { Area, Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts";
import { useTranslation } from "react-i18next";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCompactCurrency, resolveCurrencyLocale } from "@/lib/simulation/format";
import type { CurrencyCode, ScenarioKey, SimulationResult } from "@/lib/simulation/types";

/**
 * Yearly revenue, total cost and operating profit for one scenario.
 *
 * Revenue and cost are bars (bulk), operating profit is an area: it can be
 * negative, and the soft sky wash keeps the profitable years obvious at a
 * glance without competing with the bars for attention.
 */
export const ProfitChart = ({
  result,
  currency,
  scenarioKey,
  className,
}: {
  result: SimulationResult;
  currency: CurrencyCode;
  scenarioKey: ScenarioKey;
  className?: string;
}) => {
  const { t, i18n } = useTranslation();
  const locale = resolveCurrencyLocale(currency, i18n.language);
  const data = result.scenarios[scenarioKey].yearly;

  const config = {
    revenue: { label: t("simulation.series.revenue"), color: "hsl(var(--chart-2))" },
    cost: { label: t("simulation.series.cost"), color: "hsl(var(--chart-4))" },
    operatingProfit: {
      label: t("simulation.series.operatingProfit"),
      color: "hsl(var(--chart-3))",
    },
  } satisfies ChartConfig;

  const money = (value: unknown) => formatCompactCurrency(Number(value), currency, locale);

  return (
    <ChartContainer config={config} className={className}>
      <ComposedChart data={data} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="year"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value: number) => t("simulation.yearLabel", { year: value })}
        />
        <YAxis tickLine={false} axisLine={false} width={72} tickFormatter={money} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(label) => t("simulation.yearLabel", { year: Number(label) })}
              formatter={(value) => money(value)}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={2} />
        <Bar dataKey="cost" fill="var(--color-cost)" radius={2} />
        <Area
          type="monotone"
          dataKey="operatingProfit"
          stroke="hsl(var(--chart-5))"
          strokeWidth={2}
          fill="var(--color-operatingProfit)"
          fillOpacity={0.3}
          dot={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
};
