"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Home,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  StickyNote,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  assignMemberToHouseholdAction,
  createHouseholdWorkspaceAction,
  setHouseholdHeadAction,
  updateHouseholdAction,
} from "@/features/households/actions";
import type { HouseholdListItem } from "@/features/households/types";
import { useI18n } from "@/features/i18n";
import { cn } from "@/lib/utils/cn";
import {
  ChurchContentGrid,
  ChurchMainPanel,
  ChurchRightRail,
} from "@/components/church-workspace/patterns/ChurchPanels";
import {
  WorkspaceControlRail,
  WorkspaceEmptyState,
  WorkspaceHero,
  WorkspaceSectionCard,
  WorkspaceStatCard,
} from "@/components/workspace";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { MobileBottomSheet } from "@/components/mobile/MobileBottomSheet";

type AssignmentMember = {
  id: string;
  first_name: string;
  last_name: string;
  display_name?: string | null;
  household_id?: string | null;
  household_role?: string | null;
  membership_status: string;
};

interface HouseholdsWorkspaceProps {
  churchSlug: string;
  households: HouseholdListItem[];
  availableMembers: AssignmentMember[];
  canManage: boolean;
}

type HouseholdFilters = {
  q: string;
  headStatus: string;
  size: string;
  location: string;
};

type HouseholdFormValues = {
  household_name: string;
  headMemberId: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  notes: string;
};

const emptyHouseholdFormValues: HouseholdFormValues = {
  household_name: "",
  headMemberId: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  country: "",
  notes: "",
};

function getHouseholdsSelectedStorageKey(churchSlug: string) {
  return `workspace-households-selected:${churchSlug}`;
}

function numberFormat(value: number) {
  return value.toLocaleString("en-US");
}

function formatAverage(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function formatDate(value?: string | null, locale = "en-US") {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getLocationLabel(household: Pick<HouseholdListItem, "city" | "country">) {
  return [household.city, household.country].filter(Boolean).join(", ");
}

function getFullAddress(household: HouseholdListItem) {
  return [household.address, household.city, household.country].filter(Boolean).join(", ");
}

function getHouseholdInitials(household: HouseholdListItem) {
  const words = household.household_name.split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "HH";
}

function getMemberName(member: AssignmentMember) {
  return (
    member.display_name ||
    [member.first_name, member.last_name].filter(Boolean).join(" ") ||
    "Member"
  );
}

function hasActiveFilters(filters: HouseholdFilters) {
  return Boolean(filters.q || filters.headStatus || filters.size || filters.location);
}

function filterHouseholds(households: HouseholdListItem[], filters: HouseholdFilters) {
  const query = filters.q.trim().toLowerCase();

  return households.filter((household) => {
    if (query) {
      const haystack = [
        household.household_name,
        household.head_of_household_name,
        household.phone,
        household.email,
        household.address,
        household.city,
        household.country,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(query)) return false;
    }

    if (filters.headStatus === "with-head" && !household.head_of_household_name) {
      return false;
    }

    if (filters.headStatus === "without-head" && household.head_of_household_name) {
      return false;
    }

    if (filters.size === "solo" && household.member_count !== 1) {
      return false;
    }

    if (filters.size === "small" && (household.member_count < 2 || household.member_count > 4)) {
      return false;
    }

    if (filters.size === "large" && household.member_count < 5) {
      return false;
    }

    if (filters.location) {
      const location = getLocationLabel(household);
      if (location !== filters.location) return false;
    }

    return true;
  });
}

function HouseholdAvatar({
  household,
  size = "sm",
}: {
  household: HouseholdListItem;
  size?: "sm" | "lg";
}) {
  return (
    <Avatar className={cn("shrink-0 border border-border ring-1 ring-primary/10", size === "lg" ? "size-14" : "size-9")}>
      <AvatarFallback className={cn("bg-primary/10 font-semibold text-primary", size === "lg" ? "text-lg" : "text-xs")}>
        {size === "lg" ? <Home className="size-6" aria-hidden="true" /> : getHouseholdInitials(household)}
      </AvatarFallback>
    </Avatar>
  );
}

function MetricStrip({ households }: { households: HouseholdListItem[] }) {
  const totalHouseholds = households.length;
  const totalMembers = households.reduce((sum, household) => sum + household.member_count, 0);
  const withHead = households.filter((household) => household.head_of_household_name).length;
  const withoutHead = totalHouseholds - withHead;
  const averageSize = totalHouseholds > 0 ? totalMembers / totalHouseholds : 0;
  const items = [
    { label: "Total Households", value: numberFormat(totalHouseholds), icon: Home },
    { label: "Members", value: numberFormat(totalMembers), dot: "bg-primary" },
    { label: "With Head", value: numberFormat(withHead), dot: "bg-teal-500" },
    { label: "Without Head", value: numberFormat(withoutHead), dot: "bg-orange-500" },
    { label: "Average Size", value: formatAverage(averageSize), dot: "bg-blue-500" },
  ];

  return (
    <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item, index) => {
        const Icon = "icon" in item ? item.icon : undefined;
        const isQuiet = item.value === "0" || item.value === "0.0";

        return (
          <div key={item.label} className="flex min-w-[128px] shrink-0 items-stretch">
            {index > 0 ? <Separator orientation="vertical" className="h-auto self-stretch" /> : null}
            <div className="flex min-w-0 flex-1 flex-col justify-center px-5 first:pl-0">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                {"dot" in item && item.dot ? (
                  <span className={cn("size-1.5 rounded-full", item.dot)} aria-hidden="true" />
                ) : null}
                <span>{item.label}</span>
              </div>
              <div
                className={cn(
                  "mt-3 flex items-center gap-3 text-2xl font-semibold leading-none tabular-nums text-foreground",
                  isQuiet && "text-muted-foreground/70"
                )}
              >
                {item.value}
                {Icon ? <Icon className="size-4 text-muted-foreground" aria-hidden="true" /> : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HouseholdsSummaryCard({
  churchSlug,
  households,
  canManage,
  onNewHousehold,
  newHouseholdButtonRef,
}: {
  churchSlug: string;
  households: HouseholdListItem[];
  canManage: boolean;
  onNewHousehold: () => void;
  newHouseholdButtonRef: React.Ref<HTMLButtonElement>;
}) {
  const { t } = useI18n();

  return (
    <section className="rounded-2xl border border-border bg-background px-5 py-4 shadow-sm">
      <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
        <MetricStrip households={households} />

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {canManage ? (
            <Button
              ref={newHouseholdButtonRef}
              type="button"
              onClick={onNewHousehold}
              className="h-11 gap-2 rounded-lg px-5 font-semibold shadow-sm"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t.pages.households.addHousehold}
            </Button>
          ) : null}
          <Button asChild variant="outline" className="h-11 gap-2 rounded-lg bg-background px-5">
            <Link href={`/c/${churchSlug}/members`}>
              <Users className="size-4" aria-hidden="true" />
              {t.navigation.members}
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 gap-2 rounded-lg bg-background px-5">
            <Link href={`/c/${churchSlug}/reports`}>
              <BarChart3 className="size-4" aria-hidden="true" />
              {t.pages.membersWorkspace.actions.reports}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onValueChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <Label htmlFor={id} className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
        {label}
      </Label>
      <Select value={value || "__all"} onValueChange={(nextValue) => onValueChange(nextValue === "__all" ? "" : nextValue)}>
        <SelectTrigger id={id} className="h-11 rounded-lg bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>{children}</SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

function HouseholdsFilterCard({
  filters,
  onFiltersChange,
  locationOptions,
  resultCount,
}: {
  filters: HouseholdFilters;
  onFiltersChange: (filters: HouseholdFilters) => void;
  locationOptions: string[];
  resultCount: number;
}) {
  const activeFilters = hasActiveFilters(filters);

  function updateFilter(key: keyof HouseholdFilters, value: string) {
    onFiltersChange({ ...filters, [key]: value });
  }

  function resetFilters() {
    onFiltersChange({ q: "", headStatus: "", size: "", location: "" });
  }

  return (
    <section className="rounded-2xl border border-border bg-background p-4 shadow-sm">
      <form
        className="grid min-w-0 items-end gap-3 md:grid-cols-2 xl:grid-cols-[minmax(300px,1fr)_160px_160px_185px_auto_auto]"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="relative min-w-0 md:col-span-2 xl:col-span-1">
          <label htmlFor="household-q" className="sr-only">
            Search households
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="household-q"
            value={filters.q}
            onChange={(event) => updateFilter("q", event.target.value)}
            placeholder="Search household, head, phone, email, location..."
            className="h-11 rounded-lg pl-9"
          />
        </div>

        <FilterSelect
          id="household-head-status"
          label="Head Status"
          value={filters.headStatus}
          onValueChange={(value) => updateFilter("headStatus", value)}
        >
          <SelectItem value="__all">Any head status</SelectItem>
          <SelectItem value="with-head">With household head</SelectItem>
          <SelectItem value="without-head">No household head</SelectItem>
        </FilterSelect>

        <FilterSelect
          id="household-size"
          label="Household Size"
          value={filters.size}
          onValueChange={(value) => updateFilter("size", value)}
        >
          <SelectItem value="__all">Any size</SelectItem>
          <SelectItem value="solo">1 member</SelectItem>
          <SelectItem value="small">2 to 4 members</SelectItem>
          <SelectItem value="large">5+ members</SelectItem>
        </FilterSelect>

        <FilterSelect
          id="household-location"
          label="Location"
          value={filters.location}
          onValueChange={(value) => updateFilter("location", value)}
        >
          <SelectItem value="__all">Any location</SelectItem>
          {locationOptions.map((location) => (
            <SelectItem key={location} value={location}>
              {location}
            </SelectItem>
          ))}
        </FilterSelect>

        <Button type="submit" variant="outline" className="h-11 gap-2 rounded-lg bg-background px-4">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filters
        </Button>

        <div className="flex items-center gap-1 self-center whitespace-nowrap text-sm text-muted-foreground">
          <span>{numberFormat(resultCount)} results</span>
          {activeFilters ? (
            <Button type="button" variant="link" onClick={resetFilters} className="h-auto px-1 py-0 text-xs">
              Reset
            </Button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function HouseholdIdentityCell({ household }: { household: HouseholdListItem }) {
  const location = getLocationLabel(household);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <HouseholdAvatar household={household} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground" title={household.household_name}>
          {household.household_name}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground" title={location || undefined}>
          {location || "No location"}
        </p>
      </div>
    </div>
  );
}

function HouseholdMembersCell({ household }: { household: HouseholdListItem }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-sm font-semibold tabular-nums text-foreground">
        {numberFormat(household.member_count)}
      </span>
      <span className="text-xs text-muted-foreground">
        {household.member_count === 1 ? "member" : "members"}
      </span>
    </div>
  );
}

function HouseholdRow({
  household,
  isSelected,
  onSelectHousehold,
}: {
  household: HouseholdListItem;
  isSelected: boolean;
  onSelectHousehold: (householdId: string) => void;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectHousehold(household.id);
    }
  }

  return (
    <tr
      tabIndex={0}
      aria-selected={isSelected}
      onClick={() => onSelectHousehold(household.id)}
      onKeyDown={handleKeyDown}
      className={cn(
        "h-[86px] cursor-pointer bg-background outline-none transition-colors hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        isSelected && "bg-primary/[0.045] shadow-[inset_3px_0_0_hsl(var(--primary))] hover:bg-primary/[0.06]"
      )}
    >
      <td className="border-b border-border/70 px-4 py-3 pr-0 align-middle">
        <Checkbox
          checked={isSelected}
          aria-label={`Select ${household.household_name}`}
          onClick={(event) => event.stopPropagation()}
          onCheckedChange={() => onSelectHousehold(household.id)}
        />
      </td>
      <td className="border-b border-border/70 px-3 py-3 align-middle">
        <HouseholdIdentityCell household={household} />
      </td>
      <td className="min-w-0 border-b border-border/70 px-3 py-3 align-middle text-sm">
        <p
          className={cn("truncate text-foreground", !household.head_of_household_name && "text-muted-foreground")}
          title={household.head_of_household_name ?? undefined}
        >
          {household.head_of_household_name || "No household head"}
        </p>
      </td>
      <td className="border-b border-border/70 px-3 py-3 align-middle">
        <HouseholdMembersCell household={household} />
      </td>
      <td className="min-w-0 border-b border-border/70 px-3 py-3 align-middle text-sm">
        <p className={cn("truncate text-foreground", !household.phone && "text-muted-foreground")} title={household.phone ?? undefined}>
          {household.phone || "-"}
        </p>
        <p className={cn("mt-0.5 truncate text-xs text-muted-foreground", !household.email && "text-muted-foreground/70")} title={household.email ?? undefined}>
          {household.email || "No email"}
        </p>
      </td>
      <td className="min-w-0 border-b border-border/70 px-3 py-3 align-middle text-sm text-foreground">
        <p className="truncate" title={getLocationLabel(household) || undefined}>
          {getLocationLabel(household) || "-"}
        </p>
      </td>
      <td className="whitespace-nowrap border-b border-border/70 px-3 py-3 align-middle text-sm text-foreground">
        {formatDate(household.created_at)}
      </td>
    </tr>
  );
}

function HouseholdsRegistryCard({
  churchSlug,
  households,
  selectedHouseholdId,
  onSelectHousehold,
  hasFilters,
  canManage,
  onNewHousehold,
}: {
  churchSlug: string;
  households: HouseholdListItem[];
  selectedHouseholdId: string | null;
  onSelectHousehold: (householdId: string) => void;
  hasFilters: boolean;
  canManage: boolean;
  onNewHousehold: () => void;
}) {
  const { t } = useI18n();
  const start = households.length > 0 ? 1 : 0;
  const end = households.length;

  return (
    <ChurchMainPanel className="min-w-0 overflow-hidden rounded-2xl">
      {households.length === 0 ? (
        <div className="p-4">
          {hasFilters ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
              <h2 className="text-base font-semibold text-foreground">No households match these filters.</h2>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                Try a broader search or reset the filters to return to the household registry.
              </p>
            </div>
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
              <div>
                <h2 className="text-base font-semibold text-foreground">{t.pages.households.noHouseholds}</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  {t.pages.households.description}
                </p>
              </div>
              {canManage ? (
                <Button type="button" onClick={onNewHousehold} className="h-10 rounded-lg">
                  <Plus className="size-4" aria-hidden="true" />
                  {t.pages.households.addHousehold}
                </Button>
              ) : null}
            </div>
          )}
        </div>
      ) : (
        <>
          <TooltipProvider delayDuration={200}>
            <div className="hidden min-w-0 md:block">
              <table className="w-full table-fixed border-separate border-spacing-0 text-left text-sm">
                <colgroup>
                  <col style={{ width: "5%" }} />
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "10%" }} />
                </colgroup>
                <thead>
                  <tr className="h-14 bg-muted/30 text-xs">
                    <th className="border-b border-border px-4 pr-0 text-left align-middle font-medium text-muted-foreground">
                      <Checkbox checked={false} aria-label="Selected household" />
                    </th>
                    <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Household</th>
                    <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Household Head</th>
                    <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Members</th>
                    <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Contact</th>
                    <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Location</th>
                    <th className="border-b border-border px-3 text-left align-middle font-medium text-muted-foreground">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {households.map((household) => (
                    <HouseholdRow
                      key={household.id}
                      household={household}
                      isSelected={household.id === selectedHouseholdId}
                      onSelectHousehold={onSelectHousehold}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </TooltipProvider>

          <div className="flex min-h-[80px] flex-col gap-3 border-t border-border px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {numberFormat(start)} to {numberFormat(end)} of {numberFormat(households.length)} households
            </p>
            <nav className="flex items-center gap-2" aria-label="Household registry pagination">
              <Button type="button" variant="outline" size="icon" className="size-9 rounded-lg" disabled aria-label="Previous page">
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>
              <Button type="button" size="icon" className="size-9 rounded-lg" aria-current="page" aria-label="Page 1">
                1
              </Button>
              <Button type="button" variant="outline" size="icon" className="size-9 rounded-lg" disabled aria-label="Next page">
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </nav>
          </div>
        </>
      )}
    </ChurchMainPanel>
  );
}

function OverviewRow({
  label,
  value,
  title,
}: {
  label: string;
  value: ReactNode;
  title?: string;
}) {
  return (
    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium text-foreground" title={title}>
        {value}
      </dd>
    </div>
  );
}

function SelectedHouseholdActions({
  churchSlug,
  household,
  canManage,
  onEditHousehold,
}: {
  churchSlug: string;
  household: HouseholdListItem;
  canManage: boolean;
  onEditHousehold: () => void;
}) {
  const profileHref = `/c/${churchSlug}/households/${household.id}`;

  return (
    <div className="flex flex-col gap-2 px-4 pb-5 pt-4">
      {canManage ? (
        <Button type="button" onClick={onEditHousehold} className="h-11 w-full gap-2 rounded-lg px-3 font-semibold shadow-sm">
          <Edit3 className="size-4" aria-hidden="true" />
          Edit household
        </Button>
      ) : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" className="h-10 w-full justify-between rounded-lg bg-background px-3">
            <span className="inline-flex items-center gap-2">
              <MoreHorizontal className="size-4" aria-hidden="true" />
              More actions
            </span>
            <ChevronDown className="size-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6} className="w-64 rounded-lg p-1">
          <DropdownMenuGroup>
            <DropdownMenuItem asChild className="h-10 gap-2">
              <Link href={profileHref}>
                <Users className="size-4" aria-hidden="true" />
                Manage members
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="h-10 gap-2">
              <Link href={profileHref}>
                <UserRound className="size-4" aria-hidden="true" />
                Set or change household head
              </Link>
            </DropdownMenuItem>
            {canManage ? (
              <DropdownMenuItem
                className="h-10 gap-2"
                onSelect={(event) => {
                  event.preventDefault();
                  onEditHousehold();
                }}
              >
                <StickyNote className="size-4" aria-hidden="true" />
                View or edit notes
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild className="h-10 gap-2">
              <Link href={profileHref}>
                <Home className="size-4" aria-hidden="true" />
                Open full household profile
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function SelectedHouseholdCard({
  churchSlug,
  household,
  canManage,
  onClearSelectedHousehold,
  onEditHousehold,
  variant = "rail",
}: {
  churchSlug: string;
  household: HouseholdListItem | null;
  canManage: boolean;
  onClearSelectedHousehold?: () => void;
  onEditHousehold: (household: HouseholdListItem) => void;
  variant?: "rail" | "card";
}) {
  const { t } = useI18n();
  const isRail = variant === "rail";

  return (
    <ChurchRightRail
      className={cn(
        "min-w-0 overflow-hidden rounded-2xl",
        isRail ? "hidden self-start xl:block" : "flex min-h-[520px] flex-col rounded-xl"
      )}
    >
      <div className="flex min-h-[58px] items-center justify-between px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Selected Household</h2>
        {onClearSelectedHousehold ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClearSelectedHousehold}
            className="size-8 rounded-md text-muted-foreground"
            aria-label="Close selected household"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>

      {household ? (
        <>
          <Separator />
          <div className="flex items-center gap-4 px-5 py-5">
            <HouseholdAvatar household={household} size="lg" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-lg font-semibold text-foreground" title={household.household_name}>
                  {household.household_name}
                </h3>
                {household.notes ? (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <StickyNote className="size-4 shrink-0 text-muted-foreground" aria-label="Household has notes" />
                      </TooltipTrigger>
                      <TooltipContent>Notes available</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {numberFormat(household.member_count)} {household.member_count === 1 ? "household member" : "household members"}
              </p>
              <p className="mt-2 inline-flex max-w-full items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate" title={getLocationLabel(household) || undefined}>
                  {getLocationLabel(household) || "No location"}
                </span>
              </p>
            </div>
          </div>

          <Separator />
          <div className="px-5 py-5">
            <h4 className="text-sm font-semibold text-foreground">Overview</h4>
            <dl className="mt-4 flex flex-col gap-4">
              <OverviewRow
                label={t.pages.households.table.head}
                value={
                  <span className={cn(!household.head_of_household_name && "text-muted-foreground")}>
                    {household.head_of_household_name || "No household head"}
                  </span>
                }
                title={household.head_of_household_name ?? undefined}
              />
              <OverviewRow
                label={t.pages.households.table.phone}
                value={
                  <span className={cn(!household.phone && "text-muted-foreground")}>
                    {household.phone || "No phone"}
                  </span>
                }
                title={household.phone ?? undefined}
              />
              <OverviewRow
                label="Email"
                value={
                  <span className={cn("block truncate", !household.email && "text-muted-foreground")}>
                    {household.email || "No email"}
                  </span>
                }
                title={household.email ?? undefined}
              />
              <OverviewRow
                label="Address"
                value={
                  <span className={cn("block truncate", !getFullAddress(household) && "text-muted-foreground")}>
                    {getFullAddress(household) || "No address"}
                  </span>
                }
                title={getFullAddress(household) || undefined}
              />
              <OverviewRow label="Created" value={formatDate(household.created_at)} />
            </dl>
          </div>

          <Separator />
          <Link
            href={`/c/${churchSlug}/households/${household.id}`}
            className="flex min-h-[58px] items-center justify-between gap-3 px-5 py-4 text-sm transition hover:bg-muted/35"
          >
            <span className="font-semibold text-foreground">{t.pages.households.table.members}</span>
            <span className="inline-flex min-w-0 items-center gap-1 text-muted-foreground">
              <span className="truncate">
                {household.member_count > 0
                  ? `${numberFormat(household.member_count)} ${household.member_count === 1 ? "member" : "members"}`
                  : "No members"}
              </span>
              <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
            </span>
          </Link>

          <Separator />
          <SelectedHouseholdActions
            churchSlug={churchSlug}
            household={household}
            canManage={canManage}
            onEditHousehold={() => onEditHousehold(household)}
          />
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Home className="size-5" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-foreground">Select a household to view its profile.</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The inspector will show head, contact, location, member summary, and household actions.
          </p>
        </div>
      )}
    </ChurchRightRail>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

function SummaryRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate font-medium text-foreground">{value || <span className="text-muted-foreground">Not provided</span>}</dd>
    </div>
  );
}

function WizardStepIndicator({ currentStep }: { currentStep: number }) {
  const steps = ["Details", "Contact", "Notes", "Review"];

  return (
    <div className="flex items-center gap-3 overflow-x-auto border-b border-border px-6 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isComplete = stepNumber < currentStep;

        return (
          <div key={step} className="flex shrink-0 items-center gap-3">
            {index > 0 ? <Separator className="w-10" /> : null}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border text-xs font-semibold",
                  isActive || isComplete
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground"
                )}
              >
                {stepNumber}
              </span>
              <span className={cn("text-sm font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
                {step}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AddHouseholdWizard({
  open,
  onOpenChange,
  churchSlug,
  availableMembers,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  churchSlug: string;
  availableMembers: AssignmentMember[];
  onCreated: (householdId?: string) => void;
}) {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<HouseholdFormValues>(emptyHouseholdFormValues);
  const [errors, setErrors] = useState<Partial<Record<keyof HouseholdFormValues | "form", string>>>({});
  const [discardOpen, setDiscardOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isDirty = Object.values(values).some((value) => value.trim().length > 0);
  const selectedHead = values.headMemberId
    ? availableMembers.find((member) => member.id === values.headMemberId)
    : null;

  function updateValue(field: keyof HouseholdFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  }

  function resetWizard() {
    setStep(1);
    setValues(emptyHouseholdFormValues);
    setErrors({});
  }

  function requestClose(nextOpen: boolean) {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }

    if (isDirty && !isPending) {
      setDiscardOpen(true);
      return;
    }

    resetWizard();
    onOpenChange(false);
  }

  function focusField(field: keyof HouseholdFormValues) {
    window.requestAnimationFrame(() => {
      document.getElementById(`add-household-${field}`)?.focus();
    });
  }

  function validateStep(targetStep: number) {
    const nextErrors: Partial<Record<keyof HouseholdFormValues | "form", string>> = {};

    if (targetStep === 1 && !values.household_name.trim()) {
      nextErrors.household_name = "Household name is required.";
    }

    if (targetStep === 2 && values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    setErrors(nextErrors);

    if (nextErrors.household_name) focusField("household_name");
    if (nextErrors.email) focusField("email");

    return Object.keys(nextErrors).length === 0;
  }

  function validateBeforeSubmit() {
    const nextErrors: Partial<Record<keyof HouseholdFormValues | "form", string>> = {};

    if (!values.household_name.trim()) {
      nextErrors.household_name = "Household name is required.";
    }

    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    setErrors(nextErrors);

    if (nextErrors.household_name) {
      setStep(1);
      focusField("household_name");
      return false;
    }

    if (nextErrors.email) {
      setStep(2);
      focusField("email");
      return false;
    }

    return true;
  }

  function handleContinue() {
    if (!validateStep(step)) return;
    setStep((current) => Math.min(current + 1, 4));
  }

  function submitForm() {
    if (!validateBeforeSubmit()) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("churchSlug", churchSlug);
      formData.set("household_name", values.household_name.trim());
      formData.set("phone", values.phone.trim());
      formData.set("email", values.email.trim());
      formData.set("address", values.address.trim());
      formData.set("city", values.city.trim());
      formData.set("country", values.country.trim());
      formData.set("notes", values.notes.trim());

      try {
        const result = await createHouseholdWorkspaceAction(formData);

        if (!result.ok) {
          setErrors({ form: result.error });
          return;
        }

        let followUpWarning: string | null = null;

        if (values.headMemberId && result.householdId) {
          try {
            const assignData = new FormData();
            assignData.set("churchSlug", churchSlug);
            assignData.set("householdId", result.householdId);
            assignData.set("memberId", values.headMemberId);
            assignData.set("householdRole", "head");
            await assignMemberToHouseholdAction(assignData);

            const headData = new FormData();
            headData.set("churchSlug", churchSlug);
            headData.set("householdId", result.householdId);
            headData.set("memberId", values.headMemberId);
            await setHouseholdHeadAction(headData);
          } catch (error) {
            followUpWarning =
              error instanceof Error
                ? error.message
                : "Household was created, but the head could not be assigned.";
          }
        }

        toast({
          title: "Household created",
          description: followUpWarning ?? result.message ?? "Household created successfully.",
          variant: followUpWarning ? "destructive" : "default",
        });

        resetWizard();
        onOpenChange(false);
        onCreated(result.householdId);
      } catch (error) {
        setErrors({
          form: error instanceof Error ? error.message : "Failed to create household.",
        });
      }
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={requestClose}>
        <DialogContent className="flex max-h-[88vh] w-[calc(100%-2rem)] max-w-[880px] flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl">
          <div className="shrink-0 px-6 py-5">
            <DialogHeader className="gap-2">
              <DialogTitle>Add Household Wizard</DialogTitle>
              <DialogDescription>Create a household record in a few guided steps.</DialogDescription>
            </DialogHeader>
          </div>

          <WizardStepIndicator currentStep={step} />

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {errors.form ? (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errors.form}
              </div>
            ) : null}

            {step === 1 ? (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="add-household-household_name">
                    Household name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="add-household-household_name"
                    value={values.household_name}
                    onChange={(event) => updateValue("household_name", event.target.value)}
                    aria-invalid={Boolean(errors.household_name)}
                    className="h-11 rounded-lg"
                  />
                  <FieldError message={errors.household_name} />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="add-household-headMemberId">Head of household</Label>
                  <Select
                    value={values.headMemberId || "__none"}
                    onValueChange={(value) => updateValue("headMemberId", value === "__none" ? "" : value)}
                  >
                    <SelectTrigger id="add-household-headMemberId" className="h-11 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="__none">Assign after creation</SelectItem>
                        {availableMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {getMemberName(member)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="add-household-phone">Phone</Label>
                  <Input
                    id="add-household-phone"
                    value={values.phone}
                    onChange={(event) => updateValue("phone", event.target.value)}
                    className="h-11 rounded-lg"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="add-household-email">Email</Label>
                  <Input
                    id="add-household-email"
                    type="email"
                    value={values.email}
                    onChange={(event) => updateValue("email", event.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    className="h-11 rounded-lg"
                  />
                  <FieldError message={errors.email} />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label htmlFor="add-household-address">Address</Label>
                  <Textarea
                    id="add-household-address"
                    value={values.address}
                    onChange={(event) => updateValue("address", event.target.value)}
                    rows={3}
                    className="rounded-lg"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="add-household-city">City</Label>
                  <Input
                    id="add-household-city"
                    value={values.city}
                    onChange={(event) => updateValue("city", event.target.value)}
                    className="h-11 rounded-lg"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="add-household-country">Country</Label>
                  <Input
                    id="add-household-country"
                    value={values.country}
                    onChange={(event) => updateValue("country", event.target.value)}
                    className="h-11 rounded-lg"
                  />
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="flex flex-col gap-5">
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  Additional household members and head changes use the existing household profile actions after creation.
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="add-household-notes">Notes</Label>
                  <Textarea
                    id="add-household-notes"
                    value={values.notes}
                    onChange={(event) => updateValue("notes", event.target.value)}
                    rows={5}
                    className="rounded-lg"
                  />
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="flex flex-col gap-3">
                <SummaryRow label="Household" value={values.household_name} />
                <SummaryRow label="Head" value={selectedHead ? getMemberName(selectedHead) : "Assign after creation"} />
                <SummaryRow label="Phone" value={values.phone} />
                <SummaryRow label="Email" value={values.email} />
                <SummaryRow label="Address" value={[values.address, values.city, values.country].filter(Boolean).join(", ")} />
                <SummaryRow label="Notes" value={values.notes} />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" className="h-9 rounded-lg" onClick={() => setStep(1)}>
                    Edit Details
                  </Button>
                  <Button type="button" variant="outline" className="h-9 rounded-lg" onClick={() => setStep(2)}>
                    Edit Contact
                  </Button>
                  <Button type="button" variant="outline" className="h-9 rounded-lg" onClick={() => setStep(3)}>
                    Edit Notes
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-6 py-4">
            <Button type="button" variant="outline" className="h-10 rounded-lg" onClick={() => requestClose(false)} disabled={isPending}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              {step > 1 ? (
                <Button type="button" variant="outline" className="h-10 rounded-lg" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={isPending}>
                  Back
                </Button>
              ) : null}
              {step < 4 ? (
                <Button type="button" className="h-10 rounded-lg" onClick={handleContinue}>
                  Continue
                </Button>
              ) : (
                <Button type="button" className="h-10 rounded-lg" onClick={submitForm} disabled={isPending}>
                  {isPending ? "Creating..." : "Create Household"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard household changes?</AlertDialogTitle>
            <AlertDialogDescription>
              The household details entered in this wizard will be cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDiscardOpen(false);
                resetWizard();
                onOpenChange(false);
              }}
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EditHouseholdDialog({
  open,
  onOpenChange,
  churchSlug,
  household,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  churchSlug: string;
  household: HouseholdListItem | null;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<HouseholdFormValues>(emptyHouseholdFormValues);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!household || !open) return;
    setValues({
      household_name: household.household_name ?? "",
      headMemberId: "",
      phone: household.phone ?? "",
      email: household.email ?? "",
      address: household.address ?? "",
      city: household.city ?? "",
      country: household.country ?? "",
      notes: household.notes ?? "",
    });
    setError(null);
  }, [household, open]);

  function updateValue(field: keyof HouseholdFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setError(null);
  }

  function submitForm() {
    if (!household) return;
    if (!values.household_name.trim()) {
      setError("Household name is required.");
      document.getElementById("edit-household-household_name")?.focus();
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("churchSlug", churchSlug);
      formData.set("householdId", household.id);
      formData.set("household_name", values.household_name.trim());
      formData.set("phone", values.phone.trim());
      formData.set("email", values.email.trim());
      formData.set("address", values.address.trim());
      formData.set("city", values.city.trim());
      formData.set("country", values.country.trim());
      formData.set("notes", values.notes.trim());

      try {
        await updateHouseholdAction(formData);
        toast({ title: "Household updated", description: "Household changes were saved." });
        onOpenChange(false);
        onSaved();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Failed to update household.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[86vh] w-[calc(100%-2rem)] max-w-[760px] flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl">
        <div className="shrink-0 px-6 py-5">
          <DialogHeader className="gap-2">
            <DialogTitle>Edit household</DialogTitle>
            <DialogDescription>Update household contact, location, and notes.</DialogDescription>
          </DialogHeader>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {error ? (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="edit-household-household_name">
                Household name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-household-household_name"
                value={values.household_name}
                onChange={(event) => updateValue("household_name", event.target.value)}
                className="h-11 rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-household-phone">Phone</Label>
              <Input
                id="edit-household-phone"
                value={values.phone}
                onChange={(event) => updateValue("phone", event.target.value)}
                className="h-11 rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-household-email">Email</Label>
              <Input
                id="edit-household-email"
                type="email"
                value={values.email}
                onChange={(event) => updateValue("email", event.target.value)}
                className="h-11 rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="edit-household-address">Address</Label>
              <Textarea
                id="edit-household-address"
                value={values.address}
                onChange={(event) => updateValue("address", event.target.value)}
                rows={3}
                className="rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-household-city">City</Label>
              <Input
                id="edit-household-city"
                value={values.city}
                onChange={(event) => updateValue("city", event.target.value)}
                className="h-11 rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-household-country">Country</Label>
              <Input
                id="edit-household-country"
                value={values.country}
                onChange={(event) => updateValue("country", event.target.value)}
                className="h-11 rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="edit-household-notes">Notes</Label>
              <Textarea
                id="edit-household-notes"
                value={values.notes}
                onChange={(event) => updateValue("notes", event.target.value)}
                rows={4}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-border px-6 py-4">
          <Button type="button" variant="outline" className="h-10 rounded-lg" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" className="h-10 rounded-lg" onClick={submitForm} disabled={isPending}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HouseholdsMobileLegacy({
  churchSlug,
  households,
  canManage,
}: {
  churchSlug: string;
  households: HouseholdListItem[];
  canManage: boolean;
}) {
  const { t } = useI18n();
  const totalMembers = households.reduce((sum, household) => sum + household.member_count, 0);
  const noHeadCount = households.filter((household) => !household.head_of_household_name).length;
  const missingContactCount = households.filter((household) => !household.email && !household.phone).length;
  const largestHouseholds = [...households]
    .sort((a, b) => b.member_count - a.member_count || a.household_name.localeCompare(b.household_name))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6 md:hidden">
      <WorkspaceHero
        size="compact"
        eyebrow="Households"
        title={t.pages.households.title}
        description={t.pages.households.description}
        badges={[`${households.length} households`, `${totalMembers} members linked`]}
        actions={[
          ...(canManage
            ? [{ label: t.pages.households.addHousehold, href: `/c/${churchSlug}/households/new`, variant: "primary" as const }]
            : []),
          { label: t.navigation.members, href: `/c/${churchSlug}/members`, variant: "secondary" as const },
        ]}
      />

      <div className="grid grid-cols-2 gap-3">
        <WorkspaceStatCard label={t.pages.households.title} value={households.length} hint="Total household records" />
        <WorkspaceStatCard label={t.pages.households.table.members} value={totalMembers} hint="Members linked to households" />
        <WorkspaceStatCard label={t.pages.households.table.head} value={households.length - noHeadCount} hint="Households with a designated head" />
        <WorkspaceStatCard label="Needs review" value={missingContactCount} hint="Households missing phone and email" />
      </div>

      <WorkspaceControlRail
        title="Household Utility Bar"
        description="Table-first registry for household review, coverage checks, and quick record actions."
      >
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <p>Sorted by household name. Use the table to drill into details quickly.</p>
          {canManage ? (
            <Link
              href={`/c/${churchSlug}/households/new`}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {t.pages.households.addHousehold}
            </Link>
          ) : null}
        </div>
      </WorkspaceControlRail>

      {households.length === 0 ? (
        <WorkspaceSectionCard title={t.pages.households.title} description={t.pages.households.description}>
          <WorkspaceEmptyState
            title={t.pages.households.noHouseholds}
            message={t.pages.households.description}
            actionLabel={canManage ? t.pages.households.addHousehold : undefined}
            actionHref={canManage ? `/c/${churchSlug}/households/new` : undefined}
          />
        </WorkspaceSectionCard>
      ) : (
        <WorkspaceSectionCard
          title={t.pages.households.title}
          description="Household registry with contact and location visibility."
          contentClassName="p-0"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.households.table.household}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.households.table.head}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.households.table.members}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.households.table.location}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.households.table.phone}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">{t.pages.households.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {households.map((household) => (
                  <tr key={household.id}>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-slate-900">{household.household_name}</p>
                      <p className="text-xs text-slate-500">{household.email ?? t.common.noEmail}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{household.head_of_household_name ?? "-"}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{household.member_count}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{getLocationLabel(household) || "-"}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{household.phone ?? "-"}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end">
                        <Link
                          href={`/c/${churchSlug}/households/${household.id}`}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          {t.pages.households.viewHousehold}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </WorkspaceSectionCard>
      )}

      {largestHouseholds.length ? (
        <WorkspaceSectionCard title="Largest Households" description="Fast visibility into households with the biggest member counts.">
          <div className="flex flex-col gap-2">
            {largestHouseholds.map((household) => (
              <Link
                key={household.id}
                href={`/c/${churchSlug}/households/${household.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm transition hover:bg-slate-50"
              >
                <span className="font-medium text-slate-800">{household.household_name}</span>
                <span className="text-slate-500">{household.member_count}</span>
              </Link>
            ))}
          </div>
        </WorkspaceSectionCard>
      ) : null}
    </div>
  );
}

export function HouseholdsWorkspace({
  churchSlug,
  households,
  availableMembers,
  canManage,
}: HouseholdsWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const newHouseholdButtonRef = useRef<HTMLButtonElement | null>(null);
  const [filters, setFilters] = useState<HouseholdFilters>({
    q: "",
    headStatus: "",
    size: "",
    location: "",
  });
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(households[0]?.id ?? null);
  const [pendingCreatedHouseholdId, setPendingCreatedHouseholdId] = useState<string | null>(null);
  const [addHouseholdOpen, setAddHouseholdOpen] = useState(false);
  const [editHousehold, setEditHousehold] = useState<HouseholdListItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    router.prefetch(`/c/${churchSlug}/members`);
    router.prefetch(`/c/${churchSlug}/reports`);
  }, [churchSlug, router]);

  useEffect(() => {
    if (searchParams.get("action") !== "new") return;

    setAddHouseholdOpen(true);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("action");
    const nextQuery = nextParams.toString();
    window.history.replaceState(null, "", nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }, [pathname, searchParams]);

  useEffect(() => {
    try {
      const storedId = window.localStorage.getItem(getHouseholdsSelectedStorageKey(churchSlug));
      if (!storedId) return;

      const exists = households.some((household) => household.id === storedId);
      if (exists) setSelectedHouseholdId(storedId);
    } catch {
      // ignore storage read errors
    }
  }, [churchSlug, households]);

  useEffect(() => {
    if (!selectedHouseholdId) return;

    const exists = households.some((household) => household.id === selectedHouseholdId);
    if (exists) {
      if (pendingCreatedHouseholdId === selectedHouseholdId) {
        setPendingCreatedHouseholdId(null);
      }
      return;
    }

    if (pendingCreatedHouseholdId === selectedHouseholdId) {
      return;
    }

    setSelectedHouseholdId(households[0]?.id ?? null);
  }, [households, pendingCreatedHouseholdId, selectedHouseholdId]);

  useEffect(() => {
    try {
      if (!selectedHouseholdId) {
        window.localStorage.removeItem(getHouseholdsSelectedStorageKey(churchSlug));
        return;
      }

      window.localStorage.setItem(getHouseholdsSelectedStorageKey(churchSlug), selectedHouseholdId);
    } catch {
      // ignore storage write errors
    }
  }, [churchSlug, selectedHouseholdId]);

  const locationOptions = useMemo(
    () =>
      Array.from(new Set(households.map((household) => getLocationLabel(household)).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [households]
  );

  const filteredHouseholds = useMemo(() => filterHouseholds(households, filters), [filters, households]);
  const selectedHousehold = useMemo(() => {
    if (!selectedHouseholdId) return null;
    return households.find((household) => household.id === selectedHouseholdId) ?? null;
  }, [households, selectedHouseholdId]);
  const activeFilters = hasActiveFilters(filters);

  function handleSelectHousehold(householdId: string) {
    setSelectedHouseholdId(householdId);

    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1279px)").matches) {
      setDetailOpen(true);
    }
  }

  function handleCreated(householdId?: string) {
    if (householdId) {
      setPendingCreatedHouseholdId(householdId);
      setSelectedHouseholdId(householdId);
    }
    setAddHouseholdOpen(false);
    router.refresh();
  }

  function handleAddHouseholdOpenChange(nextOpen: boolean) {
    setAddHouseholdOpen(nextOpen);
    if (!nextOpen) {
      window.requestAnimationFrame(() => newHouseholdButtonRef.current?.focus());
    }
  }

  function handleSaved() {
    router.refresh();
  }

  return (
    <div className="min-w-0">
      <HouseholdsMobileLegacy churchSlug={churchSlug} households={households} canManage={canManage} />

      <div className="hidden min-w-0 flex-col gap-4 md:flex">
        <HouseholdsSummaryCard
          churchSlug={churchSlug}
          households={households}
          canManage={canManage}
          onNewHousehold={() => setAddHouseholdOpen(true)}
          newHouseholdButtonRef={newHouseholdButtonRef}
        />

        <HouseholdsFilterCard
          filters={filters}
          onFiltersChange={setFilters}
          locationOptions={locationOptions}
          resultCount={filteredHouseholds.length}
        />

        <ChurchContentGrid className="items-start gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0">
            <HouseholdsRegistryCard
              churchSlug={churchSlug}
              households={filteredHouseholds}
              selectedHouseholdId={selectedHousehold?.id ?? null}
              onSelectHousehold={handleSelectHousehold}
              hasFilters={activeFilters}
              canManage={canManage}
              onNewHousehold={() => setAddHouseholdOpen(true)}
            />
          </section>

          <SelectedHouseholdCard
            churchSlug={churchSlug}
            household={selectedHousehold}
            canManage={canManage}
            onClearSelectedHousehold={() => setSelectedHouseholdId(null)}
            onEditHousehold={setEditHousehold}
            variant="rail"
          />
        </ChurchContentGrid>
      </div>

      <AddHouseholdWizard
        open={addHouseholdOpen}
        onOpenChange={handleAddHouseholdOpenChange}
        churchSlug={churchSlug}
        availableMembers={availableMembers}
        onCreated={handleCreated}
      />

      <EditHouseholdDialog
        open={Boolean(editHousehold)}
        onOpenChange={(open) => {
          if (!open) setEditHousehold(null);
        }}
        churchSlug={churchSlug}
        household={editHousehold}
        onSaved={handleSaved}
      />

      <MobileBottomSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title="Household Details"
        className="md:block xl:hidden"
      >
        <SelectedHouseholdCard
          churchSlug={churchSlug}
          household={selectedHousehold}
          canManage={canManage}
          onEditHousehold={setEditHousehold}
          variant="card"
        />
      </MobileBottomSheet>
    </div>
  );
}
