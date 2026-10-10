import { useMemo, useState } from "react";
import { FileText, History, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { EmptyState, PageLoading } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAnalysisHistory } from "@/hooks/use-project-workspace";
import { useProfile } from "@/hooks/use-profile";
import { aiStatusLabel } from "@/lib/domain/options";
import { formatCurrency, formatPercent, resolveCurrencyLocale } from "@/lib/simulation/format";
import { parseSimulationResult } from "@/lib/simulation/run";
import type { CurrencyCode } from "@/lib/simulation/types";

const statusVariant = (status: string) => {
  if (status === "ok") return "success" as const;
  if (status === "not_requested") return "muted" as const;
  return "warning" as const;
};

const HistoryPage = () => {
  const { t, i18n } = useTranslation();
  const { data: profile } = useProfile();
  const { data: runs, isLoading } = useAnalysisHistory();

  const [query, setQuery] = useState("");
  const [aiFilter, setAiFilter] = useState("all");

  const currency = (profile?.currency ?? "KRW") as CurrencyCode;
  const locale = resolveCurrencyLocale(currency, i18n.language);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (runs ?? []).filter((run) => {
      if (aiFilter !== "all" && run.ai_status !== aiFilter) return false;
      if (!needle) return true;
      return `${run.projectName} ${run.label ?? ""} ${run.run_number}`
        .toLowerCase()
        .includes(needle);
    });
  }, [runs, query, aiFilter]);

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <PageHeader title={t("history.title")} description={t("history.subtitle")} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("history.searchPlaceholder")}
            className="pl-9"
            aria-label={t("history.searchPlaceholder")}
          />
        </div>
        <Select value={aiFilter} onValueChange={setAiFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("history.filter.all")}</SelectItem>
            <SelectItem value="ok">{t("aiStatus.ok")}</SelectItem>
            <SelectItem value="unavailable">{t("aiStatus.unavailable")}</SelectItem>
            <SelectItem value="error">{t("aiStatus.error")}</SelectItem>
            <SelectItem value="not_requested">{t("aiStatus.notRequested")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title={(runs?.length ?? 0) === 0 ? t("history.empty.title") : t("history.empty.filteredTitle")}
          description={
            (runs?.length ?? 0) === 0
              ? t("history.empty.description")
              : t("history.empty.filteredDescription")
          }
          action={
            (runs?.length ?? 0) === 0 ? (
              <Button asChild>
                <Link to="/simulations/new">{t("history.empty.action")}</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-panel">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("history.column.project")}</TableHead>
                <TableHead>{t("history.column.run")}</TableHead>
                <TableHead>{t("history.column.date")}</TableHead>
                <TableHead className="text-right">
                  {t("simulation.kpi.operatingMargin")}
                </TableHead>
                <TableHead className="text-right">{t("simulation.kpi.roi")}</TableHead>
                <TableHead>{t("history.column.ai")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((run) => {
                const result = parseSimulationResult(run.results);
                const kpis = result?.scenarios.base.kpis;
                const runCurrency = (result?.currency ?? currency) as CurrencyCode;
                const runLocale = resolveCurrencyLocale(runCurrency, i18n.language);
                return (
                  <TableRow key={run.id}>
                    <TableCell className="text-sm font-medium text-foreground">
                      <Link
                        to={`/projects/${run.project_id}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {run.projectName || t("history.unknownProject")}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t("history.runNumber", { number: run.run_number })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(run.created_at).toLocaleString(locale)}
                    </TableCell>
                    <TableCell className="tabular text-right text-sm">
                      {kpis ? formatPercent(kpis.operatingMarginPct, 1, runLocale) : "-"}
                    </TableCell>
                    <TableCell className="tabular text-right text-sm">
                      {kpis ? formatCurrency(kpis.horizonNetProfit, runCurrency, runLocale) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(run.ai_status)}>
                        {aiStatusLabel(t, run.ai_status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/runs/${run.id}`}>{t("history.action.open")}</Link>
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
      )}
    </div>
  );
};

export default HistoryPage;
