import { createSiteIconResponse } from "@/lib/site-icon-response";

export const runtime = "nodejs";

export async function GET() {
  return createSiteIconResponse(180);
}
