"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRoleFast } from "@/lib/auth";
import { cancelGoogleMeetDiscoveryMeeting, createBookingManageToken, createGoogleMeetDiscoveryMeeting, hashBookingManageToken, recreateBookingManageToken, updateGoogleMeetDiscoveryMeeting } from "@/lib/booking-operations";
import { isAllowedDiscoverySlot } from "@/lib/discovery-booking";
import { queueDiscoveryOutcomeAutomation } from "@/lib/trigger-automation";
import { resolveDiscoveryOutcomeArtifacts } from "@/lib/discovery-outcome-automation";

function managePath(token: string, result: string) {
  return `/book-client-call/manage?token=${encodeURIComponent(token)}&${result}`;
}

export async function cancelDiscoveryBookingAction(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  if (token.length < 32) redirect("/book-client-call/manage?error=invalid");
  const admin = createAdminClient();
  const { data: lead } = await admin.from("lead_intake").select("id,name,email,company,discovery_scheduled_at,discovery_duration_minutes,discovery_calendar_event_id,discovery_manage_token_expires_at").eq("discovery_manage_token_hash", hashBookingManageToken(token)).gt("discovery_manage_token_expires_at", new Date().toISOString()).maybeSingle();
  if (!lead?.id) redirect("/book-client-call/manage?error=invalid");
  const now = new Date().toISOString();
  let calendarCancelled = false;
  if (lead.discovery_calendar_event_id) {
    try {
      await cancelGoogleMeetDiscoveryMeeting(lead.discovery_calendar_event_id);
      calendarCancelled = true;
    } catch (error) {
      console.error("[booking] Google Calendar cancellation failed", { leadId: lead.id, error });
      // A failed calendar cancellation must not leave an apparently cancelled CRM booking.
      redirect(managePath(token, "error=calendar"));
    }
  }
  const { data: cancelled, error } = await admin.from("lead_intake")
    .update({ discovery_cancelled_at: now, discovery_outcome: "cancelled", discovery_scheduled_at: null, crm_stage: "nurture", next_follow_up_at: now, stage_updated_at: now })
    .eq("id", lead.id)
    .eq("discovery_manage_token_hash", hashBookingManageToken(token))
    .select("id")
    .maybeSingle();
  if (error || !cancelled) {
    // Google accepted the deletion but Supabase could not save it: recreate a
    // meeting for the original slot instead of silently losing the calendar event.
    if (calendarCancelled && lead.discovery_scheduled_at) {
      try {
        const restored = await createGoogleMeetDiscoveryMeeting({
          topic: `VirtualAssistant.com.ph discovery call with ${lead.company || lead.name}`,
          startsAt: lead.discovery_scheduled_at,
          durationMinutes: lead.discovery_duration_minutes || 30,
          attendeeEmails: [lead.email],
          notifyAttendees: true,
        });
        const { error: restoreError } = await admin.from("lead_intake")
          .update({ discovery_calendar_event_id: restored.eventId, discovery_meeting_url: restored.joinUrl })
          .eq("id", lead.id);
        if (restoreError) throw restoreError;
      } catch (restoreError) {
        console.error("[booking] cancelled meeting restoration needs manual reconciliation", { leadId: lead.id, error: restoreError });
      }
    }
    redirect(managePath(token, "error=cancel"));
  }
  try { await resolveDiscoveryOutcomeArtifacts(admin, lead.id); } catch { /* cancellation remains valid if stale reminder cleanup fails */ }
  redirect(managePath(token, "cancelled=1"));
}

export async function rescheduleDiscoveryBookingAction(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  const scheduledAt = String(formData.get("scheduled_at") || "").trim();
  if (token.length < 32 || !isAllowedDiscoverySlot(scheduledAt)) redirect(managePath(token, "error=slot"));
  const admin = createAdminClient();
  const { data: lead } = await admin.from("lead_intake").select("id,name,email,company,service,timezone,discovery_duration_minutes,discovery_scheduled_at,discovery_meeting_url,discovery_calendar_event_id,discovery_cancelled_at,discovery_outcome,discovery_manage_token_expires_at").eq("discovery_manage_token_hash", hashBookingManageToken(token)).gt("discovery_manage_token_expires_at", new Date().toISOString()).maybeSingle();
  if (!lead?.id) redirect("/book-client-call/manage?error=invalid");

  const now = new Date().toISOString();
  const previousEventId = lead.discovery_calendar_event_id;
  const previousMeetingUrl = lead.discovery_meeting_url;
  const canReuseCalendarEvent = Boolean(previousEventId && !lead.discovery_cancelled_at && lead.discovery_outcome !== "cancelled");
  let meeting: Awaited<ReturnType<typeof createGoogleMeetDiscoveryMeeting>> | null = null;
  const calendarConfigured = Boolean(
    process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim() &&
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim() &&
    process.env.GOOGLE_CALENDAR_REFRESH_TOKEN?.trim()
  );
  // A deployment without Google Calendar keeps the existing manual-booking fallback.
  // When an event already exists (or Calendar is configured), a failed update
  // must not silently change the CRM date while the calendar retains the old time.
  if (canReuseCalendarEvent || calendarConfigured) {
    try {
      meeting = canReuseCalendarEvent
        ? await updateGoogleMeetDiscoveryMeeting({
            eventId: previousEventId,
            startsAt: scheduledAt,
            durationMinutes: lead.discovery_duration_minutes || 30,
            attendeeEmails: [lead.email],
            notifyAttendees: false,
          })
        : await createGoogleMeetDiscoveryMeeting({
            topic: `VirtualAssistant.com.ph discovery call with ${lead.company || lead.name}`,
            startsAt: scheduledAt,
            durationMinutes: lead.discovery_duration_minutes || 30,
            attendeeEmails: [lead.email],
            notifyAttendees: false,
          });
    } catch (error) {
      console.error("[booking] Google Calendar reschedule failed", { leadId: lead.id, error });
      // A network timeout can happen after Google applied the PATCH. Best effort:
      // restore the original slot before telling the visitor the change failed.
      if (canReuseCalendarEvent && previousEventId && lead.discovery_scheduled_at) {
        try {
          await updateGoogleMeetDiscoveryMeeting({
            eventId: previousEventId,
            startsAt: lead.discovery_scheduled_at,
            durationMinutes: lead.discovery_duration_minutes || 30,
            attendeeEmails: [lead.email],
            notifyAttendees: false,
          });
        } catch (restoreError) {
          console.error("[booking] Google Calendar reschedule restoration failed", { leadId: lead.id, error: restoreError });
        }
      }
      redirect(managePath(token, "error=calendar"));
    }
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

  let saveQuery = admin.from("lead_intake").update(update).eq("id", lead.id);
  // Do not overwrite a booking that another browser tab rescheduled meanwhile.
  saveQuery = lead.discovery_scheduled_at
    ? saveQuery.eq("discovery_scheduled_at", lead.discovery_scheduled_at)
    : saveQuery.is("discovery_scheduled_at", null);
  const { data: saved, error } = await saveQuery.select("id").maybeSingle();
  if (error || !saved) {
    // Another tab may have saved a different time after our original read.
    // Reconcile Google to the *persisted* time, rather than blindly restoring
    // the stale old time and overwriting the other tab's successful reschedule.
    const { data: persistedBooking, error: recoveryLookupError } = await admin.from("lead_intake")
      .select("discovery_scheduled_at,discovery_cancelled_at,discovery_calendar_event_id")
      .eq("id", lead.id)
      .maybeSingle();
    if (recoveryLookupError) {
      console.error("[booking] failed to look up persisted booking for calendar reconciliation", { leadId: lead.id, error: recoveryLookupError });
    }
    const persistedTime = persistedBooking
      ? (persistedBooking.discovery_cancelled_at ? null : persistedBooking.discovery_scheduled_at)
      : lead.discovery_scheduled_at;
    const persistedCalendarId = persistedBooking?.discovery_calendar_event_id || null;
    if (meeting?.eventId) {
      try {
        const orphanedEvent = !canReuseCalendarEvent && persistedCalendarId !== meeting.eventId;
        if (!persistedTime || orphanedEvent || (persistedCalendarId && persistedCalendarId !== meeting.eventId)) {
          await cancelGoogleMeetDiscoveryMeeting(meeting.eventId);
        } else {
          await updateGoogleMeetDiscoveryMeeting({
            eventId: meeting.eventId,
            startsAt: persistedTime,
            durationMinutes: lead.discovery_duration_minutes || 30,
            attendeeEmails: [lead.email],
            notifyAttendees: false,
          });
        }
      } catch (restoreError) {
        console.error("[booking] unsaved Google Calendar reschedule needs reconciliation", { leadId: lead.id, error: restoreError });
      }
    }
    redirect(managePath(token, error?.code === "23505" ? "error=taken" : "error=reschedule"));
  }

  try {
    await resolveDiscoveryOutcomeArtifacts(admin, lead.id);
  } catch {
    // Rescheduling remains valid if stale reminder cleanup fails.
  }

  try {
    await queueDiscoveryOutcomeAutomation(
      lead.id,
      scheduledAt,
      lead.discovery_duration_minutes || 30,
    );
  } catch {
    // Rescheduling remains valid if durable automation is temporarily unavailable.
  }

  redirect(managePath(token, "rescheduled=1"));
}


export async function openClientDiscoveryBookingAction() {
  const { userId } = await requireRoleFast("client");
  const admin = createAdminClient();
  const { data: leads, error } = await admin
    .from("lead_intake")
    .select("id,lead_type,client_id,created_at,discovery_scheduled_at,discovery_outcome,discovery_manage_token_hash,discovery_manage_token_id,discovery_manage_token_expires_at")
    .eq("client_id", userId)
    .eq("lead_type", "client_hiring")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) redirect("/workspace/client?booking_error=1");

  const lead = (leads || []).find((row: any) =>
    Boolean(row.discovery_scheduled_at) || ["no_show", "cancelled", "rescheduled"].includes(String(row.discovery_outcome || ""))
  );
  if (!lead?.id) redirect("/book-client-call");

  let manage = recreateBookingManageToken(
    lead.discovery_manage_token_id,
    lead.discovery_manage_token_expires_at,
  );
  if (!manage || manage.hash !== lead.discovery_manage_token_hash) {
    manage = createBookingManageToken();
    const { error: tokenError } = await admin
      .from("lead_intake")
      .update({
        discovery_manage_token: null,
        discovery_manage_token_hash: manage.hash,
        discovery_manage_token_id: manage.tokenId,
        discovery_manage_token_expires_at: manage.expiresAt,
      })
      .eq("id", lead.id)
      .eq("client_id", userId);
    if (tokenError) redirect("/workspace/client?booking_error=1");
  }

  redirect(`/book-client-call/manage?token=${encodeURIComponent(manage.token)}`);
}
