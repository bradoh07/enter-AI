import { lazy, Suspense, type ReactNode } from "react";

import { PageLoading } from "@/components/common/EmptyState";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

/**
 * Route components are code-split so a visitor reaching the sign-in screen does
 * not download the charting and workspace bundles first.
 */
const LoginPage = lazy(() => import("./pages/login"));
const SignupPage = lazy(() => import("./pages/signup"));
const ResetPasswordPage = lazy(() => import("./pages/reset-password"));
const OnboardingPage = lazy(() => import("./pages/onboarding"));
const DashboardPage = lazy(() => import("./pages/dashboard"));
const ProjectsPage = lazy(() => import("./pages/projects"));
const ProjectDetailPage = lazy(() => import("./pages/projects/detail"));
const ComparePage = lazy(() => import("./pages/projects/compare"));
const NewSimulationPage = lazy(() => import("./pages/simulations/new"));
const HistoryPage = lazy(() => import("./pages/history"));
const RunDetailPage = lazy(() => import("./pages/runs"));
const ReportPage = lazy(() => import("./pages/report"));
const SettingsPage = lazy(() => import("./pages/settings"));

const suspense = (node: ReactNode) => <Suspense fallback={<PageLoading />}>{node}</Suspense>;

export const routers = [
  {
    path: "/",
    name: "home",
    element: <Index />,
  },
  {
    path: "/login",
    name: "login",
    element: suspense(<LoginPage />),
  },
  {
    path: "/signup",
    name: "signup",
    element: suspense(<SignupPage />),
  },
  {
    // Reachable only with a recovery session; ProtectedRoute sends everyone
    // else back to sign-in. Incomplete onboarding must not block the reset.
    path: "/reset-password",
    name: "resetPassword",
    element: (
      <ProtectedRoute allowIncompleteProfile>{suspense(<ResetPasswordPage />)}</ProtectedRoute>
    ),
  },
  {
    path: "/onboarding",
    name: "onboarding",
    element: (
      <ProtectedRoute allowIncompleteProfile>{suspense(<OnboardingPage />)}</ProtectedRoute>
    ),
  },
  {
    path: "/report/:runId",
    name: "report",
    element: <ProtectedRoute>{suspense(<ReportPage />)}</ProtectedRoute>,
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/dashboard",
        name: "dashboard",
        element: suspense(<DashboardPage />),
      },
      {
        path: "/projects",
        name: "projects",
        element: suspense(<ProjectsPage />),
      },
      {
        path: "/projects/compare",
        name: "projectsCompare",
        element: suspense(<ComparePage />),
      },
      {
        path: "/projects/:projectId",
        name: "projectDetail",
        element: suspense(<ProjectDetailPage />),
      },
      {
        path: "/simulations/new",
        name: "newSimulation",
        element: suspense(<NewSimulationPage />),
      },
      {
        path: "/history",
        name: "history",
        element: suspense(<HistoryPage />),
      },
      {
        path: "/runs/:runId",
        name: "runDetail",
        element: suspense(<RunDetailPage />),
      },
      {
        path: "/settings",
        name: "settings",
        element: suspense(<SettingsPage />),
      },
    ],
  },
  /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
  {
    path: "*",
    name: "404",
    element: <NotFound />,
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
