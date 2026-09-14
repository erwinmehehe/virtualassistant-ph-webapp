import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Briefcase,
  Building,
  Calculator,
  CalendarDays,
  CheckCircle2,
  DollarSign,
  FileText,
  Globe,
  Heart,
  Home,
  Megaphone,
  Package,
  Scale,
  Search,
  Settings,
  ShoppingCart,
  Users
} from "lucide-react";
import type { BlogTopic } from "@/lib/blog";

type VisualKey = BlogTopic | "editorial";

type VisualConfig = {
  label: string;
  kicker: string;
  Icon: LucideIcon;
  SecondaryIcon: LucideIcon;
};

const VISUALS: Record<VisualKey, VisualConfig> = {
  hiring: { label: "Hiring", kicker: "Shortlist with intent", Icon: Users, SecondaryIcon: Briefcase },
  pricing: { label: "Pricing", kicker: "Plan the economics", Icon: Calculator, SecondaryIcon: DollarSign },
  managing: { label: "Managing VAs", kicker: "Build a reliable system", Icon: Settings, SecondaryIcon: CheckCircle2 },
  philippines: { label: "Philippines Hiring", kicker: "Work across borders", Icon: Globe, SecondaryIcon: Users },
  "seo-marketing": { label: "SEO & Marketing", kicker: "Turn attention into growth", Icon: Search, SecondaryIcon: Megaphone },
  ecommerce: { label: "Ecommerce", kicker: "Keep operations moving", Icon: ShoppingCart, SecondaryIcon: Package },
  "real-estate": { label: "Real Estate", kicker: "Keep the pipeline moving", Icon: Home, SecondaryIcon: Building },
  healthcare: { label: "Healthcare", kicker: "Support the workflow", Icon: Heart, SecondaryIcon: CalendarDays },
  legal: { label: "Legal", kicker: "Structured support for firms", Icon: Scale, SecondaryIcon: FileText },
  "finance-bookkeeping": { label: "Finance & Bookkeeping", kicker: "Keep the numbers clean", Icon: BarChart3, SecondaryIcon: Calculator },
  editorial: { label: "Editorial Guide", kicker: "Practical operating insight", Icon: BookOpen, SecondaryIcon: FileText }
};

export function BlogFeaturedVisual({
  topic,
  title,
  label,
  detail
}: {
  topic?: BlogTopic;
  title: string;
  label?: string;
  detail?: string;
}) {
  const key: VisualKey = topic || "editorial";
  const config = VISUALS[key];
  const Icon = config.Icon;
  const SecondaryIcon = config.SecondaryIcon;

  return <figure
    className={`blog-featured-visual blog-featured-${key}`}
    role="img"
    aria-label={`Featured illustration for ${title}`}
  >
    <div className="blog-featured-halo blog-featured-halo-one" />
    <div className="blog-featured-halo blog-featured-halo-two" />

    <div className="blog-featured-window">
      <div className="blog-featured-window-top">
        <span /><span /><span />
        <small>VirtualAssistant.com.ph</small>
      </div>

      <div className="blog-featured-window-body">
        <div className="blog-featured-primary-icon"><Icon size={34} strokeWidth={1.8} /></div>
        <div className="blog-featured-window-copy">
          <span>{config.kicker}</span>
          <strong>{label || config.label}</strong>
          <small>{detail || "Practical guidance for better remote hiring and operations."}</small>
        </div>
      </div>

      <div className="blog-featured-signal-grid" aria-hidden="true">
        <span /><span /><span /><span /><span /><span />
      </div>
    </div>

    <div className="blog-featured-float-card" aria-hidden="true">
      <SecondaryIcon size={18} strokeWidth={1.8} />
      <span>{label || config.label}</span>
    </div>

    <figcaption className="sr-only">{label || config.label} featured illustration.</figcaption>
  </figure>;
}
