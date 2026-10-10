import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  badge?: ReactNode;
  tone?: "default" | "positive" | "negative" | "warning";
  className?: string;
};

const toneClass: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "text-foreground",
  positive: "text-success",
  negative: "text-destructive",
  warning: "text-warning",
};

export const MetricCard = ({
  label,
  value,
  hint,
  badge,
  tone = "default",
  className,
}: MetricCardProps) => (
  <Card className={cn("shadow-panel", className)}>
    <CardHeader className="gap-1 space-y-0 pb-2">
      <div className="flex items-start justify-between gap-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
        {badge}
      </div>
    </CardHeader>
    <CardContent className="space-y-1">
      <div className={cn("tabular text-2xl font-semibold tracking-tight", toneClass[tone])}>
        {value}
      </div>
      {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
    </CardContent>
  </Card>
);

export const MetricCardSkeleton = () => (
  <Card className="shadow-panel">
    <CardHeader className="pb-2">
      <Skeleton className="h-3 w-24" />
    </CardHeader>
    <CardContent className="space-y-2">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-20" />
    </CardContent>
  </Card>
);
