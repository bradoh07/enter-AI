import { FileText, History } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { aiStatusLabel, scenarioLabel } from "@/lib/domain/options";
import { formatCurrency, formatPercent, resolveCurrencyLocale } from "@/lib/simulation/format";
import { parseSimulationResult } from "@/lib/simulation/run";
import type { SimulationRun } from "@/lib/api/types";
import type { CurrencyCode } from "@/lib/simulation/types";

const statusVariant = (status: string) => {
  if (status === "ok") return "success" as const;
  if (status === "not_requested") return "muted" as const;
  return "warning" as const;
};

/** Every stored run, newest first, so results can be compared over time. */
export const ProjectRunsTab = ({
  runs,
  currency,
  activeRunId,
  onSelectRun,
}: {
  runs: SimulationRun[];
  currency: CurrencyCode;
  activeRunId: string | null;
  onSelectRun: (runId: string) => void;
}) => {
  const { t, i18n } = useTranslation();
  const locale = resolveCurrencyLocale(currency, i18n.language);

  if (runs.length === 0) {
    return (
      <EmptyState
        icon={History}
        title={t("projects.runs.empty.title")}
        description={t("projects.runs.empty.description")}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("history.column.run")}</TableHead>
            <TableHead>{t("history.column.date")}</TableHead>
            <TableHead className="text-right">{t("simulation.kpi.totalInvestment")}</TableHead>
            <TableHead className="text-right">
              {t("simulation.kpi.operatingMargin")}
            </TableHead>
            <TableHead className="text-right">{t("simulation.kpi.payback")}</TableHead>
            <TableHead>{t("history.column.ai")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => {
            const result = parseSimulationResult(run.results);
            const kpis = result?.scenarios.base.kpis;
            return (
              <TableRow key={run.id} className={run.id === activeRunId ? "bg-accent" : undefined}>
                <TableCell className="text-sm font-medium text-foreground">
                  {t("history.runNumber", { number: run.run_number })}
                  <span className="ml-2 text-[11px] text-muted-foreground">
                    {scenarioLabel(t, "base")} · v{run.engine_version}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(run.created_at).toLocaleString(locale)}
                </TableCell>
                <TableCell className="tabular text-right text-sm">
                  {kpis ? formatCurrency(kpis.totalInvestment, currency, locale) : "-"}
                </TableCell>
                <TableCell className="tabular text-right text-sm">
                  {kpis ? formatPercent(kpis.operatingMarginPct, 1, locale) : "-"}
                </TableCell>
                <TableCell className="tabular text-right text-sm">
                  {kpis
                    ? kpis.paybackMonths === null
                      ? t("simulation.value.beyondHorizon")
                      : t("simulation.value.monthNumber", { month: kpis.paybackMonths })
                    : "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(run.ai_status)}>
                    {aiStatusLabel(t, run.ai_status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onSelectRun(run.id)}>
                      {t("history.action.open")}
                    </Button>
                    <Button variant="ghost" size="icon" asChild aria-label={t("report.open")}>
                      <Link to={`/report/${run.id}`}>
                        <FileText className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
