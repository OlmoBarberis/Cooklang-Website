# Design

## Context

- `src/lib/recipes.ts` scans `recipes/` recursively and returns one flat, title-sorted `ParsedRecipe[]`. Every file in a subfolder gets `category = <immediate folder name>`. In production, the result is cached for the life of the process.
- Every consumer reads from that list: `index.astro` builds the MiniSearch payload and the filters from `getAllRecipes()` and `getAllTags()`, `recipe/[slug].astro` uses `getRecipeBySlug()`, and `tag/[tag].astro` uses `getRecipesByTag()`.
- Guide files parse without errors as Cooklang. Each prose paragraph becomes a `step`, `>` lines become `note` items, `== X ==` lines become sections, and `~{35%minutes}` becomes a timer token. They contain no `@ingredient` tokens today.
- The UI follows `DESIGN.md` and `PRODUCT.md`: an editorial cookbook in a mobile-first layout, Literata headings over DM Sans, paper/tomato tokens, and light and dark themes. The project has an `.impeccable/` setup, which will be used to verify the new pages.
- The project has no automated test suite. Verification is `npm run build`, manual checks against the dev server, and an Impeccable review of the UI.

## Goals / Non-Goals

**Goals:**
- Classify each file once, in the library, so pages never repeat the "is this a guide?" check.
- Keep recipe query functions returning recipes only, so the existing pages and search stop showing guides with almost no edits.
- Make the guide pages match the existing design system rather than start a new visual language.

**Non-Goals:**
- Search or filters on `/guide`.
- Collection-level metadata files (for a description or a custom cover). The folder name is the title.
- Nested collections (collections inside collections), and recipe folders used as groupings.
- Changes to the recipe detail page other than removing the category label.

## Decisions

### D1. One scan, split into two catalogs
`scanDir` still walks the tree once. It now reports, for each file, its path relative to `recipes/` and the folder that directly contains it, not `category`. After parsing, entries are split by tag into `recipes: ParsedRecipe[]` and `guides: GuideEntry[]`. Both lists are cached together in one catalog object, using the existing production-only cache rule.

- `getAllRecipes()`, `getRecipeBySlug()`, `getAllTags()` and `getRecipesByTag()` keep their signatures and read only the recipe list. With that, the Ricette page, search payload, tag filter and `/recipe/<slug>` stop showing guides without any changes to those pages.
- New functions: `getGuideIndex()` returns entries of type `single` or `collection`, sorted by title. `getGuideBySlug(slug)` resolves a `/guide/<slug>` URL to a single guide or a collection. `getChapter(collectionSlug, chapterSlug)` returns the chapter with its `prev`, `next`, `position` and `total`. `getGuidesByTag(tag)` returns deduplicated index entries.

*Alternative considered:* adding an `isGuide` flag to `ParsedRecipe` and filtering in each page. Rejected because every current and future caller would need to remember the filter, and forgetting it is exactly how guides ended up on the Ricette page.

### D2. Guide data model
```
GuideDoc      = { slug, title, tags (without "Guida"), image?, source?, sections, ingredients, cookwares, timers, inlineQuantities }
SingleGuide   = { kind: 'single', slug, doc: GuideDoc }
Collection    = { kind: 'collection', slug, title (folder name), image? (first chapter image), tags (union), chapters: Chapter[] }
Chapter       = GuideDoc & { order: number | null }
```
A guide is parsed the same way as a recipe, using `parseFile` again, and then narrowed to `GuideDoc`. The token arrays are kept so the body can be rendered with the existing `StepText`. Guides don't need `sidebarIngredients`, servings or scaling data.

### D3. Chapter prefix parsing
The regex `^(\d+)[-_. ]+` is applied to the filename without its extension. The number is used as `order`, and the rest of the filename goes through `toSlug`. Sorting is by `order` ascending, with `null` last, then by title using `'it'` locale comparison. `toSlug` is split so it can take a bare name, not only a path.

### D4. Routing
- `src/pages/guide/index.astro` → `/guide`
- `src/pages/guide/[slug].astro` → a single guide, or a collection's chapter list. It switches on `kind` because both share one namespace, and responds with 404 when nothing matches.
- `src/pages/guide/[collection]/[chapter].astro` → a chapter page.

*Alternative considered:* separate prefixes such as `/guida/` and `/raccolta/`. Rejected because a single `/guide` namespace is what the user asked for, and collisions are rare, logged, and resolved by one clear rule.

### D5. Reading layout as a shared component
A `GuideArticle.astro` component renders the hero image, the tag links, the source link and the body. The body shows section headings (Literata, reusing the recipe `section-title` style), steps as `<p>` built from `StepText` without the `step-num` column, and notes as `<aside class="callout">`. Recipe-specific token styling, such as the ingredient color, is toned down so it reads as body text. Scaling is never active on guide pages, so the `data-base` attributes that `StepText` writes do nothing there. The text column is kept to a reading measure of about 65–70ch.

The chapter page wraps `GuideArticle` with a breadcrumb at the top ("← Guida al Sous Vide · Capitolo 2 di 4") and a prev/next pager at the bottom. The collection page reuses the hero style and shows an ordered list of chapters (number, title, optional image thumbnail).

*Alternative considered:* reusing `recipe/[slug].astro` with flags that hide parts of it. Rejected because that page carries a lot of scaling, checklist and wake-lock script that would need guards everywhere.

### D6. Guide cards
A `GuideCard.astro` component follows the `RecipeCard` visual pattern (image, meta line, title) so the two sections feel related. Its meta line shows "Raccolta · N capitoli" or "Guida", and its link goes to `/guide/<slug>`. The same card is used in the `/guide` grid and in the tag page's "Guide correlate" strip. The strip is a horizontal row with scroll-snap on mobile, and it sits above the recipe grid.

### D7. Section navigation in the header
`BaseLayout` gets a `section?: 'ricette' | 'guide'` prop and renders a compact two-link segmented nav (Ricette / Guide) with `aria-current="page"` on the active link. It stays in the header next to the theme toggle, and it is still shown on pages that display the back button. Each page passes its section.

### D8. Removing `category`
`category` is removed from `ParsedRecipe`, `RecipeSummary`, the search payload, the MiniSearch fields, `RecipeCard` and the recipe page. Keeping a field that nothing shows would only invite it to come back.

### D9. UI verification with Impeccable
After implementation, the new and changed UI (Guide index, collection page, chapter page, single-page guide, tag page strip, header nav, and a recipe card without category) is reviewed with the `impeccable` skill. The critique/audit pass checks the pages against `DESIGN.md` and `PRODUCT.md` at phone and desktop widths, in both light and dark themes. Material findings are fixed before the change is considered done.

### D10. Tables in guide files
Cooklang has no table syntax, and the parser joins a paragraph's lines into one step. So tables are pulled out of the text **before** parsing, and only for files whose frontmatter tags include "Guida". Recipes are unaffected. Each paragraph made up entirely of lines starting with `|` is replaced by a placeholder line `[[table:N]]`. Its rows are parsed into `string[][]`, dropping markdown separator lines. The placeholder comes out of the parser as a one-text-item step. `GuideDoc` carries `tables: string[][][]`, and `GuideArticle` renders a step whose only text is `[[table:N]]` as a `<table>` inside a horizontally scrolling wrapper, using tabular numbers and the header row as `<th scope="col">`.

Cell text and note text go through one small inline-token formatter. It turns `~name{q%unit}` / `~{q%unit}` into `q unit`, `@name{q%unit}` into `name (q unit)` and `#name{}` into `name`, using the same unit translation as D11. The Cooklang parser does not tokenize notes, which is why raw `~{…}` used to show up in callouts.

*Alternative considered:* a fenced block syntax, or loading tables from separate CSV files. Rejected because pipe rows are the familiar markdown convention and keep each guide in a single file.

### D11. Italian time units at display time
Timer `displayText` is rebuilt in `parseFile` through `translateUnit(unit, quantity)`, a small map from English units to Italian singular and plural forms plus `celsius → °C`. Because this happens in the parser, it applies to recipes and guides alike, and the inline-token formatter (D10) uses the same map. The files themselves are not changed.

### D12. Reading-page refinements from the Impeccable critique
- **Image:** the chapter or guide image is shown as a contained `<figure>` inside the reading column, not a cropped full-width hero. It keeps its natural aspect ratio, is never upscaled beyond its natural width, and uses `alt=""`, since the title already names it. The collection page shows its cover the same way, as a contained figure below the header.
- **Measure:** the `ch`-based max width is applied on the text elements themselves, so it resolves at body size: about 65–70 characters per line.
- **Callouts:** upright DM Sans, per DESIGN.md's Reading Rule. A note starting with "Attenzione" gets a tomato left rule and a label.
- **End of collection:** after the pager, the last chapter shows a closing block ("Hai finito la guida") that links to the collection and its tag pages.
- **Touch targets:** the section-nav links, back link, breadcrumb link, tags and source link get at least 44px of hit area, using padding or min-height rather than larger visual size. Card meta text is at least 0.72rem.
- **Collection label:** the "Raccolta · N capitoli" label on the collection page is built with a template string.

## Risks / Trade-offs

- [A guide file loses its "Guida" tag by mistake and shows up as a recipe with no ingredients] → This is expected under the rule the user chose, and easy to spot on the Ricette page. The fix is the tag.
- [Two entries share the same `/guide/<slug>`, e.g. a root guide named like a folder] → Log a warning, serve the first by title order, and document the convention.
- [Chapter URLs change if a file is renamed (not renumbered)] → Accepted. Renumbering, the common case, keeps URLs stable because the prefix is removed.
- [StepText ingredient styling looks odd in prose if a guide uses `@` tokens later] → Guide CSS scopes the token styles to read as ordinary emphasized text.
- [The pipe-table syntax is not standard Cooklang, so other Cooklang tools will show the rows as plain text] → Accepted. It degrades to readable text, and it only applies to guides.
- [Removing `category` changes how recipes in subfolders look today] → No recipe currently lives in a subfolder, so nothing visible is lost.

## Migration Plan

No data migration. Deploying means rebuilding the image and restarting the container, since the catalog is cached per process. To roll back, redeploy the previous image. The recipe files are unchanged, and the `Guida` tag is harmless to the old build (guides would just show up as recipes again).
