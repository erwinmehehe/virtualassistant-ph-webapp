import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Check,
  GraduationCap,
  Smartphone,
  Wallet
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { canonicalPath, canonicalUrl } from "@/lib/seo-url";
import { TRAINING_LEVELS, CATALOGUE_TOTALS, STATUS_LABEL } from "@/lib/training-catalogue";
import "../training-landing.css";

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export const metadata: Metadata = {
  title: "Virtual Assistant Training Philippines | Free VA Course",
  description:
    "Free Virtual Assistant training for Filipinos. Learn practical client communication, admin workflows, software, and industry skills in short mobile-friendly lessons.",
  alternates: { canonical: canonicalPath("/training") }
};

const JOIN_HREF = "/workspace/training";
const LOGIN_HREF = "/auth/login?next=%2Fworkspace%2Ftraining";

const FAQS = [
  [
    "Is the training really free?",
    "Yes. There is no course fee, certificate fee, paid tier, or placement fee for Virtual Assistants."
  ],
  [
    "Do I have to work with VirtualAssistant.com.ph?",
    "No. The training is useful outside our platform too. You can complete it and use what you learned with any employer or client."
  ],
  [
    "Do I need to finish the training to get hired here?",
    "No. Training is optional. Recruiters and clients still look at your experience, work samples, communication, availability, and role fit."
  ],
  [
    "Why do I need an account?",
    "An account saves your progress and connects completed lessons and certificates to you."
  ],
  [
    "Will it work on my phone?",
    "Yes. Lessons are designed around short text, images, and practical exercises so they stay usable on a phone and lighter on mobile data."
  ]
] as const;

const softwareLevel = TRAINING_LEVELS.find((level) => level.id === "software");
const industryLevel = TRAINING_LEVELS.find((level) => level.id === "industry");

export default function TrainingPage() {
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
    }
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
                Learn the work.
                <span> Show what you can do.</span>
              </h1>
              <p className="tr-hero-lede">
                Practical Virtual Assistant training built around the communication,
                admin, software, and industry workflows clients actually hand over.
                Lessons are short, mobile-friendly, and designed to leave you with
                proof of skill, not just notes.
              </p>

              <div className="tr-cta-row">
                <Link
                  className="tr-btn tr-btn-primary"
                  href={JOIN_HREF}
                  data-track="training_join"
                >
                  Create free training account <ArrowRight size={17} />
                </Link>
                <a className="tr-btn tr-btn-secondary" href="#learning-paths">
                  Browse learning paths
                </a>
              </div>

              <p className="tr-login-note">
                Already have an account? <Link href={LOGIN_HREF}>Log in to training</Link>
              </p>

              <ul className="tr-assure">
                <li><Check size={15} /> No course or certificate fees</li>
                <li><Check size={15} /> Built for phone and mobile data</li>
                <li><Check size={15} /> Never required for placement</li>
              </ul>
            </div>

            <aside className="tr-preview" aria-label="Training outcomes">
              <div className="tr-preview-top">
                <span>What you build</span>
                <strong>Client-ready proof</strong>
              </div>
              <ol className="tr-preview-list">
                <li>
                  <b>01</b>
                  <div>
                    <strong>Clearer client communication</strong>
                    <span>Updates, questions, handoffs, and escalation.</span>
                  </div>
                </li>
                <li>
                  <b>02</b>
                  <div>
                    <strong>Repeatable work habits</strong>
                    <span>Inbox, calendar, files, research, and quality checks.</span>
                  </div>
                </li>
                <li>
                  <b>03</b>
                  <div>
                    <strong>Role-specific context</strong>
                    <span>Software and industry workflows used by real businesses.</span>
                  </div>
                </li>
                <li>
                  <b>04</b>
                  <div>
                    <strong>Evidence you can show</strong>
                    <span>Exercises, profile improvements, and certificates.</span>
                  </div>
                </li>
              </ol>
              <div className="tr-preview-foot">
                Short lessons. Practical exercises. No paid upgrade.
              </div>
            </aside>
          </div>
        </section>

        <section className="tr-intro-band">
          <div className="container tr-intro-band-grid">
            <strong>Training should make you easier to trust with real work.</strong>
            <span>
              That means fewer generic lectures and more practice with the decisions,
              messages, tools, and handoffs a Virtual Assistant handles every day.
            </span>
          </div>
        </section>

        <section className="tr-section">
          <div className="container">
            <div className="tr-featured">
              <div className="tr-featured-copy">
                <span className="tr-kicker">First release</span>
                <h2>Start with Virtual Assistant Foundations.</h2>
                <p>
                  The first course covers the basics that show up in almost every VA
                  role: professional communication, remote work habits, inbox and
                  calendar management, file organisation, research, mistakes, and
                  responsible use of AI.
                </p>
                <ul className="tr-outcomes">
                  <li><Check size={16} /> Communicate clearly without overexplaining</li>
                  <li><Check size={16} /> Organise recurring work so nothing gets lost</li>
                  <li><Check size={16} /> Check your own work before a client has to</li>
                  <li><Check size={16} /> Use AI without exposing client data or trusting bad output</li>
                </ul>
                <div className="tr-cta-row">
                  <Link className="tr-btn tr-btn-primary" href={JOIN_HREF}>
                    Create free account <ArrowRight size={16} />
                  </Link>
                  <a className="tr-text-link" href="#learning-paths">
                    See the full roadmap
                  </a>
                </div>
              </div>

              <div className="tr-course-facts">
                <div>
                  <span>Status</span>
                  <strong>In production</strong>
                </div>
                <div>
                  <span>Lesson format</span>
                  <strong>Short text + images</strong>
                </div>
                <div>
                  <span>Typical lesson</span>
                  <strong>10 to 30 minutes</strong>
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
              <h2>Learn something useful, practise it, then show the evidence.</h2>
              <p>
                The training is structured around work outputs instead of long lectures.
                Each stage should improve something a recruiter or client can actually inspect.
              </p>
            </div>

            <div className="tr-steps">
              <article>
                <span>01</span>
                <BookOpen size={22} />
                <h3>Learn the workflow</h3>
                <p>Understand the task, the handoff, the checks, and when to escalate.</p>
              </article>
              <article>
                <span>02</span>
                <Briefcase size={22} />
                <h3>Do the work</h3>
                <p>Complete a short exercise based on the kind of output a client expects.</p>
              </article>
              <article>
                <span>03</span>
                <BadgeCheck size={22} />
                <h3>Keep the proof</h3>
                <p>Use the result to strengthen your profile, portfolio, or training record.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="tr-section" id="learning-paths">
          <div className="container">
            <div className="tr-head tr-head-wide">
              <span className="tr-kicker">Learning paths</span>
              <h2>Build the general skills first. Specialise when the work calls for it.</h2>
              <p>
                The roadmap currently covers {CATALOGUE_TOTALS.courses} course topics across
                foundations, core skills, software, and industry workflows. Topics are released
                as the underlying lessons are completed, not simply because they appear in the catalogue.
              </p>
            </div>

            <div className="tr-paths">
              {TRAINING_LEVELS.map((level, index) => (
                <article className="tr-path" key={level.id}>
                  <div className="tr-path-top">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <em>{level.courses.length} {level.courses.length === 1 ? "course" : "courses"}</em>
                  </div>
                  <h3>{level.title}</h3>
                  <p>{level.intro}</p>
                  <ul>
                    {level.courses.slice(0, 3).map((course) => (
                      <li key={course.title}>
                        <span>{course.title.replace(/ fundamentals$| administration$/i, "")}</span>
                        {level.display === "list" ? (
                          <small>{STATUS_LABEL[course.status]}</small>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  {level.courses.length > 3 ? (
                    <div className="tr-path-more">+ {level.courses.length - 3} more topics</div>
                  ) : null}
                </article>
              ))}
            </div>

            <div className="tr-catalogue">
              {softwareLevel ? (
                <details>
                  <summary>
                    <span>
                      <strong>Software training</strong>
                      <small>{softwareLevel.courses.length} planned topics</small>
                    </span>
                    <span>Browse</span>
                  </summary>
                  <ul className="tr-catalogue-grid">
                    {softwareLevel.courses.map((course) => (
                      <li key={course.title}>
                        {course.href ? (
                          <Link href={course.href}>
                            {course.title.replace(/ fundamentals$/i, "")}
                          </Link>
                        ) : (
                          <span>{course.title}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}

              {industryLevel ? (
                <details>
                  <summary>
                    <span>
                      <strong>Industry workflow training</strong>
                      <small>{industryLevel.courses.length} planned topics</small>
                    </span>
                    <span>Browse</span>
                  </summary>
                  <ul className="tr-catalogue-grid">
                    {industryLevel.courses.map((course) => (
                      <li key={course.title}>
                        {course.href ? (
                          <Link href={course.href}>
                            {course.title.replace(/ administration$/i, "")}
                          </Link>
                        ) : (
                          <span>{course.title}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>

            <div className="tr-request">
              <div>
                <strong>Missing a tool or workflow you use at work?</strong>
                <span>Tell us what would be genuinely useful and we will use requests to prioritise the roadmap.</span>
              </div>
              <Link href="/contact">
                Request a course <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        <section className="tr-section tr-section-soft">
          <div className="container">
            <div className="tr-head">
              <span className="tr-kicker">Designed for working VAs</span>
              <h2>Useful when your time, data, and attention are limited.</h2>
            </div>

            <div className="tr-principles">
              <article>
                <Smartphone size={22} />
                <h3>Phone-friendly by default</h3>
                <p>
                  Short text and images instead of making every lesson a long video or large download.
                </p>
              </article>
              <article>
                <Briefcase size={22} />
                <h3>Built around actual workflows</h3>
                <p>
                  Learn the language, tools, handoffs, and expectations behind the roles businesses hire for.
                </p>
              </article>
              <article>
                <Wallet size={22} />
                <h3>No paywall behind progress</h3>
                <p>
                  Course access and certificates stay free. Training is separate from whether you apply for work here.
                </p>
              </article>
            </div>

            <div className="tr-trust-panel">
              <div>
                <span className="tr-kicker">Clear boundaries</span>
                <h2>No placement promise. No training requirement.</h2>
                <p>
                  A course can help you become better prepared, but it does not replace experience,
                  role fit, communication, work samples, or a client's hiring decision.
                </p>
              </div>
              <ul>
                <li><Check size={16} /> Training is optional</li>
                <li><Check size={16} /> No course or certificate fee</li>
                <li><Check size={16} /> No guaranteed placement language</li>
                <li><Check size={16} /> Your work evidence still matters most</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="tr-section">
          <div className="container tr-faq-layout">
            <div className="tr-head">
              <span className="tr-kicker">FAQ</span>
              <h2>Training questions, answered plainly.</h2>
              <p>
                The important parts are simple: it is free, optional, mobile-friendly,
                and separate from the hiring decision.
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
              <h2>Build skills you can actually show.</h2>
              <p>
                Create your training account, save your progress, and start with the
                first lessons as they are released.
              </p>
            </div>
            <div className="tr-close-actions">
              <Link
                className="tr-btn tr-btn-light"
                href={JOIN_HREF}
                data-track="training_join_footer"
              >
                Create free account <ArrowRight size={17} />
              </Link>
              <Link className="tr-close-login" href={LOGIN_HREF}>
                I already have an account
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
