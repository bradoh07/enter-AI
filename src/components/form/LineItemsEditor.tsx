import { Plus, Trash2 } from "lucide-react";

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
import { cn } from "@/lib/utils";

export type LineFieldType = "text" | "currency" | "number" | "percent" | "select";

export type LineFieldSpec = {
  key: string;
  label: string;
  type: LineFieldType;
  options?: { value: string; label: string }[];
  min?: number;
  step?: number;
  placeholder?: string;
  /** Grid span at the widest breakpoint. */
  span?: string;
};

type LineRecord = Record<string, unknown>;

/**
 * Repeatable row editor used for every line-item list in the workspace:
 * investment items, fixed costs, revenue streams, payroll and funding. Values
 * are written straight back into the project's structured input.
 */
export const LineItemsEditor = ({
  items,
  fields,
  onChange,
  onAdd,
  onRemove,
  addLabel,
  removeLabel,
  emptyLabel,
  disabled = false,
}: {
  items: LineRecord[];
  fields: LineFieldSpec[];
  onChange: (index: number, key: string, value: string | number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  addLabel: string;
  removeLabel: string;
  emptyLabel: string;
  disabled?: boolean;
}) => (
  <div className="space-y-3">
    {items.length === 0 ? (
      <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
        {emptyLabel}
      </p>
    ) : null}

    {items.map((item, index) => (
      <div
        key={index}
        className="rounded-md border border-border bg-muted/30 p-3 shadow-none"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {fields.map((field) => {
            const rawValue = item[field.key];
            const value = rawValue === null || rawValue === undefined ? "" : String(rawValue);

            return (
              <div
                key={field.key}
                className={cn("space-y-1.5", field.span ?? "lg:col-span-2")}
              >
                <Label className="text-[11px] font-medium text-muted-foreground">
                  {field.label}
                </Label>
                {field.type === "select" ? (
                  <Select
                    value={value}
                    disabled={disabled}
                    onValueChange={(next) => onChange(index, field.key, next)}
                  >
                    <SelectTrigger className="bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(field.options ?? []).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    className="tabular bg-card"
                    disabled={disabled}
                    type={field.type === "text" ? "text" : "number"}
                    inputMode={field.type === "text" ? "text" : "decimal"}
                    min={field.min}
                    step={field.step ?? 1}
                    placeholder={field.placeholder}
                    value={value}
                    onChange={(event) => {
                      const next = event.target.value;
                      if (field.type === "text") {
                        onChange(index, field.key, next);
                        return;
                      }
                      // Keep the raw string empty rather than coercing "" to 0,
                      // so a cleared field stays cleared while typing.
                      onChange(index, field.key, next === "" ? "" : Number(next));
                    }}
                  />
                )}
              </div>
            );
          })}

          <div className="flex items-end lg:col-span-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(index)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="ml-2 sm:hidden">{removeLabel}</span>
              <span className="sr-only">{removeLabel}</span>
            </Button>
          </div>
        </div>
      </div>
    ))}

    <Button type="button" variant="outline" size="sm" onClick={onAdd} disabled={disabled}>
      <Plus className="h-4 w-4" />
      {addLabel}
    </Button>
  </div>
);
