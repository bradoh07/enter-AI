import { useMemo } from "react";
import { ArrowRight, FolderKanban, Plus, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { DataSourceBadge } from "@/components/common/DataSourceBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { MetricCard, MetricCardSkeleton } from "@/components/common/MetricCard";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { ScenarioComparisonChart } from "@/components/simulation/ScenarioComparisonChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAnalysisHistory } from "@/hooks/use-project-workspace";
import { useProfile } from "@/hooks/use-profile";
import { useProjects } from "@/hooks/use-projects";
import { aiStatusLabel, businessModelLabel } from "@/lib/domain/options";
import { parseSimulationResult } from "@/lib/simulation/run";
import { formatCurrency, formatPercent, resolveCurrencyLocale } from "@/lib/simulation/format";
import type { CurrencyCode } from "@/lib/simulation/types";
import { cn } from "@/lib/utils";

const DashboardPage = () => {
  const { t, i18n } = useTranslation();
  const { data: profile } = useProfile();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: runs, isLoading: runsLoading } = useAnalysisHistory();

  const currency = (profile?.currency ?? "KRW") as CurrencyCode;
  const locale = resolveCurrencyLocale(currency, i18n.language);

  const latestByProject = useMemo(() => {
    const map = new Map<string, NonNullable<typeof runs>[number]>();
    (runs ?? []).forEach((run) => {
      if (!map.has(run.project_id)) map.set(run.project_id, run);
    });
    return map;
  }, [runs]);

  const analysed = useMemo(
    () =>
      [...latestByProject.values()]
        .map((run) => ({ run, result: parseSimulationResult(run.results) }))
        .filter((entry): entry is { run: (typeof entry)["run"]; result: NonNullable<typeof entry.result> } =>
          Boolean(entry.result),
        ),
    [latestByProject],
  );

  const totals = useMemo(() => {
    const totalInvestment = analysed.reduce(
      (sum, entry) => sum + entry.result.scenarios.base.kpis.totalInvestment,
      0,
    );
    const margins = analysed.map((entry) => entry.result.scenarios.base.kpis.operatingMarginPct);
    const averageMargin =
      margins.length > 0 ? margins.reduce((sum, value) => sum + value, 0) / margins.length : 0;
    const underfunded = analysed.filter(
      (entry) => entry.result.scenarios.base.kpis.peakFundingRequirement > 0,
    ).length;
    return { totalInvestment, averageMargin, underfunded };
  }, [analysed]);

  const featured = analysed[0];

  if (projectsLoading || runsLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("dashboard.title")} description={t("dashboard.subtitle")} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
      </div>
    );
  }

  const hasProjects = (projects?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.subtitle")}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/projects">
                <FolderKanban className="h-4 w-4" />
                {t("dashboard.action.browseProjects")}
              </Link>
            </Button>
            <Button asChild>
              <Link to="/simulations/new">
                <Plus className="h-4 w-4" />
                {t("dashboard.action.newSimulation")}
              </Link>
            </Button>
          </>
        }
      />

      {!hasProjects ? (
        <EmptyState
          icon={FolderKanban}
          title={t("dashboard.empty.title")}
          description={t("dashboard.empty.description")}
          action={
            <Button asChild>
              <Link to="/simulations/new">
                <Plus className="h-4 w-4" />
                {t("dashboard.empty.action")}
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label={t("dashboard.kpi.projects")}
              value={String(projects?.length ?? 0)}
              hint={t("dashboard.kpi.projectsHint", { count: analysed.length })}
              badge={<DataSourceBadge source="computed" />}
            />
            <MetricCard
              label={t("dashboard.kpi.totalInvestment")}
              value={formatCurrency(totals.totalInvestment, currency, locale)}
              hint={t("dashboard.kpi.totalInvestmentHint")}
              badge={<DataSourceBadge source="computed" />}
            />
            <MetricCard
              label={t("dashboard.kpi.averageMargin")}
              value={formatPercent(totals.averageMargin, 1, locale)}
              hint={t("dashboard.kpi.averageMarginHint")}
              tone={totals.averageMargin >= 0 ? "positive" : "negative"}
              badge={<DataSourceBadge source="computed" />}
            />
            <MetricCard
              label={t("dashboard.kpi.underfunded")}
              value={String(totals.underfunded)}
              hint={t("dashboard.kpi.underfundedHint")}
              tone={totals.underfunded > 0 ? "warning" : "default"}
              badge={<DataSourceBadge source="computed" />}
            />
          </div>

          {featured ? (
            <SectionCard
              title={t("dashboard.featured.title", { name: featured.run.projectName })}
              badge={<DataSourceBadge source="computed" />}
              description={t("dashboard.featured.description")}
              actions={
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/projects/${featured.run.project_id}`}>
                    {t("common.viewDetail")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              }
            >
              <ScenarioComparisonChart
                result={featured.result}
                currency={featured.result.currency}
                className="h-[300px] w-full"
              />
              <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t("simulation.kpi.peakFunding")}
                  </dt>
                  <dd className="tabular flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatCurrency(
                      featured.result.scenarios.base.kpis.peakFundingRequirement,
                      currency,
                      locale,
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t("simulation.kpi.payback")}
                  </dt>
                  <dd className="tabular flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                    {featured.result.scenarios.base.kpis.paybackMonths === null
                      ? t("simulation.value.beyondHorizon")
                      : t("simulation.value.monthNumber", {
                          month: featured.result.scenarios.base.kpis.paybackMonths,
                        })}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t("history.column.ai")}</dt>
                  <dd className="mt-0.5">
                    <Badge
                      variant={
                        featured.run.ai_status === "ok"
                          ? "success"
                          : featured.run.ai_status === "not_requested"
                            ? "muted"
                            : "warning"
                      }
                    >
                      <Sparkles className="h-3 w-3" />
                      {aiStatusLabel(t, featured.run.ai_status)}
                    </Badge>
                  </dd>
                </div>
              </dl>
            </SectionCard>
          ) : null}

          <SectionCard
            title={t("dashboard.recent.title")}
            description={t("dashboard.recent.description")}
            actions={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/projects">{t("common.viewAll")}</Link>
              </Button>
            }
          >
            <ul className="divide-y divide-border">
              {(projects ?? []).slice(0, 5).map((project) => {
                const latest = latestByProject.get(project.id);
                const result = latest ? parseSimulationResult(latest.results) : null;
                return (
                  <li key={project.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0 space-y-0.5">
                      <Link
                        to={`/projects/${project.id}`}
                        className="truncate text-sm font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        {project.name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {project.sectors.length > 0
                          ? project.sectors
                              .map((sector) => businessModelLabel(t, sector))
                              .join(" · ")
                          : t("projects.noSectors")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "tabular text-sm font-medium",
                          result && result.scenarios.base.kpis.operatingMarginPct >= 0
                            ? "text-success"
                            : result
                              ? "text-destructive"
                              : "text-muted-foreground",
                        )}
                      >
                        {result
                          ? formatPercent(
                              result.scenarios.base.kpis.operatingMarginPct,
                              1,
                              locale,
                            )
                          : t("projects.notSimulated")}
                      </span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/projects/${project.id}`} aria-label={t("common.viewDetail")}>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
