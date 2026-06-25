"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ChurchMemberRegistration } from "@/features/member-registration/types";
import { formatRegistrationStatus, getRegistrationStatusTone } from "@/features/member-registration/presentation";

type OnboardingQueueTableProps = {
  registrations: (ChurchMemberRegistration & { family_count: number })[];
  selectedId: string | null;
  total: number;
  page: number;
  pageSize: number;
  churchSlug: string;
  onSelect: (id: string) => void;
  onReview: (id: string) => void;
};

export function OnboardingQueueTable({
  registrations,
  selectedId,
  total,
  page,
  pageSize,
  churchSlug,
  onSelect,
  onReview,
}: OnboardingQueueTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", "onboarding");
    params.set("onboardingPage", String(newPage));
    router.replace(`/c/${churchSlug}/members?${params.toString()}`);
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Applicant</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Household</TableHead>
              <TableHead className="text-center">Family</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No registrations match the current filter.
                </TableCell>
              </TableRow>
            )}
            {registrations.map(reg => {
              const name = [reg.first_name, reg.last_name].filter(Boolean).join(" ");
              const statusTone = getRegistrationStatusTone(reg.status);
              return (
                <TableRow
                  key={reg.id}
                  data-selected={selectedId === reg.id}
                  className="cursor-pointer data-[selected=true]:bg-muted/50"
                  onClick={() => onSelect(reg.id)}
                >
                  <TableCell className="font-medium">{name}</TableCell>
                  <TableCell>
                    <div className="text-sm">{reg.email}</div>
                    <div className="text-xs text-muted-foreground">{reg.phone}</div>
                  </TableCell>
                  <TableCell className="text-sm capitalize">{reg.household_action.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-center">{reg.family_count}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(parseISO(reg.submitted_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        statusTone === "success"
                          ? "default"
                          : statusTone === "warning"
                          ? "secondary"
                          : statusTone === "danger"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {formatRegistrationStatus(reg.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={e => {
                        e.stopPropagation();
                        onReview(reg.id);
                      }}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t p-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
