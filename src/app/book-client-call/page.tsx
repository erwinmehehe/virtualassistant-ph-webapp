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
  title: "Book a Client Discovery Call",
  description: "Choose a time and tell us about the Virtual Assistant role you want to hire for.",
  alternates: { canonical: canonicalPath("/book-client-call") },
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

async function availableDays() {
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
              <h1>Book a focused client discovery call</h1>
              <p>Choose a time, answer a few practical questions, and let our recruiting team prepare before you meet.</p>
              <div className="booking-hero-points">
                <span><CalendarCheck2 size={16} /> 30-minute call</span>
                <span><ShieldCheck size={16} /> Private business details</span>
                <span><CheckCircle2 size={16} /> No payment required</span>
              </div>
            </div>
            <aside className="booking-hero-note">
              <strong>Applying as a VA?</strong>
              <p>Do not book a client call. Choose “I am a Virtual Assistant” below and we will send you to the application and recruiter interview process.</p>
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
                  <p className="kicker">Booking confirmed</p>
                  <h2>We will see you on {bookedWhen}</h2>
                  <p>A confirmation was sent to your email and copied to our hiring team. We will review your questionnaire and send the video meeting details before the call.</p>
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
