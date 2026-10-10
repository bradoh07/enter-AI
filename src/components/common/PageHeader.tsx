import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Page title block. Serif here, sans everywhere the data lives. */
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
      "flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between",
      className,
    )}
  >
    <div className="space-y-2">
      <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground">
        {title}
      </h1>
      {description ? (
        <div className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </div>
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
  <section
    className={cn(
      "rounded-lg border border-border bg-card shadow-panel",
      className,
    )}
  >
    <header className="flex flex-col gap-3 border-b border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-base font-semibold leading-snug tracking-tight text-foreground">
            {title}
          </h2>
          {badge}
        </div>
        {description ? (
          <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
    <div className={cn("px-6 py-6", contentClassName)}>{children}</div>
  </section>
);
