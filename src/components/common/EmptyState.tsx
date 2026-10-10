import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) => (
  <Card className={cn("border-dashed shadow-none", className)}>
    <CardContent className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? (
          <p className="mx-auto max-w-md text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </CardContent>
  </Card>
);

export const PageLoading = ({ label }: { label?: string }) => (
  <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
    {label ? <p className="text-sm">{label}</p> : null}
  </div>
);
