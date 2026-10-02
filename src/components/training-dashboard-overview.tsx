"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  Bookmark,
  BookOpenCheck,
  Check,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { KiroMascot } from "@/components/kiro-mascot";

export type TrainingDashboardCourseItem = {
  id: string;
  slug: string;
  title: string;
  category: "foundation" | "software" | "industry" | "skill";
  countryFocus: string | null;
  estimatedMinutes: number;
  lessonCount: number;
  completedLessons: number;
  progressPercent: number;
  enrolled: boolean;
  completedAt: string | null;
  nextHref: string;
  nextLabel: string;
  nextLessonTitle: string | null;
  nextLessonMinutes: number | null;
  certificate: {
    code: string;
    issuedAt: string;
  } | null;
};

type Props = {
  firstName: string;
  courses: TrainingDashboardCourseItem[];
  currentCourseSlug: string | null;
  recommendedCourseSlug: string | null;
};

const tabs = [
  ["progress","In Progress"],
  ["completed","Completed"],
  ["not-started","Not Started"],
] as const;

function fmtDuration(minutes:number) {
  if (!minutes) return "Self-paced";
  if (minutes < 60) return minutes + " min";
  const h=Math.floor(minutes/60);
  const m=minutes%60;
  return m ? h+"h "+m+"m" : h+"h";
}

function fmtDate(value:string) {
  const date=new Date(value);
  if(Number.isNaN(date.getTime())) return "Completed";
  return new Intl.DateTimeFormat("en-PH",{month:"short",day:"numeric",year:"numeric"}).format(date);
}

function initials(title:string) {
  return title.split(/\s+/).filter(Boolean).slice(0,2).map((word)=>word[0]).join("").toUpperCase();
}

export function TrainingDashboardOverview({
  firstName,
  courses,
  currentCourseSlug,
  recommendedCourseSlug,
}: Props) {
  const [tab,setTab]=useState<(typeof tabs)[number][0]>("progress");
  const [query,setQuery]=useState("");
  const [saved,setSaved]=useState<string[]>([]);
  const [kiroOpen,setKiroOpen]=useState(false);

  useEffect(()=>{
    try {
      const stored=JSON.parse(localStorage.getItem("vaph-training-saved-courses")||"[]");
      if(Array.isArray(stored)) setSaved(stored.filter((value):value is string=>typeof value==="string"));
    } catch {}
    const handler=(event:Event)=>{
      const custom=event as CustomEvent<{query?:string}>;
      setQuery(custom.detail?.query||"");
    };
    window.addEventListener("vaph-training-search",handler);
    return()=>window.removeEventListener("vaph-training-search",handler);
  },[]);

  useEffect(()=>{
    try {
      localStorage.setItem("vaph-training-saved-courses",JSON.stringify(saved));
    } catch {}
  },[saved]);

  const completed=courses.filter((course)=>Boolean(course.completedAt));
  const inProgress=courses.filter((course)=>course.enrolled&&!course.completedAt);
  const notStarted=courses.filter((course)=>!course.enrolled&&!course.completedAt);
  const certificates=courses.filter((course)=>course.certificate);
  const current=courses.find((course)=>course.slug===currentCourseSlug)||inProgress[0]||null;
  const recommended=courses.find((course)=>course.slug===recommendedCourseSlug)||notStarted[0]||null;
  const overallProgress=courses.length
    ? Math.round(courses.reduce((sum,course)=>sum+course.progressPercent,0)/courses.length)
    : 0;

  const normalizedQuery=query.trim().toLowerCase();
  const filtered=useMemo(()=>{
    const base=tab==="completed"?completed:tab==="not-started"?notStarted:inProgress;
    if(!normalizedQuery) return base;
    return base.filter((course)=>
      [course.title,course.category,course.countryFocus||""].join(" ").toLowerCase().includes(normalizedQuery)
    );
  },[completed,inProgress,notStarted,normalizedQuery,tab]);

  const savedCourses=courses.filter((course)=>saved.includes(course.slug));
  const foundation=courses.find((course)=>course.slug.includes("foundation"))||null;
  const coreCompleted=completed.filter((course)=>course.category==="skill"&&course.countryFocus!=="Australia").length;
  const specialistCompleted=completed.filter((course)=>course.category==="software"||course.category==="industry").length;
  const stages=[
    {label:"Foundations",done:Boolean(foundation?.completedAt),active:!foundation?.completedAt},
    {label:"Core VA Skills",done:Boolean(foundation?.completedAt&&coreCompleted>=1),active:Boolean(foundation?.completedAt&&coreCompleted<1)},
    {label:"Specialized Tools",done:specialistCompleted>=1,active:Boolean(coreCompleted>=1&&specialistCompleted<1)},
    {label:"Career Readiness",done:certificates.length>=3,active:Boolean(specialistCompleted>=1&&certificates.length<3)},
  ];

  const kiroTitle=current
    ? "Let’s continue your learning journey!"
    : "Ready to build your next VA skill?";
  const kiroCopy=current
    ? "You’re "+current.progressPercent+"% complete with "+current.title+". Pick up where you left off and keep the momentum going."
    : "Start with a practical course, finish the lessons, and earn a verified certificate when you pass the final check.";

  function toggleSaved(slug:string) {
    setSaved((currentSaved)=>currentSaved.includes(slug)
      ? currentSaved.filter((value)=>value!==slug)
      : [...currentSaved,slug]);
  }

  return (
    <div className="training-reference-dashboard">
      <header className="training-reference-greeting">
        <div>
          <h1>Good morning, {firstName}!</h1>
          <p>Ready to learn something new today?</p>
        </div>
      </header>

      <section className="training-reference-hero" aria-labelledby="training-reference-hero-title">
        <div className="training-reference-hero-art" aria-hidden="true">
          <KiroMascot state="training" withLaptop className="training-reference-hero-mascot"/>
        </div>
        <div className="training-reference-hero-copy">
          <span><Sparkles size={13}/> Kiro · Your Training Coach</span>
          <h2 id="training-reference-hero-title">{kiroTitle}</h2>
          <p>{kiroCopy}</p>
          <div className="training-reference-hero-actions">
            {current?<Link className="btn btn-primary" href={current.nextHref}>{current.nextLabel} <ArrowRight size={15}/></Link>:recommended?<Link className="btn btn-primary" href={recommended.nextHref}>Start course <ArrowRight size={15}/></Link>:null}
            <button className="btn" type="button" onClick={()=>setKiroOpen(true)}><Sparkles size={15}/> Ask Kiro</button>
          </div>
        </div>
        <aside className="training-reference-tip">
          <strong><Sparkles size={15}/> Kiro’s Tip</strong>
          <p>{current?"Consistency is key. Even one focused lesson at a time makes your progress easier to sustain.":"Start with Foundations, then choose one role, software, or industry path to build depth."}</p>
        </aside>
      </section>

      <section className="training-reference-progress" aria-label="Overall training progress">
        <div className="training-reference-gauge" style={{"--progress":overallProgress} as React.CSSProperties}>
          <span>{overallProgress}%</span>
        </div>
        <div className="training-reference-progress-copy">
          <strong>Overall Progress</strong>
          <span>{completed.length} of {courses.length} courses completed</span>
          <div className="training-reference-progress-line"><span style={{width:overallProgress+"%"}}/></div>
        </div>
        <div className="training-reference-metrics">
          <div className="is-complete"><CheckCircle2 size={17}/><span><strong>{completed.length}</strong>Completed Courses</span></div>
          <div className="is-progress"><Clock3 size={17}/><span><strong>{inProgress.length}</strong>In Progress</span></div>
          <div className="is-not-started"><BookOpenCheck size={17}/><span><strong>{notStarted.length}</strong>Not Started</span></div>
        </div>
      </section>

      <section className="training-reference-continue">
        <div className="training-reference-section-title">
          <h2>Continue Learning</h2>
          <Link href="#my-courses">View all <ArrowRight size={13}/></Link>
        </div>
        <div className="training-reference-continue-grid">
          {current?<article className="training-reference-current-course">
            <div className="training-reference-course-visual"><span>{initials(current.title)}</span></div>
            <div className="training-reference-current-copy">
              <strong>{current.title}</strong>
              <p>{current.nextLessonTitle?("Next: "+current.nextLessonTitle):"Continue your course"}</p>
              <div className="training-reference-current-progress">
                <span><i style={{width:current.progressPercent+"%"}}/></span><strong>{current.progressPercent}%</strong>
              </div>
              <div className="training-reference-course-meta">
                <span><Clock3 size={13}/>{current.nextLessonMinutes||current.estimatedMinutes} min</span>
                <span><BookOpenCheck size={13}/>Text + practical lesson</span>
              </div>
              <Link className="btn btn-primary" href={current.nextHref}>{current.nextLabel} <ArrowRight size={14}/></Link>
            </div>
          </article>:<article className="training-reference-current-course is-empty">
            <GraduationCap size={28}/>
            <div><strong>No active course yet</strong><p>Choose your first course to start building progress.</p></div>
            {recommended?<Link className="btn btn-primary" href={recommended.nextHref}>Start course <ArrowRight size={14}/></Link>:null}
          </article>}

          <article className="training-reference-recommended">
            <span className="small">Next Recommended</span>
            {recommended?<><div className="training-reference-recommended-icon">{initials(recommended.title)}</div><strong>{recommended.title}</strong><p>{recommended.lessonCount} lessons · {fmtDuration(recommended.estimatedMinutes)}</p><Link className="btn" href={recommended.nextHref}>Start Course <ArrowRight size={14}/></Link></>:<><GraduationCap size={26}/><strong>You’re caught up</strong><p>Browse the course library for another skill.</p><Link className="btn" href="/workspace/training?browse=1#course-library-title">Browse courses</Link></>}
          </article>
        </div>
      </section>

      <section className="training-reference-path" id="learning-path">
        <div className="training-reference-section-title">
          <h2>My Learning Path</h2>
          <a href="#course-library-title">View full path <ArrowRight size={13}/></a>
        </div>
        <ol>
          {stages.map((stage,index)=><li className={stage.done?"is-done":stage.active?"is-current":""} key={stage.label}>
            <span>{stage.done?<Check size={13}/>:index+1}</span>
            <strong>{stage.label}</strong>
            <small>{stage.done?"Completed":stage.active?"In Progress":"Not Started"}</small>
          </li>)}
        </ol>
      </section>

      <div className="training-reference-bottom">
        <section className="training-reference-my-courses" id="my-courses">
          <div className="training-reference-section-title">
            <h2>My Courses</h2>
            <Link href="/workspace/training?browse=1#course-library-title">View all <ArrowRight size={13}/></Link>
          </div>

          {query?<div className="training-reference-search-state"><Search size={14}/> Filtering courses for “{query}”</div>:null}

          <div className="training-reference-tabs" role="tablist" aria-label="My course status">
            {tabs.map(([key,label])=><button type="button" role="tab" aria-selected={tab===key} className={tab===key?"is-active":""} onClick={()=>setTab(key)} key={key}>{label} ({key==="completed"?completed.length:key==="not-started"?notStarted.length:inProgress.length})</button>)}
          </div>

          <div className="training-reference-course-list">
            {filtered.slice(0,4).map((course)=><article key={course.id}>
              <div className="training-reference-list-icon">{initials(course.title)}</div>
              <div className="training-reference-list-copy">
                <strong>{course.title}</strong>
                <span>{course.lessonCount} lessons · {fmtDuration(course.estimatedMinutes)}</span>
                {course.enrolled&&!course.completedAt?<div><i style={{width:course.progressPercent+"%"}}/></div>:null}
              </div>
              {course.enrolled&&!course.completedAt?<strong className="training-reference-list-percent">{course.progressPercent}%</strong>:null}
              <button className={"training-reference-save "+(saved.includes(course.slug)?"is-saved":"")} type="button" onClick={()=>toggleSaved(course.slug)} aria-label={(saved.includes(course.slug)?"Unsave ":"Save ")+course.title}><Bookmark size={15}/></button>
              <Link className="btn btn-sm" href={course.nextHref}>{course.completedAt?"Review":course.enrolled?"Continue":"Open"} <ArrowRight size={13}/></Link>
            </article>)}
            {!filtered.length?<div className="training-reference-empty"><Search size={18}/><div><strong>No courses in this view.</strong><span>{query?"Try another search term.":"Switch tabs or browse the full course library."}</span></div></div>:null}
          </div>

          <div className="training-reference-saved" id="saved-courses">
            <span className="small">Saved Courses</span>
            {savedCourses.length?<div>{savedCourses.slice(0,3).map((course)=><Link href={course.nextHref} key={course.id}>{course.title}<ArrowRight size={12}/></Link>)}</div>:<p>Save a course from My Courses to keep it handy here.</p>}
          </div>
        </section>

        <aside className="training-reference-right">
          <section className="training-reference-certificates" id="certificates">
            <div className="training-reference-section-title"><h2>My Certificates</h2><a href="#certificates">View all <ArrowRight size={13}/></a></div>
            <div>
              {certificates.slice(0,3).map((course)=><article key={course.id}>
                <Award size={17}/>
                <div><strong>{course.title}</strong><span>Completed {fmtDate(course.certificate!.issuedAt)}</span></div>
                <Link className="btn btn-sm" href={"/training/certificates/"+course.certificate!.code}>View</Link>
              </article>)}
              {!certificates.length?<div className="training-reference-empty is-compact"><Award size={18}/><div><strong>No certificates yet.</strong><span>Finish a course and pass its final check.</span></div></div>:null}
            </div>
          </section>

          <section className="training-reference-kiro-help">
            <div className="training-reference-kiro-help-art" aria-hidden="true"><KiroMascot state="welcome" className="training-reference-kiro-help-mascot"/></div>
            <div><strong>Need help with your training?</strong><p>Ask Kiro anything about lessons, courses, or your learning path.</p></div>
            <button className="btn btn-primary" type="button" onClick={()=>setKiroOpen(true)}>Ask Kiro <ArrowRight size={14}/></button>
          </section>
        </aside>
      </div>

      {kiroOpen?<div className="training-kiro-dialog-backdrop" onMouseDown={(event)=>{if(event.target===event.currentTarget)setKiroOpen(false);}}>
        <section className="training-kiro-dialog" role="dialog" aria-modal="true" aria-labelledby="training-kiro-dialog-title">
          <header><div><KiroMascot state="training" className="training-kiro-dialog-mascot"/><div><strong id="training-kiro-dialog-title">Ask Kiro</strong><span>Your VAPH training coach</span></div></div><button type="button" onClick={()=>setKiroOpen(false)} aria-label="Close Kiro"><X size={18}/></button></header>
          <div className="training-kiro-dialog-body">
            <div><span><Sparkles size={13}/> Your next move</span><h3>{current?current.title:recommended?.title||"Choose your next course"}</h3><p>{current?("You’re "+current.progressPercent+"% complete. Continue the next lesson before opening another course."):recommended?("Kiro recommends "+recommended.title+" as your next course."):"Browse the course library and choose one skill you want to improve."}</p></div>
            <div><strong>How Kiro helps</strong><p>Kiro can explain your current learning status, point you to your next lesson, recommend a course, and clarify how certificates work.</p></div>
          </div>
          <footer>{current?<Link className="btn btn-primary" href={current.nextHref}>{current.nextLabel} <ArrowRight size={14}/></Link>:recommended?<Link className="btn btn-primary" href={recommended.nextHref}>Start recommended course <ArrowRight size={14}/></Link>:null}</footer>
        </section>
      </div>:null}
    </div>
  );
}
