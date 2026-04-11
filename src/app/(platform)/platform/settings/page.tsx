import { Bell, CreditCard, Globe, Save, Shield } from "lucide-react";
import { LanguageSwitcher } from "@/components/marketing/LanguageSwitcher";
import { PlatformMobileHero } from "@/features/platform/components/PlatformMobilePrimitives";
import { getPlatformSettings } from "@/features/platform/queries";
import { savePlatformSettingsAction } from "@/features/platform/actions";

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  name,
  title,
  description,
  enabled,
}: {
  name: string;
  title: string;
  description: string;
  enabled: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 p-3">
      <div>
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <input type="checkbox" name={name} defaultChecked={enabled} className="h-4 w-4" />
    </label>
  );
}

export default async function PlatformSettingsPage() {
  const settings = await getPlatformSettings();

  return (
    <form action={savePlatformSettingsAction} className="space-y-5">
      <div className="md:hidden">
        <PlatformMobileHero
          eyebrow="Governance Settings"
          title="Network Policy and Defaults"
          description="Configure platform-wide governance, security posture, reporting defaults, and billing policy."
          badge="Executive controls"
        />
      </div>

      <div className="hidden flex-col justify-between gap-3 md:flex md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Governance Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage policy controls that apply across conferences, unions, and all churches.
          </p>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SettingsCard
          icon={Globe}
          title="Platform Identity and Defaults"
          description="Network-level naming, support, language, and timezone defaults"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Platform name</label>
              <input
                name="platform_name"
                defaultValue={settings?.platform_name ?? "MPG Church System"}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Support email</label>
              <input
                name="support_email"
                defaultValue={settings?.support_email ?? ""}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Default timezone</label>
              <input
                name="default_timezone"
                defaultValue={settings?.default_timezone ?? "UTC"}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Default language</label>
              <select
                name="default_language"
                defaultValue={settings?.default_language ?? "en"}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="fr">French</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Preview Language Switcher</label>
              <div className="flex items-center gap-4 rounded-md border border-gray-200 bg-gray-50 p-3">
                <span className="text-sm text-gray-600">This is how users will see the language toggle:</span>
                <LanguageSwitcher variant="buttons" />
              </div>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          icon={Shield}
          title="Security and Authority"
          description="Global security posture and cross-church governance safeguards"
        >
          <div className="space-y-4">
            <ToggleRow
              name="require_strong_passwords"
              title="Require strong passwords"
              description="Enforce stronger password quality for platform users."
              enabled={settings?.require_strong_passwords ?? true}
            />
            <ToggleRow
              name="allow_platform_admin_override"
              title="Allow platform-level oversight access"
              description="Permit authorized platform leaders to access churches for governance intervention."
              enabled={settings?.allow_platform_admin_override ?? true}
            />
            <ToggleRow
              name="enable_login_alerts"
              title="Enable login alerts"
              description="Notify admins about suspicious or notable logins."
              enabled={settings?.enable_login_alerts ?? false}
            />
          </div>
        </SettingsCard>

        <SettingsCard
          icon={Bell}
          title="Executive Notifications"
          description="Control which network-level events trigger alerts for platform leadership"
        >
          <div className="space-y-4">
            <ToggleRow
              name="notify_new_church_registration"
              title="New church registration"
              description="Alert platform owner whenever a new church joins."
              enabled={settings?.notify_new_church_registration ?? true}
            />
            <ToggleRow
              name="notify_support_ticket_alerts"
              title="Support ticket alerts"
              description="Notify when new support tickets are created."
              enabled={settings?.notify_support_ticket_alerts ?? true}
            />
            <ToggleRow
              name="notify_billing_reminders"
              title="Billing reminders"
              description="Send reminders for plan renewals and payment issues."
              enabled={settings?.notify_billing_reminders ?? false}
            />
          </div>
        </SettingsCard>

        <SettingsCard
          icon={CreditCard}
          title="Billing and Plan Governance"
          description="Network commercial defaults for trial and renewal governance"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Default plan code</label>
              <input
                name="default_plan_code"
                defaultValue={settings?.default_plan_code ?? "starter"}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Trial duration (days)</label>
              <input
                name="trial_duration_days"
                type="number"
                defaultValue={settings?.trial_duration_days ?? 14}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Grace period (days)</label>
              <input
                name="grace_period_days"
                type="number"
                defaultValue={settings?.grace_period_days ?? 7}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </SettingsCard>
      </div>

      <div className="md:hidden">
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>
    </form>
  );
}
