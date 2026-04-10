type MemberPortalChip = {
  label: string;
  active?: boolean;
};

type MemberPortalChipRowProps = {
  chips: MemberPortalChip[];
};

export function MemberPortalChipRow({ chips }: MemberPortalChipRowProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className={
            chip.active
              ? "mobile-touch-feedback inline-flex whitespace-nowrap rounded-full border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
              : "mobile-touch-feedback inline-flex whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
          }
        >
          {chip.label}
        </span>
      ))}
    </div>
  );
}
