import type { TFunction } from "i18next";

import type { CoreSlotKey } from "@/lib/simulation/intake";

export type IntakeFieldType = "currency" | "number" | "percent";
export type IntakeFieldGroup = "revenue" | "cost" | "capital" | "policy";

export type IntakeField = {
  key: CoreSlotKey;
  type: IntakeFieldType;
  group: IntakeFieldGroup;
  min?: number;
  max?: number;
  step?: number;
};

/**
 * The canonical intake questions. They are what the wizard falls back to when
 * AI question generation is unavailable, and they also back the structured
 * editor on a saved project — both paths write the same answer slots.
 */
export const INTAKE_FIELDS: IntakeField[] = [
  { key: "pricePerUnit", type: "currency", group: "revenue", min: 0 },
  { key: "monthlyUnits", type: "number", group: "revenue", min: 0, step: 1 },
  { key: "monthlyGrowthPct", type: "percent", group: "revenue", min: -50, max: 100, step: 0.5 },
  { key: "unitCost", type: "currency", group: "cost", min: 0 },
  { key: "monthlyFixedCost", type: "currency", group: "cost", min: 0 },
  { key: "headcount", type: "number", group: "cost", min: 0, step: 1 },
  { key: "averageSalary", type: "currency", group: "cost", min: 0 },
  { key: "marketingMonthly", type: "currency", group: "cost", min: 0 },
  { key: "overheadPct", type: "percent", group: "cost", min: 0, max: 50, step: 0.5 },
  { key: "initialInvestmentTotal", type: "currency", group: "capital", min: 0 },
  { key: "equityAmount", type: "currency", group: "capital", min: 0 },
  { key: "debtAmount", type: "currency", group: "capital", min: 0 },
  { key: "debtRatePct", type: "percent", group: "capital", min: 0, max: 60, step: 0.1 },
  { key: "graceMonths", type: "number", group: "capital", min: 0, max: 240, step: 1 },
  { key: "horizonMonths", type: "number", group: "policy", min: 1, max: 240, step: 1 },
  { key: "taxRatePct", type: "percent", group: "policy", min: 0, max: 80, step: 0.5 },
  { key: "discountRatePct", type: "percent", group: "policy", min: 0, max: 80, step: 0.5 },
  { key: "workingCapitalMonths", type: "number", group: "policy", min: 0, max: 24, step: 1 },
];

/** Literal-key label lookup so the string scanner can see every key. */
export const intakeFieldLabel = (t: TFunction, key: string): string => {
  switch (key) {
    case "pricePerUnit":
      return t("intake.slot.pricePerUnit");
    case "monthlyUnits":
      return t("intake.slot.monthlyUnits");
    case "monthlyGrowthPct":
      return t("intake.slot.monthlyGrowthPct");
    case "unitCost":
      return t("intake.slot.unitCost");
    case "monthlyFixedCost":
      return t("intake.slot.monthlyFixedCost");
    case "headcount":
      return t("intake.slot.headcount");
    case "averageSalary":
      return t("intake.slot.averageSalary");
    case "marketingMonthly":
      return t("intake.slot.marketingMonthly");
    case "overheadPct":
      return t("intake.slot.overheadPct");
    case "initialInvestmentTotal":
      return t("intake.slot.initialInvestmentTotal");
    case "equityAmount":
      return t("intake.slot.equityAmount");
    case "debtAmount":
      return t("intake.slot.debtAmount");
    case "debtRatePct":
      return t("intake.slot.debtRatePct");
    case "graceMonths":
      return t("intake.slot.graceMonths");
    case "horizonMonths":
      return t("intake.slot.horizonMonths");
    case "taxRatePct":
      return t("intake.slot.taxRatePct");
    case "discountRatePct":
      return t("intake.slot.discountRatePct");
    case "workingCapitalMonths":
      return t("intake.slot.workingCapitalMonths");
    default:
      return key;
  }
};

/** Literal-key help lookup for the intake fields. */
export const intakeFieldHelp = (t: TFunction, key: string): string => {
  switch (key) {
    case "pricePerUnit":
      return t("intake.help.pricePerUnit");
    case "monthlyUnits":
      return t("intake.help.monthlyUnits");
    case "monthlyGrowthPct":
      return t("intake.help.monthlyGrowthPct");
    case "unitCost":
      return t("intake.help.unitCost");
    case "monthlyFixedCost":
      return t("intake.help.monthlyFixedCost");
    case "headcount":
      return t("intake.help.headcount");
    case "averageSalary":
      return t("intake.help.averageSalary");
    case "marketingMonthly":
      return t("intake.help.marketingMonthly");
    case "overheadPct":
      return t("intake.help.overheadPct");
    case "initialInvestmentTotal":
      return t("intake.help.initialInvestmentTotal");
    case "equityAmount":
      return t("intake.help.equityAmount");
    case "debtAmount":
      return t("intake.help.debtAmount");
    case "debtRatePct":
      return t("intake.help.debtRatePct");
    case "graceMonths":
      return t("intake.help.graceMonths");
    case "horizonMonths":
      return t("intake.help.horizonMonths");
    case "taxRatePct":
      return t("intake.help.taxRatePct");
    case "discountRatePct":
      return t("intake.help.discountRatePct");
    case "workingCapitalMonths":
      return t("intake.help.workingCapitalMonths");
    default:
      return "";
  }
};

/** Literal-key group heading lookup for the intake form sections. */
export const intakeGroupLabel = (t: TFunction, group: IntakeFieldGroup): string => {
  switch (group) {
    case "revenue":
      return t("intake.group.revenue");
    case "cost":
      return t("intake.group.cost");
    case "capital":
      return t("intake.group.capital");
    case "policy":
      return t("intake.group.policy");
    default:
      return group;
  }
};

export const INTAKE_GROUP_ORDER: IntakeFieldGroup[] = [
  "revenue",
  "cost",
  "capital",
  "policy",
];
