---
name: Blueline Redline
description: A field-guide specimen system that identifies risky lease clauses instead of selling them.
colors:
  navy: "#123b5d"
  navy-ink: "#0c2c46"
  paper: "#f6f1e7"
  paper-deep: "#ece3d1"
  red: "#e5453a"
  red-ink: "#c23327"
typography:
  display:
    fontFamily: "Archivo, sans-serif"
    fontSize: "1.5rem – 1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "0.875rem – 1.5rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.05em – 0.14em"
rounded:
  none: "0px"
  soft: "2px"
  pill: "999px"
spacing:
  card-padding-sm: "1.5rem"
  card-padding-md: "2.5rem"
  card-padding-lg: "3rem"
  section-gap: "5rem"
  section-gap-lg: "7rem"
components:
  button-primary:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.paper}"
    typography: "{typography.display}"
    rounded: "{rounded.none}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.navy-ink}"
    textColor: "{colors.paper}"
  badge-alert:
    backgroundColor: "{colors.red-ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "4px 8px"
  badge-neutral:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "4px 8px"
---

# Design System: Blueline Redline

## Overview

**Creative North Star: "The Field Guide"**

Blueline Redline's landing world reads a lease clause the way a naturalist field guide reads a specimen: identified, labeled, and cited — never pitched. The build refuses the category default of hero claim, feature grid, and testimonial carousel; the first viewport is the specimen card itself, at rest, doing the identification live. Everything locks to a strict shared grid of 2px navy rules; nothing floats free of a border. Paper is the ground the specimen sits on, navy is the ink that does the identifying (labels, leader lines, structure, body), and signal red is rationed to exactly one job — marking the cited, diagnostic phrase and the severity/alert state. It is never a button color or a general accent.

The system is calm and procedural rather than persuasive. Density is moderate: generous card padding (2.5–3rem), wide section rhythm (5–7rem between below-fold plates), but tight, exact leader-line geometry inside the specimen itself. Confirmed visual rejection: no hero claim headline, no feature-icon grid, no testimonial carousel, no rounded "SaaS card" chrome, no flat zero-blur block shadow (the craft floor rejected the original hard-offset shadow during finish review; the shipped shadow is a real two-layer offset+blur elevation, documented below).

**Key Characteristics:**
- Paper-ground specimen cards bordered in solid 2px navy, radius-0, holding diagnostic content the way a museum plate holds a labeled specimen.
- Signal red reserved to the cited mark and the alert-severity badge only; every other UI color role runs on navy/paper.
- A three-voice type system — Archivo for structural/display and label text, Source Serif 4 for prose and the clause itself, JetBrains Mono for data/citation labels — never interchanged.
- Runtime-measured SVG leader lines connecting cited phrases to margin labels, drawing on via `stroke-dashoffset` on viewport entry.
- Two-layer soft elevation shadow (not a flat block shadow) reserved for the specimen hero card and the "Proposed edit" counter-offer card.

## Colors

A two-ink palette (navy, red) on a warm paper ground, with red held to near-zero surface area outside its two diagnostic jobs.

### Primary
- **Blueprint Navy** (#123b5d): the system's structural ink — borders (2px, everywhere), body text on light grounds, nav/footer wordmark, primary button fill, leader-line-adjacent chrome, outlined neutral badges.
- **Navy Ink** (#0c2c46): darker navy for running body text color (`--color-navy-ink`, used as the actual text color against paper) and the primary button's hover fill.

### Secondary
- **Signal Red** (#e5453a): reserved for the `.cited-mark` highlight/underline on the diagnostic clause phrase, the leader-line stroke, and the focus-visible outline / text-selection color. Large-mark and stroke uses only — passes contrast at those sizes/weights.
- **Red Ink** (#c23327): the required substitute for small red text-on-paper or paper-text-on-red uses (severity badges, "Preference match" badge). `--color-red` alone measured ~3.14–3.56:1 at badge scale — below WCAG 2.1 AA's 4.5:1 — while `--color-red-ink` measures ~4.92–4.99:1. This is a governing rule, not a one-off fix: any small-scale red text or red-fill badge uses `--color-red-ink`; `--color-red` is for backgrounds/borders/large marks/strokes only.

### Neutral
- **Paper** (#f6f1e7): the specimen-card ground and page background.
- **Paper Deep** (#ece3d1): secondary surface for recessed/callout panels (checklist card, Q&A/red-lines cards, the specimen card's citation footer strip) — one step darker than Paper, still warm, never gray.

### Named Rules
**The Reserved Red Rule.** Signal red marks exactly two things: the cited/diagnostic phrase and an alert-severity state. It is never a button color, a link color, a decorative accent, or a general-purpose highlight. If a new surface wants red for anything else, it is not following this system.

**The Red-Ink Substitution Rule.** Any red at text scale or in a small filled badge uses `--color-red-ink` (#c23327), never `--color-red` (#e5453a). `--color-red` is reserved for borders, strokes, and large marks where its contrast already clears AA. This rule exists because the base red fails AA small-text contrast; treat it as load-bearing, not stylistic.

## Typography

**Display Font:** Archivo (with sans-serif fallback)
**Body Font:** Source Serif 4 (with Georgia, serif fallback)
**Label/Mono Font:** JetBrains Mono (with monospace fallback)

**Character:** A field guide's own register — a serious serif for the specimen prose (the clause text itself and running copy), a bold grotesque for structural headings and the one CTA, and a tight uppercase mono for every data label, citation, and badge, the way a museum plate types its Latin name in a different face than its description.

### Hierarchy
- **Display** (700, 1.5rem–1.875rem / `text-2xl`–`text-3xl`, leading-tight): section headings ("Absence gets reported too," "How to read this guide"), nav wordmark, footer wordmark, the CTA button label (uppercase, tracked wide).
- **Body** (400–500, 0.875rem–1.5rem, leading-relaxed): the demo clause itself (largest body use, `text-xl`–`text-2xl` on the hero), section copy (`text-base`), card copy and Q&A answers (`text-sm`). Measure is capped informally by each card's own width; no line runs the full viewport.
- **Label** (700, 0.75rem, uppercase, tracked 0.05em–0.14em): every citation line ("Source: sample lease, Section 8(c)"), specimen kicker ("Specimen — Early Termination Clause"), badge text ("Severity: High," "Matters if," "Not found," "Preference match"), field-note terms, footer/nav meta.

### Named Rules
**The Three-Voice Rule.** Archivo is structure and action, Source Serif 4 is prose and the specimen itself, JetBrains Mono is data and citation. A given piece of text uses exactly one voice for its role; the mono voice never carries prose, and the serif voice never carries a label or a citation line.

## Layout

The page runs on a bordered, non-rounded grid: an outer container at `max-w-6xl` (nav, footer) narrowing to `max-w-4xl`/`max-w-3xl` for below-fold content plates, so the specimen card and its neighbors read as inset plates rather than an edge-to-edge composition. The hero specimen card itself is a two-column grid (`1.6fr / 1fr` at `md:` and above, single column below) holding clause text against its margin labels — the exact grid the leader lines are measured against at runtime.

Section rhythm below the fold is wide and deliberate: `gap-20` (5rem) between plates on mobile, `gap-28` (7rem) at `md:`. Card interior padding scales from `1.5rem` (mobile) to `2.5–3rem` (`md:`/`lg:`). Below `md:` (768px), the leader-line SVG is not rendered at all — the specimen collapses to single-column stacked prose and labels with no connecting lines, confirmed correct behavior for narrow viewports rather than a degraded desktop layout.

## Elevation & Depth

The system is flat by default — every card and panel is a 2px solid navy border on paper, zero shadow. Real two-layer offset+blur elevation shadow is reserved for exactly two elements that need to read as physically lifted off the page: the hero specimen card and the "Proposed edit" counter-offer card. A flat, zero-blur hard-offset block shadow was tried and rejected in finish review as a craft-floor violation; the shipped shadow is a soft, diffused elevation shadow in navy, not a hard graphic offset.

### Shadow Vocabulary
- **specimen-lift** (`box-shadow: 0 28px 54px -24px rgba(18,59,93,0.5), 0 10px 22px -14px rgba(18,59,93,0.35)`): the hero specimen card at rest — its full lift off the paper ground.
- **proposed-edit-lift** (`box-shadow: 0 24px 46px -22px rgba(18,59,93,0.5), 0 8px 18px -12px rgba(18,59,93,0.32)`): the counter-offer's "Proposed edit" panel, a slightly quieter version of the same recipe, marking it as the answer to the "As written" panel beside it (which stays flat/bordered, no shadow).

### Named Rules
**The Two-Layer Lift Rule.** Where a card needs to read as elevated, use a two-layer soft shadow in navy (`rgba(18,59,93,…)`) at the values above — never a flat, zero-blur, hard-offset block shadow. A hard offset shadow was tried on this world and rejected; it is not an available device here.

## Shapes

Radius-0 by default: every card, badge, border, and button is a sharp rectangle bordered in solid 2px navy. The only rounded exceptions are functional, not decorative — a 2px radius on the focus-visible outline and the `.cited-mark` highlight (softening a text-level mark, not a container), and a fully pill-shaped scrollbar thumb (`border-radius: 999px`), which is chrome, not card language. The recurring silhouette is the bordered plate: a rectangle with a 2px navy rule, sometimes with a second rule dividing a footer/citation strip from the body (`border-t-2`), and one variant — the "not found" checklist item — that swaps the solid border for a 2px dashed navy border to keep an absence visually distinct from an asserted flag.

## Components

### Buttons
- **Shape:** sharp rectangle, no radius (0px).
- **Primary:** Navy fill (#123b5d), Paper text (#f6f1e7), Archivo 700, uppercase, tracked wide, `px-6 py-3`. The single CTA on the page ("Sign in and try it on your lease").
- **Hover / Focus:** background shifts to Navy Ink (#0c2c46) on hover (`transition-colors`); focus-visible uses the system-wide 2px red outline with 3px offset and 2px corner softening.
- **Secondary / Ghost:** text links (nav "Sign in," footer "Sign in") are Archivo, uppercase, navy, underlined (2px, 4px offset), turning signal red on hover — no button chrome, no fill.

### Badges
- **Alert (filled):** Red Ink fill (#c23327), Paper text, JetBrains Mono 700 uppercase, no radius. Used for "Severity: High" and "Preference match" — states meant to read as urgent.
- **Neutral (outlined):** 2px solid navy border, navy text on paper, same mono/uppercase treatment. Used for conditional states like "Matters if."
- **Absent (dashed):** 2px dashed navy border (not solid, not red) around a "Not found" label plus its description. This is a product-truth distinction, not a style choice: a "not found" checklist item is never a risk flag, so it never borrows the alert or outlined-neutral treatment — dashed is its own, reserved third state.

### Cards / Containers
- **Corner Style:** radius-0.
- **Background:** Paper for primary content plates (hero specimen, "As written"/"Proposed edit" panels); Paper Deep for recessed/callout panels (checklist, Q&A, red-lines cards, the specimen's citation footer strip).
- **Shadow Strategy:** flat/bordered by default; two-layer lift shadow reserved for the hero specimen card and the "Proposed edit" panel only (see Elevation & Depth).
- **Border:** 2px solid navy on every card; the hero specimen and checklist card additionally use an internal `border-t-2` or `border-b-2` rule to separate a footer/citation strip.
- **Internal Padding:** `1.5rem` mobile, `2.5rem`–`3rem` at `md:`/`lg:`.

### Navigation
Single-row header, `max-w-6xl`, bottom-bordered (2px navy). Wordmark in Archivo bold with the "Redline" half of the name set in signal red as the one static (non-diagnostic) use of red in the wordmark. One nav action — an underlined "Sign in" text link, navy at rest, red on hover. No mobile menu, no additional nav items; the same pattern repeats in the footer.

### Specimen Card (signature component)
The hero's defining custom pattern: a two-column bordered plate holding a quoted lease clause (Source Serif 4) with one or more phrases wrapped in `.cited-mark`, each connected by a runtime-measured SVG leader line (`getBoundingClientRect`, redrawn on resize via `ResizeObserver`) to a margin label carrying a badge plus a one-line plain-English gloss. Lines are hidden entirely below `md:` (768px). On entering the viewport (`IntersectionObserver`, 0.3 threshold), leader lines draw on via `stroke-dashoffset` (0.9s) and margin labels fade/settle in 0.6s at a 0.5s delay; `prefers-reduced-motion` disables both and renders the end state immediately. This measured-leader-line pattern is reusable wherever the product needs to connect an exact source phrase to a plain-English explanation — it is the system's signature interaction, not a one-off hero effect.

### Named Adaptation: the cited mark is not a drawn circle
STORY's language called for a "circled" mark on the cited clause. The build did not ship a literal drawn circle. `.cited-mark` (`src/app/globals.css`) is a translucent red-tint background at 14% opacity with a 2px solid red bottom border, intensifying to 38% tint on hover/focus with a fast 0.15s transition, and returning to rest over a slow 1.1s ease-out — described in-code as "the trace of having been read." This is recorded as a deliberate, reviewed translation, not a missed instruction: a literal circle around multi-line wrapped text is a harder and uglier shape to render correctly than a highlight-plus-underline, and the shipped mark carries the same diagnostic-marking idea legibly. Future surfaces should reuse `.cited-mark` as the system's citation-marking convention, not attempt a literal circle.

## Do's and Don'ts

### Do:
- **Do** hold signal red to the cited mark, leader lines, and alert-severity/preference badges only (The Reserved Red Rule).
- **Do** use `--color-red-ink` (#c23327) for any small-scale red text or filled badge; use `--color-red` (#e5453a) only for borders, strokes, and large marks (The Red-Ink Substitution Rule).
- **Do** border every card and panel in solid 2px navy at radius-0; reserve the dashed-navy border exclusively for "not found"/absence states.
- **Do** use the two-layer navy soft-shadow recipe when a card needs to read as elevated (The Two-Layer Lift Rule), and leave every other surface flat.
- **Do** measure leader-line geometry at runtime (`getBoundingClientRect`/`ResizeObserver`) rather than hardcoding coordinates, and respect `prefers-reduced-motion` on every animated element.
- **Do** keep the three type voices separated by role: Archivo for structure/action, Source Serif 4 for prose/specimen text, JetBrains Mono for data/labels/citations.

### Don't:
- **Don't** use a flat, zero-blur, hard-offset block shadow anywhere in this system — it was tried on the elevated cards and rejected in finish review as a craft-floor violation.
- **Don't** use signal red as a button, link, or general accent color; it is reserved to citation and alert states.
- **Don't** merge the "not found" (dashed navy) treatment with a risk-flag or alert badge — absence and risk are product-distinct and must stay visually distinct.
- **Don't** treat the checkmark glyphs in the coverage checklist (BelowFold.tsx) as an established icon system. They are a single incumbent instance, not a documented icon convention — this system otherwise has no icon language, and a future surface should not extend glyph iconography from this one unreviewed use.
