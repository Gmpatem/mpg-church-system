import Link from "next/link";
import {
  getTreasuryFinanceSettings,
  getTreasuryFormOptions,
} from "@/features/treasury/queries";
import { getDepartmentFundRequestForOutflowPrefill } from "@/features/department-finance/queries";
import { MoneyOutForm } from "./MoneyOutForm";

interface MoneyOutPageProps {
  params: Promise<{ churchSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function pickSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function MoneyOutPage({ params, searchParams }: MoneyOutPageProps) {
  const { churchSlug } = await params;
  const filters = (await searchParams) ?? {};
  const requestId = pickSingle(filters.requestId);

  const requestForPrefill = requestId
    ? await getDepartmentFundRequestForOutflowPrefill(churchSlug, requestId)
    : null;

  const [options, financeSettings] = await Promise.all([
    getTreasuryFormOptions(churchSlug, {
      includeFundIds: requestForPrefill?.fund_id || requestForPrefill?.preferred_fund_id
        ? [requestForPrefill.fund_id || requestForPrefill.preferred_fund_id || ""]
        : [],
      includeDepartmentIds: requestForPrefill?.department_id
        ? [requestForPrefill.department_id]
        : [],
    }),
    getTreasuryFinanceSettings(churchSlug),
  ]);

  const defaults = requestForPrefill
      ? {
        outflowType: requestForPrefill.outflow_type,
        fundId: requestForPrefill.fund_id ?? requestForPrefill.preferred_fund_id ?? "",
        departmentId: requestForPrefill.department_id,
        amount: requestForPrefill.amount,
        outflowDate: requestForPrefill.outflow_date || requestForPrefill.requested_date,
        payee: requestForPrefill.payee ?? "",
        purpose: requestForPrefill.purpose,
        projectName: requestForPrefill.project_name ?? "",
        note: requestForPrefill.note ?? "",
        referenceNumber: requestForPrefill.reference_number ?? "",
        departmentFundRequestId: requestForPrefill.id,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Record Money Out</h2>
          <p className="text-sm text-slate-600 mt-1">
            Project, evangelism, mission remittance, or church expense.
          </p>
        </div>

        <Link
          href={`/c/${churchSlug}/treasury`}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Back to Treasury
        </Link>
      </div>

      {requestForPrefill ? (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Processing department request:{" "}
          <span className="font-semibold">{requestForPrefill.title}</span>. Review and adjust the
          prefilled outflow details before submitting.
        </div>
      ) : null}

      <MoneyOutForm
        churchSlug={churchSlug}
        options={options}
        defaults={defaults}
        financeSettings={financeSettings}
      />
    </div>
  );
}
