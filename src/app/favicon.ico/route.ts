export const runtime = "nodejs";

function redirectToPng(request: Request) {
  const location = new URL("/favicon.png", request.url);

  return new Response(null, {
    status: 308,
    headers: {
      Location: location.toString(),
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
    },
  });
}

export function GET(request: Request) {
  return redirectToPng(request);
}

export function HEAD(request: Request) {
  return redirectToPng(request);
}
