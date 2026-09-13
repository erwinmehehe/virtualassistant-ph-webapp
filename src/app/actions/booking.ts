"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { bookingManageUrl, cancelZoomDiscoveryMeeting, createZoomDiscoveryMeeting, hashBookingManageToken } from "@/lib/booking-operations";
import { formatDiscoverySlot, isAllowedDiscoverySlot } from "@/lib/discovery-booking";
import { sendTransactionalEventEmail } from "@/lib/email";

function managePath(token: string, result: string) {
  return `/book-client-call/manage?token=${encodeURIComponent(token)}&${result}`;
}

export async function cancelDiscoveryBookingAction(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  if (token.length < 32) redirect("/book-client-call/manage?error=invalid");
  const admin = createAdminClient();
  const { data: lead } = await admin.from("lead_intake").select("id,name,email,discovery_scheduled_at,discovery_zoom_meeting_id").eq("discovery_manage_token_hash", hashBookingManageToken(token)).maybeSingle();
  if (!lead?.id) redirect("/book-client-call/manage?error=invalid");
  const now = new Date().toISOString();
  const { error } = await admin.from("lead_intake").update({ discovery_cancelled_at: now, discovery_outcome: "cancelled", discovery_scheduled_at: null, crm_stage: "nurture", next_follow_up_at: now, stage_updated_at: now }).eq("id", lead.id);
  if (error) redirect(managePath(token, "error=cancel"));
  try { await cancelZoomDiscoveryMeeting(lead.discovery_zoom_meeting_id); } catch { /* the CRM cancellation remains valid if Zoom is temporarily unavailable */ }
  await sendTransactionalEventEmail({ to: lead.email, subject: "Discovery call cancelled", heading: "Your discovery call is cancelled", body: "Your time has been released. You can contact our hiring team whenever you are ready to book again.", href: bookingManageUrl(token), hrefLabel: "View booking" });
  redirect(managePath(token, "cancelled=1"));
}

export async function rescheduleDiscoveryBookingAction(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  const scheduledAt = String(formData.get("scheduled_at") || "").trim();
  if (token.length < 32 || !isAllowedDiscoverySlot(scheduledAt)) redirect(managePath(token, "error=slot"));
  const admin = createAdminClient();
  const { data: lead } = await admin.from("lead_intake").select("id,name,email,company,timezone,discovery_duration_minutes").eq("discovery_manage_token_hash", hashBookingManageToken(token)).maybeSingle();
  if (!lead?.id) redirect("/book-client-call/manage?error=invalid");
  const now = new Date().toISOString();
  let zoom: Awaited<ReturnType<typeof createZoomDiscoveryMeeting>> = { configured: false, joinUrl: null, meetingId: null };
  try { zoom = await createZoomDiscoveryMeeting({ topic: `VirtualAssistant.com.ph discovery call with ${lead.company || lead.name}`, startsAt: scheduledAt, durationMinutes: lead.discovery_duration_minutes || 30 }); } catch { /* keep the existing link if Zoom is unavailable */ }
  const update: Record<string, unknown> = { discovery_scheduled_at: scheduledAt, discovery_cancelled_at: null, discovery_rescheduled_at: now, discovery_outcome: "rescheduled", discovery_reminder_24h_sent_at: null, discovery_reminder_1h_sent_at: null, crm_stage: "discovery_booked", stage_updated_at: now };
  if (zoom.joinUrl) { update.discovery_meeting_url = zoom.joinUrl; update.discovery_zoom_meeting_id = zoom.meetingId; }
  const { error } = await admin.from("lead_intake").update(update).eq("id", lead.id);
  if (error) redirect(managePath(token, error.code === "23505" ? "error=taken" : "error=reschedule"));
  const label = formatDiscoverySlot(scheduledAt, lead.timezone || "Asia/Manila");
  await sendTransactionalEventEmail({ to: lead.email, subject: `Discovery call rescheduled: ${label}`, heading: "Your discovery call was rescheduled", body: `Your new time is ${label}.`, href: bookingManageUrl(token), hrefLabel: "Manage booking" });
  redirect(managePath(token, "rescheduled=1"));
}
