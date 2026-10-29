import { cn } from "@/lib/utils";

interface SectionProps {
  id?: string;
  index?: string;
  kicker: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  tone?: "paper" | "raised" | "forest";
  className?: string;
  children?: React.ReactNode;
}

export function Section({ id, index, kicker, title, lede, tone = "paper", className, children }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-28 border-t border-hairline",
        tone === "raised" && "bg-paper-raised",
        tone === "forest" && "border-transparent bg-forest text-paper",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
        <header className="grid gap-4 md:grid-cols-12 md:gap-10">
          <p className={cn("kicker md:col-span-3 md:pt-3", tone === "forest" && "!text-mint/70")}>
            {index ? <span className={cn("mr-2", tone === "forest" ? "text-mint" : "text-brand")}>§ {index}</span> : null}
            {kicker}
          </p>
          <div className="max-w-3xl md:col-span-9">
            <h2 className="display-md">{title}</h2>
            {lede ? <div className={cn("lede mt-5", tone === "forest" && "!text-paper/75")}>{lede}</div> : null}
          </div>
        </header>
        {children ? <div className="mt-10 md:mt-14">{children}</div> : null}
      </div>
    </section>
  );
}
