import { Loader2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useBackendStatus } from "@/hooks/use-backend-status";
import { cn } from "@/lib/utils";

/**
 * Shows whether the backend is answering, and re-checks on click. This turns a
 * paused instance into something visible before a sign-in attempt, instead of a
 * failure the user only discovers after typing their credentials.
 */
export const BackendStatusPill = ({ className }: { className?: string }) => {
  const { t } = useTranslation();
  const { status, recheck } = useBackendStatus();

  const label =
    status === "online"
      ? t("status.backend.online")
      : status === "offline"
        ? t("status.backend.offline")
        : t("status.backend.checking");

  return (
    <button
      type="button"
      onClick={recheck}
      title={t("status.backend.recheck")}
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground",
        className,
      )}
    >
      {status === "checking" ? (
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      ) : (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            status === "online" ? "bg-success" : "bg-warning",
          )}
        />
      )}
      <span>{label}</span>
      <RefreshCw className="h-3 w-3 opacity-50" />
    </button>
  );
};
