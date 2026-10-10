import type { TFunction } from "i18next";

/**
 * Selectable business domains, scales and stages.
 *
 * Only stable value tokens are stored, and labels resolve through the literal
 * `t()` lookups below. That keeps every stored project readable in any
 * interface language, while free-form values the user types are passed through
 * untouched — which is what keeps the platform open to new industries.
 */
export const BUSINESS_MODEL_VALUES = [
  "selfEmployed",
  "manufacturing",
  "construction",
  "realEstate",
  "it",
  "aiService",
  "distribution",
  "b2b",
  "energy",
  "other",
] as const;

export const SCALE_VALUES = ["solo", "micro", "small", "medium", "large"] as const;

export const STAGE_VALUES = [
  "idea",
  "preparation",
  "launch",
  "growth",
  "expansion",
] as const;

export const PROJECT_STAGE_VALUES = [
  "planning",
  "pilot",
  "launching",
  "scaling",
] as const;

export const FOUNDING_EXPERIENCE_VALUES = [
  "none",
  "indirect",
  "once",
  "multiple",
] as const;

export const CURRENCY_VALUES = ["KRW", "USD"] as const;

export const HORIZON_VALUES = [12, 24, 36, 60] as const;

/** Falls back to the stored value so user-typed domains stay readable. */
export const businessModelLabel = (t: TFunction, value: string): string => {
  switch (value) {
    case "selfEmployed":
      return t("businessModel.selfEmployed");
    case "manufacturing":
      return t("businessModel.manufacturing");
    case "construction":
      return t("businessModel.construction");
    case "realEstate":
      return t("businessModel.realEstate");
    case "it":
      return t("businessModel.it");
    case "aiService":
      return t("businessModel.aiService");
    case "distribution":
      return t("businessModel.distribution");
    case "b2b":
      return t("businessModel.b2b");
    case "energy":
      return t("businessModel.energy");
    case "other":
      return t("businessModel.other");
    default:
      return value;
  }
};

export const scaleLabel = (t: TFunction, value: string): string => {
  switch (value) {
    case "solo":
      return t("scale.solo");
    case "micro":
      return t("scale.micro");
    case "small":
      return t("scale.small");
    case "medium":
      return t("scale.medium");
    case "large":
      return t("scale.large");
    default:
      return value;
  }
};

export const stageLabel = (t: TFunction, value: string): string => {
  switch (value) {
    case "idea":
      return t("stage.idea");
    case "preparation":
      return t("stage.preparation");
    case "launch":
      return t("stage.launch");
    case "growth":
      return t("stage.growth");
    case "expansion":
      return t("stage.expansion");
    default:
      return value;
  }
};

export const projectStageLabel = (t: TFunction, value: string): string => {
  switch (value) {
    case "planning":
      return t("projectStage.planning");
    case "pilot":
      return t("projectStage.pilot");
    case "launching":
      return t("projectStage.launching");
    case "scaling":
      return t("projectStage.scaling");
    default:
      return value;
  }
};

export const foundingExperienceLabel = (t: TFunction, value: string): string => {
  switch (value) {
    case "none":
      return t("foundingExperience.none");
    case "indirect":
      return t("foundingExperience.indirect");
    case "once":
      return t("foundingExperience.once");
    case "multiple":
      return t("foundingExperience.multiple");
    default:
      return value;
  }
};

export const currencyLabel = (t: TFunction, value: string): string => {
  switch (value) {
    case "KRW":
      return t("currency.krw");
    case "USD":
      return t("currency.usd");
    default:
      return value;
  }
};

export const fundingSourceLabel = (t: TFunction, value: string): string => {
  switch (value) {
    case "equity":
      return t("funding.equity");
    case "debt":
      return t("funding.debt");
    case "grant":
      return t("funding.grant");
    case "self":
      return t("funding.self");
    default:
      return value;
  }
};

export const userTypeLabel = (t: TFunction, value: string): string => {
  switch (value) {
    case "business":
      return t("userType.business");
    case "individual":
      return t("userType.individual");
    default:
      return value;
  }
};

export type ScenarioKeyValue = "optimistic" | "base" | "pessimistic";

export const scenarioLabel = (t: TFunction, value: ScenarioKeyValue): string => {
  switch (value) {
    case "optimistic":
      return t("scenario.optimistic");
    case "base":
      return t("scenario.base");
    case "pessimistic":
      return t("scenario.pessimistic");
    default:
      return value;
  }
};

export const aiLevelLabel = (t: TFunction, value: string): string => {
  switch (value) {
    case "high":
      return t("aiLevel.high");
    case "medium":
      return t("aiLevel.medium");
    case "low":
      return t("aiLevel.low");
    default:
      return value;
  }
};

export const aiStatusLabel = (t: TFunction, value: string): string => {
  switch (value) {
    case "not_requested":
      return t("aiStatus.notRequested");
    case "ok":
      return t("aiStatus.ok");
    case "unavailable":
      return t("aiStatus.unavailable");
    case "error":
      return t("aiStatus.error");
    default:
      return value;
  }
};

export const dataSourceLabel = (t: TFunction, value: string): string => {
  switch (value) {
    case "engine":
      return t("source.computed");
    case "user":
      return t("source.userInput");
    case "ai":
      return t("source.ai");
    default:
      return value;
  }
};

export const assumptionImpactLabel = (t: TFunction, value: string): string => {
  switch (value) {
    case "high":
      return t("assumptionImpact.high");
    case "medium":
      return t("assumptionImpact.medium");
    case "low":
      return t("assumptionImpact.low");
    default:
      return value;
  }
};
