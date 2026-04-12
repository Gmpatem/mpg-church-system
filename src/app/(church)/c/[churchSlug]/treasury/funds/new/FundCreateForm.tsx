"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createTreasuryFundAction } from "@/features/treasury/actions";
import { useI18n } from "@/features/i18n";

interface FundCreateFormProps {
  churchSlug: string;
  embedded?: boolean;
}

export function FundCreateForm({ churchSlug, embedded = false }: FundCreateFormProps) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(createTreasuryFundAction, null);
  const [fundType, setFundType] = useState("");

  return (
    <form
      action={formAction}
      className={
        embedded
          ? "space-y-5"
          : "space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      }
    >
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.fundForm.code}</label>
          <input id="code" name="code" required placeholder={t.pages.treasury.forms.fundForm.codePlaceholder} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.fundForm.name}</label>
          <input id="name" name="name" required placeholder={t.pages.treasury.forms.fundForm.namePlaceholder} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="fundType" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.fundForm.fundType}</label>
          <select
            id="fundType"
            name="fundType"
            required
            value={fundType}
            onChange={(event) => setFundType(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t.pages.treasury.forms.fundForm.selectFundType}</option>
            <option value="tithe">{t.pages.treasury.forms.fundForm.types.tithe}</option>
            <option value="offering">{t.pages.treasury.forms.fundForm.types.offering}</option>
            <option value="donation">{t.pages.treasury.forms.fundForm.types.donation}</option>
            <option value="project">{t.pages.treasury.forms.fundForm.types.project}</option>
            <option value="department">{t.pages.treasury.forms.fundForm.types.department}</option>
            <option value="mission">{t.pages.treasury.forms.fundForm.types.mission}</option>
            <option value="welfare">{t.pages.treasury.forms.fundForm.types.welfare}</option>
            <option value="general">{t.pages.treasury.forms.fundForm.types.general}</option>
          </select>
          <p className="mt-1 text-xs text-slate-500">{t.pages.treasury.forms.fundForm.scopeHint}</p>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.fundForm.description}</label>
        <textarea id="description" name="description" rows={4} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isPending ? t.pages.treasury.forms.fundForm.creating : t.pages.treasury.forms.fundForm.create}
        </button>
      </div>
    </form>
  );
}
