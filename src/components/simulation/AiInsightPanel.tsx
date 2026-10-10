import { AlertCircle, Loader2, RefreshCw, Sparkles, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { RiskList } from "./RiskList";
import { ImprovementList } from "./ImprovementList";
import { DataSourceBadge } from "@/components/common/DataSourceBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { aiLevelLabel } from "@/lib/domain/options";
import type { AiInsights } from "@/lib/ai/types";
import type { AiRunStatus } from "@/lib/api/types";

/**
 * Renders the AI layer of a simulation run.
 *
 * The distinction the whole app depends on lives here: computed numbers are
 * never mixed into this panel, and when the AI is off or failed the panel says
 * exactly that. Nothing is filled in to look like an analysis happened.
 */
export const AiInsightPanel = ({
  status,
  error,
  model,
  insights,
  onRetry,
  isRetrying = false,
  onGenerate,
  isGenerating = false,
}: {
  status: AiRunStatus;
  error?: string | null;
  model?: string | null;
  insights: AiInsights | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  onGenerate?: () => void;
  isGenerating?: boolean;
}) => {
  const { t } = useTranslation();

  if (status === "not_requested" || (status === "ok" && !insights)) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-border p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-info" />
          <p className="text-sm font-medium text-foreground">{t("ai.notRun.title")}</p>
        </div>
        <p className="max-w-2xl text-xs text-muted-foreground">{t("ai.notRun.description")}</p>
        {onGenerate ? (
          <Button type="button" size="sm" onClick={onGenerate} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {t("ai.notRun.action")}
          </Button>
        ) : null}
      </div>
    );
  }

  if (status === "unavailable" || status === "error") {
    const isUnavailable = status === "unavailable";
    return (
      <div
        className={
          isUnavailable
            ? "flex flex-col items-start gap-3 rounded-md border border-warning/40 bg-warning/5 p-5"
            : "flex flex-col items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-5"
        }
      >
        <div className="flex items-center gap-2">
          {isUnavailable ? (
            <WifiOff className="h-4 w-4 text-warning" />
          ) : (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          <p className="text-sm font-medium text-foreground">
            {isUnavailable ? t("ai.unavailable.title") : t("ai.error.title")}
          </p>
          <Badge variant={isUnavailable ? "warning" : "destructive"}>
            {isUnavailable ? t("aiStatus.unavailable") : t("aiStatus.error")}
          </Badge>
        </div>
        <p className="max-w-2xl text-xs text-muted-foreground">
          {isUnavailable ? t("ai.unavailable.description") : t("ai.error.description")}
        </p>
        {error ? (
          <p className="rounded-md bg-background/70 px-3 py-2 text-[11px] text-muted-foreground">
            {error}
          </p>
        ) : null}
        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {t("ai.retry")}
          </Button>
        ) : null}
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <DataSourceBadge source="ai" />
        <span className="text-xs text-muted-foreground">{t("ai.scopeNotice")}</span>
        {model ? (
          <span className="text-[11px] text-muted-foreground">
            {t("ai.modelLabel", { model })}
          </span>
        ) : null}
      </div>

      <div className="rounded-md border border-border p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("ai.feasibility.title")}
            </p>
            <p className="text-lg font-semibold text-foreground">
              {insights.feasibility.verdict || t("ai.feasibility.noVerdict")}
            </p>
          </div>
          <div className="w-full space-y-2 sm:w-56">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">{t("ai.feasibility.score")}</span>
              <span className="tabular text-xl font-semibold text-foreground">
                {insights.feasibility.score}
                <span className="text-xs text-muted-foreground">/100</span>
              </span>
            </div>
            <Progress value={insights.feasibility.score} />
          </div>
        </div>
        {insights.feasibility.summary ? (
          <p className="mt-4 text-sm text-muted-foreground">{insights.feasibility.summary}</p>
        ) : null}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">{t("ai.risks.title")}</h3>
        <RiskList risks={insights.risks} />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">{t("ai.improvements.title")}</h3>
        <ImprovementList improvements={insights.improvements} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{t("ai.assumptions.title")}</h3>
          {insights.assumptions.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
              {t("ai.empty.assumptions")}
            </p>
          ) : (
            <ul className="space-y-2">
              {insights.assumptions.map((assumption, index) => (
                <li
                  key={index}
                  className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2"
                >
                  <p className="text-sm text-foreground">{assumption.statement}</p>
                  <Badge
                    variant={assumption.impactIfWrong === "high" ? "destructive" : "estimation"}
                  >
                    {aiLevelLabel(t, assumption.impactIfWrong)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{t("ai.uncertainties.title")}</h3>
          {insights.uncertainties.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
              {t("ai.empty.uncertainties")}
            </p>
          ) : (
            <ul className="space-y-2">
              {insights.uncertainties.map((item, index) => (
                <li key={index} className="rounded-md border border-border px-3 py-2">
                  <p className="text-sm text-muted-foreground">{item}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
