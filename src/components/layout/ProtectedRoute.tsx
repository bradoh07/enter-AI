import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { PageLoading } from "@/components/common/EmptyState";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/providers/auth-provider";

/**
 * Gate for authenticated routes. A signed-in user whose onboarding is still
 * incomplete is sent to the onboarding form; the onboarding route itself passes
 * `allowIncompleteProfile` so it does not redirect to itself.
 */
export const ProtectedRoute = ({
  children,
  allowIncompleteProfile = false,
}: {
  children: ReactNode;
  allowIncompleteProfile?: boolean;
}) => {
  const { user, initializing } = useAuth();
  const { data: profile, isLoading } = useProfile();

  if (initializing || (user && isLoading)) {
    return <PageLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowIncompleteProfile && profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
