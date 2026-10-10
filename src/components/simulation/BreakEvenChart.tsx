import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
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
import type { CurrencyCode, SimulationResult } from "@/lib/simulation/types";

/**
 * Monthly revenue against total cost for the base scenario. Where the two lines
 * cross is the month the business starts covering its own costs.
 */
export const BreakEvenChart = ({
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
  const { monthly, kpis } = result.scenarios.base;

  const data = monthly.map((point) => ({
    month: point.month,
    revenue: point.revenue,
    totalCost:
      point.variableCost +
      point.fixedCost +
      point.payrollCost +
      point.marketingCost +
      point.overheadCost,
  }));

  const config = {
    revenue: { label: t("simulation.series.revenue"), color: "hsl(var(--chart-1))" },
    totalCost: { label: t("simulation.series.totalCost"), color: "hsl(var(--chart-5))" },
  } satisfies ChartConfig;

  const money = (value: unknown) => formatCompactCurrency(Number(value), currency, locale);

  return (
    <ChartContainer config={config} className={className}>
      <LineChart data={data} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
          tickFormatter={(value: number) => t("simulation.monthLabel", { month: value })}
        />
        <YAxis tickLine={false} axisLine={false} width={68} tickFormatter={money} />
        {kpis.breakevenMonthlyRevenue !== null ? (
          <ReferenceLine
            y={kpis.breakevenMonthlyRevenue}
            stroke="hsl(var(--success))"
            strokeDasharray="4 4"
            label={{
              value: t("simulation.breakevenLine"),
              position: "insideTopRight",
              fill: "hsl(var(--muted-foreground))",
              fontSize: 11,
            }}
          />
        ) : null}
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(label) => t("simulation.monthLabel", { month: Number(label) })}
              formatter={(value) => money(value)}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-revenue)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="totalCost"
          stroke="var(--color-totalCost)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
};
