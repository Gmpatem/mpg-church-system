import Link from "next/link";
import { Share2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OnboardingToolbarProps = {
  churchSlug: string;
  currentStatus: string;
  statusOptions: { value: string; label: string }[];
  onStatusChange: (status: string) => void;
  onShare: () => void;
};

export function OnboardingToolbar({
  churchSlug,
  currentStatus,
  statusOptions,
  onStatusChange,
  onShare,
}: OnboardingToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={currentStatus || "all"} onValueChange={onStatusChange}>
        <SelectTrigger className="h-10 w-[180px] rounded-xl">
          <SelectValue placeholder="Filter status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="outline" size="sm" onClick={onShare} className="gap-2 rounded-xl">
        <Share2 className="size-4" />
        Share registration form
      </Button>

      <Link href={`/c/${churchSlug}/members?action=new`}>
        <Button size="sm" className="gap-2 rounded-xl">
          <UserPlus className="size-4" />
          Add member
        </Button>
      </Link>
    </div>
  );
}
