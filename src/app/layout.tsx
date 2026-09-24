import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@/components/analytics";
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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph"),
  applicationName: "VirtualAssistant.com.ph",
  title: { default: "Hire Vetted Filipino Virtual Assistants | VirtualAssistant.com.ph", template: "%s | VirtualAssistant.com.ph" },
  description: "Hire vetted virtual assistants from the Philippines. Browse screened talent or send a role brief and get help shortlisting the right fit.",
  authors: [{ name: "VirtualAssistant.com.ph" }],
  creator: "VirtualAssistant.com.ph",
  publisher: "VirtualAssistant.com.ph",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "VirtualAssistant.com.ph",
    title: "Hire Vetted Filipino Virtual Assistants",
    description: "Skip the open-marketplace resume pile. Meet screened Filipino Virtual Assistants and move from role brief to hire with a clearer process.",
    images: [{
      url: "/opengraph-image",
      width: 1200,
      height: 630,
      alt: "VirtualAssistant.com.ph - vetted Filipino virtual assistants"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Hire Vetted Filipino Virtual Assistants",
    description: "Meet screened Filipino Virtual Assistants and move from role brief to hire with a clearer process.",
    images: ["/twitter-image"]
  },
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
