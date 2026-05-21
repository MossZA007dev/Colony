# Colony Design System

Dark premium AI operating system. Calm, futuristic, less noisy than typical
SaaS, never an n8n-style node canvas by default. The brand voice is set on the
landing page and carries through every screen.

## Source of truth

| Concern | Where |
|---|---|
| Color + typography + shape tokens | `src/index.css` (`:root`) |
| Tailwind aliases (`font-heading`, `text-heading-xl`, color names) | `tailwind.config.ts` |
| Brand asset paths | `LOGO_SRC` in `src/App.tsx` |
| Asset files | `public/assets/` (see its README) |

## Typography

- **Heading** — Syne 700/800. Tailwind: `font-heading` (alias of `font-syne`),
  sizes `text-heading-xl`, `text-heading-lg`, `text-section`. CSS: `--font-heading`,
  helper classes `.page-title`, `.section-title`.
- **Body** — DM Sans. Tailwind: `font-body` / `font-dmsans`. CSS `--font-body`.
- Rule: page titles and major section headers use the heading font; body text
  stays DM Sans and readable. Do not enlarge body text to match headings.

## Color tokens (`rgb(var(--color-*) / <alpha>)`)

`background, surface, surface2, accent, secondary, success, warning, danger,
muted, subtle, ink`. Dark is default; `[data-theme="light"]` / `.theme-light`
opt-in. Glass surfaces: `bg-white/[0.03–0.08]`, borders `border-white/[0.07–0.14]`.

## Shape & elevation

`--radius-card: 20px`, `--radius-control: 12px`, `--radius-pill: 9999px`,
`--shadow-card`, `--shadow-pop`.

## Component conventions

- **Cards** — rounded-[20px], glass bg, subtle white border, hover lift.
- **Primary button** — `bg-ink`/violet, white text, rounded-control, hover -translate-y-0.5.
- **Pills/badges** — rounded-full, tinted bg + matching border (status tones:
  emerald=running, amber=waiting/review, blue=planning, violet=idle).
- **Inputs** — transparent bg, `placeholder:text-white/30`, no harsh borders.
- **Modals/sheets** — backdrop blur, slide/scale in, `--shadow-pop`.

## Icons & logos

- Icons: Lucide React. `glyph` object retained only for canvas agent data.
- Logos: `<ColonyLogo>` and `<AntMark>` components in `src/App.tsx`, driven by
  `LOGO_SRC`. Never use the ant emoji for brand surfaces — use `<AntMark>`.

## Asset folders (drop real brand files here, keep filenames)

```
public/assets/logos/       colony-logo, colony-logo-white, ai-ant-white, ai-ant-dark
public/assets/connectors/  third-party tool logos
public/assets/agents/      agent avatars
public/assets/startups/    startup / template art
public/assets/icons/       design-system icon assets
```
