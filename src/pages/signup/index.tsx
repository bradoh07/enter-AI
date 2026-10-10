import { Navigate, useSearchParams } from "react-router-dom";

import { AuthPanel } from "../auth/AuthPanel";
import { AuthShell } from "../auth/AuthShell";
import { useAuth } from "@/providers/auth-provider";
import { isUserType } from "@/lib/api/types";

/** Registration screen. `?type=` jumps straight to that account path. */
const SignupPage = () => {
  const { user, initializing } = useAuth();
  const [searchParams] = useSearchParams();

  if (!initializing && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const requestedType = searchParams.get("type");

  return (
    <AuthShell>
      <AuthPanel
        initialMode="signup"
        initialUserType={isUserType(requestedType) ? requestedType : undefined}
      />
    </AuthShell>
  );
};

export default SignupPage;
