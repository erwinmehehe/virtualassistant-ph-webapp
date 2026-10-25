import type { Metadata } from "next";
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
import "./answer-first.css";
import "./cro-density-fixes.css";
import "./hiring-brief-form.css";
import "./public-talent-proof.css";

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph"),
  applicationName: "Virtual Assistant Philippines",
  title: { default: "Hire Vetted Filipino Virtual Assistants | Virtual Assistant Philippines", template: "%s | Virtual Assistant Philippines" },
  description: "Hire vetted virtual assistants from the Philippines. Browse screened talent or send a role brief and get help shortlisting the right fit.",
  authors: [{ name: "Virtual Assistant Philippines" }],
  creator: "Virtual Assistant Philippines",
  publisher: "Virtual Assistant Philippines",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png", sizes: "96x96" }
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }]
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Virtual Assistant Philippines",
    title: "Hire Vetted Filipino Virtual Assistants",
    description: "Skip the open-marketplace resume pile. Meet screened Filipino Virtual Assistants and move from role brief to hire with a clearer process.",
    images: [{
      url: "/opengraph-image",
      width: 1200,
      height: 630,
      alt: "Virtual Assistant Philippines - vetted Filipino virtual assistants"
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
    {children}</body></html>;
}
