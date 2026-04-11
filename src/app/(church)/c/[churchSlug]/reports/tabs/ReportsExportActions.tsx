"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createReportExport } from "@/features/reports/actions";
import {
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Printer,
  SlidersHorizontal,
} from "lucide-react";

type ExportFormat = "pdf" | "excel" | "print";
type ExportPreset = "ready" | "quarterly" | "annual" | "custom";
type ExportScope = "active-tab" | "all-visible";

interface ReportsExportActionsProps {
  churchSlug: string;
  activeTab: string;
  dateFrom?: string;
  dateTo?: string;
}

const PRESET_LABELS: Record<ExportPreset, string> = {
  ready: "Ready Report",
  quarterly: "Quarterly Report",
  annual: "Annual Report",
  custom: "Custom Date Range",
};

const TAB_LABELS: Record<string, string> = {
  overview: "Overview",
  finance: "Finance",
  members: "Members",
  events: "Events",
};

export function ReportsExportActions({ churchSlug, activeTab, dateFrom, dateTo }: ReportsExportActionsProps) {
  const [pending, setPending] = useState<ExportFormat | null>(null);
  const [preset, setPreset] = useState<ExportPreset>("ready");
  const [scope, setScope] = useState<ExportScope>("active-tab");
  const [includeKpiSummary, setIncludeKpiSummary] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeTables, setIncludeTables] = useState(true);
  const [includeInsights, setIncludeInsights] = useState(true);

  const tabLabel = TAB_LABELS[activeTab] ?? "Overview";

  function buildFilters() {
    return {
      dateFrom,
      dateTo,
      exportPreset: preset,
      exportScope: scope,
      activeReportScope: activeTab,
      includeVisibleReportData: scope === "all-visible",
      includeKpiSummary,
      includeCharts,
      includeTables,
      includeInsights,
    };
  }

  async function handleExport(format: ExportFormat) {
    setPending(format);
    try {
      await createReportExport({
        churchSlug,
        reportScope: activeTab,
        format,
        filters: buildFilters(),
      });
    } finally {
      setPending(null);
    }
  }

  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
      <button
        type="button"
        onClick={() => handleExport("pdf")}
        disabled={pending !== null}
        className={`${baseClasses} bg-slate-950 text-white hover:bg-slate-800`}
      >
        {pending === "pdf" ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Exporting...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            Export PDF
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => handleExport("excel")}
        disabled={pending !== null}
        className={`${baseClasses} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
      >
        {pending === "excel" ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
            Exporting...
          </>
        ) : (
          <>
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => window.print()}
        disabled={pending !== null}
        className={`${baseClasses} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
      >
        <Printer className="h-4 w-4" />
        Print Summary
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={pending !== null}
            className={`${baseClasses} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Export Options
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 rounded-xl border border-slate-200 p-2">
          <DropdownMenuLabel className="px-2 py-1.5 text-xs uppercase tracking-[0.16em] text-slate-500">
            Export Preset
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup value={preset} onValueChange={(value) => setPreset(value as ExportPreset)}>
            <DropdownMenuRadioItem value="ready">Ready Report</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="quarterly">Quarterly Report</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="annual">Annual Report</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="custom">Custom Date Range</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="px-2 py-1.5 text-xs uppercase tracking-[0.16em] text-slate-500">
            Report Scope
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup value={scope} onValueChange={(value) => setScope(value as ExportScope)}>
            <DropdownMenuRadioItem value="active-tab">
              Active tab ({tabLabel})
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="all-visible">
              All visible report data
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="px-2 py-1.5 text-xs uppercase tracking-[0.16em] text-slate-500">
            Include Content
          </DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={includeKpiSummary}
            onCheckedChange={(checked) => setIncludeKpiSummary(Boolean(checked))}
            onSelect={(event) => event.preventDefault()}
          >
            Include KPI summary
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={includeCharts}
            onCheckedChange={(checked) => setIncludeCharts(Boolean(checked))}
            onSelect={(event) => event.preventDefault()}
          >
            Include charts
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={includeTables}
            onCheckedChange={(checked) => setIncludeTables(Boolean(checked))}
            onSelect={(event) => event.preventDefault()}
          >
            Include tables
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={includeInsights}
            onCheckedChange={(checked) => setIncludeInsights(Boolean(checked))}
            onSelect={(event) => event.preventDefault()}
          >
            Include insights
          </DropdownMenuCheckboxItem>

          <DropdownMenuSeparator />
          <p className="px-2 pb-1 pt-1 text-xs text-slate-500">
            Preset: <span className="font-medium text-slate-700">{PRESET_LABELS[preset]}</span>
            {preset === "custom" && (dateFrom || dateTo) ? (
              <>
                {" "}
                • Range: {dateFrom || "start"} to {dateTo || "today"}
              </>
            ) : null}
          </p>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
