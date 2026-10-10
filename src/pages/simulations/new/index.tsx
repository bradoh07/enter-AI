import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Play,
  Sparkles,
  WifiOff,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { AiQuestionField } from "./AiQuestionField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "@/components/common/PageHeader";
import { DataSourceBadge } from "@/components/common/DataSourceBadge";
import { MultiSelectField } from "@/components/form/MultiSelectField";
import { IntakeFieldsForm } from "@/components/form/IntakeFieldsForm";
import { ScenarioControls } from "@/components/simulation/ScenarioControls";
import { SimulationResultView } from "@/components/simulation/SimulationResultView";
import { ProjectInputsTab } from "@/pages/projects/detail/ProjectInputsTab";
import { toast } from "@/components/ui/sonner";
import { useProfile } from "@/hooks/use-profile";
import { useCreateProject } from "@/hooks/use-projects";
import { useReplaceQuestions, useSaveProjectInput } from "@/hooks/use-project-workspace";
import { useGenerateScopingQuestions } from "@/hooks/use-ai-scoping";
import { useRunSimulation } from "@/hooks/use-run-simulation";
import {
  BUSINESS_MODEL_VALUES,
  CURRENCY_VALUES,
  HORIZON_VALUES,
  PROJECT_STAGE_VALUES,
  SCALE_VALUES,
  businessModelLabel,
  currencyLabel,
  projectStageLabel,
  scaleLabel,
} from "@/lib/domain/options";
import {
  applyProfileAssumptions,
  createStartingInput,
  resolveScenarioAdjustments,
} from "@/lib/simulation/defaults";
import {
  buildSimulationInput,
  CORE_SLOT_KEYS,
  UNKNOWN,
  type CoreSlotKey,
  type IntakeAnswers,
} from "@/lib/simulation/intake";
import { parseAiInsights, parseAssumptions, parseSimulationResult } from "@/lib/simulation/run";
import type {
  CurrencyCode,
  ScenarioAdjustment,
  ScenarioKey,
  SimulationInput,
} from "@/lib/simulation/types";
import type { AiQuestion } from "@/lib/ai/types";
import { toAiStatus } from "@/lib/api/types";
import type { AiRunStatus, SimulationRun } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * Slots that materially change the outcome, pre-marked as undecided so a blank
 * wizard never presents template values as the user's own assumptions.
 */
const MATERIAL_SLOTS: CoreSlotKey[] = [
  "pricePerUnit",
  "monthlyUnits",
  "unitCost",
  "initialInvestmentTotal",
  "monthlyFixedCost",
  "headcount",
  "averageSalary",
];

const currencySymbolOf = (currency: CurrencyCode) => (currency === "USD" ? "$" : "₩");

const STEPS = [1, 2, 3, 4] as const;

const NewSimulationPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const createProject = useCreateProject();
  const replaceQuestions = useReplaceQuestions();
  const saveInput = useSaveProjectInput();
  const runSimulation = useRunSimulation();
  const scoping = useGenerateScopingQuestions();

  const initialAnswers = useMemo(
    () =>
      Object.fromEntries(MATERIAL_SLOTS.map((slot) => [slot, UNKNOWN])) as IntakeAnswers,
    [],
  );

  const [step, setStep] = useState<(typeof STEPS)[number]>(1);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");
  const [sectors, setSectors] = useState<string[]>([]);
  const [scale, setScale] = useState("micro");
  const [stage, setStage] = useState("planning");
  const [currency, setCurrency] = useState<CurrencyCode>(
    (profile?.currency as CurrencyCode) ?? "KRW",
  );
  const [horizonMonths, setHorizonMonths] = useState<number>(36);

  const [answers, setAnswers] = useState<IntakeAnswers>(initialAnswers);
  const [questions, setQuestions] = useState<AiQuestion[]>([]);
  const [scopingStatus, setScopingStatus] = useState<AiRunStatus>("not_requested");
  const [scopingError, setScopingError] = useState<string | null>(null);

  const [projectId, setProjectId] = useState<string | null>(null);
  const [draftInput, setDraftInput] = useState<SimulationInput | null>(null);
  const [unknownFields, setUnknownFields] = useState<string[]>([]);
  const [adjustments, setAdjustments] = useState<Record<ScenarioKey, ScenarioAdjustment>>(
    resolveScenarioAdjustments(null),
  );
  const [run, setRun] = useState<SimulationRun | null>(null);

  const businessModelOptions = useMemo(
    () => BUSINESS_MODEL_VALUES.map((value) => ({ value, label: businessModelLabel(t, value) })),
    [t],
  );

  const setAnswer = (key: string, value: string) => {
    setAnswers((current) => ({ ...current, [key]: value }));
  };

  const setAnswerUnknown = (key: string) => {
    setAnswers((current) => ({ ...current, [key]: UNKNOWN }));
  };

  const setQuestionAnswer = (question: AiQuestion, value: string) => {
    setAnswers((current) => {
      const next: IntakeAnswers = { ...current, [question.key]: value };
      if (question.mapsTo) next[question.mapsTo as CoreSlotKey] = value;
      return next;
    });
  };

  const setQuestionUnknown = (question: AiQuestion) => {
    setAnswers((current) => {
      const next: IntakeAnswers = { ...current, [question.key]: UNKNOWN };
      if (question.mapsTo) next[question.mapsTo as CoreSlotKey] = UNKNOWN;
      return next;
    });
  };

  const handleStartQuestions = async () => {
    if (!name.trim() || !idea.trim()) {
      setError(t("newSimulation.validation.required"));
      return;
    }
    setError(null);
    setStep(2);

    if (questions.length > 0 || scopingStatus === "unavailable" || scoping.isPending) return;

    const result = await scoping.mutateAsync({
      project: {
        name: name.trim(),
        idea: idea.trim(),
        sectors,
        scale,
        stage,
        currency,
      },
      profile: profile ?? null,
      locale: i18n.language,
    });

    if (result.status === "ok") {
      setQuestions(result.questions);
      setScopingStatus("ok");
      setScopingError(null);
    } else {
      setQuestions([]);
      setScopingStatus(result.status);
      setScopingError(result.message);
    }
  };

  const handleSubmitQuestions = async () => {
    setError(null);
    try {
      const created =
        projectId ??
        (
          await createProject.mutateAsync({
            name: name.trim(),
            idea: idea.trim(),
            sectors,
            scale,
            stage,
            currency,
            horizonMonths,
          })
        ).id;
      setProjectId(created);

      if (questions.length > 0) {
        await replaceQuestions.mutateAsync({
          projectId: created,
          questions: questions.map((question) => ({
            question_key: question.key,
            label: question.label,
            help_text: question.help || null,
            input_type: question.inputType,
            unit: question.unit || null,
            options: question.options,
            required: question.required,
            maps_to: question.mapsTo || null,
          })),
        });
      }

      // Profile-level defaults seed the modelling conventions for a new project.
      const base = applyProfileAssumptions(
        createStartingInput(currency, horizonMonths),
        profile?.default_assumptions,
      );
      const built = buildSimulationInput(answers, base);
      setDraftInput(built.input);
      setUnknownFields(built.unknownFields);
      await saveInput.mutateAsync({
        projectId: created,
        input: built.input,
        unknownFields: built.unknownFields,
      });

      setStep(3);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("common.unknownError"));
    }
  };

  const handleRun = async () => {
    if (!projectId || !draftInput) return;
    setError(null);
    try {
      const created = await runSimulation.mutateAsync({
        project: {
          id: projectId,
          name: name.trim(),
          idea: idea.trim(),
          sectors,
          scale,
          stage,
          currency,
        },
        profile: profile ?? null,
        input: draftInput,
        adjustments,
        unknownFields,
        locale: i18n.language,
        withAi: true,
      });
      setRun(created);
      setStep(4);
      if (created.ai_status === "ok") {
        toast.success(t("projects.toast.runWithAi"));
      } else {
        toast.warning(t("projects.toast.runWithoutAi"));
      }
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : t("common.unknownError"));
    }
  };

  const result = run ? parseSimulationResult(run.results) : null;
  const insights = run ? parseAiInsights(run.ai_insights) : null;
  const assumptions = run ? parseAssumptions(run.assumptions) : [];
  const busy = createProject.isPending || replaceQuestions.isPending || saveInput.isPending;

  const stepLabels = [
    t("newSimulation.step.overview"),
    t("newSimulation.step.questions"),
    t("newSimulation.step.conditions"),
    t("newSimulation.step.results"),
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("newSimulation.title")}
        </h1>

        <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {STEPS.map((value, index) => {
            const active = value === step;
            const done = value < step;
            return (
              <li key={value} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                      active
                        ? "bg-primary text-primary-foreground"
                        : done
                          ? "bg-success/15 text-success"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : value}
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      active ? "font-semibold text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {stepLabels[index]}
                  </span>
                </div>
                {index < STEPS.length - 1 ? (
                  <span className="hidden h-px w-8 bg-border sm:block" />
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {step === 1 ? (
        <Card className="shadow-panel">
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label htmlFor="projectName">{t("newSimulation.field.name")}</Label>
              <Input
                id="projectName"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("newSimulation.field.namePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectIdea">{t("newSimulation.field.idea")}</Label>
              <Textarea
                id="projectIdea"
                rows={5}
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                placeholder={t("newSimulation.field.ideaPlaceholder")}
              />
              <p className="text-[11px] text-muted-foreground">
                {t("newSimulation.field.ideaHint")}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t("newSimulation.field.sectors")}</Label>
              <MultiSelectField
                options={businessModelOptions}
                value={sectors}
                onChange={setSectors}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="projectStage">{t("newSimulation.field.stage")}</Label>
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger id="projectStage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STAGE_VALUES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {projectStageLabel(t, value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectScale">{t("newSimulation.field.scale")}</Label>
                <Select value={scale} onValueChange={setScale}>
                  <SelectTrigger id="projectScale">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCALE_VALUES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {scaleLabel(t, value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectCurrency">{t("settings.field.currency")}</Label>
                <Select
                  value={currency}
                  onValueChange={(value) => setCurrency(value as CurrencyCode)}
                >
                  <SelectTrigger id="projectCurrency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_VALUES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {currencyLabel(t, value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("newSimulation.field.horizon")}</Label>
              <div className="flex flex-wrap gap-2">
                {HORIZON_VALUES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={horizonMonths === value}
                    onClick={() => setHorizonMonths(value)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm transition-colors",
                      horizonMonths === value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:border-primary/40",
                    )}
                  >
                    {t("newSimulation.field.horizonOption", { months: value })}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end border-t border-border pt-5">
              <Button onClick={() => void handleStartQuestions()}>
                {t("common.next")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <div className="space-y-6">
          {scoping.isPending ? (
            <Card className="shadow-panel">
              <CardContent className="flex items-center gap-3 py-10">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {t("newSimulation.questions.loading")}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {!scoping.isPending && scopingStatus === "ok" && questions.length > 0 ? (
            <SectionCard
              title={t("newSimulation.questions.aiTitle")}
              badge={<DataSourceBadge source="ai" />}
              description={t("newSimulation.questions.aiDescription")}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                {questions.map((question) => (
                  <AiQuestionField
                    key={question.key}
                    question={question}
                    currencySymbol={currencySymbolOf(currency)}
                    value={
                      answers[question.key] === undefined ? "" : String(answers[question.key])
                    }
                    unknown={answers[question.key] === UNKNOWN}
                    onValueChange={(next) => setQuestionAnswer(question, next)}
                    onUnknownChange={() => setQuestionUnknown(question)}
                  />
                ))}
              </div>
            </SectionCard>
          ) : null}

          {!scoping.isPending &&
          (scopingStatus === "unavailable" || scopingStatus === "error") ? (
            <Alert variant={scopingStatus === "unavailable" ? "default" : "destructive"}>
              {scopingStatus === "unavailable" ? (
                <WifiOff className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription className="space-y-1">
                <span className="block font-medium">
                  {scopingStatus === "unavailable"
                    ? t("ai.unavailable.title")
                    : t("ai.error.title")}
                </span>
                <span className="block text-xs">
                  {scopingStatus === "unavailable"
                    ? t("newSimulation.questions.unavailableDescription")
                    : t("newSimulation.questions.errorDescription")}
                </span>
                {scopingError ? (
                  <span className="block text-[11px] opacity-80">{scopingError}</span>
                ) : null}
              </AlertDescription>
            </Alert>
          ) : null}

          <SectionCard
            title={
              scopingStatus === "ok" && questions.length > 0
                ? t("newSimulation.questions.manualTitle")
                : t("newSimulation.questions.baselineTitle")
            }
            badge={
              <Badge variant={scopingStatus === "ok" && questions.length > 0 ? "muted" : "estimation"}>
                {scopingStatus === "ok" && questions.length > 0
                  ? t("newSimulation.questions.manualBadge")
                  : t("newSimulation.questions.baselineBadge")}
              </Badge>
            }
            description={t("newSimulation.questions.manualDescription")}
          >
            <IntakeFieldsForm
              answers={answers}
              currencySymbol={currencySymbolOf(currency)}
              onAnswerChange={(key, value) => setAnswer(key, value)}
              onUnknownChange={(key) => setAnswerUnknown(key)}
            />
          </SectionCard>

          <div className="flex flex-wrap justify-between gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4" />
              {t("common.back")}
            </Button>
            <Button onClick={() => void handleSubmitQuestions()} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("newSimulation.questions.saveAndContinue")}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 && draftInput ? (
        <div className="space-y-6">
          <SectionCard
            title={t("newSimulation.conditions.scenarioTitle")}
            badge={<DataSourceBadge source="assumption" />}
            description={t("newSimulation.conditions.scenarioDescription")}
          >
            <ScenarioControls
              adjustments={adjustments}
              onChange={(key, patch) =>
                setAdjustments((current) => ({
                  ...current,
                  [key]: { ...current[key], ...patch },
                }))
              }
              onReset={() => setAdjustments(resolveScenarioAdjustments(null))}
            />
          </SectionCard>

          <ProjectInputsTab
            input={draftInput}
            onChange={(next) => setDraftInput(next)}
          />

          <div className="flex flex-wrap justify-between gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4" />
              {t("common.back")}
            </Button>
            <Button onClick={() => void handleRun()} disabled={runSimulation.isPending}>
              {runSimulation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {t("newSimulation.conditions.run")}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 4 && result && run && projectId ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-5 py-4 shadow-panel">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-info" />
              <p className="text-sm font-medium text-foreground">
                {t("newSimulation.results.saved")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/report/${run.id}`} target="_blank" rel="noreferrer">
                  {t("report.open")}
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to={`/projects/${projectId}`}>{t("newSimulation.results.openProject")}</Link>
              </Button>
            </div>
          </div>

          <SimulationResultView
            result={result}
            input={draftInput ?? createStartingInput(currency, horizonMonths)}
            currency={currency}
            adjustments={adjustments}
            assumptions={assumptions}
            aiStatus={toAiStatus(run.ai_status)}
            aiError={run.ai_error}
            aiModel={run.ai_model}
            aiInsights={insights}
          />
        </div>
      ) : null}

      <p className="text-center text-[11px] text-muted-foreground">
        {t("newSimulation.footnote", { total: CORE_SLOT_KEYS.length })}
      </p>
    </div>
  );
};

export default NewSimulationPage;
