import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { LineItemsEditor, type LineFieldSpec } from "@/components/form/LineItemsEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/common/PageHeader";
import { fundingSourceLabel } from "@/lib/domain/options";
import { intakeFieldHelp } from "@/lib/domain/intake-fields";
import type { FundingSourceType, SimulationInput } from "@/lib/simulation/types";

type ListKey =
  | "initialInvestment"
  | "funding"
  | "revenueStreams"
  | "fixedCosts"
  | "payroll";

const blankRow = (listKey: ListKey): Record<string, unknown> => {
  switch (listKey) {
    case "initialInvestment":
      return { item: "", amount: 0 };
    case "funding":
      return { source: "equity", amount: 0, rateAnnual: 0, graceMonths: 0, startMonth: 1 };
    case "revenueStreams":
      return {
        name: "",
        unitPrice: 0,
        unitCost: 0,
        monthlyUnits: 0,
        monthlyGrowthPct: 0,
        startMonth: 1,
      };
    case "fixedCosts":
      return { item: "", monthlyAmount: 0 };
    case "payroll":
      return { role: "", headcount: 1, monthlySalary: 0, startMonth: 1 };
    default:
      return {};
  }
};

const scalarLabel = (t: TFunction, key: string): string => {
  switch (key) {
    case "horizonMonths":
      return t("intake.slot.horizonMonths");
    case "taxRatePct":
      return t("intake.slot.taxRatePct");
    case "discountRatePct":
      return t("intake.slot.discountRatePct");
    case "workingCapitalMonths":
      return t("intake.slot.workingCapitalMonths");
    case "overheadPct":
      return t("intake.slot.overheadPct");
    case "marketingMonthly":
      return t("intake.slot.marketingMonthly");
    default:
      return key;
  }
};

const SCALARS: Array<{ key: keyof SimulationInput; min: number; max?: number; step: number }> = [
  { key: "horizonMonths", min: 1, max: 240, step: 1 },
  { key: "taxRatePct", min: 0, max: 80, step: 0.5 },
  { key: "discountRatePct", min: 0, max: 80, step: 0.5 },
  { key: "workingCapitalMonths", min: 0, max: 24, step: 1 },
  { key: "overheadPct", min: 0, max: 50, step: 0.5 },
  { key: "marketingMonthly", min: 0, step: 1 },
];

/**
 * Structured editor for everything the engine consumes. Line items are edited
 * in place, so a project stays a real model rather than a single set of numbers.
 */
export const ProjectInputsTab = ({
  input,
  disabled = false,
  onChange,
}: {
  input: SimulationInput;
  disabled?: boolean;
  onChange: (next: SimulationInput) => void;
}) => {
  const { t } = useTranslation();

  const patchList = (listKey: ListKey, rows: Array<Record<string, unknown>>) => {
    onChange({ ...input, [listKey]: rows } as SimulationInput);
  };

  const rowsOf = (listKey: ListKey) =>
    (input[listKey] as unknown as Array<Record<string, unknown>>) ?? [];

  const lineEditor = (
    listKey: ListKey,
    fields: LineFieldSpec[],
    addLabel: string,
    sectionTitle: string,
    description: string,
  ) => (
    <SectionCard title={sectionTitle} description={description}>
      <LineItemsEditor
        items={rowsOf(listKey)}
        fields={fields}
        disabled={disabled}
        addLabel={addLabel}
        removeLabel={t("common.remove")}
        emptyLabel={t("projects.inputs.emptyList")}
        onAdd={() => patchList(listKey, [...rowsOf(listKey), blankRow(listKey)])}
        onRemove={(index) =>
          patchList(listKey, rowsOf(listKey).filter((_, position) => position !== index))
        }
        onChange={(index, key, value) =>
          patchList(
            listKey,
            rowsOf(listKey).map((row, position) =>
              position === index ? { ...row, [key]: value } : row,
            ),
          )
        }
      />
    </SectionCard>
  );

  const fundingOptions = (
    ["equity", "debt", "grant", "self"] as FundingSourceType[]
  ).map((value) => ({ value, label: fundingSourceLabel(t, value) }));

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("projects.inputs.policyTitle")}
        description={t("projects.inputs.policyDescription")}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCALARS.map((scalar) => (
            <div key={String(scalar.key)} className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                {scalarLabel(t, String(scalar.key))}
              </Label>
              <Input
                className="tabular"
                type="number"
                inputMode="decimal"
                disabled={disabled}
                min={scalar.min}
                max={scalar.max}
                step={scalar.step}
                value={String(input[scalar.key] ?? 0)}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  onChange({
                    ...input,
                    [scalar.key]: Number.isFinite(next) ? next : 0,
                  } as SimulationInput);
                }}
              />
              <p className="text-[11px] leading-snug text-muted-foreground">
                {intakeFieldHelp(t, String(scalar.key))}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      {lineEditor(
        "revenueStreams",
        [
          { key: "name", label: t("projects.inputs.streamName"), type: "text", span: "lg:col-span-2", placeholder: t("projects.inputs.streamNamePlaceholder") },
          { key: "unitPrice", label: t("intake.slot.pricePerUnit"), type: "currency" },
          { key: "unitCost", label: t("intake.slot.unitCost"), type: "currency" },
          { key: "monthlyUnits", label: t("intake.slot.monthlyUnits"), type: "number" },
          {
            key: "monthlyGrowthPct",
            label: t("intake.slot.monthlyGrowthPct"),
            type: "percent",
            step: 0.5,
          },
          { key: "startMonth", label: t("projects.inputs.startMonth"), type: "number", min: 1 },
        ],
        t("projects.inputs.addStream"),
        t("projects.inputs.streamsTitle"),
        t("projects.inputs.streamsDescription"),
      )}

      {lineEditor(
        "fixedCosts",
        [
          { key: "item", label: t("projects.inputs.costName"), type: "text", span: "lg:col-span-3", placeholder: t("projects.inputs.costNamePlaceholder") },
          { key: "monthlyAmount", label: t("projects.inputs.monthlyAmount"), type: "currency", span: "lg:col-span-3" },
        ],
        t("projects.inputs.addFixedCost"),
        t("projects.inputs.fixedCostsTitle"),
        t("projects.inputs.fixedCostsDescription"),
      )}

      {lineEditor(
        "payroll",
        [
          { key: "role", label: t("projects.inputs.role"), type: "text", span: "lg:col-span-2", placeholder: t("projects.inputs.rolePlaceholder") },
          { key: "headcount", label: t("intake.slot.headcount"), type: "number", min: 0 },
          { key: "monthlySalary", label: t("intake.slot.averageSalary"), type: "currency" },
          { key: "startMonth", label: t("projects.inputs.startMonth"), type: "number", min: 1 },
        ],
        t("projects.inputs.addPayroll"),
        t("projects.inputs.payrollTitle"),
        t("projects.inputs.payrollDescription"),
      )}

      {lineEditor(
        "initialInvestment",
        [
          { key: "item", label: t("projects.inputs.investmentName"), type: "text", span: "lg:col-span-3", placeholder: t("projects.inputs.investmentNamePlaceholder") },
          { key: "amount", label: t("projects.inputs.investmentAmount"), type: "currency", span: "lg:col-span-3" },
        ],
        t("projects.inputs.addInvestment"),
        t("projects.inputs.investmentTitle"),
        t("projects.inputs.investmentDescription"),
      )}

      {lineEditor(
        "funding",
        [
          {
            key: "source",
            label: t("projects.inputs.fundingSource"),
            type: "select",
            options: fundingOptions,
            span: "lg:col-span-2",
          },
          { key: "amount", label: t("projects.inputs.fundingAmount"), type: "currency" },
          { key: "rateAnnual", label: t("projects.inputs.fundingRate"), type: "percent", step: 0.1 },
          { key: "graceMonths", label: t("projects.inputs.fundingGrace"), type: "number", min: 0 },
          { key: "startMonth", label: t("projects.inputs.startMonth"), type: "number", min: 1 },
        ],
        t("projects.inputs.addFunding"),
        t("projects.inputs.fundingTitle"),
        t("projects.inputs.fundingDescription"),
      )}
    </div>
  );
};
