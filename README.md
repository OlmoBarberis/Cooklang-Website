# Recipe Website

> **Note:** This project was almost entirely generated using AI tools (Claude Code by Anthropic).

A sleek, mobile-first static website that renders a personal [Cooklang](https://cooklang.org) recipe collection. Built as a custom alternative to the default `cookcli` website generator, with a warm editorial design inspired by food publications.

## Features

- **Warm editorial design** — Playfair Display headings, cream/terracotta palette, large hero images
- **Recipe grid** — responsive 2→3→4 column layout with image cards
- **Tag filtering** — browse recipes by category (Antipasto, Dolce, CBT, etc.)
- **Ingredient multiplier** — scale quantities up or down with quick-select buttons (½×, 1×, 2×, 3×) or a custom value
- **Interactive ingredient checklist** — check off ingredients as you cook; state persists across page reloads via `sessionStorage`
- **Two-column recipe layout** — sticky ingredient sidebar alongside numbered steps on desktop, stacked on mobile
- **Inline token highlighting** — ingredients, cookware, and timers are visually distinguished within step text
- **Section headers** — `== Section Name ==` blocks render as named step groups
- **Blockquote notes** — `> text` lines render as styled callout blocks
- **Nested guides** — subfolders (e.g. `recipes/Guida al Sous Vide/`) are scanned recursively; the folder name becomes a category label
- **Static output** — fully pre-rendered HTML, no JavaScript required to read recipes

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Astro 5](https://astro.build) — static output |
| Cooklang parser | [`@cooklang/cooklang`](https://github.com/cooklang/cooklang-rs) v0.17 — Rust/WASM |
| Frontmatter parser | [`gray-matter`](https://github.com/jonschlinkert/gray-matter) |
| Fonts | Playfair Display + Lato via Google Fonts |
| Server | node:20-alpine — Astro preview (Docker) |
| Language | TypeScript |

## Project structure

```
.
├── recipes/                  # ⚠ NOT in git — mount at runtime (see Docker section)
│   ├── *.cook
│   ├── Guida al Sous Vide/   # Subfolder → becomes "category" on cards
│   │   └── *.cook
│   └── images/               # Local recipe images
├── src/
│   ├── lib/
│   │   └── recipes.ts        # Recipe parser — gray-matter + cooklang
│   ├── layouts/
│   │   └── BaseLayout.astro  # HTML shell, design tokens, global CSS
│   ├── pages/
│   │   ├── index.astro       # Homepage (recipe grid + tag nav)
│   │   ├── recipe/
│   │   │   └── [slug].astro  # Recipe detail page
│   │   └── tag/
│   │       └── [tag].astro   # Tag-filtered grid
│   └── components/
│       ├── RecipeCard.astro  # Card used in grids
│       └── StepText.astro    # Renders a step with inline token highlighting
├── scripts/
│   └── sync-images.mjs       # Copies recipes/images/ → public/images/ at build time
├── public/
│   └── images/               # Populated by sync-images.mjs (gitignored)
├── Dockerfile                # node:20-alpine — installs deps, builds site at startup
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

## Local development

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start dev server (syncs images, then starts Astro)
npm run dev
# → http://localhost:4321
```

The `sync-images.mjs` script copies `recipes/images/` into `public/images/` so local image references resolve correctly. It runs automatically before `dev` and `build`.

To preview the production build locally:

```bash
npm run build
npm run preview
```

## Docker

The `recipes/` folder is **not bundled into the image**. Instead it is mounted at runtime, and the site is built from it when the container starts. This means you can update your recipes without rebuilding the image — just restart the container.

### How it works

```
docker build   → installs Node deps, copies source code (no recipes)
docker run     → mounts ./recipes, runs `npm run build`, serves on port 4321
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

# View logs (includes the build output on first start)
docker compose logs -f

# Apply recipe changes
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
4. Restart the container to rebuild the site: `docker compose restart`

For live preview during editing, use the local dev server instead (see [Local development](#local-development)).
