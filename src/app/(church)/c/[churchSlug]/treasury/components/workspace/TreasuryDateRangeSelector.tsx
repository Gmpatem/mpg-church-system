"use client";

import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TreasuryPeriodKey } from "./types";
import { PERIOD_OPTIONS } from "./types";

export function TreasuryDateRangeSelector({
  period,
  from,
  to,
  onChange,
}: {
  period: TreasuryPeriodKey;
  from: string;
  to: string;
  onChange: (next: { period: TreasuryPeriodKey; from?: string; to?: string }) => void;
}) {
  const label = PERIOD_OPTIONS.find((item) => item.key === period)?.label ?? "This Month";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="h-10 shrink-0 gap-2 rounded-lg bg-background px-3">
          <CalendarDays className="size-4" aria-hidden="true" />
          {period === "custom" && from && to ? `${from} - ${to}` : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-xl p-4">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Range</label>
            <Select value={period} onValueChange={(value) => onChange({ period: value as TreasuryPeriodKey, from, to })}>
              <SelectTrigger className="h-10 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {period === "custom" ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">From</label>
                <Input
                  type="date"
                  value={from}
                  onChange={(event) => onChange({ period, from: event.target.value, to })}
                  className="h-10 rounded-lg"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">To</label>
                <Input
                  type="date"
                  value={to}
                  onChange={(event) => onChange({ period, from, to: event.target.value })}
                  className="h-10 rounded-lg"
                />
              </div>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

