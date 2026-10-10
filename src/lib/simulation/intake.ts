import { createEmptyInput } from "./defaults";
import { clampInt, clampNumber, safeNumber } from "./math";
import type { FundingSource, SimulationInput } from "./types";

/** Sentinel stored when the user marks an intake question as "not decided yet". */
export const UNKNOWN = "__unknown__";

export const CORE_SLOT_KEYS = [
  "pricePerUnit",
  "monthlyUnits",
  "monthlyGrowthPct",
  "unitCost",
  "initialInvestmentTotal",
  "monthlyFixedCost",
  "headcount",
  "averageSalary",
  "marketingMonthly",
  "equityAmount",
  "debtAmount",
  "debtRatePct",
  "graceMonths",
  "taxRatePct",
  "discountRatePct",
  "overheadPct",
  "workingCapitalMonths",
  "horizonMonths",
] as const;

export type CoreSlotKey = (typeof CORE_SLOT_KEYS)[number];

/**
 * Answers keyed by slot. Core slot keys feed the engine directly; any other key
 * is extra context kept for the AI prompt and shown as additional information.
 */
export type IntakeAnswers = Record<
  string,
  string | number | string[] | number[] | null | undefined
>;

export const isUnknown = (answers: IntakeAnswers, key: string): boolean =>
  answers[key] === UNKNOWN;

const readNumber = (answers: IntakeAnswers, key: CoreSlotKey): number | null => {
  const raw = answers[key];
  if (raw === undefined || raw === null || raw === "" || raw === UNKNOWN) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

const upsertFunding = (
  funding: FundingSource[],
  source: FundingSource["source"],
  patch: Partial<FundingSource>,
): FundingSource[] => {
  const index = funding.findIndex((entry) => entry.source === source);
  if (index === -1) {
    return [
      ...funding,
      {
        source,
        amount: 0,
        rateAnnual: 0,
        graceMonths: 0,
        startMonth: 1,
        ...patch,
      },
    ];
  }
  const next = [...funding];
  next[index] = { ...next[index], ...patch };
  return next;
};

export type BuildInputResult = {
  input: SimulationInput;
  /** Core slots the user left undecided — surfaced as high-impact assumptions. */
  unknownFields: string[];
  answeredCount: number;
};

/**
 * Folds intake answers onto a base input. Only values the user actually
 * provided are applied; everything else keeps the base value, and slots marked
 * "not decided" are reported back so the UI can badge them as unknowns.
 */
export const buildSimulationInput = (
  answers: IntakeAnswers,
  base: SimulationInput = createEmptyInput(),
): BuildInputResult => {
  const input: SimulationInput = {
    ...base,
    initialInvestment: base.initialInvestment.map((item) => ({ ...item })),
    funding: base.funding.map((entry) => ({ ...entry })),
    revenueStreams: base.revenueStreams.map((stream) => ({ ...stream })),
    fixedCosts: base.fixedCosts.map((cost) => ({ ...cost })),
    payroll: base.payroll.map((item) => ({ ...item })),
  };

  if (input.revenueStreams.length === 0) {
    input.revenueStreams = [
      {
        name: "",
        unitPrice: 0,
        unitCost: 0,
        monthlyUnits: 0,
        monthlyGrowthPct: 0,
        startMonth: 1,
      },
    ];
  }

  const unknownFields: string[] = [];
  let answeredCount = 0;

  CORE_SLOT_KEYS.forEach((key) => {
    if (isUnknown(answers, key)) {
      unknownFields.push(key);
      return;
    }
    if (readNumber(answers, key) !== null) answeredCount += 1;
  });

  const primary = input.revenueStreams[0];

  const apply = (key: CoreSlotKey, setter: (value: number) => void) => {
    const value = readNumber(answers, key);
    if (value !== null) setter(value);
  };

  apply("pricePerUnit", (value) => {
    primary.unitPrice = clampNumber(value, 0, Number.MAX_SAFE_INTEGER);
  });
  apply("monthlyUnits", (value) => {
    primary.monthlyUnits = clampNumber(value, 0, Number.MAX_SAFE_INTEGER);
  });
  apply("monthlyGrowthPct", (value) => {
    primary.monthlyGrowthPct = clampNumber(value, -50, 100);
  });
  apply("unitCost", (value) => {
    primary.unitCost = clampNumber(value, 0, Number.MAX_SAFE_INTEGER);
  });
  apply("initialInvestmentTotal", (value) => {
    input.initialInvestment = [
      { item: "", amount: Math.max(0, value) },
    ];
  });
  apply("monthlyFixedCost", (value) => {
    input.fixedCosts = [{ item: "", monthlyAmount: Math.max(0, value) }];
  });
  apply("marketingMonthly", (value) => {
    input.marketingMonthly = Math.max(0, value);
  });
  apply("taxRatePct", (value) => {
    input.taxRatePct = clampNumber(value, 0, 80);
  });
  apply("discountRatePct", (value) => {
    input.discountRatePct = clampNumber(value, 0, 80);
  });
  apply("overheadPct", (value) => {
    input.overheadPct = clampNumber(value, 0, 50);
  });
  apply("workingCapitalMonths", (value) => {
    input.workingCapitalMonths = clampNumber(value, 0, 24);
  });
  apply("horizonMonths", (value) => {
    input.horizonMonths = clampInt(value, 1, 240);
  });

  const headcount = readNumber(answers, "headcount");
  const averageSalary = readNumber(answers, "averageSalary");
  if (headcount !== null || averageSalary !== null) {
    const existing = input.payroll[0];
    input.payroll = [
      {
        role: existing?.role ?? "",
        headcount:
          headcount !== null
            ? clampNumber(headcount, 0, 10000)
            : Math.max(0, safeNumber(existing?.headcount, 0)),
        monthlySalary:
          averageSalary !== null
            ? Math.max(0, averageSalary)
            : Math.max(0, safeNumber(existing?.monthlySalary, 0)),
        startMonth: existing?.startMonth ?? 1,
      },
    ];
  }

  apply("equityAmount", (value) => {
    input.funding = upsertFunding(input.funding, "equity", {
      amount: Math.max(0, value),
    });
  });
  apply("debtRatePct", (value) => {
    input.funding = upsertFunding(input.funding, "debt", {
      rateAnnual: clampNumber(value, 0, 60),
    });
  });
  apply("graceMonths", (value) => {
    input.funding = upsertFunding(input.funding, "debt", {
      graceMonths: clampInt(value, 0, 240),
    });
  });
  apply("debtAmount", (value) => {
    input.funding = upsertFunding(input.funding, "debt", { amount: Math.max(0, value) });
  });

  return { input, unknownFields, answeredCount };
};

export const countUnknownSlots = (answers: IntakeAnswers): number =>
  CORE_SLOT_KEYS.filter((key) => isUnknown(answers, key)).length;

export const countAnsweredSlots = (answers: IntakeAnswers): number =>
  CORE_SLOT_KEYS.filter((key) => {
    if (isUnknown(answers, key)) return false;
    const raw = answers[key];
    return raw !== undefined && raw !== null && raw !== "";
  }).length;
