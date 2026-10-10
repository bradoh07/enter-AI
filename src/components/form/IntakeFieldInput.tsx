import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { intakeFieldHelp, intakeFieldLabel, type IntakeField } from "@/lib/domain/intake-fields";
import { cn } from "@/lib/utils";

/** Small adornment showing which unit the field expects. */
const unitHint = (field: IntakeField, currencySymbol: string): string => {
  if (field.type === "currency") return currencySymbol;
  if (field.type === "percent") return "%";
  return "";
};

/**
 * One intake answer. Every field can be explicitly marked "not decided yet",
 * which the engine records as a high-impact unknown instead of silently
 * treating a blank as zero.
 */
export const IntakeFieldInput = ({
  field,
  value,
  unknown,
  currencySymbol,
  onValueChange,
  onUnknownChange,
  className,
}: {
  field: IntakeField;
  value: string;
  unknown: boolean;
  currencySymbol: string;
  onValueChange: (next: string) => void;
  onUnknownChange: (next: boolean) => void;
  className?: string;
}) => {
  const { t } = useTranslation();

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-start justify-between gap-2">
        <Label htmlFor={`intake-${field.key}`} className="text-xs font-medium text-foreground">
          {intakeFieldLabel(t, field.key)}
        </Label>
        <Button
          type="button"
          variant={unknown ? "secondary" : "ghost"}
          size="sm"
          className="h-6 px-2 text-[11px] font-normal text-muted-foreground"
          aria-pressed={unknown}
          onClick={() => onUnknownChange(!unknown)}
        >
          {t("intake.unknown")}
        </Button>
      </div>

      <div className="relative">
        <Input
          id={`intake-${field.key}`}
          type="number"
          inputMode="decimal"
          disabled={unknown}
          value={unknown ? "" : value}
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          placeholder={unknown ? t("intake.unknownValue") : undefined}
          onChange={(event) => onValueChange(event.target.value)}
          className={cn("tabular pr-12", unknown && "bg-muted/60")}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {unitHint(field, currencySymbol)}
        </span>
      </div>

      <p className="text-[11px] leading-snug text-muted-foreground">
        {intakeFieldHelp(t, field.key)}
      </p>
    </div>
  );
};
