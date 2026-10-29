export function PageHeader({ kicker, title, lede, meta }: { kicker: string; title: React.ReactNode; lede: React.ReactNode; meta?: string[] }) {
  return (
    <div className="relative overflow-hidden border-b border-hairline">
      <div aria-hidden className="grid-paper pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-12 sm:px-6 md:pb-16 md:pt-16">
        <p className="kicker">{kicker}</p>
        <h1 className="display-lg mt-5 max-w-4xl">{title}</h1>
        <div className="lede mt-5 max-w-2xl">{lede}</div>
        {meta?.length ? (
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            {meta.map((m) => (
              <li key={m} className="flex items-center gap-2"><span aria-hidden className="size-1.5 rounded-full bg-brand" />{m}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
