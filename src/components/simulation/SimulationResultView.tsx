import { AiInsightPanel } from "./AiInsightPanel";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { BreakEvenChart } from "./BreakEvenChart";
import { CashFlowChart } from "./CashFlowChart";
import { KpiGrid } from "./KpiGrid";
import { ProfitChart } from "./ProfitChart";
import { ScenarioComparisonChart } from "./ScenarioComparisonChart";
import { ScenarioSummaryTable } from "./ScenarioSummaryTable";
import { SensitivityTable } from "./SensitivityTable";
import { SectionCard } from "@/components/common/PageHeader";
import { DataSourceBadge } from "@/components/common/DataSourceBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import type { AiInsights } from "@/lib/ai/types";
import type { AiRunStatus } from "@/lib/api/types";
import type {
  AssumptionNote,
  CurrencyCode,
  ScenarioAdjustment,
  ScenarioKey,
  SimulationInput,
  SimulationResult,
} from "@/lib/simulation/types";

/**
 * Full rendering of one simulation run: engine output first, AI interpretation
 * last and visually separated. Shared by the run page and the printable report.
 */
export const SimulationResultView = ({
  result,
  input,
  currency,
  adjustments,
  assumptions,
  aiStatus,
  aiError,
  aiModel,
  aiInsights,
  onRetryAi,
  isRetryingAi = false,
  defaultTab = "overview",
  className,
}: {
  result: SimulationResult;
  input: SimulationInput;
  currency: CurrencyCode;
  adjustments: Record<ScenarioKey, ScenarioAdjustment>;
  assumptions: AssumptionNote[];
  aiStatus: AiRunStatus;
  aiError?: string | null;
  aiModel?: string | null;
  aiInsights: AiInsights | null;
  onRetryAi?: () => void;
  isRetryingAi?: boolean;
  defaultTab?: string;
  className?: string;
}) => {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue={defaultTab} className={className}>
      <TabsList className="print-hidden flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 p-1">
        <TabsTrigger value="overview">{t("simulation.tab.overview")}</TabsTrigger>
        <TabsTrigger value="scenarios">{t("simulation.tab.scenarios")}</TabsTrigger>
        <TabsTrigger value="profit">{t("simulation.tab.profit")}</TabsTrigger>
        <TabsTrigger value="sensitivity">{t("simulation.tab.sensitivity")}</TabsTrigger>
        <TabsTrigger value="ai">{t("simulation.tab.ai")}</TabsTrigger>
        <TabsTrigger value="assumptions">{t("simulation.tab.assumptions")}</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6 space-y-6">
        <KpiGrid kpis={result.scenarios.base.kpis} currency={currency} scenarioKey="base" />

        <SectionCard
          title={t("simulation.chart.cashFlow")}
          badge={<DataSourceBadge source="computed" />}
          description={t("simulation.chart.cashFlowDescription")}
        >
          <CashFlowChart result={result} currency={currency} className="h-[320px] w-full" />
        </SectionCard>

        <SectionCard
          title={t("simulation.tab.scenarios")}
          badge={<DataSourceBadge source="computed" />}
          description={t("simulation.chart.scenarioDescription")}
        >
          <ScenarioSummaryTable result={result} currency={currency} />
        </SectionCard>
      </TabsContent>

      <TabsContent value="scenarios" className="mt-6 space-y-6">
        <SectionCard
          title={t("simulation.chart.scenarioComparison")}
          badge={<DataSourceBadge source="computed" />}
          description={t("simulation.chart.scenarioDescription")}
        >
          <ScenarioComparisonChart
            result={result}
            currency={currency}
            className="h-[320px] w-full"
          />
        </SectionCard>

        <SectionCard title={t("simulation.tab.scenarios")} badge={<DataSourceBadge source="computed" />}>
          <ScenarioSummaryTable result={result} currency={currency} />
        </SectionCard>
      </TabsContent>

      <TabsContent value="profit" className="mt-6 space-y-6">
        <SectionCard
          title={t("simulation.chart.profit")}
          badge={<DataSourceBadge source="computed" />}
          description={t("simulation.chart.profitDescription")}
        >
          <ProfitChart
            result={result}
            currency={currency}
            scenarioKey="base"
            className="h-[320px] w-full"
          />
        </SectionCard>

        <SectionCard
          title={t("simulation.chart.breakeven")}
          badge={<DataSourceBadge source="computed" />}
          description={t("simulation.chart.breakevenDescription")}
        >
          <BreakEvenChart result={result} currency={currency} className="h-[320px] w-full" />
        </SectionCard>
      </TabsContent>

      <TabsContent value="sensitivity" className="mt-6">
        <SectionCard
          title={t("simulation.tab.sensitivity")}
          badge={<DataSourceBadge source="computed" />}
        >
          <SensitivityTable
            input={input}
            adjustments={adjustments}
            currency={currency}
            scenarioKey="base"
          />
        </SectionCard>
      </TabsContent>

      <TabsContent value="ai" className="mt-6">
        <SectionCard title={t("simulation.tab.ai")}>
          <AiInsightPanel
            status={aiStatus}
            error={aiError}
            model={aiModel}
            insights={aiInsights}
            onRetry={onRetryAi}
            isRetrying={isRetryingAi}
          />
        </SectionCard>
      </TabsContent>

      <TabsContent value="assumptions" className="mt-6">
        <SectionCard
          title={t("simulation.tab.assumptions")}
          description={t("assumptions.description")}
        >
          <AssumptionsPanel notes={assumptions} />
        </SectionCard>
      </TabsContent>
    </Tabs>
  );
};
