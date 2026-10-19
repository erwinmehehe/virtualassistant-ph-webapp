import Image from "next/image";

/**
 * The 26 approved course mockups are stored as 690x197 WebP header images.
 * Their title, descriptive copy, counts, duration and navigation stay in live
 * HTML, not in a flattened screenshot. New/unmapped courses fall back to the
 * existing dashboard or public typography treatment.
 */
const COURSE_ARTWORKS = [
  { key: "virtual-assistant-foundations" },
  { key: "real-estate-virtual-assistant" },
  { key: "medical-healthcare-virtual-assistant" },
  { key: "executive-virtual-assistant" },
  { key: "marketing-virtual-assistant" },
  { key: "bookkeeping-administration-for-virtual-assistants" },
  { key: "sales-lead-generation-virtual-assistant" },
  { key: "e-commerce-virtual-assistant" },
  { key: "social-media-virtual-assistant" },
  { key: "customer-support-virtual-assistant" },
  { key: "seo-virtual-assistant" },
  { key: "operations-virtual-assistant" },
  { key: "project-management-for-virtual-assistants" },
  { key: "payroll-administration-for-virtual-assistants" },
  { key: "airbnb-short-term-rental-virtual-assistant" },
  { key: "australian-va-fundamentals" },
  { key: "australian-trades-administration" },
  { key: "servicem8-for-virtual-assistants" },
  { key: "australian-allied-health-administration" },
  { key: "cliniko-for-virtual-assistants" },
  { key: "australian-bookkeeping-administration" },
  { key: "xero-workflows-for-virtual-assistants" },
  { key: "myob-workflows-for-virtual-assistants" },
  { key: "ndis-administration-fundamentals" },
  { key: "property-management-administration-australia" },
  { key: "mortgage-broking-administration-australia" },
] as const;

function normalizeCourseKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function getTrainingCourseArtwork(slug: string, title: string) {
  const normalizedSlug = normalizeCourseKey(slug);
  const normalizedTitle = normalizeCourseKey(title);
  return COURSE_ARTWORKS.find((art) => art.key === normalizedSlug || art.key === normalizedTitle) || null;
}

export function TrainingCourseArtwork({ slug, title }: { slug: string; title: string }) {
  const art = getTrainingCourseArtwork(slug, title);
  if (!art) return null;

  return (
    <div className="tr-course-art" data-course-artwork={art.key} aria-hidden="true">
      <Image
        className="tr-course-art-approved-image"
        src={`/training/approved-covers/${art.key}.webp`}
        alt=""
        width={690}
        height={197}
        unoptimized
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
