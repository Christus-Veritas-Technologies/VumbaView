import { contactInfo, navLinks, siteConfig } from "@/lib/site-config";
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="flex flex-col gap-3 md:col-span-2">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              VV
            </span>
            {siteConfig.name}
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            {siteConfig.description} Our motto, &ldquo;{siteConfig.motto},&rdquo; guides every
            learner from ECD through A-Level.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">Quick Links</h3>
          <nav className="flex flex-col gap-2">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">Contact</h3>
          <address className="flex flex-col gap-1 text-sm text-muted-foreground not-italic">
            {contactInfo.addressLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
            <a href={`tel:${contactInfo.phone.replace(/\s/g, "")}`} className="hover:text-primary">
              {contactInfo.phone}
            </a>
            <a href={`mailto:${contactInfo.email}`} className="hover:text-primary">
              {contactInfo.email}
            </a>
          </address>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>
            &copy; {year} {siteConfig.name}. All rights reserved.
          </span>
          <span>Founded {siteConfig.founded} &middot; Mutare, Zimbabwe</span>
        </div>
      </div>
    </footer>
  );
}
