import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AiQuestion } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

const isNumeric = (type: AiQuestion["inputType"]) =>
  type === "number" || type === "currency" || type === "percent";

const unitOf = (question: AiQuestion, currencySymbol: string) => {
  if (question.unit) return question.unit;
  if (question.inputType === "currency") return currencySymbol;
  if (question.inputType === "percent") return "%";
  return "";
};

/**
 * One AI-generated question. Questions the engine understands can be answered
 * or explicitly left undecided; context-only questions are marked as such so
 * the user knows which answers change the numbers.
 */
export const AiQuestionField = ({
  question,
  value,
  unknown,
  currencySymbol,
  onValueChange,
  onUnknownChange,
}: {
  question: AiQuestion;
  value: string;
  unknown: boolean;
  currencySymbol: string;
  onValueChange: (next: string) => void;
  onUnknownChange: (next: boolean) => void;
}) => {
  const { t } = useTranslation();
  const mapped = question.mapsTo.length > 0;
  const numeric = isNumeric(question.inputType);

  return (
    <div className={cn("space-y-1.5", unknown && "opacity-70")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <Label className="text-xs font-medium text-foreground">{question.label}</Label>
          {question.help ? (
            <p className="text-[11px] leading-snug text-muted-foreground">{question.help}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          {mapped ? (
            <Badge variant="computed">{t("newSimulation.question.mapped")}</Badge>
          ) : (
            <Badge variant="muted">{t("newSimulation.question.context")}</Badge>
          )}
          {mapped ? (
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
          ) : null}
        </div>
      </div>

      {question.inputType === "select" ? (
        <Select
          value={value}
          disabled={unknown}
          onValueChange={(next) => onValueChange(next)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("newSimulation.question.selectPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {question.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="relative">
          <Input
            className={cn(numeric && "tabular pr-14")}
            type={numeric ? "number" : "text"}
            inputMode={numeric ? "decimal" : "text"}
            disabled={unknown}
            value={unknown ? "" : value}
            placeholder={unknown ? t("intake.unknownValue") : undefined}
            onChange={(event) => onValueChange(event.target.value)}
          />
          {numeric && unitOf(question, currencySymbol) ? (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {unitOf(question, currencySymbol)}
            </span>
          ) : null}
        </div>
      )}

      {!mapped ? (
        <p className="text-[11px] text-muted-foreground">
          {t("newSimulation.question.contextHint")}
        </p>
      ) : null}
    </div>
  );
};
