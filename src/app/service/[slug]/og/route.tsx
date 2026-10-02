import { ImageResponse } from "next/og";
import {
  serviceMetaDescription,
  serviceMetaTitle,
  servicePageBySlug,
} from "@/lib/service-pages";
import { localizeContent, localizeEnglish } from "@/lib/content-language";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const page = servicePageBySlug(slug);
  if (!page) return new Response("Not found", { status: 404 });

  const localized = localizeContent(page, page.locale);
  const title = localizeEnglish(serviceMetaTitle(localized), page.locale);
  const description = localizeEnglish(
    serviceMetaDescription(localized),
    page.locale,
  );
  const tasks = localized.tasks.slice(0, 4);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #ffffff 0%, #f8f9ff 48%, #eef2ff 100%)",
          color: "#101828",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 560,
            height: 560,
            borderRadius: 280,
            right: -170,
            top: -190,
            background: "rgba(122, 90, 248, 0.12)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: 210,
            right: 160,
            bottom: -260,
            background: "rgba(68, 76, 231, 0.10)",
          }}
        />

        <div
          style={{
            width: "64%",
            display: "flex",
            flexDirection: "column",
            padding: "52px 44px 48px 62px",
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              borderRadius: 999,
              padding: "12px 18px",
              background: "rgba(244,243,255,0.95)",
              color: "#344054",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            <span style={{ color: "#5b45df", marginRight: 10 }}>●●</span>
            VirtualAssistant.com.ph
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 58,
              maxWidth: 720,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 56,
                lineHeight: 1.04,
                letterSpacing: "-0.045em",
                fontWeight: 800,
                color: "#101828",
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 22,
                fontSize: 24,
                lineHeight: 1.38,
                color: "#475467",
                maxWidth: 690,
              }}
            >
              {description}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: "auto" }}>
            {tasks.slice(0, 3).map((task) => (
              <div
                key={task}
                style={{
                  display: "flex",
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "#ffffff",
                  border: "1px solid #e4e7ec",
                  color: "#344054",
                  fontSize: 15,
                  fontWeight: 700,
                  boxShadow: "0 8px 24px rgba(16,24,40,0.05)",
                }}
              >
                {task}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            width: "36%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingRight: 52,
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 350,
              minHeight: 400,
              display: "flex",
              flexDirection: "column",
              padding: "30px",
              borderRadius: 30,
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(255,255,255,0.96)",
              boxShadow: "0 28px 70px rgba(68,76,231,0.16)",
            }}
          >
            <div
              style={{
                display: "flex",
                color: "#5b45df",
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: "0.10em",
              }}
            >
              ROLE SNAPSHOT
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 22,
                fontSize: 30,
                lineHeight: 1.12,
                fontWeight: 800,
                color: "#17205a",
              }}
            >
              {localized.name}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 18,
                fontSize: 17,
                lineHeight: 1.45,
                color: "#667085",
              }}
            >
              {localized.focus}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: 26,
                gap: 12,
              }}
            >
              {tasks.map((task) => (
                <div
                  key={task}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: "#f8f9ff",
                    color: "#344054",
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                      background: "#5b45df",
                      color: "#ffffff",
                      fontSize: 12,
                    }}
                  >
                    ✓
                  </span>
                  {task}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
