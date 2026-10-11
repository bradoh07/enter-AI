import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth-provider";

/**
 * Landing screen for the recovery email. It is also a plain change-password
 * screen for a signed-in user, so one form covers both cases.
 */
export const SetPasswordForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setPassword: savePassword } = useAuth();

  const [password, setPasswordValue] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmation) {
      setError(t("common.passwordMismatch"));
      return;
    }

    setSubmitting(true);
    const result = await savePassword(password);
    setSubmitting(false);
    if (result) {
      setError(result.offline ? t("auth.backendUnavailable") : result.message);
      return;
    }
    navigate("/dashboard", { replace: true });
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <header className="space-y-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            {t("auth.setPassword.noSessionTitle")}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("auth.setPassword.noSessionDescription")}
          </p>
        </header>
        <Button type="button" className="w-full" onClick={() => navigate("/login")}>
          {t("auth.setPassword.goToLogin")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {t("auth.setPassword.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("auth.setPassword.subtitle")}</p>
      </header>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="new-password">{t("auth.field.password")}</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPasswordValue(event.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">{t("auth.field.passwordHint")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">{t("auth.field.confirmPassword")}</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("auth.setPassword.submit")}
        </Button>
      </form>
    </div>
  );
};
