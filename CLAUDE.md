# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Sync images + start Astro dev server → http://localhost:4321
npm run build        # Production build (output in dist/)
npm run preview      # Serve the production build locally
```

Docker workflow (recipes are mounted at runtime, not bundled):
```bash
docker build -t cooklang-website .
docker run -p 8080:4321 -v ./recipes:/app/recipes:ro cooklang-website
docker compose up -d   # preferred — uses docker-compose.yml
```

## Architecture

**Framework:** Astro 5 in `output: 'server'` mode with the Node standalone adapter. Pages render on demand from the mounted `recipes/` directory. The parsed catalog is cached for the life of the production server process, so restart the container after changing recipes.

**Recipe pipeline:** `src/lib/recipes.ts` is the single source of truth for all recipe data. It:
1. Scans `recipes/` recursively, then splits files into recipes and guides: any file tagged `Guida` (case-insensitive) is a guide.
2. Strips YAML frontmatter with `gray-matter`, then parses the remaining Cooklang content with `@cooklang/cooklang` (Rust/WASM).
3. Flattens the WASM parser output into typed interfaces (`ParsedRecipe`, `RecipeSection`, `StepItem`, etc.) that all components consume.
4. Exposes recipe-only `getAllRecipes()`, `getRecipeBySlug()`, `getAllTags()`, `getRecipesByTag()`, `toRecipeSummary()`, plus `getGuideIndex()`, `getGuideBySlug()`, `getChapter()`, `getGuidesByTag()` for guides.

**Guides:** a root-level `Guida` file is a single-page guide (`/guide/<slug>`). `Guida` files in a folder form a collection titled by the folder name (`/guide/<folder-slug>`); each file is a chapter (`/guide/<folder-slug>/<chapter-slug>`) ordered by an optional `NN-` filename prefix, which is stripped from the slug. Non-`Guida` files in folders are ordinary recipes; recipe folders carry no meaning.

**Search:** `src/pages/index.astro` embeds compact recipe summaries. `src/scripts/home-search.ts` builds a MiniSearch index in the browser for title, tag, and ingredient search. Tags use any-match filtering; selected ingredients must all be present. Filters are stored in URL query parameters.

**Image handling:** `scripts/sync-images.mjs` copies `recipes/images/` into `public/images/` for development and `dist/client/images/` for the standalone server. This runs automatically via the `dev` and `start` npm scripts.

**Slug generation:** `toSlug()` in `recipes.ts` strips accented characters (recipe names are often Italian) and converts to kebab-case. Slugs are derived from filenames, not frontmatter titles.

**Pages:**
- `src/pages/index.astro` — recipe grid with MiniSearch text search, tag and ingredient filters
- `src/pages/recipe/[slug].astro` — detail page: sticky ingredient sidebar + numbered steps; ingredient multiplier and checklist are client-side JS using `sessionStorage`
- `src/pages/tag/[tag].astro` — tag-filtered recipe grid + "Guide correlate" strip
- `src/pages/guide/index.astro` — guide index (single guides and collections)
- `src/pages/guide/[slug].astro` — single-page guide or collection chapter list
- `src/pages/guide/[collection]/[chapter].astro` — chapter reading page with prev/next

**Recipe format** — `.cook` files with YAML frontmatter:
```
---
title: Focaccia
tags: [Aperitivo, Pane]
servings: 8
image: images/focaccia.jpeg
source: https://example.com
---
> Optional callout note.
== Section Name ==
Mix @farina{500%g} with #ciotola{} for ~{20%minuti}.
```
Supported frontmatter: `title`, `tags`/`tag` (string, comma-list, or array), `image`/`images`, `servings`, `source`.
