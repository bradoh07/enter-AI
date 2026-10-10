import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertCircle, Loader2, LogOut, Save } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { PageLoading } from "@/components/common/EmptyState";
import { MultiSelectField } from "@/components/form/MultiSelectField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/providers/auth-provider";
import { useProfile, useUpdateProfile, type ProfilePatch } from "@/hooks/use-profile";
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
import {
  DEFAULT_PROFILE_ASSUMPTIONS,
  PROFILE_ASSUMPTION_KEYS,
  type ProfileAssumptionKey,
} from "@/lib/simulation/defaults";
import { intakeFieldHelp, intakeFieldLabel } from "@/lib/domain/intake-fields";
import { USER_TYPES, type UserType } from "@/lib/api/types";

const assumptionLabelKey = (key: ProfileAssumptionKey) => key;

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [userType, setUserType] = useState<UserType>("business");
  const [displayName, setDisplayName] = useState("");
  const [currency, setCurrency] = useState("KRW");
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState("micro");
  const [businessStage, setBusinessStage] = useState("idea");
  const [businessModels, setBusinessModels] = useState<string[]>([]);
  const [interestSectors, setInterestSectors] = useState<string[]>([]);
  const [foundingExperience, setFoundingExperience] = useState("none");
  const [plannedInvestment, setPlannedInvestment] = useState("");
  const [assumptions, setAssumptions] = useState<Record<ProfileAssumptionKey, string>>({
    taxRatePct: String(DEFAULT_PROFILE_ASSUMPTIONS.taxRatePct),
    discountRatePct: String(DEFAULT_PROFILE_ASSUMPTIONS.discountRatePct),
    workingCapitalMonths: String(DEFAULT_PROFILE_ASSUMPTIONS.workingCapitalMonths),
    overheadPct: String(DEFAULT_PROFILE_ASSUMPTIONS.overheadPct),
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setUserType(profile.user_type === "business" ? "business" : "individual");
    setDisplayName(profile.display_name ?? "");
    setCurrency(profile.currency ?? "KRW");
    setCompanyName(profile.company_name ?? "");
    setCompanySize(profile.company_size ?? "micro");
    setBusinessStage(profile.business_stage ?? "idea");
    setBusinessModels(profile.business_models ?? []);
    setInterestSectors(profile.interest_sectors ?? []);
    setFoundingExperience(profile.founding_experience ?? "none");
    setPlannedInvestment(
      profile.planned_investment === null || profile.planned_investment === undefined
        ? ""
        : String(profile.planned_investment),
    );

    const stored = (profile.default_assumptions ?? {}) as Record<string, unknown>;
    setAssumptions(
      PROFILE_ASSUMPTION_KEYS.reduce(
        (accumulator, key) => {
          const value = Number(stored[key]);
          accumulator[key] = String(
            Number.isFinite(value) ? value : DEFAULT_PROFILE_ASSUMPTIONS[key],
          );
          return accumulator;
        },
        { ...assumptions },
      ),
    );
    // Re-sync only when the profile identity or its stored values change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const defaultAssumptions = PROFILE_ASSUMPTION_KEYS.reduce(
      (accumulator, key) => {
        const value = Number(assumptions[key]);
        accumulator[key] = Number.isFinite(value) ? value : DEFAULT_PROFILE_ASSUMPTIONS[key];
        return accumulator;
      },
      {} as Record<ProfileAssumptionKey, number>,
    );

    const patch: ProfilePatch = {
      user_type: userType,
      display_name: displayName.trim(),
      currency,
      default_assumptions: defaultAssumptions,
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
      toast.success(t("settings.toast.saved"));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("common.unknownError"));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("settings.title")} description={t("settings.subtitle")} />

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <SectionCard title={t("settings.section.profile")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settingsDisplayName">{t("auth.field.displayName")}</Label>
              <Input
                id="settingsDisplayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settingsCurrency">{t("settings.field.currency")}</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="settingsCurrency">
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

          <div className="mt-5 space-y-2">
            <Label>{t("auth.field.accountType")}</Label>
            <div className="flex flex-wrap gap-2">
              {USER_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={userType === type}
                  onClick={() => setUserType(type)}
                  className={
                    userType === type
                      ? "rounded-md border border-primary bg-accent px-3 py-1.5 text-sm font-medium text-primary"
                      : "rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground hover:border-primary/40"
                  }
                >
                  {userTypeLabel(t, type)}
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        {userType === "business" ? (
          <SectionCard title={t("settings.section.business")}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="settingsCompanyName">{t("onboarding.business.companyName")}</Label>
                <Input
                  id="settingsCompanyName"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("onboarding.business.models")}</Label>
                <MultiSelectField
                  options={businessModelOptions}
                  value={businessModels}
                  onChange={setBusinessModels}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="settingsCompanySize">{t("onboarding.business.size")}</Label>
                  <Select value={companySize} onValueChange={setCompanySize}>
                    <SelectTrigger id="settingsCompanySize">
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
                  <Label htmlFor="settingsBusinessStage">{t("onboarding.business.stage")}</Label>
                  <Select value={businessStage} onValueChange={setBusinessStage}>
                    <SelectTrigger id="settingsBusinessStage">
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
          </SectionCard>
        ) : (
          <SectionCard title={t("settings.section.individual")}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("onboarding.individual.sectors")}</Label>
                <MultiSelectField
                  options={businessModelOptions}
                  value={interestSectors}
                  onChange={setInterestSectors}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="settingsExperience">
                    {t("onboarding.individual.experience")}
                  </Label>
                  <Select value={foundingExperience} onValueChange={setFoundingExperience}>
                    <SelectTrigger id="settingsExperience">
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
                  <Label htmlFor="settingsPlannedInvestment">
                    {t("onboarding.individual.plannedInvestment")}
                  </Label>
                  <Input
                    id="settingsPlannedInvestment"
                    className="tabular"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={plannedInvestment}
                    onChange={(event) => setPlannedInvestment(event.target.value)}
                  />
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        <SectionCard
          title={t("settings.section.assumptions")}
          description={t("settings.section.assumptionsDescription")}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROFILE_ASSUMPTION_KEYS.map((key) => (
              <div key={assumptionLabelKey(key)} className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  {intakeFieldLabel(t, key)}
                </Label>
                <Input
                  className="tabular"
                  type="number"
                  inputMode="decimal"
                  step={0.5}
                  min={0}
                  value={assumptions[key]}
                  onChange={(event) =>
                    setAssumptions((current) => ({ ...current, [key]: event.target.value }))
                  }
                />
                <p className="text-[11px] leading-snug text-muted-foreground">
                  {intakeFieldHelp(t, key)}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={() => void signOut()}>
            <LogOut className="h-4 w-4" />
            {t("auth.signOut")}
          </Button>
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {t("common.save")}
          </Button>
        </div>
      </form>

      <p className="text-xs text-muted-foreground">
        {t("settings.signedInAs", { email: user?.email ?? "" })} · {i18n.language}
      </p>
    </div>
  );
};

export default SettingsPage;
