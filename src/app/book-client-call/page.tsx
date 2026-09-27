import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck2, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ClientBookingForm } from "@/components/client-booking-form";
import { buildDiscoverySlotDays, formatDiscoverySlot } from "@/lib/discovery-booking";
import { canonicalPath } from "@/lib/seo-url";
import { createAdminClient } from "@/lib/supabase/admin";
import "./booking.css";

export const metadata: Metadata = {
  title: "Book a Virtual Assistant Hiring Call",
  description: "Book a focused 30-minute call to discuss the Virtual Assistant role, hours, budget, and hiring timeline.",
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
            <div className="booking-hero-copy">
              <span className="booking-eyebrow">30-minute hiring call</span>
              <h1>Book a focused call about the VA you need.</h1>
              <p>Choose a time, share the essentials, and give our recruiting team enough context to make the conversation useful from minute one.</p>
              <div className="booking-hero-points">
                <span><Clock3 size={16} /> 30 minutes</span>
                <span><ShieldCheck size={16} /> Private hiring brief</span>
                <span><CheckCircle2 size={16} /> No payment required</span>
              </div>
            </div>
            <aside className="booking-call-preview">
              <div className="booking-call-preview-head">
                <span><CalendarCheck2 size={18} /></span>
                <div>
                  <small>What we will cover</small>
                  <strong>A clear hiring plan, not a generic sales call</strong>
                </div>
              </div>
              <ol>
                <li><span>1</span><div><strong>Role</strong><small>What the VA should own and what good looks like.</small></div></li>
                <li><span>2</span><div><strong>Fit</strong><small>Hours, budget, start date, tools, and must-have experience.</small></div></li>
                <li><span>3</span><div><strong>Next step</strong><small>What we need to shortlist the right candidates.</small></div></li>
              </ol>
              <div className="booking-applicant-route">
                <span>Looking for VA work?</span>
                <Link href="/auth/join/va">Apply as a Virtual Assistant</Link>
              </div>
            </aside>
          </div>
        </section>

        <section className="booking-main-section">
          <div className="container booking-container">
            {bookedWhen ? (
              <div className="booking-success" role="status">
                <span><CheckCircle2 size={30} /></span>
                <div>
                  <p className="kicker">Time confirmed</p>
                  <h2>We will talk on {bookedWhen}</h2>
                  <p>Your time is locked in. We will use the hiring brief you submitted to prepare before the conversation.</p>
                  <div className="booking-success-actions">
                    <Link className="btn btn-primary" href="/hire">Add more role details</Link>
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
