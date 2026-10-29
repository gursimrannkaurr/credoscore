"use client";

import { motion, useReducedMotion } from "framer-motion";

export function EmptySlip({ error }: { error: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border-2 border-dashed border-hairline-strong p-8"
    >
      <p className="kicker">Risk slip</p>
      <p className="num mt-2 text-6xl text-hairline-strong">-.-%</p>
      <div className="mt-6 space-y-2.5">
        <div className="h-2 w-5/6 rounded bg-hairline" />
        <div className="h-2 w-2/3 rounded bg-hairline" />
        <div className="h-2 w-1/2 rounded bg-hairline" />
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        Pick a sample file or fill in the form, then press <strong className="font-medium text-ink">Score this applicant</strong>.
      </p>
      {error ? <p className="mt-2 text-sm text-band-high">Fix the highlighted field and try again.</p> : null}
    </motion.div>
  );
}

export function ResultSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-paper-raised" aria-hidden>
      <div className="flex justify-between border-b border-hairline px-5 py-3">
        <div className="h-3 w-20 animate-pulse rounded bg-hairline" />
        <div className="h-3 w-16 animate-pulse rounded bg-hairline" />
      </div>
      <div className="grid gap-6 p-5 sm:grid-cols-[1.3fr_1fr] sm:p-6">
        <div>
          <div className="h-3 w-32 animate-pulse rounded bg-hairline" />
          <div className="mt-3 h-14 w-40 animate-pulse rounded bg-hairline" />
          <div className="mt-3 h-6 w-24 animate-pulse rounded-full bg-hairline" />
          <div className="mt-8 h-3 w-full animate-pulse rounded-full bg-hairline" />
        </div>
        <div className="space-y-5">
          <div className="h-24 w-full animate-pulse rounded-lg bg-hairline" />
          <div className="h-20 w-full animate-pulse rounded-lg bg-hairline" />
        </div>
      </div>
    </div>
  );
}
