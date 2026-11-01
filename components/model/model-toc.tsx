"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "scorecard", label: "Scorecard" },
  { id: "benchmark", label: "Benchmark" },
  { id: "tuning", label: "Tuning" },
  { id: "discrimination", label: "Discrimination" },
  { id: "calibration", label: "Calibration" },
  { id: "drivers", label: "Drivers" },
  { id: "cutoff", label: "Cutoff" },
  { id: "three-models", label: "Three models" },
  { id: "limitations", label: "Limitations" },
];

export function ModelToc() {
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    const elements = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        setActive(topMost.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Methodology sections"
      className="sticky top-16 z-10 -mx-4 border-b border-hairline bg-paper/90 px-4 py-3 backdrop-blur-sm lg:static lg:top-28 lg:mx-0 lg:border-b-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none"
    >
      <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1 lg:overflow-visible">
        {SECTIONS.map((s) => {
          const isActive = active === s.id;
          return (
            <li key={s.id} className="shrink-0">
              <Link
                href={`#${s.id}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "block whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors",
                  "lg:rounded-none lg:border-0 lg:border-l-2 lg:px-0 lg:pl-3",
                  isActive
                    ? "border-brand bg-secondary text-ink lg:bg-transparent"
                    : "border-hairline text-ink-muted hover:text-ink lg:border-hairline",
                )}
              >
                {s.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
