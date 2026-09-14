export const DISCOVERY_TIME_ZONE = "Asia/Manila";
export const DISCOVERY_DURATION_MINUTES = 30;
export const DISCOVERY_MIN_NOTICE_HOURS = 4;
export const DISCOVERY_BOOKING_DAYS = 14;

export type DiscoverySlot = {
  iso: string;
  timeLabel: string;
};

export type DiscoverySlotDay = {
  dateKey: string;
  label: string;
  slots: DiscoverySlot[];
};

const MANILA_OFFSET_HOURS = 8;

function manilaParts(date: Date) {
  const shifted = new Date(date.getTime() + MANILA_OFFSET_HOURS * 60 * 60 * 1000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

function manilaDateToUtc(year: number, month: number, day: number, hour: number, minute: number) {
  return new Date(Date.UTC(year, month, day, hour - MANILA_OFFSET_HOURS, minute));
}

export function isAllowedDiscoverySlot(value: string, now = new Date()) {
  const slot = new Date(value);
  if (Number.isNaN(slot.getTime())) return false;
  const min = now.getTime() + DISCOVERY_MIN_NOTICE_HOURS * 60 * 60 * 1000;
  const max = now.getTime() + DISCOVERY_BOOKING_DAYS * 24 * 60 * 60 * 1000;
  if (slot.getTime() < min || slot.getTime() > max) return false;

  const parts = manilaParts(slot);
  return [0, 30].includes(parts.minute);
}

export function buildDiscoverySlotDays(bookedIsoValues: string[], now = new Date()): DiscoverySlotDay[] {
  const booked = new Set(bookedIsoValues.map((value) => new Date(value).toISOString()));
  const today = manilaParts(now);
  const days: DiscoverySlotDay[] = [];

  for (let offset = 0; offset <= DISCOVERY_BOOKING_DAYS; offset += 1) {
    const date = new Date(Date.UTC(today.year, today.month, today.day + offset));
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const slots: DiscoverySlot[] = [];

    for (let hour = 0; hour < 24; hour += 1) {
      for (const minute of [0, 30]) {
        const slot = manilaDateToUtc(year, month, day, hour, minute);
        const iso = slot.toISOString();
        if (!isAllowedDiscoverySlot(iso, now) || booked.has(iso)) continue;
        slots.push({
          iso,
          timeLabel: new Intl.DateTimeFormat("en-PH", {
            hour: "numeric",
            minute: "2-digit",
            timeZone: DISCOVERY_TIME_ZONE,
          }).format(slot),
        });
      }
    }

    if (!slots.length) continue;
    days.push({
      dateKey: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("en-PH", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: DISCOVERY_TIME_ZONE,
      }).format(slots[0] ? new Date(slots[0].iso) : date),
      slots,
    });
  }

  return days;
}

export function formatDiscoverySlot(value: string, timeZone = DISCOVERY_TIME_ZONE) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(new Date(value));
}
