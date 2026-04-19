"use client";

import { useActionState } from "react";
import { useEffect, useState } from "react";
import { updateTreasuryInflowAction } from "@/features/treasury/actions";
import { useI18n } from "@/features/i18n";

type SourceMode = "member" | "department" | "anonymous" | "visitor";

interface InflowEditFormProps {
  churchSlug: string;
  entry: any;
  options: {
    funds: Array<{ id: string; code: string; name: string; fund_type: string }>;
    members: Array<{ id: string; display_name?: string | null; first_name: string; last_name: string; member_code?: string | null }>;
    departments: Array<{ id: string; department_name: string }>;
  };
}

function detectInitialSourceMode(entry: any): SourceMode {
  if (entry.member_id) return "member";
  if (entry.department_id) return "department";
  if (entry.is_anonymous) return "anonymous";
  return "visitor";
}

export function InflowEditForm({ churchSlug, entry, options }: InflowEditFormProps) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(updateTreasuryInflowAction, null);
  const [sourceMode, setSourceMode] = useState<SourceMode>(() => detectInitialSourceMode(entry));
  const [selectedMemberId, setSelectedMemberId] = useState(entry.member_id ?? "");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(entry.department_id ?? "");

  useEffect(() => {
    if (sourceMode !== "member" && selectedMemberId) {
      setSelectedMemberId("");
    }
    if (sourceMode !== "department" && selectedDepartmentId) {
      setSelectedDepartmentId("");
    }
  }, [selectedDepartmentId, selectedMemberId, sourceMode]);

  const isAnonymous = sourceMode === "anonymous" || sourceMode === "visitor";

  return (
    <form action={formAction} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="churchSlug" value={churchSlug} />
      <input type="hidden" name="entryId" value={entry.id} />
      <input type="hidden" name="sourceType" value={sourceMode} />
      <input type="hidden" name="memberId" value={sourceMode === "member" ? selectedMemberId : ""} />
      <input type="hidden" name="departmentId" value={sourceMode === "department" ? selectedDepartmentId : ""} />
      <input type="hidden" name="isAnonymous" value={isAnonymous ? "true" : "false"} />

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="inflowType" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.entryType}</label>
          <select id="inflowType" name="inflowType" defaultValue={entry.inflow_type} required className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="tithe">{t.pages.treasury.forms.types.tithe}</option>
            <option value="offering">{t.pages.treasury.forms.types.offering}</option>
            <option value="donation">{t.pages.treasury.forms.types.donation}</option>
            <option value="special_contribution">{t.pages.treasury.forms.types.specialContribution}</option>
          </select>
        </div>

        <div>
          <label htmlFor="fundId" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.fund}</label>
          <select id="fundId" name="fundId" defaultValue={entry.fund_id ?? ""} required className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">{t.pages.treasury.forms.selectFund}</option>
            {options.funds.map((fund) => (
              <option key={fund.id} value={fund.id}>{fund.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sourceMode" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.sourceMode}</label>
          <select
            id="sourceMode"
            value={sourceMode}
            onChange={(event) => setSourceMode(event.target.value as SourceMode)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="member">{t.pages.treasury.forms.sourceModes.member}</option>
            <option value="department">{t.pages.treasury.forms.sourceModes.department}</option>
            <option value="anonymous">{t.pages.treasury.forms.sourceModes.anonymous}</option>
            <option value="visitor">{t.pages.treasury.forms.sourceModes.visitor}</option>
          </select>
        </div>

        {sourceMode === "member" ? (
          <div>
            <label htmlFor="memberSelect" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.member}</label>
            <select
              id="memberSelect"
              value={selectedMemberId}
              onChange={(event) => setSelectedMemberId(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t.pages.treasury.forms.unlinked}</option>
              {options.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {(member.display_name ?? `${member.first_name} ${member.last_name}`) + (member.member_code ? ` (${member.member_code})` : "")}
                </option>
              ))}
            </select>
          </div>
        ) : sourceMode === "department" ? (
          <div>
            <label htmlFor="departmentSelect" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.department}</label>
            <select
              id="departmentSelect"
              value={selectedDepartmentId}
              onChange={(event) => setSelectedDepartmentId(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t.pages.treasury.forms.notSpecified}</option>
              {options.departments.map((department) => (
                <option key={department.id} value={department.id}>{department.department_name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.member}</label>
            <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {sourceMode === "anonymous"
                ? t.pages.treasury.forms.sourceModes.anonymous
                : t.pages.treasury.forms.sourceModes.visitor}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.amount}</label>
          <input id="amount" name="amount" type="number" step="0.01" min="0.01" defaultValue={entry.amount} required className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="inflowDate" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.date}</label>
          <input id="inflowDate" name="inflowDate" type="date" defaultValue={entry.inflow_date} required className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div>
        <label htmlFor="referenceNumber" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.reference}</label>
        <input id="referenceNumber" name="referenceNumber" defaultValue={entry.reference_number ?? ""} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.note}</label>
        <textarea id="note" name="note" rows={4} defaultValue={entry.note ?? ""} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label htmlFor="correctionNote" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.edit.correctionNote}</label>
        <textarea id="correctionNote" name="correctionNote" rows={3} required placeholder={t.pages.treasury.forms.edit.correctionPlaceholder} className="w-full rounded-md border border-amber-300 bg-amber-50 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500" />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isPending ? t.pages.treasury.forms.saving : t.pages.treasury.forms.edit.saveCorrection}
        </button>
      </div>
    </form>
  );
}
