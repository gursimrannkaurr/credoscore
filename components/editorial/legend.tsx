export function Legend({ items }: { items: { label: string; color: string; shape?: "dot" | "bar" | "line" | "dash" }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2">
          {i.shape === "line" || i.shape === "dash" ? (
            <span aria-hidden className="inline-block h-0 w-5 border-t-2" style={{ borderColor: i.color, borderStyle: i.shape === "dash" ? "dashed" : "solid" }} />
          ) : (
            <span aria-hidden className={i.shape === "bar" ? "inline-block h-3 w-2 rounded-[2px]" : "inline-block size-2.5 rounded-full"} style={{ background: i.color }} />
          )}
          {i.label}
        </li>
      ))}
    </ul>
  );
}
