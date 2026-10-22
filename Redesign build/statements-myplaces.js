// Statements: places from the owner's own statements that the general rules don't know (2026-10-09, sorted
// with the owner). They go first in RULES, so they win over the general patterns; a category the owner
// picks in the page (D.rules, or one changed by hand) still wins over these. Unsorted transactions are
// re-sorted on every load, so adding a place here moves existing ones too.
// The list itself is personal, so it lives in Redesign build/personal/myplaces.js; without it this step does nothing.
// Called by build-fa.js after statements-unsorted.js.
const PLACES = require("./personal.js")("myplaces.js");
module.exports = function statementMyPlaces(h) {
  if (!PLACES) return h;
  const anchor = "const RULES = [\n", n = h.split(anchor).length - 1;
  if (n !== 1) throw new Error("statement my-places: anchor x" + n);
  const rows = PLACES.map(([c, re]) => `  [${JSON.stringify(c)}, ${re.toString()}],\n`).join("");
  return h.replace(anchor, () => anchor + "  // Places from your own statements (Redesign build/statements-myplaces.js)\n" + rows);
};
