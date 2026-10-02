import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@/components/analytics";
import { socialMetadata } from "@/lib/og";
import "./globals.css";
import "./operations.css";
import "./marketing-refresh.css";
import "./talent-card-refresh.css";
import "./premium-marketing-final.css";
import "./va-design.css";
import "./nav-cro.css";
import "./site-redesign-final.css";
import "./service-visual-qa.css";
import "./service-visual-qa-final.css";
import "./service-visual-qa-v2.css";
import "./public-foundation.css";
import "./service-match-form-final.css";
import "./blog-editorial.css";
import "./blog-featured-visual.css";
import "./cro-density-fixes.css";
import "./hiring-brief-form.css";

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const DEFAULT_META_TITLE = "Hire Vetted Filipino Virtual Assistants | VirtualAssistant.com.ph";
const DEFAULT_META_DESCRIPTION =
  "Hire vetted virtual assistants from the Philippines. Browse screened talent or send a role brief and get help shortlisting the right fit.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph"),
  applicationName: "VirtualAssistant.com.ph",
  title: { default: DEFAULT_META_TITLE, template: "%s | VirtualAssistant.com.ph" },
  description: DEFAULT_META_DESCRIPTION,
  authors: [{ name: "VirtualAssistant.com.ph" }],
  creator: "VirtualAssistant.com.ph",
  publisher: "VirtualAssistant.com.ph",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png", sizes: "96x96" }
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }]
  },
  ...socialMetadata({
    title: DEFAULT_META_TITLE,
    description: DEFAULT_META_DESCRIPTION,
    path: "/",
    category: "hiring",
    eyebrow: "Vetted Filipino Virtual Assistants",
  }),
  ...(googleSiteVerification ? { verification: { google: googleSiteVerification } } : {})
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-US"><body><a className="skip-link" href="#main-content">Skip to main content</a>
    {gaId ? <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}');`}</Script>
    </> : null}
    <Analytics/>{children}</body></html>;
}
