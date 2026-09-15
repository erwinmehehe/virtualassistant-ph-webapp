import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Virtual Assistant Profile",
  robots: { index: false, follow: false }
};

export default function TalentProfilePage() {
  notFound();
}
