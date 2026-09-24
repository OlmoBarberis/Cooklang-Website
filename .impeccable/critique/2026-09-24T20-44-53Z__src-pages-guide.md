---
target: Guide section pages
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/home/gunghio/GitProjects/CookLang Website/src/pages/guide"
timestamp: 2026-09-24T20-44-53Z
slug: src-pages-guide
---
Method: dual-agent (A: design review · B: detector + CDP browser evidence)

## Design Health Score: 24/40 (Acceptable)
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Chapter position + aria-current good; no length cue |
| 2 | Match System / Real World | 2 | English timer units; raw ~{30%minutes} in callouts |
| 3 | User Control and Freedom | 3 | Last chapter dead-ends |
| 4 | Consistency and Standards | 3 | One callout style for caption/warning/note |
| 5 | Error Prevention | 2 | Authoring slips leak; hero crops informational images |
| 6 | Recognition Rather Than Recall | 2 | No TOC; reference data as prose |
| 7 | Flexibility and Efficiency | 1 | No anchors/jump links |
| 8 | Aesthetic and Minimalist Design | 3 | Spreadsheet thumbnails, heavy bolding |
| 9 | Error Recovery | 3 | Unstyled default 404 |
| 10 | Help and Documentation | 2 | Two sous-vide guides indistinguishable |

## Design Specificity
Partly authored: system carries over cleanly; reading surface is a generic article template that ignores the guides' reference-data nature. Detector: 24 advisory design-system drift findings (13 in new files); browser: undersized-ui-text on .guide-card-meta (10.24px @375), line-length ~89ch on p.step-text @1440; em-dash-overuse and cream-palette false positives. No overflow; contrast AA everywhere; heading outline valid; tap targets 22-34px.

## Priority Issues
1. [P1] Reference data broken/unscannable — raw timer syntax in notes, English units, run-on "Tabella" prose. clarify/harden
2. [P1] Hero crops informational images; alt repeats h1. adapt
3. [P2] Reading measure too wide (68ch at 16px); italic-serif callouts, no warning variant. typeset
4. [P2] "4capitoli" typo in .collection-kind; last chapter dead-end. polish
5. [P3] Tap targets <44px (nav pill, back, crumb, tag, Fonte); meta 10px on mobile. adapt

## Persona Red Flags
Casey: truncated back label, no TOC on ~3000px guide, tables not glanceable. Sam: small targets, alt=h1, 10px meta, italic serif blocks. Jordan: duplicate-looking guides, no "start at chapter 1", CBT unexplained.

## Minor Observations
Spreadsheet thumbnails in chapter list; "Guide" twice in header; bright hero in dark mode; half-empty desktop grid; default 404.

## Questions
Tables vs prose / lookup tool? Merge single guide into collection intro? Keep-awake mode for guides?
