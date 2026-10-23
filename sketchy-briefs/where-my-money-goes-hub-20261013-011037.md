# Brief: Where my money goes, centred cartoon infographic (static)

Template: `references/infographics/hand-drawn-infographic.md` + hub-and-spoke layout, palette mapped to the app's Ledger tokens.
Built in code as: `Where my money goes (sketchy).html` in the project root, a standalone static page drawn from one `DATA` array (sample numbers, not real data). Wallet mascot and cartoon objects are SVG with face(); arrows, coins and sparkles are SVG; no hover yet (the later interactive version reuses DATA, GROUPS and the card markup).

---

A hand-drawn educational infographic in the style of a high-quality bullet journal page.

Topic: where one month's take-home pay goes, as a hub: the pay cheque in the middle, every place it goes around it.

Aspect ratio: roughly square on desktop; a single column on a phone.

Background: warm cream paper {--surface} with the faintest dotted grid. Two short strips of washi tape on the centre card. DO NOT use pure white or pure black.

Colour palette (one colour per group, fills are light washes, outlines are ink {--text}):
- Home (Housing, Utilities): teal {--s1}
- Everyday (Groceries, Transportation): ochre {--s4}
- Fun (Dining out, Shopping): sienna {--s2}
- Debt (Debt payments): plum {--s5}
- Savings (Saved): green {--s3}

Title: "Where my money goes" hand-lettered at the top with a wobbly underline. Subtitle: "one month, one pay cheque".

Centre: a smiling wallet mascot tossing coins, on a taped card holding "Take-home pay {total}".

Around it, 8 hand-drawn cards (3 × 3 grid, centre cell = hub), biggest first, clockwise from top-left. Each card has a cute cartoon object with a face, the category name in handwriting, the amount in mono, "{share}% of pay", and a small hatched strip filled to that share. Curvy dotted arrows run from the hub to every card.
  Housing (house) · Groceries (grocery bag) · Transportation (car) · Debt payments (worried credit card) · Dining out (noodle bowl) · Shopping (heart bag) · Utilities (light bulb) · Saved (piggy bank)

Legend along the bottom: the five groups as hatched swatches.

Doodles: a few sparkles and falling coins near the mascot. Hierarchy: title > hub > cards > doodles. Generous whitespace.

Sample figures (made up): pay 5,000; Housing 1,650; Saved 1,180; Groceries 620; Transportation 420; Debt payments 350; Dining out 310; Shopping 280; Utilities 190.
