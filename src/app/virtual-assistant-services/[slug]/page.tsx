import { notFound, permanentRedirect } from "next/navigation";

const LEGACY_SERVICE_REDIRECTS: Record<string, string> = {
  "administrative-support": "admin-inbox",
  "bookkeeping-finance": "bookkeeping",
  "customer-service": "customer-service",
  "dental-healthcare": "dental-virtual-assistant",
  "ecommerce": "ecommerce",
  "executive-assistance": "executive-virtual-assistant",
  "lead-generation-sales": "lead-generation",
  "marketing-social-media": "digital-marketing-virtual-assistant",
  "phone-reception": "phone-receptionist",
  "real-estate": "real-estate",
  "seo": "seo",
  "video-editing-creative": "video-editing",
  "web-wordpress": "wordpress"
};

export function generateStaticParams() {
  return Object.keys(LEGACY_SERVICE_REDIRECTS).map((slug) => ({ slug }));
}

export default async function LegacySpecialtyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const target = LEGACY_SERVICE_REDIRECTS[slug];
  if (!target) notFound();
  permanentRedirect(`/service/${target}/`);
}
