# Tasks

## 1. Markup: ingredient panel

- [x] 1.1 Remove the `.multiplier-bar` block (½×/1×/2×/3× buttons and `#mult-input`) from `src/pages/recipe/[slug].astro`, and verify the "Dosi" row no longer renders on a recipe page in the dev server
- [x] 1.2 For each `sidebarIngredients` entry with a numeric `quantity`, replace the static `<span class="ing-qty">` with an editable `<input>` carrying `data-base` (the original numeric quantity) and a new `data-decimals` (decimal-place count of that original quantity as written), with the unit rendered as a separate, non-editable sibling element; verify by inspecting rendered HTML that numeric ingredients show an `<input>` and the unit is outside it
- [x] 1.3 Leave ingredients with a non-numeric or absent quantity as plain, non-editable text (no `data-base`/`data-decimals`, no input); verify a recipe containing a "q.b." or quantity-less ingredient still renders it as plain text
- [x] 1.4 Add `data-base`/`data-decimals` to the servings chip's value only when `recipe.servings` parses as a plain number, leaving it as static text otherwise; verify both a numeric-servings recipe and a non-numeric one (e.g. "4-6 persone") render correctly

## 2. Client script: rescale logic

- [x] 2.1 Remove `applyMultiplier`, `setActive`, and the `mult-btn`/`mult-input` event listeners from the script block; verify no console errors referencing removed elements when the page loads
- [x] 2.2 Implement a `roundTo(value, decimals)` helper using round-half-up on positive values, and verify with quick manual checks that `roundTo(40.50, 0) === 41` and `roundTo(40.88, 1) === 40.9`
- [x] 2.3 Implement a shared `rescale(ratio, exceptEl)` function that updates every element with `data-base`/`data-decimals` (ingredients and, if present, the servings value) except `exceptEl`, setting each to `roundTo(dataBase * ratio, dataDecimals)` formatted to exactly `dataDecimals` digits
- [x] 2.4 Wire an `input` listener on each editable ingredient field that: ignores non-finite, zero, or negative values; otherwise computes `ratio = value / el.dataset.base` and calls `rescale(ratio, el)`; verify by editing one ingredient in the dev server and observing every other numeric ingredient (and numeric servings) update live, while the edited field's own text stays exactly as typed
- [x] 2.5 Verify repeated edits to the same field always compute the ratio against that field's original `data-base` (not a previously displayed value), per the "Ratio is always computed from the original quantity" scenario in specs/ingredient-scaling/spec.md

## 3. Styles cleanup

- [x] 3.1 Remove the now-unused `.multiplier-bar`, `.mult-label`, `.mult-btns`, `.mult-btn`, `.mult-input` styles (including the mobile overrides at the bottom of the style block) and verify no unused-selector warnings remain for those class names
- [x] 3.2 Style the new ingredient `<input>` to match the panel's existing typography/spacing (replacing `.ing-qty`'s look-and-feel) and verify it reads consistently with the rest of the list in both light and dark mode

## 4. Manual verification

- [x] 4.1 Run `npm run dev`, open a recipe with a mix of numeric and non-numeric ingredients and a numeric servings value, edit one numeric ingredient, and confirm: other numeric ingredients rescale live and round to their own original decimal precision, non-numeric ingredients are unaffected, and servings rescales too
- [x] 4.2 Confirm invalid input (clearing the field, typing `0`, typing a negative number) leaves all other ingredients and servings at their last valid values
- [x] 4.3 Confirm reloading the page after rescaling shows the recipe's original written quantities and servings again
- [x] 4.4 Confirm a recipe whose servings value is non-numeric (e.g. "4-6 persone") keeps that text unchanged after rescaling ingredients

## 5. Remediation from Impeccable critique + audit

- [x] 5.1 Convert the servings figure to an editable input (`servings-input`) carrying `data-base`/`data-decimals`, and verify editing it rescales every numeric ingredient, while editing an ingredient rescales it back
- [x] 5.2 Discover and fix a correctness bug: scope the rescale engine's selector from the bare `[data-base]` attribute to a dedicated `.scalable` class, since `StepText.astro` independently stamps `data-base`/`data-unit` on inline step-text quantity mentions; verify by reproducing against a real recipe that editing a sidebar ingredient no longer alters any inline step-text mention (including unrelated quantities like a temperature)
- [x] 5.3 Add a "Ripristina dosi originali" reset control that restores every `.scalable` field to its original written value; verify by rescaling then clicking reset
- [x] 5.4 Restructure each ingredient row so the checkbox is a plain sibling `<input>` and only the ingredient name is a `<label for>` pointing at it, removing the previous nested-labelable-control pattern; verify via DOM inspection that the quantity input is never inside the checkbox's label
- [x] 5.5 Apply the site's tomato accent (`--color-accent`/`--color-accent-dk`) to the quantity/servings inputs' border, hover, and focus states, and remove the `outline: none` override that was suppressing the sitewide `:focus-visible` ring
- [x] 5.6 Add `aria-invalid="true"` plus a visible border change on a field holding a rejected value, cleared on the next valid edit or on reset; verify invalid input no longer fails silently
