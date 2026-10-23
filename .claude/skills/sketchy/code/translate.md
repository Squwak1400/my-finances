# From template wording to code

A template describes a picture. Each phrase below has a code equivalent that was proven on My finances. Snippets are in `techniques.md`.

| Template says | Build it as |
|---|---|
| warm cream / off-white paper, subtle grain | the site's surface token. Grain is optional; skip it if it hurts text contrast. |
| macaron / morandi / kraft / chalkboard palette | only if the owner picked it: define it as tokens (light and dark) and use those. Otherwise map each role to the site's own tokens. |
| hand-lettered title, NO computer fonts | `font-family: "Segoe Print", "Ink Free", cursive` on headings and short notes only. Body text keeps the site's text font. Figures inside titles are wrapped back into mono. |
| all lines have hand-drawn wobble | box edges and rules: SVG pen-stroke **masks** (`--nb-box`, drawn underline). Icons and chart strokes: the `#nbwob` displacement filter. Never put the filter on thin borders. |
| hand-drawn frame / card / cloud bubble | a drawn box (four overshooting strokes) with a light wash fill, uneven radii (`12px 9px 13px 10px / 10px 13px 9px 12px`) and a slight tilt (±1°). |
| colour fills leave a gap before the outline | the wash sits inset from the outline (inset 5–7px), or the fill is hatching inside an Ink outline. |
| coloured pencil / watercolour shading | diagonal hatching (`repeating-linear-gradient` or the `#nbsketch` filter), with density standing for value. |
| number badge in a hand-drawn circle | an inline grid badge with a `::before` circle border in the accent and a wobble filter, digits in mono. |
| simple doodle icon (1–2 strokes) | an inline SVG in a 24×24 viewBox: stroke in the accent, round caps, wobble filter. |
| cute object with a face / mascot | an SVG object in a 64×64 viewBox: a body path filled with the series colour at 26% into the surface, Ink outline, plus `face(x, y, mood)` (dot eyes, smile or worry, blush). |
| washi tape strips | a small tilted rectangle: the accent at 22% fill, a 45% border, rotate −3°. |
| sticky notes / post-its | a surface-2 note tilted under 1°, tape on top, a handwritten title and a short body, only as tall as its text. |
| curvy arrows, dotted lines | SVG paths with `stroke-dasharray: 4 5` in the muted colour, wobble filter, plus a solid arrowhead. |
| stars, sparkles, hearts, falling coins | small SVG shapes in an accent or warning colour, sprinkled, never over text. |
| hub with panels around it (cover layout) | CSS grid with the hub spanning the middle columns, or flex rings on wide screens. On phones it stacks hub-first. |
| bento grid of mixed modules | CSS grid with `grid-auto-flow: dense` and spans. Every module is a drawn box. |
| big hero number | the site's live figure in mono, large, on a paper tag (surface-2) with tape. |
| chart / bar / KPI | the real chart with sketch marks: hatched fills, wobbly lines, annotations in the hand font (desktop only when space is tight). |
| speech bubble / callout | a drawn box with a small SVG tail, the hand font for 1–2 lines. |
| map with pins | an SVG map with wobbly route strokes and numbered pin badges linked to list items, so both light up together. |
| photo / product render / portrait | the site's existing image in a drawn-box frame, or an SVG illustration. Never generate one. |
| camera, lens, lighting, render engine, aspect ratio | drop the camera, lens and lighting. Aspect ratio becomes the component's proportions (and a print size for posters). |
| "no gradients, shadows, glass" | keep: flat washes, hatching and Ink. The only shadows are a lift on hover and a page shadow if the site already has one. |
| generous whitespace, clear hierarchy | spacing scale from the site; title > item titles > body > doodles. |

## Interaction (not in the templates; always add)

- Hover or focus on an item: it lifts and glows in its colour, linked items (bar slice, pin, legend entry) light up too, and everything else dims to about 40%. A note line spells out the exact figures.
- Tap or Enter opens the underlying detail (transactions, page, record).
- Under reduced motion, wiggles and transitions are off.
- Keyboard: items are buttons with an aria-label that includes the figure.
