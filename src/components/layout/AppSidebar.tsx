import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BarChart3 } from "lucide-react";

import { primaryNavItems } from "./nav-items";
import { LanguageSwitcher } from "@/components/language-switcher";
import { cn } from "@/lib/utils";

const useNavItems = () => {
  const { t } = useTranslation();
  return primaryNavItems({
    dashboard: t("nav.dashboard"),
    projects: t("nav.projects"),
    newSimulation: t("nav.newSimulation"),
    history: t("nav.history"),
    settings: t("nav.settings"),
  });
};

export const SidebarNav = ({ onNavigate }: { onNavigate?: () => void }) => {
  const items = useNavItems();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <NavLink
          key={item.name}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

/**
 * The rail carries a descriptive label rather than a brand mark — there is no
 * invented product name anywhere in the interface.
 */
export const SidebarBrand = () => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2.5 px-2 py-1">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/12">
        <BarChart3 className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-semibold text-sidebar-primary">
          {t("common.appName")}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">{t("common.appTagline")}</p>
      </div>
    </div>
  );
};

export const SidebarFooter = () => (
  <div className="border-t border-sidebar-border px-2 pt-4">
    <LanguageSwitcher className="w-full" />
  </div>
);
