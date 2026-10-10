import { DEFAULT_SCENARIO_ADJUSTMENTS } from "@/lib/simulation/defaults";
import { totalInvestmentOf } from "@/lib/simulation/engine";
import type {
  Project,
  Profile,
  ProjectQuestion,
} from "@/lib/api/types";
import type {
  ScenarioAdjustment,
  ScenarioKey,
  SimulationInput,
  SimulationResult,
} from "@/lib/simulation/types";
import { SCENARIO_KEYS } from "@/lib/simulation/types";

/**
 * Payloads handed to the backend functions.
 *
 * The insights payload sends finished engine output as facts. It deliberately
 * contains no display strings: the model is asked to answer in the user's
 * language, so no pre-translated text has to travel through the backend.
 */

export const buildScopingPayload = (
  project: Pick<Project, "name" | "idea" | "sectors" | "scale" | "stage" | "currency">,
  profile: Pick<Profile, "user_type" | "business_models" | "company_size" | "business_stage"> | null,
  customQuestions: ProjectQuestion[] = [],
) => ({
  project: {
    name: project.name,
    idea: project.idea,
    sectors: project.sectors,
    scale: project.scale,
    stage: project.stage,
    currency: project.currency,
  },
  applicant: profile
    ? {
        userType: profile.user_type,
        businessModels: profile.business_models,
        companySize: profile.company_size,
        businessStage: profile.business_stage,
      }
    : null,
  alreadyAsked: customQuestions.map((question) => question.question_key),
});

export const buildInsightsPayload = (args: {
  project: Pick<Project, "name" | "idea" | "sectors" | "scale" | "stage" | "currency">;
  profile: Pick<Profile, "user_type" | "business_models" | "company_size" | "business_stage"> | null;
  input: SimulationInput;
  result: SimulationResult;
  adjustments: Record<ScenarioKey, ScenarioAdjustment>;
  unknownFields: string[];
}) => {
  const { project, profile, input, result, adjustments, unknownFields } = args;

  const scenarioSummary = SCENARIO_KEYS.reduce(
    (accumulator, key) => {
      const { kpis } = result.scenarios[key];
      accumulator[key] = {
        adjustment: adjustments[key] ?? DEFAULT_SCENARIO_ADJUSTMENTS[key],
        totalInvestment: kpis.totalInvestment,
        peakFundingRequirement: kpis.peakFundingRequirement,
        firstProfitableMonth: kpis.firstProfitableMonth,
        paybackMonths: kpis.paybackMonths,
        breakevenMonthlyRevenue: kpis.breakevenMonthlyRevenue,
        cashExhaustedMonth: kpis.cashExhaustedMonth,
        yearOneRevenue: kpis.yearOneRevenue,
        horizonRevenue: kpis.horizonRevenue,
        horizonOperatingProfit: kpis.horizonOperatingProfit,
        horizonNetProfit: kpis.horizonNetProfit,
        operatingMarginPct: kpis.operatingMarginPct,
        roiPct: kpis.roiPct,
        npv: kpis.npv,
        irrAnnualPct: kpis.irrAnnualPct,
      };
      return accumulator;
    },
    {} as Record<ScenarioKey, unknown>,
  );

  return {
    project: {
      name: project.name,
      idea: project.idea,
      sectors: project.sectors,
      scale: project.scale,
      stage: project.stage,
      currency: project.currency,
    },
    applicant: profile
      ? {
          userType: profile.user_type,
          businessModels: profile.business_models,
          companySize: profile.company_size,
          businessStage: profile.business_stage,
        }
      : null,
    input: {
      horizonMonths: input.horizonMonths,
      initialInvestmentTotal: totalInvestmentOf(input),
      initialInvestmentItems: input.initialInvestment,
      funding: input.funding,
      revenueStreams: input.revenueStreams,
      fixedCostsMonthlyTotal: input.fixedCosts.reduce(
        (total, cost) => total + cost.monthlyAmount,
        0,
      ),
      payroll: input.payroll,
      marketingMonthly: input.marketingMonthly,
      overheadPct: input.overheadPct,
    },
    engineConventions: {
      revenueGrowthAppliedMonthly: true,
      payrollHeldConstantAcrossScenarios: true,
      fixedCostsBentByScenario: true,
      cashCollectedInMonthOfSale: true,
      workingCapitalMonths: input.workingCapitalMonths,
      taxRatePct: input.taxRatePct,
      discountRatePct: input.discountRatePct,
      breakEvenRevenueBasis: "final month contribution margin",
    },
    /** Slot keys the user marked as not decided — the model must not assume them. */
    undecidedFields: unknownFields,
    computedResults: {
      engineVersion: result.engineVersion,
      horizonMonths: result.horizonMonths,
      currency: result.currency,
      scenarios: scenarioSummary,
      yearlyBaseScenario: result.scenarios.base.yearly,
    },
  };
};
