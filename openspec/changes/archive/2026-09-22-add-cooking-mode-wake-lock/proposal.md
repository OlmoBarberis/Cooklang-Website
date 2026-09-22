# Proposal

## Why

Recipe pages don't stay on screen long enough for hands-on cooking — the device locks mid-recipe, forcing the cook to unlock it repeatedly with messy hands. A one-tap way to keep the screen awake while a recipe is open removes that friction, especially on phones and tablets propped up in a kitchen.

## What Changes

- Add a "Start cooking" toggle button to the recipe detail page header row, next to the back-link.
- Tapping it acquires a Screen Wake Lock (native `navigator.wakeLock` API) and flips the button to an "on" state (e.g. "Stop cooking").
- Tapping again, or navigating away from the page, releases the lock.
- If the browser silently releases the lock (tab backgrounded, screen auto-locks) while the toggle is "on", the page re-acquires it automatically when the tab becomes visible again (`visibilitychange`), so the user doesn't have to re-tap.
- No fallback for browsers without Wake Lock API support (e.g. iOS Safari < 16.4, or any other browser lacking the API): the button is feature-detected on load and simply not rendered if unsupported. As of 2024/2025 all major current browsers (Chrome, Safari 16.4+, Firefox 124+) support it natively, so this mainly guards against older browser versions.
- Toggle state does not persist across page reloads — every fresh page load starts "off".

## Capabilities

### New Capabilities
- `cooking-mode`: keeps the device screen awake while a recipe detail page is open, via an explicit user-toggled "Start cooking" control that uses the native Screen Wake Lock API.

### Modified Capabilities
(none)

## Impact

- `src/pages/recipe/[slug].astro`: adds a toggle button to the header row markup, plus a new vanilla `<script>` block (feature detection, wake lock acquire/release, `visibilitychange` re-acquire), following the existing inline-script pattern already used on this page for the ingredient checklist and multiplier.
- No new dependencies, no server-side changes, no changes to other pages.
