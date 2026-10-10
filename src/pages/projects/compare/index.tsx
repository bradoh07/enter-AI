import { useMemo } from "react";
import { ArrowLeft, Scale } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { EmptyState, PageLoading } from "@/components/common/EmptyState";
import { DataSourceBadge } from "@/components/common/DataSourceBadge";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { ScenarioComparisonChart } from "@/components/simulation/ScenarioComparisonChart";
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
import { useAnalysisHistory } from "@/hooks/use-project-workspace";
import { useProjects } from "@/hooks/use-projects";
import { formatCurrency, formatMonths, formatPercent, resolveCurrencyLocale } from "@/lib/simulation/format";
import { parseSimulationResult } from "@/lib/simulation/run";
import type { CurrencyCode, SimulationResult } from "@/lib/simulation/types";

type Compared = {
  projectId: string;
  projectName: string;
  currency: CurrencyCode;
  result: SimulationResult;
};

const ComparePage = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: runs, isLoading: runsLoading } = useAnalysisHistory();

  const ids = useMemo(
    () =>
      (searchParams.get("ids") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    [searchParams],
  );

  const compared = useMemo<Compared[]>(() => {
    const latestByProject = new Map<string, NonNullable<typeof runs>[number]>();
    (runs ?? []).forEach((run) => {
      if (!latestByProject.has(run.project_id)) latestByProject.set(run.project_id, run);
    });

    return ids.flatMap((projectId) => {
      const project = (projects ?? []).find((entry) => entry.id === projectId);
      const run = latestByProject.get(projectId);
      if (!project || !run) return [];
      const result = parseSimulationResult(run.results);
      if (!result) return [];
      return [
        {
          projectId,
          projectName: project.name,
          currency: (project.currency ?? "KRW") as CurrencyCode,
          result,
        },
      ];
    });
  }, [ids, projects, runs]);

  if (projectsLoading || runsLoading) return <PageLoading />;

  if (compared.length < 2) {
    return (
      <EmptyState
        icon={Scale}
        title={t("compare.empty.title")}
        description={t("compare.empty.description")}
        action={
          <Button asChild>
            <Link to="/projects">{t("compare.empty.action")}</Link>
          </Button>
        }
      />
    );
  }

  const locale = resolveCurrencyLocale(compared[0].currency, i18n.language);
  const money = (value: number, currency: CurrencyCode) =>
    formatCurrency(value, currency, resolveCurrencyLocale(currency, i18n.language));

  const rows: Array<{
    label: string;
    render: (entry: Compared) => string;
    tone?: (entry: Compared) => string;
  }> = [
    {
      label: t("simulation.kpi.totalInvestment"),
      render: (entry) => money(entry.result.scenarios.base.kpis.totalInvestment, entry.currency),
    },
    {
      label: t("simulation.kpi.peakFunding"),
      render: (entry) => money(entry.result.scenarios.base.kpis.peakFundingRequirement, entry.currency),
    },
    {
      label: t("simulation.kpi.yearOneRevenue"),
      render: (entry) => money(entry.result.scenarios.base.kpis.yearOneRevenue, entry.currency),
    },
    {
      label: t("simulation.kpi.horizonOperatingProfit"),
      render: (entry) =>
        money(entry.result.scenarios.base.kpis.horizonOperatingProfit, entry.currency),
      tone: (entry) =>
        entry.result.scenarios.base.kpis.horizonOperatingProfit >= 0
          ? "text-success"
          : "text-destructive",
    },
    {
      label: t("simulation.kpi.operatingMargin"),
      render: (entry) =>
        formatPercent(entry.result.scenarios.base.kpis.operatingMarginPct, 1, locale),
    },
    {
      label: t("simulation.kpi.payback"),
      render: (entry) =>
        entry.result.scenarios.base.kpis.paybackMonths === null
          ? t("simulation.value.beyondHorizon")
          : t("simulation.value.months", {
              months: formatMonths(entry.result.scenarios.base.kpis.paybackMonths, locale),
            }),
    },
    {
      label: t("simulation.kpi.npv"),
      render: (entry) => money(entry.result.scenarios.base.kpis.npv, entry.currency),
      tone: (entry) =>
        entry.result.scenarios.base.kpis.npv >= 0 ? "text-success" : "text-destructive",
    },
    {
      label: t("simulation.kpi.irr"),
      render: (entry) =>
        entry.result.scenarios.base.kpis.irrAnnualPct === null
          ? t("simulation.value.notApplicable")
          : formatPercent(entry.result.scenarios.base.kpis.irrAnnualPct, 1, locale),
    },
    {
      label: t("simulation.scenarioSpread"),
      render: (entry) => {
        const optimistic = entry.result.scenarios.optimistic.kpis.operatingMarginPct;
        const pessimistic = entry.result.scenarios.pessimistic.kpis.operatingMarginPct;
        return `${formatPercent(pessimistic, 1, locale)} ~ ${formatPercent(optimistic, 1, locale)}`;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
          <Link to="/projects">
            <ArrowLeft className="h-4 w-4" />
            {t("projects.title")}
          </Link>
        </Button>
        <PageHeader
          title={t("compare.title")}
          description={t("compare.subtitle", { count: compared.length })}
        />
      </div>

      <SectionCard
        title={t("compare.tableTitle")}
        badge={<DataSourceBadge source="computed" />}
        description={t("simulation.computedNotice")}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[12rem]">{t("simulation.metricColumn")}</TableHead>
                {compared.map((entry) => (
                  <TableHead key={entry.projectId} className="text-right">
                    <Link
                      to={`/projects/${entry.projectId}`}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {entry.projectName}
                    </Link>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="text-sm text-muted-foreground">{row.label}</TableCell>
                  {compared.map((entry) => (
                    <TableCell
                      key={entry.projectId}
                      className={`tabular text-right text-sm font-medium ${
                        row.tone ? row.tone(entry) : "text-foreground"
                      }`}
                    >
                      {row.render(entry)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        {compared.map((entry) => (
          <SectionCard
            key={entry.projectId}
            title={entry.projectName}
            badge={<Badge variant="base">{t("scenario.base")}</Badge>}
            description={t("compare.revenueChartDescription")}
          >
            <ScenarioComparisonChart
              result={entry.result}
              currency={entry.currency}
              className="h-[280px] w-full"
            />
          </SectionCard>
        ))}
      </div>
    </div>
  );
};

export default ComparePage;
