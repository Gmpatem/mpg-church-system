"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Church, User, Shield, Wallet } from "lucide-react";
import { useI18n } from "@/features/i18n";
import { useActionState } from "react";
import { updateStaffSelfProfileAction } from "@/features/staff-profile/actions";
import type { StaffSelfProfileData } from "@/features/staff-profile/queries";
import { CHURCH_GENDER_OPTIONS } from "@/lib/domain/church-gender";
import {
  updateTreasuryFinanceSettingsAction,
  getTreasuryFinanceSettingsAction,
  getTreasuryRemittanceSettingsAction,
  updateTreasuryRemittanceSettingsAction,
  runTreasuryRemittanceNowAction,
} from "@/features/treasury/actions";
import type {
  TreasuryFinanceSettings,
  TreasuryRemittanceSettings,
} from "@/features/treasury/types";

type TreasuryRemittancePanelData = {
  settings: TreasuryRemittanceSettings;
  migrationRequired: boolean;
  lastRunDate: string | null;
  lastAmount: number | null;
  nextExpectedRun: string | null;
  pendingAmount: number;
};

function FinanceSettingsPanel({ churchSlug }: { churchSlug: string }) {
  const { t } = useI18n();
  const [settings, setSettings] = useState<TreasuryFinanceSettings | null>(null);
  const [remittance, setRemittance] = useState<TreasuryRemittancePanelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [state, formAction, isPending] = useActionState(updateTreasuryFinanceSettingsAction, null);
  const [remittanceState, remittanceFormAction, remittancePending] = useActionState(
    updateTreasuryRemittanceSettingsAction,
    null
  );
  const [runState, runFormAction, runPending] = useActionState(
    runTreasuryRemittanceNowAction,
    null
  );

  useEffect(() => {
    async function loadSettings() {
      try {
        const [financeData, remittanceData] = await Promise.all([
          getTreasuryFinanceSettingsAction(churchSlug),
          getTreasuryRemittanceSettingsAction(churchSlug),
        ]);
        setSettings(financeData);
        setRemittance(remittanceData);
      } catch (error) {
        console.error("Failed to load finance settings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [churchSlug, state?.ok, remittanceState?.ok, runState?.ok]);

  const remittanceSettings = remittance?.settings ?? {
    is_enabled: false,
    is_live: false,
    tithe_enabled: true,
    tithe_percentage: 100,
    offering_enabled: false,
    offering_percentage: 100,
    source_type: "tithe" as const,
    percentage: 100,
    fixed_amount: null,
    destination: "conference" as const,
    frequency: "manual" as const,
    mode: "auto_create" as const,
    allow_override: true,
    updated_at: null,
  };

  const formatCurrency = (value: number | null) =>
    value === null
      ? "—"
      : value.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="p-8 text-center text-slate-500">
          {t.common.loading}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <CardTitle>{t.pages.settings.tabs.finance}</CardTitle>
        </div>
        <CardDescription>{t.pages.settings.financeSettingsDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="churchSlug" value={churchSlug} />
          
          {state && !state.ok ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          ) : null}
          
          {state && state.ok ? (
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {state.message}
            </div>
          ) : null}

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-900">{t.pages.settings.autoAllocation}</h4>
            <p className="text-sm text-slate-600">{t.pages.settings.autoAllocationDesc}</p>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                <div>
                  <Label className="text-sm font-medium text-slate-900">{t.pages.settings.titheAutoAllocate}</Label>
                  <p className="text-xs text-slate-500">{t.pages.settings.titheAutoAllocateDesc}</p>
                </div>
                <select
                  name="tithe_auto_allocate"
                  defaultValue={settings?.tithe_auto_allocate ? "true" : "false"}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="true">{t.common.yes}</option>
                  <option value="false">{t.common.no}</option>
                </select>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                <div>
                  <Label className="text-sm font-medium text-slate-900">{t.pages.settings.offeringAutoAllocate}</Label>
                  <p className="text-xs text-slate-500">{t.pages.settings.offeringAutoAllocateDesc}</p>
                </div>
                <select
                  name="offering_auto_allocate"
                  defaultValue={settings?.offering_auto_allocate ? "true" : "false"}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="true">{t.common.yes}</option>
                  <option value="false">{t.common.no}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-900">{t.pages.settings.validationRules}</h4>
            <p className="text-sm text-slate-600">{t.pages.settings.validationRulesDesc}</p>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                <div>
                  <Label className="text-sm font-medium text-slate-900">{t.pages.settings.requireReferenceNumbers}</Label>
                  <p className="text-xs text-slate-500">{t.pages.settings.requireReferenceNumbersDesc}</p>
                </div>
                <select
                  name="require_reference_numbers"
                  defaultValue={settings?.require_reference_numbers ? "true" : "false"}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="true">{t.common.yes}</option>
                  <option value="false">{t.common.no}</option>
                </select>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                <div>
                  <Label className="text-sm font-medium text-slate-900">{t.pages.settings.requireMemberForNamedInflows}</Label>
                  <p className="text-xs text-slate-500">{t.pages.settings.requireMemberForNamedInflowsDesc}</p>
                </div>
                <select
                  name="require_member_for_named_inflows"
                  defaultValue={settings?.require_member_for_named_inflows ? "true" : "false"}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="true">{t.common.yes}</option>
                  <option value="false">{t.common.no}</option>
                </select>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 md:col-span-2">
                <div>
                  <Label className="text-sm font-medium text-slate-900">{t.pages.settings.allowTitheOutflowOnlyForRemittance}</Label>
                  <p className="text-xs text-slate-500">{t.pages.settings.allowTitheOutflowOnlyForRemittanceDesc}</p>
                </div>
                <select
                  name="allow_tithe_outflow_only_for_remittance"
                  defaultValue={settings?.allow_tithe_outflow_only_for_remittance ? "true" : "false"}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="true">{t.common.yes}</option>
                  <option value="false">{t.common.no}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? t.common.loading : t.common.save}
            </Button>
          </div>
        </form>

        <div className="mt-8 space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Automatic Remittance
            </h4>
            <p className="mt-1 text-xs text-slate-600">
              Configure automatic remittance for tithe and sabbath offering allocations.
            </p>
          </div>

          {remittance && remittance.migrationRequired ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Automatic remittance requires database migration. Apply{" "}
              <code>database/rls/20260425_treasury_auto_remittance.sql</code>.
            </div>
          ) : null}

          {remittanceState && !remittanceState.ok ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {remittanceState.error}
            </div>
          ) : null}
          {remittanceState && remittanceState.ok ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {remittanceState.message}
            </div>
          ) : null}
          {runState && !runState.ok ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {runState.error}
            </div>
          ) : null}
          {runState && runState.ok ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {runState.message}
            </div>
          ) : null}

          <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 md:grid-cols-3">
            <div>
              <p className="font-medium text-slate-900">Last remittance</p>
              <p>{remittance?.lastRunDate || "Never"}</p>
              <p className="text-slate-500">Amount: {formatCurrency(remittance?.lastAmount ?? null)}</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Pending</p>
              <p>{formatCurrency(remittance?.pendingAmount ?? 0)}</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Next expected run</p>
              <p>{remittance?.nextExpectedRun || "Manual trigger"}</p>
            </div>
          </div>

          <form action={remittanceFormAction} className="space-y-4">
            <input type="hidden" name="churchSlug" value={churchSlug} />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="remittance-enabled">Enable Auto Remittance</Label>
                <select
                  id="remittance-enabled"
                  name="is_enabled"
                  defaultValue={remittanceSettings.is_enabled ? "true" : "false"}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="true">{t.common.yes}</option>
                  <option value="false">{t.common.no}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="remittance-source">Remittance Source</Label>
                <select
                  id="remittance-source"
                  name="source_type"
                  defaultValue={remittanceSettings.source_type}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="tithe">Tithe</option>
                  <option value="offering">Sabbath Offering</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="remittance-percentage">Remittance Percentage</Label>
                <Input
                  id="remittance-percentage"
                  name="percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  defaultValue={remittanceSettings.percentage}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="remittance-fixed">
                  Fixed Amount (optional override)
                </Label>
                <Input
                  id="remittance-fixed"
                  name="fixed_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={remittanceSettings.fixed_amount ?? ""}
                  placeholder="Leave blank to use percentage"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="remittance-destination">Destination</Label>
                <select
                  id="remittance-destination"
                  name="destination"
                  defaultValue={remittanceSettings.destination}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="conference">Conference</option>
                  <option value="mission">Mission</option>
                  <option value="union">Union</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="remittance-frequency">Frequency</Label>
                <select
                  id="remittance-frequency"
                  name="frequency"
                  defaultValue={remittanceSettings.frequency}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="manual">Manual trigger</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="remittance-mode">Mode</Label>
                <select
                  id="remittance-mode"
                  name="mode"
                  defaultValue={remittanceSettings.mode}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="auto_create">Auto-create</option>
                  <option value="auto_process">Auto-process</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="remittance-override">Allow manual override</Label>
                <select
                  id="remittance-override"
                  name="allow_override"
                  defaultValue={remittanceSettings.allow_override ? "true" : "false"}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="true">{t.common.yes}</option>
                  <option value="false">{t.common.no}</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={remittancePending}>
                {remittancePending ? t.common.loading : "Save Remittance Settings"}
              </Button>
            </div>
          </form>

          <form action={runFormAction}>
            <input type="hidden" name="churchSlug" value={churchSlug} />
            <input type="hidden" name="manualOverride" value="true" />
            <Button type="submit" variant="outline" disabled={runPending}>
              {runPending ? "Running..." : "Run Remittance Now"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

type SettingsTab = "church" | "profile" | "security" | "finance";

const EMPTY_GENDER_VALUE = "__none";

type ChurchData = {
  name: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  timezone: string;
  default_language: string;
};

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Africa/Lagos",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-600">{message}</p>;
}

export function SettingsTabs({
  church,
  staffProfile,
}: {
  church: ChurchData;
  staffProfile: StaffSelfProfileData;
}) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<SettingsTab>("church");
  const [profileState, profileFormAction, profilePending] = useActionState(
    updateStaffSelfProfileAction,
    null
  );
  const profileErrors = profileState?.ok === false ? profileState.fieldErrors ?? {} : {};
  const memberProfile = staffProfile.member;
  
  const TABS: Array<{ key: SettingsTab; label: string }> = [
    { key: "church", label: t.pages.settings.tabs.church },
    { key: "profile", label: t.pages.settings.tabs.profile },
    { key: "security", label: t.pages.settings.tabs.security },
    { key: "finance", label: t.pages.settings.tabs.finance },
  ];

  return (
    <div className="space-y-4 md:flex md:items-start md:gap-6 md:space-y-0">
      <div className="md:w-52 md:shrink-0">
        <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-col md:overflow-visible md:px-0 md:pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={
                activeTab === tab.key
                  ? "mobile-touch-feedback shrink-0 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary md:w-full md:rounded-xl md:px-3"
                  : "mobile-touch-feedback shrink-0 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground md:w-full md:rounded-xl md:border-transparent md:bg-transparent md:px-3"
              }
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-w-0 flex-1">
        {activeTab === "church" ? (
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Church className="h-5 w-5 text-primary" />
                <CardTitle>{t.pages.settings.churchInfo}</CardTitle>
              </div>
              <CardDescription>{t.settings.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t.settings.churchName}</Label>
                  <Input id="name" defaultValue={church.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">{t.settings.slug}</Label>
                  <Input id="slug" defaultValue={church.slug} disabled />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">{t.common.email}</Label>
                  <Input id="email" type="email" defaultValue={church.email || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t.common.phone}</Label>
                  <Input id="phone" defaultValue={church.phone || ""} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t.settings.churchInfo}</Label>
                <Input id="address" defaultValue={church.address || ""} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">{t.common.city}</Label>
                  <Input id="city" defaultValue={church.city || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">{t.common.country}</Label>
                  <Input id="country" defaultValue={church.country || ""} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timezone">{t.settings.timezone}</Label>
                  <Select defaultValue={church.timezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">{t.settings.language}</Label>
                  <Select defaultValue={church.default_language}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>{t.pages.settings.saveChanges}</Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {activeTab === "profile" ? (
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>{t.pages.settings.userProfile}</CardTitle>
              </div>
              <CardDescription>{t.pages.settings.userProfileDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={profileFormAction} className="space-y-6">
                <input type="hidden" name="churchSlug" value={church.slug} />

                {profileState && !profileState.ok ? (
                  <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {profileState.error}
                  </div>
                ) : null}

                {profileState && profileState.ok ? (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {profileState.message}
                  </div>
                ) : null}

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {t.pages.settings.profileSummary}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {memberProfile
                      ? t.pages.settings.profileLinkedMember
                      : t.pages.settings.profileNoLinkedMember}
                  </p>
                </div>

                <section className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      {t.pages.settings.personalInformation}
                    </h4>
                    <p className="mt-1 text-sm text-slate-600">
                      {t.pages.settings.personalInformationDesc}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="staff-full-name">{t.pages.settings.fullName}</Label>
                      <Input
                        id="staff-full-name"
                        name="fullName"
                        defaultValue={staffProfile.profile.fullName ?? ""}
                      />
                      <FieldError message={profileErrors.fullName} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="staff-email">{t.common.email}</Label>
                      <Input
                        id="staff-email"
                        value={staffProfile.profile.email ?? memberProfile?.email ?? ""}
                        readOnly
                        className="bg-slate-50 text-slate-500"
                      />
                      <p className="text-xs text-slate-500">
                        {t.pages.settings.emailChangeNotice}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="staff-phone">{t.common.phone}</Label>
                      <Input
                        id="staff-phone"
                        name="phone"
                        defaultValue={staffProfile.profile.phone ?? memberProfile?.phone ?? ""}
                      />
                      <FieldError message={profileErrors.phone} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="staff-language">{t.pages.settings.preferredLanguage}</Label>
                      <Select
                        name="preferredLanguage"
                        defaultValue={staffProfile.profile.preferredLanguage}
                      >
                        <SelectTrigger id="staff-language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError message={profileErrors.preferredLanguage} />
                    </div>

                    {memberProfile ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="staff-display-name">
                            {t.pages.settings.displayName}
                          </Label>
                          <Input
                            id="staff-display-name"
                            name="displayName"
                            defaultValue={memberProfile.displayName ?? ""}
                          />
                          <FieldError message={profileErrors.displayName} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="staff-date-of-birth">
                            {t.pages.settings.dateOfBirth}
                          </Label>
                          <Input
                            id="staff-date-of-birth"
                            name="dateOfBirth"
                            type="date"
                            defaultValue={memberProfile.dateOfBirth ?? ""}
                          />
                          <FieldError message={profileErrors.dateOfBirth} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="staff-gender">{t.pages.settings.gender}</Label>
                          <Select
                            name="gender"
                            defaultValue={memberProfile.gender ?? EMPTY_GENDER_VALUE}
                          >
                            <SelectTrigger id="staff-gender">
                              <SelectValue placeholder={t.pages.settings.selectGender} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={EMPTY_GENDER_VALUE}>
                                {t.pages.settings.notSpecified}
                              </SelectItem>
                              {CHURCH_GENDER_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.value === "male"
                                    ? t.pages.settings.genderMale
                                    : t.pages.settings.genderFemale}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FieldError message={profileErrors.gender} />
                        </div>
                      </>
                    ) : null}
                  </div>
                </section>

                {memberProfile ? (
                  <>
                    <section className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          {t.pages.settings.contactInformation}
                        </h4>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="staff-address">{t.common.address}</Label>
                          <Input
                            id="staff-address"
                            name="address"
                            defaultValue={memberProfile.address ?? ""}
                          />
                          <FieldError message={profileErrors.address} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="staff-city">{t.common.city}</Label>
                          <Input
                            id="staff-city"
                            name="city"
                            defaultValue={memberProfile.city ?? ""}
                          />
                          <FieldError message={profileErrors.city} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="staff-country">{t.common.country}</Label>
                          <Input
                            id="staff-country"
                            name="country"
                            defaultValue={memberProfile.country ?? ""}
                          />
                          <FieldError message={profileErrors.country} />
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          {t.pages.settings.emergencyContact}
                        </h4>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="staff-emergency-name">
                            {t.pages.settings.emergencyContactName}
                          </Label>
                          <Input
                            id="staff-emergency-name"
                            name="emergencyContactName"
                            defaultValue={memberProfile.emergencyContactName ?? ""}
                          />
                          <FieldError message={profileErrors.emergencyContactName} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="staff-emergency-phone">
                            {t.pages.settings.emergencyContactPhone}
                          </Label>
                          <Input
                            id="staff-emergency-phone"
                            name="emergencyContactPhone"
                            defaultValue={memberProfile.emergencyContactPhone ?? ""}
                          />
                          <FieldError message={profileErrors.emergencyContactPhone} />
                        </div>
                      </div>
                    </section>
                  </>
                ) : null}

                <div className="flex justify-end">
                  <Button type="submit" disabled={profilePending}>
                    {profilePending ? t.common.loading : t.common.save}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : null}

        {activeTab === "security" ? (
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>{t.pages.settings.tabs.security}</CardTitle>
              </div>
              <CardDescription>{t.auth.password}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">{t.auth.password}</Label>
                  <Input id="current_password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">{t.auth.password}</Label>
                  <Input id="new_password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">{t.auth.confirmPassword}</Label>
                  <Input id="confirm_password" type="password" />
                </div>
                <div className="flex justify-end">
                  <Button>{t.common.save}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {activeTab === "finance" ? (
          <FinanceSettingsPanel churchSlug={church.slug} />
        ) : null}
      </div>
    </div>
  );
}
