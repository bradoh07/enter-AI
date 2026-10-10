import { useState } from "react";

import { AuthModeTabs, type AuthMode } from "./AuthModeTabs";
import { LoginForm } from "./LoginForm";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { SignupForm } from "./SignupForm";
import type { UserType } from "@/lib/api/types";

type AuthView = AuthMode | "reset";

/**
 * The ivory form panel. One component owns the view so switching between
 * signing in, signing up and recovery never leaves the warm two-column frame.
 */
export const AuthPanel = ({
  initialMode = "login",
  initialUserType,
}: {
  initialMode?: AuthMode;
  initialUserType?: UserType;
}) => {
  const [view, setView] = useState<AuthView>(initialMode);

  return (
    <div className="space-y-6">
      <AuthModeTabs
        mode={view === "reset" ? initialMode : view}
        onChange={(mode) => setView(mode)}
      />

      {view === "login" ? (
        <LoginForm
          onSwitchToSignup={() => setView("signup")}
          onForgotPassword={() => setView("reset")}
        />
      ) : null}

      {view === "signup" ? (
        <SignupForm
          onSwitchToLogin={() => setView("login")}
          initialUserType={initialUserType}
        />
      ) : null}

      {view === "reset" ? (
        <ResetPasswordForm onBackToLogin={() => setView("login")} />
      ) : null}
    </div>
  );
};
