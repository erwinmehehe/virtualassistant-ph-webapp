import {
  BarChart3,
  BriefcaseBusiness,
  Calculator,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Globe2,
  Headphones,
  HeartPulse,
  House,
  KeyRound,
  Landmark,
  Laptop2,
  Mail,
  Megaphone,
  MessageCircle,
  Package,
  Plane,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Stethoscope,
  Target,
  Truck,
  Users,
  WalletCards,
  Wrench,
  type LucideIcon,
} from "lucide-react";

type CourseArtwork = {
  key: string;
  theme: "office" | "property" | "health" | "growth" | "finance" | "commerce" | "software" | "australia";
  Main: LucideIcon;
  Detail: LucideIcon;
  Accent: LucideIcon;
};

/**
 * Course art is deliberately separate from LMS content and enrollment.
 * Each of the 26 published courses has a distinct illustration; new courses
 * fall back to the existing typographic cover until they receive an artwork.
 * No lesson numbers, time estimates, difficulty claims or CTA text is baked
 * into the illustration.
 */
const COURSE_ARTWORKS: CourseArtwork[] = [
  { key: "virtual-assistant-foundations", theme: "office", Main: Laptop2, Detail: Mail, Accent: CalendarDays },
  { key: "real-estate-virtual-assistant", theme: "property", Main: House, Detail: KeyRound, Accent: ClipboardCheck },
  { key: "medical-healthcare-virtual-assistant", theme: "health", Main: HeartPulse, Detail: Stethoscope, Accent: CalendarDays },
  { key: "executive-virtual-assistant", theme: "office", Main: BriefcaseBusiness, Detail: CalendarDays, Accent: Plane },
  { key: "marketing-virtual-assistant", theme: "growth", Main: Megaphone, Detail: BarChart3, Accent: Mail },
  { key: "bookkeeping-administration-for-virtual-assistants", theme: "finance", Main: Calculator, Detail: ReceiptText, Accent: FileSpreadsheet },
  { key: "sales-lead-generation-virtual-assistant", theme: "growth", Main: Target, Detail: Users, Accent: BarChart3 },
  { key: "e-commerce-virtual-assistant", theme: "commerce", Main: ShoppingCart, Detail: Package, Accent: Truck },
  { key: "social-media-virtual-assistant", theme: "growth", Main: Smartphone, Detail: MessageCircle, Accent: CalendarDays },
  { key: "customer-support-virtual-assistant", theme: "office", Main: Headphones, Detail: MessageCircle, Accent: ShieldCheck },
  { key: "seo-virtual-assistant", theme: "growth", Main: Search, Detail: BarChart3, Accent: FileText },
  { key: "operations-virtual-assistant", theme: "office", Main: Settings, Detail: ClipboardCheck, Accent: BarChart3 },
  { key: "project-management-for-virtual-assistants", theme: "office", Main: FolderKanban, Detail: CalendarDays, Accent: ClipboardCheck },
  { key: "payroll-administration-for-virtual-assistants", theme: "finance", Main: WalletCards, Detail: CalendarDays, Accent: ShieldCheck },
  { key: "airbnb-short-term-rental-virtual-assistant", theme: "property", Main: House, Detail: KeyRound, Accent: CalendarDays },
  { key: "australian-va-fundamentals", theme: "australia", Main: Globe2, Detail: Mail, Accent: CalendarDays },
  { key: "australian-trades-administration", theme: "australia", Main: Wrench, Detail: Truck, Accent: ClipboardCheck },
  { key: "servicem8-for-virtual-assistants", theme: "software", Main: Truck, Detail: CalendarDays, Accent: ReceiptText },
  { key: "australian-allied-health-administration", theme: "health", Main: Stethoscope, Detail: HeartPulse, Accent: CalendarDays },
  { key: "cliniko-for-virtual-assistants", theme: "software", Main: CalendarDays, Detail: Stethoscope, Accent: ReceiptText },
  { key: "australian-bookkeeping-administration", theme: "finance", Main: Calculator, Detail: ReceiptText, Accent: ShieldCheck },
  { key: "xero-workflows-for-virtual-assistants", theme: "software", Main: FileSpreadsheet, Detail: WalletCards, Accent: BarChart3 },
  { key: "myob-workflows-for-virtual-assistants", theme: "software", Main: FileSpreadsheet, Detail: CreditCard, Accent: ReceiptText },
  { key: "ndis-administration-fundamentals", theme: "health", Main: Users, Detail: ClipboardCheck, Accent: HeartPulse },
  { key: "property-management-administration-australia", theme: "property", Main: House, Detail: Wrench, Accent: ClipboardCheck },
  { key: "mortgage-broking-administration-australia", theme: "finance", Main: Landmark, Detail: FileText, Accent: ShieldCheck },
];

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

  const { Main, Detail, Accent } = art;
  return (
    <div className={"tr-course-art tr-course-art--" + art.theme} data-course-artwork={art.key} aria-hidden="true">
      <span className="tr-course-art-halo" />
      <span className="tr-course-art-orbit" />
      <span className="tr-course-art-shadow" />
      <div className="tr-course-art-window">
        <div className="tr-course-art-browserbar">
          <span /><span /><span />
          <i />
        </div>
        <div className="tr-course-art-workflow">
          <div className="tr-course-art-icon-tile"><Main size={38} strokeWidth={1.8} /></div>
          <div className="tr-course-art-workflow-lines">
            <span /><span /><span />
          </div>
        </div>
        <div className="tr-course-art-checks">
          <i /><span /><i /><span />
        </div>
      </div>
      <span className="tr-course-art-float tr-course-art-float-left"><Detail size={26} strokeWidth={1.8} /></span>
      <span className="tr-course-art-float tr-course-art-float-right"><Accent size={23} strokeWidth={1.85} /></span>
      <span className="tr-course-art-ground" />
    </div>
  );
}
