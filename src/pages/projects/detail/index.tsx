import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Copy,
  FileText,
  Loader2,
  Play,
  Save,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProjectInputsTab } from "./ProjectInputsTab";
import { ProjectRunsTab } from "./ProjectRunsTab";
import { EmptyState, PageLoading } from "@/components/common/EmptyState";
import { DataSourceBadge } from "@/components/common/DataSourceBadge";
import { SectionCard } from "@/components/common/PageHeader";
import { SimulationResultView } from "@/components/simulation/SimulationResultView";
import { ScenarioControls } from "@/components/simulation/ScenarioControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { useProfile } from "@/hooks/use-profile";
import { toAiStatus } from "@/lib/api/types";
import { useDuplicateProject, useUpdateProject } from "@/hooks/use-projects";
import {
  useProject,
  useProjectInput,
  useProjectRuns,
  useSaveProjectInput,
} from "@/hooks/use-project-workspace";
import { useRetryInsights, useRunSimulation } from "@/hooks/use-run-simulation";
import { resolveScenarioAdjustments } from "@/lib/simulation/defaults";
import { parseAiInsights, parseAssumptions, parseSimulationResult } from "@/lib/simulation/run";
import { businessModelLabel, projectStageLabel, scaleLabel } from "@/lib/domain/options";
import { parseSimulationInput } from "@/lib/simulation/validate";
import {
  SCENARIO_KEYS,
  type ScenarioAdjustment,
  type ScenarioKey,
  type SimulationInput,
} from "@/lib/simulation/types";
import type { CurrencyCode } from "@/lib/simulation/types";

const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const { data: profile } = useProfile();
  const projectQuery = useProject(projectId);
  const inputQuery = useProjectInput(projectId);
  const runsQuery = useProjectRuns(projectId);

  const saveInput = useSaveProjectInput();
  const runSimulation = useRunSimulation();
  const retryInsights = useRetryInsights();
  const duplicateProject = useDuplicateProject();
  const updateProject = useUpdateProject();

  const [draftInput, setDraftInput] = useState<SimulationInput | null>(null);
  const [adjustments, setAdjustments] = useState<Record<ScenarioKey, ScenarioAdjustment> | null>(
    null,
  );
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("results");

  const project = projectQuery.data ?? null;
  const runs = useMemo(() => runsQuery.data ?? [], [runsQuery.data]);
  const unknownFields = inputQuery.data?.row?.unknown_fields ?? [];

  useEffect(() => {
    if (draftInput === null && inputQuery.data?.input) {
      setDraftInput(inputQuery.data.input);
    }
  }, [inputQuery.data, draftInput]);

  useEffect(() => {
    if (adjustments === null && project) {
      setAdjustments(resolveScenarioAdjustments(project.scenario_overrides));
    }
  }, [project, adjustments]);

  useEffect(() => {
    if (activeRunId === null && runs.length > 0) {
      setActiveRunId(runs[0].id);
    }
  }, [runs, activeRunId]);

  const activeRun = runs.find((run) => run.id === activeRunId) ?? null;
  const activeResult = activeRun ? parseSimulationResult(activeRun.results) : null;
  const activeAssumptions = activeRun ? parseAssumptions(activeRun.assumptions) : [];
  const activeInsights = activeRun ? parseAiInsights(activeRun.ai_insights) : null;
  const activeInput = activeRun
    ? parseSimulationInput(activeRun.input_snapshot)
    : (draftInput ?? null);

  /** A run carries the multipliers it was computed with, so re-derive them from it. */
  const runAdjustments = useMemo(() => {
    if (!activeResult) return adjustments ?? resolveScenarioAdjustments(null);
    return SCENARIO_KEYS.reduce(
      (accumulator, key) => {
        accumulator[key] = activeResult.scenarios[key].adjustment;
        return accumulator;
      },
      {} as Record<ScenarioKey, ScenarioAdjustment>,
    );
  }, [activeResult, adjustments]);

  if (projectQuery.isLoading || inputQuery.isLoading || !draftInput || !adjustments) {
    return <PageLoading />;
  }

  if (!project) {
    return (
      <EmptyState
        icon={FileText}
        title={t("projects.detail.notFound.title")}
        description={t("projects.detail.notFound.description")}
        action={
          <Button asChild>
            <Link to="/projects">{t("projects.detail.notFound.action")}</Link>
          </Button>
        }
      />
    );
  }

  const currency = (project.currency ?? "KRW") as CurrencyCode;

  const handleSave = async () => {
    try {
      await saveInput.mutateAsync({
        projectId: project.id,
        input: draftInput,
        unknownFields,
      });
      await updateProject.mutateAsync({
        id: project.id,
        patch: {
          horizon_months: draftInput.horizonMonths,
          currency: draftInput.currency,
          scenario_overrides: adjustments as never,
        },
      });
      toast.success(t("projects.toast.saved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.unknownError"));
    }
  };

  const handleRun = async () => {
    try {
      await updateProject.mutateAsync({
        id: project.id,
        patch: {
          scenario_overrides: adjustments as never,
          horizon_months: draftInput.horizonMonths,
        },
      });
      const run = await runSimulation.mutateAsync({
        project: {
          id: project.id,
          name: project.name,
          idea: project.idea,
          sectors: project.sectors,
          scale: project.scale,
          stage: project.stage,
          currency,
        },
        profile: profile ?? null,
        input: draftInput,
        adjustments,
        unknownFields,
        locale: i18n.language,
        withAi: true,
      });
      setActiveRunId(run.id);
      setActiveTab("results");
      if (run.ai_status === "ok") {
        toast.success(t("projects.toast.runWithAi"));
      } else if (run.ai_status === "not_requested") {
        toast.success(t("projects.toast.runSaved"));
      } else {
        toast.warning(t("projects.toast.runWithoutAi"));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.unknownError"));
    }
  };

  const handleDuplicate = async () => {
    try {
      const copy = await duplicateProject.mutateAsync(project.id);
      toast.success(t("projects.toast.duplicated", { name: copy.name }));
      navigate(`/projects/${copy.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.unknownError"));
    }
  };

  const handleRetryAi = async () => {
    if (!activeRun) return;
    try {
      await retryInsights.mutateAsync({
        run: activeRun,
        project: {
          id: project.id,
          name: project.name,
          idea: project.idea,
          sectors: project.sectors,
          scale: project.scale,
          stage: project.stage,
          currency,
        },
        profile: profile ?? null,
        locale: i18n.language,
      });
      toast.success(t("projects.toast.aiDone"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.unknownError"));
    }
  };

  const busy = runSimulation.isPending || saveInput.isPending || updateProject.isPending;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
          <Link to="/projects">
            <ArrowLeft className="h-4 w-4" />
            {t("projects.title")}
          </Link>
        </Button>

        <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {project.name}
            </h1>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="muted">{projectStageLabel(t, project.stage ?? "")}</Badge>
              <Badge variant="muted">{scaleLabel(t, project.scale ?? "")}</Badge>
              {project.sectors.map((sector) => (
                <Badge key={sector} variant="outline">
                  {businessModelLabel(t, sector)}
                </Badge>
              ))}
            </div>
            {project.idea ? (
              <p className="max-w-3xl text-sm text-muted-foreground">{project.idea}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleDuplicate()}
              disabled={duplicateProject.isPending}
            >
              <Copy className="h-4 w-4" />
              {t("projects.action.duplicate")}
            </Button>
            {activeRun ? (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/report/${activeRun.id}`} target="_blank" rel="noreferrer">
                  <FileText className="h-4 w-4" />
                  {t("report.open")}
                </Link>
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleSave()}
              disabled={busy}
            >
              {saveInput.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {t("common.save")}
            </Button>
            <Button size="sm" onClick={() => void handleRun()} disabled={busy}>
              {runSimulation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {activeRun ? t("projects.action.rerun") : t("projects.action.run")}
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 p-1">
          <TabsTrigger value="results">{t("projects.tab.results")}</TabsTrigger>
          <TabsTrigger value="inputs">{t("projects.tab.inputs")}</TabsTrigger>
          <TabsTrigger value="runs">
            {t("projects.tab.runs")}
            {runs.length > 0 ? (
              <span className="ml-1.5 text-[11px] text-muted-foreground">{runs.length}</span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="mt-6 space-y-6">
          {activeResult && activeRun ? (
            <>
              {runs.length > 1 ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {t("projects.runSelector.label")}
                  </span>
                  <Select
                    value={activeRun.id}
                    onValueChange={(value) => setActiveRunId(value)}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {runs.map((run) => (
                        <SelectItem key={run.id} value={run.id}>
                          {t("history.runNumber", { number: run.run_number })} ·{" "}
                          {new Date(run.created_at).toLocaleString(i18n.language)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <SimulationResultView
                result={activeResult}
                input={activeInput ?? draftInput}
                currency={currency}
                adjustments={runAdjustments}
                assumptions={activeAssumptions}
                aiStatus={toAiStatus(activeRun.ai_status)}
                aiError={activeRun.ai_error}
                aiModel={activeRun.ai_model}
                aiInsights={activeInsights}
                onRetryAi={() => void handleRetryAi()}
                isRetryingAi={retryInsights.isPending}
              />
            </>
          ) : (
            <EmptyState
              icon={Play}
              title={t("projects.detail.noRun.title")}
              description={t("projects.detail.noRun.description")}
              action={
                <Button onClick={() => void handleRun()} disabled={busy}>
                  <Play className="h-4 w-4" />
                  {t("projects.action.run")}
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="inputs" className="mt-6 space-y-6">
          <SectionCard
            title={t("projects.tab.scenarioSettings")}
            badge={<DataSourceBadge source="assumption" />}
          >
            <ScenarioControls
              adjustments={adjustments}
              disabled={busy}
              onChange={(key, patch) =>
                setAdjustments((current) =>
                  current ? { ...current, [key]: { ...current[key], ...patch } } : current,
                )
              }
              onReset={() => setAdjustments(resolveScenarioAdjustments(null))}
            />
          </SectionCard>

          <ProjectInputsTab
            input={draftInput}
            disabled={busy}
            onChange={(next) => setDraftInput(next)}
          />
        </TabsContent>

        <TabsContent value="runs" className="mt-6">
          <SectionCard
            title={t("projects.tab.runs")}
            description={t("projects.runs.description")}
          >
            <ProjectRunsTab
              runs={runs}
              currency={currency}
              activeRunId={activeRunId}
              onSelectRun={(runId) => {
                setActiveRunId(runId);
                setActiveTab("results");
              }}
            />
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetailPage;
