# Colony Asset System

Place real brand assets here. Served by Vite at the site root, e.g.
`public/assets/logos/colony-logo.svg` → `/assets/logos/colony-logo.svg`.

```
public/assets/
  logos/          App + AI Ant brand marks
    colony-logo.svg         Colony mark, dark badge (use on light surfaces)
    colony-logo-white.svg   Colony mark, white badge (use on dark surfaces)
    ai-ant-white.svg        AI Ant glyph, white (chat avatar, headers on dark)
    ai-ant-dark.svg         AI Ant glyph, dark (on light surfaces)
  connectors/     Third-party tool logos (slack.svg, gmail.svg, ...)
  agents/         Agent avatar art
  startups/       Startup / template brand art
  icons/          Design-system icon assets
```

## Replacing placeholders

The SVGs here are clean placeholders. To use real brand files:

1. Drop the real file in the matching folder, keeping the same filename
   (or add a new name and update `LOGO_SRC` in `src/App.tsx`).
2. PNG is fine — update the extension in `LOGO_SRC`.
3. The `<Logo>` / `<AntMark>` components in `src/App.tsx` reference these
   paths via the `LOGO_SRC` map — the single source of truth.

## Where each asset is used

- `colony-logo*` — sidebar header, mobile header, login page, landing nav.
- `ai-ant-white` — AI Ant page header, chat avatar, empty state, team
  proposal header, status badge, loading spinner.
- `connectors/*` — Connectors marketplace cards.
- `agents/*` — agent cards, swarm grid, team proposal.
