"use client";

import { useState } from "react";
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
import { Church, User, Shield } from "lucide-react";
import { LanguageSwitcher } from "@/components/marketing/LanguageSwitcher";
import { useI18n } from "@/features/i18n";

type SettingsTab = "church" | "profile" | "security";

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

export function SettingsTabs({ church }: { church: ChurchData }) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<SettingsTab>("church");
  
  const TABS: Array<{ key: SettingsTab; label: string }> = [
    { key: "church", label: t.pages.settings.tabs.church },
    { key: "profile", label: t.pages.settings.tabs.profile },
    { key: "security", label: t.pages.settings.tabs.security },
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
                  ? "mobile-touch-feedback shrink-0 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 md:w-full md:rounded-xl md:border-slate-200 md:bg-slate-100 md:px-3 md:text-slate-900"
                  : "mobile-touch-feedback shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 md:w-full md:rounded-xl md:border-transparent md:bg-transparent md:px-3 md:text-slate-500 md:hover:bg-slate-50 md:hover:text-slate-700"
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
              <CardDescription>{t.navigation.profile}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>{t.pages.settings.preferredLanguage}</Label>
                <div className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex-1">
                    <p className="text-sm text-slate-600">
                      {t.pages.settings.languageDescription}
                    </p>
                  </div>
                  <LanguageSwitcher variant="buttons" syncWithProfile />
                </div>
              </div>
              <div className="flex justify-end">
                <Button>{t.common.save}</Button>
              </div>
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
      </div>
    </div>
  );
}
