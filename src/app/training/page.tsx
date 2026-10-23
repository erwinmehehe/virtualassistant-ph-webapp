import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileCheck2,
  Globe2,
  GraduationCap,
  MapPinned,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from "lucide-react";
import { TrainingSiteHeader } from "@/components/training-site-header";
import { SiteFooter } from "@/components/site-footer";
import { canonicalPath, canonicalUrl } from "@/lib/seo-url";
import { AnswerFirst } from "@/components/answer-first";
import { faqSchema } from "@/lib/faq-schema";
import { organizationId, websiteId } from "@/lib/organization";
import {
  getPublicTrainingOverview,
  type PublicTrainingCourse,
} from "@/lib/public-training";
import { trainingCourseDestination, trainingJoinHref } from "@/lib/training-intent";
import { AUSTRALIA_SPECIALIZATIONS } from "@/lib/training-specializations";
import { TrainingMobileCta } from "@/components/training-mobile-cta";
import { getTrainingCourseArtwork, TrainingCourseArtwork } from "@/components/training-course-artwork";
import "@/components/training-course-artwork.css";
import "../training-landing.css";

export const dynamic = "force-static";
export const revalidate = 300;

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function duration(minutes: number) {
  if (!minutes) return "Self-paced";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function categoryLabel(value: PublicTrainingCourse["category"]) {
  if (value === "foundation") return "Foundation";
  if (value === "software") return "Software";
  if (value === "industry") return "Industry";
  return "Role skill";
}

function courseVisual(course: PublicTrainingCourse) {
  if (course.country_focus === "Australia") {
    return { Icon: MapPinned, tone: "australia" };
  }
  if (course.category === "software") {
    return { Icon: WalletCards, tone: "software" };
  }
  if (course.category === "industry") {
    return { Icon: BriefcaseBusiness, tone: "industry" };
  }
  if (course.category === "foundation") {
    return { Icon: GraduationCap, tone: "foundation" };
  }
  return { Icon: BookOpenCheck, tone: "skill" };
}

function courseMark(course: PublicTrainingCourse) {
  const slug = course.slug.toLowerCase();
  if (slug === "virtual-assistant-foundations") return "VA";
  if (slug.includes("seo")) return "SEO";
  if (slug.includes("ndis")) return "NDIS";
  if (slug.includes("xero")) return "XERO";
  if (slug.includes("myob")) return "MYOB";
  if (slug.includes("cliniko")) return "CLIN";
  if (slug.includes("servicem8")) return "S8";
  if (slug.includes("hubspot")) return "HUB";
  if (slug.includes("canva")) return "CAN";
  if (slug.includes("real-estate") || slug.includes("property")) return "PROP";
  if (slug.includes("bookkeeping") || slug.includes("payroll")) return "FIN";
  if (slug.includes("customer-support")) return "CS";
  if (slug.includes("executive")) return "EA";
  if (slug.includes("operations")) return "OPS";
  if (slug.includes("project-management")) return "PM";
  if (slug.includes("social-media")) return "SOC";
  if (slug.includes("marketing")) return "MKT";
  if (slug.includes("sales") || slug.includes("lead-generation")) return "SALES";

  const words = course.title
    .replace(/virtual assistant/gi, "")
    .replace(/[^a-z0-9 ]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "VA";
}

function courseDescriptor(course: PublicTrainingCourse) {
  if (course.slug === "virtual-assistant-foundations") return "Best first course";
  if (course.country_focus === "Australia") return "Australian client workflow";
  if (course.category === "software") return "Software workflow";
  if (course.category === "industry") return "Industry workflow";
  return "Practical role training";
}

function CourseCard({ course, position, signedIn }: { course: PublicTrainingCourse; position: string; signedIn: boolean }) {
  const { tone } = courseVisual(course);
  const recommended = course.slug === "virtual-assistant-foundations";
  const courseHref = signedIn ? trainingCourseDestination(course.slug) : trainingJoinHref(course.slug);
  const hasArtwork = Boolean(getTrainingCourseArtwork(course.slug, course.title));

  return (
    <article id={`course-${course.slug}`} className={"tr-course-card tr-course-card-v2 tr-course-tone-" + tone + (recommended ? " is-recommended" : "")}>
      <div className={"tr-course-cover" + (hasArtwork ? " has-artwork" : "")}>
        {hasArtwork ? <TrainingCourseArtwork slug={course.slug} title={course.title} /> : null}
        <div className="tr-course-cover-top">
          <span className="tr-course-type">{categoryLabel(course.category)}</span>
          <span className="tr-course-live"><GraduationCap size={13} aria-hidden="true" /> Free training</span>
        </div>
        {!hasArtwork ? (
          <div className="tr-course-cover-main">
            <span className="tr-course-mark" aria-hidden="true">{courseMark(course)}</span>
            <span className="tr-course-cover-note">{courseDescriptor(course)}</span>
          </div>
        ) : null}
      </div>

      <div className="tr-course-card-body">
        <div className="tr-course-card-copy">
          {recommended ? <span className="tr-course-recommended">Recommended first</span> : null}
          <h3>{course.title}</h3>
          {course.summary ? <p className="tr-course-summary">{course.summary}</p> : null}
        </div>

        <div className="tr-course-card-meta">
          <span><BookOpenCheck size={14}/>{course.lesson_count} lessons</span>
          <span><Clock3 size={14}/>{duration(course.estimated_minutes)}</span>
          <span><CheckCircle2 size={14}/>Self-paced</span>
          <span><Award size={14}/>Certificate included</span>
        </div>

        <Link
          className="tr-course-cta"
          href={courseHref}
          data-track="training_course_interest_click"
          data-course-slug={course.slug}
          data-cta-position={position}
        >
          {signedIn ? "Open course" : recommended ? "Start Foundations" : "Explore course"} <ArrowRight size={15}/>
        </Link>
      </div>
    </article>
  );
}

const META_TITLE = "Virtual Assistant Training Philippines | Free Certificates";
const META_DESCRIPTION =
  "Learn virtual assistant skills in the Philippines with free, self-paced courses. Practise real tasks and earn verifiable certificates after passing.";

export const metadata: Metadata = {
  title: { absolute: META_TITLE },
  description: META_DESCRIPTION,
  alternates: { canonical: canonicalPath("/training") },
  openGraph: {
    type: "website",
    url: canonicalUrl("/training"),
    siteName: "VirtualAssistant.com.ph",
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: [{
      url: "/training/opengraph-image",
      width: 1200,
      height: 630,
      alt: "Free virtual assistant training courses in the Philippines"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: ["/training/opengraph-image"]
  }
};

const JOIN_HREF = trainingJoinHref();
const LOGIN_HREF = "/auth/login?next=%2Fworkspace%2Ftraining";

const FAQS = [
  [
    "Is the training really free?",
    "Yes. There is no course fee, certificate fee, paid training tier, or placement fee for Virtual Assistants."
  ],
  [
    "Do I need to finish training to get hired?",
    "No. Training is optional and does not control job access, shortlisting, recruiter approval, or the public talent directory."
  ],
  [
    "How do I earn a certificate?",
    "Complete the published lessons and practical checkpoints, pass the randomized final check, then confirm the full name you want printed in Training account settings. Your completion is saved even if you confirm your name later, so you do not need to retake the course."
  ],
  [
    "Does a training certificate prove work experience?",
    "No. A certificate shows that you completed and passed the training. It does not verify employment history, professional experience, or hiring eligibility."
  ],
  [
    "Why do I need an account?",
    "Your account saves lesson progress, practical responses, final-check attempts, and certificates. A training account does not automatically create a candidate profile."
  ],
  [
    "Will the training work on my phone?",
    "Yes. Lessons are text-first and mobile-friendly, with practical work designed to avoid unnecessary video or large downloads."
  ],
] as const;

export default async function TrainingPage() {
  const { courses } = await getPublicTrainingOverview();
  // This public SEO landing page contains no visitor-specific data. Returning
  // learners can log in from the visible login link; authenticated learners
  // entering the join flow are redirected to the intended workspace course.
  const signedIn = false;
  const trainingHomeHref = signedIn ? "/workspace/training" : JOIN_HREF;
  const publishedCourses = courses.filter((course) => course.status === "published");
  const globalCourses = publishedCourses.filter((course) => !course.country_focus);
  const australiaCourses = publishedCourses.filter((course) => course.country_focus === "Australia");
  const foundation =
    publishedCourses.find((course) => course.slug === "virtual-assistant-foundations") || null;
  const heroCourses = globalCourses
    .filter((course) => course.slug !== "virtual-assistant-foundations")
    .slice(0, 4);

  const totalCourseCount = publishedCourses.length || 26;
  const globalCourseCount = globalCourses.length || 15;
  const australiaCourseCount = australiaCourses.length || 11;
  const foundationDuration = foundation ? duration(foundation.estimated_minutes) : "3h 40m";

  // Only published, publicly listed courses are described in structured data.
  // Each Course URL targets a visible catalogue card; lesson content stays private.
  const trainingUrl = canonicalUrl("/training");
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${trainingUrl}#webpage`,
        url: trainingUrl,
        name: META_TITLE,
        description: META_DESCRIPTION,
        isPartOf: { "@id": websiteId(canonicalUrl("/")) },
        publisher: { "@id": organizationId(canonicalUrl("/")) },
        mainEntity: { "@id": `${trainingUrl}#course-list` },
      },
      {
        "@type": "ItemList",
        "@id": `${trainingUrl}#course-list`,
        numberOfItems: publishedCourses.length,
        itemListElement: publishedCourses.map((course, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Course",
            "@id": `${trainingUrl}#course-${course.slug}`,
            url: `${trainingUrl}#course-${course.slug}`,
            name: course.title,
            description: course.summary || `Free practical Virtual Assistant training in ${course.title}.`,
            provider: {
              "@type": "Organization",
              "@id": organizationId(canonicalUrl("/")),
              name: "Virtual Assistant Philippines",
              url: canonicalUrl("/"),
            },
            isAccessibleForFree: true,
            offers: {
              "@type": "Offer",
              price: 0,
              priceCurrency: "PHP",
              availability: "https://schema.org/InStock",
            },
          },
        })),
      },
      faqSchema(trainingUrl, FAQS.map(([question, answer]) => ({ question, answer }))),
    ],
  };

  return (
    <>
      <TrainingSiteHeader />
      <main id="main-content" className="tr">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJson(schema) }}
        />

        <section className="tr-hero" data-training-hero>
          <div className="container tr-hero-grid">
            <div className="tr-hero-copy">
              <span className="tr-eyebrow">
                <GraduationCap size={15}/>
                Free VA training · {totalCourseCount} courses available
              </span>

              <h1>Virtual Assistant Training Philippines</h1>
              <p className="tr-hero-value">Learn practical VA skills. Earn verifiable certificates.</p>
              <p className="tr-hero-lede">
                Learn practical virtual assistant skills at your own pace with free online courses,
                realistic exercises, and certificates you can share after passing the final check
                and confirming your name.
              </p>
              <AnswerFirst
                id="training-quick-answer"
                question="Where can you get free Virtual Assistant training in the Philippines?"
                answer="VirtualAssistant.com.ph offers free, self-paced Virtual Assistant training for Filipino learners. Published courses cover foundational skills, software, and industry workflows, with practical lessons and assessments. Learners can earn verifiable certificates after passing the final check and confirming their name. Training is optional and does not guarantee a job or determine hiring eligibility."
              />

              <div className="tr-cta-row">
                <Link
                  className="tr-btn tr-btn-primary"
                  href={trainingHomeHref}
                  data-track="training_account_click"
                  data-cta-position="hero"
                >
                  {signedIn ? "Continue training" : "Start free training"} <ArrowRight size={17}/>
                </Link>
                <a
                  className="tr-btn tr-btn-secondary"
                  href="#course-library"
                  data-track="training_learning_paths_click"
                >
                  Explore {totalCourseCount} free courses
                </a>
              </div>

              <div className="tr-hero-proofline">
                <span><Check size={14}/> No course or certificate fees</span>
                <span><Check size={14}/> Mobile-friendly</span>
                <span><Check size={14}/> Progress saved automatically</span>
              </div>
              <p className="tr-hero-boundary">Training is completely separate from hiring.</p>

              <p className="tr-login-note">
                {signedIn ? (
                  <>
                    You’re signed in.{" "}
                    <Link href="/workspace/training" data-track="training_login_click">
                      Go to learner dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    Already registered?{" "}
                    <Link href={LOGIN_HREF} data-track="training_login_click">
                      Continue training
                    </Link>
                  </>
                )}
              </p>
            </div>

            <aside className="tr-path-preview" aria-label="Training learning path preview">
              <div className="tr-path-preview-head">
                <div>
                  <span>Recommended learning path</span>
                  <strong>Start with Foundations. Build from there.</strong>
                </div>
                <span className="tr-path-free">Free</span>
              </div>

              <div className="tr-path-featured">
                <span className="tr-path-featured-icon"><GraduationCap size={22}/></span>
                <div>
                  <span>01 · Start here</span>
                  <strong>Virtual Assistant Foundations</strong>
                  <p>Build the communication, admin, research, QA, and escalation habits every VA needs.</p>
                  <div className="tr-path-featured-meta">
                    <span><Clock3 size={13}/>{foundationDuration}</span>
                    <span><BookOpenCheck size={13}/>{foundation?.lesson_count || 10} lessons</span>
                  </div>
                </div>
              </div>

              <div className="tr-path-next">
                <div className="tr-path-next-head">
                  <span>02 · Pick the work you want to do</span>
                  <small>Role, software, or industry</small>
                </div>
                <div className="tr-path-chips">
                  {heroCourses.length ? heroCourses.map((course) => {
                    const { Icon } = courseVisual(course);
                    return <span key={course.id}><Icon size={14}/>{course.title}</span>;
                  }) : (
                    <>
                      <span><BriefcaseBusiness size={14}/>Executive VA</span>
                      <span><BookOpenCheck size={14}/>Customer Support</span>
                      <span><Globe2 size={14}/>SEO</span>
                      <span><WalletCards size={14}/>Bookkeeping tools</span>
                    </>
                  )}
                </div>
              </div>

              <div className="tr-path-outcome">
                <span className="tr-path-outcome-icon"><Award size={18}/></span>
                <div>
                  <span>03 · Prove completion</span>
                  <strong>Pass the final check, confirm your name, and receive a verified certificate.</strong>
                </div>
              </div>
              <div className="tr-path-action">
                <Link
                  className="tr-path-start-cta"
                  href={signedIn
                    ? trainingCourseDestination("virtual-assistant-foundations")
                    : trainingJoinHref("virtual-assistant-foundations")}
                  data-track="training_course_interest_click"
                  data-course-slug="virtual-assistant-foundations"
                  data-cta-position="hero_foundations"
                >
                  {signedIn ? "Open Foundations course" : "Start Foundations free"}
                  <ArrowRight size={16} aria-hidden="true"/>
                </Link>
              </div>
            </aside>
          </div>
        </section>

        <TrainingMobileCta href={trainingHomeHref} label={signedIn ? "Continue training" : "Start free training"}/>

        <section className="tr-proof-strip" aria-label="Training catalogue summary">
          <div className="container tr-proof-grid">
            <div>
              <strong>{totalCourseCount}</strong>
              <span>courses available</span>
            </div>
            <div>
              <strong>{globalCourseCount}</strong>
              <span>global VA courses</span>
            </div>
            <div>
              <strong>{australiaCourseCount}</strong>
              <span>Australia courses</span>
            </div>
            <div>
              <strong>Free</strong>
              <span>courses + certificates</span>
            </div>
          </div>
        </section>

        <section className="tr-section tr-library-section" id="course-library">
          <div className="container">
            <div className="tr-section-heading tr-library-heading">
              <div>
                <span className="tr-kicker">Course library</span>
                <h2>Choose training that matches the work you want to do.</h2>
                <p>
                  Start with Foundations if you are new, then move into role, industry,
                  software, or Australia-specific training. We keep one public training page.
                  Lessons stay inside your free training account.
                </p>
              </div>

              <div className="tr-library-jump" aria-label="Course groups">
                <a href="#global-training"><Globe2 size={14}/> Global · {globalCourseCount}</a>
                <a href="#australia-training"><MapPinned size={14}/> Australia · {australiaCourseCount}</a>
              </div>
            </div>

            <div className="tr-foundation-callout">
              <div className="tr-foundation-icon"><GraduationCap size={23}/></div>
              <div>
                <span>Recommended starting point</span>
                <strong>Virtual Assistant Foundations</strong>
                <p>
                  Communication, inbox and calendar work, files, research, task management,
                  responsible AI use, QA, and escalation basics.
                </p>
              </div>
              <div className="tr-foundation-facts">
                <span><Clock3 size={13}/>{foundationDuration}</span>
                <span><FileCheck2 size={13}/>{foundation?.lesson_count || 10} lessons</span>
                <span><BadgeCheck size={13}/>Certificate included</span>
                <Link
                  className="tr-foundation-cta"
                  href={signedIn ? trainingCourseDestination("virtual-assistant-foundations") : trainingJoinHref("virtual-assistant-foundations")}
                  data-track="training_course_interest_click"
                  data-course-slug="virtual-assistant-foundations"
                  data-cta-position="foundations_callout"
                >
                  {signedIn ? "Open Foundations" : "Start Foundations free"} <ArrowRight size={13}/>
                </Link>
              </div>
            </div>

            <section className="tr-library-group" id="global-training">
              <div className="tr-library-group-head">
                <div>
                  <span className="tr-library-icon tr-library-icon-global"><Globe2 size={17}/></span>
                  <div>
                    <h3>Global VA training</h3>
                    <p>Core and role-specific skills that apply across client markets.</p>
                  </div>
                </div>
                <strong>{globalCourseCount} available</strong>
              </div>

              {globalCourses.length ? (
                <>
                  <div className="tr-course-grid">
                    {globalCourses.slice(0, 6).map((course) => (
                      <CourseCard course={course} signedIn={signedIn} position="global_visible" key={course.id}/>
                    ))}
                  </div>
                  {globalCourses.length > 6 ? (
                    <details className="tr-course-more">
                      <summary>
                        View all {globalCourseCount} global courses <ChevronDown size={15}/>
                      </summary>
                      <div className="tr-course-grid tr-course-grid-more">
                        {globalCourses.slice(6).map((course) => (
                          <CourseCard course={course} signedIn={signedIn} position="global_expanded" key={course.id}/>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </>
              ) : (
                <div className="tr-library-fallback">
                  The live course catalogue is temporarily unavailable. Create a free training account to view the current library.
                </div>
              )}
            </section>

            <section className="tr-library-group" id="australia-training">
              <div className="tr-library-group-head">
                <div>
                  <span className="tr-library-icon tr-library-icon-au"><MapPinned size={17}/></span>
                  <div>
                    <h3>Work with Australian businesses</h3>
                    <p>Optional training for Australian workflows, software, terminology, and administration.</p>
                  </div>
                </div>
                <strong>{australiaCourseCount} available</strong>
              </div>

              <div className="tr-australia-paths" aria-label="Australian Virtual Assistant specialisations">
                <h4>Choose an Australian client-work specialisation</h4>
                <p>Explore four role-focused learning paths. Complete shared courses once and see that progress across tracks.</p>
                <div className="tr-australia-path-grid">
                  {AUSTRALIA_SPECIALIZATIONS.map((track) => (
                    <article className="tr-australia-path-card" key={track.slug}>
                      <strong>{track.title}</strong>
                      <p>{track.bestFor}</p>
                      <Link
                        href={signedIn
                          ? `/workspace/training/paths/${track.slug}`
                          : trainingJoinHref(track.startSignals[0])}
                        data-track="training_australia_path_interest"
                        data-cta-position="australia_learning_path"
                      >
                        {signedIn ? "View learning path" : "Create account to start"} <ArrowRight size={14}/>
                      </Link>
                    </article>
                  ))}
                </div>
              </div>

              {australiaCourses.length ? (
                <>
                  <div className="tr-course-grid">
                    {australiaCourses.slice(0, 6).map((course) => (
                      <CourseCard course={course} signedIn={signedIn} position="australia_visible" key={course.id}/>
                    ))}
                  </div>
                  {australiaCourses.length > 6 ? (
                    <details className="tr-course-more">
                      <summary>
                        View all {australiaCourseCount} Australia courses <ChevronDown size={15}/>
                      </summary>
                      <div className="tr-course-grid tr-course-grid-more">
                        {australiaCourses.slice(6).map((course) => (
                          <CourseCard course={course} signedIn={signedIn} position="australia_expanded" key={course.id}/>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </>
              ) : (
                <div className="tr-library-fallback">
                  Australia-specific training is available after you create your free account.
                </div>
              )}
            </section>
          </div>
        </section>

        <section className="tr-section tr-section-soft" id="how-training-works">
          <div className="container">
            <div className="tr-section-heading">
              <span className="tr-kicker">How completion works</span>
              <h2>Certificates require real course completion.</h2>
              <p>
                The system asks you to work through the lesson, complete practical responses,
                pass lesson checks, and then pass a randomized final check.
              </p>
            </div>

            <div className="tr-completion-grid">
              <article>
                <span className="tr-completion-number">01</span>
                <BookOpenCheck size={21}/>
                <h3>Read and work through the lesson</h3>
                <p>Lesson progress includes active reading and reaching the content before completion unlocks.</p>
              </article>
              <article>
                <span className="tr-completion-number">02</span>
                <FileCheck2 size={21}/>
                <h3>Do the practical work</h3>
                <p>Exercises ask you to explain what you would do, what evidence you would use, and what you would escalate.</p>
              </article>
              <article>
                <span className="tr-completion-number">03</span>
                <ShieldCheck size={21}/>
                <h3>Pass the randomized final check</h3>
                <p>Course-specific questions are scored automatically, and question order changes between attempts. The answer key is not shown after a failed attempt.</p>
              </article>
              <article>
                <span className="tr-completion-number">04</span>
                <Award size={21}/>
                <h3>Confirm your certificate name</h3>
                <p>Your course completion is saved after passing. Confirm the exact recipient name in Training account settings before your verified certificate is issued. Anyone with the verification link can see that name.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="tr-section" id="certificate">
          <div className="container tr-credential-layout">
            <div className="tr-credential-copy">
              <span className="tr-kicker">Verified completion</span>
              <h2>A certificate you can actually verify.</h2>
              <p>
                After you pass and confirm your certificate name, VAPH issues a credential with a public verification page.
                If you also use a Virtual Assistant candidate profile, completed training
                appears there automatically as supporting evidence for recruiters.
              </p>

              <ul className="tr-credential-points">
                <li><BadgeCheck size={16}/><span><strong>Public verification</strong> Each certificate has its own credential code and verification page.</span></li>
                <li><BriefcaseBusiness size={16}/><span><strong>Recruiter-visible evidence</strong> Completed training can appear inside your VA profile and recruiter candidate view.</span></li>
                <li><ShieldCheck size={16}/><span><strong>Clear boundary</strong> Training completion is not employment history, professional experience, or hiring eligibility.</span></li>
              </ul>

              <div className="tr-cta-row">
                <Link className="tr-btn tr-btn-primary" href={trainingHomeHref} data-track="training_account_click" data-cta-position="certificate">
                  {signedIn ? "Continue training" : "Start free training"} <ArrowRight size={16}/>
                </Link>
              </div>
            </div>

            <div className="tr-certificate-preview" aria-label="Example verified training credential">
              <div className="tr-certificate-preview-top">
                <span className="tr-certificate-mark"><Award size={22}/></span>
                <span className="tr-certificate-verified"><BadgeCheck size={13}/> Verified training</span>
              </div>
              <div className="tr-certificate-preview-body">
                <span>Certificate of completion</span>
                <h3>Virtual Assistant Foundations</h3>
                <p>VirtualAssistant.com.ph</p>
              </div>
              <div className="tr-certificate-preview-meta">
                <div>
                  <span>Completed</span>
                  <strong>After passing the final check</strong>
                </div>
                <div>
                  <span>Credential</span>
                  <code>VAT-••••-••••</code>
                </div>
              </div>
              <div className="tr-certificate-preview-foot">
                <ShieldCheck size={15}/>
                Publicly verifiable credential
              </div>
            </div>
          </div>
        </section>

        <section className="tr-section tr-application-section" aria-labelledby="training-application-heading">
          <div className="container">
            <div className="tr-section-heading tr-application-heading">
              <span className="tr-kicker">From practice to application</span>
              <h2 id="training-application-heading">Training can support your application. It does not replace it.</h2>
              <p>
                Keep training optional. When you are ready to apply, make your target role clear,
                show truthful work evidence, prepare the application assets employers request, and choose roles that fit your real availability.
              </p>
            </div>

            <div className="tr-application-grid">
              <Link href="/blog/how-to-create-the-best-va-profile">
                <span><BriefcaseBusiness size={17}/></span>
                <strong>Build a focused VA profile</strong>
                <small>Turn your skills, tools, training, and previous work into a clear role story.</small>
                <em>Profile guide <ArrowRight size={13}/></em>
              </Link>
              <Link href="/blog/virtual-assistant-introduction-video">
                <span><BookOpenCheck size={17}/></span>
                <strong>Prepare your introduction</strong>
                <small>Use a one-minute structure when a job asks for an intro video.</small>
                <em>Video scripts <ArrowRight size={13}/></em>
              </Link>
              <Link href="/blog/virtual-assistant-proposal-sample">
                <span><FileCheck2 size={17}/></span>
                <strong>Write a job-specific proposal</strong>
                <small>Connect the employer's workload to evidence you can actually prove.</small>
                <em>Proposal samples <ArrowRight size={13}/></em>
              </Link>
              <Link href="/jobs">
                <span><BadgeCheck size={17}/></span>
                <strong>Compare current VA jobs</strong>
                <small>Check responsibilities, pay, hours, timezone, and required experience before applying.</small>
                <em>Browse jobs <ArrowRight size={13}/></em>
              </Link>
            </div>

            <div className="tr-application-foot">
              <span>Need the complete candidate path?</span>
              <Link href="/for-virtual-assistants">Open the Virtual Assistant hub <ArrowRight size={14}/></Link>
            </div>
          </div>
        </section>

        <section className="tr-value-band">
          <div className="container tr-value-grid">
            <article>
              <Smartphone size={20}/>
              <h3>Built for phones</h3>
              <p>Text-first lessons, practical work, and responsive course screens without requiring long videos.</p>
            </article>
            <article>
              <Globe2 size={20}/>
              <h3>Global first</h3>
              <p>Core skills work across markets, while optional country training adds useful local context.</p>
            </article>
            <article>
              <ShieldCheck size={20}/>
              <h3>Separate from hiring</h3>
              <p>You can learn, keep the certificate, and work anywhere. Training is never a recruitment gate.</p>
            </article>
          </div>
        </section>

        <section className="tr-section" id="faq">
          <div className="container tr-faq-layout">
            <div className="tr-section-heading tr-faq-heading">
              <span className="tr-kicker">FAQ</span>
              <h2>What to know before you start.</h2>
              <p>
                Training is free, optional, mobile-friendly, and separate from the hiring system.
              </p>
            </div>

            <div className="tr-faq">
              {FAQS.map(([question, answer]) => (
                <details key={question}>
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="tr-close" data-training-final-cta>
          <div className="container tr-close-inner">
            <div>
              <span>Free Virtual Assistant training</span>
              <h2>Start with one course. Keep the skills and the credential.</h2>
              <p>
                {totalCourseCount} courses are available now. Your progress, final-check results,
                and certificates stay inside your training account.
              </p>
            </div>

            <div className="tr-close-actions">
              <Link className="tr-btn tr-btn-light" href={trainingHomeHref} data-track="training_account_click" data-cta-position="final">
                {signedIn ? "Continue training" : "Start free training"} <ArrowRight size={16}/>
              </Link>
              <Link className="tr-close-login" href={signedIn ? "/workspace/training" : LOGIN_HREF} data-track="training_login_click">
                {signedIn ? "Go to learner dashboard" : "Already registered? Continue training"}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
