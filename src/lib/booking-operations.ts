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

type GoogleCalendarEvent = {
  id?: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
  };
};

function googleMeetUrl(event: GoogleCalendarEvent) {
  return event.hangoutLink
    || event.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri
    || null;
}

function googleCalendarId() {
  return process.env.GOOGLE_CALENDAR_ID?.trim() || "primary";
}

async function googleCalendarAccessToken() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) {
    const missing = [
      !clientId ? "GOOGLE_CALENDAR_CLIENT_ID" : null,
      !clientSecret ? "GOOGLE_CALENDAR_CLIENT_SECRET" : null,
      !refreshToken ? "GOOGLE_CALENDAR_REFRESH_TOKEN" : null,
    ].filter(Boolean);
    throw new Error(`Google Meet integration is not configured. Missing ${missing.join(", ")}.`);
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  if (!tokenResponse.ok) throw new Error(`Google Calendar authentication failed (${tokenResponse.status}).`);
  const token = await tokenResponse.json() as { access_token?: string };
  if (!token.access_token) throw new Error("Google did not return an access token.");
  return token.access_token;
}

async function getGoogleCalendarEvent(eventId: string, accessToken: string) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleCalendarId())}/events/${encodeURIComponent(eventId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  );
  if (!response.ok) throw new Error(`Google Calendar event lookup failed (${response.status}).`);
  return response.json() as Promise<GoogleCalendarEvent>;
}

async function waitForGoogleMeetUrl(event: GoogleCalendarEvent, accessToken: string) {
  let current = event;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const link = googleMeetUrl(current);
    if (link) return link;
    if (!current.id) break;
    await new Promise((resolve) => setTimeout(resolve, 300));
    current = await getGoogleCalendarEvent(current.id, accessToken);
  }
  return null;
}

export async function createGoogleMeetDiscoveryMeeting(args: {
  topic: string;
  startsAt: string;
  durationMinutes: number;
  attendeeEmails: string[];
}) {
  const accessToken = await googleCalendarAccessToken();
  const start = new Date(args.startsAt);
  const end = new Date(start.getTime() + args.durationMinutes * 60_000);
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleCalendarId())}/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: args.topic,
        description: "VirtualAssistant.com.ph client discovery call",
        start: { dateTime: start.toISOString(), timeZone: "UTC" },
        end: { dateTime: end.toISOString(), timeZone: "UTC" },
        attendees: args.attendeeEmails.filter(Boolean).map((email) => ({ email })),
        // A candidate interview puts the client and the VA on one event, and
        // Google shows guests each other by default. That handed the client
        // the VA's personal email address before any placement existed.
        guestsCanSeeOtherGuests: false,
        guestsCanInviteOthers: false,
        guestsCanModify: false,
        conferenceData: {
          createRequest: {
            requestId: randomBytes(16).toString("hex"),
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      }),
      cache: "no-store",
    }
  );
  if (!response.ok) throw new Error(`Google Calendar meeting creation failed (${response.status}).`);
  const event = await response.json() as GoogleCalendarEvent;
  if (!event.id) throw new Error("Google Calendar did not return an event ID.");
  const joinUrl = await waitForGoogleMeetUrl(event, accessToken);
  if (!joinUrl) {
    try { await cancelGoogleMeetDiscoveryMeeting(event.id); } catch { /* best-effort cleanup */ }
    throw new Error("Google Calendar created the event but did not return a Google Meet link.");
  }
  return { configured: true as const, joinUrl, eventId: event.id };
}

export async function updateGoogleMeetDiscoveryMeeting(args: {
  eventId: string;
  startsAt: string;
  durationMinutes: number;
  attendeeEmails: string[];
}) {
  const accessToken = await googleCalendarAccessToken();
  const start = new Date(args.startsAt);
  const end = new Date(start.getTime() + args.durationMinutes * 60_000);
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleCalendarId())}/events/${encodeURIComponent(args.eventId)}?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        start: { dateTime: start.toISOString(), timeZone: "UTC" },
        end: { dateTime: end.toISOString(), timeZone: "UTC" },
        attendees: args.attendeeEmails.filter(Boolean).map((email) => ({ email })),
        // A candidate interview puts the client and the VA on one event, and
        // Google shows guests each other by default. That handed the client
        // the VA's personal email address before any placement existed.
        guestsCanSeeOtherGuests: false,
        guestsCanInviteOthers: false,
        guestsCanModify: false,
      }),
      cache: "no-store",
    }
  );
  if (!response.ok) throw new Error(`Google Calendar meeting update failed (${response.status}).`);
  const event = await response.json() as GoogleCalendarEvent;
  const joinUrl = googleMeetUrl(event) || await waitForGoogleMeetUrl(event, accessToken);
  if (!joinUrl) throw new Error("Google Calendar updated the event but did not return its Google Meet link.");
  return { configured: true as const, joinUrl, eventId: event.id || args.eventId };
}

export async function cancelGoogleMeetDiscoveryMeeting(eventId?: string | null) {
  const id = String(eventId || "").trim();
  if (!id) return { configured: false as const, cancelled: false };
  const accessToken = await googleCalendarAccessToken();
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleCalendarId())}/events/${encodeURIComponent(id)}?sendUpdates=all`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );
  if (!response.ok && response.status !== 404 && response.status !== 410) {
    throw new Error(`Google Calendar meeting cancellation failed (${response.status}).`);
  }
  return { configured: true as const, cancelled: response.ok };
}
