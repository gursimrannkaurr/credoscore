"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import type { PredictResponse } from "@/lib/types";

import { AssessForm } from "./assess-form";
import { ContributionWaterfall } from "./contribution-waterfall";
import { CutoffControl } from "./cutoff-control";
import { EmptySlip, ResultSkeleton } from "./result-states";
import { RiskVerdict } from "./risk-verdict";

export function AssessWorkbench({ deployedCutoff }: { deployedCutoff: number }) {
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [cutoff, setCutoff] = useState(deployedCutoff);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [run, setRun] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  function handleResult(res: PredictResponse) {
    setResult(res);
    setCutoff(res.cutoff);
    setStatus("done");
    setRun((n) => n + 1);
    if (window.matchMedia("(max-width: 1023px)").matches) ref.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] lg:gap-12">
      <AssessForm onStart={() => setStatus("loading")} onResult={handleResult} onError={() => setStatus("error")} />
      <div ref={ref} className="scroll-mt-24 space-y-6 lg:sticky lg:top-28 lg:self-start" aria-live="polite" aria-busy={status === "loading"}>
        <AnimatePresence mode="wait" initial={false}>
          {status === "loading" && !result ? (
            <ResultSkeleton key="skeleton" />
          ) : result ? (
            <motion.div key={run} className="space-y-6" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
              <RiskVerdict result={result} cutoff={cutoff} />
              <CutoffControl cutoff={cutoff} deployedCutoff={deployedCutoff} pd={result.probability_of_default} onChange={setCutoff} />
              <ContributionWaterfall contributions={result.contributions} pd={result.probability_of_default} />
            </motion.div>
          ) : (
            <EmptySlip key="empty" error={status === "error"} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
