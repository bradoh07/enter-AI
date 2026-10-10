import { Outlet } from "react-router-dom";

import { SidebarBrand, SidebarFooter, SidebarNav } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";

/**
 * Shell for every authenticated screen: a fixed navy rail on desktop, an
 * off-canvas sheet on mobile, and a single content column that stays readable
 * at wide widths. Navigation and chrome are hidden in print so the report route
 * prints as a clean document.
 */
export const AppLayout = () => (
  <div className="flex min-h-screen bg-background">
    <aside className="print-hidden hidden w-64 shrink-0 flex-col justify-between gap-5 bg-sidebar px-3 py-4 lg:flex">
      <div className="flex flex-col gap-5">
        <SidebarBrand />
        <SidebarNav />
      </div>
      <SidebarFooter />
    </aside>

    <div className="flex min-w-0 flex-1 flex-col">
      <AppTopbar />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  </div>
);

export default AppLayout;
