// Transactions: changing a category changes only that transaction. Other transactions from the same place
// (and future statements) are offered in a bar above the list, not changed on the spot: a coffee at Shell
// isn't gas. A place sorted two different ways stops being learned, and a category picked by hand
// (t.manual) is never re-sorted automatically. Called by build-fa.js.
module.exports = function statementOneCat(h) {
  const rep = (from, to, label) => { const n = h.split(from).length - 1; if (n !== 1) throw new Error("statement one-cat: anchor x" + n + ": " + label); h = h.replace(from, () => to); };

  /* ---------- Data: remember which categories were picked by hand ---------- */
  rep("    if (t.noMatch === true) x.noMatch = true;\n", "    if (t.noMatch === true) x.noMatch = true;\n    if (t.manual === true) x.manual = true;\n", "sanitize");
  rep('D.transactions.forEach(t => { if (t.category === "Cash withdrawals" && !t.link && !(D.rules && D.rules[merchantKey(t.desc)])) {',
    'D.transactions.forEach(t => { if (t.category === "Cash withdrawals" && !t.link && !t.manual && !(D.rules && D.rules[merchantKey(t.desc)])) {', "resort cash");
  rep('D.transactions.forEach(t => { if (t.category === "Other" && !t.link) { const c = categorize(',
    'D.transactions.forEach(t => { if (t.category === "Other" && !t.link && !t.manual) { const c = categorize(', "resort other");

  rep("Fix any category that's wrong. I'll remember it and sort that merchant the same way from now on.",
    "Fix any category that's wrong. Only that transaction changes; I'll ask before changing others from the same place.", "card text");

  /* ---------- The bar ---------- */
  rep('<select id="txCat" aria-label="Filter by category"></select></div>',
    '<select id="txCat" aria-label="Filter by category"></select><div id="txAsk" class="tx-ask hidden" role="status" aria-live="polite"></div></div>', "ask bar");

  /* ---------- Change one; offer the rest ---------- */
  rep(`    const k = merchantKey(t.desc); t.category = s.value;
    let n = 0;
    // Learn the merchant, but never from e-Transfers or transfers, which share one description for many different people
    if (k && s.value !== WX && !TRANSFERISH.test(t.desc) && !ETRANSFER.test(t.desc.toLowerCase())) {
      D.rules[k] = s.value;
      D.transactions.forEach(x => { if (x !== t && !x.link && Math.sign(x.amount) === Math.sign(t.amount) && merchantKey(x.desc) === k && x.category !== s.value) { x.category = s.value; n++; } });
    }
    persist(); toast(n ? \`Updated \${n} other \${prettyMerchant(t.desc)} transaction\${n > 1 ? "s" : ""} too\` : "Category saved"); renderStatements(); renderAll(false);`,
  `    const k = merchantKey(t.desc); t.category = s.value; t.manual = true;
    TX_ASK = null;
    // Never learned from e-Transfers or transfers, which share one description for many different people
    if (k && s.value !== WX && !TRANSFERISH.test(t.desc) && !ETRANSFER.test(t.desc.toLowerCase())) {
      // A place sorted two different ways isn't learned for future statements
      if (D.rules[k] && D.rules[k] !== s.value) delete D.rules[k];
      const n = txSame(k, t.amount, s.value).length;
      if (n || D.rules[k] !== s.value) TX_ASK = { k, cat: s.value, sign: Math.sign(t.amount), name: prettyMerchant(t.desc) };
    }
    persist(); toast("Category saved for this transaction"); renderStatements(); renderAll(false); txAskDraw();`, "change handler");

  rep("function useAverage() {", `// Other transactions from the same place, same direction (money in or out), not already in this category
const txSame = (k, amount, cat) => D.transactions.filter(x => !x.link && Math.sign(x.amount) === Math.sign(amount) && merchantKey(x.desc) === k && x.category !== cat);
let TX_ASK = null;
function txAskDraw() {
  const box = $("#txAsk"); if (!box) return;
  const a = TX_ASK, n = a ? txSame(a.k, a.sign, a.cat).length : 0;
  if (!a || (!n && D.rules[a.k] === a.cat)) { box.classList.add("hidden"); box.innerHTML = ""; return; }
  box.innerHTML = \`<span>\${n ? \`Also change the other <b>\${n}</b> \${esc(a.name)} transaction\${n > 1 ? "s" : ""} to <b>\${esc(a.cat)}</b>, and future ones?\` : \`Sort future \${esc(a.name)} transactions as <b>\${esc(a.cat)}</b> too?\`}</span><button type="button" class="primary" id="txAskAll">\${n ? "Change all" : "Yes"}</button><button type="button" id="txAskOne">\${n ? "Just this one" : "No"}</button>\`;
  box.classList.remove("hidden");
  $("#txAskAll").onclick = () => {
    const xs = txSame(a.k, a.sign, a.cat);
    xs.forEach(x => { x.category = a.cat; delete x.manual; });
    D.rules[a.k] = a.cat; TX_ASK = null;
    persist(); toast(xs.length ? \`Changed \${xs.length} more \${a.name} transaction\${xs.length > 1 ? "s" : ""}; future ones will follow\` : \`Future \${a.name} transactions will be \${a.cat}\`);
    renderStatements(); renderAll(false); txAskDraw();
  };
  $("#txAskOne").onclick = () => { TX_ASK = null; txAskDraw(); };
}
function useAverage() {`, "ask helpers");

  rep("</style>", `
/* ==== Transactions: change one, offer the rest ==== */
.tx-ask { flex: 1 1 100%; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; padding: 10px 12px; background: var(--foil-wash); border-left: 2px solid var(--accent); font-size: 13.5px; }
.tx-ask span { flex: 1 1 260px; }
</style>`, "css");
  return h;
};
