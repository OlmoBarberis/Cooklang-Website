# ingredient-scaling Specification

## Purpose

Lets a cook rescale a recipe's ingredient quantities and servings by editing any one ingredient's amount, or the serving count itself, instead of choosing from preset multipliers.

## Requirements

### Requirement: Editable numeric ingredient quantities
On a recipe detail page, each ingredient in the sidebar panel whose quantity is a number SHALL be presented as an editable field showing that quantity, with its unit (if any) shown as a separate, non-editable label beside it.

#### Scenario: Numeric ingredient is editable
- **WHEN** a recipe detail page loads and an ingredient has a numeric quantity (e.g. 200 g)
- **THEN** the quantity is rendered as an editable field the user can type into, and the unit "g" is shown separately and is not part of the editable value

### Requirement: Non-numeric ingredients remain read-only
An ingredient whose quantity is not a plain number (e.g. "q.b.") or that has no quantity SHALL be rendered as plain, non-editable text. It SHALL NOT be editable, SHALL NOT be used as the source of a rescaling ratio, and its displayed text SHALL NOT change when other ingredients are rescaled.

#### Scenario: Non-numeric quantity is not editable
- **WHEN** a recipe detail page loads and an ingredient's quantity is "q.b." or absent
- **THEN** that ingredient is shown as plain text with no editable field
- **AND** editing another ingredient's quantity does not change this ingredient's displayed text

### Requirement: Ratio-based rescaling of all ingredients
When the user edits an ingredient's quantity to a valid positive number, the system SHALL compute a ratio as the typed value divided by that ingredient's original quantity as written in the recipe, then SHALL apply that ratio to every other numeric ingredient's original written quantity to produce its new displayed quantity.

#### Scenario: Editing one ingredient rescales the others
- **WHEN** an ingredient originally written as 20 g is edited to 40
- **AND** a second ingredient is originally written as 10 g
- **THEN** the second ingredient's displayed quantity becomes 20 g (ratio 2.0 applied to its original 10 g)

#### Scenario: Ratio is always computed from the original quantity, not the last displayed one
- **WHEN** an ingredient originally written as 20 g is edited first to 40, then edited again to 60
- **THEN** the resulting ratio for the second edit is computed as 60 / 20 (the original quantity), not 60 / 40 (the previously displayed quantity)

### Requirement: Live recompute without disrupting the edited field
The system SHALL recompute and update every other numeric ingredient's displayed quantity as the user types, on each change to the edited field's value. The field currently being edited SHALL NOT have its own displayed value rewritten by this recompute while the user is typing into it.

#### Scenario: Other ingredients update as the user types
- **WHEN** the user is typing a new quantity into one ingredient's field
- **THEN** every other numeric ingredient's displayed quantity updates immediately after each keystroke that changes the typed value
- **AND** the field being typed into keeps showing exactly what the user has typed, unmodified by the recompute

### Requirement: Per-ingredient decimal precision rounding
Each rescaled ingredient quantity SHALL be rounded to the same number of decimal places as that ingredient's original written quantity has, using round-half-up. This precision is determined per ingredient, not by a single fixed decimal count applied to all ingredients.

#### Scenario: Original quantity has no decimal places
- **WHEN** an ingredient originally written as 20 (no decimal places) is rescaled to a computed value of 40.50
- **THEN** the displayed quantity rounds to 41 (0 decimal places)

#### Scenario: Original quantity has one decimal place
- **WHEN** an ingredient originally written as 25.2 (one decimal place) is rescaled to a computed value of 40.88
- **THEN** the displayed quantity rounds to 40.9 (one decimal place)

### Requirement: Invalid input is ignored but visibly indicated
If the value typed into an editable field (an ingredient or the servings figure) is empty, zero, negative, or not a valid number, the system SHALL NOT recompute or change any other field's displayed quantity. All other quantities SHALL retain their last validly computed values until a valid positive number is entered. The field holding the invalid value SHALL show a visible invalid-state indicator, cleared as soon as a valid positive number is entered into it or the reset control is activated.

#### Scenario: Clearing a field does not blank the others
- **WHEN** the user clears an ingredient's field to type a new value
- **THEN** every other field's displayed quantity remains at its last validly computed value until the user types a valid positive number

#### Scenario: Typing a negative or zero value is ignored
- **WHEN** the user types 0 or a negative number into an editable field
- **THEN** no other field's displayed quantity changes

#### Scenario: Invalid value is visibly indicated
- **WHEN** the user types a negative number, zero, or non-numeric text into an editable field
- **THEN** that field shows a visible invalid-state indicator
- **AND** the indicator clears once the user types a valid positive number into that field, or activates the reset control

### Requirement: Servings figure is editable and rescales bidirectionally with ingredients
When the recipe's servings value parses as a plain number, the servings figure SHALL be presented as an editable field, using the same per-original-precision rounding rule as ingredients. Editing the servings field SHALL rescale every numeric ingredient by the ratio of the typed value to the servings field's own original written value. Editing any numeric ingredient SHALL likewise rescale the servings figure by that edit's ratio. When the servings value does not parse as a plain number (e.g. "4-6 persone"), it SHALL be left as plain, non-editable text, unaffected by rescaling in either direction.

#### Scenario: Editing servings rescales the ingredients
- **WHEN** a recipe's servings is written as 8 and the user edits the servings field to 20
- **THEN** every numeric ingredient's displayed quantity rescales by a ratio of 2.5, applied to each ingredient's own original written quantity

#### Scenario: Editing an ingredient rescales numeric servings
- **WHEN** a recipe's servings is written as 8 and the user rescales ingredients by a ratio of 2.5 by editing an ingredient
- **THEN** the displayed servings becomes 20

#### Scenario: Non-numeric servings is unaffected and not editable
- **WHEN** a recipe's servings is written as "4-6 persone"
- **THEN** the servings figure is shown as plain, non-editable text
- **AND** rescaling ingredients does not change that text

### Requirement: Reset restores original quantities
The ingredient panel SHALL provide a control that, when activated, resets every numeric ingredient and the servings figure (when editable) to its original written value, discarding any rescaling applied since the page loaded.

#### Scenario: Reset after rescaling
- **WHEN** the user has rescaled ingredients and/or servings away from their original values, then activates the reset control
- **THEN** every numeric ingredient and the servings figure display their original written values again

### Requirement: Rescaling is isolated to the ingredient panel and servings figure
Rescaling SHALL only affect the ingredient panel's numeric quantities and the servings figure. It SHALL NOT alter any quantity displayed within the recipe's step instructions, even when the same ingredient or quantity is also mentioned inline within those instructions.

#### Scenario: Editing an ingredient does not alter step instructions
- **WHEN** a recipe's step instructions mention an ingredient's quantity inline (e.g. "(100 g)") or an unrelated inline quantity (e.g. a temperature, "70 °C")
- **AND** the user edits that ingredient's quantity in the sidebar panel
- **THEN** the inline mentions within the step instructions remain exactly as originally written, unchanged by the rescale

### Requirement: No persistence across reload
Rescaled ingredient quantities and the rescaled servings figure SHALL NOT persist across a page reload or a fresh navigation to the recipe detail page. Each fresh load SHALL display the recipe's original written quantities and servings.

#### Scenario: Reloading resets to original quantities
- **WHEN** the user rescales ingredients and then reloads the recipe detail page
- **THEN** the page shows the recipe's original written quantities and servings, not the rescaled ones

### Requirement: No preset multiplier controls
The recipe detail page SHALL NOT provide preset multiplier buttons (e.g. ½×, 1×, 2×, 3×) or a separate multiplier input field. Rescaling SHALL occur only by editing an ingredient's quantity directly.

#### Scenario: No multiplier bar is rendered
- **WHEN** a recipe detail page with ingredients loads
- **THEN** no preset multiplier buttons or multiplier input are present in the ingredient panel
