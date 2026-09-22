# Tasks

## 1. Toggle markup and styling

- [x] 1.1 Add a "Start cooking" toggle button to `.recipe-header-row` in `src/pages/recipe/[slug].astro`, next to the back-link, with `hidden` set by default and an icon/label pattern consistent with `.theme-toggle` in `BaseLayout.astro`; verify it renders in the DOM (inspect via dev server) even though hidden.
- [x] 1.2 Style active/inactive states (e.g. icon swap or label swap, matching the site's existing button styling) for both the mobile and desktop layouts already defined on this page; verify visually at both a phone-width and desktop viewport.

## 2. Wake lock behavior

- [x] 2.1 In the page's inline `<script>`, feature-detect `'wakeLock' in navigator` on load and un-hide the toggle only when supported; verify by checking the button stays hidden when the API is stubbed out (e.g. `delete navigator.wakeLock` in devtools console) and appears when it is present.
- [x] 2.2 Wire the toggle click handler to request a wake lock (`navigator.wakeLock.request('screen')`) and flip to the active state on success, or revert to the inactive state if the request throws; verify by toggling on in a supported browser and confirming the OS-level "keep awake" indicator (e.g. Chrome DevTools > Application > Sensors, or observing the screen not auto-locking) is active.
- [x] 2.3 Wire the toggle click handler to release the held sentinel and return to the inactive state when tapped while on; verify the screen resumes normal auto-lock behavior after toggling off.
- [x] 2.4 Add a `visibilitychange` listener that re-requests the wake lock when the page becomes visible again and cooking mode is still "on" (track intent separately from the live sentinel, per design.md); verify by toggling on, switching tabs/apps for a few seconds, returning, and confirming the lock is re-acquired without the button flipping off.
- [x] 2.5 Confirm reloading the page always starts with cooking mode off (no sessionStorage read for this state); verify by toggling on, reloading, and checking the button shows "Start cooking".

## 3. Cross-browser verification

- [x] 3.1 Manually verify on at least one Chromium-based mobile browser (Android Chrome or desktop Chrome device emulation), one Safari 16.4+ (iOS or macOS), and current Firefox (124+, which also supports the API) that the toggle appears, engages, and keeps the screen awake.
- [x] 3.2 Verify the unsupported-browser fallback via feature-detection stubbing (e.g. `delete navigator.wakeLock` in devtools console before reload, since all current major browser versions now support the API natively) confirms the toggle does not render when the API is absent.
