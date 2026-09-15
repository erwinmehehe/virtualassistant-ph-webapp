import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Virtual Assistant Profiles",
  robots: { index: false, follow: true }
};

export default function TalentProfilePage() {
  redirect("/find-talent");
}
