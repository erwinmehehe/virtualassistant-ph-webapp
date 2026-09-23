import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BookOpen, Briefcase, Check, GraduationCap, Smartphone, Wallet } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { canonicalPath, canonicalUrl } from "@/lib/seo-url";
import { TRAINING_LESSONS, TOTAL_TRAINING_MINUTES } from "@/lib/va-training";
import { TRAINING_LEVELS, CATALOGUE_TOTALS, STATUS_LABEL } from "@/lib/training-catalogue";
import "../training-landing.css";

/**
 * Virtual Assistant Training Philippines — the one public door to the
 * training. Lessons live in the VA workspace, which is noindexed, so this
 * page is how anyone searching for VA training finds it at all.
 *
 * Only the course that exists is offered. The rest is named as in progress,
 * because a free course nobody can start is worse than no promise.
 */

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export const metadata: Metadata = {
  title: "Virtual Assistant Training Philippines | Free VA Course",
  description:
    "Free Virtual Assistant training for Filipinos. Short mobile-friendly lessons on the skills clients hire for, free certificates, and no fees ever. Start today.",
  keywords: [
    "virtual assistant training philippines",
    "free virtual assistant training",
    "va training philippines",
    "how to become a virtual assistant philippines",
    "online va course philippines"
  ],
  alternates: { canonical: canonicalPath("/training") }
};

const JOIN_HREF = "/auth/join/va?next=%2Fworkspace%2Fva%2Ftraining&from=training";
const LOGIN_HREF = "/auth/login?next=%2Fworkspace%2Fva%2Ftraining";

const FAQS = [
  ["Is the training really free?", "Yes. Every lesson, exercise and certificate is free, and always will be. We never charge Filipino Virtual Assistants for anything — not for training, not for being matched with a client."],
  ["Do I have to work with VirtualAssistant.com.ph?", "No. Take the course, finish it, and never apply for anything. What you learn works on any platform and with any employer."],
  ["Do I need to finish the training to get hired here?", "No. Training is never a requirement. Your experience, portfolio and interviews count exactly as much as they did before."],
  ["Why do I need an account?", "Only to save your progress and keep certificates honest. It is free and takes about a minute."],
  ["Will it work on my phone?", "Yes. Lessons are short and text-based with images, built to stay light on mobile data. Nothing is locked behind a long video."],
  ["Who is this for?", "Filipino Virtual Assistants at any stage — whether you have five years behind you or you are still working out how to describe what you can do."]
] as const;

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

  return <><SiteHeader/><main id="main-content" className="tr">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(schema) }} />

    <section className="tr-hero">
      <div className="container tr-hero-grid">
        <div>
          <span className="tr-eyebrow"><GraduationCap size={15}/> Virtual Assistant Training Philippines</span>
          <h1>Free VA training that gets you <span>picked by clients</span>.</h1>
          <p className="tr-hero-lede">
            Most Filipino VAs lose work they could have won, because their profile does not show what they can actually do. These lessons fix that — written for Filipinos, readable on your phone, and free from start to certificate.
          </p>
          <div className="tr-cta-row">
            <Link className="tr-btn tr-btn-primary" href={JOIN_HREF} data-track="training_join">Start free training <ArrowRight size={17}/></Link>
            <Link className="tr-btn tr-btn-ghost" href={LOGIN_HREF} data-track="training_login">I have an account</Link>
          </div>
          <ul className="tr-assure">
            <li><Check size={15}/> Free forever, no card</li>
            <li><Check size={15}/> Works on mobile data</li>
            <li><Check size={15}/> Yours even if you never work with us</li>
          </ul>
        </div>

        <aside className="tr-card">
          <div className="tr-card-head">
            <strong>Get client-ready</strong>
            <span>{TRAINING_LESSONS.length} lessons · {TOTAL_TRAINING_MINUTES} min</span>
          </div>
          <ol>
            {TRAINING_LESSONS.slice(0, 4).map((lesson) => (
              <li key={lesson.key}><span>{lesson.title}</span><em>{lesson.minutes}m</em></li>
            ))}
          </ol>
          <p className="tr-card-foot">…and {TRAINING_LESSONS.length - 4} more. Every lesson finishes a part of your profile as you go.</p>
        </aside>
      </div>
    </section>

    <section className="tr-stats">
      <div className="container tr-stats-grid">
        <div><strong>{TRAINING_LESSONS.length}</strong><span>lessons open now</span></div>
        <div><strong>{TOTAL_TRAINING_MINUTES} min</strong><span>to finish the course</span></div>
        <div><strong>&#8369;0</strong><span>now and always</span></div>
        <div><strong>10&ndash;15 min</strong><span>per lesson</span></div>
      </div>
    </section>

    <section className="tr-section">
      <div className="container">
        <div className="tr-head">
          <span className="tr-kicker">Open now</span>
          <h2>Start with the course that changes what clients see.</h2>
          <p>Before you learn new software, make the experience you already have readable to someone deciding in twenty seconds. That is what this course does.</p>
        </div>
        <div className="tr-featured">
          <div>
            <span className="tr-chip is-live">Available now</span>
            <h3>Get client-ready</h3>
            <p>Your summary, skills, headline, rate, portfolio and photo — what each one is for, what a strong one looks like, and the weak version that loses you the job. Every lesson ends on the part of your profile it teaches.</p>
            <div className="tr-cta-row">
              <Link className="tr-btn tr-btn-primary" href={JOIN_HREF}>Start free <ArrowRight size={16}/></Link>
            </div>
            <div className="tr-tile-meta">{TRAINING_LESSONS.length} lessons · {TOTAL_TRAINING_MINUTES} minutes · free certificate</div>
          </div>
          <ul className="tr-featured-list">
            {TRAINING_LESSONS.map((lesson, index) => (
              <li key={lesson.key}><b>{String(index + 1).padStart(2, "0")}</b><span>{lesson.title}</span><em>{lesson.minutes}m</em></li>
            ))}
          </ul>
        </div>

      </div>
    </section>

    <section className="tr-section tr-section-alt" id="catalogue">
      <div className="container">
        <div className="tr-head">
          <span className="tr-kicker">The catalogue</span>
          <h2>{CATALOGUE_TOTALS.courses} free courses, built from the work Australian businesses actually hire for.</h2>
          <p>Every software and industry course here matches a role we already recruit for, so what you learn is what someone is paying for. {CATALOGUE_TOTALS.open} is open today and the rest are marked honestly — we would rather say &ldquo;planned&rdquo; than sell you a course that does not exist.</p>
        </div>

        <div className="tr-levels">
          {TRAINING_LEVELS.map((level) => (
            <section className="tr-level" key={level.id}>
              <header className="tr-level-head">
                <div>
                  <span className="tr-level-tag">{level.level}</span>
                  <h3>{level.title}</h3>
                  <p>{level.intro}</p>
                </div>
                <span className="tr-level-count">{level.courses.length} courses</span>
              </header>
              {level.display === "grid" ? (
                <ul className="tr-course-grid">
                  {level.courses.map((course) => (
                    <li key={course.title}>
                      {course.href
                        ? <Link href={course.href}>{course.title.replace(/ fundamentals$| administration$/, "")}</Link>
                        : <span>{course.title}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="tr-course-list">
                  {level.courses.map((course) => (
                    <li className={`tr-course is-${course.status}`} key={course.title}>
                      <div>
                        <strong>{course.title}</strong>
                        <span>{course.blurb}</span>
                      </div>
                      <div className="tr-course-side">
                        <span className={`tr-chip${course.status === "open" ? " is-live" : ""}`}>{STATUS_LABEL[course.status]}</span>
                        {course.lessons ? <em>{course.lessons} lessons · {course.minutes}m</em> : null}
                        {course.status === "open" ? <Link className="tr-btn tr-btn-primary tr-btn-sm" href={JOIN_HREF}>Start</Link> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="tr-request">
          <div>
            <strong>Not seeing the software or industry you work in?</strong>
            <span>Tell us and it goes on the list. What VAs ask for is how we decide what to write next.</span>
          </div>
          <Link href="/contact">Request a course <ArrowRight size={15}/></Link>
        </div>
      </div>
    </section>

    <section className="tr-section tr-section-alt">
      <div className="container">
        <div className="tr-head">
          <span className="tr-kicker">Our promise</span>
          <h2>Free means free. Not free until the certificate.</h2>
        </div>
        <div className="tr-promise">
          <div>
            <Wallet size={22}/>
            <h3>We never charge VAs</h3>
            <p>No course fee, no certificate fee, no paid tier, no upsell. If someone asks a Filipino VA to pay us for training or for work, it is not us.</p>
          </div>
          <div>
            <Briefcase size={22}/>
            <h3>Take it anywhere</h3>
            <p>Inbox habits, client communication, rate setting and portfolios work on any platform and with any employer. Finish and walk away if you like.</p>
          </div>
          <div>
            <BadgeCheck size={22}/>
            <h3>Never a hiring gate</h3>
            <p>Finishing a course does not decide whether you are shortlisted here, and skipping it costs you nothing. Experience and evidence do that work.</p>
          </div>
        </div>
      </div>
    </section>

    <section className="tr-section">
      <div className="container">
        <div className="tr-head">
          <span className="tr-kicker">How it works</span>
          <h2>Built for how Filipino VAs actually study.</h2>
        </div>
        <div className="tr-grid">
          <article className="tr-tile">
            <div className="tr-tile-icon"><Smartphone size={21}/></div>
            <h3>On your phone, on mobile data</h3>
            <p>Text and images, nothing heavy. No compulsory video, no long download before you learn anything.</p>
          </article>
          <article className="tr-tile">
            <div className="tr-tile-icon"><BookOpen size={21}/></div>
            <h3>Ten minutes at a time</h3>
            <p>Each lesson stands on its own and ends with something you do. Stop after one, come back when you can.</p>
          </article>
          <article className="tr-tile">
            <div className="tr-tile-icon"><Check size={21}/></div>
            <h3>You finish with a real profile</h3>
            <p>Every lesson ends on the part of your profile it teaches, so completing the course and being ready for clients are the same thing.</p>
          </article>
        </div>
      </div>
    </section>

    <section className="tr-section tr-section-alt">
      <div className="container">
        <div className="tr-head">
          <span className="tr-kicker">Questions</span>
          <h2>The things VAs ask us first.</h2>
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
      <div className="container">
        <h2>Start today. It costs nothing and it is yours to keep.</h2>
        <p>Create a free account, open lesson one, and by the end your profile says what you can actually do.</p>
        <div className="tr-cta-row">
          <Link className="tr-btn tr-btn-primary" href={JOIN_HREF} data-track="training_join_footer">Start free training <ArrowRight size={17}/></Link>
          <Link className="tr-btn tr-btn-ghost" href={LOGIN_HREF}>I have an account</Link>
        </div>
      </div>
    </section>

    <section className="tr-section">
      <div className="container">
        <div className="tr-hiring">
          <div>
            <strong>Hiring a Virtual Assistant instead?</strong>
            <span>This is the standard we hold every VA we present to.</span>
          </div>
          <Link href="/hire" data-track="training_hire_cta">Get your free match <ArrowRight size={15}/></Link>
        </div>
      </div>
    </section>
  </main><SiteFooter/></>;
}
