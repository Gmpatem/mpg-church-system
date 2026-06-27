import Link from "next/link";

export default function RegistrationPendingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf8f3] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-stone-900">
          Registration awaiting review
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          The church is reviewing your submission. You can use the email and password you created, but Member Portal access will become available only after approval.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-800 px-5 text-sm font-semibold text-white transition hover:bg-emerald-900"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
