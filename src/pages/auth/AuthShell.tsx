import { type ReactNode } from "react";
import { BarChart3, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "@/components/language-switcher";

/**
 * Two-column auth shell: a navy brand panel for trust, and a quiet form column
 * on the right. The panel collapses away on small screens.
 */
export const AuthShell = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();

  const features = [
    t("auth.brand.feature1"),
    t("auth.brand.feature2"),
    t("auth.brand.feature3"),
  ];

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col justify-between bg-sidebar px-12 py-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-foreground/10">
            <BarChart3 className="h-4 w-4 text-sidebar-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-sidebar-primary">{t("common.appName")}</p>
            <p className="text-[11px] text-sidebar-foreground/60">{t("common.appTagline")}</p>
          </div>
        </div>

        <div className="max-w-lg space-y-6">
          <h1 className="text-3xl font-semibold leading-snug text-sidebar-primary">
            {t("auth.brand.headline")}
          </h1>
          <p className="text-sm leading-relaxed text-sidebar-foreground/75">
            {t("auth.brand.description")}
          </p>
          <ul className="space-y-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sidebar-foreground/70" />
                <span className="text-sm text-sidebar-foreground/85">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-sidebar-foreground/50">{t("auth.brand.footnote")}</p>
      </div>

      <div className="flex flex-col">
        <div className="flex justify-end px-6 pt-6">
          <LanguageSwitcher className="min-w-[130px]" />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
};
