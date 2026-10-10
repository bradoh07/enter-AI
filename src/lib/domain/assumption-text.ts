import type { TFunction } from "i18next";

import type { AssumptionNote } from "@/lib/simulation/types";
import { intakeFieldLabel } from "@/lib/domain/intake-fields";

/**
 * Literal-key resolution for engine assumption notes.
 *
 * The engine stores i18n keys rather than display text, so the notes render in
 * the active language. Every branch is written out literally rather than built
 * from the note id, which keeps the keys discoverable by the i18n scanner.
 */
export const assumptionText = (t: TFunction, note: AssumptionNote): string => {
  switch (note.id) {
    case "engine.horizon":
      return t("assumptions.engine.horizon", note.params);
    case "engine.growth":
      return t("assumptions.engine.growth", note.params);
    case "engine.ramp":
      return t("assumptions.engine.ramp", note.params);
    case "engine.payrollFixed":
      return t("assumptions.engine.payrollFixed");
    case "engine.fixedCostScenario":
      return t("assumptions.engine.fixedCostScenario", note.params);
    case "engine.tax":
      return t("assumptions.engine.tax", note.params);
    case "engine.discount":
      return t("assumptions.engine.discount", note.params);
    case "engine.workingCapital":
      return t("assumptions.engine.workingCapital", note.params);
    case "engine.cashTiming":
      return t("assumptions.engine.cashTiming");
    case "engine.noInflation":
      return t("assumptions.engine.noInflation");
    case "engine.debt":
      return t("assumptions.engine.debt", note.params);
    case "engine.scenarioSpread":
      return t("assumptions.engine.scenarioSpread", note.params);
    case "engine.aiNotApplied":
      return t("assumptions.engine.aiNotApplied");
    default:
      break;
  }

  if (note.id.startsWith("unknown.")) {
    const field = String(note.params?.field ?? "");
    return t("assumptions.unknownField", { field: intakeFieldLabel(t, field) });
  }

  return note.labelKey;
};
