import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
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
import { SCENARIO_KEYS, type CurrencyCode, type SimulationResult } from "@/lib/simulation/types";

/**
 * Cumulative cash per scenario. The lowest point is the capital the project
 * actually needs; wherever a line crosses zero is the payback month.
 */
export const CashFlowChart = ({
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

  const data = result.scenarios.base.monthly.map((point, index) => {
    const row: Record<string, number> = { month: point.month };
    SCENARIO_KEYS.forEach((key) => {
      row[key] = result.scenarios[key].monthly[index]?.cumulativeCashFlow ?? 0;
    });
    return row;
  });

  const config = {
    optimistic: { label: t("scenario.optimistic"), color: "hsl(var(--scenario-optimistic))" },
    base: { label: t("scenario.base"), color: "hsl(var(--scenario-base))" },
    pessimistic: { label: t("scenario.pessimistic"), color: "hsl(var(--scenario-pessimistic))" },
  } satisfies ChartConfig;

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
        <YAxis
          tickLine={false}
          axisLine={false}
          width={68}
          tickFormatter={(value: number) => formatCompactCurrency(value, currency, locale)}
        />
        <ReferenceLine y={0} stroke="hsl(var(--border))" />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(label) => t("simulation.monthLabel", { month: Number(label) })}
              formatter={(value) => formatCompactCurrency(Number(value), currency, locale)}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {SCENARIO_KEYS.map((key) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={`var(--color-${key})`}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
};
