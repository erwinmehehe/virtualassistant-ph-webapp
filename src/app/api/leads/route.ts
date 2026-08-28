import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLeadNotificationEmail } from "@/lib/email";

const schema = z.object({
  name: z.string().optional().nullable(),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  service: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  hours: z.string().optional().nullable(),
  start_time: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  source_page: z.string().optional().nullable(),
  page_url: z.string().url().optional().nullable(),
  session_id: z.string().uuid().optional().nullable()
});

function secretMatches(supplied: string | null, expected: string) {
  if (!supplied) return false;
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  if (suppliedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(suppliedBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  const expectedSecret = process.env.LEAD_INGEST_SECRET?.trim() || "";
  if (expectedSecret.length < 32) {
    return NextResponse.json({ error: "Lead ingestion is not configured" }, { status: 503 });
  }

  const supplied = request.headers.get("x-lead-secret");
  if (!secretMatches(supplied, expectedSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid lead payload", details: parsed.error.flatten() }, { status: 400 });
  const admin = createAdminClient();
  const { data, error } = await admin.from("lead_intake").insert(parsed.data).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  try {
    await sendLeadNotificationEmail({
      leadId: data.id,
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company,
      service: parsed.data.service,
      hours: parsed.data.hours,
      timezone: parsed.data.timezone,
      message: parsed.data.message,
      sourcePage: parsed.data.source_page,
      pageUrl: parsed.data.page_url
    });
  } catch (error) {
    console.error("[email] Lead notification delivery failed", error);
    // API ingestion succeeds even if notification delivery is temporarily unavailable.
  }
  return NextResponse.json({ ok: true, lead_id: data.id }, { status: 201 });
}
