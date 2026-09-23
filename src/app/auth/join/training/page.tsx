import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { TrainingJoinForm } from "@/components/training-join-form";

export const metadata: Metadata = {
  title: "Create a Free Training Account",
  robots: { index: false, follow: false },
};

export default async function TrainingJoinPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      <SiteHeader/>
      <main id="main-content" className="auth-page">
        <TrainingJoinForm error={params.error}/>
      </main>
    </>
  );
}
