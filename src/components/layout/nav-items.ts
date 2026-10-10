import {
  FolderKanban,
  History,
  LayoutDashboard,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  to: string;
  name: string;
  label: string;
  icon: LucideIcon;
  /** Exact matching, needed for /dashboard style roots. */
  end?: boolean;
};

export const primaryNavItems = (labels: {
  dashboard: string;
  projects: string;
  newSimulation: string;
  history: string;
  settings: string;
}): NavItem[] => [
  { to: "/dashboard", name: "dashboard", label: labels.dashboard, icon: LayoutDashboard, end: true },
  { to: "/projects", name: "projects", label: labels.projects, icon: FolderKanban },
  { to: "/simulations/new", name: "newSimulation", label: labels.newSimulation, icon: Sparkles },
  { to: "/history", name: "history", label: labels.history, icon: History },
  { to: "/settings", name: "settings", label: labels.settings, icon: Settings },
];
