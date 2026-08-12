import { MemberPortalSegmentedControl } from "./MemberPortalAppPrimitives";

type MemberPortalChip = {
  label: string;
  active?: boolean;
};

type MemberPortalChipRowProps = {
  chips: MemberPortalChip[];
};

export function MemberPortalChipRow({ chips }: MemberPortalChipRowProps) {
  if (chips.length === 0) return null;

  return <MemberPortalSegmentedControl items={chips} />;
}
