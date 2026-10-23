# Techniques

These are the building blocks proven on My finances. The reference implementation is `C:\Claude Projects\Financial Advisor\Redesign build\notebook.css` and `notebook.js`, documented in that project's DESIGN.md under "Notebook". The snippets below are scoped to a `.sk` class: rename the scope to fit the project, e.g. `:root.nb`, a section id, or a page class.

## 1. Run it as a skin
- Put every rule under one scope class on `<html>` (e.g. `:root.sk`), so the old look is one toggle away. Offer a switch (e.g. "Ledger / Notebook") and remember it in localStorage under the project's key prefix.
- Redraw from what the app renders. A MutationObserver on the section re-runs the decoration (icons, number wrapping) with a ~140ms debounce and a `busy` guard against its own changes.
- For new visuals that need data, expose a tiny read-only hook from the app's own code (e.g. `window.__nb = { monthStats, plannedBy, period, openTx }`). Don't re-implement the maths.
- In a strict-CSP build, the skin script is one more hashed inline script. Never relax the CSP.

## 2. Type
```css
:root { --hand: "Segoe Print", "Ink Free", cursive; }
:root.sk :is(h1, h2, h3) { font-family: var(--hand); font-weight: 400; font-style: normal; letter-spacing: 0; }
:root.sk .note-short { font-family: var(--hand); font-size: 13.5px; line-height: 1.6; }
.sk-num { font-family: var(--mono); font-size: .88em; font-variant-numeric: tabular-nums; } /* figures inside hand titles */
```
- Wrap figures in handwritten text with a regex over the text nodes: `/([−+-]?\$?\d[\d,]*(?:\.\d+)?%?)/`. If the parent is a flex or grid container, wrap the whole text run in one `<span>` first, otherwise the pieces become separate flex items and the heading splits apart.
- In SVG charts, use the hand font for annotations only at widths of 601px and up. Segoe Print's line box is about 1.7em, so close labels collide on phones.

## 3. Drawn box edges: masks, not filters
Four pen strokes, one mask layer per edge. Each layer stretches only along its own edge, so the wobble stays a few px on any size of box.
```css
:root {
  --sk-box:
    url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 8' preserveAspectRatio='none'><path d='M2 4.6C250 3 610 5.6 998 3.4' fill='none' stroke='%23000' stroke-width='1.6' stroke-linecap='round' vector-effect='non-scaling-stroke'/></svg>") 0 0 / 100% 8px,
    url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 8' preserveAspectRatio='none'><path d='M999 3.6C700 4.8 300 2.6 1.4 4.4' fill='none' stroke='%23000' stroke-width='1.6' stroke-linecap='round' vector-effect='non-scaling-stroke'/></svg>") 0 100% / 100% 8px,
    url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 1000' preserveAspectRatio='none'><path d='M4.4 999C3.2 700 5 300 3.8 1.6' fill='none' stroke='%23000' stroke-width='1.6' stroke-linecap='round' vector-effect='non-scaling-stroke'/></svg>") 0 0 / 8px 100%,
    url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 1000' preserveAspectRatio='none'><path d='M3.6 1.2C4.8 300 2.6 700 4.1 998.6' fill='none' stroke='%23000' stroke-width='1.6' stroke-linecap='round' vector-effect='non-scaling-stroke'/></svg>") 100% 0 / 8px 100%;
  /* --sk-box-dash: the same four layers with stroke-dasharray='5 4' on each path */
}
:root.sk .card { position: relative; padding: 16px 18px 14px; }
:root.sk .card::after { content: ""; position: absolute; inset: -3px; pointer-events: none; background: var(--text);
  -webkit-mask: var(--sk-box); mask: var(--sk-box); -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; }
```
- The rule under a heading is one stroke: a mask `viewBox='0 0 400 6'` path `M1 3.4C60 2.3 112 4.3 170 3.2S288 2.1 338 3.7 399 2.6 399 2.6`, 6px tall, `background: var(--text)`.
- Colour the edge through `background` (Ink, the accent, a muted tone). Dashed edges are for notices and empty states.
- A mask data-URI needs `img-src data:` in a CSP (it's usually already allowed).

## 4. Filters
```html
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <!-- wobble: icons, chart lines, circles. NOT thin borders -->
  <filter id="skwob" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7"/>
    <feDisplacementMap in="SourceGraphic" scale="2.6" xChannelSelector="R" yChannelSelector="G"/></filter>
  <!-- sketch: tint + diagonal hatch + outline in the mark's own colour, then a gentle wobble.
       HTML elements: region relative to the box. SVG marks: use a copy with filterUnits="userSpaceOnUse" x="-20" y="-20"
       width="1500" height="800", because the hatch tile sits at the user-space origin and must be inside the region -->
  <filter id="sksketch" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">
    <feImage href="HATCH_TILE" x="0" y="0" width="7" height="7" result="t"/><feTile in="t" result="m"/>
    <feComposite in="SourceGraphic" in2="m" operator="in" result="hatch"/>
    <feComponentTransfer in="SourceGraphic" result="tint"><feFuncA type="linear" slope=".2"/></feComponentTransfer>
    <feMorphology in="SourceAlpha" operator="erode" radius="1.3" result="inner"/>
    <feComposite in="SourceGraphic" in2="inner" operator="out" result="ring"/>
    <feMerge result="all"><feMergeNode in="tint"/><feMergeNode in="hatch"/><feMergeNode in="ring"/></feMerge>
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="w"/>
    <feDisplacementMap in="all" in2="w" scale="2.4" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>
```
`HATCH_TILE = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="7" height="7"><path d="M-1 1l2-2M0 7l7-7M6 8l2-2" stroke="#000" stroke-width="2" opacity=".8"/></svg>')`

Apply: HTML bars `[style*="width:"][style*="background"]` → `filter: url(#sksketch)`; SVG `rect, polygon, path[fill^="var("]` → the user-space copy; SVG lines and dots → `#skwob`. Exclude anything that must stay crisp, such as a calendar if the owner says so, inputs and text.

## 5. CSS hatching (no filter), e.g. calendar levels, swatches, bar slices
```css
.l1 { background: repeating-linear-gradient(-45deg, color-mix(in srgb, var(--accent) 55%, transparent) 0 1.2px, transparent 1.2px 9px); }
.l2 { background: repeating-linear-gradient(-45deg, color-mix(in srgb, var(--accent) 80%, transparent) 0 1.5px, transparent 1.5px 5.5px); }
.l3 { background: repeating-linear-gradient(-45deg, var(--accent) 0 1.6px, transparent 1.6px 5px), repeating-linear-gradient(45deg, color-mix(in srgb, var(--accent) 70%, transparent) 0 1.2px, transparent 1.2px 7px); }
.l4 { background: repeating-linear-gradient(-45deg, var(--accent) 0 2px, transparent 2px 4.5px), repeating-linear-gradient(45deg, var(--accent) 0 1.6px, transparent 1.6px 5px), color-mix(in srgb, var(--accent) 22%, transparent); }
```
Put figures on hatching on a paper tag (`background: var(--surface); padding: 0 3px; border-radius: 3px`) so they read at 4.5:1.

## 6. Sketch buttons, tape, sticky notes
```css
:root.sk button { position: relative; border-radius: 10px; border-color: transparent !important; }
:root.sk button::after { content: ""; position: absolute; inset: -1px; pointer-events: none; border: 1.5px solid var(--btn-edge);
  border-bottom-width: 2.2px; border-radius: 11px 9px 12px 10px / 10px 12px 9px 11px; }
:root.sk button.ghost::after { border-style: dashed; border-bottom-width: 1.5px; }
.tape { position: absolute; top: -9px; left: 50%; width: 62px; height: 16px; margin-left: -31px; transform: rotate(-3deg);
  background: color-mix(in srgb, var(--tp, var(--accent)) 22%, transparent); border: 1px solid color-mix(in srgb, var(--tp, var(--accent)) 45%, transparent); }
.sticky { position: relative; isolation: isolate; padding: 18px 16px 14px; transform: rotate(var(--r, -.7deg)); font: 400 14px/1.55 var(--serif); color: var(--text-2); }
.sticky::before { content: ""; position: absolute; inset: 6px 5px 4px 7px; z-index: -1; background: var(--surface-2); border-radius: 3px; transform: rotate(.5deg); }
.sticky > b { display: block; margin-bottom: 6px; font: 400 17px/1.3 var(--hand); color: var(--text); }
/* vary: nth-child(3n+2) { --r: .6deg; --tp: var(--s2) } nth-child(3n) { --r: -.3deg; --tp: var(--s4) }; grids use align-items: start */
```
Leave tab bars, chips, segmented switches and form selects in their own shapes, so the site stays usable.

## 7. Cartoon objects with faces (64×64)
```js
const face = (x, y, mood = "") => `<g class="face">${mood === "worry" ? `<path d="M${x - 9} ${y - 4.5}l4.5 -2.2M${x + 9} ${y - 4.5}l-4.5 -2.2"/>` : ""}
  <circle cx="${x - 6}" cy="${y}" r="1.9"/><circle cx="${x + 6}" cy="${y}" r="1.9"/>` +
  (mood === "worry" ? `<path d="M${x - 3} ${y + 6}q3 -3 6 0"/>` : `<path d="M${x - 3.2} ${y + 4}q3.2 3 6.4 0"/>`) +
  `<ellipse class="blush" cx="${x - 10}" cy="${y + 4}" rx="2.6" ry="1.5"/><ellipse class="blush" cx="${x + 10}" cy="${y + 4}" rx="2.6" ry="1.5"/></g>`;
const ART = {
  house: `<path class="b" d="M13 31 32 14l19 17v22H13z"/><path class="ln c" d="M8 32 32 10l24 22"/><path class="ln" d="M27 53v-7h10v7"/>${face(32, 34)}`,
  piggy: `<circle class="c f" cx="34" cy="8" r="4.5"/><path class="b" d="M11 35c0-10 9-17 21-17s21 7 21 16c0 6-3 10-7 12v7h-6v-5H26v5h-6v-7c-5-2-9-6-9-11z"/><path class="ln" d="M53 31l5-2M27 18c1-4 6-5 8-2"/>${face(29, 33)}`,
  card: `<rect class="b" x="5" y="17" width="54" height="34" rx="5"/><path class="c f" d="M5 25h54v6H5z"/><path class="drop" d="M54 5c-3 4-3 7 0 7s3-3 0-7z"/>${face(28, 41, "worry")}`
  // full set (bag, bowl, car, shop, bulb, phone, umbrella, tv, ticket, bottle, wallet, gift, suitcase, heart, book, box)
  // and the wallet mascot: Redesign build/notebook.js → renderPic
};
```
```css
.art :is(.b, .w) { fill: color-mix(in srgb, var(--c) 26%, var(--surface)); stroke: var(--text); stroke-width: 2; stroke-linejoin: round; }
.art .ln { fill: none; stroke: var(--text); stroke-width: 2; stroke-linecap: round; } .art .ln.c { stroke: var(--c); }
.art .c.f { fill: var(--c); stroke: var(--text); stroke-width: 1.6; }
.art .face circle { fill: var(--text); } .art .face path { fill: none; stroke: var(--text); stroke-width: 1.8; stroke-linecap: round; }
.art .face .blush { fill: color-mix(in srgb, var(--s5) 45%, transparent); }
.art :is(.b, .ln, .c.f) { filter: url(#skwob); }
```
Pick the object by a regex over the item's name, and fall back to a box with a question mark. Moods: a happy face by default; a worry face for debt, overspending or money taken from savings. The worried brows lift toward the middle; slanting them down looks angry.

## 8. Light-up interaction
```js
// cards and linked marks share data-i; .focus on the container dims everything that isn't .on
const on = i => { root.classList.add("focus"); root.querySelectorAll("[data-i]").forEach(e => e.classList.toggle("on", e.dataset.i == i)); note.innerHTML = describe(items[i]); };
const off = () => { root.classList.remove("focus"); root.querySelectorAll("[data-i].on").forEach(e => e.classList.remove("on")); note.innerHTML = hint; };
root.querySelectorAll("[data-i]").forEach(e => { e.addEventListener("pointerenter", () => on(+e.dataset.i)); e.addEventListener("pointerleave", off);
  e.addEventListener("focus", () => on(+e.dataset.i)); e.addEventListener("blur", off); });
container.onclick = e => { const o = e.target.closest("[data-open]"); if (o) openDetail(o.dataset.open); }; // assign, don't addEventListener on every render
```
```css
.focus :is(.item, .seg):not(.on) { opacity: .42; }
.item.on { transform: rotate(0) translateY(-4px) scale(1.04); background: color-mix(in srgb, var(--c) 18%, var(--surface));
  box-shadow: inset 0 0 0 2px var(--c), 0 0 0 4px color-mix(in srgb, var(--c) 24%, transparent), 0 14px 24px -14px var(--c); }
.item.on .art { animation: sk-wiggle .6s ease-in-out; }
@keyframes sk-wiggle { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-7deg) translateY(-2px); } 60% { transform: rotate(6deg); } }
@media (prefers-reduced-motion: reduce) { .item, .seg { transition: none; } .item.on .art { animation: none; } }
```

## 9. Charts
- **Label spreading:** keep each label at its bar's centre unless it crowds a neighbour. Group crowded labels into clusters centred on their bars; clusters that touch merge, with a gap of at least 34–37px. Draw a pencil leader line from the bar to each moved label. Bar heights stay true.
- **Tap areas:** a narrow bar gets a transparent `<rect class="hit">` over the bar and its label (at least 24px).
- **Jars:** an SVG jar with a clip-path, filled with hatching to spent ÷ plan, and a dashed plan line. When over plan, draw a heap over the rim plus drips. Lay jars out as `grid-row: span 4; grid-template-rows: subgrid`, so names that wrap don't knock a row's figures out of line.
- **Narrow screens:** redraw at the real width instead of scaling an SVG down. Move side labels into a line above the chart.

## 10. Pitfalls (each one bit once)
- A displacement filter on a 1.6px border makes 1px stair-steps. Use masks.
- A single outline image stretched over a tall box pushes the top stroke down through the heading. Use one layer per edge.
- An feImage hatch tile on SVG marks disappears when the tile sits outside the filter region. Use a userSpaceOnUse region.
- A filter turbulence in linearRGB adds steps. Set `color-interpolation-filters="sRGB"`.
- Inserting code with `String.prototype.replace` turns `$$` into `$`. Splice with `slice()` or use `split().join()`.
- Wider card padding can push tables past a phone screen. Shrink the padding under 760px and let lone table wrappers scroll sideways.
- Severity colours such as warning are too faint as 10px text. Mix them about 60% into the text colour.
- Image models garble digits. Never put figures in generated art. (This skill doesn't generate art at all.)

## 11. Verification
Use headless Chrome over CDP with a throwaway profile, never the owner's own browser data. In a project with sample data, load the sample.
- Screenshots at 1360 light, 1360 dark (emulate `prefers-color-scheme`) and 390 phone. Look at them.
- No exceptions or console errors, and `documentElement.scrollWidth` equals the viewport width.
- Contrast 4.5:1 or better on every text element, including text on hatching and tags.
- Interactive elements at least 24×24 on phone; text labels in SVGs don't overlap.
- Hover tested with real mouse events (`Input.dispatchMouseEvent`), plus keyboard focus.
- The old look (switch off) still renders unchanged, and printing still works if the site prints.
- If the project has its own regression sweep (My finances: `Redesign build/tests/sweep.mjs`), run it.
