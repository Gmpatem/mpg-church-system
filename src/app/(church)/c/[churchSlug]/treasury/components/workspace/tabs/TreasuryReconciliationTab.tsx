"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  History,
  Play,
  RefreshCw,
  SearchCheck,
  Settings,
  ShieldAlert,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TreasuryDialog, TreasuryReconciliationView } from "../types";
import { RECONCILIATION_VIEWS } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TreasuryAmount,
  TreasuryEmptyState,
  TreasuryFilterSelect,
  TreasuryPagination,
  TreasuryPanel,
  TreasurySearchField,
  TreasuryStatusBadge,
  TreasurySummaryStrip,
  TreasuryToolbar,
} from "../shared";
import { formatDate, formatDateTime, formatTreasuryAmount, humanize } from "../utils";

export function TreasuryReconciliationTab({
  churchSlug,
  data,
  view,
  initialEntityId,
  initialAuditSearch,
  initialAuditEntityType,
  initialAuditActionType,
  initialAuditChangedBy,
  onViewChange,
  onOpenDialog,
}: {
  churchSlug: string;
  data: any;
  view: TreasuryReconciliationView;
  initialEntityId?: string;
  initialAuditSearch?: string;
  initialAuditEntityType?: string;
  initialAuditActionType?: string;
  initialAuditChangedBy?: string;
  onViewChange: (view: TreasuryReconciliationView) => void;
  onOpenDialog: (dialog: TreasuryDialog) => void;
}) {
  const exceptions = data.workspace?.exceptions ?? [];
  const allocations = data.workspace?.allocations?.rows ?? [];
  const auditRows = data.workspace?.audit?.rows ?? [];
  const remittanceHistory = data.workspace?.remittanceHistory ?? [];

  return (
    <div className="min-w-0 space-y-4">
      <TreasurySummaryStrip
        items={[
          { label: "Open Exceptions", value: exceptions.length, hint: "Requires attention", icon: <AlertTriangle className="size-6" />, tone: exceptions.length ? "amber" : "green" },
          { label: "Pending Remittance", value: formatTreasuryAmount(data.remittance?.pendingAmount ?? 0), hint: "Ready for next run", icon: <WalletCards className="size-6" />, tone: "green" },
          { label: "Pending Allocations", value: data.workspace?.allocations?.pendingCount ?? 0, hint: "Awaiting remittance", icon: <ClipboardCheck className="size-6" />, tone: "purple" },
          { label: "Changes This Period", value: auditRows.length, hint: "Audited Treasury changes", icon: <History className="size-6" />, tone: "blue" },
        ]}
      />

      <div className="rounded-xl border border-border bg-background shadow-sm">
        <div className="flex min-w-0 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {RECONCILIATION_VIEWS.map((item) => {
            const count =
              item.key === "exceptions"
                ? exceptions.length
                : item.key === "allocations"
                  ? allocations.length
                  : item.key === "audit"
                    ? auditRows.length
                    : remittanceHistory.length;
            const active = view === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onViewChange(item.key)}
                className={`flex h-12 shrink-0 items-center gap-2 border-b-2 px-5 text-sm font-medium transition ${
                  active
                    ? "border-primary bg-emerald-50/60 text-primary"
                    : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                {item.label}
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="min-w-0 p-0">
          {view === "exceptions" ? (
            <ExceptionsView churchSlug={churchSlug} exceptions={exceptions} onOpenDialog={onOpenDialog} onViewChange={onViewChange} />
          ) : null}
          {view === "remittance" ? <RemittanceView churchSlug={churchSlug} data={data} onOpenDialog={onOpenDialog} /> : null}
          {view === "allocations" ? <AllocationsView rows={allocations} /> : null}
          {view === "audit" ? (
            <AuditView
              rows={auditRows}
              initialEntityId={initialEntityId}
              initialSearch={initialAuditSearch}
              initialEntityType={initialAuditEntityType}
              initialActionType={initialAuditActionType}
              initialChangedBy={initialAuditChangedBy}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ExceptionsView({
  churchSlug,
  exceptions,
  onOpenDialog,
  onViewChange,
}: {
  churchSlug: string;
  exceptions: any[];
  onOpenDialog: (dialog: TreasuryDialog) => void;
  onViewChange: (view: TreasuryReconciliationView) => void;
}) {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [type, setType] = useState("");
  const [module, setModule] = useState("");
  const [selectedId, setSelectedId] = useState(exceptions[0]?.id ?? "");

  const typeOptions = Array.from(new Set(exceptions.map((item) => String(item.type || "")).filter(Boolean))).map((value) => ({
    value,
    label: humanize(value),
  }));
  const moduleOptions = Array.from(new Set(exceptions.map((item) => String(item.entityType || "")).filter(Boolean))).map((value) => ({
    value,
    label: value,
  }));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return exceptions.filter((item) => {
      if (severity && item.severity !== severity) return false;
      if (type && item.type !== type) return false;
      if (module && item.entityType !== module) return false;
      if (!q) return true;
      return [item.title, item.description, item.entityLabel, item.entityType, item.suggestedResolution]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [exceptions, module, search, severity, type]);

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 border-r border-border">
        <TreasuryToolbar className="rounded-none border-0 border-b shadow-none">
          <TreasurySearchField value={search} onChange={setSearch} placeholder="Search exceptions..." />
          <TreasuryFilterSelect label="Severity" value={severity} onValueChange={setSeverity} options={[{ value: "critical", label: "Critical" }, { value: "warning", label: "Warning" }, { value: "notice", label: "Notice" }]} />
          <TreasuryFilterSelect label="Exception Type" value={type} onValueChange={setType} options={typeOptions} className="w-[170px]" />
          <TreasuryFilterSelect label="Related Module" value={module} onValueChange={setModule} options={moduleOptions} className="w-[170px]" />
          <Button type="button" variant="outline" className="ml-auto h-10 gap-2 rounded-lg">
            <RefreshCw className="size-4" aria-hidden="true" />
            Refresh Checks
          </Button>
        </TreasuryToolbar>

        <TreasuryPanel title="Exception Queue" className="rounded-none border-0 shadow-none" contentClassName="p-0">
          {filtered.length === 0 ? (
            <div className="p-5">
              <TreasuryEmptyState title="No exceptions match the current filters." message="Treasury exceptions appear here when policy, remittance, allocation, or balance checks need review." />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="h-11">Issue</TableHead>
                    <TableHead className="h-11">Severity</TableHead>
                    <TableHead className="h-11">Related Record</TableHead>
                    <TableHead className="h-11 text-right">Amount</TableHead>
                    <TableHead className="h-11">Detected</TableHead>
                    <TableHead className="h-11">Status</TableHead>
                    <TableHead className="h-11 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => {
                    const isSelected = selected?.id === item.id;
                    return (
                      <TableRow
                        key={item.id}
                        data-state={isSelected ? "selected" : undefined}
                        className="cursor-pointer"
                        tabIndex={0}
                        onClick={() => setSelectedId(item.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") setSelectedId(item.id);
                        }}
                      >
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <ExceptionIcon severity={item.severity} />
                            <span className="min-w-0">
                              <span className="block max-w-[260px] truncate text-sm font-semibold text-foreground">{item.title}</span>
                              <span className="block max-w-[260px] truncate text-xs text-muted-foreground">{item.description}</span>
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3"><TreasuryStatusBadge status={item.severity} /></TableCell>
                        <TableCell className="py-3 text-sm text-foreground">{item.entityLabel || item.entityType}</TableCell>
                        <TableCell className="py-3 text-right">{item.amount === null ? "-" : <TreasuryAmount value={item.amount} direction={Number(item.amount) < 0 ? "outflow" : "neutral"} />}</TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">{formatDate(item.detectedLabel)}</TableCell>
                        <TableCell className="py-3"><TreasuryStatusBadge status={item.status} /></TableCell>
                        <TableCell className="py-3 text-right">
                          <Button type="button" variant="ghost" size="sm" className="h-8 rounded-lg" onClick={() => setSelectedId(item.id)}>
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <TreasuryPagination label={`Showing 1-${filtered.length} of ${filtered.length} exceptions`} />
            </>
          )}
        </TreasuryPanel>
      </div>

      <TreasuryPanel title="Selected Exception" className="rounded-none border-0 shadow-none" contentClassName="p-5">
        {!selected ? (
          <TreasuryEmptyState title="No selected exception" message="Select an exception to inspect why it matters and how to resolve it." />
        ) : (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <TreasuryStatusBadge status={selected.severity} />
                <h3 className="mt-3 text-lg font-semibold text-foreground">{selected.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{selected.entityLabel || selected.entityType}</p>
              </div>
              {selected.amount !== null ? <TreasuryAmount value={selected.amount} direction={Number(selected.amount) < 0 ? "outflow" : "neutral"} /> : null}
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{selected.description}</p>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Why it matters</h4>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{selected.whyItMatters}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Suggested resolution</h4>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{selected.suggestedResolution}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <ExceptionAction
                churchSlug={churchSlug}
                exception={selected}
                onOpenDialog={onOpenDialog}
                onViewChange={onViewChange}
              />
              <Button asChild variant="outline" className="h-10 rounded-lg">
                <Link href={`/c/${churchSlug}/settings`}>
                  <Settings className="mr-2 size-4" aria-hidden="true" />
                  Finance Settings
                </Link>
              </Button>
            </div>
            <dl className="space-y-2 text-sm">
              <Info label="Entity Type" value={selected.entityType} />
              <Info label="Entity Reference" value={selected.entityId || "-"} />
              {(selected.details ?? []).map((detail: any) => (
                <Info key={detail.label} label={detail.label} value={detail.value} />
              ))}
            </dl>
          </div>
        )}
      </TreasuryPanel>
    </div>
  );
}

function ExceptionAction({
  churchSlug,
  exception,
  onOpenDialog,
  onViewChange,
}: {
  churchSlug: string;
  exception: any;
  onOpenDialog: (dialog: TreasuryDialog) => void;
  onViewChange: (view: TreasuryReconciliationView) => void;
}) {
  if (exception.type === "pending_mission_remittance") {
    return (
      <Button type="button" className="h-10 rounded-lg" onClick={() => onOpenDialog({ type: "run-remittance" })}>
        <Play className="mr-2 size-4" aria-hidden="true" />
        Run Remittance
      </Button>
    );
  }
  if (exception.type === "allocation_attention") {
    return (
      <Button type="button" className="h-10 rounded-lg" onClick={() => onViewChange("allocations")}>
        <SearchCheck className="mr-2 size-4" aria-hidden="true" />
        Review Allocations
      </Button>
    );
  }
  if (exception.href) {
    return (
      <Button asChild className="h-10 rounded-lg">
        <Link href={exception.href}>
          <ArrowRight className="mr-2 size-4" aria-hidden="true" />
          {exception.actionLabel || "Open Record"}
        </Link>
      </Button>
    );
  }
  if (exception.entityType === "Fund") {
    return (
      <Button asChild className="h-10 rounded-lg">
        <Link href={`/c/${churchSlug}/treasury?tab=funds`}>
          <ArrowRight className="mr-2 size-4" aria-hidden="true" />
          Open Funds
        </Link>
      </Button>
    );
  }
  return (
    <Button type="button" className="h-10 rounded-lg" disabled>
      {exception.actionLabel || "Review"}
    </Button>
  );
}

function RemittanceView({
  churchSlug,
  data,
  onOpenDialog,
}: {
  churchSlug: string;
  data: any;
  onOpenDialog: (dialog: TreasuryDialog) => void;
}) {
  const remittance = data.remittance ?? {};
  const settings = remittance.settings ?? {};
  const history = data.workspace?.remittanceHistory ?? [];

  return (
    <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 border-r border-border">
        <TreasuryToolbar className="rounded-none border-0 border-b shadow-none">
          <Button type="button" className="h-10 gap-2 rounded-lg" onClick={() => onOpenDialog({ type: "run-remittance" })} disabled={!remittance.canManage || remittance.pendingAmount <= 0 || remittance.migrationRequired}>
            <Play className="size-4" aria-hidden="true" />
            Run Remittance
          </Button>
          <Button asChild variant="outline" className="h-10 gap-2 rounded-lg">
            <Link href={`/c/${churchSlug}/settings`}>
              <Settings className="size-4" aria-hidden="true" />
              Finance Settings
            </Link>
          </Button>
        </TreasuryToolbar>

        <TreasuryPanel title="Remittance Runs" className="rounded-none border-0 shadow-none" contentClassName="p-0">
          {remittance.migrationRequired ? (
            <div className="p-5">
              <TreasuryEmptyState title="Remittance migration required" message="Apply the Treasury remittance migration before running or reviewing remittance history." />
            </div>
          ) : history.length === 0 ? (
            <div className="p-5">
              <TreasuryEmptyState title="No remittance runs yet" message="When remittance is processed, run history appears here for audit review." />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="h-11">Run Date</TableHead>
                    <TableHead className="h-11">Source</TableHead>
                    <TableHead className="h-11">Destination</TableHead>
                    <TableHead className="h-11">Mode</TableHead>
                    <TableHead className="h-11 text-right">Source Amount</TableHead>
                    <TableHead className="h-11 text-right">Remitted</TableHead>
                    <TableHead className="h-11">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((row: any) => (
                    <TableRow key={row.id}>
                      <TableCell className="py-3 text-xs text-muted-foreground">{formatDate(row.run_date || row.created_at)}</TableCell>
                      <TableCell className="py-3 text-sm text-foreground">{humanize(row.source_type)}</TableCell>
                      <TableCell className="py-3 text-sm text-foreground">{humanize(row.destination)}</TableCell>
                      <TableCell className="py-3 text-sm text-foreground">{humanize(row.mode)}</TableCell>
                      <TableCell className="py-3 text-right"><TreasuryAmount value={row.source_amount} /></TableCell>
                      <TableCell className="py-3 text-right"><TreasuryAmount value={row.remitted_amount} direction="inflow" /></TableCell>
                      <TableCell className="py-3"><TreasuryStatusBadge status={row.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TreasuryPagination label={`Showing 1-${history.length} of ${history.length} remittance runs`} />
            </>
          )}
        </TreasuryPanel>
      </div>

      <TreasuryPanel title="Remittance Status" className="rounded-none border-0 shadow-none" contentClassName="p-5">
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Pending Remittance</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-primary">{formatTreasuryAmount(remittance.pendingAmount ?? 0)}</p>
          </div>
          <dl className="space-y-2 text-sm">
            <Info label="Enabled" value={settings.is_enabled ? "Yes" : "No"} />
            <Info label="Live" value={settings.is_live ? "Yes" : "No"} />
            <Info label="Source Type" value={humanize(settings.source_type)} />
            <Info label="Destination" value={humanize(settings.destination)} />
            <Info label="Frequency" value={humanize(settings.frequency)} />
            <Info label="Mode" value={humanize(settings.mode)} />
            <Info label="Last Run" value={formatDate(remittance.lastRunDate)} />
            <Info label="Next Expected" value={formatDate(remittance.nextExpectedRun)} />
          </dl>
        </div>
      </TreasuryPanel>
    </div>
  );
}

function AllocationsView({ rows }: { rows: any[] }) {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? "");

  const kindOptions = Array.from(new Set(rows.map((row) => String(row.allocation_kind || "")).filter(Boolean))).map((value) => ({
    value,
    label: humanize(value),
  }));
  const statusOptions = Array.from(new Set(rows.map((row) => String(row.status || "")).filter(Boolean))).map((value) => ({
    value,
    label: humanize(value),
  }));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (kind && row.allocation_kind !== kind) return false;
      if (status && row.status !== status) return false;
      if (!q) return true;
      return [row.inflow_reference, row.inflow_type, row.target_fund_name, row.rule_name, row.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [kind, rows, search, status]);

  const selected = filtered.find((row) => row.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 border-r border-border">
        <TreasuryToolbar className="rounded-none border-0 border-b shadow-none">
          <TreasurySearchField value={search} onChange={setSearch} placeholder="Search allocations..." />
          <TreasuryFilterSelect label="Allocation Kind" value={kind} onValueChange={setKind} options={kindOptions} className="w-[180px]" />
          <TreasuryFilterSelect label="Status" value={status} onValueChange={setStatus} options={statusOptions} />
        </TreasuryToolbar>
        <TreasuryPanel title="Allocation Records" className="rounded-none border-0 shadow-none" contentClassName="p-0">
          {filtered.length === 0 ? (
            <div className="p-5">
              <TreasuryEmptyState title="No allocation records match the current filters." message="Allocation preview records appear here when inflows are split or prepared for remittance." />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="h-11">Source Inflow</TableHead>
                    <TableHead className="h-11">Kind</TableHead>
                    <TableHead className="h-11">Target Fund</TableHead>
                    <TableHead className="h-11 text-right">Allocated</TableHead>
                    <TableHead className="h-11">Created</TableHead>
                    <TableHead className="h-11">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => {
                    const isSelected = selected?.id === row.id;
                    return (
                      <TableRow key={row.id} data-state={isSelected ? "selected" : undefined} className="cursor-pointer" tabIndex={0} onClick={() => setSelectedId(row.id)}>
                        <TableCell className="py-3">
                          <p className="text-sm font-semibold text-foreground">{row.inflow_reference || row.inflow_id || "Unreferenced inflow"}</p>
                          <p className="text-xs text-muted-foreground">{humanize(row.inflow_type)} · {formatDate(row.inflow_date)}</p>
                        </TableCell>
                        <TableCell className="py-3 text-sm text-foreground">{humanize(row.allocation_kind)}</TableCell>
                        <TableCell className="py-3 text-sm text-foreground">{row.target_fund_name || "-"}</TableCell>
                        <TableCell className="py-3 text-right"><TreasuryAmount value={row.allocated_amount} /></TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">{formatDate(row.created_at)}</TableCell>
                        <TableCell className="py-3"><TreasuryStatusBadge status={row.status} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <TreasuryPagination label={`Showing 1-${filtered.length} of ${filtered.length} allocations`} />
            </>
          )}
        </TreasuryPanel>
      </div>
      <TreasuryPanel title="Allocation Details" className="rounded-none border-0 shadow-none" contentClassName="p-5">
        {!selected ? (
          <TreasuryEmptyState title="Select an allocation" message="Choose an allocation record to inspect its source inflow and target fund." />
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-muted-foreground">Allocated Amount</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">{formatTreasuryAmount(selected.allocated_amount)}</p>
            </div>
            <dl className="space-y-2 text-sm">
              <Info label="Source Reference" value={selected.inflow_reference || "-"} />
              <Info label="Inflow Type" value={humanize(selected.inflow_type)} />
              <Info label="Inflow Date" value={formatDate(selected.inflow_date)} />
              <Info label="Allocation Kind" value={humanize(selected.allocation_kind)} />
              <Info label="Target Fund" value={selected.target_fund_name || "-"} />
              <Info label="Rule" value={selected.rule_name || "-"} />
              <Info label="Status" value={humanize(selected.status)} />
              <Info label="Created" value={formatDateTime(selected.created_at)} />
            </dl>
          </div>
        )}
      </TreasuryPanel>
    </div>
  );
}

function AuditView({
  rows,
  initialEntityId,
  initialSearch,
  initialEntityType,
  initialActionType,
  initialChangedBy,
}: {
  rows: any[];
  initialEntityId?: string;
  initialSearch?: string;
  initialEntityType?: string;
  initialActionType?: string;
  initialChangedBy?: string;
}) {
  const [search, setSearch] = useState(initialSearch ?? "");
  const [entityType, setEntityType] = useState(initialEntityType ?? "");
  const [actionType, setActionType] = useState(initialActionType ?? "");
  const [changedBy, setChangedBy] = useState(initialChangedBy ?? "");
  const [entityId, setEntityId] = useState(initialEntityId ?? "");
  const [selectedId, setSelectedId] = useState(rows.find((row) => row.entity_id === initialEntityId)?.id ?? rows[0]?.id ?? "");

  const entityOptions = Array.from(
    new Set<string>(
      rows
        .map((row) => String(row.entity_type || ""))
        .filter((value: string) => value.length > 0)
    )
  ).map((value) => ({
    value,
    label: humanize(value),
  }));
  const actionOptions = Array.from(
    new Set<string>(
      rows
        .map((row) => String(row.action_type || ""))
        .filter((value: string) => value.length > 0)
    )
  ).map((value) => ({
    value,
    label: humanize(value),
  }));
  const actorOptions = Array.from(
    new Map<string, string>(
      rows
        .map((row) => [
          String(row.changed_by_user_id || ""),
          String(row.changed_by_label || row.changed_by_user_id || ""),
        ] as [string, string])
        .filter(([id]) => id.length > 0)
    ).entries()
  ).map(([value, label]) => ({
    value,
    label,
  }));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (entityId && row.entity_id !== entityId) return false;
      if (entityType && row.entity_type !== entityType) return false;
      if (actionType && row.action_type !== actionType) return false;
      if (changedBy && row.changed_by_user_id !== changedBy) return false;
      if (!q) return true;
      return [row.entity_type, row.action_type, row.record_label, row.changed_by_label, row.correction_note, row.entity_id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [actionType, changedBy, entityId, entityType, rows, search]);

  const selected = filtered.find((row) => row.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 border-r border-border">
        <TreasuryToolbar className="rounded-none border-0 border-b shadow-none">
          <TreasurySearchField value={search} onChange={setSearch} placeholder="Search audit trail..." />
          <TreasuryFilterSelect label="Entity" value={entityType} onValueChange={setEntityType} options={entityOptions} />
          <TreasuryFilterSelect label="Action" value={actionType} onValueChange={setActionType} options={actionOptions} />
          <TreasuryFilterSelect label="Actor" value={changedBy} onValueChange={setChangedBy} options={actorOptions} />
          {entityId ? (
            <Button type="button" variant="outline" className="h-10 rounded-lg" onClick={() => setEntityId("")}>
              Clear Entity
            </Button>
          ) : null}
        </TreasuryToolbar>
        <TreasuryPanel title="Audit Trail" className="rounded-none border-0 shadow-none" contentClassName="p-0">
          {filtered.length === 0 ? (
            <div className="p-5">
              <TreasuryEmptyState title="No audit entries match the current filters." message="Treasury audit entries appear here after fund, inflow, outflow, or transfer changes are recorded." />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="h-11">Changed</TableHead>
                    <TableHead className="h-11">Entity</TableHead>
                    <TableHead className="h-11">Record</TableHead>
                    <TableHead className="h-11">Actor</TableHead>
                    <TableHead className="h-11">Fields</TableHead>
                    <TableHead className="h-11">Correction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => {
                    const isSelected = selected?.id === row.id;
                    return (
                      <TableRow key={row.id} data-state={isSelected ? "selected" : undefined} className="cursor-pointer" tabIndex={0} onClick={() => setSelectedId(row.id)}>
                        <TableCell className="py-3 text-xs text-muted-foreground">{formatDateTime(row.created_at)}</TableCell>
                        <TableCell className="py-3">
                          <TreasuryStatusBadge status={humanize(row.entity_type)} />
                          <p className="mt-1 text-xs text-muted-foreground">{humanize(row.action_type)}</p>
                        </TableCell>
                        <TableCell className="py-3">
                          <p className="max-w-[240px] truncate text-sm font-semibold text-foreground">{row.record_label || row.entity_id}</p>
                          <p className="max-w-[240px] truncate font-mono text-xs text-muted-foreground">{row.entity_id}</p>
                        </TableCell>
                        <TableCell className="py-3 text-sm text-foreground">{row.changed_by_label}</TableCell>
                        <TableCell className="py-3 text-sm text-foreground">{row.changed_field_count ?? 0}</TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">{row.correction_note ? "Captured" : "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <TreasuryPagination label={`Showing 1-${filtered.length} of ${filtered.length} audit entries`} />
            </>
          )}
        </TreasuryPanel>
      </div>
      <TreasuryPanel title="Audit Details" className="rounded-none border-0 shadow-none" contentClassName="p-5">
        {!selected ? (
          <TreasuryEmptyState title="Select an audit entry" message="Choose an audit entry to inspect actor, record, and correction note." />
        ) : (
          <div className="space-y-5">
            <div>
              <TreasuryStatusBadge status={humanize(selected.action_type)} />
              <h3 className="mt-3 text-lg font-semibold text-foreground">{selected.record_label || selected.entity_id}</h3>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{selected.entity_id}</p>
            </div>
            <dl className="space-y-2 text-sm">
              <Info label="Entity Type" value={humanize(selected.entity_type)} />
              <Info label="Action" value={humanize(selected.action_type)} />
              <Info label="Actor" value={selected.changed_by_label || "-"} />
              <Info label="Changed At" value={formatDateTime(selected.created_at)} />
              <Info label="Fields Changed" value={String(selected.changed_field_count ?? 0)} />
            </dl>
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Correction note</p>
              <p className="mt-2 text-sm leading-6 text-foreground">{selected.correction_note || "No correction note was recorded."}</p>
            </div>
          </div>
        )}
      </TreasuryPanel>
    </div>
  );
}

function ExceptionIcon({ severity }: { severity: string }) {
  const className =
    severity === "critical"
      ? "rounded-full bg-red-50 p-1.5 text-red-600"
      : severity === "warning"
        ? "rounded-full bg-amber-50 p-1.5 text-amber-600"
        : "rounded-full bg-blue-50 p-1.5 text-blue-600";
  return (
    <span className={className}>
      {severity === "critical" ? <ShieldAlert className="size-4" aria-hidden="true" /> : <AlertTriangle className="size-4" aria-hidden="true" />}
    </span>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
