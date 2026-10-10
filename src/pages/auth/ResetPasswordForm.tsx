import { useState, type FormEvent } from "react";
import { AlertCircle, ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth-provider";

/**
 * Account recovery. The screen only ever reports that the request was accepted
 * — whether the message arrives is not something this app can observe, so it
 * never claims an email was delivered.
 */
export const ResetPasswordForm = ({ onBackToLogin }: { onBackToLogin: () => void }) => {
  const { t } = useTranslation();
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const message = await requestPasswordReset(email.trim());
    setSubmitting(false);
    if (message) {
      setError(message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="space-y-6">
        <header className="space-y-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-primary">
            <MailCheck className="h-5 w-5" />
          </span>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            {t("auth.reset.sentTitle")}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("auth.reset.sentDescription", { email: email.trim() })}
          </p>
        </header>

        <Button type="button" variant="outline" className="w-full" onClick={onBackToLogin}>
          <ArrowLeft className="h-4 w-4" />
          {t("auth.reset.back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {t("auth.reset.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("auth.reset.subtitle")}</p>
      </header>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="reset-email">{t("auth.field.email")}</Label>
          <Input
            id="reset-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("auth.reset.submit")}
        </Button>
      </form>

      <Button type="button" variant="ghost" className="w-full" onClick={onBackToLogin}>
        <ArrowLeft className="h-4 w-4" />
        {t("auth.reset.back")}
      </Button>
    </div>
  );
};
