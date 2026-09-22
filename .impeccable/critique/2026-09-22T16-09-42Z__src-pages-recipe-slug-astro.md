---
target: recipe detail page ingredient panel
total_score: 15
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
target_identity: "file:/home/gunghio/Projects/Cooklang-Website/src/pages/recipe/[slug].astro"
target_fingerprint: "sha256:7106a1045cde681b51308d6605e285997691b7c4eb11c730232fc9d6a95f982d"
target_path: /home/gunghio/Projects/Cooklang-Website/src/pages/recipe/[slug].astro
timestamp: 2026-09-22T16-09-42Z
slug: src-pages-recipe-slug-astro
---
Method: dual-agent (A: isolated sub-agent "Assessment A – Design Review" · B: isolated sub-agent "Assessment B – Detector + Evidence")

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2/4 | Values update instantly, but nothing shows *what* changed or by what ratio; Porzioni silently fails to update for the many real recipes with non-numeric servings ("14-20", "ca. 160 g") |
| 2 | Match System / Real World | 3/4 | Italian labels are correct, but a free-text field is a weaker match for "how much do I have" than the discrete multiplier choices it replaced |
| 3 | User Control and Freedom | 1/4 | No reset/undo — once edited, the only way back to the original recipe is memorizing every number or reloading |
| 4 | Consistency and Standards | 0/4 | **Confirmed regression**: editing any sidebar quantity corrupts every inline ingredient/quantity mention in the step text sitewide (see verified bug below) — the same ingredient shows two different numbers on one screen |
| 5 | Error Prevention | 1/4 | No debounce, no format guard, no confirmation before a page-wide rescale fires on every keystroke |
| 6 | Recognition Rather Than Recall | 2/4 | Per-field `aria-label` is good in isolation, but the interaction demands recalling original values to revert |
| 7 | Flexibility and Efficiency | 2/4 | Power users can tweak any single ingredient, but "just double it" now requires manual arithmetic instead of one tap |
| 8 | Aesthetic and Minimalist Design | 3/4 | Visually restrained, undermined only by generic input styling |
| 9 | Error Recovery | 0/4 | Typing `0`, a negative, or non-numeric text silently no-ops — no error state, no message |
| 10 | Help and Documentation | 1/4 | Zero microcopy indicates the numbers are editable; the removed buttons were self-labeling |
| **Total** | | **15/40** | **Poor** |

*(Lowered from Assessment A's original 16/40: heuristic 4 dropped from 1→0 after independent confirmation that the "wrong decimal" issue is actually full content corruption, detailed below.)*

## Design Specificity Verdict

**Fails specificity.** `.ing-qty-input` is a generic bordered text input styled with the same neutral tokens (`--color-surface-alt`/`--color-border`) as the page's inert `.label` tag chips. Three concrete violations of this project's own documented system (DESIGN.md):
- The **Recipe Color Rule** states tomato marks "active controls... and inline ingredient references" — the single most active control on the page uses zero tomato, at rest or on focus.
- **Shapes** establishes that "serving choices use circles as clear, compact interaction marks" (proven by the still-present circular step-num badges) — the replaced buttons plausibly used this vocabulary; the new input abandons it for a form-field default.
- The input's `:focus` rule explicitly sets `outline: none` and substitutes a neutral border-color swap. Assessment B verified via CSS specificity math that this rule (0,2,0) beats the sitewide `:focus-visible { outline: 2px solid var(--color-accent) }` convention (0,1,0) that other recent components (`RecipeCard.astro`, the homepage search inputs) *do* follow — so this is a new component actively opting out of a convention the rest of the current codebase honors, not a legacy pattern being carried forward.

**Deterministic scan** (`impeccable detect --json`): 21 advisory findings (18 font-size, 2 radius, 1 color), all "off DESIGN.md ramp." Assessment B cross-referenced every line against `git diff HEAD` and found only **one** attributable to this change: `.ing-qty-input`'s `font-size: 0.875rem` (line 411) — off DESIGN.md's five documented type steps, though it deliberately reuses an already-flagged sibling value (`.ing-label`) rather than introducing a new one. Two more findings (lines 216/476) belong to an unrelated cooking-mode-toggle feature bundled in the same uncommitted diff, not the ingredient-scaling work. The remaining ~17 findings are pre-existing project-wide drift, confirmed unchanged by this diff.

**Visual overlays**: unavailable. No user-visible browser overlay was produced — Playwright's Chromium download is blocked by this sandbox's network policy (default-deny on `cdn.playwright.dev`), and no alternative browser binary exists on the system. All evidence below is source-level (code, CSS, and one live-DOM reproduction I ran myself against the real dev server via a headless DOM, not a rendered screenshot).

## Overall Impression

The numeric mechanics are careful — per-ingredient decimal precision, honest exclusion of non-numeric quantities — but the interaction sits on top of a selector that isn't scoped to the ingredient panel, and it silently damages content everywhere else on the page that happens to share its attribute name. Combined with the loss of the servings-first mental model and zero visual signal that the numbers are touchable, this reads as a promising mechanism shipped with its blast radius unchecked, not the same class of problem as the original request's spec (which was scoped and clear) — this is an implementation gap.

## What's Working

- **Per-ingredient decimal precision** (`data-decimals` + `roundTo()`): each field rescales using its own original decimal count, so "0,5 cucchiaino" scales to something like "0.75" instead of losing precision to a coarser ingredient. Careful, specific numeric thinking.
- **Honest exclusion of non-numeric ingredients**: "q.b." and ranges like "750-875 g" (confirmed present in real recipes, e.g. `Chips di carote alle erbe.cook`) render as plain, non-interactive text rather than faking precision that doesn't exist.
- **Clean removal, verified twice independently**: both Assessment B and my separate technical audit grepped the full `src/` tree and confirmed zero orphaned `.mult-btn`/`.mult-input`/`multiplier` CSS or JS references after the old multiplier bar was removed. Both also independently verified zero hard-coded colors were introduced — every new rule uses the site's existing CSS custom properties, and I separately computed the actual contrast ratio for the new input (~12.9:1 light / ~11.4:1 dark), comfortably exceeding WCAG AAA.

## Priority Issues

**[P0] Editing a sidebar ingredient corrupts every inline ingredient/timer mention in the recipe's steps, sitewide — CONFIRMED via live reproduction**
- **Why it matters**: `src/pages/recipe/[slug].astro`'s rescale engine selects `document.querySelectorAll('[data-base]')` with no scope — it isn't limited to the ingredient panel. `StepText.astro` independently stamps `data-base`/`data-unit` (never `data-decimals`) onto every `.token-qty` (ingredient mentions inline in steps) and `.token-inline-qty` (inline quantities/temperatures) span. I reproduced this against a real recipe (`Barrette di cereali con frutta secca`): editing the sidebar's "frutta essiccata" from 100→150 turned every step-text mention from `"(100 g)"` into the bare string `"150"` (parentheses and unit gone), and — worse — turned an unrelated **temperature** instruction, `"70 °C"`, into `"105"` with no unit, because it shares the same generic `data-base` attribute and gets swept into the same global rescale. This is not a rounding nuance; it silently replaces cooking instructions with wrong, unlabeled numbers, including altering a stated oven temperature.
- **Fix**: Scope the rescale engine's selector to the ingredient panel and servings element only (e.g. `.ingredients-panel [data-base], .servings-val`), so step-text tokens are never touched. `StepText.astro`'s `data-base`/`data-unit` attributes appear to be leftover instrumentation from a previous feature and aren't used for anything else — confirm and either remove them or give them their own non-overlapping data attribute name.
- **Suggested command**: `/impeccable harden`

**[P0] The panel can no longer do the product's stated primary job**
- **Why it matters**: PRODUCT.md explicitly promises visitors can "adjust ingredient quantities for the desired serving scale." The Porzioni figure is a plain `<span>`, not an input. To target "cooking for 6," a user must pick some ingredient and mentally back-solve the gram amount — the direct previous path (multiplier buttons, or editing servings itself) is gone.
- **Fix**: Make the servings figure itself editable using the same rescale mechanism (`data-base`/`data-decimals` already exist on it) so "set the number of people" remains the most obvious scaling entry point, with per-ingredient editing as a secondary path.
- **Suggested command**: `/impeccable harden`

**[P1] No reset/undo**
- **Why it matters**: The removed 1× button was a one-tap "back to the real recipe" affordance. A wrong keystroke or an accidental tap now permanently alters every displayed quantity (compounded by the P0 bug above touching step text too) until the page is reloaded.
- **Fix**: A persistent "Ripristina dosi originali" control that resets every `[data-base]` element to its base value.
- **Suggested command**: `/impeccable harden`

**[P1] The most active control on the page is styled and behaves like inert content**
- **Why it matters**: `.ing-qty-input` uses the same neutral tokens as static tag chips, with no accent color at rest, hover, or focus — and its `:focus` rule actively suppresses the sitewide accent-colored `:focus-visible` ring that other current components use (confirmed by CSS specificity, not just visual guess). Nothing distinguishes "editable number" from "printed number" until a user accidentally taps one; keyboard users lose the site's standard focus affordance on this one control.
- **Fix**: Apply the site's tomato accent per DESIGN.md's own "active controls" rule, and let the input inherit (or explicitly re-apply) the sitewide `:focus-visible` ring instead of suppressing it.
- **Suggested command**: `/impeccable colorize` then `/impeccable polish`

**[P2] Checkbox and quantity-input share one `<label>`, risking mis-taps**
- **Why it matters**: Both `.ing-check` and `.ing-qty-input` sit inside one `<label>`. Assessment B confirmed a direct tap on the input works correctly (the click target wins), but a near-miss tap landing on the surrounding label — plausible given the input is only ~52px wide next to a potentially long ingredient name — toggles the checkbox instead, marking the ingredient "used" as an unintended side effect of trying to edit its quantity. This is also flagged independently in my separate technical audit as a P1 (nested labelable-control non-conformance).
- **Fix**: Give the checkbox its own dedicated `<label for>`/`id` pairing, separate from the quantity-input's hit area.
- **Suggested command**: `/impeccable harden`

## Persona Red Flags

**Casey (distracted, one-handed, mid-cook, possibly messy hands)**: The nested-`<label>` mis-tap risk above is exactly this persona's failure mode — a mistimed thumb-tap while bumping "farina" from 500 to 750 can silently mark the ingredient "done" instead. Worse, if she's also just fixed one ingredient's amount, the step she's currently reading may now show a wrong, unlabeled number for an unrelated temperature or timer value (P0 above) with zero indication anything changed there.

**Sam (accessibility-dependent, screen reader / keyboard)**: `aria-label="Quantità di {name}"` never includes the unit, so editing "2" gives no indication of grams vs. tablespoons vs. milliliters without separately exploring a sibling element. The suppressed `:focus-visible` ring further disadvantages low-vision keyboard users specifically on this control. No `aria-live` region announces the page-wide side effects of an edit.

**Jordan (confused first-timer)**: Nothing about the input's appearance — a bordered box matching the same tone as inert tag chips elsewhere on the page — suggests it's editable. The feature is functionally invisible to exactly the user who'd benefit most from a labeled affordance, which the removed ½×/1×/2×/3× buttons provided for free.

## Minor Observations

- Real recipe content check: roughly 1 in 8-10 ingredient-list items across this collection are non-numeric (ranges like "750-875 g", or "q.b.") and won't respond to editing, with no visual cue explaining why to a first-time user.
- Servings values in this exact collection are frequently non-numeric ("14-20", "ca. 160 g"), so the Porzioni payoff of the whole mechanism won't fire for a large share of real recipes even after the P0-2 fix above, unless that fix also handles range-style servings gracefully.
- Fixed `width: 3.25rem` with no `maxlength`/dynamic sizing risks clipping large rescaled values (also flagged in the separate technical audit).
- No feedback whatsoever (visual or otherwise) when typed input is rejected (`0`, negative, non-numeric) — also flagged in the separate technical audit as a WCAG 3.3.1 concern.
- A checked-off ingredient only dims to `opacity: 0.3`; `text-decoration: line-through` doesn't render inside an `<input>`, so a "done" ingredient's quantity box still looks like a normal, fully-editable field instead of visually retiring with its struck-through name.
- Touch-target correction: the `min-height: 2.75rem` rule on `.ing-qty-input` (confirmed by Assessment B) is actually unconditional, not mobile-scoped as it first appears — so the 44px touch target applies at every viewport width, which is a small positive beyond what was originally assumed.

## Questions to Consider

1. Now that the ½×/1×/2×/3× shortcuts are gone, has scaling gotten *slower* for the majority of visitors who just want to double a recipe, in exchange for per-ingredient flexibility only a small fraction will discover?
2. If a step's stated oven temperature silently changes because of an edit made three ingredients earlier, whose fault is it when the dish comes out wrong?
3. Is a plain bordered `<input>`, styled identically to the site's inert tag chips, really "The Open Cookbook," or a generic quantity-stepper wearing a Literata/DM Sans skin?
