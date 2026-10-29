import { cn } from "@/lib/utils";

export function Figure({ number, title, caption, actions, className, bodyClassName, children }: {
  number: string; title: string; caption?: React.ReactNode; actions?: React.ReactNode; className?: string; bodyClassName?: string; children: React.ReactNode;
}) {
  return (
    <figure className={cn("overflow-hidden rounded-xl border border-hairline bg-paper-raised", className)}>
      <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
        <div>
          <p className="kicker">Fig. {number}</p>
          <p className="mt-1 font-serif text-xl leading-snug">{title}</p>
        </div>
        {actions}
      </div>
      <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
      {caption ? <figcaption className="border-t border-hairline px-5 py-3 text-sm leading-relaxed text-muted-foreground">{caption}</figcaption> : null}
    </figure>
  );
}
