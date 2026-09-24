# Tasks

## 1. Catalog split in `src/lib/recipes.ts`

- [x] 1.1 Split `toSlug` so it accepts a bare name, and add a chapter-prefix parser (`^(\d+)[-_. ]+` → `{ order, name }`); verify with a quick `node --experimental-strip-types -e` (or a scratch script) that `01-Introduzione al Sous Vide` → order 1, slug `introduzione-al-sous-vide`, `10-x` → 10, and `Focaccia` → order null.
- [x] 1.2 Change `scanDir` to record each file's containing folder in place of `category`, parse once, and split entries by the case-insensitive "Guida" tag into a cached `{ recipes, guides }` catalog (keeping the production-only cache rule); verify `npm run build` passes and a scratch call to `getAllRecipes()` returns 134 − 5 = 129 entries, none tagged Guida.
- [x] 1.3 Build the guide structures from design D2: single guides from root-level files, collections from folders (title = folder name, slug = `toSlug(folder)`, chapters ordered per D3, cover = first chapter image, tags = union without "Guida"), plus a slug-collision warning across singles and collections and across chapters within a collection; verify a scratch call lists 1 single guide and 1 collection whose chapters are in order 01→04.
- [x] 1.4 Add `getGuideIndex()`, `getGuideBySlug()`, `getChapter()` (with prev/next/position/total) and `getGuidesByTag()` (deduplicated), and make `getAllTags()` recipe-only; verify with scratch calls that `getGuidesByTag('CBT')` returns 2 entries and `getAllTags()` no longer includes "Guida".
- [x] 1.5 Remove `category` from `ParsedRecipe`, `RecipeSummary`, the index search payload, the `home-search.ts` MiniSearch fields, `RecipeCard.astro`, and the label on `recipe/[slug].astro`; verify `npm run build` has no type errors and `grep -rn category src` returns nothing relevant.
- [x] 1.6 Update the recipe pipeline section of `CLAUDE.md` and `README.md` to document the `Guida` tag, single-page guides and folder collections with `NN-` chapter prefixes; verify the documented example paths match the real `recipes/` files.

## 2. Ricette page exclusion

- [x] 2.1 With the dev server running, verify the Ricette page count reads 129 ricette, no guide card is present, searching "sous vide" returns no guide, and "Guida" is not among the tag filter options; also verify `curl -o /dev/null -w '%{http_code}' localhost:4321/recipe/guida-alla-cottura-sous-vide` returns 404.

## 3. Shared guide UI components

- [x] 3.1 Create `src/components/GuideArticle.astro` per design D5: hero image, tag links (excluding Guida), source link, and a body with Literata section headings, unnumbered `<p>` paragraphs rendered through `StepText`, and `<aside class="callout">` notes, all within a ~65–70ch reading column that uses the existing design tokens in light and dark themes; verify by rendering it in the page from task 4.2.
- [x] 3.2 Create `src/components/GuideCard.astro` per design D6, following the `RecipeCard` pattern, with the meta line "Raccolta · N capitoli" or "Guida" and a link to `/guide/<slug>`; verify by rendering it in the page from task 4.1.
- [x] 3.3 Add the Ricette/Guide segmented nav to `BaseLayout.astro` (D7) with a `section` prop and `aria-current="page"`, shown next to the theme toggle and also on pages that show the back button; pass `section` from every page; verify on `/`, a recipe page and a tag page that "Ricette" is marked current, and that the header doesn't wrap or overflow at 360px width.

## 4. Guide pages

- [x] 4.1 Create `src/pages/guide/index.astro` with a `GuideCard` grid ordered by title and an empty-state message; verify `/guide` shows the sous vide collection ("4 capitoli") and the single-page guide, and that "Guide" is marked current in the nav.
- [x] 4.2 Create `src/pages/guide/[slug].astro` that renders a single guide through `GuideArticle`, or a collection's page (hero, title, chapter count, ordered chapter list with numbers), and responds with 404 otherwise; verify `/guide/guida-alla-cottura-sous-vide` shows unnumbered prose with no ingredient panel, servings control or "Start cooking" toggle, `/guide/guida-al-sous-vide` lists chapters 1–4 in file-prefix order, and `/guide/nope` returns 404.
- [x] 4.3 Create `src/pages/guide/[collection]/[chapter].astro` with a breadcrumb back to the collection, "Capitolo N di M", `GuideArticle`, and prev/next links labelled with chapter titles; verify chapter 1 has no previous link, chapter 4 has no next link, chapter 2 links to chapters 1 and 3, and an unknown chapter returns 404.
- [x] 4.5 Add `translateUnit` (D11) and rebuild timer `displayText` in `parseFile`; verify with a scratch call that the timer units across all files display only Italian units and `°C` (no `minutes`/`hours`/`days`/`celsius`), and that `/recipe/<a recipe with ~{24%ore}>` still shows "24 ore".
- [x] 4.6 Add pipe-table extraction for guide files plus the inline-token formatter for note and cell text (D10), and render tables and formatted notes in `GuideArticle`; verify with the scratchpad fixture that a separator line is dropped and a timer in a cell or note reads "10 minuti", and that no `~{` appears anywhere in the served HTML of any guide page.
- [x] 4.7 Back up the four sous vide guide files to the scratchpad, then rewrite their "Tabella" sections as pipe tables (same data, no wording changes to other text); verify `/guide/guida-alla-cottura-sous-vide` and chapter 02 render tables with every original value present, and that the page doesn't scroll sideways at 375px.
- [x] 4.8 Apply the D12 refinements (contained figure with `alt=""`, text-level measure, upright and warning callouts, end-of-collection block, 44px hit areas, meta text at least 0.72rem, "Raccolta · N capitoli" template string); verify with screenshots at 375px and 1440px in light and dark themes.
- [x] 4.4 Run the `impeccable` skill (critique/audit) on `/guide`, a collection page, a chapter page and the single-page guide at phone (≈375px) and desktop widths in both light and dark themes, checking them against `DESIGN.md` and `PRODUCT.md` (hierarchy, reading measure, callout contrast, tap targets, pager and breadcrumb clarity); fix every material finding and verify by re-running the review until nothing material remains.

## 5. Tag page related guides

- [x] 5.1 Update `src/pages/tag/[tag].astro`: keep the grid recipe-only, add a "Guide correlate" strip of `GuideCard`s above it (scroll-snap row on mobile) when `getGuidesByTag` returns entries, return 404 only when there are neither recipes nor guides for the tag (and always for "Guida"), and show a "no recipes" message when only guides match; verify `/tag/CBT` shows CBT recipes plus two related-guide cards, a tag with no guides shows no strip, and `/tag/Guida` returns 404.
- [x] 5.2 Run the `impeccable` skill on `/tag/CBT` and a recipe card (to confirm it has no category label) at phone and desktop widths in both themes; fix every material finding and verify by re-running the review.

## 6. Integration check

- [x] 6.1 Run `npm run build` followed by `npm run start` (production mode, with the catalog cached), then click through Ricette → Guide → collection → chapter 1 → next → … → chapter 4 → breadcrumb → Guide → single guide → tag link → tag page strip → back to a guide; verify every link resolves, no 404 or console error occurs, and the server log shows no slug-collision warnings for the current `recipes/`.
- [x] 6.2 Run a final `impeccable` audit pass over the complete flow from 6.1 for consistency across the two sections (card styles, header nav, spacing rhythm) in both themes; verify no material findings remain.
