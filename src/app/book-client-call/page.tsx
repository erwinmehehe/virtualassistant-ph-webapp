import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ClientBookingForm } from "@/components/client-booking-form";
import { buildDiscoverySlotDays, formatDiscoverySlot } from "@/lib/discovery-booking";
import { canonicalPath } from "@/lib/seo-url";
import { socialMetadata } from "@/lib/og";
import { createAdminClient } from "@/lib/supabase/admin";
import "./booking.css";

export const metadata: Metadata = {
  title: "Book a Discovery Call",
  description: "Choose a time for a 30-minute Virtual Assistant discovery call.",
  alternates: { canonical: canonicalPath("/book-client-call") },
  robots: { index: false, follow: true },
  ...socialMetadata({
    title: "Book a Discovery Call",
    description: "Choose a time for a 30-minute Virtual Assistant discovery call.",
    path: canonicalPath("/book-client-call"),
    category: "hiring",
    eyebrow: "Discovery Call",
  }),
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
  } catch (error) {
    console.error("[booking] Could not load booked discovery slots; showing provisional availability.", error);
    return buildDiscoverySlotDays([], new Date());
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
          <div className="container booking-hero-inner">
            <h1>Book a discovery call</h1>
            <p>Choose a time that works for you. We’ll use the call to understand the role and what you need help with.</p>
          </div>
        </section>

        <section className="booking-main-section">
          <div className="container booking-container">
            {bookedWhen ? (
              <div className="booking-success" role="status">
                <span><CheckCircle2 size={30} /></span>
                <div>
                  <p className="kicker">Call confirmed</p>
                  <h2>{bookedWhen}</h2>
                  <p>Your booking is saved. We’ll use the details you sent to prepare for the conversation.</p>
                  <div className="booking-success-actions">
                    <Link className="btn btn-primary" href="/workspace/client">Open client workspace</Link>
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
