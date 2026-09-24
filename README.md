# Recipe Website

> **Note:** This project was almost entirely generated using AI tools (Claude Code by Anthropic).

A mobile-first website that renders a personal [Cooklang](https://cooklang.org) recipe collection with Astro's Node server adapter.

## Features

- **Responsive design** — Inter typography, light and dark themes, and large recipe images
- **Recipe grid** — responsive 2→3→4→5 column layout with image cards
- **Search and filters** — MiniSearch searches recipe titles, tags, and ingredients with prefix and typo matching. Select multiple tags (any match) and ingredients (all must match), and share the result URL.
- **Ingredient multiplier** — scale quantities up or down with quick-select buttons (½×, 1×, 2×, 3×) or a custom value
- **Interactive ingredient checklist** — check off ingredients as you cook; state persists across page reloads via `sessionStorage`
- **Two-column recipe layout** — sticky ingredient sidebar alongside numbered steps on desktop, stacked on mobile
- **Inline token highlighting** — ingredients, cookware, and timers are visually distinguished within step text
- **Section headers** — `== Section Name ==` blocks render as named step groups
- **Blockquote notes** — `> text` lines render as styled callout blocks
- **Guides section** — files tagged `Guida` are published at `/guide` instead of the recipe grid, as single-page guides or ordered multi-chapter collections (one folder per collection)
- **Server-rendered pages** — recipes are readable without JavaScript; interactive search and filters run in the browser

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Astro 5](https://astro.build) — Node server output |
| Search | [MiniSearch](https://github.com/lucaong/minisearch) |
| Cooklang parser | [`@cooklang/cooklang`](https://github.com/cooklang/cooklang-rs) v0.17 — Rust/WASM |
| Frontmatter parser | [`gray-matter`](https://github.com/jonschlinkert/gray-matter) |
| Fonts | Inter via Google Fonts |
| Server | node:20-alpine — Astro standalone server (Docker) |
| Language | TypeScript |

## Project structure

```
.
├── recipes/                  # ⚠ NOT in git — mount at runtime (see Docker section)
│   ├── *.cook                # Recipes, and single-page guides (tag: Guida)
│   ├── Guida al Sous Vide/   # Guide collection: one chapter per Guida-tagged file
│   │   └── 01-*.cook         # NN- prefix sets chapter order
│   └── images/               # Local recipe images
├── src/
│   ├── lib/
│   │   ├── recipes.ts        # Recipe parser and cached catalog
│   │   └── search-normalize.ts # Accent and case normalization
│   ├── layouts/
│   │   └── BaseLayout.astro  # HTML shell, design tokens, global CSS
│   ├── pages/
│   │   ├── index.astro       # Homepage (recipe grid + search filters)
│   │   ├── recipe/
│   │   │   └── [slug].astro  # Recipe detail page
│   │   ├── tag/
│   │   │   └── [tag].astro   # Tag-filtered grid + related guides
│   │   └── guide/
│   │       ├── index.astro   # Guide index
│   │       ├── [slug].astro  # Single-page guide or collection chapter list
│   │       └── [collection]/
│   │           └── [chapter].astro # Collection chapter
│   ├── components/
│       ├── RecipeCard.astro  # Card used in grids
│       ├── GuideCard.astro   # Card for guides and collections
│       ├── GuideArticle.astro # Reading layout for guides and chapters
│       └── StepText.astro    # Renders a step with inline token highlighting
│   └── scripts/
│       └── home-search.ts    # MiniSearch and URL-backed filters
├── scripts/
│   └── sync-images.mjs       # Copies mounted images before dev/start
├── public/
│   └── images/               # Populated by sync-images.mjs (gitignored)
├── Dockerfile                # node:20-alpine — builds server image
├── docker-compose.yml        # Example Compose file
├── .dockerignore
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

## Recipe format

Recipes are standard Cooklang `.cook` files with YAML frontmatter:

```
---
title: Focaccia
tags:
  - Aperitivo
servings: 8
image: images/focaccia.jpeg   # local path or https:// URL
source: https://example.com   # optional
---

> Optional description shown as a callout block.

== Section Name ==

Mix @farina{500%g} and @acqua{420%g} in a #ciotola{}.
Rest for ~{20%minuti}.
```

Supported frontmatter fields: `title`, `tags` / `tag` (string, comma-separated string, or array), `image` / `images`, `servings`, `source`.

### Guides

A file whose tags include `Guida` (any capitalization) is a guide, not a recipe. Guides never appear on the recipe page, its search, or its filters; they live under `/guide`.

- **Single-page guide** — a `Guida` file directly in `recipes/`, e.g. `recipes/Guida-alla-cottura-sous-vide.cook` → `/guide/guida-alla-cottura-sous-vide`.
- **Guide collection** — a folder of `Guida` files, one chapter per file. The folder name is the collection title, e.g. `recipes/Guida al Sous Vide/` → `/guide/guida-al-sous-vide`.
- **Chapter order** — prefix chapter filenames with a number (`01-`, `02-`, …). The prefix sets the order and is stripped from the URL, so `01-Introduzione al Sous Vide.cook` → `/guide/guida-al-sous-vide/introduzione-al-sous-vide`. Unprefixed chapters come last, by title.

Guide paragraphs render as prose (no step numbers, no ingredient panel). Tag pages list guides that share the tag under "Guide correlate". Files without the `Guida` tag are recipes wherever they live; recipe folders are not used for grouping.

## Local development

**Prerequisites:** Node.js 20+

```bash
# Install dependencies
npm install

# Start dev server (syncs images, then starts Astro)
npm run dev
# → http://localhost:4321
```

The `sync-images.mjs` script copies `recipes/images/` into `public/images/` for development and `dist/client/images/` for the standalone server. It runs automatically before `dev` and `start`.

The homepage builds a compact MiniSearch index in the browser from recipe titles, tags, and ingredient names. Text search requires every query word; selected tags match any tag, while selected ingredients must all be present. Search state is stored in the URL. The recipe catalog is cached for the life of the production server process, so restart the server after changing `.cook` files.

To preview the production build locally:

```bash
npm run build
npm run preview
```

## Docker

The `recipes/` folder is **not bundled into the image**. It is mounted at runtime. Astro serves pages on demand from the mounted collection; restart the container after changing recipes to refresh the production catalog. Rebuilding the image is only needed for application code changes.

### How it works

```
docker build   → installs Node deps and builds the Astro server (no recipes)
docker run     → mounts ./recipes, syncs images, serves on port 4321
```

### Running with Docker Compose (recommended)

A `docker-compose.yml` is included in the repo. Copy it to the machine where you want to run the site and adjust the paths if needed:

```yaml
services:
  recipes:
    image: ghcr.io/olmobarberis/cooklang-website:latest
    restart: unless-stopped
    ports:
      - "80:4321"
    volumes:
      - ./recipes:/app/recipes:ro
```

Place your `recipes/` folder next to `docker-compose.yml`, then:

```bash
# Pull the latest image and start
docker compose pull
docker compose up -d

# View server logs
docker compose logs -f

# Refresh the parsed catalog after recipe changes
docker compose restart
```

### Running with plain Docker

```bash
docker run -d \
  --restart unless-stopped \
  -p 80:4321 \
  -v /path/to/your/recipes:/app/recipes:ro \
  ghcr.io/olmobarberis/cooklang-website:latest
```

### Building the image locally

```bash
# Build
docker build -t cooklang-website .

# Run with a local recipes folder
docker run -p 8080:4321 -v ./recipes:/app/recipes:ro cooklang-website
# → http://localhost:8080
```

### Building and pushing to a registry

```bash
docker build -t your-registry.example.com/cooklang-website:latest .
docker push your-registry.example.com/cooklang-website:latest
```

A GitHub Actions workflow (`.github/workflows/docker-publish.yml`) handles this automatically when triggered manually from the Actions tab. It publishes to `ghcr.io/olmobarberis/cooklang-website` with tags in the `YYYY.MM.XX` format (e.g. `2026.05.00`) and also updates `:latest`.

## Adding or editing recipes

1. Add or edit `.cook` files in your `recipes/` folder
2. Put recipe images in `recipes/images/`
3. Reference local images in frontmatter as `image: images/filename.jpg`
4. Restart the container to refresh the catalog: `docker compose restart`

For live preview during editing, use the local dev server instead (see [Local development](#local-development)).
