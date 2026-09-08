import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@/components/analytics";
import "./globals.css";

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph"),
  title: { default: "Hire Vetted Filipino Virtual Assistants | VirtualAssistant.com.ph", template: "%s | VirtualAssistant.com.ph" },
  description: "Hire vetted virtual assistants from the Philippines. Get recruiting, screening, onboarding and ongoing placement support for your next hire.",
  openGraph: {
    type: "website",
    siteName: "VirtualAssistant.com.ph",
    title: "Hire Vetted Filipino Virtual Assistants",
    description: "Recruiting, screening and placement support for your next Filipino virtual assistant.",
    images: [{url:"/opengraph-image",width:1200,height:630,alt:"VirtualAssistant.com.ph — Filipino talent. A team behind every hire."}]
  },
  twitter: { card: "summary_large_image", images:["/opengraph-image"] },
  ...(googleSiteVerification ? { verification: { google: googleSiteVerification } } : {})
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to main content</a>
    {gaId ? <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}');`}</Script>
    </> : null}
    <Analytics/>{children}</body></html>;
}
