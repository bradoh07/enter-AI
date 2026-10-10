import { Outlet } from "react-router-dom";

import { SidebarBrand, SidebarFooter, SidebarNav } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";

/**
 * Shell for every authenticated screen: an ivory editorial rail on desktop, an
 * off-canvas sheet on mobile, and a single content column with generous
 * margins. Navigation and chrome are hidden in print so the report route prints
 * as a clean document.
 */
export const AppLayout = () => (
  <div className="flex min-h-screen bg-background">
    <aside className="print-hidden hidden w-64 shrink-0 flex-col justify-between gap-6 border-r border-sidebar-border bg-sidebar px-3 py-5 lg:flex">
      <div className="flex flex-col gap-6">
        <SidebarBrand />
        <SidebarNav />
      </div>
      <SidebarFooter />
    </aside>

    <div className="flex min-w-0 flex-1 flex-col">
      <AppTopbar />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-7 sm:px-7 lg:px-10 lg:py-10">
        <Outlet />
      </main>
    </div>
  </div>
);

export default AppLayout;
