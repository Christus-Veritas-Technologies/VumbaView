"use client";

import { navLinks, siteConfig } from "@/lib/site-config";
import { Button } from "@vva/ui/components/button";
import { cn } from "@vva/ui/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { ModeToggle } from "./mode-toggle";

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-primary">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            VV
          </span>
          <span className="hidden sm:inline">{siteConfig.shortName}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-foreground/80 hover:bg-secondary hover:text-secondary-foreground",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ModeToggle />
          <Button
            render={<Link href="/admissions" />}
            className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90"
          >
            Apply Now
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ModeToggle />
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen ? (
        <nav className="flex flex-col gap-1 border-t border-border px-4 pb-4 md:hidden">
          {navLinks.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-foreground/80 hover:bg-secondary hover:text-secondary-foreground",
                )}
              >
                {label}
              </Link>
            );
          })}
          <Button
            render={<Link href="/admissions" onClick={() => setMobileOpen(false)} />}
            className="mt-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Apply Now
          </Button>
        </nav>
      ) : null}
    </header>
  );
}
