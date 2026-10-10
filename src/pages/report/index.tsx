import { ArrowLeft, Printer } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { EmptyState, PageLoading } from "@/components/common/EmptyState";
import { DataSourceBadge } from "@/components/common/DataSourceBadge";
import { AssumptionsPanel } from "@/components/simulation/AssumptionsPanel";
import { BreakEvenChart } from "@/components/simulation/BreakEvenChart";
import { CashFlowChart } from "@/components/simulation/CashFlowChart";
import { ProfitChart } from "@/components/simulation/ProfitChart";
import { ScenarioComparisonChart } from "@/components/simulation/ScenarioComparisonChart";
import { ScenarioSummaryTable } from "@/components/simulation/ScenarioSummaryTable";
import { AiInsightPanel } from "@/components/simulation/AiInsightPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { useProject, useRun } from "@/hooks/use-project-workspace";
import { useRetryInsights } from "@/hooks/use-run-simulation";
import { toast } from "@/components/ui/sonner";
import { parseAiInsights, parseAssumptions, parseSimulationResult } from "@/lib/simulation/run";
import { toAiStatus } from "@/lib/api/types";
import { parseSimulationInput } from "@/lib/simulation/validate";
import { SCENARIO_KEYS, type ScenarioAdjustment, type ScenarioKey } from "@/lib/simulation/types";

/**
 * Print-only report. The on-screen chrome is hidden by `print-hidden` and the
 * sheet itself is flattened by `print-sheet`, so "Save as PDF" produces a clean
 * document with every figure and its provenance intact.
 */
const ReportPage = () => {
  const { runId } = useParams<{ runId: string }>();
  const { t, i18n } = useTranslation();
  const { data: profile } = useProfile();
  const { data: run, isLoading } = useRun(runId);
  const { data: project } = useProject(run?.project_id);
  const retryInsights = useRetryInsights();

  if (isLoading) return <PageLoading />;

  const result = run ? parseSimulationResult(run.results) : null;

  if (!run || !result) {
    return (
      <EmptyState
        icon={Printer}
        title={t("runs.notFound.title")}
        description={t("runs.notFound.description")}
        action={
          <Button asChild>
            <Link to="/history">{t("history.title")}</Link>
          </Button>
        }
      />
    );
  }

  const input = parseSimulationInput(run.input_snapshot);
  const assumptions = parseAssumptions(run.assumptions);
  const insights = parseAiInsights(run.ai_insights);
  const adjustments = SCENARIO_KEYS.reduce(
    (accumulator, key) => {
      accumulator[key] = result.scenarios[key].adjustment;
      return accumulator;
    },
    {} as Record<ScenarioKey, ScenarioAdjustment>,
  );

  const handleRetryAi = async () => {
    if (!project) return;
    try {
      await retryInsights.mutateAsync({
        run,
        project: {
          id: project.id,
          name: project.name,
          idea: project.idea,
          sectors: project.sectors,
          scale: project.scale,
          stage: project.stage,
          currency: result.currency,
        },
        profile: profile ?? null,
        locale: i18n.language,
      });
      toast.success(t("projects.toast.aiDone"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.unknownError"));
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-8 print:bg-background print:p-0">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="print-hidden flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
            <Link to={`/runs/${run.id}`}>
              <ArrowLeft className="h-4 w-4" />
              {t("report.back")}
            </Link>
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            {t("report.print")}
          </Button>
        </div>

        <article className="print-sheet space-y-8 rounded-lg border border-border bg-card p-8 shadow-panel print:rounded-none">
          <header className="space-y-3 border-b border-border pb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {t("report.eyebrow")}
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {project?.name ?? t("history.unknownProject")}
                </h1>
                {project?.idea ? (
                  <p className="max-w-2xl text-sm text-muted-foreground">{project.idea}</p>
                ) : null}
              </div>
              <dl className="space-y-1 text-right text-xs text-muted-foreground">
                <div>
                  <dt className="inline">{t("report.run")}: </dt>
                  <dd className="inline tabular">
                    {t("history.runNumber", { number: run.run_number })}
                  </dd>
                </div>
                <div>
                  <dt className="inline">{t("report.generatedAt")}: </dt>
                  <dd className="inline tabular">
                    {new Date(run.created_at).toLocaleString(i18n.language)}
                  </dd>
                </div>
                <div>
                  <dt className="inline">{t("report.engine")}: </dt>
                  <dd className="inline tabular">v{run.engine_version}</dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <DataSourceBadge source="computed" />
              <span>{t("report.provenanceNotice")}</span>
            </div>
          </header>

          <section className="print-avoid-break space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              {t("report.section.summary")}
            </h2>
            <ScenarioSummaryTable result={result} currency={result.currency} />
          </section>

          <section className="print-avoid-break space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              {t("report.section.revenue")}
            </h2>
            <ScenarioComparisonChart
              result={result}
              currency={result.currency}
              className="h-[280px] w-full"
            />
          </section>

          <section className="print-break-before space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              {t("report.section.cashflow")}
            </h2>
            <CashFlowChart result={result} currency={result.currency} className="h-[280px] w-full" />
          </section>

          <section className="print-avoid-break space-y-4">
            <h2 className="text-sm font-semibold text-foreground">{t("report.section.profit")}</h2>
            <ProfitChart result={result} currency={result.currency} scenarioKey="base" className="h-[280px] w-full" />
          </section>

          <section className="print-avoid-break space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              {t("report.section.breakeven")}
            </h2>
            <BreakEvenChart result={result} currency={result.currency} className="h-[280px] w-full" />
          </section>

          <section className="print-break-before space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              {t("report.section.assumptions")}
            </h2>
            <AssumptionsPanel notes={assumptions} />
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">
                {t("report.section.ai")}
              </h2>
              <Badge variant={run.ai_status === "ok" ? "ai" : "warning"}>
                {t("report.aiBadge")}
              </Badge>
            </div>
            <AiInsightPanel
              status={toAiStatus(run.ai_status)}
              error={run.ai_error}
              model={run.ai_model}
              insights={insights}
              onRetry={project ? () => void handleRetryAi() : undefined}
              isRetrying={retryInsights.isPending}
            />
          </section>

          <footer className="border-t border-border pt-4">
            <h2 className="text-sm font-semibold text-foreground">
              {t("report.section.inputs")}
            </h2>
            <dl className="mt-3 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
              <div className="flex justify-between border-b border-border py-1">
                <dt className="text-muted-foreground">{t("report.input.horizon")}</dt>
                <dd className="tabular text-foreground">{input.horizonMonths}</dd>
              </div>
              <div className="flex justify-between border-b border-border py-1">
                <dt className="text-muted-foreground">{t("report.input.streams")}</dt>
                <dd className="tabular text-foreground">{input.revenueStreams.length}</dd>
              </div>
              <div className="flex justify-between border-b border-border py-1">
                <dt className="text-muted-foreground">{t("report.input.fixedCosts")}</dt>
                <dd className="tabular text-foreground">{input.fixedCosts.length}</dd>
              </div>
              <div className="flex justify-between border-b border-border py-1">
                <dt className="text-muted-foreground">{t("report.input.payroll")}</dt>
                <dd className="tabular text-foreground">{input.payroll.length}</dd>
              </div>
              <div className="flex justify-between border-b border-border py-1">
                <dt className="text-muted-foreground">{t("report.input.taxRate")}</dt>
                <dd className="tabular text-foreground">{input.taxRatePct}%</dd>
              </div>
              <div className="flex justify-between border-b border-border py-1">
                <dt className="text-muted-foreground">{t("report.input.discountRate")}</dt>
                <dd className="tabular text-foreground">{input.discountRatePct}%</dd>
              </div>
              <div className="flex justify-between border-b border-border py-1">
                <dt className="text-muted-foreground">{t("report.input.workingCapital")}</dt>
                <dd className="tabular text-foreground">{input.workingCapitalMonths}</dd>
              </div>
              <div className="flex justify-between border-b border-border py-1">
                <dt className="text-muted-foreground">{t("report.input.rampOffset")}</dt>
                <dd className="tabular text-foreground">
                  {adjustments.base.rampOffsetMonths}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              {t("report.disclaimer")}
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
};

export default ReportPage;
