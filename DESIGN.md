---
name: My finances
description: A private, offline ledger for one person's money and taxes; a cream paper folio on a desk, two volumes in one book.
colors:
  ledger-teal: "#1b4b5a"
  sealing-sienna: "#a04a2a"
  ledger-teal-night: "#86b9bd"
  sealing-sienna-night: "#e2906a"
  wants-teal: "#5a8f9a"
  wants-teal-night: "#46808a"
  paper: "#f3eedf"
  paper-shade: "#ebe4d0"
  paper-edge: "#e4dbc3"
  desk-cream: "#dcd2b8"
  desk-cream-rule: "#c3b795"
  desk-cream-soft: "#554e3f"
  ink: "#1a1a18"
  ink-soft: "#4a463b"
  pencil: "#6a6350"
  rule: "#c9bfa5"
  faint-rule: "#ddd4bd"
  night-paper: "#23201a"
  night-paper-shade: "#2b2720"
  night-desk: "#15140f"
  night-desk-rule: "#353127"
  night-desk-ink: "#e9e2cf"
  night-desk-soft: "#8e8672"
  night-ink: "#efe8d6"
  night-ink-soft: "#cbc2ab"
  night-pencil: "#9b927b"
  night-rule: "#463f33"
  night-faint-rule: "#353026"
  good: "#2f6b3f"
  warning: "#b8862a"
  serious: "#b0623a"
  critical: "#a03a2a"
  good-night: "#92c69f"
  warning-night: "#d8b46a"
  critical-night: "#ee8f7d"
  chart-green: "#2f6b3f"
  chart-ochre: "#a8812a"
  chart-plum: "#8a4d6e"
  chart-indigo: "#4b4f7c"
typography:
  display:
    fontFamily: "Sitka Display, Sitka Heading, Sitka Text, Cambria, Georgia, serif"
    fontSize: "clamp(36px, 4.4vw, 60px)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.022em"
  headline:
    fontFamily: "Sitka Display, Sitka Heading, Sitka Text, Cambria, Georgia, serif"
    fontSize: "25px"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  figure:
    fontFamily: "Sitka Display, Sitka Heading, Sitka Text, Cambria, Georgia, serif"
    fontSize: "34px"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Sitka Display, Sitka Heading, Sitka Text, Cambria, Georgia, serif"
    fontSize: "21px"
    fontWeight: 400
    lineHeight: 1.22
  body:
    fontFamily: "Sitka Text, Sitka Small, Cambria, Georgia, serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "lnum, tnum"
  note:
    fontFamily: "Sitka Text, Sitka Small, Cambria, Georgia, serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Cascadia Mono, Cascadia Code, Consolas, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.08em"
  data:
    fontFamily: "Cascadia Mono, Cascadia Code, Consolas, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.3
  hand:
    fontFamily: "Segoe Print, Ink Free, cursive"
    fontSize: "inherit"
    fontWeight: 400
    lineHeight: 1.3
rounded:
  none: "0px"
  field: "7px"
  sketch: "10px"
spacing:
  hair: "4px"
  xs: "8px"
  sm: "14px"
  md: "22px"
  lg: "34px"
  xl: "44px"
  folio-x: "52px"
  phone-gutter: "16px"
components:
  button:
    backgroundColor: "color-mix(ink 8%, paper)"
    textColor: "{colors.ink}"
    typography: "{typography.data}"
    rounded: "{rounded.none}"
    padding: "9px 12px"
  button-hover:
    backgroundColor: "color-mix(ink 15%, paper)"
    textColor: "{colors.ink}"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.data}"
    rounded: "{rounded.none}"
    padding: "9px 12px"
  button-primary-hover:
    backgroundColor: "{colors.ledger-teal}"
    textColor: "{colors.paper}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.none}"
    padding: "9px 12px"
  input:
    backgroundColor: "#f8f5ec"
    textColor: "{colors.ink}"
    typography: "{typography.data}"
    rounded: "{rounded.none}"
    padding: "8px 10px"
  pill:
    backgroundColor: "transparent"
    textColor: "{colors.pencil}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "3px 7px"
  plate:
    backgroundColor: "{colors.paper-shade}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.none}"
    padding: "18px 18px 16px"
  tooltip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.data}"
    rounded: "{rounded.none}"
    padding: "8px 10px"
  button-sketch:
    backgroundColor: "color-mix(ink 8%, paper)"
    textColor: "{colors.ink}"
    typography: "{typography.data}"
    rounded: "{rounded.sketch}"
    padding: "9px 12px"
  sticky-note:
    backgroundColor: "{colors.paper-shade}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "18px 16px 14px"
  cpa-sheet-screen:
    backgroundColor: "#1f1d17"
    textColor: "{colors.night-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "44px 50px 36px"
  rail:
    backgroundColor: "{colors.desk-cream}"
    textColor: "{colors.ink}"
    width: "236px"
    padding: "26px 20px 22px"
---

# Design System: My finances

## Overview

**Creative North Star: "The Private Ledger"**

This is one person's account book, kept on their own desk and never sent anywhere. Every screen is a page in a cream folio lying on a desk. The desk is the index rail on the left: the book's name, its two volumes (Vol. I · My finances, Vol. II · Taxes) and a numbered list of sections. The folio is where the reading and writing happen. It reads like a well-kept bound ledger rather than a web dashboard: serif prose, mono figures, hairline rules, margin notes in italic, and no rounded corners anywhere.

The voice is warm, editorial and personal. Figures are told as a story ("You're worth $7,400 this month, up $930 since September"), charts carry handwritten-style annotations, and each section opens with a plain sentence about what it's for. Density is moderate: generous space between sections, tight space inside a group, and long tables are ruled rather than boxed.

The book can be read in two page styles, switched at the top of every page or on Settings → Appearance. **Notebook** is the default, chosen by the owner on 2026-10-12. Sections are hand-drawn boxes, titles are handwritten, charts are pencil-hatched, the calendar is a scrapbook page and longer rules become sticky notes. **Ledger** is the plain printed look described throughout this document. Both styles share every token: Notebook changes how the marks are drawn, not the palette. The CPA report keeps the professional Ledger look in both styles.

The page works fully offline under a strict content-security policy. Fonts are the ones Windows already has (Sitka and Cascadia Mono), nothing loads from the network, and every colour comes from the tokens on `:root`.

**Key Characteristics:**
- A desk and a paper folio. In light mode the desk is cream, one step darker than the paper; in dark mode the desk is near-black and the paper is a dark brown-grey.
- One accent per volume: Ledger Teal for My finances, Sealing Sienna for Taxes.
- Serif for words, mono for numbers and labels.
- Hairline rules instead of boxes; square corners everywhere.
- Margin notes and chart annotations in italic serif, like pencilled notes.
- Motion is a single quiet reveal as content scrolls into view, and it switches off under reduced motion.
- Notebook (default) draws it all by hand: inked box edges, handwritten titles, hatched chart fills, soft sketch buttons, sticky notes. Words stay readable in Sitka, and figures stay in mono.

## Colors

A warm paper-and-ink palette: cream and brown-grey neutrals, near-black ink, and one deep accent per volume.

### Primary
- **Ledger Teal** (`ledger-teal`): the accent for Vol. I · My finances. It marks the current section in the rail, focus rings, links, the top edge of plates, margin-note rules, emphasised words in headings, chart lines and the calendar's spending shades. In dark mode it lifts to **Ledger Teal, night** (`ledger-teal-night`).

### Secondary
- **Sealing Sienna** (`sealing-sienna`): the accent for Vol. II · Taxes, used in exactly the places Ledger Teal is used in Vol. I. It's set on `body.vol-tax`, so switching volume swaps the whole page's accent in one move. In dark mode it becomes **Sealing Sienna, night** (`sealing-sienna-night`). Inside a Taxes chart that needs a second series, Ledger Teal is the second colour, and the same holds the other way round.

### Tertiary
- **Wants Teal** (`wants-teal`, `wants-teal-night`): a lighter teal used only for the "wants" squares in the every-$100 unit chart, so they read apart from the ink-black "needs".

### Neutral
- **Paper** (`paper`): the folio surface, where all reading happens.
- **Paper Shade** (`paper-shade`): plates, calendar days, hovered table rows and the "notice" strips.
- **Paper Edge** (`paper-edge`): the thin edge line under the folio.
- **Desk Cream** (`desk-cream`): the light-mode desk, which is both the rail and the margin around the folio. Its rule is `desk-cream-rule` and its secondary text is `desk-cream-soft`.
- **Ink** (`ink`): body text, headings, primary buttons and the strong 1px rule that opens every section.
- **Ink Soft** (`ink-soft`): descriptions, deks, chart axis text and the bodies of margin notes.
- **Pencil** (`pencil`): mono labels, table headers, captions and anything secondary. It meets 4.5:1 on Paper and Paper Shade.
- **Rule** (`rule`) and **Faint Rule** (`faint-rule`): input borders and quiet dividers between table rows and list items.
- **Night set** (`night-*`): the same roles in dark mode. The desk keeps its original near-black (`night-desk`, `night-desk-ink`, `night-desk-soft`, `night-desk-rule`).

### Status
- **Good** (`good`), **Warning** (`warning`), **Serious** (`serious`) and **Critical** (`critical`) mark state such as "living within means" or a late return, each with a night variant. Owing is shown in Critical text and refunds in Good text.

### Chart series
- After the volume's two accents come `chart-green`, `chart-ochre`, `chart-plum` and `chart-indigo`, in that order. Each has a lighter night variant on the dark `:root`.

### Named Rules
**The One Foil Rule.** Each volume has exactly one accent. Ledger Teal never appears as an accent in Taxes chrome, and Sealing Sienna never appears as one in My finances chrome. The only crossover is the second series inside a chart.

**The Token-Only Rule.** Every colour in the page comes from a custom property on `:root`, so light, dark and both volumes stay in step. No raw hex in component rules.

## Typography

**Display Font:** Sitka Display (with Sitka Heading, Cambria, Georgia)
**Body Font:** Sitka Text (with Sitka Small, Cambria, Georgia)
**Label/Mono Font:** Cascadia Mono (with Cascadia Code, Consolas)
**Hand Font (Notebook):** Segoe Print (with Ink Free), installed on Windows

**Character:** A bookish optical-size serif for everything you read, and a calm, slightly technical mono for everything you count or label. Both are already installed on Windows, so the page stays offline.

### Hierarchy
- **Display** (400, clamp(36px, 4.4vw, 60px), 1.04, −0.022em): the opening sentence of a volume's Overview, capped at about 18ch. Emphasised words are italic in the accent colour.
- **Hero figure** (400, clamp(56px, 7vw, 92px), 0.95, −0.035em) and **days-late counter** (up to 124px): one huge number at most per page.
- **Headline** (400, 25–26px, 1.1–1.15, −0.01em): section titles. The 30px memo letterhead is the largest step.
- **Figure** (400, 34px, 1.05, −0.02em): KPI values. Drops to 28px on phones.
- **Title** (italic 400, 21px): the heading inside a plate. Finding titles are 19px upright.
- **Body** (400, 15.5px, 1.55): prose, with lining tabular numerals throughout. Descriptions are 14.5px in Ink Soft, kept under 70ch, and deks are 17.5px under 56ch.
- **Note** (italic 400, 15px, 1.5): margin notes, chart annotations (14px) and empty states.
- **Label** (mono 500, 10.5–11px, 0.08em, uppercase): eyebrows on KPIs and plates, table headers, the folio-head running title and form labels.
- **Data** (mono 400, 12–13.5px): table numbers, inputs, buttons, tooltips and toasts.

- **Hand** (Notebook only, Segoe Print 400, upright): every h1–h3, plate and sticky-note titles, margin notes (13.5px, 1.6) and chart annotations. Chart annotations switch back to the italic serif under 600px, because the hand font's tall line box makes close labels collide.

### Named Rules
**The Hand-for-Titles Rule.** In Notebook, handwriting is only for titles and short notes. Descriptions, body text, tables and anything longer than a couple of lines stay in Sitka. Ink Free proved hard to read in long text, so Segoe Print comes first. A figure inside a handwritten title is wrapped back into Cascadia Mono (`.nbn`).

**The Words-and-Numbers Rule.** Words are set in serif and numbers in mono. A figure inside a sentence stays in the serif, with tabular lining numerals. Inputs, table figures and buttons are mono.

**The Small-Caps-Label Rule.** Labels are uppercase mono with tracking, set in Pencil. They name things and never shout. Never bold them and never enlarge them past 11px.

## Layout

A two-column shell: a sticky 236px **rail** on the left and the **desk** on the right, which holds a centred **folio** up to 1240px wide with 28px 52px 44px padding. The folio opens with a running head (volume · section on the left, the month or plan on the right) over a 1px Ink rule.

Inside the folio, an Overview uses a **spread**: the main column plus a 248px **margin** for notes and plates, with 46px between them. Below 1180px the margin flows under the main column as an auto-fit grid. Sections are separated by about 44px and open with a block head (headline plus a mono link on the right) over a 1px Ink rule. KPI rows are ruled grids of three, or four on Taxes, divided by vertical Rule lines.

Spacing steps are 4, 8, 14, 22, 34 and 44px: tight inside groups, generous between them.

**Responsive:**
- At 900px and below, the rail becomes a top block: brand, a two-column volume switch, a sideways-scrolling section list where the current section is underlined in the accent, then status and actions.
- The folio loses its shadow and padding drops to 18px 16px. KPI rows become two columns, and two-column layouts stack.
- At 600px and below, the My numbers editor tables become stacked cards with a label on every field. Tables that stay wide scroll sideways with a soft edge shadow on the side that has more.

## Elevation & Depth

Flat by design. Depth comes from the physical metaphor, paper on a desk, and is expressed with exactly one large, soft shadow under the folio. Everything inside the folio is flat and separated by rules and tonal Paper Shade blocks, not shadows.

### Shadow Vocabulary
- **Folio** (`box-shadow: 0 24px 50px -24px rgba(60,45,20,.35)` light; `0 30px 60px -20px rgba(0,0,0,.55)` dark): the page lifting off the desk. Removed on phones.
- **Overlay** (`box-shadow: 0 12px 28px rgba(0,0,0,.25)`): tooltips and toasts, which float above the page.
- **Dialog** (`box-shadow: 0 40px 80px -20px rgba(0,0,0,.6)`, over a `rgba(12,11,8,.62)` backdrop with a 2px blur): the lock and setup dialogs.
- **Calendar lift** (`0 6px 14px -8px rgba(0,0,0,.45)` with a 2px rise): a day square under the pointer.

### Named Rules
**The One Sheet Rule.** Only the folio, overlays and dialogs cast shadows. Cards, plates, KPIs and buttons never do.

## Shapes

Square everything: zero radius on buttons, inputs, pills, plates, dialogs, tooltips, progress bars and calendar squares. Status dots are the only circles. Structure comes from 1px rules: a strong Ink rule opens a section or a table, Rule and Faint Rule divide rows, and a 2–3px accent line marks a plate's top edge or a notice's left edge. Dashed borders are reserved for the file drop zone and ghost buttons.

**The Square Corner Rule.** In Ledger, `border-radius` is 0 everywhere. Any leftover radius, including inline styles inherited from the original pages, is a bug and gets overridden in `theme.css`.

**Notebook shapes.** Buttons are soft sketch keys: 10px radius with slightly uneven corners (`11px 9px 12px 10px / 10px 12px 9px 11px`), and text fields are 7px. The My numbers dropdowns keep their square Ledger shape. A section, KPI or notice is enclosed by a **hand-drawn box**: four pen strokes that overshoot a little at the corners. Each stroke is one SVG mask layer (`--nb-box`, `--nb-box-dash` for notices), stretched only along its own edge, so the wobble stays a few pixels on any size of box. Section heads get one drawn pen-stroke rule instead of the Ink hairline.

**The Inked-Line Rule.** Never put a displacement (wobble) filter on a thin border or rule. It breaks a 1.6px line into 1px stair-steps that read as a rendering glitch. Draw lines as SVG strokes (masks), and keep the wobble filter for icons and chart lines.

## Components

### Buttons
Mono and squared, like a key on the page, not a pill. They must be easy to spot (owner asked 2026-10-11: "I can't see them most of the time").
- **Shape:** square (0px).
- **Default:** a lightly tinted face (`--btn-face`, Ink 8% into Paper) with a 1px edge at Ink 50% (`--btn-edge`) and a 2px bottom edge, Ink mono 12px text. On hover the face deepens (`--btn-face-hi`) and the edge turns Ink; pressing nudges the button down 1px.
- **Primary:** an Ink block with Paper text. On hover it fills with the volume's accent.
- **Ghost:** transparent with a 1px dashed `--btn-edge` border and Ink Soft text, for low-stakes actions (Later, Clear, Show all, the theme switch). On hover it goes solid and tinted.
- **Danger:** default shape with Critical text.
- **Rail buttons:** the same shapes in desk colours (face Desk Ink 9% into Desk, edge Desk Ink 50%). The rail's primary button is Ink on Desk Cream in light mode and cream on near-black in dark mode.

- **Notebook:** buttons keep their faces, edges and colours, but the edge is drawn on a soft 10px sketch outline (dashed for ghost, Ink for primary, Critical for danger). Tabs, chips, the Statements view switch, tiny icon buttons and the tappable rows and marks inside the Notebook Statements cards keep their own shapes. On phones the Ledger/Notebook switch buttons are at least 32px tall.

### Pills
- **Style:** an outlined uppercase mono tag with a 1px border in the text colour and no fill, 10px text, 3px 7px padding.
- **State:** Pencil (neutral), accent (needs attention), Critical (overdue) or Good (done). They may carry a 10px drawn SVG icon.

### Cards / Containers
- **Section ("card"):** no box at all, just a 1px Ink rule on top, a 25px headline, a 14.5px Ink Soft description and the content.
- **Plate:** a Paper Shade block with a 3px accent top edge, an accent mono label, an italic 21px title and buttons. It's used for the "next step" and other margin call-outs.
- **Margin note:** italic serif with a 1px accent rule on the left and an optional accent label.
- **Notice:** a Paper Shade strip with a 2px accent rule on the left.

- **Hand-drawn box (Notebook):** sections, KPIs and Settings cards are enclosed in the drawn box (see Shapes), with 16px 18px 14px padding (14px 10px 12px on phones). Inner cards stay unboxed. Every heading carries a small drawn line icon in the accent, chosen by what the section is about.
- **Sticky note (Notebook):** a group of short rules, such as "What usually applies to travelling and seasonal jobs" or "Where these go on the return", becomes a set of sticky notes. Each note is a Paper Shade sheet tilted under 1°, with a strip of tape whose colour cycles through the accent, `--s2` and `--s4`, washed to 22%. The note has a handwritten 17px title and 14px Sitka body, and is only as tall as its text. A one-column rules list stays plain. The Advisor's review findings use the same notes, with tape and label in the severity colour (Needs attention, Watch, Good to know). The label ink is the severity colour mixed 60% into Ink so it stays legible.

### Inputs / Fields
- **Style:** square, 1px Rule border, mono 13.5px text. In light mode the fill is Paper mixed 40% toward white, and in dark mode it's Night Paper Shade.
- **Focus:** the border turns the accent colour, with a 3px accent ring at 22% opacity.
- **Checkboxes and radios:** native, tinted with the accent and wrapped in their label so the whole line is tappable.

### Navigation
- **Rail:** the brand in 26px italic display, a mono uppercase "PRIVATE LEDGER · OFFLINE" line, then the two volume buttons as ruled rows. The current volume's rule is in desk ink.
- **Section list:** a mono 13px list with lower-case roman numerals (i, ii, iii…) in a 34px column. The current section is in desk ink with a small accent dot to its left.
- **Phone:** the section list becomes one sideways-scrolling line, and the current section is underlined in the accent with a 6px offset.
- **Statements month bar:** a sticky bar with ‹ select ›, the month's In / Spent / Net and arrow-key paging.

### Tables
- **Style:** serif 14.5px rows and mono uppercase 10.5px headers over a 1px Ink rule. Rows are divided by Faint Rule, number columns are mono 13px and right-aligned, and the total row sits under a 1px Ink rule.
- **Hover:** the row fills with Paper Shade.

### CPA report
A plain, professional one-page return summary in the Taxes volume, which never takes the Notebook skin. On screen it is a dark page in both themes, so it doesn't glare (owner, 2026-10-12): the page is `#1f1d17`, ink `night-ink`, labels `night-pencil`, rules `#3a352b`, and the stamp is `sealing-sienna-night`. Printing or saving as PDF gives the same layout in black on white.

### Tooltip and Toast
Ink blocks with Paper mono text, square, carrying the Overlay shadow. The tooltip shows exact chart values.

### Signature: the personal charts
The charts are the reason for the redesign. Each is annotated like a hand-kept book:
- **Net-worth story:** an area line with an italic note at the best month and a dashed "at this pace" projection.
- **Day-by-day calendar:** one square per day, shaded in four steps of the accent mixed into Paper Shade. Rent days are Ink, paydays carry a "PAY" mark, and every shade keeps its text at 4.5:1 or better.
  - **Notebook calendar (scrapbook):** each day is a hand-drawn box, tilted under half a degree. Spending is shown as pencil hatching that gets denser in four steps: light single hatch, then tighter, then cross-hatch, then dense cross-hatch over a 22% accent wash. Housing days are Ink cross-hatch, and no-spend days are dashed boxes. The date and amount sit on small Paper tags, so they read on any shade. Payday is a tilted "PAY" stamp in Good, and becomes a Good dot on phones. The key uses the same swatches.
- **Where your money went (Notebook):** a picker offers two views, Illustrated (default) and Jars. The owner retired Sketched flow on 2026-10-12. Ledger view keeps the original money-flow chart.
  - **Illustrated:** a cute cartoon infographic, with art direction from the hand-drawn infographic template (now in the project's `sketchy` skill), drawn in SVG so figures stay live.
    - A smiling wallet mascot holds a taped tag with the month's pay and where it came from. The wallet looks worried when money came out of savings.
    - A hatched "every dollar that came in" bar sits under it, with one slice per category.
    - Below is a grid of tilted cards, one per category. Each card has a cartoon object with dot eyes, a smile and blush cheeks in `--s5` at 45%: a house, a grocery bag, a noodle bowl, a car, a light bulb, a piggy bank, a credit card with a sweat drop, a box for everything else, and so on. It also shows the handwritten name, a mono amount, "% of pay" and a happy or sad plan sticker. Card fills are a light wash of the card's series colour (`--s5` is kept for debt payments), with Ink line work.
    - Pointing at a card or its slice lights both up. The card lifts with a glow in its colour and its art wiggles (off under reduced motion), and everything else dims to 42%. A note below spells out the amount, its share of pay and the plan. Tapping a card opens its transactions.
  - **Jars:** one jar per category, filled with hatching to spending against plan, with a dashed plan line. A jar over plan heaps over its rim with drips in `--s2`.
  Tapping a card or a jar opens that category's transactions.
- **Statements summary cards (Notebook):** the other five Statements → Summary graphs become compact sketched cards (owner chose the compact v2 over sketchnote covers, 2026-10-13). Each card keeps its heading and description, so it stays about its Ledger size. The Ledger chart and legend are hidden, and a drawn version is rendered from the same figures. Ledger view is untouched.
  - **Shared parts:** a wallet mascot sits in the top-right corner and looks worried when the card's news is bad. A one-line handwritten summary has mono figures in Good or Critical. A swatch legend and a small Sitka footnote close the card.
  - **Rows:** "Actual vs planned", "What changed" and "Where you spent the most" use rows of a 34px cartoon icon (the Illustrated objects, worried when over plan or up), a handwritten name with a Sitka sub-line, a hatched bar and a right-aligned mono figure. Rows that open transactions are plain buttons: no face, no edge and no sketch outline, with a 9% accent wash and a 2px nudge on hover. On phones the bar drops under the name. Plan marks are dashed Ink ticks. "What changed" bars grow left (less, Good) or right (more, Critical) from a centre line, with a rounded `▲ $173` tag outlined in its colour. Merchants carry a circled rank number.
  - **Money in and out:** hatched paired bars per month (money in `--s3`, spending `--s2`, debt payments `--s5` stacked on top), with a mono net above each full month. A partial month is faded and starred, and the selected month is underlined in the accent. At 460px or wider, two sticky notes name the best and tightest month. Tapping a month picks it.
  - **Credit cards: paid in full?:** one column per month with a cartoon credit card (green, amber for fees, red with a sweat drop for interest), a ✓/!/✗ mark per card and a tilted PAID IN FULL / FEE / INTEREST stamp. A red mark is a button that opens that month's fees and interest. Chips below count clean months, interest, fees and each card's streak. A sticky note in Critical warns when charges outran payments. On phones the stamps and per-cell notes are hidden.
- **Notebook chart marks:** bars, areas, waffle squares and progress fills get the sketch treatment: a 20% tint, diagonal hatching in the series colour and a thin outline of the same colour, with a gentle wobble. Lines and dots get the wobble only. Colours stay the series tokens.
- **Every $100:** a 10×10 grid of squares for needs (Ink), wants (Wants Teal), saved (Good) and unassigned (outlined).
- **Road to debt-free:** a horizontal bar per debt that fades out toward its payoff date. The label sits inside the bar's end once the bar passes 60%.
- **Cushion runway:** monthly blocks filled in the accent up to how many months you could coast.
- **Days-late counter:** one giant accent number for an overdue filing.
- **Progress rail:** a vertical line of square stops: done is Ink, now is accent with a soft halo, upcoming is outlined.

## Do's and Don'ts

### Do:
- **Do** take every colour from the `:root` tokens and set the volume's accent through `body.vol-tax`, so one switch recolours the page.
- **Do** open every section with a 1px Ink rule and a 25px serif headline, and divide within it using Rule or Faint Rule.
- **Do** set numbers, inputs, labels and buttons in Cascadia Mono, and words in Sitka.
- **Do** annotate charts with short italic notes that say what the figure means for this person.
- **Do** keep text at 4.5:1 or better on Paper, Paper Shade, every calendar shade and the desk, in both modes.
- **Do** keep the reveal motion behind `prefers-reduced-motion`, and keep content visible by default for print.
- **Do** make phone rows stack with a label on every field instead of scrolling a wide editor table.
- **Do** keep Notebook as a skin over the same markup. Its rules live under `:root.nb` in `notebook.css`, and `notebook.js` only reads what the app renders (plus `window.__nb` for month figures), so Ledger keeps working untouched.

### Don't:
- **Don't** round any corner (`border-radius` stays 0), including inline styles carried over from the original pages.
- **Don't** use both accents as chrome in one volume. Teal belongs to My finances and Sienna to Taxes.
- **Don't** box sections in bordered, shadowed cards. A section is a rule and a headline on the paper.
- **Don't** load web fonts, images or scripts from the network. The page is offline under a strict CSP, and new script means recomputing its hash.
- **Don't** add shadows to anything inside the folio except tooltips, toasts and the calendar's hover lift.
- **Don't** add decorative characters that repeat a label (the old "I / II" after the volume names was removed for that reason).
- **Don't** set long text or any figure in the hand font, and don't use AI-generated images for anything with numbers in it. The hand-drawn look is built in code, so figures stay live and nothing leaves the computer.
- **Don't** give the CPA report the Notebook skin, or a bright white page on screen.
