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

- **Framework**: Astro 5 with MDX, Tailwind CSS v4, Sharp image processing
- **Design**: "Organic Brutalist" logbook (Oct 2026). Tokens in `src/global.css` (`@theme`), component classes in `src/styles/log.css`, Astro components in `src/components/log/`, every page wraps `src/layouts/LogLayout.astro`
- **Content**: Astro Content Collections with Zod schemas (`src/content/config.ts`)
- **Routing**: File-based routing in `src/pages/`; trailing slashes enforced
- **Deployment**: Netlify (config in `netlify.toml`)
- **OG images**: Generated with Satori + Sharp in `src/lib/og-image.ts` — a cream page in a pale rust frame with a photo column on the right: Queen's photo full height, guests a square photo with "Guest post" and their name. Entries `/og/<slug>.png`, authors `/og/author/`, tags `/og/tag/`, other pages `/og/page/` (list in `src/data/og-pages.ts`); bump `DESIGN_VERSION` when the card changes
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
- `src/styles/log.css` — Design system classes (bars, title blocks, rows, cells, dividers, log-prose)
- `src/data/now.ts`, `src/data/treasures.ts`, `src/data/wall.ts` — Home page content
- `src/lib/podcast.ts` — Slow & Steady latest episode, fetched at build time (fails soft)
- `netlify.toml` — Build config and redirects (legacy email URLs, speaker shortcuts)
- `src/content/config.ts` — Zod schemas for all content collections
- `src/data/siteMetadata.js` — Site name, URL, description, social links
- `src/lib/posts.ts` — Post fetching, sorting, tag aggregation, related posts
- `src/lib/og-image.ts` — OG image generation (1200x628, per-author styling)
- `src/lib/feed.ts` — RSS feed generation (separate feeds per author)
- `src/layouts/BaseLayout.astro` — Root HTML layout with meta tags and Fathom analytics
- `src/components/log/NewsletterBlock.astro` — ConvertKit signup (plum block), defaults to the QUEEN form

## Environment variables

- `PUBLIC_CK_API_KEY` — ConvertKit API key (see `.env.example`)

## Coding conventions

- Astro components in `src/components/`, pages in `src/pages/`
- Tailwind utility classes plus the design classes in `src/styles/log.css`; colours are `cream`, `ink` (plum), `acid` (amber), `panel`, `deep`
- Design rules: 2px plum rules, no border-radius, no shadows, no gradients, no orange
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
- Entry frontmatter can set `type` (Book, Link, Podcast, Life, Press), `standfirst`, `draft`, `lang` (`en` default, `no` shows "På norsk"), `importedFrom`, `originalUrl`, `creator`, `url`, `outlet`, `reread`, `lillylabs`. Press entries (articles about Queen, podcast guest spots) sit on their original date with `url` and `outlet`; a body only if Queen writes a note. `/press/` lists them. `type` is only for notes on a thing (plus Life); plain posts have none and show no label. Link entries get "Notes on:" in front of the title (`post.title`, used for meta, cards, feeds, search; shown highlighted on the site via `EntryTitle.astro`) and no "Link" type label (`post.typeLabel`), a YouTube `url` adds " (YouTube)", and a non-Press `url` shows as a "Watch on YouTube" / "View on <domain>" button under the title
- A post image named `framed-*` is a 1080 square social graphic (984×912 stage on a cream frame with a vanity link); `log.css` crops the page view to the stage, saving the image gets the whole thing. Vanity links for social posts live in `netlify.toml`. Wrap an image and the paragraphs it should sit beside in `<div class="float-group">` (image first) to float it right on wide screens; phones stack it after the first paragraph
- `draft: true` entries show on deploy previews only (`CONTEXT !== "production"`)
- `retired/` holds the old landing pages (bootcamps, emergency, Bridgerton…) and their components, kept but not built or linted; their content stays in `src/content/landing/`
- Sitemap excludes `/tag/*` and subscription management pages
- Search is an overlay (`src/components/log/SearchOverlay.astro`) over a Fuse index at `/search-index.json`; there is no search page, `/?q=term` opens the overlay and `/search/` redirects there
