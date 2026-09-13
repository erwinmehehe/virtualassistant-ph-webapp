import "server-only";
import { createHash, randomBytes } from "node:crypto";

export function createBookingManageToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashBookingManageToken(token) };
}

export function hashBookingManageToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function bookingManageUrl(token: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  return `${base}/book-client-call/manage?token=${encodeURIComponent(token)}`;
}

export function createCalendarInvite(args: { uid: string; startsAt: string; durationMinutes: number; company: string; service: string; meetingUrl?: string | null }) {
  const start = new Date(args.startsAt);
  const end = new Date(start.getTime() + args.durationMinutes * 60_000);
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const clean = (value: string) => value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const description = [`Client discovery call for ${args.service}.`, args.meetingUrl ? `Join: ${args.meetingUrl}` : ""].filter(Boolean).join("\\n");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//VirtualAssistant.com.ph//Discovery Booking//EN", "CALSCALE:GREGORIAN", "METHOD:REQUEST",
    "BEGIN:VEVENT", `UID:${clean(args.uid)}@virtualassistant.com.ph`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${clean(`VirtualAssistant.com.ph discovery call with ${args.company}`)}`, `DESCRIPTION:${clean(description)}`,
    ...(args.meetingUrl ? [`LOCATION:${clean(args.meetingUrl)}`, `URL:${clean(args.meetingUrl)}`] : []),
    "STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR", ""
  ].join("\r\n");
}

async function zoomAccessToken() {
  const accountId = process.env.ZOOM_ACCOUNT_ID?.trim();
  const clientId = process.env.ZOOM_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOOM_CLIENT_SECRET?.trim();
  if (!accountId || !clientId || !clientSecret) return null;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenResponse = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`, {
    method: "POST", headers: { Authorization: `Basic ${auth}` }, cache: "no-store"
  });
  if (!tokenResponse.ok) throw new Error(`Zoom authentication failed (${tokenResponse.status}).`);
  const token = await tokenResponse.json() as { access_token?: string };
  if (!token.access_token) throw new Error("Zoom did not return an access token.");
  return token.access_token;
}

export async function createZoomDiscoveryMeeting(args: { topic: string; startsAt: string; durationMinutes: number }) {
  const accessToken = await zoomAccessToken();
  const host = process.env.ZOOM_HOST_EMAIL?.trim() || "me";
  if (!accessToken) return { configured: false as const, joinUrl: null, meetingId: null };
  const response = await fetch(`https://api.zoom.us/v2/users/${encodeURIComponent(host)}/meetings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ topic: args.topic, type: 2, start_time: args.startsAt, duration: args.durationMinutes, timezone: "UTC", settings: { join_before_host: false, waiting_room: true } }),
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Zoom meeting creation failed (${response.status}).`);
  const meeting = await response.json() as { id?: number | string; join_url?: string };
  if (!meeting.join_url) throw new Error("Zoom did not return a join URL.");
  return { configured: true as const, joinUrl: meeting.join_url, meetingId: String(meeting.id || "") };
}

export async function cancelZoomDiscoveryMeeting(meetingId?: string | null) {
  const id = String(meetingId || "").trim();
  if (!id) return { configured: false as const, cancelled: false };
  const accessToken = await zoomAccessToken();
  if (!accessToken) return { configured: false as const, cancelled: false };
  const response = await fetch(`https://api.zoom.us/v2/meetings/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });
  if (!response.ok && response.status !== 404) throw new Error(`Zoom meeting cancellation failed (${response.status}).`);
  return { configured: true as const, cancelled: response.ok };
}
