import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { JoinAccountForm } from "@/components/join-account-form";

export const metadata: Metadata = { title: "Create a Client Account", robots: { index: false, follow: false } };

export default async function ClientJoinPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const params = await searchParams;
  return <><SiteHeader/><main id="main-content" className="auth-page auth-page-client"><JoinAccountForm role="client" error={params.error} talent={params.talent?.trim()} lead={params.lead?.trim()} next={params.next?.trim()}/></main></>;
}
