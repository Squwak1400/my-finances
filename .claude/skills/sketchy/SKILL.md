---
name: sketchy
description: Hand-drawn "sketchy" redesigns and infographics for a website or app, built in code (HTML/CSS/SVG) from the gpt-image-2 prompt-template library by ConardLi (garden-skills, MIT). Use when the owner says "use sketchy", "sketchify", "sketchnote cover", "use sketchnote cover", "garden-skills cover style", or asks to redesign part of a site/app, or to make an infographic, cover, poster, sticky-note board, cartoon icons or a notebook-style view from part of a site/app, in the hand-drawn style. Picks a template, asks about colours, fills the template into a saved brief, then builds it with live data. Never generates raster/AI images.
---

# Sketchy

Turns a request like *"use sketchy to make an infographic from this part of my app"* or *"use sketchy to redesign this page"* into working code in the hand-drawn style the owner chose for My finances (2026-10-12).

Two halves:
- **The prompt style.** The gpt-image-2 template library is in `references/` (80+ templates in 18 categories, MIT, see `ATTRIBUTION.md`). A template decides the composition, the parts and the wording. Filling it in gives a **brief**: the same structured prompt the original skill would have sent to an image model.
- **The build.** The brief is then drawn in code, never as an image. `code/translate.md` maps template wording to code. `code/techniques.md` holds the proven snippets, such as drawn box edges, hatching, cartoon objects, sticky notes and light-up hover.

Why code and not pictures: figures stay live and exact, things can respond to hover and clicks, nothing is sent to an image service, and it works offline. **Never call an image API, never create PNG/JPG art with a model, and never paste generated images into the site.**

## Workflow

1. **Pin down the request.**
   - **Where:** which site/app and which part (a page, a tab, a card, a chart, a section).
   - **What kind:**
     - **Redesign:** the same content and behaviour, drawn by hand. Usually a skin that can be switched off.
     - **New visual:** an infographic, cover, poster, explainer, map or board made from the site's own data or content.
     - **Standalone page:** an HTML file, e.g. a cover or a printable poster.
   - Read the relevant code first: where the data comes from, the design tokens (CSS custom properties), the fonts, the build pipeline and any CSP.
2. **Pick a template.** Open `references/INDEX.md`, choose the closest category, and read **only** that template file (plus `references/prompt-writing.md` if the request doesn't fit a template cleanly). Mixing two is fine: the My finances cover was hand-drawn + hub-and-spoke.
   - **"Sketchnote cover"** (or "garden-skills cover style", or a screenshot of those covers) means: skip the index and start from `examples/my-finances/sketchnote-cover.md` (part A is the fill-in template). That gives a title in a hand-drawn browser window, 6–9 numbered panels in a ring with a sketch and checkmark notes each, a strip of icon tiles under the hub, a 16:9 page, and pastel washes. Build it per `code/translate.md` → "hub with panels around it". The colour question in step 3 still applies, with the cover's pastels (sage, dusty blue, peach, lavender, mustard) offered beside the site's palette.
3. **Ask, don't guess** (use AskUserQuestion, one round where possible):
   - **Colours, every time.** Options: the site's own palette (only how things are drawn changes), or one of the template palettes. The template palettes are macaron, morandi, kraft, chalkboard, pencil-only, or whichever palette the chosen template defines. Put the site's palette first.
   - The template's must-ask fields that the code and request don't already answer, such as topic, number of items, title, mascot or no mascot.
   - For a new visual: where it should live (inside the app as a new view or option, or a standalone page) and whether it needs a switch back to the current look.
4. **Write the brief.** Fill the template in its own format (JSON or structured natural language), using the owner's words and the site's real labels. Leave figures as references to live data, e.g. "{monthly take-home}", never typed-in numbers. Add a short "Built in code as" note at the end. Save it to `sketchy-briefs/<slug>-<YYYYMMDD-HHMMSS>.md` in the project root and tell the owner the path in one line. Image-only fields (camera, lens, render engine, photo realism) are dropped or translated per `code/translate.md`.
5. **Build it in code**, following `code/translate.md` and `code/techniques.md` and the project's own conventions:
   - Edit build sources, never generated files.
   - Recompute CSP hashes if the project uses them.
   - Use design tokens, not raw colours (unless the owner picked a template palette, which then becomes a set of tokens).
   - Keep content and behaviour identical for a redesign.
6. **Verify** before reporting (`code/techniques.md` → Verification):
   - light and dark mode, desktop and 390px phone width
   - no console errors and no sideways overflow
   - text contrast at 4.5:1 or better
   - tap targets at least 24px
   - labels don't collide
   - reduced motion respected
   - no stair-stepped lines

   Look at the screenshots yourself.
7. **Report.** Say what was built, where the brief is, which files changed, and what was checked. Send the screenshots.

## Style rules that always apply

- **Handwriting for titles and short notes only.** Use Segoe Print, falling back to Ink Free, then cursive. Body text, tables and anything longer than a couple of lines stay in the site's text font. Figures stay in a monospace or tabular font, even inside a handwritten title.
- **Lines look drawn, never broken.** Use SVG strokes or masks for edges and rules. A wobble (displacement) filter is only for icons and chart strokes, never for thin borders.
- **Fills are washes and hatching**, with Ink outlines. No gradients, glass, metal or heavy shadows.
- **Cartoons are simple SVG objects** with a face (dot eyes, small smile, blush). They are cute and readable at 64px.
- **Interactivity is part of the look.** Pointing at an item lights up it and everything linked to it, and dims the rest. Tapping opens the detail. Motion switches off under reduced motion.
- **Calm, readable pages.** At most 5–6 colours, generous whitespace and a clear hierarchy (title > item titles > body > doodles). Doodles are sprinkled, never crowding the information.
- **Professional documents stay professional.** Tax, legal and print-for-someone-else pages keep a plain style unless the owner asks otherwise.

## Credits

The templates in `references/` are from **gpt-image-2** by **ConardLi** (garden-skills, https://github.com/ConardLi/garden-skills), under the MIT licence. Keep `ATTRIBUTION.md` with this skill whenever it is copied or shared. If asked where the style comes from, credit gpt-image-2 / ConardLi.

## Files

- `references/INDEX.md`: every template, by category, with how it becomes code.
- `references/prompt-writing.md`: the original method for turning a request into a template.
- `references/<category>/<template>.md`: the templates, unchanged from gpt-image-2.
- `code/translate.md`: template wording to code.
- `code/techniques.md`: snippets, pitfalls and the verification checklist.
- `examples/my-finances/`: the briefs behind the My finances Notebook work, and where each one landed in code.
- `README.md`: a summary for anyone receiving the skill, with the credit up front.
- `ATTRIBUTION.md`: source and licence of the templates (gpt-image-2 by ConardLi, MIT).
