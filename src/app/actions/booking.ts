"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRoleFast } from "@/lib/auth";
import { bookingManageUrl, cancelGoogleMeetDiscoveryMeeting, createGoogleMeetDiscoveryMeeting, hashBookingManageToken, updateGoogleMeetDiscoveryMeeting } from "@/lib/booking-operations";
import { formatDiscoverySlot, isAllowedDiscoverySlot } from "@/lib/discovery-booking";
import { sendTransactionalEventEmail } from "@/lib/email";

function managePath(token: string, result: string) {
  return `/book-client-call/manage?token=${encodeURIComponent(token)}&${result}`;
}

export async function cancelDiscoveryBookingAction(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  if (token.length < 32) redirect("/book-client-call/manage?error=invalid");
  const admin = createAdminClient();
  const { data: lead } = await admin.from("lead_intake").select("id,name,email,discovery_scheduled_at,discovery_calendar_event_id").eq("discovery_manage_token_hash", hashBookingManageToken(token)).maybeSingle();
  if (!lead?.id) redirect("/book-client-call/manage?error=invalid");
  const now = new Date().toISOString();
  const { error } = await admin.from("lead_intake").update({ discovery_cancelled_at: now, discovery_outcome: "cancelled", discovery_scheduled_at: null, crm_stage: "nurture", next_follow_up_at: now, stage_updated_at: now }).eq("id", lead.id);
  if (error) redirect(managePath(token, "error=cancel"));
  try { await cancelGoogleMeetDiscoveryMeeting(lead.discovery_calendar_event_id); } catch { /* the CRM cancellation remains valid if Google Calendar is temporarily unavailable */ }
  await sendTransactionalEventEmail({ to: lead.email, subject: "Discovery call cancelled", heading: "Your discovery call is cancelled", body: "Your time has been released. When you are ready, use the link below to choose another available time.", href: bookingManageUrl(token), hrefLabel: "Rebook your call", priority: "critical", idempotencyKey: `booking-cancelled-${lead.id}` });
  redirect(managePath(token, "cancelled=1"));
}

export async function rescheduleDiscoveryBookingAction(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  const scheduledAt = String(formData.get("scheduled_at") || "").trim();
  if (token.length < 32 || !isAllowedDiscoverySlot(scheduledAt)) redirect(managePath(token, "error=slot"));
  const admin = createAdminClient();
  const { data: lead } = await admin.from("lead_intake").select("id,name,email,company,service,timezone,discovery_duration_minutes,discovery_meeting_url,discovery_calendar_event_id,discovery_cancelled_at,discovery_outcome").eq("discovery_manage_token_hash", hashBookingManageToken(token)).maybeSingle();
  if (!lead?.id) redirect("/book-client-call/manage?error=invalid");

  const now = new Date().toISOString();
  const previousEventId = lead.discovery_calendar_event_id;
  const previousMeetingUrl = lead.discovery_meeting_url;
  const canReuseCalendarEvent = Boolean(previousEventId && !lead.discovery_cancelled_at && lead.discovery_outcome !== "cancelled");
  let meeting: Awaited<ReturnType<typeof createGoogleMeetDiscoveryMeeting>> | null = null;
  try {
    meeting = canReuseCalendarEvent
      ? await updateGoogleMeetDiscoveryMeeting({
          eventId: previousEventId,
          startsAt: scheduledAt,
          durationMinutes: lead.discovery_duration_minutes || 30,
          attendeeEmails: [lead.email],
        })
      : await createGoogleMeetDiscoveryMeeting({
          topic: `VirtualAssistant.com.ph discovery call with ${lead.company || lead.name}`,
          startsAt: scheduledAt,
          durationMinutes: lead.discovery_duration_minutes || 30,
          attendeeEmails: [lead.email],
        });
  } catch {
    // Keep a still-valid existing meeting if Google Calendar is temporarily unavailable.
  }

  const update: Record<string, unknown> = {
    discovery_scheduled_at: scheduledAt,
    discovery_completed_at: null,
    discovery_cancelled_at: null,
    discovery_rescheduled_at: now,
    discovery_outcome: "rescheduled",
    discovery_reminder_24h_sent_at: null,
    discovery_reminder_1h_sent_at: null,
    crm_stage: "discovery_booked",
    stage_updated_at: now,
    discovery_meeting_url: meeting?.joinUrl || (canReuseCalendarEvent ? previousMeetingUrl : null),
    discovery_calendar_event_id: meeting?.eventId || (canReuseCalendarEvent ? previousEventId : null),
    discovery_meeting_provider: meeting || canReuseCalendarEvent ? "google_meet" : null,
  };

  const { error } = await admin.from("lead_intake").update(update).eq("id", lead.id);
  if (error) {
    if (meeting?.eventId && !canReuseCalendarEvent) {
      try { await cancelGoogleMeetDiscoveryMeeting(meeting.eventId); } catch { /* best-effort cleanup of the unsaved new event */ }
    }
    redirect(managePath(token, error.code === "23505" ? "error=taken" : "error=reschedule"));
  }

  const label = formatDiscoverySlot(scheduledAt, lead.timezone || "Asia/Manila");
  await sendTransactionalEventEmail({ to: lead.email, subject: `Discovery call rescheduled: ${label}`, heading: "Your discovery call was rescheduled", body: `Your new time is ${label}.`, href: bookingManageUrl(token), hrefLabel: "Manage booking", priority: "critical", idempotencyKey: `booking-rescheduled-${lead.id}-${scheduledAt}` });
  redirect(managePath(token, "rescheduled=1"));
}


export async function openClientDiscoveryBookingAction() {
  const { userId } = await requireRoleFast("client");
  const admin = createAdminClient();
  const { data: leads, error } = await admin
    .from("lead_intake")
    .select("id,lead_type,client_id,created_at,discovery_scheduled_at,discovery_outcome,discovery_manage_token,discovery_manage_token_hash")
    .eq("client_id", userId)
    .eq("lead_type", "client_hiring")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) redirect("/workspace/client?booking_error=1");

  const lead = (leads || []).find((row: any) =>
    Boolean(row.discovery_scheduled_at) || ["no_show", "cancelled", "rescheduled"].includes(String(row.discovery_outcome || ""))
  );
  if (!lead?.id) redirect("/book-client-call");

  let token = String(lead.discovery_manage_token || "").trim();
  if (!token) {
    const manage = createBookingManageToken();
    token = manage.token;
    const { error: tokenError } = await admin
      .from("lead_intake")
      .update({ discovery_manage_token: manage.token, discovery_manage_token_hash: manage.hash })
      .eq("id", lead.id)
      .eq("client_id", userId);
    if (tokenError) redirect("/workspace/client?booking_error=1");
  }

  redirect(`/book-client-call/manage?token=${encodeURIComponent(token)}`);
}
