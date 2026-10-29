"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ThemeToggle } from "./theme-toggle";

const LINKS = [
  { href: "/", label: "Brief" },
  { href: "/assess", label: "Assess" },
  { href: "/portfolio", label: "The book" },
  { href: "/model", label: "Methodology" },
];

export function SiteNav({ ticker }: { ticker: { label: string; value: string }[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-paper/85 backdrop-blur-md">
      <div className="hidden bg-forest text-mint md:block">
        <div className="mx-auto flex h-8 max-w-7xl items-center gap-6 overflow-hidden px-6 font-mono text-[11px] uppercase tracking-[0.12em]">
          {ticker.map((t) => (
            <span key={t.label} className="whitespace-nowrap">
              <span className="opacity-60">{t.label}</span> <span className="tabular-nums">{t.value}</span>
            </span>
          ))}
          <span className="ml-auto whitespace-nowrap opacity-60">UCI Statlog · German Credit</span>
        </div>
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span aria-hidden className="grid size-8 place-items-center rounded-md bg-forest font-mono text-[11px] font-semibold tracking-tight text-mint">
            PD
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="font-serif text-[1.05rem] leading-none tracking-tight">
              Credo<span className="italic text-brand">Score</span>
            </span>
            <span className="font-mono text-[9px] uppercase leading-none tracking-[0.12em] text-muted-foreground">
              Loan Default Risk Predictor
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "relative px-3 py-2 text-sm transition-colors",
                isActive(link.href)
                  ? "text-ink after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:bg-brand"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden lg:inline-flex">
            <Link href="/assess">
              Assess an applicant <ArrowRight />
            </Link>
          </Button>
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-full border border-hairline md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-hairline bg-paper md:hidden">
          <ul className="mx-auto max-w-7xl px-4 py-4">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between border-b border-hairline py-4 font-serif text-2xl",
                    isActive(link.href) ? "text-brand" : "text-ink",
                  )}
                >
                  {link.label}
                  <ArrowRight className="size-5 opacity-50" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
