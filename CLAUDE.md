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
1. Scans `recipes/` recursively — subdirectories become the `category` field on each recipe.
2. Strips YAML frontmatter with `gray-matter`, then parses the remaining Cooklang content with `@cooklang/cooklang` (Rust/WASM).
3. Flattens the WASM parser output into typed interfaces (`ParsedRecipe`, `RecipeSection`, `StepItem`, etc.) that all components consume.
4. Exposes `getAllRecipes()`, `getRecipeBySlug()`, `getAllTags()`, `getRecipesByTag()`, and `toRecipeSummary()` for Astro pages.

**Search:** `src/pages/index.astro` embeds compact recipe summaries. `src/scripts/home-search.ts` builds a MiniSearch index in the browser for title, tag, category, and ingredient search. Tags use any-match filtering; selected ingredients must all be present. Filters are stored in URL query parameters.

**Image handling:** `scripts/sync-images.mjs` copies `recipes/images/` into `public/images/` for development and `dist/client/images/` for the standalone server. This runs automatically via the `dev` and `start` npm scripts.

**Slug generation:** `toSlug()` in `recipes.ts` strips accented characters (recipe names are often Italian) and converts to kebab-case. Slugs are derived from filenames, not frontmatter titles.

**Pages:**
- `src/pages/index.astro` — recipe grid with MiniSearch text search, tag and ingredient filters
- `src/pages/recipe/[slug].astro` — detail page: sticky ingredient sidebar + numbered steps; ingredient multiplier and checklist are client-side JS using `sessionStorage`
- `src/pages/tag/[tag].astro` — tag-filtered grid

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
