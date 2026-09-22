# Proposal

## Why

The recipe detail page currently scales ingredient quantities only through four preset multiplier buttons (½×, 1×, 2×, 3×) plus a free-form multiplier number input. This forces a cook who needs an amount not covered by a preset (e.g. "I only have 300g of flour, not 400g") to do the ratio math themselves and type it into an indirect multiplier field. Letting the cook edit an ingredient's quantity directly, in the unit they're already looking at, is the more natural interaction and removes a layer of indirection.

## What Changes

- **BREAKING**: Remove the ½×/1×/2×/3× preset buttons and the multiplier number input from the ingredient panel. There is no longer a `Dosi` multiplier bar.
- Ingredients in the sidebar panel with a numeric quantity become directly editable input fields (in place of the current static text span).
- Editing one ingredient's quantity computes a ratio against that ingredient's original written quantity, then rescales every other numeric ingredient's original quantity by that same ratio, live as the user types.
- Ingredients with a non-numeric quantity (e.g. "q.b.") or no quantity remain plain, read-only text, exactly as today — they are never editable and never used as the source of a ratio.
- Each ingredient's rescaled quantity is rounded to the same number of decimal places as its own original written quantity (not a fixed global precision).
- The "Porzioni" servings figure in the recipe header is itself directly editable, not just a passive scaling target: when it parses as a plain number, it participates in rescaling both ways — editing it rescales every ingredient, and editing any ingredient rescales it — using the same per-original-precision rounding.
- A "Ripristina dosi originali" (reset) control in the ingredient panel restores every editable field (ingredients and servings) to its original written value in one action.
- Rescaling is strictly scoped to the ingredient panel and the servings figure. It SHALL NOT alter any quantity displayed within the recipe's step instructions, even though `StepText.astro` independently renders inline ingredient/quantity mentions using an attribute name that could otherwise collide with the rescale engine's selector.
- Invalid input (empty, zero, negative, non-numeric) is ignored for recompute purposes, but the field itself SHALL show a visible invalid-state indicator so the rejection isn't silent.
- No state persists across reload — a fresh load or revisit always shows the recipe's original written quantities and servings.

## Capabilities

### New Capabilities
- `ingredient-scaling`: Editable, ratio-based rescaling of ingredient quantities (and the servings figure) on the recipe detail page, replacing the previous preset-multiplier interaction.

### Modified Capabilities
_None._ The preset-multiplier behavior being removed was never captured as an OpenSpec capability, so this is a new capability rather than a delta to an existing one.

## Impact

- `src/pages/recipe/[slug].astro`: ingredient panel markup (remove multiplier bar, convert ingredient quantity spans to inputs for numeric ingredients, convert the servings figure to an input, add a reset control), panel styles (including a tomato-accent treatment on the new inputs consistent with DESIGN.md's active-control rule), and the client-side script (remove `applyMultiplier`/`setActive`/button wiring, add live input-driven rescaling and per-ingredient decimal precision).
- The rescale engine targets elements carrying a dedicated `scalable` marker class rather than the raw `data-base` attribute, because `StepText.astro` independently stamps `data-base`/`data-unit` on inline ingredient/quantity spans within step instructions for an unrelated purpose. Scoping to the marker class is what keeps rescaling from reaching — and corrupting — step-text content.
- Each ingredient row's checkbox and quantity input are no longer nested inside one `<label>`; the checkbox is a plain sibling and only the ingredient name is a `<label for>` pointing at it, avoiding the non-conformant nested-labelable-control pattern and the mis-tap risk it created.
- No changes to `src/lib/recipes.ts` data shapes are anticipated; `FlatIngredient.quantity`/`unit` and `recipe.servings` already carry what's needed, though the client script needs the original quantity's decimal-place count, derivable from the existing numeric value.
- Out of scope: inline quantities shown inside step text (`StepText` component, `recipe.ingredients`) are unaffected by design and by construction (see the `scalable` scoping above) — only the sidebar `sidebarIngredients` panel and the servings figure change.
- Out of scope: the ingredient checklist (checkbox) feature and its `sessionStorage` persistence are unaffected.
