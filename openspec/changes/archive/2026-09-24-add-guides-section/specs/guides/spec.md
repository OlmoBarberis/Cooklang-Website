# Spec Delta

## Purpose

Separates guides and tutorials from recipes. A file tagged "Guida" is published in its own Guide section, either as a single-page guide or as an ordered, multi-chapter collection built from a folder, and it stays out of the recipe listings.

## ADDED Requirements

### Requirement: Guide classification by tag
A `.cook` file SHALL be treated as a guide when its frontmatter tags include "Guida" (matched case-insensitively, ignoring surrounding whitespace). Every other `.cook` file SHALL be treated as a recipe. How a file is classified SHALL NOT depend on the folder it is in.

#### Scenario: Tagged file is a guide
- **WHEN** a file's tags are `[Guida, CBT]`
- **THEN** the file is published as a guide and not as a recipe

#### Scenario: Tag match ignores case
- **WHEN** a file's tags include `guida`
- **THEN** the file is published as a guide

#### Scenario: Untagged file in a folder stays a recipe
- **WHEN** a file without the "Guida" tag is in a subfolder of `recipes/`
- **THEN** the file is published as a recipe and appears on the Ricette page like any root-level recipe

### Requirement: Guides excluded from recipe listings
Guides SHALL NOT appear anywhere recipes are listed or searched. This covers the Ricette page grid, its recipe count, its alphabet rail, its text search, its tag filter options and its ingredient filter options. A guide SHALL NOT be reachable at `/recipe/<slug>`. "Guida" SHALL NOT be offered as a tag filter option.

#### Scenario: Ricette page hides guides
- **WHEN** the user opens the Ricette page
- **THEN** no guide appears in the grid and the recipe count excludes guides

#### Scenario: Search does not match guides
- **WHEN** the user searches the Ricette page for a word that appears only in a guide's title
- **THEN** no result is shown for that guide

#### Scenario: Guida is not a tag filter option
- **WHEN** the user opens the tag filter on the Ricette page
- **THEN** "Guida" is not listed, and a tag used only by guides is not listed

#### Scenario: Recipe URL does not serve guides
- **WHEN** the user requests `/recipe/<slug>` where `<slug>` is a guide's slug and no recipe has that slug
- **THEN** the server responds with 404

### Requirement: Single-page guides
A guide file placed directly in `recipes/` (not in a subfolder) SHALL be published as a single-page guide at `/guide/<slug>`. The slug SHALL be derived from the filename with the same rules used for recipe slugs.

#### Scenario: Root-level guide page
- **WHEN** `recipes/Guida-alla-cottura-sous-vide.cook` is tagged "Guida"
- **THEN** it is readable at `/guide/guida-alla-cottura-sous-vide`

### Requirement: Guide collections from folders
Guide files in the same subfolder of `recipes/` SHALL form one guide collection, with each file as a chapter. The collection's title SHALL be the name of that folder. Its slug SHALL be the folder name with the same slug rules used for files. A guide file SHALL belong to the collection of the folder that directly contains it. A collection page SHALL be published at `/guide/<collection-slug>`, listing every chapter in order with its position number and title.

#### Scenario: Folder becomes a collection
- **WHEN** `recipes/Guida al Sous Vide/` contains four files tagged "Guida"
- **THEN** a collection titled "Guida al Sous Vide" is available at `/guide/guida-al-sous-vide` and lists four chapters

#### Scenario: Non-guide files in a collection folder
- **WHEN** a collection folder also contains a file without the "Guida" tag
- **THEN** that file is not a chapter and appears as a recipe on the Ricette page

#### Scenario: Folder with no guides
- **WHEN** a subfolder contains no files tagged "Guida"
- **THEN** no collection is created for it

### Requirement: Chapter ordering and slugs
Chapters SHALL be ordered by an optional numeric filename prefix: leading digits followed by a `-`, `_`, `.` or space separator, such as `01-`, and compared by numeric value. Chapters without a prefix SHALL come after all prefixed chapters, ordered by title. The prefix SHALL be removed before the chapter slug is derived. Each chapter SHALL be readable at `/guide/<collection-slug>/<chapter-slug>`.

#### Scenario: Prefix sets order
- **WHEN** a collection folder contains `01-Introduzione al Sous Vide.cook`, `02-Temperature e Tempi.cook`, `03-Raffreddamento e Abbattimento.cook` and `04-Pastorizzazione e Sicurezza.cook`
- **THEN** the collection lists them in the order 01, 02, 03, 04, whatever their titles

#### Scenario: Prefix removed from URL
- **WHEN** a chapter's filename is `01-Introduzione al Sous Vide.cook` in collection `guida-al-sous-vide`
- **THEN** the chapter is readable at `/guide/guida-al-sous-vide/introduzione-al-sous-vide`

#### Scenario: Numeric, not lexical, comparison
- **WHEN** a collection has chapters prefixed `2-` and `10-`
- **THEN** the `2-` chapter comes before the `10-` chapter

#### Scenario: Unprefixed chapters come last
- **WHEN** a collection has prefixed chapters and one chapter without a prefix
- **THEN** the chapter without a prefix is listed after all prefixed chapters

### Requirement: Guide index page
The system SHALL publish a Guide index page at `/guide` that lists every single-page guide and every guide collection, ordered by title. Each entry SHALL show its title and cover image, and SHALL state what kind of entry it is: a collection with its chapter count, or a single page. A collection's cover image SHALL be the image of its first chapter (in chapter order) that has one. When there are no guides, the page SHALL show an empty-state message instead of a list.

#### Scenario: Both kinds listed
- **WHEN** the user opens `/guide` with one single-page guide and one collection of four chapters
- **THEN** both entries are listed, the collection shows "4 capitoli", and the single-page guide is marked as a single page

#### Scenario: Collection entry links to collection page
- **WHEN** the user selects a collection on the Guide index
- **THEN** the user is taken to that collection's page

#### Scenario: No guides
- **WHEN** no file is tagged "Guida"
- **THEN** `/guide` shows an empty-state message

### Requirement: Guide reading layout
Single-page guides and chapters SHALL be shown in a reading layout. It includes the title, the tags other than "Guida" as links to their tag pages, the source link if present, and the body. The guide's image, if present, SHALL be shown whole and uncropped, no wider than the reading column. In the body, section headings are shown as headings, each paragraph as a prose paragraph, and callout notes as visually distinct callouts. A note whose text starts with "Attenzione" SHALL be shown as a warning callout, visually distinct from ordinary callouts. Inline timers and quantities SHALL be shown as readable text in paragraphs and notes alike, and raw Cooklang token syntax (such as `~{30%minutes}`) SHALL never be visible. The reading layout SHALL NOT show an ingredient panel, ingredient scaling, servings controls, a cooking-mode toggle, an ingredient checklist or step numbers.

#### Scenario: Paragraphs are not numbered
- **WHEN** the user opens a guide with several paragraphs
- **THEN** the paragraphs appear as unnumbered prose

#### Scenario: No cooking controls
- **WHEN** the user opens any guide or chapter page
- **THEN** no ingredient panel, scaling input, servings control or "Start cooking" toggle is present

#### Scenario: Callouts are distinct
- **WHEN** a guide contains a `>` note
- **THEN** it is rendered as a callout that is visually distinct from body paragraphs

#### Scenario: Warning callout
- **WHEN** a guide contains a note starting with "Attenzione"
- **THEN** it is rendered as a warning callout that is visually distinct from ordinary callouts

#### Scenario: Timer inside a note
- **WHEN** a note contains `~{30%minutes}`
- **THEN** the page shows "30 minuti" and does not show `~{30%minutes}`

#### Scenario: Image not cropped
- **WHEN** a chapter's image is a chart with labels near its edges
- **THEN** the whole image is visible on phone and desktop widths

### Requirement: Tables in guides
In a guide file, a paragraph whose every line starts with `|` SHALL be rendered as a table. The first line gives the column headers, and each following line is a data row with cells separated by `|`. A markdown-style separator line (containing only `|`, `-`, `:` and spaces) SHALL be ignored. Timer tokens inside cells SHALL be shown as readable text, following the unit rules below. On a narrow screen, a table wider than the reading column SHALL scroll horizontally inside its own area, without making the page scroll sideways.

#### Scenario: Table rendered
- **WHEN** a guide paragraph consists of the lines `| Forma | Spessore | Tempo |`, `| Lastra | 1 cm | ~{10%minutes} |` and `| Lastra | 2.5 cm | ~{35%minutes} |`
- **THEN** the page shows a table with headers Forma, Spessore and Tempo, and two rows whose Tempo cells read "10 minuti" and "35 minuti"

#### Scenario: Separator line ignored
- **WHEN** the second line of a table paragraph is `|---|---|---|`
- **THEN** no row is rendered for that line

#### Scenario: Wide table on a phone
- **WHEN** a table is wider than a 375px-wide screen
- **THEN** the table scrolls horizontally and the page itself does not scroll horizontally

### Requirement: Italian time units
Wherever a timer is displayed, on recipe pages and guide pages alike, an English time unit written in the file SHALL be displayed in Italian. The mapping is: second(s) to secondo/secondi, minute(s) or min to minuto/minuti, hour(s) to ora/ore, day(s) to giorno/giorni, week(s) to settimana/settimane, and month(s) to mese/mesi. The singular form SHALL be used when the quantity is exactly 1, otherwise the plural form. `celsius` SHALL be displayed as `°C`. Units already written in Italian SHALL be displayed unchanged. The `.cook` files themselves SHALL NOT be modified.

#### Scenario: Plural English unit
- **WHEN** a file contains `~{35%minutes}`
- **THEN** the page shows "35 minuti"

#### Scenario: Singular English unit
- **WHEN** a file contains `~{1%hour}`
- **THEN** the page shows "1 ora"

#### Scenario: Italian unit unchanged
- **WHEN** a recipe contains `~{24%ore}`
- **THEN** the page shows "24 ore"

### Requirement: Chapter navigation
A chapter page SHALL show a link back to its collection with the collection title, the chapter's position in the form "Capitolo N di M", a link to the previous chapter (except on the first chapter), and a link to the next chapter (except on the last chapter). Each previous/next link SHALL show the linked chapter's title. The last chapter SHALL end with a closing block that says the guide is finished and links back to the collection page and to the tag pages of the collection's tags.

#### Scenario: Middle chapter
- **WHEN** the user opens chapter 2 of 4
- **THEN** the page shows "Capitolo 2 di 4", a link to chapter 1 and a link to chapter 3, each labelled with its title

#### Scenario: First and last chapter
- **WHEN** the user opens chapter 1
- **THEN** no previous link is shown, and chapter 4 of 4 shows no next link

#### Scenario: End of the collection
- **WHEN** the user reaches the end of the last chapter
- **THEN** the page shows that the guide is finished, with a link back to the collection's chapter list and, when the collection has tags, links to those tag pages

### Requirement: Related guides on tag pages
A tag page at `/tag/<tag>` SHALL list only recipes in its main grid. When one or more guides (single-page guides, or collections with at least one chapter carrying the tag) have that tag, the page SHALL also show a "Guide correlate" section that links to each such guide or collection once. The tag page SHALL respond with 404 only when neither a recipe nor a guide has the tag. For "Guida" itself, the tag page SHALL respond with 404.

#### Scenario: Recipes and guides share a tag
- **WHEN** the user opens `/tag/CBT` and both recipes and guides are tagged CBT
- **THEN** the grid shows only the CBT recipes and a "Guide correlate" section links to the single-page guide and the collection, each listed once

#### Scenario: Tag with no guides
- **WHEN** the user opens a tag page for a tag that no guide has
- **THEN** no "Guide correlate" section is shown

#### Scenario: Tag used only by guides
- **WHEN** the user opens a tag page for a tag that only guides have
- **THEN** the page shows the "Guide correlate" section and says that no recipes have this tag, without responding with 404

### Requirement: Section navigation
Every page SHALL offer navigation to both the Ricette page (`/`) and the Guide index (`/guide`). The link for the current section SHALL be marked as current, both visually and for assistive technology. Recipe pages and tag pages count as Ricette, and guide pages count as Guide.

#### Scenario: Navigating from recipes to guides
- **WHEN** the user is on the Ricette page and selects "Guide"
- **THEN** the Guide index opens and "Guide" is marked as the current section

### Requirement: Folder not shown as recipe category
Recipe cards and recipe detail pages SHALL NOT show the name of the folder that contains the recipe file.

#### Scenario: Recipe in a subfolder
- **WHEN** a recipe file sits in a subfolder of `recipes/`
- **THEN** its card and detail page show its tags but not the folder name

### Requirement: Guide slug uniqueness
Single-page guides and collections share the `/guide/<slug>` namespace. Chapter slugs are unique within their collection. When two entries resolve to the same slug, the system SHALL log a warning that names the conflicting slug, and it SHALL keep serving the entry that comes first in title order. Guide slugs and recipe slugs are separate namespaces and SHALL NOT conflict with each other.

#### Scenario: Guide and recipe with same slug
- **WHEN** a guide and a recipe both resolve to slug `focaccia`
- **THEN** the recipe is served at `/recipe/focaccia`, the guide at `/guide/focaccia`, and no warning is logged
