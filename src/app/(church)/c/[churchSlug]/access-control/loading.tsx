export default function AccessControlLoadingPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="h-36 animate-pulse rounded-3xl border bg-muted/30" />
      <div className="h-14 animate-pulse rounded-2xl border bg-muted/30" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="h-32 animate-pulse rounded-2xl border bg-muted/30" />
        <div className="h-32 animate-pulse rounded-2xl border bg-muted/30" />
        <div className="h-32 animate-pulse rounded-2xl border bg-muted/30" />
        <div className="h-32 animate-pulse rounded-2xl border bg-muted/30" />
      </div>
      <div className="h-80 animate-pulse rounded-3xl border bg-muted/30" />
    </div>
  );
}
