"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Laptop,
  MapPinned,
  MessageCircle,
  Palette,
  Search,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { useMemo, useState } from "react";

export type TrainingPublicCourseItem = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  category: "foundation" | "software" | "industry" | "skill";
  countryFocus: string | null;
  lessonCount: number;
  estimatedMinutes: number;
  href: string;
};

const TABS = [
  ["all", "All"],
  ["foundation", "Foundations"],
  ["skill", "Role skills"],
  ["software", "Software"],
  ["industry", "Industry"],
] as const;

function duration(minutes: number) {
  if (!minutes) return "Self-paced";
  if (minutes < 60) return minutes + " min";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? hours + "h " + rest + "m" : hours + "h";
}

function visual(course: TrainingPublicCourseItem) {
  const title = course.title.toLowerCase();
  if (title.includes("xero") || title.includes("bookkeeping")) return { Icon: WalletCards, tone: "blue" };
  if (title.includes("canva") || title.includes("social media")) return { Icon: Palette, tone: "purple" };
  if (title.includes("email") || title.includes("calendar")) return { Icon: CalendarDays, tone: "cyan" };
  if (title.includes("client communication") || title.includes("customer support")) return { Icon: MessageCircle, tone: "orange" };
  if (title.includes("australia") || course.countryFocus === "Australia") return { Icon: MapPinned, tone: "navy" };
  if (title.includes("operations") || title.includes("project")) return { Icon: BriefcaseBusiness, tone: "indigo" };
  if (course.category === "foundation") return { Icon: GraduationCap, tone: "violet" };
  if (course.category === "software") return { Icon: Laptop, tone: "blue" };
  return { Icon: BookOpenCheck, tone: "indigo" };
}

function level(course: TrainingPublicCourseItem) {
  if (course.category === "foundation") return "Beginner";
  if (course.category === "software") return "Intermediate";
  if (course.category === "industry") return "Intermediate";
  return "Beginner";
}

export function TrainingPublicCourseGrid({
  courses,
  initialLimit = 8,
}: {
  courses: TrainingPublicCourseItem[];
  initialLimit?: number;
}) {
  const [query,setQuery]=useState("");
  const [tab,setTab]=useState<(typeof TABS)[number][0]>("all");

  const visible=useMemo(()=>{
    const normalized=query.trim().toLowerCase();
    const filtered=courses.filter((course)=>{
      const tabMatch=tab==="all" || course.category===tab;
      const queryMatch=!normalized || [course.title,course.summary||"",course.countryFocus||""]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
      return tabMatch && queryMatch;
    });
    return (query || tab!=="all") ? filtered : filtered.slice(0,initialLimit);
  },[courses,initialLimit,query,tab]);

  return (
    <div className="tr-popular-browser">
      <div className="tr-popular-controls">
        <div className="tr-popular-tabs" role="tablist" aria-label="Training course categories">
          {TABS.map(([key,label])=>(
            <button
              type="button"
              role="tab"
              aria-selected={tab===key}
              className={tab===key?"is-active":""}
              onClick={()=>setTab(key)}
              key={key}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="tr-popular-search">
          <Search size={15}/>
          <span className="sr-only">Search training courses</span>
          <input
            value={query}
            onChange={(event)=>setQuery(event.target.value)}
            placeholder="Search courses"
            type="search"
          />
        </label>
      </div>

      {visible.length ? (
        <div className="tr-popular-grid">
          {visible.map((course)=>{
            const {Icon,tone}=visual(course);
            return (
              <article className={"tr-popular-card tone-"+tone} key={course.id}>
                <div className="tr-popular-card-top">
                  <span className="tr-popular-icon"><Icon size={20}/></span>
                  <span className="tr-popular-available"><CheckCircle2 size={12}/> Free</span>
                </div>
                <h3>{course.title}</h3>
                <p>{course.lessonCount} lessons · {duration(course.estimatedMinutes)}</p>
                <div className="tr-popular-tags">
                  <span>{level(course)}</span>
                  <span><Sparkles size={11}/> Certificate</span>
                </div>
                <Link href={course.href} aria-label={"Start "+course.title}>
                  <span>Start course</span><ArrowRight size={14}/>
                </Link>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="tr-popular-empty">
          <Search size={20}/>
          <div><strong>No courses match that search.</strong><span>Try another keyword or category.</span></div>
        </div>
      )}
    </div>
  );
}
