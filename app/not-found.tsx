import Link from "next/link";

import { PageHeader } from "@/components/editorial/page-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <PageHeader
        kicker="404"
        title={<>This page isn&apos;t <em className="italic text-brand">in the book.</em></>}
        lede="The address may have changed. The three pages below are still here."
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/">Brief</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/assess">Assess</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/model">Methodology</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
