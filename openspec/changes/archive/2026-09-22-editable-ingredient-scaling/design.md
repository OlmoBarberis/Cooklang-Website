# Design

## Context

`src/pages/recipe/[slug].astro` renders `recipe.sidebarIngredients` (from `src/lib/recipes.ts`, `FlatIngredient { name, quantity: number | string | null, unit, displayText }`, already merged by name+unit). A client `<script>` block currently reads `[data-base]` spans (only present when `quantity` is a `number`), and rescales them via preset buttons/`mult-input` calling `applyMultiplier(mult)`, which does `base * mult` and formats with `toFixed(2)` + trailing-zero trim. Checkbox state persists via `sessionStorage`; the multiplier does not. See proposal.md - Why / What Changes for motivation and scope.

## Goals / Non-Goals

**Goals:**
- Replace the preset-multiplier trigger with direct editing of any numeric ingredient's quantity, recomputing every other numeric ingredient and (when numeric) the servings figure live.
- Keep per-ingredient rounding precision tied to that ingredient's own original decimal-place count.

**Non-Goals:**
- Changing `src/lib/recipes.ts` data shapes or the WASM parsing pipeline.
- Touching inline quantities inside step text (`StepText`, `recipe.ingredients`) or the ingredient checklist/`sessionStorage` behavior.
- Persisting rescaled state anywhere.

## Decisions

**Ratio source of truth: keep the original quantity in a data attribute, same pattern as today.** Each editable ingredient's element keeps its original numeric quantity in `data-base` (as today), plus a new `data-decimals` computed at render time from that same original value (count of digits after `.` in its string form; `0` if the original has none). The edited field's ratio is always `typedValue / thisElement.dataset.base`, never derived from another field's current displayed value — this is what keeps repeated edits mathematically equivalent to a single fresh computation each time (per spec: "Ratio is always computed from the original quantity"), and avoids compounding rounding error across keystrokes.
- *Alternative considered*: track a single running "current ratio" state variable updated on each edit and multiply forward from the last displayed values. Rejected — same result algebraically only if never rounded in between; since we round for display on every keystroke, compounding would drift from the true ratio over successive edits.

**Rendering: replace `<span class="ing-qty">` with `<input>` only for numeric ingredients.** Non-numeric/quantity-less ingredients keep the current plain `<span>`/text rendering untouched. The unit stays a separate sibling element (or trailing text) outside the input, so it's never part of the editable value or accidentally overwritten by `.value` assignment.
- *Alternative considered*: a single `contenteditable` span holding `"200 g"` as free text, parsing the number back out on input. Rejected — parsing user-typed free text mixed with units is fragile (locale decimal separators, partial typing states) versus a plain numeric `<input type="text" inputmode="decimal">` (not `type="number"` since we want full control over formatting and to avoid browser spinner UI / locale quirks with `toFixed`).

**Event wiring: single `input` listener per editable field, driving a shared recompute function.** On `input`, parse `event.target.value` with a permissive numeric check (allow partial states like trailing "." by simply no-op'ing until parseable); if it parses to a finite number `> 0`, compute `ratio = value / event.target.dataset.base` and call a shared `rescale(ratio, exceptEl)` that updates every other numeric field's `.value` (and the servings element, if numeric) from their own `data-base` × ratio, each rounded with its own `data-decimals`. The field that raised the event is passed as `exceptEl` and skipped, so its raw typed text is left alone (per spec: "Live recompute without disrupting the edited field").

**Rounding helper: per-element decimal count instead of a fixed `toFixed(2)`.**
```
function roundTo(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor; // round-half-up, positive values only
}
```
`Math.round` on positive numbers rounds `.5` up (away from zero), matching the round-half-up examples in the proposal (`40.50 -> 41`). Display then formats with exactly `decimals` fixed digits (`value.toFixed(decimals)`) — no trailing-zero trimming, since the decimal count is now intentionally tied to the original quantity's own precision (an original "25.2" always displays one decimal place, even when the rescaled value happens to be a whole number like "25.0").
- *Alternative considered*: keep trimming trailing zeros (prior behavior for the fixed-2-decimal design). Superseded by the user's explicit per-ingredient precision rule, which makes trimming inappropriate — the decimal count is now meaningful (it mirrors the recipe author's own precision), not incidental.

**Servings is a rescale source, not just a target.** The servings figure (if `recipe.servings` parses as a plain number) is rendered as its own `<input>` carrying `data-base`/`data-decimals`, exactly like an ingredient field, and gets the same `input` listener wired to the same shared `rescale()` call. Editing it computes a ratio against its own original base and rescales every ingredient; editing any ingredient rescales it in turn, since both live in the same rescale group. If `recipe.servings` doesn't parse as a number, no attributes are added and it's left as static text.
- *Revision note*: the original design kept servings read-only (a display-only rescale target). Impeccable's critique flagged this as a P0 — PRODUCT.md explicitly promises adjusting "quantities for the desired serving scale," and a read-only figure doesn't support the servings-first mental model most cooks reach for first. Making it a symmetric rescale source was the direct fix.

**Rescale engine scope boundary: a dedicated `scalable` class, not the raw `data-base` attribute.** The engine selects `document.querySelectorAll<HTMLInputElement>('.scalable')` and only the ingredient-panel quantity inputs and the servings input carry that class.
- *Why this matters*: `src/components/StepText.astro` independently stamps `data-base`/`data-unit` (but never `data-decimals`) onto `.token-qty`/`.token-inline-qty` spans for inline ingredient and quantity mentions inside step instructions — a pre-existing, unrelated use of the same attribute name. The original implementation selected on the bare `[data-base]` attribute, which matched those spans too. Editing any sidebar ingredient silently rewrote every inline mention's `textContent` to a bare, unit-less, 0-decimal number (no `data-decimals` present, so it defaulted to 0) — confirmed by reproduction against a real recipe, where editing a sidebar quantity turned an unrelated inline oven-temperature instruction ("70 °C") into "105". This was a correctness bug, not a cosmetic one.
- *Fix*: scope the engine to a class that only the panel's own editable elements carry. `StepText.astro`'s `data-base`/`data-unit` attributes are left as they were (they serve no purpose for this feature and are outside this change's scope to remove), but the rescale engine no longer queries on them.

**Reset control.** A plain `<button id="reset-quantities">` in the panel header iterates every `.scalable` element and sets `.value` back to `dataset.base` formatted to `dataset.decimals`, clearing any `aria-invalid` state along the way. No confirmation dialog — it's a low-stakes, instantly-reversible action (rescaling again undoes it).
- *Why*: the original design had no undo path at all. Impeccable's critique flagged this as a P1 — a wrong keystroke or accidental tap permanently altered every displayed quantity until reload, with no visible way back.

**Checkbox and quantity input are no longer nested in one `<label>`.** Each ingredient row previously wrapped both `.ing-check` and `.ing-qty-input` inside a single `<label>`, which is non-conformant (a label implicitly associates with only its first labelable descendant) and risked a near-miss tap near the small input toggling the checkbox instead. The row now renders the checkbox as a plain sibling `<input>`, the quantity input as a fully independent sibling, and only the ingredient name as `<label for="ing-{i}">` — preserving "click the name to check it off" while removing the nested-control hazard.

**Visual treatment: tomato accent, restored focus-visible ring.** `.ing-qty-input`/`.servings-input` use `var(--color-accent)`/`var(--color-accent-dk)` for border/hover/focus, per DESIGN.md's Recipe Color Rule that active controls use tomato. The original `:focus` rule set `outline: none`, which — at specificity (0,2,0) — silently overrode the sitewide `:focus-visible { outline: 2px solid var(--color-accent) }` rule (0,1,0) that other current components (`RecipeCard`, homepage search inputs) do respect. Removing that override restores the standard ring for keyboard users on this control too.

**Invalid input now gets visible feedback on the field itself.** The original design only specified that invalid input must not propagate to other fields; it said nothing about the invalid field's own feedback. The `input` listener now sets `aria-invalid="true"` on a rejected value (cleared on the next valid one or on reset), and CSS gives that state a distinguishable border. This directly answers a WCAG 3.3.1 (Error Identification) gap Impeccable's technical audit raised.

**Removed entirely:** `applyMultiplier`, `setActive`, the `mult-btn`/`mult-input` DOM and their event listeners, and the `.multiplier-bar`/`.mult-*` styles. No feature flag or fallback — this is a full replacement per the proposal's BREAKING note.

## Risks / Trade-offs

- **Live recompute on every keystroke** could feel like the rest of the list "flickers" while typing a multi-digit number (e.g. typing "3", "30", "300" briefly rescales three times). → Accepted per explicit user choice in the preceding exploration; mitigated by the edited field itself never re-rendering (only *other* fields move), so the user's own typing is never disrupted.
- **`data-decimals` derived from a value already normalized by `mergeIngredients`** (which sums same-unit occurrences via `parseFloat(...).toFixed(4)`): if a recipe writes an ingredient in two places with different precision (e.g. `100g` and `50.5g`), the merged sum's own decimal count (not either original mention's) becomes the precision used. → Acceptable edge case; the merged quantity's own written form is the closest available notion of "original" once merged, and this mirrors how the value is already displayed today.
- **Removing the multiplier bar is a breaking UI change** for any returning user's muscle memory (e.g. bookmarked expectation of a ½× button). → Explicitly requested; no migration needed since there's no persisted state tied to it.
- **[Resolved] Shared `data-base` attribute name collided with `StepText.astro`'s unrelated, pre-existing use of the same attribute**, causing the rescale engine to silently corrupt inline step-text content — including unrelated inline quantities like an oven temperature — whenever any ingredient was edited. → Caught by Impeccable's critique review and confirmed by direct reproduction against a real recipe; fixed by scoping the rescale engine to a dedicated `.scalable` class instead of the bare attribute.

## Migration Plan

Single-file change, no data migration:
1. Edit `src/pages/recipe/[slug].astro` markup: remove the `.multiplier-bar` block; add `data-base`/`data-decimals` and swap to `<input>` for numeric `sidebarIngredients` entries; add the same attributes to the servings chip's value when numeric.
2. Replace the client script's multiplier section with the new `rescale`/`roundTo`/input-listener logic; remove now-dead code and styles.
3. Manual verification in a dev server against a recipe with mixed numeric/non-numeric ingredients and a numeric vs. non-numeric servings value (see tasks.md).

Rollback is a plain revert of the single commit/file; no server-side or data changes are involved.
