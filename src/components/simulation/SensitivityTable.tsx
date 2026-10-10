import { useTranslation } from "react-i18next";

import { DataSourceBadge } from "@/components/common/DataSourceBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatPercent, resolveCurrencyLocale } from "@/lib/simulation/format";
import { computeSensitivity, SENSITIVITY_DELTAS } from "@/lib/simulation/sensitivity";
import type {
  CurrencyCode,
  ScenarioAdjustment,
  ScenarioKey,
  SimulationInput,
} from "@/lib/simulation/types";

/**
 * The engine re-run across price and cost shocks. This is computed output, not
 * an AI estimate, so the table is badged accordingly.
 */
export const SensitivityTable = ({
  input,
  adjustments,
  currency,
  scenarioKey = "base",
}: {
  input: SimulationInput;
  adjustments: Record<ScenarioKey, ScenarioAdjustment>;
  currency: CurrencyCode;
  scenarioKey?: ScenarioKey;
}) => {
  const { t, i18n } = useTranslation();
  const locale = resolveCurrencyLocale(currency, i18n.language);
  const cells = computeSensitivity(input, adjustments, scenarioKey);

  const find = (revenueDeltaPct: number, costDeltaPct: number) =>
    cells.find(
      (cell) => cell.revenueDeltaPct === revenueDeltaPct && cell.costDeltaPct === costDeltaPct,
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <DataSourceBadge source="computed" />
        <span className="text-xs text-muted-foreground">
          {t("simulation.sensitivity.notice")}
        </span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[10rem]">
                {t("simulation.sensitivity.revenueDelta")}
              </TableHead>
              {SENSITIVITY_DELTAS.map((costDelta) => (
                <TableHead key={costDelta} className="text-right">
                  {t("simulation.sensitivity.costHeader", { delta: costDelta })}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {SENSITIVITY_DELTAS.map((revenueDelta) => (
              <TableRow key={revenueDelta}>
                <TableCell className="text-sm font-medium text-muted-foreground">
                  {t("simulation.sensitivity.revenueHeader", { delta: revenueDelta })}
                </TableCell>
                {SENSITIVITY_DELTAS.map((costDelta) => {
                  const cell = find(revenueDelta, costDelta);
                  const isBase = revenueDelta === 0 && costDelta === 0;
                  return (
                    <TableCell
                      key={costDelta}
                      className={`tabular text-right text-sm ${
                        isBase ? "bg-accent font-semibold" : ""
                      }`}
                    >
                      <div
                        className={
                          (cell?.horizonNetProfit ?? 0) >= 0
                            ? "text-success"
                            : "text-destructive"
                        }
                      >
                        {formatCurrency(cell?.horizonNetProfit ?? 0, currency, locale)}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {cell?.paybackMonths === null || cell?.paybackMonths === undefined
                          ? t("simulation.value.beyondHorizon")
                          : t("simulation.sensitivity.paybackShort", {
                              months: cell.paybackMonths,
                            })}
                        {" · "}
                        {formatPercent(cell?.roiPct ?? 0, 0, locale)}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
