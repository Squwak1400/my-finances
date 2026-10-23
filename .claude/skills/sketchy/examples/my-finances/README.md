# My finances: the work this skill was made from (2026-10-12)

The owner's offline money-and-taxes app (`My finances.html`, built from `Redesign build/`) got a hand-drawn "Notebook" view. It's switched on in each page's header or on Settings → Appearance. Notebook is the default; Ledger is the original printed look.

| Request | Template(s) | Became |
|---|---|---|
| Hand-drawn look for every personal page | hand-drawn-infographic (palette: the app's own Ledger tokens) | `notebook.css` skin: drawn box masks, handwritten titles, sketch buttons, hatched chart marks, heading icons |
| Advisor's review as a notebook page | hand-drawn-infographic + sticky notes | `#nbMemo`: numbered badges, a hatched take-home bar, a health check with faces, findings as taped sticky notes |
| Day-by-day calendar, scrapbook style | hand-drawn-infographic (pencil variant for shading) | a hatching density per spending level, drawn day boxes, paper tags for figures, a PAY stamp |
| Rule paragraphs (e.g. "What usually applies to travelling and seasonal jobs") as sticky notes | hand-drawn-infographic | `.rules` → sticky notes with tape |
| Where your money went | hand-drawn-infographic → `where-your-money-went-illustrated.md` | the Illustrated view (default) and Jars |
| A cover in the garden-skills style | hand-drawn-infographic + hub layout → `sketchnote-cover.md` | not built yet |

Owner preferences learned here:
- Segoe Print for titles only and Sitka for body text (Ink Free was hard to read in long text).
- Soft rounded sketch buttons.
- Icons on headings.
- Professional documents (the CPA report) stay plain. That report is dark on screen and black on white in print.
- Keep form dropdowns as they are.
- Retired: the sketched money-flow (Sankey) chart.
