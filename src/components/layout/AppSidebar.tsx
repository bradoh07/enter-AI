import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { primaryNavItems } from "./nav-items";
import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

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
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
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

export const SidebarBrand = () => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2.5 px-3 py-1">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-foreground/10">
        <BarChart3 className="h-4 w-4 text-sidebar-primary" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-sidebar-primary">
          {t("common.appName")}
        </p>
        <p className="truncate text-[11px] text-sidebar-foreground/60">
          {t("common.appTagline")}
        </p>
      </div>
    </div>
  );
};

export const SidebarFooter = () => (
  <div className="border-t border-sidebar-border px-3 pt-3">
    <LanguageSwitcher className="w-full border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground" />
  </div>
);
