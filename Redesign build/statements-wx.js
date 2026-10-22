// Work expenses paid back inside a pay cheque: each work expense can name the pay cheque that repaid it
// (t.wxPay on the expense). That much of the pay cheque counts as money paid back instead of income for
// its month. An amount typed against a pay cheque by an earlier version (t.wx) still counts and can be
// removed. Called by build-fa.js.
module.exports = function statementWx(h) {
  const rep = (from, to, label) => { const n = h.split(from).length - 1; if (n !== 1) throw new Error("statement wx: anchor x" + n + ": " + label); h = h.replace(from, () => to); };

  /* ---------- Data ---------- */
  rep("    if (t.noMatch === true) x.noMatch = true;\n    return x;",
    "    if (t.noMatch === true) x.noMatch = true;\n    if (+t.wx > 0 && +t.wx <= x.amount) x.wx = Math.round(+t.wx * 100) / 100;\n    if (typeof t.wxPay === \"string\" && t.wxPay) x.wxPay = t.wxPay.slice(0, 500);\n    return x;", "sanitize");

  /* ---------- Math: the repaid part of a pay cheque isn't income ---------- */
  rep("function monthStats(k) {", `// How much of each pay cheque repaid work expenses: the expenses linked to it, plus any amount typed against it
function wxRepaid() {
  const m = {};
  D.transactions.forEach(e => { if (e.category === WX && e.amount < 0 && e.wxPay) m[e.wxPay] = (m[e.wxPay] || 0) - e.amount; });
  D.transactions.forEach(t => { if (t.wx > 0) m[t.id] = (m[t.id] || 0) + t.wx; });
  D.transactions.forEach(t => { if (m[t.id] && !(t.category === "Income" && t.amount > 0)) delete m[t.id]; else if (m[t.id]) m[t.id] = Math.min(m[t.id], t.amount); });
  return m;
}
function monthStats(k) {
  const RP = wxRepaid();`, "repaid helper");
  rep('if (t.category === "Income") { if (t.amount > 0) inc += t.amount;', 'if (t.category === "Income") { if (t.amount > 0) { const rp = RP[t.id] || 0; inc += t.amount - rp; wback += rp; }', "month stats");
  rep("function accountTable(cur) {\n  const A = {};", "function accountTable(cur) {\n  const A = {}, RP = wxRepaid();", "account table repaid");
  rep('else if (t.category === "Income" && t.amount > 0) r.inc += t.amount;', 'else if (t.category === "Income" && t.amount > 0) { const rp = RP[t.id] || 0; r.inc += t.amount - rp; r.spend -= rp; }', "account table");

  /* ---------- Card ---------- */
  rep("Repayments are found automatically when the deposit says reimbursement or expense; otherwise set them the same way.",
    "Repayments are found automatically when the deposit says reimbursement or expense; otherwise set them the same way. If an expense was paid back as part of a pay cheque, pick that pay cheque beside it below.", "card text");
  const a = h.indexOf("function wxBalance() {"), b = h.indexOf("\nlet unsortedLimit", a);
  if (a < 0 || b < 0) throw new Error("statement wx: work expense functions not found");
  h = h.slice(0, a) + `function wxBalance() {
  const w = D.transactions.filter(t => t.category === WX), RP = wxRepaid();
  const out = -sum(w.filter(t => t.amount < 0), t => t.amount);
  const back = sum(w.filter(t => t.amount > 0), t => t.amount) + sum(Object.values(RP), v => v) + (D.wxPaid || 0);
  return { w, RP, out, back, owed: out - back };
}
function workExpenses() {
  const { w, RP, out, back, owed } = wxBalance();
  const typed = D.transactions.filter(t => t.wx > 0);
  if (!w.length && !typed.length && !D.wxPaid) { $("#wx").innerHTML = \`<div class="empty">No work expenses marked yet.</div>\`; return; }
  const k = (l, v, cls = "") => \`<div class="card kpi" style="box-shadow:none;background:var(--surface-2);border:0"><div class="label">\${l}</div><div class="value \${cls}" style="font-size:22px">\${v}</div></div>\`;
  const pays = D.transactions.filter(t => t.category === "Income" && t.amount > 0).sort((x, y) => x.date.localeCompare(y.date));
  const byId = new Map(pays.map(t => [t.id, t]));
  const payLabel = t => \`\${balDate(t.date)} · \${t.desc.length > 26 ? t.desc.slice(0, 25) + "…" : t.desc} · \${fmt(t.amount)}\`;
  // Any pay cheque from the expense date on (claims can take months), grouped by month, closest first
  const picker = e => {
    const next = pays.filter(p => p.date >= e.date), cur = byId.get(e.wxPay);
    const opts = cur && !next.includes(cur) ? [cur, ...next] : next, groups = new Map();
    opts.forEach(p => { const m = monthName(monthOf(p.date)); groups.set(m, [...(groups.get(m) || []), p]); });
    return \`<select class="fld-in wx-in" data-wxexp="\${esc(e.id)}" aria-label="Paid back in which pay cheque"><option value="">Not in a pay cheque</option>\${[...groups].map(([m, ps]) => \`<optgroup label="\${esc(m)}">\${ps.map(p => \`<option value="\${esc(p.id)}" \${p === cur ? "selected" : ""}>\${esc(payLabel(p))}</option>\`).join("")}</optgroup>\`).join("")}</select>\`;
  };
  const rows = [...w.map(t => ({ t, date: t.date, desc: t.desc, paid: t.amount < 0 ? -t.amount : 0, back: t.amount > 0 ? t.amount : 0 })),
    ...typed.map(t => ({ date: t.date, desc: "Typed against pay cheque: " + t.desc, paid: 0, back: t.wx, del: t.id }))].sort((x, y) => y.date.localeCompare(x.date));
  // Expenses still waiting on a repayment first, then the rest by date
  const waiting = r => r.t && r.paid && !byId.get(r.t.wxPay);
  rows.sort((x, y) => waiting(y) - waiting(x));
  const linked = Object.entries(RP).map(([id, v]) => byId.get(id) && \`\${balDate(byId.get(id).date)} pay cheque: \${fmt(v, 2)} paid back\`).filter(Boolean);
  $("#wx").innerHTML = \`<div class="grid g-kpi" style="margin-bottom:12px">\${k("You paid", fmt(out))}\${k("Paid back", fmt(back), back ? "pos" : "")}\${k(owed > 0.5 ? "Still owed to you" : owed < -0.5 ? "Paid back more than recorded" : "All squared up", fmt(Math.abs(owed)), owed > 0.5 ? "neg" : "")}</div>
    <p class="desc" style="margin:0 0 10px">\${owed > 0.5 ? "Submit your claims for anything not paid back yet. " : ""}Paid back as part of a pay cheque? Pick that pay cheque beside the expense, and that much of it counts as money paid back instead of income.\${linked.length ? \` <span style="color:var(--muted)">\${esc(linked.join(" · "))}</span>\` : ""}</p>
    \${D.wxPaid ? \`<p class="desc" style="margin:0 0 10px">\${fmt(D.wxPaid, 2)} was recorded earlier without a pay cheque. <button type="button" id="wxReset" class="linkish">Clear it</button></p>\` : ""}
    <div class="scroll"><table class="data wx-t"><thead><tr><th class="hide-sm">Date</th><th>Description</th><th class="n">Paid</th><th class="n">Paid back</th><th>Paid back in</th></tr></thead><tbody>\${rows.slice(0, 40).map(r => \`<tr><td class="hide-sm" style="white-space:nowrap">\${esc(r.date)}</td><td>\${esc(r.desc)}</td><td class="n">\${r.paid ? fmt(r.paid, 2) : ""}</td><td class="n pos">\${r.back ? fmt(r.back, 2) : r.t && byId.get(r.t.wxPay) ? fmt(r.paid, 2) : ""}</td><td>\${r.t && r.paid ? (pays.length ? picker(r.t) : '<span class="desc">No pay cheques yet</span>') : r.del ? \`<button type="button" class="rm" data-wxdel="\${esc(r.del)}" aria-label="Remove this repayment" title="Remove">✕</button>\` : ""}</td></tr>\`).join("")}</tbody></table></div>\`;
  $("#wx").querySelectorAll("[data-wxexp]").forEach(s => s.onchange = () => {
    const e = D.transactions.find(x => x.id === s.dataset.wxexp); if (!e) return;
    if (s.value) e.wxPay = s.value; else delete e.wxPay;
    persist(); renderStatements();
    toast(s.value ? \`\${e.desc} marked as paid back in the \${balDate(byId.get(s.value).date)} pay cheque\` : \`\${e.desc} marked as not paid back yet\`);
  });
  $("#wx").querySelectorAll("[data-wxdel]").forEach(btn => btn.onclick = () => {
    const t = D.transactions.find(x => x.id === btn.dataset.wxdel); if (!t) return;
    delete t.wx; persist(); renderStatements(); toast("Repayment removed");
  });
  const r = $("#wxReset"); if (r) r.onclick = () => { if (confirm("Clear the repayment recorded earlier without a pay cheque?")) { D.wxPaid = 0; persist(); renderStatements(); } };
}` + h.slice(b);

  rep("</style>", `
/* ==== Work expenses: which pay cheque paid each one back ==== */
.wx-t select.wx-in { width: 100%; min-width: 220px; font-size: 12.5px; }
</style>`, "css");
  return h;
};
