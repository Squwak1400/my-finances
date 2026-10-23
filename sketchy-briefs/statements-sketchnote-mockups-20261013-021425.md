# Brief: Statements graphs as sketchnote covers (mockups)

Template: `examples/my-finances/sketchnote-cover.md` part A, palette = the app's Ledger tokens (same as "Where my money goes (sketchnote cover).html").
Built in code as: `Statements sketchnote mockups.html` in the project root (standalone, sample numbers, `?m=actual|months|changes|merchants|cards` shows one). The app itself is unchanged.

Shared frame for every cover: the hub is a hand-drawn browser window (title, wallet mascot, one sketched version of the real chart), a row of 5 icon tiles under it, numbered panels in a ring (8 or 6) joined by dotted arrows, a legend and leafy sprigs along the bottom. Worried faces mark anything over plan, worse than last month, or charged interest.

1. Actual vs planned, by category: hub = hatched bar per category with a dashed plan tick, over-plan bars in red. Panels = 8 categories: {actual} of {plan}, a meter with the plan line, "{left}" or "{over}". Tiles: Spent, Planned, On or under, Over plan, Extra saved.
2. Money in and out by month: hub = sketched grouped bars (in / spending + debt) for 6 months with "+{kept}" on top. Panels = 6 month calendars: +{kept}, in, out + debt. Tiles: Average in, Average out, Best month, Toughest, In the green.
3. What changed since last month: hub = diverging bars around zero (green = good move, red = costs more). Panels = the 6 biggest moves: ▲/▼ {change}, was / now. Tiles: last month, this month, spending change, biggest drop, moves in your favour.
4. Where you spent the most: hub = one dollar bar split into the top 8 places plus "everywhere else". Panels = top 8 merchants: {amount}, share, visits and average per visit, category. Tiles: Places, Visits, Most visits, Average visit, Biggest.
5. Credit cards: paid in full?: hub = a card × month grid of ✓ / ✗ circles. Panels = 6 months with a happy or worried card, what was paid on each card, and a PAID IN FULL / INTEREST CHARGED stamp. Tiles: Clean months, Interest paid, Fees, a streak per card.
