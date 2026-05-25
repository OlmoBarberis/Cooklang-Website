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
| Server | nginx:alpine (Docker) |
| Language | TypeScript |

## Project structure

```
.
├── recipes/                  # Cooklang recipe files (not generated)
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
├── Dockerfile                # Multi-stage: node builder → nginx runner
├── nginx.conf                # Static file serving with gzip + image caching
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

### Build and run locally

```bash
# Build the image
docker build -t recipes .

# Run on port 8080
docker run -p 8080:80 recipes
# → http://localhost:8080
```

### Build and push to a registry

```bash
# Tag for your registry
docker build -t your-registry.example.com/recipes:latest .

# Push
docker push your-registry.example.com/recipes:latest
```

### Docker Hub example

```bash
docker build -t yourusername/recipes:latest .
docker push yourusername/recipes:latest
```

### Run on a server

```bash
docker pull your-registry.example.com/recipes:latest
docker run -d --restart unless-stopped -p 80:80 your-registry.example.com/recipes:latest
```

Or with Docker Compose:

```yaml
services:
  recipes:
    image: your-registry.example.com/recipes:latest
    restart: unless-stopped
    ports:
      - "80:80"
```

The image is ~25 MB (nginx:alpine base). The build stage is discarded; only the pre-rendered static files are shipped in the final image.

### What happens inside the Dockerfile

```
Stage 1 — builder (node:20-alpine)
  npm ci
  npm run build   ← syncs images, runs astro build → dist/

Stage 2 — runner (nginx:alpine)
  COPY dist/ → /usr/share/nginx/html
  COPY nginx.conf → /etc/nginx/conf.d/default.conf
  EXPOSE 80
```

The nginx config serves static files with `try_files $uri $uri/ $uri.html =404`, enables gzip compression, and caches `/images/*` for 30 days.

## Adding or editing recipes

1. Add or edit `.cook` files in the `recipes/` folder
2. Put recipe images in `recipes/images/`
3. Reference local images in frontmatter as `image: images/filename.jpg`
4. Run `npm run dev` to preview, or rebuild the Docker image to deploy
