export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    zoom_account_id: Boolean(process.env.ZOOM_ACCOUNT_ID?.trim()),
    zoom_client_id: Boolean(process.env.ZOOM_CLIENT_ID?.trim()),
    zoom_client_secret: Boolean(process.env.ZOOM_CLIENT_SECRET?.trim()),
    zoom_host_email: Boolean(process.env.ZOOM_HOST_EMAIL?.trim()),
  }, {
    headers: { "cache-control": "no-store" }
  });
}
