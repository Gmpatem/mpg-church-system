export default function ChurchLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="h-28 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-28 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-28 animate-pulse rounded-xl bg-gray-200" />
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
    </div>
  );
}
