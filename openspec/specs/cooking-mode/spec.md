# cooking-mode Specification

## Purpose

Keeps the device screen awake while a recipe detail page is open, via an explicit "Start cooking" toggle, so a cook with messy hands doesn't have to keep unlocking their phone or tablet mid-recipe.

## Requirements

### Requirement: Feature detection for wake lock support
The system SHALL only render the "Start cooking" toggle on a recipe detail page when the browser supports the Screen Wake Lock API. When unsupported, the toggle SHALL NOT be rendered.

#### Scenario: Supported browser
- **WHEN** a recipe detail page loads in a browser that supports the Screen Wake Lock API
- **THEN** the "Start cooking" toggle is visible in the page header

#### Scenario: Unsupported browser
- **WHEN** a recipe detail page loads in a browser without Screen Wake Lock API support
- **THEN** the "Start cooking" toggle is not rendered

### Requirement: Activate screen wake lock
The system SHALL acquire a screen wake lock when the user activates the "Start cooking" toggle while it is off, and SHALL switch the toggle to its active ("on") visual state.

#### Scenario: User starts cooking mode
- **WHEN** the user taps the "Start cooking" toggle while it is off
- **THEN** the system requests a screen wake lock and the toggle switches to its active state

### Requirement: Deactivate screen wake lock
The system SHALL release the held screen wake lock when the user activates the toggle while cooking mode is on, and SHALL return the toggle to its inactive ("Start cooking") state.

#### Scenario: User stops cooking mode
- **WHEN** the user taps the toggle while cooking mode is on
- **THEN** the system releases the wake lock and the toggle returns to its "Start cooking" state

### Requirement: Automatic re-acquisition after backgrounding
While cooking mode is on, if the browser releases the wake lock because the page became hidden (tab backgrounded, device screen locked), the system SHALL re-acquire the wake lock automatically when the page becomes visible again, without requiring further user action.

#### Scenario: Returning to a backgrounded tab
- **WHEN** cooking mode is on, the browser has released the wake lock because the page was hidden, and the user returns to the tab
- **THEN** the system re-acquires the wake lock automatically and the toggle remains in its active state

### Requirement: No persistence across page loads
Cooking mode SHALL NOT persist across page reloads or new navigations. Each fresh load of a recipe detail page SHALL start with cooking mode off.

#### Scenario: Reloading the page
- **WHEN** the user reloads a recipe detail page on which cooking mode was previously on
- **THEN** the page loads with cooking mode off and the toggle in its "Start cooking" state

### Requirement: Release on navigation away
The system SHALL NOT hold a screen wake lock for a recipe detail page once the user has navigated away from it.

#### Scenario: Leaving the recipe page
- **WHEN** cooking mode is on and the user navigates away from the recipe detail page
- **THEN** the wake lock held for that page is released
