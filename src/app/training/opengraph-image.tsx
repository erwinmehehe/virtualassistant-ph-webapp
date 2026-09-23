import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Free Virtual Assistant training for Filipinos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const outcomes = [
  "Client communication",
  "Admin workflows",
  "Software skills",
  "Industry context",
] as const;

export default function TrainingOpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#fbfbfe",
          color: "#101828",
          fontFamily: "Arial, Helvetica, sans-serif",
          padding: "58px 64px",
        }}
      >
        <div
          style={{
            width: "61%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            paddingRight: 54,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#444ce7",
                color: "#ffffff",
                fontSize: 18,
                fontWeight: 800,
                marginRight: 13,
              }}
            >
              VA
            </div>
            <div style={{ display: "flex", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>
              VirtualAssistant<span style={{ color: "#444ce7" }}>.com.ph</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: 70 }}>
            <div
              style={{
                display: "flex",
                color: "#3538cd",
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Free VA training for Filipinos
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 18,
                maxWidth: 650,
                fontSize: 66,
                lineHeight: 1.02,
                letterSpacing: "-0.055em",
                fontWeight: 800,
              }}
            >
              Learn the work.
            </div>
            <div
              style={{
                display: "flex",
                maxWidth: 650,
                fontSize: 66,
                lineHeight: 1.02,
                letterSpacing: "-0.055em",
                fontWeight: 800,
                color: "#3538cd",
              }}
            >
              Show what you can do.
            </div>
            <div
              style={{
                display: "flex",
                maxWidth: 590,
                marginTop: 24,
                color: "#475467",
                fontSize: 23,
                lineHeight: 1.42,
              }}
            >
              Practical, mobile-friendly training built around real Virtual Assistant workflows.
            </div>
          </div>

          <div style={{ display: "flex", marginTop: "auto", color: "#667085", fontSize: 18 }}>
            No course fee · Free certificates · Training is optional
          </div>
        </div>

        <div
          style={{
            width: "39%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            borderRadius: 24,
            background: "#101828",
            color: "#ffffff",
            padding: "30px 30px 26px",
          }}
        >
          <div style={{ display: "flex", color: "#98a2b3", fontSize: 16, fontWeight: 700 }}>
            WHAT YOU BUILD
          </div>
          <div style={{ display: "flex", marginTop: 8, fontSize: 27, fontWeight: 800 }}>
            Client-ready proof
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
            {outcomes.map((outcome, index) => (
              <div
                key={outcome}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "18px 0",
                  borderTop: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: 34,
                    color: "#a4bcfd",
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div style={{ display: "flex", fontSize: 21, fontWeight: 700 }}>{outcome}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: "auto",
              paddingTop: 18,
              borderTop: "1px solid rgba(255,255,255,0.10)",
              color: "#cfd4dc",
              fontSize: 16,
            }}
          >
            Short lessons. Practical exercises. No paid upgrade.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
