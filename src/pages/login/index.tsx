import { Navigate, useSearchParams } from "react-router-dom";

import { AuthPanel } from "../auth/AuthPanel";
import { AuthShell } from "../auth/AuthShell";
import { useAuth } from "@/providers/auth-provider";
import { isUserType } from "@/lib/api/types";

/**
 * Sign-in screen. `?mode=signup` opens on the registration step so a single
 * entry point can serve both, and `?type=business|individual` preselects an
 * account path for the two registration links.
 */
const LoginPage = () => {
  const { user, initializing } = useAuth();
  const [searchParams] = useSearchParams();

  if (!initializing && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const requestedType = searchParams.get("type");

  return (
    <AuthShell>
      <AuthPanel
        initialMode={initialMode}
        initialUserType={isUserType(requestedType) ? requestedType : undefined}
      />
    </AuthShell>
  );
};

export default LoginPage;
