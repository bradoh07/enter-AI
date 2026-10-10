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

/**
 * A single figure with its source. Values stay in the sans stack with tabular
 * figures so columns of numbers line up and stay comparable.
 */
export const MetricCard = ({
  label,
  value,
  hint,
  badge,
  tone = "default",
  className,
}: MetricCardProps) => (
  <Card className={cn(className)}>
    <CardHeader className="gap-1 space-y-0 pb-2">
      <div className="flex items-start justify-between gap-2">
        {/* Uniform label height so a row of tiles keeps its values on one line */}
        <CardTitle className="min-h-[2.25rem] text-[11px] font-medium uppercase leading-snug tracking-[0.08em] text-muted-foreground">
          {label}
        </CardTitle>
        {badge}
      </div>
    </CardHeader>
    <CardContent className="space-y-1.5">
      <div
        className={cn(
          "tabular text-[1.6rem] font-semibold leading-tight tracking-tight",
          toneClass[tone],
        )}
      >
        {value}
      </div>
      {hint ? (
        <div className="text-xs leading-snug text-muted-foreground">{hint}</div>
      ) : null}
    </CardContent>
  </Card>
);

export const MetricCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-2">
      <Skeleton className="h-3 w-24" />
    </CardHeader>
    <CardContent className="space-y-2">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-20" />
    </CardContent>
  </Card>
);
