"use client";

import Link from "next/link";

import { PageHeader } from "@/components/editorial/page-header";
import { Button } from "@/components/ui/button";

export default function Error({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <>
      <PageHeader
        kicker="Something broke"
        title="This page failed to render."
        lede="That's on us, not on anything you entered. Try again, or head back to the brief."
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={() => retry()}>
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
