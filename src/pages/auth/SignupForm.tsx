import { useState, type FormEvent } from "react";
import { AlertCircle, Building2, Check, Loader2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth-provider";
import { userTypeLabel } from "@/lib/domain/options";
import { USER_TYPES, type UserType } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const typeIcon = (type: UserType) => (type === "business" ? Building2 : User);

/**
 * Sign-up starts by choosing the account path, because the two paths ask for
 * different things right afterwards. The choice is a full step of its own so
 * neither path can be entered by accident.
 */
export const SignupForm = ({
  onSwitchToLogin,
  initialUserType,
}: {
  onSwitchToLogin: () => void;
  initialUserType?: UserType;
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [step, setStep] = useState<"type" | "credentials">(
    initialUserType ? "credentials" : "type",
  );
  const [userType, setUserType] = useState<UserType>(initialUserType ?? "business");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const SelectedTypeIcon = typeIcon(userType);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await signUp({
      email: email.trim(),
      password,
      userType,
      displayName: displayName.trim(),
    });
    setSubmitting(false);
    if (result) {
      setError(result.offline ? t("auth.backendUnavailable") : result.message);
      return;
    }
    navigate("/onboarding", { replace: true });
  };

  if (step === "type") {
    return (
      <div className="space-y-6">
        <header className="space-y-1.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            {t("auth.signup.chooseTypeTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("auth.signup.chooseTypeSubtitle")}</p>
        </header>

        <div className="space-y-3" role="radiogroup" aria-label={t("auth.field.accountType")}>
          {USER_TYPES.map((type) => {
            const Icon = typeIcon(type);
            const selected = userType === type;
            return (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setUserType(type)}
                className={cn(
                  "w-full rounded-lg border p-4 text-left transition-colors",
                  selected
                    ? "border-primary bg-accent"
                    : "border-border bg-card hover:border-primary/60",
                )}
              >
                <span className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                      selected ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 space-y-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {userTypeLabel(t, type)}
                      </span>
                      {selected ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
                    </span>
                    <span className="block text-xs leading-relaxed text-muted-foreground">
                      {type === "business"
                        ? t("auth.field.accountTypeBusinessHint")
                        : t("auth.field.accountTypeIndividualHint")}
                    </span>
                    <span className="block text-[11px] leading-relaxed text-muted-foreground/80">
                      {type === "business"
                        ? t("auth.signup.businessAsks")
                        : t("auth.signup.individualAsks")}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          className="w-full"
          onClick={() => setStep("credentials")}
        >
          {t("auth.signup.continueWith", { type: userTypeLabel(t, userType) })}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t("auth.signup.haveAccount")}{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("auth.login.link")}
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {t("auth.signup.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("auth.signup.subtitleFor", { type: userTypeLabel(t, userType) })}
        </p>
      </header>

      <button
        type="button"
        onClick={() => setStep("type")}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
      >
        <SelectedTypeIcon className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">{userTypeLabel(t, userType)}</span>
        <span className="underline underline-offset-4">{t("auth.signup.changeType")}</span>
      </button>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="signup-name">{t("auth.field.displayName")}</Label>
          <Input
            id="signup-name"
            required
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder={t("auth.field.displayNamePlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-email">{t("auth.field.email")}</Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-password">{t("auth.field.password")}</Label>
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">{t("auth.field.passwordHint")}</p>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("auth.signup.submit")}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t("auth.signup.haveAccount")}{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("auth.login.link")}
        </button>
      </p>
    </div>
  );
};
