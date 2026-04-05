import { getRichSecureInvitePageData } from "@/features/member-invite/queries";
import { RichInviteOnboardingForm } from "@/features/member-invite/components/RichInviteOnboardingForm";

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export default async function InviteClaimPage(props: PageProps) {
  const params = await props.params;
  const token = params.token;

  const pageData = await getRichSecureInvitePageData(token);

  if (!pageData) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-10 sm:px-6">
        <div className="w-full rounded-3xl border p-8">
          <h1 className="text-2xl font-semibold">Invite not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This secure invite does not exist or can no longer be opened.
          </p>
        </div>
      </div>
    );
  }

  const { context, inviteStatus, canClaim, memberDisplayName, claimMode } = pageData;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="rounded-3xl border p-6">
        <p className="text-sm font-medium text-muted-foreground">Secure church onboarding</p>
        <h1 className="mt-2 text-3xl font-semibold">
          Join {context.churchName}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {claimMode === "open_onboarding" ? (
            <>
              This is an open onboarding invite for <span className="font-medium text-foreground">{context.churchName}</span>.
              You will create your own member profile during secure signup.
            </>
          ) : (
            <>
              This invite is linked to <span className="font-medium text-foreground">{memberDisplayName}</span>.
              Complete your account, update your member profile, choose departments, and submit any leadership claims for approval.
            </>
          )}
        </p>

        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-2xl border p-3">
            <p className="text-muted-foreground">Status</p>
            <p className="mt-1 font-medium capitalize text-foreground">{inviteStatus}</p>
          </div>
          <div className="rounded-2xl border p-3">
            <p className="text-muted-foreground">Mode</p>
            <p className="mt-1 font-medium text-foreground">
              {claimMode === "open_onboarding" ? "Open onboarding" : "Existing member"}
            </p>
          </div>
          <div className="rounded-2xl border p-3">
            <p className="text-muted-foreground">Invite email</p>
            <p className="mt-1 font-medium text-foreground">{context.inviteEmail ?? context.memberEmail ?? "—"}</p>
          </div>
          <div className="rounded-2xl border p-3">
            <p className="text-muted-foreground">Expires</p>
            <p className="mt-1 font-medium text-foreground">{formatDate(context.expiresAt)}</p>
          </div>
        </div>

        {context.note ? (
          <div className="mt-4 rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Note:</span> {context.note}
          </div>
        ) : null}
      </div>

      {canClaim ? (
        <RichInviteOnboardingForm data={pageData} token={token} />
      ) : (
        <div className="rounded-3xl border p-6">
          <h2 className="text-xl font-semibold">This invite cannot be claimed</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The invite is currently marked as <span className="font-medium capitalize text-foreground">{inviteStatus}</span>.
            If you believe this is a mistake, contact your church administrator or pastor.
          </p>
        </div>
      )}
    </div>
  );
}
