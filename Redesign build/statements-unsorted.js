// Statements: a separate "Unsorted" category for transactions the app couldn't place. Before this, anything
// unrecognised went to Other and "Still unsorted" listed every Other transaction, so Other couldn't be picked
// on purpose. Now Other is an ordinary category and Still unsorted lists Unsorted. Old data moves over on
// load: an Other row nobody chose (not set by hand, no Other rule for that place) becomes Unsorted.
// Called by build-fa.js after statements-onecat.js.
module.exports = function statementUnsorted(h) {
  const rep = (from, to, label) => { const n = h.split(from).length - 1; if (n !== 1) throw new Error("statement unsorted: anchor x" + n + ": " + label); h = h.replace(from, () => to); };
  const repAll = (from, to, want, label) => { const n = h.split(from).length - 1; if (n !== want) throw new Error("statement unsorted: anchor x" + n + ": " + label); h = h.split(from).join(to); };

  /* ---------- The category: transactions only, never a budget category ---------- */
  rep('const TX_CATS = [...CATS, CCP, "Debt payment", "Saving & investing", "Income", "Transfer", WX];',
    'const UNS = "Unsorted"; // couldn\'t be placed yet; listed under Still unsorted until you pick a category\nconst TX_CATS = [...CATS, CCP, "Debt payment", "Saving & investing", "Income", "Transfer", WX, UNS];', "TX_CATS");
  rep('x.category = TX_CATS.includes(t.category) ? t.category : "Other";', 'x.category = TX_CATS.includes(t.category) ? t.category : UNS;', "sanitize");

  /* ---------- Sorting falls back to Unsorted, not Other ---------- */
  rep('/\\b(rent|landlord)\\b/.test(s) ? "Housing" : "Other";', '/\\b(rent|landlord)\\b/.test(s) ? "Housing" : UNS;', "e-transfer out");
  rep('return looksCard(account) ? "Other" : "Income";\n  }\n  return "Other";\n}', 'return looksCard(account) ? UNS : "Income";\n  }\n  return UNS;\n}', "categorize fallback");
  repAll('.category === "Transfer") t.category = t.amount > 0 ? "Income" : "Other";', '.category === "Transfer") t.category = t.amount > 0 ? "Income" : UNS;', 1, "unlink t");
  repAll('.category === "Transfer") p.category = p.amount > 0 ? "Income" : "Other";', '.category === "Transfer") p.category = p.amount > 0 ? "Income" : UNS;', 1, "unlink p");

  /* ---------- Re-sorting: move old unchosen Other rows over, then retry Unsorted ones ---------- */
  rep('D.transactions.forEach(t => { if (t.category === "Other" && !t.link && !t.manual) { const c = categorize(t.desc, t.amount, t.account); if (c !== "Other") { t.category = c; n++; } } });',
    `D.transactions.forEach(t => { if (t.category === "Other" && !t.link && !t.manual && D.rules[merchantKey(t.desc)] !== "Other") { t.category = UNS; n++; } });
  D.transactions.forEach(t => { if (t.category === UNS && !t.link && !t.manual) { const c = categorize(t.desc, t.amount, t.account); if (c !== UNS) { t.category = c; n++; } } });`, "resort");

  /* ---------- Still unsorted lists Unsorted; Other is a normal choice there ---------- */
  rep('D.transactions.filter(t => t.category === "Other" && !t.link).forEach(t => {', 'D.transactions.filter(t => t.category === UNS && !t.link).forEach(t => {', "unsorted list");
  rep('TX_CATS.filter(c => c !== "Other").map(', 'TX_CATS.filter(c => c !== UNS).map(', "unsorted options");
  rep('D.transactions.forEach(t => { if (t.category === "Other" && !t.link && merchantKey(t.desc) === k) { t.category = sel.value; n++; } });',
    'D.transactions.forEach(t => { if (t.category === UNS && !t.link && merchantKey(t.desc) === k) { t.category = sel.value; n++; } });', "unsorted move");

  /* ---------- Transactions: choosing Unsorted by hand puts it back on the list, nothing learned ---------- */
  rep('if (k && s.value !== WX && !TRANSFERISH.test(t.desc)', 'if (k && s.value !== WX && s.value !== UNS && !TRANSFERISH.test(t.desc)', "one-cat learn");

  /* ---------- Budget from statements: unsorted spending is planned as Other ---------- */
  rep('for (const c in s.by) tot[c] = (tot[c] || 0) + s.by[c];', 'for (const c in s.by) { const p = c === UNS ? "Other" : c; tot[p] = (tot[p] || 0) + s.by[c]; }', "use average");
  return h;
};
