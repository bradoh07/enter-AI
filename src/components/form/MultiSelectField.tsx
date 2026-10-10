import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Multi-select chips with a free-text escape hatch. Predefined values are stable
 * tokens; anything typed is stored verbatim, so a domain that is not on the list
 * still round-trips.
 */
export const MultiSelectField = ({
  options,
  value,
  onChange,
  disabled = false,
}: {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");

  const knownValues = new Set(options.map((option) => option.value));
  const customValues = value.filter((entry) => !knownValues.has(entry));

  const toggle = (entry: string) => {
    if (disabled) return;
    onChange(
      value.includes(entry) ? value.filter((item) => item !== entry) : [...value, entry],
    );
  };

  const addCustom = () => {
    const trimmed = draft.trim();
    if (!trimmed || value.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => toggle(option.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-60",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent",
              )}
            >
              {selected ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5 opacity-40" />
              )}
              {option.label}
            </button>
          );
        })}
      </div>

      {customValues.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {customValues.map((entry) => (
            <span
              key={entry}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary/40 bg-accent px-3 py-1.5 text-sm text-primary"
            >
              {entry}
              <button
                type="button"
                disabled={disabled}
                aria-label={t("common.remove")}
                onClick={() => toggle(entry)}
                className="rounded-full p-0.5 hover:bg-primary/10 disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex gap-2">
        <Input
          value={draft}
          disabled={disabled}
          placeholder={t("common.customOptionPlaceholder")}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCustom();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={addCustom} disabled={disabled}>
          {t("common.addCustom")}
        </Button>
      </div>
    </div>
  );
};
