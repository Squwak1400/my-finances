// Transactions in a year view (2026-10-11, owner asked): the list showed only the newest 150 rows, so whole
// months hid under "Show all" at the bottom of a very long page. A year now lists every transaction, newest
// first, under a heading per month (count, money in, money out), and a row of month buttons in the pinned
// search bar jumps straight to a month and marks the one you're reading. A single month keeps the 150 cap.
// Called by build-fa.js after statements-years.js.
module.exports = function statementTxYear(h) {
  const rep = (from, to, label) => { const n = h.split(from).length - 1; if (n !== 1) throw new Error("statement tx-year: anchor x" + n + ": " + label); h = h.replace(from, () => to); };

  /* ---------- The month buttons live in the pinned search bar ---------- */
  rep('<select id="txCat" aria-label="Filter by category"></select>',
    '<select id="txCat" aria-label="Filter by category"></select><nav id="txJump" class="tx-jump hidden" aria-label="Jump to a month"></nav>', "jump bar");

  /* ---------- Year: every row, newest first, a heading per month ---------- */
  rep('  const opts = sel => TX_CATS.map(k => `<option ${k === sel ? "selected" : ""}>${esc(k)}</option>`).join("");\n  $("#txTable").innerHTML = rows.length',
    `  const yr = stMonth.length !== 7, lim = yr ? 1e9 : txLimit;
  if (yr) rows.sort((a, b) => b.date.localeCompare(a.date));
  const sums = {}; if (yr) rows.forEach(t => { const s = sums[monthOf(t.date)] = sums[monthOf(t.date)] || { n: 0, inn: 0, out: 0 }; s.n++; if (t.amount > 0) s.inn += t.amount; else s.out -= t.amount; });
  const head = (t, p) => { if (!yr || (p && monthOf(p.date) === monthOf(t.date))) return ""; const k = monthOf(t.date), s = sums[k];
    return \`<tr class="tx-mon" id="txm-\${k}"><th colspan="5"><b>\${monthName(k)}</b><span>\${s.n} transaction\${s.n > 1 ? "s" : ""} · <span class="pos">+\${fmt(s.inn, 2)}</span> in · <span class="neg">−\${fmt(s.out, 2)}</span> out</span></th></tr>\`; };
  const opts = sel => TX_CATS.map(k => \`<option \${k === sel ? "selected" : ""}>\${esc(k)}</option>\`).join("");
  $("#txTable").innerHTML = rows.length`, "year rows setup");
  rep('${rows.slice(0, txLimit).map(t => `<tr data-tid=', '${rows.slice(0, lim).map((t, i, a) => head(t, a[i - 1]) + `<tr data-tid=', "month headings");
  rep('${rows.length > txLimit ? `<button id="txMore"', '${rows.length > lim ? `<button id="txMore"', "no cap in a year");
  rep('  const more = $("#txMore"); if (more) more.onclick = () => { txLimit = 1e9; txTable(); };\n}',
    '  const more = $("#txMore"); if (more) more.onclick = () => { txLimit = 1e9; txTable(); };\n  txJumpDraw(yr ? Object.keys(sums) : []);\n}', "draw jump");

  rep("function txTable() {", `// Month buttons for a year: jump to a month's heading, just below the pinned bars
function txJumpDraw(months) {
  const nav = $("#txJump"); if (!nav) return;
  nav.classList.toggle("hidden", months.length < 2);
  nav.innerHTML = months.length < 2 ? "" : months.map(k => \`<button type="button" data-txm="\${k}" title="\${monthName(k)}">\${monthName(k, { month: "short" })}</button>\`).join("");
  nav.querySelectorAll("[data-txm]").forEach(b => b.onclick = () => {
    const row = $("#txm-" + b.dataset.txm); if (!row) return;
    window.scrollTo({ top: row.getBoundingClientRect().top + scrollY - txPinned() + 1, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  });
  txJumpMark();
}
// Height of what's pinned at the top (month bar + search bar), so a jump lands just under it
const txPinned = () => ($("#stBar") ? $("#stBar").offsetHeight : 0) + (document.querySelector("#st-tx .txctl") ? document.querySelector("#st-tx .txctl").offsetHeight : 0);
// Mark the month being read: the last heading that has scrolled up under the pinned bars
function txJumpMark() {
  const nav = $("#txJump"); if (!nav || nav.classList.contains("hidden")) return;
  const line = txPinned() + 8; let cur = null;
  document.querySelectorAll("#txTable tr.tx-mon").forEach(r => { if (r.getBoundingClientRect().top <= line) cur = r.id.slice(4); });
  if (!cur) { const f = document.querySelector("#txTable tr.tx-mon"); cur = f && f.id.slice(4); }
  nav.querySelectorAll("[data-txm]").forEach(b => { const on = b.dataset.txm === cur; if (on !== (b.getAttribute("aria-current") === "true")) { if (on) { b.setAttribute("aria-current", "true"); b.scrollIntoView({ block: "nearest", inline: "nearest" }); } else b.removeAttribute("aria-current"); } });
}
{ let q = false; addEventListener("scroll", () => { if (q) return; q = true; requestAnimationFrame(() => { q = false; txJumpMark(); }); }, { passive: true }); }
function txTable() {`, "jump helpers");

  rep("</style>", `
/* ==== Transactions: a year by month, with month buttons in the pinned bar ==== */
.tx-jump { flex: 1 1 100%; display: flex; gap: 4px; overflow-x: auto; scrollbar-width: thin; padding-bottom: 2px; }
.tx-jump button { flex: 0 0 auto; min-height: 30px; padding: 4px 10px; font-family: var(--mono); font-size: 12px; background: var(--btn-face); color: var(--text-2); border: 1px solid var(--btn-edge); border-radius: 0; box-shadow: none; }
.tx-jump button:hover { color: var(--text); border-color: var(--muted); }
.tx-jump button[aria-current="true"] { background: var(--accent); border-color: var(--accent); color: var(--surface); }
table.tx tr.tx-mon th { text-align: left; padding: 18px 8px 6px; border-bottom: 1px solid var(--text); font-weight: normal; text-transform: none; letter-spacing: 0; color: var(--text); background: transparent; }
table.tx tr.tx-mon:first-child th { padding-top: 8px; }
table.tx tr.tx-mon b { font-size: 15px; margin-right: 10px; }
table.tx tr.tx-mon th > span { font-family: var(--mono); font-size: 11.5px; color: var(--muted); }
@media (max-width: 600px) { .tx-jump button { min-height: 36px; } table.tx tr.tx-mon th > span { display: block; margin-top: 2px; } }
</style>`, "css");
  return h;
};
