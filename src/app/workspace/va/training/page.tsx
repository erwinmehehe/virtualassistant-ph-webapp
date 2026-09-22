import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, Clock3, GraduationCap } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getVaCompletion } from "@/lib/profile-completeness";
import { PUBLIC_VA_MIN_COMPLETION } from "@/lib/public-visibility";
import { TRAINING_LESSONS, TOTAL_TRAINING_MINUTES } from "@/lib/va-training";

export const metadata = { title: "Free VA training" };

/**
 * Free training, always. A lesson is complete when the profile field it
 * teaches is filled, so there is no separate progress to store and no way for
 * paying anything to change a VA's standing.
 */
export default async function VaTrainingPage() {
  const { user, profile } = await requireRole("va");
  const supabase = await createClient();
  const { data: va } = await supabase.from("va_profiles").select("*").eq("user_id", user.id).maybeSingle();
  const completion = getVaCompletion(va, profile.avatar_url);

  const doneByKey = new Map(completion.items.map((item) => [item.key, item]));
  const lessons = TRAINING_LESSONS.map((lesson) => {
    const item = doneByKey.get(lesson.key);
    return { ...lesson, done: Boolean(item?.done), href: item?.href || "/workspace/va/profile" };
  });
  const doneCount = lessons.filter((lesson) => lesson.done).length;
  const remaining = lessons.filter((lesson) => !lesson.done);
  const minutesLeft = remaining.reduce((sum, lesson) => sum + lesson.minutes, 0);
  const publicReady = completion.score >= PUBLIC_VA_MIN_COMPLETION;

  return <>
    <div className="page-head">
      <div>
        <div className="kicker">Free VA training</div>
        <h1>Get your profile in front of clients</h1>
        <p>Eleven short lessons on what recruiters and clients look for. Every one finishes a part of your profile, so the training and the profile are the same work. It is free, it always will be, and it never affects whether you are shortlisted.</p>
      </div>
      <Link className="btn" href="/workspace/va/profile">Open my profile</Link>
    </div>

    <section className="card">
      <div className="row-between wrap">
        <div>
          <span className="small muted">Lessons finished</span>
          <h2 style={{ margin: "4px 0 0" }}>{doneCount} of {lessons.length}</h2>
        </div>
        <span className="badge"><GraduationCap size={13}/> {completion.score}% profile</span>
      </div>
      <div className="progress" aria-label={`${doneCount} of ${lessons.length} lessons finished`} style={{ marginTop: 12 }}>
        <span style={{ width: `${Math.round((doneCount / lessons.length) * 100)}%` }}/>
      </div>
      <p className="small muted" style={{ marginTop: 14, marginBottom: 0 }}>
        {publicReady
          ? `Your profile is at ${completion.score}%, past the ${PUBLIC_VA_MIN_COMPLETION}% needed for the public directory. Finish the rest to stand out further.`
          : remaining.length
            ? `About ${minutesLeft} minutes of lessons left. At ${PUBLIC_VA_MIN_COMPLETION}% your profile can appear in the public directory, once you add a photo and opt in.`
            : `All ${TOTAL_TRAINING_MINUTES} minutes done.`}
      </p>
    </section>

    <div className="stack" style={{ marginTop: 20 }}>
      {lessons.map((lesson, index) => (
        <details className="card" key={lesson.key} open={!lesson.done && lesson.key === remaining[0]?.key}>
          <summary className="row-between wrap" style={{ cursor: "pointer", listStyle: "none" }}>
            <span className="row" style={{ alignItems: "center", gap: 10 }}>
              {lesson.done
                ? <CheckCircle2 size={18} aria-label="Finished"/>
                : <Circle size={18} aria-label="Not finished"/>}
              <strong>{index + 1}. {lesson.title}</strong>
            </span>
            <span className="small muted row" style={{ alignItems: "center", gap: 6 }}>
              <Clock3 size={13}/> {lesson.minutes} min
            </span>
          </summary>

          <p style={{ marginTop: 14 }}>{lesson.why}</p>
          <ol className="stack" style={{ margin: "0 0 4px", paddingLeft: 18 }}>
            {lesson.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>

          {lesson.example ? (
            <div className="grid-2" style={{ marginTop: 14 }}>
              <div className="info-banner">
                <strong className="small">Weak</strong>
                <p className="small muted" style={{ margin: "6px 0 0" }}>{lesson.example.weak}</p>
              </div>
              <div className="info-banner">
                <strong className="small">Strong</strong>
                <p className="small" style={{ margin: "6px 0 0" }}>{lesson.example.strong}</p>
              </div>
            </div>
          ) : null}

          <Link className={`btn ${lesson.done ? "" : "btn-primary"}`} href={lesson.href} style={{ marginTop: 16 }}>
            {lesson.done ? "Review this on my profile" : "Do this on my profile"} <ArrowRight size={15}/>
          </Link>
        </details>
      ))}
    </div>
  </>;
}
