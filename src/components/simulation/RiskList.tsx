import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { aiLevelLabel } from "@/lib/domain/options";
import type { AiRisk } from "@/lib/ai/types";

const levelVariant = (level: string) => {
  if (level === "high") return "destructive" as const;
  if (level === "medium") return "estimation" as const;
  return "muted" as const;
};

/** AI-judged risks. Each one carries the mitigation the model proposed. */
export const RiskList = ({ risks }: { risks: AiRisk[] }) => {
  const { t } = useTranslation();

  if (risks.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
        {t("ai.empty.risks")}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {risks.map((risk, index) => (
        <li key={index} className="rounded-md border border-border p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div>
                <p className="text-sm font-medium text-foreground">{risk.title}</p>
                {risk.category ? (
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {risk.category}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={levelVariant(risk.likelihood)}>
                {t("ai.risk.likelihood")} · {aiLevelLabel(t, risk.likelihood)}
              </Badge>
              <Badge variant={levelVariant(risk.impact)}>
                {t("ai.risk.impact")} · {aiLevelLabel(t, risk.impact)}
              </Badge>
            </div>
          </div>

          {risk.description ? (
            <p className="mt-3 text-sm text-muted-foreground">{risk.description}</p>
          ) : null}

          {risk.mitigation ? (
            <div className="mt-3 flex gap-2 rounded-md bg-accent px-3 py-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                  {t("ai.risk.mitigation")}
                </p>
                <p className="text-sm text-foreground">{risk.mitigation}</p>
              </div>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
};
