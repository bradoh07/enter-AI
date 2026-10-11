import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { primaryNavItems } from "./nav-items";
import { BrandMark } from "@/components/common/BrandMark";
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
 * Head of the rail: the Renasci mark plus the line describing what the product
 * does. The mark keeps its own dark plate so the white logotype stays legible on
 * the ivory rail.
 */
export const SidebarBrand = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-start gap-2.5 px-2 py-1">
      <BrandMark size="md" />
      <p className="text-[11px] leading-snug text-muted-foreground">
        {t("common.appTagline")}
      </p>
    </div>
  );
};

export const SidebarFooter = () => (
  <div className="border-t border-sidebar-border px-2 pt-4">
    <LanguageSwitcher className="w-full" />
  </div>
);
