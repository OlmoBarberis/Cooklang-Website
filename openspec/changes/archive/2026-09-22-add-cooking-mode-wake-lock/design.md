# Design

## Context

`src/pages/recipe/[slug].astro` is server-rendered per request (Astro `output: 'server'`), with no client-side router — every navigation is a full page load. The page already has one vanilla inline `<script>` (`:475-526`) that does feature work with no framework: sessionStorage-backed ingredient checklist state and a quantity multiplier, both wired up with plain `document.querySelector` + `addEventListener`. There are no client-side JS dependencies beyond `minisearch` (used only on the homepage). See proposal.md - Why for motivation.

## Goals / Non-Goals

**Goals:**
- Add a "Start cooking" toggle to the recipe header row that acquires/releases a Screen Wake Lock, using the same vanilla-script style already established on this page.
- Keep the lock alive across backgrounding/foregrounding while the toggle is on.
- Degrade invisibly (no button at all) where the API isn't supported.

**Non-Goals:**
- No fallback mechanism (hidden video loop, polyfill, external library) for browsers lacking the API — out of scope per proposal.
- No persistence of cooking-mode state across reloads/navigation.
- No cross-page "keep cooking mode on as I browse" behavior — this is scoped to a single recipe detail page's lifetime.

## Decisions

**Native Wake Lock API only, no polyfill.** The site has zero client JS dependencies for page interactivity beyond a search index; pulling in a NoSleep.js-style hidden-video hack for legacy-browser coverage would be the first non-vanilla client dependency on this page and adds real complexity (video element lifecycle, autoplay quirks) for a shrinking slice of users — Chrome, Safari (16.4+), and Firefox (124+) all support the native API as of 2024/2025. Rejected: bundling NoSleep.js or writing a video-loop fallback — not worth the complexity for this codebase's size and audience.

**Feature detection with hidden-by-default markup.** The toggle button is rendered by Astro with a `hidden` attribute (or `[hidden]` via CSS) so an SSR page never flashes a control that then has to disappear. The inline script checks `'wakeLock' in navigator` on load and un-hides the button only when true. This mirrors how the rest of the page treats client behavior as progressive enhancement layered onto server-rendered markup.

**Single `WakeLockSentinel` held in module scope of the inline script**, not in any persisted store. State machine:

```
                    tap toggle (off -> on)
   [OFF] -------------------------------------------> [ON, lock held]
     ^                                                      |
     |                 tap toggle (on -> off)               |
     +------------------------------------------------------+
     |                                                       |
     |   page hidden -> browser silently releases lock       |
     |   (state variable stays "on" conceptually;            |
     |    sentinel reference becomes released)                v
     |                                              [ON, lock released
     |                                               by browser]
     |          page visible again -> re-request lock              |
     +---------------------------------------------------------<---+
```

The "on/off" UI state and the actual held-sentinel state are tracked separately: a boolean (`cookingModeOn`) reflects user intent and drives the button label; the sentinel reference reflects what's actually held right now. `visibilitychange` re-requests a new sentinel only when `cookingModeOn` is true and `document.visibilityState === 'visible'`.

**No explicit cleanup on `pagehide`/`beforeunload`.** Full-page navigation (confirmed: no Astro View Transitions in `BaseLayout.astro`) destroys the document and its JS context, which the spec requires the browser to treat as releasing any held wake lock. Adding manual release-on-unload code would be redundant.

**Button placement and styling** follow the existing `theme-toggle` pattern in `BaseLayout.astro` (icon button, stroke SVG, swaps icon/label based on state) but lives in `.recipe-header-row` next to the back-link, sized/styled consistently with that row rather than the global header.

## Risks / Trade-offs

- **Browsers older than Chrome/Safari 16.4/Firefox 124 get no control at all** → Accepted per proposal; this is a shrinking slice of the target audience (phones/tablets in a kitchen), and the alternative (video-loop hack) was explicitly rejected above. All major current browser engines support the native API, so this mainly affects users on outdated versions.
- **`visibilitychange` re-acquire could theoretically be blocked by a stricter engine requiring a fresh user gesture** → Supported engines (Chromium, Safari 16.4+) re-acquire without a new gesture per spec; if a future engine tightens this, the toggle simply stops working until manually re-tapped, which degrades to today's "Option B" behavior rather than breaking anything.
- **Toggle state and lock state can drift if `wakeLock.request()` rejects for a reason other than visibility (e.g. low battery mode on some platforms)** → Wrap the request in try/catch; on failure, revert the toggle to its "off" visual state rather than showing a false "on" state.

## Migration Plan

Purely additive UI change to one page; no data migration, no feature flag needed. Ships in the normal deploy flow.
