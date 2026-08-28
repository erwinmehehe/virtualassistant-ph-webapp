import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { JoinAccountForm } from "@/components/join-account-form";

export const metadata: Metadata = { title: "Apply as a Virtual Assistant", robots: { index: false, follow: false } };

export default async function VaJoinPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const params = await searchParams;
  return <><SiteHeader/><main id="main-content" className="auth-page auth-page-va"><JoinAccountForm role="va" error={params.error} next={params.next?.trim()}/></main></>;
}
