export function CostAsymmetry() {
  return (
    <div>
      <div className="grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-2">
        <div className="bg-paper-raised p-6">
          <p className="kicker text-band-high">False approval</p>
          <div aria-hidden className="mt-4 flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="size-10 rounded-md bg-band-high animate-in fade-in zoom-in-50 motion-reduce:animate-none"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
          <p className="num mt-3 text-sm text-muted-foreground">5 units</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Approve an applicant whose recorded outcome is default. In this simulation, that error adds 5 cost units.
          </p>
        </div>
        <div className="bg-paper-raised p-6">
          <p className="kicker text-band-medium">False decline</p>
          <div aria-hidden className="mt-4 flex gap-1.5">
            <span className="size-10 rounded-md bg-band-medium animate-in fade-in zoom-in-50 motion-reduce:animate-none" />
          </div>
          <p className="num mt-3 text-sm text-muted-foreground">1 unit</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Decline an applicant whose recorded outcome is repayment. In this simulation, that error adds 1 cost unit.
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        These unequal error costs make the choice of cutoff important. The app starts at 25%, while the portfolio explorer shows how approval counts, recorded defaults and total error cost change at other thresholds.
      </p>
    </div>
  );
}
