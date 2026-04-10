"use client";

import { useMemo } from "react";
import { useActionState } from "react";
import { ButtonSpinner } from "@/components/ui/ButtonSpinner";
import { createTreasuryInflowAction } from "@/features/treasury/actions";
import { useI18n } from "@/features/i18n";

interface MoneyInFormProps {
  churchSlug: string;
  options: {
    funds: Array<{ id: string; name: string; code: string; fund_type: string }>;
    members: Array<{ id: string; display_name?: string | null; first_name: string; last_name: string; member_code?: string | null }>;
  };
  defaults?: {
    inflowType?: string;
    fundCode?: string;
  };
  modeLabel?: string;
}

function getTodayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLockedLabel(inflowType: string | undefined, t: { pages: { treasury: { forms: { types: Record<string, string> } } } }) {
  if (inflowType === "tithe") return t.pages.treasury.forms.types.tithe;
  if (inflowType === "offering") return t.pages.treasury.forms.types.offering;
  if (inflowType === "donation") return t.pages.treasury.forms.types.donation;
  if (inflowType === "special_contribution") return t.pages.treasury.forms.types.specialContribution;
  return inflowType ?? "";
}

export function MoneyInForm({ churchSlug, options, defaults, modeLabel }: MoneyInFormProps) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(createTreasuryInflowAction, null);

  const defaultFundId = useMemo(() => {
    if (!defaults?.fundCode) return "";
    return options.funds.find((fund) => fund.code === defaults.fundCode)?.id ?? "";
  }, [defaults?.fundCode, options.funds]);

  const isFixedType = Boolean(defaults?.inflowType);
  const isFixedFund = Boolean(defaultFundId) && Boolean(defaults?.fundCode);
  const today = getTodayLocalDate();

  return (
    <form action={formAction} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="churchSlug" value={churchSlug} />

      {isFixedType ? <input type="hidden" name="inflowType" value={defaults?.inflowType ?? ""} /> : null}
      {isFixedFund ? <input type="hidden" name="fundId" value={defaultFundId} /> : null}

      <div>
        <h3 className="text-lg font-semibold text-slate-900">{modeLabel ?? t.pages.treasury.forms.recordMoneyIn}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {t.pages.treasury.forms.descriptions.moneyIn}
        </p>
      </div>

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
        {!isFixedType ? (
          <div>
            <label htmlFor="inflowType" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.entryType}</label>
            <select id="inflowType" name="inflowType" defaultValue={defaults?.inflowType ?? ""} required className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">{t.pages.treasury.forms.selectType}</option>
              <option value="tithe">{t.pages.treasury.forms.types.tithe}</option>
              <option value="offering">{t.pages.treasury.forms.types.offering}</option>
              <option value="donation">{t.pages.treasury.forms.types.donation}</option>
              <option value="special_contribution">{t.pages.treasury.forms.types.specialContribution}</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.entryType}</label>
            <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {getLockedLabel(defaults?.inflowType, t)}
            </div>
          </div>
        )}

        {!isFixedFund ? (
          <div>
            <label htmlFor="fundId" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.fund}</label>
            <select id="fundId" name="fundId" defaultValue={defaultFundId} required className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">{t.pages.treasury.forms.selectFund}</option>
              {options.funds.map((fund) => (
                <option key={fund.id} value={fund.id}>
                  {fund.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.fund}</label>
            <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {options.funds.find((fund) => fund.id === defaultFundId)?.name ?? t.pages.treasury.forms.autoSelected}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="memberId" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.member}</label>
          <select id="memberId" name="memberId" className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">{t.pages.treasury.forms.unlinked}</option>
            {options.members.map((member) => (
              <option key={member.id} value={member.id}>
                {(member.display_name ?? `${member.first_name} ${member.last_name}`) + (member.member_code ? ` (${member.member_code})` : "")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="isAnonymous" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.anonymous}</label>
          <select id="isAnonymous" name="isAnonymous" defaultValue="false" className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="false">{t.pages.treasury.forms.no}</option>
            <option value="true">{t.pages.treasury.forms.yes}</option>
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.amount}</label>
          <input id="amount" name="amount" type="number" step="0.01" min="0.01" required inputMode="decimal" className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label htmlFor="inflowDate" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.date}</label>
          <input id="inflowDate" name="inflowDate" type="date" defaultValue={today} required className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div>
        <label htmlFor="referenceNumber" className="block text-sm font-medium text-slate-700 mb-1">
          {t.pages.treasury.forms.reference}
        </label>
        <input
          id="referenceNumber"
          name="referenceNumber"
          placeholder={t.pages.treasury.forms.placeholder.reference}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-slate-500">
          {t.pages.treasury.forms.descriptions.allocationNote}
        </p>
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-slate-700 mb-1">{t.pages.treasury.forms.note}</label>
        <textarea id="note" name="note" rows={4} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || (Boolean(defaults?.fundCode) && !defaultFundId)}
          className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <ButtonSpinner />
              {t.pages.treasury.forms.saving}
            </span>
          ) : t.pages.treasury.forms.recordMoneyIn}
        </button>
      </div>

      {Boolean(defaults?.fundCode) && !defaultFundId ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t.pages.treasury.forms.errors.fundNotFound.replace("{{code}}", defaults?.fundCode || "")}
        </div>
      ) : null}
    </form>
  );
}
