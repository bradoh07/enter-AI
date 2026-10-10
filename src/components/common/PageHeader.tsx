import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const PageHeader = ({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between",
      className,
    )}
  >
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      {description ? (
        <div className="max-w-2xl text-sm text-muted-foreground">{description}</div>
      ) : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
);

export const SectionCard = ({
  title,
  badge,
  description,
  actions,
  children,
  className,
  contentClassName,
}: {
  title: string;
  badge?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) => (
  <section className={cn("rounded-lg border border-border bg-card shadow-panel", className)}>
    <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
          {badge}
        </div>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
    <div className={cn("px-5 py-5", contentClassName)}>{children}</div>
  </section>
);
