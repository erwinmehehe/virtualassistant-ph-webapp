import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StickyHireCta } from "@/components/sticky-hire-cta";

export function SiteFooter() {
  return (
    <footer className="footer">
      <StickyHireCta/>
      <div className="container footer-cta">
        <div><h2>Tell us the work you need covered. We will help you narrow the shortlist.</h2></div>
        <div className="row wrap"><Link className="btn btn-white" href="/hire">Get a managed VA <ArrowRight size={15}/></Link><Link className="btn footer-outline-btn" href="/find-talent">Browse VAs</Link></div>
      </div>
      <div className="container footer-grid">
        <div className="footer-brand-block">
          <Link className="brand" href="/">VirtualAssistant<span className="ph">.com.ph</span></Link>
          <p>Vetted Filipino virtual assistants for businesses that want a clearer path from workload to shortlist to hire.</p>
        </div>
        <div className="footer-links"><strong>Hire</strong><Link href="/hire">Get a managed VA</Link><Link href="/find-talent">Browse VAs</Link><Link href="/services">Services</Link><Link href="/pricing">Pricing</Link><Link href="/managed-vs-direct-hire">Managed vs. Direct Hire</Link></div>
        <div className="footer-links"><strong>Explore</strong><Link href="/industries">Industries</Link><Link href="/how-vetting-works">Vetting</Link><Link href="/why-philippines">Why Philippines</Link><Link href="/blog">Blog</Link><Link href="/tools">Free tools</Link></div>
        <div className="footer-links"><strong>Company</strong><Link href="/about">About</Link><Link href="/faq">FAQ</Link><Link href="/contact">Contact</Link><Link href="/editorial-policy">Editorial policy</Link></div>
        <div className="footer-links"><strong>Account</strong><Link href="/auth/login">Log in</Link><Link href="/auth/join/va">Apply as a VA</Link><Link href="/jobs">VA jobs</Link></div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} VirtualAssistant.com.ph</span><span className="footer-legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></span></div>
    </footer>
  );
}
