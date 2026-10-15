# CLAUDE.md

Development guidelines for queen.raae.codes — an Astro site deployed on Netlify.

## Quick reference

```shell
npm run dev        # Start dev server at localhost:4321
npm run build      # Production build to dist/
npm run preview    # Preview production build
npm run prettier   # Format code
```

## Architecture

- **Framework**: Astro 5 with MDX, Tailwind CSS, Sharp image processing
- **Content**: Astro Content Collections with Zod schemas (`src/content/config.ts`)
- **Routing**: File-based routing in `src/pages/`; trailing slashes enforced
- **Deployment**: Netlify (config in `netlify.toml`)
- **OG images**: Generated with Satori + Sharp in `src/lib/og-image.ts`
- **RSS feeds**: Built with `@astrojs/rss` in `src/lib/feed.ts`

## Content collections

| Collection       | Type    | Location                      | Format   |
| ---------------- | ------- | ----------------------------- | -------- |
| `posts-queen`    | content | `src/content/posts-queen/`    | Markdown |
| `posts-olavea`   | content | `src/content/posts-olavea/`   | Markdown |
| `landing`        | content | `src/content/landing/`        | Markdown |
| `talks`          | content | `src/content/talks/`          | Markdown |
| `tags`           | data    | `src/content/tags/`           | YAML     |
| `testimonials`   | data    | `src/content/testimonials/`   | YAML     |

Blog post paths follow the pattern: `posts-queen/YYYY/MM/DD-slug/index.md`

## Key files

- `astro.config.mjs` — Astro config: site URL, integrations (MDX, Tailwind, Sitemap)
- `src/global.css` — Design tokens (`@theme`: colours, fonts, hard shadows) and the shared `.qr-*` classes; article extras (blockquotes, divider, notices)
- `tailwind.config.js` — Typography plugin config for article prose (`prose prose-brown`)
- `netlify.toml` — Build config and redirects (legacy email URLs, speaker shortcuts)
- `src/content/config.ts` — Zod schemas for all content collections
- `src/data/siteMetadata.js` — Site name, URL, description, social links
- `src/lib/posts.ts` — Post fetching, sorting, tag aggregation, related posts
- `src/lib/og-image.ts` — OG image generation (1200x628, authors told apart by emoji; post, author and quiz images)
- `src/lib/feed.ts` — RSS feed generation (separate feeds per author)
- `src/layouts/BaseLayout.astro` — Root HTML layout with meta tags, fonts, Fathom analytics and the site footer
- `src/components/SiteHeader.astro` / `SiteFooter.astro` — Header (Posts · Speaker · About + search, current page auto-detected) and footer (social links)
- `src/components/Newsletter.astro` — ConvertKit signup form with multiple form IDs

## Environment variables

- `PUBLIC_CK_API_KEY` — ConvertKit API key (see `.env.example`)

## Design system (Royal Brutalism v3)

Plum frames, orangered sparks, gold is jewellery. Square corners, 2px ink edges, heavy 4px rules, hard offset shadows only on things you can click.

- **Colours** (Tailwind tokens): `cream` page, `paper` raised surfaces, `ink` (= `plum-900`) text and edges, `plum-500` the frame (primary buttons, leads), `plum-400` faded meta text (only on cream/paper), `blush` (= `plum-200`) quiet boxes, `orangered` (top stripe, drop caps, quote marks, link underlines, focus outline, at most one CTA per page) with `ember` for orangered text, `gold` for hover highlights only, `gold-deep` for lilies and tag `#` marks. Gold and orangered never fill a card; text on them is ink.
- **Type**: Montserrat Black headlines (`font-heading`), JetBrains Mono labels/buttons (`font-label`, `.qr-label`, `.qr-meta`), Newsreader for reading (`font-body`).
- **Building blocks**: `.qr-btn` (+ `--primary`, `--cta`), `.qr-icon-btn`, `.qr-card` (static), `.qr-card-link` (clickable), `.qr-link`, `.qr-lily`, `<hr class="ornamental-hr">`. Components: `PageSection` (`width="narrow|wide"`), `PageSectionHeader`, `ContentList` (`numbered`), `Posts`, `CtaButton` (`variant`), `Newsletter`, `PageLinks`, `Badge`.
- **Authors** are told apart by emoji only: 👑 Queen Raae, 🏴‍☠️ Cap'n Ola, 🦀 Jean-Claw. No per-author colours.
- No `rounded-*`, gradients, blur or colours outside the palette.

## Coding conventions

- Astro components in `src/components/`, pages in `src/pages/`
- Tailwind utility classes for styling, using the design tokens and `.qr-*` classes from `src/global.css` (see Design system above)
- Prettier for formatting (config in `.prettierrc`); run `npm run prettier` before committing
- Always run `npm run lint` before pushing
- Two authors supported: "queen" (Queen Raae) and "olavea" (Cap'n Ola) with separate content collections and RSS feeds

## Analytics

- **Fathom Analytics** (site ID: `DIFBAEOT`), script in `src/layouts/BaseLayout.astro`
- **Public dashboard**: https://app.usefathom.com/share/difbaeot/queen.raae.codes
- Since the Astro migration (Feb 3, 2026), bot/scraper traffic inflates the numbers. Current strategy: filter by country in the Fathom dashboard for a more realistic view. If needed, the Fathom site firewall (Settings > Sites > Firewall) can block countries, IPs, or referrers from being recorded entirely.

## Gotchas

- The repo is named `queen.raae.codes-gatsby` for historical reasons — the project has been fully migrated to Astro
- Trailing slashes are enforced (`trailingSlash: 'always'` in astro config)
- The `content/` directory at the project root mirrors `src/content/` — the canonical source is `src/content/`
- OG image generation uses Satori which renders a JSX-like structure to SVG, then Sharp converts to PNG
- Newsletter form IDs are mapped by key in `src/components/Newsletter.astro` (e.g., QUEEN, BOOTCAMPS, REMINDERS)
- `dist/` is tracked in git even though `.gitignore` lists it — a local `npm run build` rewrites those files, so restore them (`git restore dist`) instead of committing build output
- Sitemap excludes `/search/`, `/tag/*`, and subscription management pages
