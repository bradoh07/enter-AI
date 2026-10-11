import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { CinematicHero } from "./CinematicHero";
import { LanguageSwitcher } from "@/components/language-switcher";

/**
 * Two-column sign-in shell: 62% cinematic photography, 38% ivory form panel.
 *
 * On desktop the hero is pinned to the viewport so it stays cinematic while a
 * long registration form scrolls past it. Below `lg` it becomes a fixed-height
 * band above the stacked form.
 */
export const AuthShell = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,62fr)_minmax(0,38fr)]">
      <section
        className="relative h-[46vh] min-h-[320px] lg:sticky lg:top-0 lg:h-screen lg:min-h-0"
        aria-label={t("auth.hero.label")}
      >
        <CinematicHero />
      </section>

      <section className="flex flex-col">
        <div className="flex justify-end px-7 py-5 lg:px-12">
          <LanguageSwitcher className="w-[9.5rem]" />
        </div>

        <div className="flex flex-1 items-start justify-center px-7 pb-16 lg:items-center lg:px-12">
          <div className="w-full max-w-[22rem]">{children}</div>
        </div>
      </section>
    </div>
  );
};
