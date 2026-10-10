import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageLoading } from "@/components/common/EmptyState";
import { MultiSelectField } from "@/components/form/MultiSelectField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfile, useUpdateProfile, type ProfilePatch } from "@/hooks/use-profile";
import { useAuth } from "@/providers/auth-provider";
import {
  BUSINESS_MODEL_VALUES,
  CURRENCY_VALUES,
  FOUNDING_EXPERIENCE_VALUES,
  SCALE_VALUES,
  STAGE_VALUES,
  businessModelLabel,
  currencyLabel,
  foundingExperienceLabel,
  scaleLabel,
  stageLabel,
  userTypeLabel,
} from "@/lib/domain/options";
import { USER_TYPES, type UserType } from "@/lib/api/types";

/**
 * Type-specific profile setup. Business accounts describe the company; private
 * founders describe their interest area and capital. Both feed the AI prompt
 * that scopes a project's follow-up questions.
 */
const OnboardingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [userType, setUserType] = useState<UserType>("business");
  const [displayName, setDisplayName] = useState("");
  const [currency, setCurrency] = useState("KRW");
  const [companyName, setCompanyName] = useState("");
  const [businessModels, setBusinessModels] = useState<string[]>([]);
  const [companySize, setCompanySize] = useState("micro");
  const [businessStage, setBusinessStage] = useState("idea");
  const [interestSectors, setInterestSectors] = useState<string[]>([]);
  const [foundingExperience, setFoundingExperience] = useState("none");
  const [plannedInvestment, setPlannedInvestment] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setUserType(profile.user_type === "business" ? "business" : "individual");
    setDisplayName(profile.display_name ?? "");
    setCurrency(profile.currency ?? "KRW");
    setCompanyName(profile.company_name ?? "");
    setBusinessModels(profile.business_models ?? []);
    setCompanySize(profile.company_size ?? "micro");
    setBusinessStage(profile.business_stage ?? "idea");
    setInterestSectors(profile.interest_sectors ?? []);
    setFoundingExperience(profile.founding_experience ?? "none");
    setPlannedInvestment(
      profile.planned_investment === null || profile.planned_investment === undefined
        ? ""
        : String(profile.planned_investment),
    );
  }, [profile]);

  const businessModelOptions = useMemo(
    () => BUSINESS_MODEL_VALUES.map((value) => ({ value, label: businessModelLabel(t, value) })),
    [t],
  );

  if (isLoading) return <PageLoading />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const plannedInvestmentValue =
      plannedInvestment.trim() === "" ? null : Number(plannedInvestment);

    const patch: ProfilePatch = {
      user_type: userType,
      display_name: displayName.trim(),
      currency,
      onboarding_completed: true,
      ...(userType === "business"
        ? {
            company_name: companyName.trim() || null,
            company_size: companySize,
            business_stage: businessStage,
            business_models: businessModels,
          }
        : {
            interest_sectors: interestSectors,
            founding_experience: foundingExperience,
            planned_investment:
              plannedInvestmentValue !== null && Number.isFinite(plannedInvestmentValue)
                ? plannedInvestmentValue
                : null,
          }),
    };

    try {
      await updateProfile.mutateAsync(patch);
      navigate("/dashboard", { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("common.unknownError"));
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {t("onboarding.eyebrow")}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("onboarding.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("onboarding.subtitle")}</p>
        </div>

        <Card className="shadow-panel">
          <CardContent className="pt-6">
            {error ? (
              <Alert variant="destructive" className="mb-5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-foreground">
                  {t("auth.field.accountType")}
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {USER_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={userType === type}
                      onClick={() => setUserType(type)}
                      className={
                        userType === type
                          ? "rounded-md border border-primary bg-accent px-3 py-2 text-left text-sm font-medium text-primary"
                          : "rounded-md border border-border bg-card px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:border-primary/40"
                      }
                    >
                      {userTypeLabel(t, type)}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="displayName">{t("auth.field.displayName")}</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">{t("settings.field.currency")}</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_VALUES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {currencyLabel(t, value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {userType === "business" ? (
                <div className="space-y-6 border-t border-border pt-6">
                  <h2 className="text-sm font-semibold text-foreground">
                    {t("onboarding.business.section")}
                  </h2>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">{t("onboarding.business.companyName")}</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                      placeholder={t("onboarding.business.companyNamePlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("onboarding.business.models")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("onboarding.business.modelsHint")}
                    </p>
                    <MultiSelectField
                      options={businessModelOptions}
                      value={businessModels}
                      onChange={setBusinessModels}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companySize">{t("onboarding.business.size")}</Label>
                      <Select value={companySize} onValueChange={setCompanySize}>
                        <SelectTrigger id="companySize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SCALE_VALUES.map((value) => (
                            <SelectItem key={value} value={value}>
                              {scaleLabel(t, value)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessStage">{t("onboarding.business.stage")}</Label>
                      <Select value={businessStage} onValueChange={setBusinessStage}>
                        <SelectTrigger id="businessStage">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STAGE_VALUES.map((value) => (
                            <SelectItem key={value} value={value}>
                              {stageLabel(t, value)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 border-t border-border pt-6">
                  <h2 className="text-sm font-semibold text-foreground">
                    {t("onboarding.individual.section")}
                  </h2>

                  <div className="space-y-2">
                    <Label>{t("onboarding.individual.sectors")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("onboarding.individual.sectorsHint")}
                    </p>
                    <MultiSelectField
                      options={businessModelOptions}
                      value={interestSectors}
                      onChange={setInterestSectors}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="foundingExperience">
                        {t("onboarding.individual.experience")}
                      </Label>
                      <Select value={foundingExperience} onValueChange={setFoundingExperience}>
                        <SelectTrigger id="foundingExperience">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FOUNDING_EXPERIENCE_VALUES.map((value) => (
                            <SelectItem key={value} value={value}>
                              {foundingExperienceLabel(t, value)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plannedInvestment">
                        {t("onboarding.individual.plannedInvestment")}
                      </Label>
                      <Input
                        id="plannedInvestment"
                        className="tabular"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        value={plannedInvestment}
                        onChange={(event) => setPlannedInvestment(event.target.value)}
                        placeholder={t("onboarding.individual.plannedInvestmentPlaceholder")}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-border pt-6">
                <Button
                  type="submit"
                  disabled={updateProfile.isPending}
                  aria-busy={updateProfile.isPending}
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {t("onboarding.submit")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          {user?.email ? t("onboarding.signedInAs", { email: user.email }) : null}
        </p>
      </div>
    </div>
  );
};

export default OnboardingPage;
