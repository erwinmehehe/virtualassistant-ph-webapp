import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ManageBookingForm } from "@/components/manage-booking-form";
import { buildDiscoverySlotDays, formatDiscoverySlot } from "@/lib/discovery-booking";
import { hashBookingManageToken } from "@/lib/booking-operations";
import { createAdminClient } from "@/lib/supabase/admin";
import "../booking.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manage discovery call", robots: { index: false, follow: false } };

export default async function ManageBookingPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const token = query.token || "";
  if (token.length < 32) notFound();
  const admin = createAdminClient();
  const { data: lead } = await admin.from("lead_intake").select("id,company,timezone,discovery_scheduled_at,discovery_cancelled_at,discovery_outcome").eq("discovery_manage_token_hash", hashBookingManageToken(token)).maybeSingle();
  if (!lead) notFound();
  const now = new Date();
  const until = new Date(now.getTime() + 15 * 86400000).toISOString();
  const { data: booked } = await admin.from("lead_intake").select("discovery_scheduled_at").neq("id", lead.id).not("discovery_scheduled_at", "is", null).gte("discovery_scheduled_at", now.toISOString()).lte("discovery_scheduled_at", until);
  const days = buildDiscoverySlotDays((booked || []).map((row) => row.discovery_scheduled_at).filter(Boolean), now);
  const rebookOnly = lead.discovery_outcome === "no_show" || Boolean(lead.discovery_cancelled_at) || lead.discovery_outcome === "cancelled";
  return <><SiteHeader/><main id="main-content" className="booking-page"><section className="booking-hero"><div className="container booking-container"><span className="kicker">Client discovery call</span><h1>{rebookOnly ? "Choose another time" : "Manage your booking"}</h1><p>{lead.company}{lead.discovery_scheduled_at ? ` · ${formatDiscoverySlot(lead.discovery_scheduled_at, lead.timezone || "Asia/Manila")}` : ""}</p></div></section><section className="section section-white booking-main-section"><div className="container booking-container">{query.cancelled ? <div className="alert success">Your booking is cancelled. You can choose another time below.</div> : null}{query.rescheduled ? <div className="alert success">Your booking was rescheduled.</div> : null}{query.error ? <div className="alert error">We could not update that booking. Please choose another time or contact the hiring team.</div> : null}<ManageBookingForm token={token} days={days} rebookOnly={rebookOnly}/></div></section></main><SiteFooter/></>;
}
