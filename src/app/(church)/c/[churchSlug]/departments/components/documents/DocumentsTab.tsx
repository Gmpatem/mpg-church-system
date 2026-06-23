"use client";

import { Archive, FileText, Folder, Upload } from "lucide-react";
import {
  ChurchContentGrid,
  ChurchMainPanel,
  ChurchRightRail,
} from "@/components/church-workspace";
import { Button } from "@/components/ui/button";
import type {
  DepartmentWorkspaceBundle,
  DocumentsState,
} from "../types";
import {
  EmptyState,
  NativeSelect,
  SearchField,
  formatNumber,
} from "../shared";

export function DocumentsTab({
  bundle,
  state,
  onStateChange,
}: {
  bundle: DepartmentWorkspaceBundle | null;
  state: DocumentsState;
  onStateChange: (next: Partial<DocumentsState>) => void;
}) {
  if (!bundle) {
    return (
      <EmptyState
        title="No department selected"
        message="Select a department from the overview registry to review document storage."
      />
    );
  }

  const categories = bundle.documents.categories.filter((category) => {
    if (state.category && category.key !== state.category) return false;
    if (!state.search.trim()) return true;
    return category.label.toLowerCase().includes(state.search.trim().toLowerCase());
  });

  return (
    <ChurchContentGrid className="lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
      <ChurchMainPanel className="min-w-0">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">Document Library</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Storage state for {bundle.department.name}.
            </p>
          </div>
          <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(220px,320px)_170px]">
            <SearchField
              id="department-documents-search"
              value={state.search}
              onChange={(search) => onStateChange({ search })}
              placeholder="Search categories..."
            />
            <NativeSelect
              label="Document category"
              value={state.category}
              onChange={(category) => onStateChange({ category })}
              allLabel="All categories"
              options={bundle.documents.categories.map((category) => ({
                value: category.key,
                label: category.label,
              }))}
            />
          </div>
        </div>

        <div className="grid gap-3 border-b border-border p-5 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <section
              key={category.key}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Folder className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-foreground">{category.label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatNumber(category.count)} files
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="p-5">
          <EmptyState
            title="Document storage unavailable"
            message={bundle.documents.unavailableReason}
            action={
              <Button type="button" variant="outline" className="rounded-lg bg-background" disabled>
                <Upload data-icon="inline-start" aria-hidden="true" />
                Upload Document
              </Button>
            }
          />
        </div>
      </ChurchMainPanel>

      <ChurchRightRail className="self-start">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Document Preview</h2>
          <p className="mt-1 text-sm text-muted-foreground">No file is selected.</p>
        </div>
        <div className="grid gap-3 p-5">
          {[
            ["Configured files", "0"],
            ["Pending approval", "0"],
            ["Archived files", "0"],
          ].map(([label, value], index) => {
            const Icon = index === 0 ? FileText : Archive;

            return (
              <div
                key={label}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm"
              >
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </span>
                <span className="font-semibold text-foreground">{value}</span>
              </div>
            );
          })}
        </div>
      </ChurchRightRail>
    </ChurchContentGrid>
  );
}
