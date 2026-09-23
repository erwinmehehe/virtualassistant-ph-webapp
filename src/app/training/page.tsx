import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Check,
  GraduationCap,
  MapPinned,
  Smartphone,
  Wallet
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { canonicalPath, canonicalUrl } from "@/lib/seo-url";
import { getPublicTrainingOverview } from "@/lib/public-training";
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

function statusLabel(status: "draft" | "published" | "archived") {
  if (status === "published") return "Available now";
  if (status === "draft") return "In development";
  return "Unavailable";
}

const META_TITLE = "Virtual Assistant Training Philippines | Free VA Course";
const META_DESCRIPTION =
  "Free virtual assistant training for Filipinos. Learn practical client communication, admin, software, and industry skills in mobile-friendly lessons.";

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
    "Yes. There is no course fee, certificate fee, paid tier, or placement fee for Virtual Assistants."
  ],
  [
    "Do I have to work with VirtualAssistant.com.ph?",
    "No. You can learn here and use those skills with any employer or client."
  ],
  [
    "Do I need to finish the training to get hired here?",
    "No. Training is optional and never controls access to jobs, shortlisting, or the public talent directory."
  ],
  [
    "Why do I need an account?",
    "Your training account saves lesson progress, assessment work, and completion certificates. It does not automatically create a candidate profile."
  ],
  [
    "Will it work on my phone?",
    "Yes. Lessons are text-first, mobile-friendly, and designed to avoid unnecessary video or large downloads."
  ]
] as const;

export default async function TrainingPage() {
  const { courses, paths } = await getPublicTrainingOverview();
  const foundation = courses.find((course) => course.slug === "virtual-assistant-foundations") || null;
  const foundationLive = foundation?.status === "published";
  const globalCourses = courses.filter((course) => !course.country_focus);
  const australiaPath = paths.find((path) => path.slug === "australia") || null;
  const australiaCourses = australiaPath?.courses.length
    ? australiaPath.courses
    : courses.filter((course) => course.country_focus === "Australia");
  const publishedCourses = courses.filter((course) => course.status === "published").length;

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
    ...(foundationLive && foundation ? [{
      "@context": "https://schema.org",
      "@type": "Course",
      "@id": `${canonicalUrl("/training")}#virtual-assistant-foundations`,
      name: foundation.title,
      description: foundation.summary || "Practical Virtual Assistant foundations training for Filipino professionals.",
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
                <GraduationCap size={15} />
                Free Virtual Assistant training for Filipinos
              </span>
              <h1>
                Learn the work
                <span> before a client hands it to you.</span>
              </h1>
              <p className="tr-hero-lede">
                Start with Virtual Assistant Foundations, then move into role,
                software, industry, and country-specific training. No course fees,
                no certificate fees, and no requirement to join our talent marketplace.
              </p>

              <div className="tr-cta-row">
                <Link
                  className="tr-btn tr-btn-primary"
                  href={JOIN_HREF}
                  data-track="training_account_click"
                >
                  Start free training <ArrowRight size={17} />
                </Link>
                <a className="tr-btn tr-btn-secondary" href="#training-roadmap" data-track="training_learning_paths_click">
                  See the training roadmap
                </a>
              </div>

              <p className="tr-login-note">
                Already have an account? <Link href={LOGIN_HREF} data-track="training_login_click">Log in to training</Link>
              </p>

              <ul className="tr-assure">
                <li><Check size={15} /> Training and certificates stay free</li>
                <li><Check size={15} /> Text-first and mobile-friendly</li>
                <li><Check size={15} /> Separate from hiring and shortlisting</li>
              </ul>
            </div>

            <aside className="tr-preview" aria-label="Inside the training">
              <div className="tr-preview-top">
                <span>Inside the LMS</span>
                <strong>{courses.length || 26} courses mapped</strong>
              </div>
              <ol className="tr-preview-list">
                <li>
                  <b>01</b>
                  <div>
                    <strong>Virtual Assistant Foundations</strong>
                    <span>{foundationLive ? "Available now" : "First course being prepared"} · communication, admin, research, AI, and remote work.</span>
                  </div>
                </li>
                <li>
                  <b>02</b>
                  <div>
                    <strong>Role specialisations</strong>
                    <span>Real estate, executive support, marketing, bookkeeping, sales, e-commerce, SEO, operations, and more.</span>
                  </div>
                </li>
                <li>
                  <b>03</b>
                  <div>
                    <strong>Optional country tracks</strong>
                    <span>Australia is the first market-specific path, with other markets able to follow without replacing the global core.</span>
                  </div>
                </li>
                <li>
                  <b>04</b>
                  <div>
                    <strong>Assessments and certificates</strong>
                    <span>Practical work simulations, saved progress, and free completion credentials.</span>
                  </div>
                </li>
              </ol>
              <div className="tr-preview-foot">
                One public training page. Course lessons stay inside your training account.
              </div>
            </aside>
          </div>
        </section>

        <section className="tr-intro-band">
          <div className="container tr-intro-band-grid">
            <strong>Training is a learning product, not a recruitment gate.</strong>
            <span>
              You can complete a course, keep the certificate, and work somewhere else.
              Creating a training account does not automatically make you a job candidate.
            </span>
          </div>
        </section>

        <section className="tr-section">
          <div className="container">
            <div className="tr-featured">
              <div className="tr-featured-copy">
                <span className="tr-kicker">{foundationLive ? "Available now" : "First release"}</span>
                <h2>Start with Virtual Assistant Foundations.</h2>
                <p>
                  This is the common base for almost every VA role: client communication,
                  inbox and calendar work, files and spreadsheets, task management,
                  research, responsible AI use, and knowing when to escalate.
                </p>
                <ul className="tr-outcomes">
                  <li><Check size={16} /> Write useful updates and ask better questions</li>
                  <li><Check size={16} /> Organise recurring work without relying on memory</li>
                  <li><Check size={16} /> Handle inbox, calendar, files, research, and handoffs more reliably</li>
                  <li><Check size={16} /> Use AI without exposing client data or trusting unverified output</li>
                </ul>
                <div className="tr-cta-row">
                  <Link className="tr-btn tr-btn-primary" href={JOIN_HREF} data-track="training_account_click">
                    {foundationLive ? "Start Foundations free" : "Create free training account"} <ArrowRight size={16} />
                  </Link>
                  <a className="tr-text-link" href="#training-roadmap" data-track="training_learning_paths_click">
                    See what comes next
                  </a>
                </div>
              </div>

              <div className="tr-course-facts">
                <div>
                  <span>Status</span>
                  <strong>{foundationLive ? "Available now" : "In development"}</strong>
                </div>
                <div>
                  <span>Course length</span>
                  <strong>{foundation ? duration(foundation.estimated_minutes) : "About 4 hours"}</strong>
                </div>
                <div>
                  <span>Lesson format</span>
                  <strong>Text + practical exercises</strong>
                </div>
                <div>
                  <span>Certificate</span>
                  <strong>Included free</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="tr-section tr-section-soft">
          <div className="container">
            <div className="tr-head">
              <span className="tr-kicker">How it works</span>
              <h2>Learn it. Practise it. Save your progress.</h2>
              <p>
                Lessons explain the workflow, show the common mistakes, and then ask you
                to apply the idea in a realistic scenario or final work simulation.
              </p>
            </div>

            <div className="tr-steps">
              <article>
                <span>01</span>
                <BookOpen size={22} />
                <h3>Understand the workflow</h3>
                <p>Learn what the task is for, what information matters, and where your authority stops.</p>
              </article>
              <article>
                <span>02</span>
                <Briefcase size={22} />
                <h3>Work through a scenario</h3>
                <p>Apply the lesson to realistic composite examples instead of memorising trivia.</p>
              </article>
              <article>
                <span>03</span>
                <BadgeCheck size={22} />
                <h3>Complete the course</h3>
                <p>Finish the lessons and required practical assessment, then keep your free certificate.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="tr-section" id="training-roadmap">
          <div className="container">
            <div className="tr-head tr-head-wide">
              <span className="tr-kicker">Training roadmap</span>
              <h2>The roadmap below comes directly from the LMS.</h2>
              <p>
                We keep one public training page to avoid creating competing SEO pages.
                Course content, progress, assessments, and certificates live inside the signed-in training area.
              </p>
            </div>

            <div className="tr-paths tr-paths-two">
              <article className="tr-path">
                <div className="tr-path-top">
                  <span>01</span>
                  <em>{globalCourses.length || 15} courses</em>
                </div>
                <h3>Global VA training</h3>
                <p>Start with the universal skills and role specialisations that apply across client markets.</p>
                <ul>
                  {globalCourses.slice(0, 4).map((course) => (
                    <li key={course.id}>
                      <span>{course.title}</span>
                      <small>{statusLabel(course.status)}</small>
                    </li>
                  ))}
                </ul>
                {globalCourses.length > 4 ? <div className="tr-path-more">+ {globalCourses.length - 4} more courses</div> : null}
              </article>

              <article className="tr-path">
                <div className="tr-path-top">
                  <span>02</span>
                  <em>{australiaCourses.length || 11} courses</em>
                </div>
                <h3>Work with Australian businesses</h3>
                <p>Optional market-specific training for Australian business workflows, software, terminology, and administration.</p>
                <ul>
                  {australiaCourses.slice(0, 4).map((course) => (
                    <li key={course.id}>
                      <span>{course.title}</span>
                      <small>{statusLabel(course.status)}</small>
                    </li>
                  ))}
                </ul>
                {australiaCourses.length > 4 ? <div className="tr-path-more">+ {australiaCourses.length - 4} more courses</div> : null}
              </article>
            </div>

            <div className="tr-catalogue">
              <details open>
                <summary>
                  <span>
                    <strong>Global course roadmap</strong>
                    <small>{globalCourses.length || 15} courses · {publishedCourses} currently available</small>
                  </span>
                  <span>View</span>
                </summary>
                <ul className="tr-catalogue-grid">
                  {globalCourses.map((course) => (
                    <li className="tr-course-line" key={course.id}>
                      <span>{course.title}</span>
                      <small className={course.status === "published" ? "tr-status-live" : ""}>{statusLabel(course.status)}</small>
                    </li>
                  ))}
                </ul>
              </details>

              <details>
                <summary>
                  <span>
                    <strong>Australia specialisation</strong>
                    <small>{australiaCourses.length || 11} optional courses</small>
                  </span>
                  <span>View</span>
                </summary>
                <ul className="tr-catalogue-grid">
                  {australiaCourses.map((course) => (
                    <li className="tr-course-line" key={course.id}>
                      <span>{course.title}</span>
                      <small>{statusLabel(course.status)}</small>
                    </li>
                  ))}
                </ul>
              </details>
            </div>

            <div className="tr-request">
              <div>
                <strong>Need a course that is not on the roadmap?</strong>
                <span>Tell us the role, software, or workflow you actually use. Requests help us decide what to build next.</span>
              </div>
              <Link href="/contact" data-track="training_course_request">
                Request a course <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        <section className="tr-section tr-section-soft">
          <div className="container">
            <div className="tr-head">
              <span className="tr-kicker">Built for working VAs</span>
              <h2>Useful without needing a laptop, long videos, or a paid upgrade.</h2>
            </div>

            <div className="tr-principles">
              <article>
                <Smartphone size={22} />
                <h3>Phone-friendly</h3>
                <p>Text-first lessons, practical examples, and fewer unnecessary downloads.</p>
              </article>
              <article>
                <MapPinned size={22} />
                <h3>Global first, local when useful</h3>
                <p>Core training works across markets. Country-specific tracks add local context instead of duplicating the whole course library.</p>
              </article>
              <article>
                <Wallet size={22} />
                <h3>No paid certificate</h3>
                <p>Course access, assessments, and completion certificates stay free.</p>
              </article>
            </div>

            <div className="tr-trust-panel">
              <div>
                <span className="tr-kicker">Clear boundaries</span>
                <h2>No placement promise. No training requirement.</h2>
                <p>
                  Training can make you better prepared for work, but it does not replace
                  experience, work samples, communication, availability, or a client's hiring decision.
                </p>
              </div>
              <ul>
                <li><Check size={16} /> Training is optional</li>
                <li><Check size={16} /> A training account is not a candidate profile</li>
                <li><Check size={16} /> No course or certificate fee</li>
                <li><Check size={16} /> Specialist courses stay unpublished until reviewed</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="tr-section">
          <div className="container tr-faq-layout">
            <div className="tr-head">
              <span className="tr-kicker">FAQ</span>
              <h2>What to know before you start.</h2>
              <p>
                The important parts are simple: training is free, optional, mobile-friendly,
                and separate from the hiring system.
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
              <h2>{foundationLive ? "Virtual Assistant Foundations is open." : "Create your free training account."}</h2>
              <p>
                {foundationLive
                  ? "Start with Foundations, save your progress, and complete the practical assessment when you are ready."
                  : "Your account will hold your progress and certificates as courses are released."}
              </p>
            </div>
            <div className="tr-close-actions">
              <Link className="tr-btn tr-btn-light" href={JOIN_HREF} data-track="training_account_click">
                {foundationLive ? "Start free training" : "Create free account"} <ArrowRight size={16} />
              </Link>
              <Link className="tr-close-login" href={LOGIN_HREF} data-track="training_login_click">
                Already registered? Log in
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
