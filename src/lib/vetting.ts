import { VETTING_PROFILE_MIN, VETTING_SCORECARD_PASS, VETTING_TEST_PASS } from "./constants";
import { getVaCompletion } from "./profile-completeness";
import type { VaProfile, VaVetting } from "./types";

export function vettingStatusLabel(stage?: string | null) {
  const labels: Record<string,string> = {
    profile: "Complete profile",
    test: "Skills test",
    video: "Video introduction",
    recruiter_review: "Recruiter review",
    finalist: "Final review",
    approved: "Vetted",
    bench: "Vetted bench",
    rejected: "Not approved"
  };
  return labels[stage || "profile"] || "Vetting";
}

export function getVettingReadiness(profile: Partial<VaProfile> | null, vetting: Partial<VaVetting> | null, testScore?: number | null, scorecard?: number | null, avatarUrl?: string | null) {
  const completion = getVaCompletion(profile, avatarUrl);
  const items = [
    { label: `Complete your structured profile (${VETTING_PROFILE_MIN}%+) and upload a resume`, done: completion.score >= VETTING_PROFILE_MIN && Boolean(profile?.resume_path), href: "/workspace/va/profile" },
    { label: `Pass your category skills test (${VETTING_TEST_PASS}%+)`, done: typeof testScore === "number" && testScore >= VETTING_TEST_PASS, href: "/workspace/va/vetting#skills-test" },
    { label: "Submit a 2-minute video introduction", done: Boolean(vetting?.video_url), href: "/workspace/va/vetting#video-intro" },
    { label: "Complete recruiter scorecard review", done: typeof scorecard === "number" && scorecard >= VETTING_SCORECARD_PASS, href: "/workspace/va/vetting#review" },
    { label: "Receive final approval", done: ["approved","bench"].includes(vetting?.stage || ""), href: "/workspace/va/vetting#status" }
  ];
  const completed = items.filter((x) => x.done).length;
  return { items, score: Math.round((completed / items.length) * 100), completion };
}

export function scorecardTotal(values: number[]) {
  const sum = values.reduce((a,b) => a + b, 0);
  return Math.round((sum / 25) * 100);
}
