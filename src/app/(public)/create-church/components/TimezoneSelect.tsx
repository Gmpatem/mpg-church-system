"use client";

import { useMemo, useEffect, useState } from "react";

// Comprehensive list of IANA timezone identifiers
// Used as fallback when Intl.supportedValuesOf is not available
const COMMON_TIMEZONES = [
  "UTC",
  // North America
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Anchorage", "America/Honolulu", "America/Phoenix", "America/Toronto",
  "America/Vancouver", "America/Mexico_City", "America/Guadalajara",
  // South America
  "America/Sao_Paulo", "America/Buenos_Aires", "America/Santiago", "America/Lima",
  "America/Bogota", "America/Caracas", "America/Montevideo",
  // Europe
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Rome", "Europe/Madrid",
  "Europe/Amsterdam", "Europe/Brussels", "Europe/Vienna", "Europe/Zurich",
  "Europe/Stockholm", "Europe/Oslo", "Europe/Copenhagen", "Europe/Helsinki",
  "Europe/Warsaw", "Europe/Prague", "Europe/Budapest", "Europe/Bucharest",
  "Europe/Sofia", "Europe/Athens", "Europe/Istanbul", "Europe/Moscow",
  "Europe/Dublin", "Europe/Lisbon", "Europe/Zagreb", "Europe/Belgrade",
  // Africa
  "Africa/Cairo", "Africa/Lagos", "Africa/Johannesburg", "Africa/Nairobi",
  "Africa/Accra", "Africa/Addis_Ababa", "Africa/Algiers", "Africa/Casablanca",
  "Africa/Khartoum", "Africa/Kigali", "Africa/Kinshasa", "Africa/Lagos",
  "Africa/Libreville", "Africa/Luanda", "Africa/Lusaka", "Africa/Maputo",
  // Asia
  "Asia/Dubai", "Asia/Qatar", "Asia/Riyadh", "Asia/Kuwait", "Asia/Baghdad",
  "Asia/Tehran", "Asia/Karachi", "Asia/Mumbai", "Asia/Delhi", "Asia/Kolkata",
  "Asia/Dhaka", "Asia/Colombo", "Asia/Kathmandu", "Asia/Thimphu",
  "Asia/Bangkok", "Asia/Singapore", "Asia/Kuala_Lumpur", "Asia/Jakarta",
  "Asia/Ho_Chi_Minh", "Asia/Manila", "Asia/Hong_Kong", "Asia/Shanghai",
  "Asia/Beijing", "Asia/Taipei", "Asia/Seoul", "Asia/Tokyo", "Asia/Osaka",
  "Asia/Yokohama", "Asia/Sapporo", "Asia/Fukuoka", "Asia/Kyoto",
  "Asia/Ulaanbaatar", "Asia/Almaty", "Asia/Tashkent", "Asia/Ashgabat",
  "Asia/Baku", "Asia/Yerevan", "Asia/Tbilisi", "Asia/Kabul", "Asia/Islamabad",
  // Australia & Pacific
  "Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", "Australia/Perth",
  "Australia/Adelaide", "Australia/Darwin", "Australia/Canberra", "Australia/Hobart",
  "Pacific/Auckland", "Pacific/Wellington", "Pacific/Christchurch",
  "Pacific/Fiji", "Pacific/Guam", "Pacific/Honolulu", "Pacific/Samoa",
  "Pacific/Tahiti", "Pacific/Noumea", "Pacific/Port_Moresby",
];

interface TimezoneSelectProps {
  id?: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
}

// Detect user's timezone
export function detectUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // Fallback: try to guess from offset
    const offset = new Date().getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(offset / 60));
    const offsetMinutes = Math.abs(offset % 60);
    const sign = offset <= 0 ? "+" : "-";
    return `UTC${sign}${offsetHours}${offsetMinutes > 0 ? `:${offsetMinutes.toString().padStart(2, "0")}` : ""}`;
  }
}

// Get all supported timezones
function getSupportedTimezones(): string[] {
  try {
    // Modern browsers support this
    if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
      return (Intl as any).supportedValuesOf("timeZone");
    }
  } catch {
    // Fall through to default list
  }
  return COMMON_TIMEZONES;
}

// Format timezone for display
function formatTimezone(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(now);
    const offset = parts.find((p) => p.type === "timeZoneName")?.value || "";
    
    // Convert timezone ID to readable format
    const readable = timezone.replace(/_/g, " ").replace(/\//g, " / ");
    return `${readable} (${offset})`;
  } catch {
    return timezone;
  }
}

export function TimezoneSelect({ id, name, defaultValue, required, className }: TimezoneSelectProps) {
  const [detectedTz, setDetectedTz] = useState<string>("");
  
  useEffect(() => {
    setDetectedTz(detectUserTimezone());
  }, []);

  const timezones = useMemo(() => {
    const tzList = getSupportedTimezones();
    
    // Sort by offset (roughly by geography)
    return tzList.map((tz) => ({
      value: tz,
      label: formatTimezone(tz),
    }));
  }, []);

  // Use detected timezone as default if no default provided
  const effectiveDefault = defaultValue || detectedTz;

  return (
    <select
      id={id}
      name={name}
      defaultValue={effectiveDefault}
      required={required}
      className={className}
    >
      <option value="">Select a timezone...</option>
      {detectedTz && !timezones.find(tz => tz.value === detectedTz) && (
        <option value={detectedTz}>
          {formatTimezone(detectedTz)} (Detected)
        </option>
      )}
      <optgroup label="Common Timezones">
        {timezones.map((tz) => (
          <option key={tz.value} value={tz.value}>
            {tz.label}
          </option>
        ))}
      </optgroup>
    </select>
  );
}
