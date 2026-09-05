import { ImageResponse } from "next/og";

/**
 * Site-wide share image.
 *
 * Without one, Google and social platforms picked the first image on the page,
 * which on the homepage is a VA's profile photo. A real member's face was
 * standing in as the brand thumbnail in search results and link previews.
 *
 * Generated rather than a static asset so it stays in step with the wordmark
 * and needs no design file checked into the repo. Pages that want their own
 * image can add their own opengraph-image in that route segment.
 */
export const runtime = "nodejs";
export const alt = "VirtualAssistant.com.ph - vetted Filipino virtual assistants";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b1b34",
          padding: "72px 80px",
          fontFamily: "Helvetica, Arial, sans-serif"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#1677ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 30,
              fontWeight: 700
            }}
          >
            VA
          </div>
          <div style={{ display: "flex", fontSize: 27, color: "#e6edf7", fontWeight: 600 }}>
            VirtualAssistant<span style={{ color: "#5aa9ff" }}>.com.ph</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 68, lineHeight: 1.1, color: "#ffffff", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Vetted Filipino virtual assistants
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#9db4d4", marginTop: 22, lineHeight: 1.35 }}>
            Skills tested. Human vetted. Matched to your role.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, color: "#7f9bc0" }}>
          <div style={{ display: "flex", width: 10, height: 10, borderRadius: 5, background: "#12b76a" }} />
          <div style={{ display: "flex" }}>Admin · Customer support · Ecommerce · Bookkeeping · Marketing</div>
        </div>
      </div>
    ),
    size
  );
}
