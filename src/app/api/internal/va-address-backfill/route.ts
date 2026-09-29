import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runVaAddressResumeBackfill } from "@/lib/va-address-backfill";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPECTED_TOKEN_HASH = "456542ecef51bbe338058477c319ec5b7f6f5ff23f642341576b4dfd4e01fe4d";

function validToken(value: string | null) {
  if (!value) return false;
  const actual = Buffer.from(createHash("sha256").update(value).digest("hex"));
  const expected = Buffer.from(EXPECTED_TOKEN_HASH);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!validToken(url.searchParams.get("token"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runVaAddressResumeBackfill(12);
  return NextResponse.json({ ok: true, ...result });
}
