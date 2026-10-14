/** Common IANA timezones for hiring across the Philippines, Australia, UK,
 * North America and other frequent client regions. Text entry also accepts
 * any other valid IANA zone, so the suggestions never exclude a client. */
export const TIMEZONE_SUGGESTIONS = [
  { value: "Asia/Manila", label: "Philippines · Manila (UTC+8)" },
  { value: "Asia/Singapore", label: "Singapore (UTC+8)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (UTC+8)" },
  { value: "Asia/Tokyo", label: "Japan · Tokyo" },
  { value: "Asia/Dubai", label: "UAE · Dubai" },
  { value: "Asia/Kolkata", label: "India · Kolkata" },
  { value: "Australia/Sydney", label: "Australia · Sydney" },
  { value: "Australia/Melbourne", label: "Australia · Melbourne" },
  { value: "Australia/Brisbane", label: "Australia · Brisbane" },
  { value: "Australia/Perth", label: "Australia · Perth" },
  { value: "Australia/Adelaide", label: "Australia · Adelaide" },
  { value: "Pacific/Auckland", label: "New Zealand · Auckland" },
  { value: "Europe/London", label: "UK · London" },
  { value: "Europe/Dublin", label: "Ireland · Dublin" },
  { value: "Europe/Berlin", label: "Germany · Berlin" },
  { value: "Europe/Paris", label: "France · Paris" },
  { value: "America/New_York", label: "US/Canada · Eastern" },
  { value: "America/Chicago", label: "US/Canada · Central" },
  { value: "America/Denver", label: "US/Canada · Mountain" },
  { value: "America/Phoenix", label: "US · Arizona" },
  { value: "America/Los_Angeles", label: "US/Canada · Pacific" },
  { value: "America/Anchorage", label: "US · Alaska" },
  { value: "Pacific/Honolulu", label: "US · Hawaii" },
  { value: "America/Toronto", label: "Canada · Toronto" },
  { value: "America/Vancouver", label: "Canada · Vancouver" },
  { value: "America/Mexico_City", label: "Mexico · Mexico City" },
  { value: "America/Sao_Paulo", label: "Brazil · São Paulo" },
  { value: "Africa/Johannesburg", label: "South Africa · Johannesburg" },
] as const;

const LEGACY_TIMEZONE_ALIASES: Record<string, string> = {
  "us eastern": "America/New_York",
  "us central": "America/Chicago",
  "us mountain": "America/Denver",
  "us pacific": "America/Los_Angeles",
  "us / canada, pacific": "America/Los_Angeles",
  "us / canada, eastern": "America/New_York",
  "gmt+8": "Asia/Manila",
  "gmt +8": "Asia/Manila",
  "pst": "America/Los_Angeles",
  "est": "America/New_York",
};

export function normalizeTimeZone(value?: string | null): string | null {
  const input = String(value || "").trim();
  if (!input) return null;
  const zone = LEGACY_TIMEZONE_ALIASES[input.toLowerCase()] || input;
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: zone }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

export function safeTimeZone(value?: string | null, fallback = "Asia/Manila") {
  return normalizeTimeZone(value) || fallback;
}
