---
name: Le mie ricette
description: An editorial cookbook archive built for mobile recipe discovery and cooking.
colors:
  paper: "#f8f3ea"
  surface: "#fffaf2"
  inset: "#f0e7d9"
  line: "#d9cbbb"
  ink: "#29231f"
  muted-ink: "#685a50"
  tomato: "#a6402e"
  tomato-deep: "#863322"
  label: "#eadccb"
  blue: "#315d73"
  green: "#42704d"
  night: "#201d1a"
  night-surface: "#2b2622"
  night-inset: "#342d27"
  night-line: "#53483e"
  night-ink: "#f3eadf"
  night-muted: "#c0ad9b"
  night-tomato: "#f09979"
  night-blue: "#90c5db"
  night-green: "#a0d4a1"
typography:
  display:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "clamp(2.2rem, 10vw, 7rem)"
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  recipe-title:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "clamp(2.1rem, 8vw, 6rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  card-title:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "clamp(0.95rem, 3.6vw, 1.65rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 600
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
spacing:
  page-gutter: "clamp(1rem, 4vw, 3rem)"
  card-gap: "1rem"
  section-gap: "3rem"
components:
  search-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.8rem 1.2rem"
  recipe-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "1rem 1rem 1.25rem"
  filter-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0.55rem 0.9rem"
---

# Design System: Le mie ricette

## Overview

**Creative North Star: "The Open Cookbook"**

An editorial recipe blog with the practical structure of a cookbook archive. The interface opens with the collection and search, then lets real recipe images and names carry the page. It is warm and lightly playful through type, rounded details, and tactile controls, while remaining calm enough to use during cooking.

The mobile view is the primary composition. There is no slogan, profile image, or invented editorial copy. Search, tags, ingredients, alphabetical browsing, serving scaling, and cooking checklists stay legible and close to the task.

**Key Characteristics:**
- Large Literata headings and clean DM Sans utility text.
- Warm paper surfaces with tomato accents and food photography.
- Single-column mobile recipe browsing that expands into a measured grid.
- Dark theme with the same hierarchy and warmer high-contrast colors.

## Colors

### Primary
- **Tomato:** active controls, links, focus, and inline ingredient references.
- **Deep Tomato:** darker state for the accent where needed.

### Secondary
- **Blue:** cookware references within instructions.
- **Green:** timer references within instructions.

### Neutral
- **Paper, Surface, and Inset:** the page, cards, and quieter panels.
- **Ink and Muted Ink:** headings, body copy, and supporting text.
- **Line:** soft separators and input borders.
- **Night variants:** warm dark surfaces and brighter semantic accents for dark mode.

**The Recipe Color Rule.** Tomato marks actions and ingredients; blue and green retain their meaning inside recipe steps.

## Typography

**Display Font:** Literata (Georgia fallback)
**Body Font:** DM Sans (system-ui fallback)

**Character:** Expressive serif titles give the collection a cookbook voice. A quiet sans-serif keeps filters, metadata, quantities, and instructions easy to scan.

### Hierarchy
- **Display:** large Literata on the recipe index.
- **Recipe title:** prominent Literata with a compact measure on detail pages.
- **Card title:** medium Literata below each image.
- **Body:** DM Sans for instructions and longer reading.
- **Label:** small DM Sans for controls, counts, and metadata; sentence case is preferred.

**The Reading Rule.** Use the serif for names and headings, and the sans-serif for actions and cooking instructions.

## Layout

A 1320px maximum content width uses fluid side gutters. The homepage search sits immediately under the collection title. Recipe entries form two columns from the narrowest phones, three from 640px, and four from 1024px — mobile is dense grid browsing, not a single scrolling column. A vertical alphabet rail sits at the right edge of the content, held vertically centered in the viewport as you scroll, so jumping to a letter never requires scrolling back up. It's a real column reserved by layout, not an overlay positioned with a guessed offset — its width and clearance from the recipe grid come from flex, not a hand-tuned pixel value.

Recipe detail pages place an image before the title when one exists. Ingredients precede steps on mobile; from 768px they become a sticky side panel beside the method. Tag pages share the card grid and type hierarchy. The layout stays readable when imagery is missing.

## Elevation & Depth

Recipe cards use a low, soft shadow with a real downward offset. Hover lifts a card slightly and deepens the shadow. Search menus float above the page with a stronger shadow. Ordinary dividers remain thin and flat.

**The Quiet Depth Rule.** Shadows distinguish interactive recipe cards and floating menus; they do not create nested card stacks.

## Shapes

Small controls use gently rounded corners. Search and card surfaces use 12px corners; tag and filter controls use pills. Images crop to a 4:3 frame on cards. Step numbers and serving choices use circles as clear, compact interaction marks — smaller on mobile, full size from 768px. Selection state is shown through text, not a checkbox glyph: the checkbox input stays in the markup for accessibility but is visually hidden, and the whole row is one tappable label. Checked/selected feedback is a strikethrough, not a box or a fill.

## Components

### Search and filters
- The search field is full width, tall enough for touch, and visibly outlined on focus.
- Tag and ingredient menus are rounded pill controls with clear open and selected states; the disclosure chevron is a drawn CSS mark, not a text glyph.
- Every filter row is a single tappable `<label>` with no visible checkbox — tap anywhere on the row, selection reads back as a tomato strikethrough on the label text.
- Active tag/ingredient selections render as tomato-tinted pill chips with a remove mark, not neutral gray boxes.
- The alphabet index is a fixed vertical rail pinned to the right edge of the viewport, not a horizontal scrolling bar — it stays reachable at any scroll position and highlights the letter currently in view.

### Recipe cards
- A real food photograph or utensil placeholder leads, followed by concise metadata and a serif name, clamped to two lines.
- The entire card is the link. Hover changes elevation; keyboard focus uses the accent outline.
- Two cards sit side by side even on narrow phones; the grid densifies rather than falling back to one column.

### Recipe reading
- The image, recipe name, labels, and serving metadata precede the cooking content, with clear space below the hero image before the category/tag pills begin. "Inizia a cucinare" (the wake-lock cooking-mode toggle) sits inline with the Porzioni/Fonte metadata as a tomato-outlined pill, filling solid tomato once active.
- Ingredients sit on a warm surface; each row reads quantity first, then name. The checkbox is invisible — tapping the name toggles it, and feedback is the name striking through and fading, not a checked box. The quantity/unit stays an independently editable field so scaling never toggles the checkbox by accident. A "Ripristina dosi originali" control resets it.
- Steps use circular numbers and quiet separators; section headings use Literata.
- Inline ingredients, cookware, and timers retain their semantic colors.

### Navigation
- The header holds the site name on the homepage. On recipe and tag pages it instead shows a contextual "← [Ricette]" back control in the same slot — the header never carries both the brand and a separate back link.
- The theme control stays in the header's trailing position on every page.

## Do's and Don'ts

### Do:
- **Do** keep search immediately findable on phones.
- **Do** let real recipe titles and food imagery provide the editorial content.
- **Do** preserve readable quantities, checkboxes, and steps during cooking.

### Don't:
- **Don't** add a slogan, personal portrait, or invented claims.
- **Don't** make visual effects delay search or recipe reading.
- **Don't** use the serif for dense cooking instructions or filter lists.
