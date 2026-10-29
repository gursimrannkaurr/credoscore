# Frontend dependencies

Every npm package in `package.json`, what it does, and where it's actually
used.

## Framework

| Package | Used for |
|---|---|
| `next` | App Router pages (`app/`), the dev-only API rewrite in `next.config.ts`, `next/font` for self-hosted fonts |
| `react`, `react-dom` | Required by Next.js |

## UI components — shadcn/ui pattern

These aren't a single "shadcn" package — shadcn/ui works by generating
plain component source into your own repo, so what's installed is the
handful of small Radix primitives each component wraps, plus two styling
helpers:

| Package | Used for |
|---|---|
| `@radix-ui/react-slot` | `components/ui/button.tsx`'s `asChild` prop |
| `@radix-ui/react-select` | `components/ui/select.tsx`, used throughout `assess-form.tsx` |
| `@radix-ui/react-slider` | `components/ui/slider.tsx`, the cutoff slider on `/assess` |
| `@radix-ui/react-tabs` | `components/ui/tabs.tsx`, the segment tables on `/portfolio` |
| `@radix-ui/react-separator` | `components/ui/separator.tsx`, `risk-verdict.tsx` |
| `@radix-ui/react-tooltip` | `components/ui/tooltip.tsx` |
| `@radix-ui/react-label` | `components/ui/label.tsx`, every form field |
| `class-variance-authority` | Defines the `variant`/`size` prop APIs for `button.tsx` and `badge.tsx` |
| `clsx` + `tailwind-merge` | Combined in `lib/utils.ts`'s `cn()` helper, used in every component that accepts a `className` override |
| `tw-animate-css` | Tailwind v4 animation utilities, imported once in `app/globals.css` |
| `lucide-react` | Icons — the chevron in `select.tsx`, the check mark in select items |

## Charts

| Package | Used for |
|---|---|
| `recharts` | Every chart in `components/charts/`: the ROC curve, calibration plot, contribution waterfall, risk band bars, approval-cutoff curve, and feature importance chart. Chosen because shadcn's own `chart` primitives are built on Recharts, so one theming approach (CSS custom properties read directly by chart `fill`/`stroke` props) covers the whole interface — no second color system to keep in sync. |

## Motion

| Package | Used for |
|---|---|
| `framer-motion` (imported as `motion`) | Component-level transitions: the metric tiles' entrance animation (`metric-tile.tsx`), the risk verdict card's reveal (`risk-verdict.tsx`), the assessment form's mount animation, and the landing page's hero and stat reveals |
| `gsap` + `gsap/ScrollTrigger` | The landing page's scroll-driven narrative only (`app/page.tsx`) — three story panels that fade and rise into view as the page scrolls, registered once via `gsap.context()` and cleaned up on unmount. Respects `prefers-reduced-motion` by skipping the ScrollTrigger registration entirely when the media query matches. |

The division of labor is deliberate: GSAP owns scroll position, since
`ScrollTrigger` is purpose-built for that and nothing else in this project
needs it; Framer Motion owns everything else, since its React-idiomatic
API (`initial`/`animate`/`whileInView` props) fits component-level
transitions with less code than driving the same thing through GSAP
timelines.

## Fonts

Loaded through `next/font/google` in `app/layout.tsx`, self-hosted by
Next.js's build step (no runtime request to Google Fonts):

- **Newsreader** — the serif used for all headings (`font-serif-display`
  utility class), chosen for the "printed advisory report" character the
  design leans on.
- **Inter** — the sans-serif used for interface text and body copy.
- **IBM Plex Mono** — used for every number that appears in a table, a
  metric tile, or a chart axis (`font-mono-tabular` utility class, which
  also sets `font-variant-numeric: tabular-nums` so digits align in
  columns).

## Styling

Tailwind CSS v4, configured through `app/globals.css`'s `@theme inline`
block rather than a `tailwind.config.js` — this is the v4 pattern. All
color tokens (`--paper`, `--ink`, `--accent`, the three risk-band colors)
are defined once as CSS custom properties, redefined under both a
`prefers-color-scheme: dark` media query and an explicit `data-theme="dark"`
attribute selector, and consumed identically by Tailwind utilities,
shadcn components, and Recharts' inline `fill`/`stroke` props (which read
`var(--accent)` etc. directly, since Recharts doesn't take Tailwind
classes).
