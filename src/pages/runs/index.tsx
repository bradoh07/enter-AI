import { ArrowLeft, FileText } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { EmptyState, PageLoading } from "@/components/common/EmptyState";
import { SimulationResultView } from "@/components/simulation/SimulationResultView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { useProject, useRun } from "@/hooks/use-project-workspace";
import { useRetryInsights } from "@/hooks/use-run-simulation";
import { toast } from "@/components/ui/sonner";
import { aiStatusLabel } from "@/lib/domain/options";
import { parseAiInsights, parseAssumptions, parseSimulationResult } from "@/lib/simulation/run";
import { toAiStatus } from "@/lib/api/types";
import { parseSimulationInput } from "@/lib/simulation/validate";
import { SCENARIO_KEYS, type ScenarioAdjustment, type ScenarioKey } from "@/lib/simulation/types";

const RunDetailPage = () => {
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
        icon={FileText}
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
    <div className="space-y-6">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
          <Link to="/history">
            <ArrowLeft className="h-4 w-4" />
            {t("history.title")}
          </Link>
        </Button>

        <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {project?.name ?? t("history.unknownProject")}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{t("history.runNumber", { number: run.run_number })}</Badge>
              <span>{new Date(run.created_at).toLocaleString(i18n.language)}</span>
              <Badge
                variant={
                  run.ai_status === "ok"
                    ? "success"
                    : run.ai_status === "not_requested"
                      ? "muted"
                      : "warning"
                }
              >
                {aiStatusLabel(t, run.ai_status)}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {project ? (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/projects/${project.id}`}>{t("runs.openProject")}</Link>
              </Button>
            ) : null}
            <Button variant="outline" size="sm" asChild>
              <Link to={`/report/${run.id}`} target="_blank" rel="noreferrer">
                <FileText className="h-4 w-4" />
                {t("report.open")}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <SimulationResultView
        result={result}
        input={parseSimulationInput(run.input_snapshot)}
        currency={result.currency}
        adjustments={adjustments}
        assumptions={parseAssumptions(run.assumptions)}
        aiStatus={toAiStatus(run.ai_status)}
        aiError={run.ai_error}
        aiModel={run.ai_model}
        aiInsights={parseAiInsights(run.ai_insights)}
        onRetryAi={project ? () => void handleRetryAi() : undefined}
        isRetryingAi={retryInsights.isPending}
      />
    </div>
  );
};

export default RunDetailPage;
