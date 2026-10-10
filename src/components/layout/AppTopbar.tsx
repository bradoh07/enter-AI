import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarBrand, SidebarFooter, SidebarNav } from "./AppSidebar";
import { useAuth } from "@/providers/auth-provider";
import { useProfile } from "@/hooks/use-profile";
import { userTypeLabel } from "@/lib/domain/options";

export const AppTopbar = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const displayName = profile?.display_name || user?.email || "";
  const initial = displayName.trim().charAt(0).toUpperCase() || "U";

  return (
    <header className="print-hidden sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("nav.openMenu")}>
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
          <SheetTitle className="sr-only">{t("nav.menuLabel")}</SheetTitle>
          <div className="flex h-full flex-col gap-5 px-3 py-5">
            <SidebarBrand />
            <div className="flex-1 overflow-y-auto">
              <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
            </div>
            <SidebarFooter />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 px-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/25 bg-primary/12 text-xs font-semibold text-primary">
              {initial}
            </span>
            <span className="hidden max-w-[12rem] truncate text-sm font-medium sm:inline">
              {displayName}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="space-y-0.5">
            <div className="truncate text-sm font-medium">{displayName}</div>
            {profile ? (
              <div className="text-xs font-normal text-muted-foreground">
                {userTypeLabel(t, profile.user_type)}
              </div>
            ) : null}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            {t("auth.signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};
