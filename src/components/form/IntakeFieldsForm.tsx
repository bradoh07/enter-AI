import { useTranslation } from "react-i18next";

import { IntakeFieldInput } from "./IntakeFieldInput";
import { Progress } from "@/components/ui/progress";
import {
  INTAKE_FIELDS,
  INTAKE_GROUP_ORDER,
  intakeGroupLabel,
} from "@/lib/domain/intake-fields";
import {
  CORE_SLOT_KEYS,
  countAnsweredSlots,
  countUnknownSlots,
  isUnknown,
  type IntakeAnswers,
  type CoreSlotKey,
} from "@/lib/simulation/intake";

/**
 * The canonical intake form. It is the fallback the wizard shows when AI
 * question generation is unavailable, and it stays available as a direct-entry
 * path so a user is never blocked by the AI step.
 */
export const IntakeFieldsForm = ({
  answers,
  currencySymbol,
  onAnswerChange,
  onUnknownChange,
  disabled = false,
}: {
  answers: IntakeAnswers;
  currencySymbol: string;
  onAnswerChange: (key: CoreSlotKey, value: string) => void;
  onUnknownChange: (key: CoreSlotKey, unknown: boolean) => void;
  disabled?: boolean;
}) => {
  const { t } = useTranslation();

  const answered = countAnsweredSlots(answers);
  const unknownCount = countUnknownSlots(answers);
  const percent = Math.round((answered / CORE_SLOT_KEYS.length) * 100);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {t("intake.progress", {
              answered,
              total: CORE_SLOT_KEYS.length,
            })}
          </span>
          <span>{t("intake.unknownCount", { count: unknownCount })}</span>
        </div>
        <Progress value={percent} />
      </div>

      {INTAKE_GROUP_ORDER.map((group) => {
        const fields = INTAKE_FIELDS.filter((field) => field.group === group);
        if (fields.length === 0) return null;

        return (
          <fieldset key={group} className="space-y-4" disabled={disabled}>
            <legend className="text-xs font-semibold uppercase tracking-wide text-primary">
              {intakeGroupLabel(t, group)}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fields.map((field) => (
                <IntakeFieldInput
                  key={field.key}
                  field={field}
                  currencySymbol={currencySymbol}
                  value={answers[field.key] === undefined ? "" : String(answers[field.key])}
                  unknown={isUnknown(answers, field.key)}
                  onValueChange={(next) => onAnswerChange(field.key, next)}
                  onUnknownChange={(next) => onUnknownChange(field.key, next)}
                />
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
};
