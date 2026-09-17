import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck2, CheckCircle2, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ClientBookingForm } from "@/components/client-booking-form";
import { buildDiscoverySlotDays, formatDiscoverySlot } from "@/lib/discovery-booking";
import { canonicalPath } from "@/lib/seo-url";
import { createAdminClient } from "@/lib/supabase/admin";
import "./booking.css";

export const metadata: Metadata = {
  title: "Talk to Our Hiring Team",
  description: "Choose a time to talk through the Virtual Assistant role you want to hire for.",
  alternates: { canonical: canonicalPath("/book-client-call") },
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

async function availableDays() {
  if (process.env.BOOKING_VISUAL_FIXTURE === "1") return buildDiscoverySlotDays([], new Date());
  try {
    const now = new Date();
    const until = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await createAdminClient()
      .from("lead_intake")
      .select("discovery_scheduled_at")
      .not("discovery_scheduled_at", "is", null)
      .gte("discovery_scheduled_at", now.toISOString())
      .lte("discovery_scheduled_at", until);
    return buildDiscoverySlotDays((data || []).map((row) => row.discovery_scheduled_at).filter(Boolean), now);
  } catch {
    return [];
  }
}

export default async function BookClientCallPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const days = await availableDays();
  const bookedWhen = query.booked && query.when ? formatDiscoverySlot(query.when, query.tz || "Asia/Manila") : null;

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="booking-page">
        <section className="booking-hero">
          <div className="container booking-hero-grid">
            <div>
              <span className="kicker">For businesses hiring a Virtual Assistant</span>
              <h1>Choose a time to talk with our team</h1>
              <p>Pick a time, leave your contact details, and we will cover the role, schedule, budget, and next steps together on the call.</p>
              <div className="booking-hero-points">
                <span><CalendarCheck2 size={16} /> 30-minute conversation</span>
                <span><ShieldCheck size={16} /> Private business details</span>
                <span><CheckCircle2 size={16} /> No payment required</span>
              </div>
            </div>
            <aside className="booking-hero-note">
              <strong>Applying as a VA?</strong>
              <p>This scheduling form is for businesses hiring a Virtual Assistant. Choose “I am a Virtual Assistant” below and we will send you to the application and recruiter interview process.</p>
              <Link href="/auth/join/va">Go directly to the VA application</Link>
            </aside>
          </div>
        </section>

        <section className="section section-white booking-main-section">
          <div className="container booking-container">
            {bookedWhen ? (
              <div className="booking-success" role="status">
                <span><CheckCircle2 size={30} /></span>
                <div>
                  <p className="kicker">Time confirmed</p>
                  <h2>We will talk on {bookedWhen}</h2>
                  <p>A confirmation was sent to your email and copied to our hiring team. We will review your request and make sure the conversation is focused on the role you need to fill.</p>
                  <div className="booking-success-actions">
                    <Link className="btn btn-primary" href="/hire">Add more hiring details</Link>
                    <Link className="btn" href="/">Return home</Link>
                  </div>
                </div>
              </div>
            ) : (
              <ClientBookingForm days={days} error={query.error} />
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
