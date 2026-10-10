import { TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { AiImprovement } from "@/lib/ai/types";

export const ImprovementList = ({ improvements }: { improvements: AiImprovement[] }) => {
  const { t } = useTranslation();

  if (improvements.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
        {t("ai.empty.improvements")}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {improvements.map((improvement, index) => (
        <li key={index} className="rounded-md border border-border p-4">
          <div className="flex items-start gap-2">
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{improvement.title}</p>
              {improvement.description ? (
                <p className="text-sm text-muted-foreground">{improvement.description}</p>
              ) : null}
              {improvement.expectedEffect ? (
                <p className="text-xs text-primary">{improvement.expectedEffect}</p>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};
