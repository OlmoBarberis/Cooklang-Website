# Proposal

## Why

The `recipes/` folder now holds guides as well as recipes: a single-page sous vide guide (`Guida-alla-cottura-sous-vide.cook`) and a four-chapter guide in `recipes/Guida al Sous Vide/`. The site renders them as recipes. They appear as cards on the Ricette page, open in the cooking layout with an empty ingredient sidebar and numbered paragraphs, and the chapters are sorted by title, which scrambles their order. Guides need their own section, separate from recipes.

## What Changes

- A file tagged `Guida` is a **guide**, not a recipe. Guides are hidden from the Ricette page, its search index and its tag filter, and from `/recipe/<slug>`.
- New **Guide page** at `/guide` lists every guide. It shows two kinds of entry:
  - a **single-page guide**: a `Guida` file directly in `recipes/`;
  - a **guide collection**: a folder whose `Guida` files are its chapters. The folder name is the collection title.
- New **collection page** at `/guide/<collection-slug>` lists the chapters in order.
- New **guide reading page** for single-page guides (`/guide/<slug>`) and chapters (`/guide/<collection-slug>/<chapter-slug>`). It uses a reading layout with section headings, paragraphs and callouts, and has no ingredient panel, scaling, cooking-mode toggle or step numbers. Chapters get a breadcrumb back to the collection and previous/next chapter links.
- Chapter order comes from a numeric filename prefix (`01-`, `02-`, …). The prefix is removed from the chapter's slug, so reordering chapters doesn't change their URLs.
- Guides can contain simple **pipe tables** (`| a | b |` lines). They are rendered as real tables, and the sous vide guides' time tables are rewritten to use them.
- Timer units written in English (`minutes`, `hours`, `days`, …) are **shown in Italian** on every page, recipes included, without changing the files.
- Tag pages (`/tag/<tag>`) keep listing recipes only and add a **"Guide correlate"** strip that links to the guides sharing that tag.
- The site header gets navigation between **Ricette** and **Guide**.
- A recipe file in a subfolder still appears on the Ricette page, but the folder no longer shows as a "category" label on recipe cards and the recipe page. **BREAKING** (visual only): the category label is removed.

## Capabilities

### New Capabilities
- `guides`: how guides are classified by the `Guida` tag, how they are kept out of the recipe listings, how single-page guides and folder collections are structured, how chapters are ordered and given slugs, the Guide index, collection and reading pages, and the related-guides strip on tag pages.

### Modified Capabilities
<!-- None: the existing cooking-mode and ingredient-scaling requirements apply to recipe detail pages, which keep that behavior; guides simply never use that page. -->

## Impact

- `src/lib/recipes.ts`: splits the scan into recipes and guides, parses chapter prefixes, builds collections, and adds guide query functions. The existing recipe functions return recipes only.
- `src/pages/index.astro`, `src/scripts/home-search.ts`: the data they get no longer includes guides. No change to how search works.
- `src/pages/tag/[tag].astro`: adds the related-guides strip.
- `src/pages/recipe/[slug].astro`, `src/components/RecipeCard.astro`: remove the category label.
- New `src/pages/guide/index.astro`, `src/pages/guide/[slug].astro`, `src/pages/guide/[collection]/[chapter].astro`, plus shared guide components.
- `src/layouts/BaseLayout.astro`: Ricette/Guide navigation.
- `CLAUDE.md` / `README.md`: document the `Guida` tag and the folder-collection convention.
- No new dependencies. Recipe files and the Docker/runtime setup are unchanged.
