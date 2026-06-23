"use client";

import { ArrowDownToLine, ArrowRightLeft, CheckSquare, ClipboardList, FileClock, Minus, MoreHorizontal, Plus, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { TreasuryDialog, TreasuryReconciliationView, TreasuryTabKey } from "./types";

export function TreasuryWorkspaceHeader({
  onDialogChange,
  onTabChange,
  onReconciliationViewChange,
}: {
  onDialogChange: (dialog: TreasuryDialog) => void;
  onTabChange: (tab: TreasuryTabKey) => void;
  onReconciliationViewChange: (view: TreasuryReconciliationView) => void;
}) {
  return (
    <header className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Treasury</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage church income, expenses, funds, requests, transfers, and remittance.
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button type="button" onClick={() => onDialogChange({ type: "money-in" })} className="h-10 gap-2 rounded-lg px-4 font-semibold">
          <Plus className="size-4" aria-hidden="true" />
          Record Money In
        </Button>
        <Button type="button" variant="outline" onClick={() => onDialogChange({ type: "money-out" })} className="h-10 gap-2 rounded-lg bg-background px-4 font-semibold">
          <Minus className="size-4" aria-hidden="true" />
          Record Money Out
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="h-10 gap-2 rounded-lg bg-background px-4 font-semibold">
              More Actions
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-lg">
            <DropdownMenuItem className="h-10 gap-2" onSelect={() => { onTabChange("transfers"); onDialogChange({ type: "transfer" }); }}>
              <ArrowRightLeft className="size-4" aria-hidden="true" />
              Transfer Funds
            </DropdownMenuItem>
            <DropdownMenuItem className="h-10 gap-2" onSelect={() => { onTabChange("funds"); onDialogChange({ type: "create-fund" }); }}>
              <WalletCards className="size-4" aria-hidden="true" />
              Create Fund
            </DropdownMenuItem>
            <DropdownMenuItem className="h-10 gap-2" onSelect={() => onTabChange("requests")}>
              <CheckSquare className="size-4" aria-hidden="true" />
              Review Requests
            </DropdownMenuItem>
            <DropdownMenuItem className="h-10 gap-2" onSelect={() => { onTabChange("reconciliation"); onReconciliationViewChange("remittance"); onDialogChange({ type: "run-remittance" }); }}>
              <ArrowDownToLine className="size-4" aria-hidden="true" />
              Run Remittance
            </DropdownMenuItem>
            <DropdownMenuItem className="h-10 gap-2" onSelect={() => { onTabChange("reconciliation"); onReconciliationViewChange("audit"); }}>
              <FileClock className="size-4" aria-hidden="true" />
              Open Audit Trail
            </DropdownMenuItem>
            <DropdownMenuItem className="h-10 gap-2" onSelect={() => { onTabChange("reconciliation"); onReconciliationViewChange("exceptions"); }}>
              <ClipboardList className="size-4" aria-hidden="true" />
              Refresh Checks
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

