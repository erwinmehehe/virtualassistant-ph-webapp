export function money(value: number | null | undefined) {
  if (value == null) return "Not specified";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function dateShort(value: string | null | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

const MANILA_TIME_ZONE = "Asia/Manila";

/** Hours elapsed since an ISO timestamp (0 when missing). */
export function hoursSince(value: string | null | undefined) {
  return value ? Math.max(0, (Date.now() - new Date(value).getTime()) / 3600000) : 0;
}

/**
 * Relative age such as "12m ago", "5h ago", or "3d in stage".
 * `precision: "minutes"` shows minutes under an hour; otherwise `underHour`
 * (when given) replaces "0h".
 */
export function elapsedLabel(
  value: string | null | undefined,
  options: { empty?: string; precision?: "minutes" | "hours"; suffix?: string; underHour?: string } = {},
) {
  const { empty = "", precision = "hours", suffix = " ago", underHour } = options;
  if (!value) return empty;
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (precision === "minutes" && minutes < 60) return `${minutes}m${suffix}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 1 && underHour) return underHour;
  if (hours < 24) return `${hours}h${suffix}`;
  return `${Math.floor(hours / 24)}d${suffix}`;
}

/** Value for <input type="date">. */
export function dateInputValue(value: string | null | undefined) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

/** Value for <input type="datetime-local">, expressed in Manila time. */
export function dateTimeInputValue(value: string | null | undefined) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MANILA_TIME_ZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Medium date and short time in Manila time, e.g. "Sep 17, 2026, 9:30 AM". */
export function manilaDateTimeLabel(value: string | null | undefined, empty = "Not scheduled") {
  if (!value) return empty;
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: MANILA_TIME_ZONE }).format(new Date(value));
}
