import Link from "next/link";

type PageProps = {
  params: Promise<{
    churchSlug: string;
  }>;
};

export default async function MemberJoinPage(props: PageProps) {
  await props.params;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-10 sm:px-6">
      <div className="w-full rounded-3xl border p-8">
        <p className="text-sm font-medium text-muted-foreground">Legacy join route</p>
        <h1 className="mt-2 text-2xl font-semibold">This join link is no longer active</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This church now uses secure invite links for onboarding. Ask your church admin to send you a fresh secure invite link.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium transition hover:bg-accent"
          >
            Go to login
          </Link>
        </div>
      </div>
    </div>
  );
}
