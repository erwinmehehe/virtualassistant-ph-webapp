// The former client analytics endpoint is intentionally retired.
// Some browsers may briefly hold an older JS bundle; acknowledge its beacon
// without performing authentication, logging or any database operation.
export async function POST() {
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
