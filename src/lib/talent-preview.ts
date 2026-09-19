/** One approved profile as shown in the hiring-form success preview. */
export type TopMatch = {
  id: string;
  name: string;
  headline: string;
  avatarUrl: string | null;
  yearsExperience: number;
  weeklyHours: number | null;
  skills: string[];
};
