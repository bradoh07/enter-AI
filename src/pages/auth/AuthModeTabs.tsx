import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export type AuthMode = "login" | "signup";

/** Segmented switch between signing in and creating an account. */
export const AuthModeTabs = ({
  mode,
  onChange,
}: {
  mode: AuthMode;
  onChange: (next: AuthMode) => void;
}) => {
  const { t } = useTranslation();

  const options: Array<{ value: AuthMode; label: string }> = [
    { value: "login", label: t("auth.mode.login") },
    { value: "signup", label: t("auth.mode.signup") },
  ];

  return (
    <div
      role="tablist"
      aria-label={t("auth.mode.label")}
      className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/60 p-1"
    >
      {options.map((option) => {
        const selected = option.value === mode;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              selected
                ? "bg-card text-primary shadow-panel"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
