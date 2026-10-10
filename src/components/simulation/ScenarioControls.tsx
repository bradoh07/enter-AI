import { RotateCcw } from "lucide-react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { scenarioLabel } from "@/lib/domain/options";
import { SCENARIO_KEYS, type ScenarioAdjustment, type ScenarioKey } from "@/lib/simulation/types";

const FIELDS: Array<{
  key: keyof ScenarioAdjustment;
  step: number;
  min: number;
  max: number;
}> = [
  { key: "revenueMultiplier", step: 0.05, min: 0, max: 3 },
  { key: "unitCostMultiplier", step: 0.05, min: 0, max: 3 },
  { key: "fixedCostMultiplier", step: 0.05, min: 0, max: 3 },
  { key: "rampOffsetMonths", step: 1, min: -12, max: 24 },
];

/** Literal-key labels for the adjustment inputs. */
const adjustmentLabel = (t: TFunction, key: keyof ScenarioAdjustment): string => {
  switch (key) {
    case "revenueMultiplier":
      return t("scenarioControls.revenue");
    case "unitCostMultiplier":
      return t("scenarioControls.unitCost");
    case "fixedCostMultiplier":
      return t("scenarioControls.fixedCost");
    case "rampOffsetMonths":
      return t("scenarioControls.ramp");
    default:
      return key;
  }
};

/**
 * Editable scenario multipliers. Changing any of them re-runs the engine on the
 * current input, which is what makes the three cases a live comparison rather
 * than three static pictures.
 */
export const ScenarioControls = ({
  adjustments,
  disabled = false,
  onChange,
  onReset,
}: {
  adjustments: Record<ScenarioKey, ScenarioAdjustment>;
  disabled?: boolean;
  onChange: (key: ScenarioKey, patch: Partial<ScenarioAdjustment>) => void;
  onReset: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{t("scenarioControls.notice")}</p>
        <Button type="button" variant="outline" size="sm" onClick={onReset} disabled={disabled}>
          <RotateCcw className="h-4 w-4" />
          {t("scenarioControls.reset")}
        </Button>
      </div>

      <div className="space-y-3">
        {SCENARIO_KEYS.map((key) => (
          <div key={key} className="rounded-md border border-border bg-muted/30 p-3">
            <Badge variant={key} className="mb-3">
              {scenarioLabel(t, key)}
            </Badge>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
              {FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5 lg:col-span-2">
                  <Label className="text-[11px] font-medium text-muted-foreground">
                    {adjustmentLabel(t, field.key)}
                  </Label>
                  <Input
                    className="tabular bg-card"
                    type="number"
                    inputMode="decimal"
                    disabled={disabled}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={String(adjustments[key][field.key])}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      onChange(key, {
                        [field.key]: Number.isFinite(next) ? next : 0,
                      } as Partial<ScenarioAdjustment>);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
