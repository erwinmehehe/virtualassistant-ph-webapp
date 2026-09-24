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
  Clock3,
  FileCheck2,
  Globe2,
  GraduationCap,
  MapPinned,
  ShieldCheck,
  Smartphone,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { canonicalPath, canonicalUrl } from "@/lib/seo-url";
import {
  getPublicTrainingOverview,
  type PublicTrainingCourse,
} from "@/lib/public-training";
import "../training-landing.css";

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

function CourseCard({ course }: { course: PublicTrainingCourse }) {
  const { Icon, tone } = courseVisual(course);
  const recommended = course.slug === "virtual-assistant-foundations";

  return (
    <article className={`tr-course-card tr-course-tone-${tone} ${recommended ? "is-recommended" : ""}`}>
      <div className="tr-course-card-top">
        <span className="tr-course-icon"><Icon size={19}/></span>
        <span className="tr-course-live"><CheckCircle2 size={12}/> Available</span>
      </div>
      <div className="tr-course-card-copy">
        {recommended ? <span className="tr-course-recommended">Recommended first</span> : null}
        <h3>{course.title}</h3>
        <div className="tr-course-card-meta">
          <span>{categoryLabel(course.category)}</span>
          <span>{course.lesson_count} lessons</span>
          <span>{duration(course.estimated_minutes)}</span>
        </div>
      </div>
    </article>
  );
}

const META_TITLE = "Free Virtual Assistant Training Philippines | VA Courses";
const META_DESCRIPTION =
  "Free virtual assistant training for Filipinos with practical lessons, role and software courses, randomized final checks, and verified certificates.";

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
      alt: "VirtualAssistant.com.ph training"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: ["/training/opengraph-image"]
  }
};

const JOIN_HREF = "/auth/join/training";
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
    "Complete the published lessons and their practical checkpoints, then pass the randomized final check. Passing courses issue a verified certificate automatically."
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
  const publishedCourses = courses.filter((course) => course.status === "published");
  const globalCourses = publishedCourses.filter((course) => !course.country_focus);
  const australiaCourses = publishedCourses.filter((course) => course.country_focus === "Australia");
  const foundation =
    publishedCourses.find((course) => course.slug === "virtual-assistant-foundations") || null;

  const totalCourseCount = publishedCourses.length || 26;
  const globalCourseCount = globalCourses.length || 15;
  const australiaCourseCount = australiaCourses.length || 11;
  const foundationDuration = foundation ? duration(foundation.estimated_minutes) : "3h 40m";

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${canonicalUrl("/training")}#faq`,
      mainEntity: FAQS.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer }
      }))
    },
    ...(foundation ? [{
      "@context": "https://schema.org",
      "@type": "Course",
      "@id": `${canonicalUrl("/training")}#virtual-assistant-foundations`,
      name: foundation.title,
      description:
        foundation.summary ||
        "Practical Virtual Assistant foundations training for Filipino professionals.",
      url: canonicalUrl("/training"),
      isAccessibleForFree: true,
      provider: {
        "@type": "Organization",
        name: "VirtualAssistant.com.ph",
        url: canonicalUrl("/")
      },
      offers: {
        "@type": "Offer",
        price: 0,
        priceCurrency: "PHP",
        availability: "https://schema.org/InStock"
      }
    }] : [])
  ];

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="tr">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJson(schema) }}
        />

        <section className="tr-hero">
          <div className="container tr-hero-grid">
            <div className="tr-hero-copy">
              <span className="tr-eyebrow">
                <GraduationCap size={15}/>
                Free Virtual Assistant training for Filipinos
              </span>

              <h1>
                {totalCourseCount} free VA courses.
                <span>Practical skills. Verified certificates.</span>
              </h1>

              <p className="tr-hero-lede">
                Learn in text-first lessons, practise real VA workflows, pass course checkpoints,
                and keep a certificate that can be verified online. Training is optional and
                completely separate from hiring.
              </p>

              <div className="tr-cta-row">
                <Link
                  className="tr-btn tr-btn-primary"
                  href={JOIN_HREF}
                  data-track="training_account_click"
                >
                  Start free training <ArrowRight size={17}/>
                </Link>
                <a
                  className="tr-btn tr-btn-secondary"
                  href="#course-library"
                  data-track="training_learning_paths_click"
                >
                  Browse {totalCourseCount} courses
                </a>
              </div>

              <div className="tr-hero-proofline">
                <span><Check size={14}/> No course or certificate fees</span>
                <span><Check size={14}/> Mobile-friendly</span>
                <span><Check size={14}/> No admin review wait</span>
              </div>

              <p className="tr-login-note">
                Already registered?{" "}
                <Link href={LOGIN_HREF} data-track="training_login_click">
                  Continue training
                </Link>
              </p>
            </div>

            <aside className="tr-flow-card" aria-label="How a course works">
              <div className="tr-flow-card-head">
                <div>
                  <span>Inside every course</span>
                  <strong>Learn → prove it → keep the credential</strong>
                </div>
                <span className="tr-flow-live"><Sparkles size={13}/> Self-paced</span>
              </div>

              <ol className="tr-flow-list">
                <li>
                  <span className="tr-flow-icon tr-flow-icon-indigo"><BookOpenCheck size={18}/></span>
                  <div>
                    <b>01</b>
                    <strong>Learn the workflow</strong>
                    <p>Text-first lessons, examples, QA checks, and clear boundaries.</p>
                  </div>
                </li>
                <li>
                  <span className="tr-flow-icon tr-flow-icon-amber"><FileCheck2 size={18}/></span>
                  <div>
                    <b>02</b>
                    <strong>Do the practical work</strong>
                    <p>Write a response and complete the lesson checkpoint before moving on.</p>
                  </div>
                </li>
                <li>
                  <span className="tr-flow-icon tr-flow-icon-violet"><ShieldCheck size={18}/></span>
                  <div>
                    <b>03</b>
                    <strong>Pass the randomized final check</strong>
                    <p>Course-specific questions are scored automatically. Failed attempts point you back to the lessons.</p>
                  </div>
                </li>
                <li>
                  <span className="tr-flow-icon tr-flow-icon-emerald"><Award size={18}/></span>
                  <div>
                    <b>04</b>
                    <strong>Receive a verified certificate</strong>
                    <p>Your credential is issued automatically after you pass.</p>
                  </div>
                </li>
              </ol>
            </aside>
          </div>
        </section>

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
                  software, or Australia-specific training. Lessons stay inside your free training account.
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
                <div className="tr-course-grid">
                  {globalCourses.map((course) => <CourseCard course={course} key={course.id}/>)}
                </div>
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

              {australiaCourses.length ? (
                <div className="tr-course-grid">
                  {australiaCourses.map((course) => <CourseCard course={course} key={course.id}/>)}
                </div>
              ) : (
                <div className="tr-library-fallback">
                  Australia-specific training is available after you create your free account.
                </div>
              )}
            </section>
          </div>
        </section>

        <section className="tr-section tr-section-soft">
          <div className="container">
            <div className="tr-section-heading">
              <span className="tr-kicker">How completion works</span>
              <h2>You cannot earn a certificate by clicking through the course.</h2>
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
                <h3>Complete the practical checkpoint</h3>
                <p>Exercises ask you to explain what you would do, what evidence you would use, and what you would escalate.</p>
              </article>
              <article>
                <span className="tr-completion-number">03</span>
                <ShieldCheck size={21}/>
                <h3>Pass the course final check</h3>
                <p>Questions and answer order change between attempts. The answer key is not shown after a failed attempt.</p>
              </article>
              <article>
                <span className="tr-completion-number">04</span>
                <Award size={21}/>
                <h3>Certificate issued automatically</h3>
                <p>No admin approval queue. Passing the course triggers completion and the verifiable credential.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="tr-section">
          <div className="container tr-credential-layout">
            <div className="tr-credential-copy">
              <span className="tr-kicker">Verified completion</span>
              <h2>A certificate you can actually verify.</h2>
              <p>
                Passing a course issues a credential with a public verification page.
                If you also use a Virtual Assistant candidate profile, completed training
                appears there automatically as supporting evidence for recruiters.
              </p>

              <ul className="tr-credential-points">
                <li><BadgeCheck size={16}/><span><strong>Public verification</strong> Each certificate has its own credential code and verification page.</span></li>
                <li><BriefcaseBusiness size={16}/><span><strong>Recruiter-visible evidence</strong> Completed training can appear inside your VA profile and recruiter candidate view.</span></li>
                <li><ShieldCheck size={16}/><span><strong>Clear boundary</strong> Training completion is not employment history, professional experience, or hiring eligibility.</span></li>
              </ul>

              <div className="tr-cta-row">
                <Link className="tr-btn tr-btn-primary" href={JOIN_HREF} data-track="training_account_click">
                  Start earning certificates <ArrowRight size={16}/>
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

        <section className="tr-close">
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
              <Link className="tr-btn tr-btn-light" href={JOIN_HREF} data-track="training_account_click">
                Start free training <ArrowRight size={16}/>
              </Link>
              <Link className="tr-close-login" href={LOGIN_HREF} data-track="training_login_click">
                Already registered? Continue training
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
