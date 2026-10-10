import { useState, type FormEvent } from "react";
import { AlertCircle, Building2, Loader2, User } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { AuthShell } from "../auth/AuthShell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import { USER_TYPES, type UserType } from "@/lib/api/types";
import { userTypeLabel } from "@/lib/domain/options";

const typeIcon = (type: UserType) => (type === "business" ? Building2 : User);

/**
 * Sign-up starts by fixing the account type, because everything downstream —
 * which profile fields are asked for, and how the AI scopes follow-up questions
 * — depends on it.
 */
const SignupPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, initializing, signUp } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<UserType>("business");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!initializing && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const message = await signUp({
      email: email.trim(),
      password,
      userType,
      displayName: displayName.trim(),
    });
    setSubmitting(false);
    if (message) {
      setError(message);
      return;
    }
    navigate("/onboarding", { replace: true });
  };

  return (
    <AuthShell>
      <div className="space-y-6">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("auth.signup.title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("auth.signup.subtitle")}</p>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">
              {t("auth.field.accountType")}
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {USER_TYPES.map((type) => {
                const Icon = typeIcon(type);
                const selected = userType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setUserType(type)}
                    className={cn(
                      "flex items-start gap-2.5 rounded-md border p-3 text-left transition-colors",
                      selected
                        ? "border-primary bg-accent"
                        : "border-border bg-card hover:border-primary/40",
                    )}
                  >
                    <Icon
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        selected ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    <span className="space-y-0.5">
                      <span className="block text-sm font-medium text-foreground">
                        {userTypeLabel(t, type)}
                      </span>
                      <span className="block text-[11px] leading-snug text-muted-foreground">
                        {type === "business"
                          ? t("auth.field.accountTypeBusinessHint")
                          : t("auth.field.accountTypeIndividualHint")}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="displayName">{t("auth.field.displayName")}</Label>
            <Input
              id="displayName"
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={t("auth.field.displayNamePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.field.email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.field.password")}</Label>
            <Input
              id="password"
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
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            {t("auth.login.link")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default SignupPage;
