import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "VirtualAssistant.com.ph - hire vetted Filipino virtual assistants";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const roleCards = [
  { initials: "EA", title: "Executive Assistant", note: "Calendar · Inbox · Research", top: 128 },
  { initials: "CS", title: "Customer Support", note: "Email · CRM · Customer care", top: 86 },
  { initials: "MKT", title: "Marketing VA", note: "Social · Content · Campaigns", top: 150 },
] as const;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #ffffff 0%, #f8f9ff 48%, #eef2ff 100%)",
          color: "#101828",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 460,
            height: 460,
            borderRadius: 230,
            right: -90,
            top: -150,
            background: "rgba(122, 90, 248, 0.10)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 340,
            height: 340,
            borderRadius: 170,
            left: 360,
            bottom: -210,
            background: "rgba(68, 76, 231, 0.09)",
          }}
        />

        <div
          style={{
            width: "54%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "52px 0 48px 60px",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(145deg, #444ce7, #7a5af8)",
                color: "#ffffff",
                fontSize: 20,
                fontWeight: 800,
                marginRight: 14,
              }}
            >
              VA
            </div>
            <div style={{ display: "flex", fontSize: 25, fontWeight: 800, letterSpacing: "-0.02em" }}>
              VirtualAssistant<span style={{ color: "#444ce7" }}>.com.ph</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 76,
              flexDirection: "column",
              maxWidth: 590,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 62,
                lineHeight: 1.02,
                letterSpacing: "-0.055em",
                fontWeight: 800,
                color: "#17205a",
              }}
            >
              Hire Vetted
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 62,
                lineHeight: 1.02,
                letterSpacing: "-0.055em",
                fontWeight: 800,
                color: "#5b45df",
              }}
            >
              Filipino VAs
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 22,
                fontSize: 25,
                lineHeight: 1.35,
                color: "#475467",
                maxWidth: 560,
              }}
            >
              Administrative, customer support, marketing, and executive support.
            </div>
          </div>

          <div style={{ display: "flex", marginTop: "auto", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "11px 14px",
                borderRadius: 14,
                background: "#ffffff",
                border: "1px solid #e4e7ec",
                boxShadow: "0 8px 24px rgba(16, 24, 40, 0.06)",
                marginRight: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#ecfdf3",
                  color: "#12b76a",
                  fontWeight: 800,
                  marginRight: 9,
                }}
              >
                ✓
              </div>
              <div style={{ display: "flex", fontSize: 17, color: "#344054", fontWeight: 700 }}>
                Recruiter-screened
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "11px 14px",
                borderRadius: 14,
                background: "#ffffff",
                border: "1px solid #e4e7ec",
                boxShadow: "0 8px 24px rgba(16, 24, 40, 0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#eef2ff",
                  color: "#444ce7",
                  fontWeight: 800,
                  marginRight: 9,
                }}
              >
                ↗
              </div>
              <div style={{ display: "flex", fontSize: 17, color: "#344054", fontWeight: 700 }}>
                Flexible remote hiring
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            width: "46%",
            height: "100%",
            display: "flex",
            position: "relative",
            paddingRight: 44,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 24,
              top: 58,
              display: "flex",
              flexDirection: "column",
              color: "#7a5af8",
              fontSize: 15,
              letterSpacing: "0.24em",
              fontWeight: 700,
              lineHeight: 1.5,
            }}
          >
            <div style={{ display: "flex" }}>FILIPINO TALENT</div>
            <div style={{ display: "flex" }}>GLOBAL IMPACT</div>
          </div>

          {roleCards.map((card, index) => (
            <div
              key={card.title}
              style={{
                position: "absolute",
                top: card.top,
                left: 18 + index * 154,
                width: 184,
                height: 336,
                display: "flex",
                flexDirection: "column",
                borderRadius: 24,
                background: "rgba(255, 255, 255, 0.95)",
                border: "1px solid rgba(255,255,255,0.9)",
                boxShadow: "0 22px 48px rgba(68, 76, 231, 0.14)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: 176,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    index === 0
                      ? "linear-gradient(145deg, #eefcf8, #e0f2fe)"
                      : index === 1
                        ? "linear-gradient(145deg, #eef2ff, #ede9fe)"
                        : "linear-gradient(145deg, #fff1f2, #f5f3ff)",
                }}
              >
                <div
                  style={{
                    width: 98,
                    height: 98,
                    borderRadius: 49,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(145deg, #26345f, #444ce7)",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: index === 2 ? 24 : 30,
                    boxShadow: "0 10px 28px rgba(68, 76, 231, 0.2)",
                  }}
                >
                  {card.initials}
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  top: 156,
                  left: 14,
                  display: "flex",
                  alignItems: "center",
                  background: "#ffffff",
                  padding: "7px 10px",
                  borderRadius: 999,
                  boxShadow: "0 6px 18px rgba(16,24,40,0.12)",
                  fontSize: 13,
                  color: "#344054",
                  fontWeight: 700,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    background: "#12b76a",
                    marginRight: 7,
                  }}
                />
                Available
              </div>

              <div style={{ display: "flex", flexDirection: "column", padding: "24px 16px 16px" }}>
                <div
                  style={{
                    display: "flex",
                    color: "#17205a",
                    fontSize: 19,
                    fontWeight: 800,
                    lineHeight: 1.1,
                  }}
                >
                  {card.title}
                </div>
                <div
                  style={{
                    display: "flex",
                    color: "#667085",
                    fontSize: 13,
                    lineHeight: 1.35,
                    marginTop: 10,
                  }}
                >
                  {card.note}
                </div>
                <div
                  style={{
                    display: "flex",
                    marginTop: 14,
                    padding: "7px 9px",
                    alignSelf: "flex-start",
                    borderRadius: 999,
                    background: "#f4f3ff",
                    color: "#5b45df",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Vetted talent
                </div>
              </div>
            </div>
          ))}

          <div
            style={{
              position: "absolute",
              left: 70,
              bottom: 44,
              width: 430,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 22px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.86)",
              border: "1px solid rgba(255,255,255,0.94)",
              boxShadow: "0 14px 32px rgba(68,76,231,0.10)",
            }}
          >
            {["SKILLED PEOPLE", "REAL RESULTS", "CLIENT SUPPORT"].map((label, index) => (
              <div key={label} style={{ display: "flex", alignItems: "center" }}>
                {index > 0 ? (
                  <div
                    style={{
                      width: 1,
                      height: 28,
                      background: "#d0d5dd",
                      marginRight: 18,
                    }}
                  />
                ) : null}
                <div
                  style={{
                    display: "flex",
                    color: "#475467",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
