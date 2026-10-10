import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { assumptionText } from "@/lib/domain/assumption-text";
import { assumptionImpactLabel, dataSourceLabel } from "@/lib/domain/options";
import type { AssumptionNote } from "@/lib/simulation/types";

/** Modelling conventions, user decisions and open questions behind the numbers. */
export const AssumptionsPanel = ({
  notes,
  className,
}: {
  notes: AssumptionNote[];
  className?: string;
}) => {
  const { t } = useTranslation();

  if (notes.length === 0) {
    return (
      <EmptyState
        icon={Info}
        title={t("assumptions.empty.title")}
        description={t("assumptions.empty.description")}
      />
    );
  }

  const sourceVariant = (source: AssumptionNote["source"]) => {
    if (source === "ai") return "ai" as const;
    if (source === "user") return "estimation" as const;
    return "computed" as const;
  };

  return (
    <ul className={className}>
      {notes.map((note) => (
        <li
          key={note.id}
          className="flex flex-col gap-2 border-b border-border py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="flex gap-2">
            <Info className="mt-0.5 hidden h-3.5 w-3.5 shrink-0 text-muted-foreground sm:block" />
            <p className="text-sm text-foreground">{assumptionText(t, note)}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Badge variant={sourceVariant(note.source)}>{dataSourceLabel(t, note.source)}</Badge>
            <Badge variant="muted">{assumptionImpactLabel(t, note.impact)}</Badge>
          </div>
        </li>
      ))}
    </ul>
  );
};
