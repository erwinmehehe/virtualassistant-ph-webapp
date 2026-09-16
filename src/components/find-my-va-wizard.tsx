"use client";

import type { ShortlistTalent } from "@/components/talent-shortlist";
import { HomepageEditorialSections } from "@/components/homepage-editorial-sections";

export type MatchTalent = ShortlistTalent & {
  category?: string | null;
  categories?: string[] | null;
  weeklyHours?: number | null;
  hourlyRate?: number | null;
  yearsExperience?: number | null;
  schedule?: string | null;
};

export function FindMyVaWizard({ talent }: { talent: MatchTalent[] }) {
  void talent;

  return <HomepageEditorialSections />;
}
