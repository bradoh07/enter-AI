import { Calculator, Info, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type DataSource = "computed" | "ai" | "assumption";

/**
 * Marks where a number or statement came from. Figures produced by the
 * deterministic engine and text produced by a model must never look alike.
 */
export const DataSourceBadge = ({
  source,
  className,
}: {
  source: DataSource;
  className?: string;
}) => {
  const { t } = useTranslation();

  if (source === "computed") {
    return (
      <Badge variant="computed" className={cn(className)}>
        <Calculator />
        {t("source.computed")}
      </Badge>
    );
  }

  if (source === "ai") {
    return (
      <Badge variant="ai" className={cn(className)}>
        <Sparkles />
        {t("source.ai")}
      </Badge>
    );
  }

  return (
    <Badge variant="estimation" className={cn(className)}>
      <Info />
      {t("source.assumption")}
    </Badge>
  );
};
