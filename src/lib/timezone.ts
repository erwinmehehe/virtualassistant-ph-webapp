export function isValidTimeZone(value: string | null | undefined) {
  const timeZone = String(value || "").trim();
  if (!timeZone || timeZone.toLowerCase().startsWith("to confirm")) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

function offsetMinutesAt(date: Date, timeZone: string) {
  const zone = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
    hour: "2-digit",
  }).formatToParts(date).find((part) => part.type === "timeZoneName")?.value || "";
  if (zone === "GMT" || zone === "UTC") return 0;
  const match = zone.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) return null;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] || 0));
}

export function dateTimeInputValueInTimeZone(value: string | null | undefined, timeZone: string | null | undefined) {
  if (!value || !isValidTimeZone(timeZone)) return "";
  const parts = zonedParts(new Date(value), String(timeZone));
  const pad = (item: number) => String(item).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function zonedDateTimeToUtc(value: string, timeZone: string) {
  if (!isValidTimeZone(timeZone)) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const wallTime = Date.UTC(year, month - 1, day, hour, minute);

  let probe = new Date(wallTime);
  let offset = offsetMinutesAt(probe, timeZone);
  if (offset == null) return null;

  let instant = new Date(wallTime - offset * 60000);
  const refinedOffset = offsetMinutesAt(instant, timeZone);
  if (refinedOffset == null) return null;
  if (refinedOffset !== offset) {
    offset = refinedOffset;
    instant = new Date(wallTime - offset * 60000);
  }

  const rendered = zonedParts(instant, timeZone);
  if (
    rendered.year !== year ||
    rendered.month !== month ||
    rendered.day !== day ||
    rendered.hour !== hour ||
    rendered.minute !== minute
  ) {
    return null;
  }
  return instant;
}

export function formatDateTimeInTimeZone(
  value: string | null | undefined,
  timeZone: string | null | undefined,
  empty = "Not scheduled",
) {
  if (!value) return empty;
  if (!isValidTimeZone(timeZone)) {
    return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  }
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: String(timeZone),
    timeZoneName: "short",
  }).format(new Date(value));
}
