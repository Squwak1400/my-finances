// Statements tab: a month bar pinned to the top while you scroll, and three views
// (Summary, Transactions, Files) in place of one long page. Called by build-fa.js.
module.exports = function statements(h) {
  const rep = (from, to, label) => { const n = h.split(from).length - 1; if (n !== 1) throw new Error("statements: anchor x" + n + ": " + label); h = h.replace(from, () => to); };

  /* ---------- Markup: split the old cards into the views ---------- */
  const a = h.indexOf('    <div id="stBody" class="hidden">'), endMark = "\n      </div>\n    </div>\n  </section>";
  const b = h.indexOf(endMark, a); if (a < 0 || b < 0) throw new Error("statements: body not found");
  const body = h.slice(a, b + endMark.length);
  const avg = body.match(/<button id="btnUseAvg"[^>]*>[^<]*<\/button>/)[0];
  const grid = body.slice(body.indexOf('<div class="grid g-2">') + '<div class="grid g-2">'.length, body.length - endMark.length);
  const cards = grid.split(/\n(?=        <div class="card)/).map(s => s.trim()).filter(Boolean);
  const card = re => { const c = cards.find(c => re.test(c)); if (!c) throw new Error("statements: card " + re); return "        " + c; };
  const flow = card(/<h2>Where your money went/), actual = card(/<h2>Actual vs planned/), monthsC = card(/<h2>Money in and out by month/),
    changed = card(/<h2>What changed since last month/), top = card(/<h2>Where you spent the most/),
    wx = card(/id="wxCard"/), uns = card(/id="unsortedCard"/), txc = card(/<h2>Transactions<\/h2>/);
  if (cards.length !== 8) throw new Error("statements: expected 8 cards, found " + cards.length);

  const view = (v, label, extra = "") => `<button type="button" role="tab" data-stview="${v}" aria-selected="${v === "summary"}" aria-controls="st-${v}">${label}${extra}</button>`;
  const fresh = `    <div id="stBody" class="hidden">
      <div class="stbar" id="stBar">
        <div class="stbar-month" role="group" aria-label="Month">
          <button type="button" class="stnav" id="stPrev" aria-label="Previous month">‹</button>
          <select id="stMonth" class="fld-in" aria-label="Month"></select>
          <button type="button" class="stnav" id="stNext" aria-label="Next month">›</button>
        </div>
        <div class="stbar-figs" id="stFigs" aria-live="polite"></div>
        <div class="stviews" role="tablist" aria-label="Statement views">${view("summary", "Summary")}${view("tx", "Transactions", ' <i id="stTxN"></i>')}${view("files", "Files")}</div>
      </div>
      <div id="st-summary" data-stpane="summary" role="tabpanel">
        <div class="grid g-kpi" id="stKpis"></div>
        <div class="st-avg">${avg}</div>
        <div class="grid g-2">
        <div class="card hidden" id="ccCard" style="grid-column: 1 / -1">
          <h2>Credit cards: paid in full?</h2>
          <p class="desc">The sure sign you paid a card off in time is that no interest shows up on its next statement. Each month is checked for interest and fees. Statement dates don't line up with calendar months, so whether your payments kept up is checked across all your statements together.</p>
          <div id="cc"></div>
        </div>
${flow}
${actual}
${monthsC}
${changed}
${top}
        </div>
      </div>
      <div id="st-tx" data-stpane="tx" role="tabpanel" class="hidden">
        <div class="grid g-2">
${uns}
${txc}
${wx.replace("in Transactions below", "in the list above")}
        </div>
      </div>
      <div id="st-files" data-stpane="files" role="tabpanel" class="hidden"></div>
    </div>
  </section>`;
  h = h.slice(0, a) + fresh + h.slice(b + endMark.length);

  /* ---------- Script ---------- */
  rep('$("#btnTxClear").classList.toggle("hidden", !has);', '$("#btnTxClear").classList.toggle("hidden", !has); stLayout(has);', "layout");
  rep('  $("#stKpis").innerHTML = tiles.map(', '  stBar(months, cur);\n  $("#stKpis").innerHTML = tiles.map(', "bar");
  rep("function renderStatements() {", `/* ---------- Statements: pinned month bar, three views ---------- */
let stView = "summary";
try { stView = localStorage.getItem(KEY + "-stview") || "summary"; } catch (e) {}
function stLayout(has) {
  // With statements added, the import card lives in the Files view; before that it's all there is
  const imp = $("#stImport"), files = $("#st-files");
  if (has && imp.parentNode !== files) files.appendChild(imp);
  if (!has && imp.parentNode === files) $("#stBody").before(imp);
  if (!["summary", "tx", "files"].includes(stView)) stView = "summary";
  document.querySelectorAll("[data-stpane]").forEach(p => p.classList.toggle("hidden", p.dataset.stpane !== stView));
  document.querySelectorAll("[data-stview]").forEach(b => { const on = b.dataset.stview === stView; b.setAttribute("aria-selected", on ? "true" : "false"); b.tabIndex = on ? 0 : -1; });
}
function stShow(v) {
  stView = v; try { localStorage.setItem(KEY + "-stview", v); } catch (e) {}
  stLayout(true);
  // Charts drawn while Summary was hidden (a month change or an import from another view) had no width to measure
  if (v === "summary") renderStatements();
  // Start the new view just under the bar, not halfway down the old one
  const y = $("#stBody").getBoundingClientRect().top + scrollY - 8;
  if (scrollY > y) scrollTo(0, y);
}
function stBar(months, cur) {
  const i = months.indexOf(stMonth), p = months[i - 1], n = months[i + 1];
  $("#stPrev").disabled = !p; $("#stNext").disabled = !n;
  $("#stPrev").title = p ? monthName(p) + " (← key)" : "No earlier month";
  $("#stNext").title = n ? monthName(n) + " (→ key)" : "No later month";
  $("#stFigs").innerHTML = [["In", cur.inc], ["Spent", cur.spend], ["Net", cur.net]].map(([l, v]) => \`<span><i>\${l}</i>\${fmt(v)}</span>\`).join("");
  $("#stTxN").textContent = D.transactions.filter(t => monthOf(t.date) === stMonth).length;
}
function stStep(d) {
  const m = monthsList(), k = m[m.indexOf(stMonth) + d]; if (!k) return;
  stMonth = k; txLimit = 150; renderStatements();
}
// From a merchant or a category in the Summary straight to its transactions
function stOpenTx(q, cat) {
  $("#txSearch").value = q || ""; $("#txCat").value = cat || ""; txLimit = 150; txTable(); stShow("tx");
  toast(q ? "Showing " + q + ". Clear the search to see everything." : "Showing " + cat + ". Pick All categories to see everything.");
}
function stLinks(box) {
  box.querySelectorAll("[data-txq], [data-txcat]").forEach(r => {
    const go = () => stOpenTx(r.dataset.txq, r.dataset.txcat);
    r.onclick = go; r.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } };
  });
}
function renderStatements() {`, "functions");
  const ccCode = require("fs").readFileSync(require("path").join(__dirname, "statements-cc.js"), "utf8").replace(/^\/\/.*\n/, "");
  rep("function renderStatements() {", ccCode + "function renderStatements() {", "cc code");
  rep("  stBar(months, cur);\n", "  stBar(months, cur); ccCheck();\n", "cc call");

  // My numbers: a card paid in full each month isn't debt
  rep('desc: "Anything you owe. The interest rate (APR) is on your statement."', 'desc: "Anything you owe. The interest rate (APR) is on your statement. A credit card you pay off in full every month isn\'t debt: leave it out, or add it with a $0 balance. Statements shows whether you paid it in time."', "debts desc");

  // Rows in "What changed" and "Where you spent the most" open their transactions
  rep('d.map(([k, v]) => `<li><span>', 'd.map(([k, v]) => `<li${TX_CATS.includes(k) ? ` class="go-row" tabindex="0" role="button" data-txcat="${esc(k)}" title="Show ${esc(k)} transactions"` : ""}><span>', "changes rows");
  rep(".join(\"\");\n}\nfunction merchants(cur) {", ".join(\"\");\n  stLinks(ul);\n}\nfunction merchants(cur) {", "changes links");
  rep("by[m] = by[m] || { v: 0, n: 0, cat: t.category };", "by[m] = by[m] || { v: 0, n: 0, cat: t.category, q: t.desc.toLowerCase().includes(m.toLowerCase()) ? m : t.desc };", "merchant query");
  rep('${rows.map(([m, o]) => `<tr><td>${esc(m)}</td>', '${rows.map(([m, o]) => `<tr class="go-row" tabindex="0" role="button" data-txq="${esc(o.q)}" title="Show ${esc(m)} transactions"><td>${esc(m)}</td>', "merchant rows");
  rep('`<div class="empty">No spending this month.</div>`;\n}', '`<div class="empty">No spending this month.</div>`;\n  stLinks($("#merchants"));\n}', "merchant links");

  rep('$("#stMonth").onchange = e => { stMonth = e.target.value; txLimit = 150; renderStatements(); };', `$("#stMonth").onchange = e => { stMonth = e.target.value; txLimit = 150; renderStatements(); };
$("#stPrev").onclick = () => stStep(-1);
$("#stNext").onclick = () => stStep(1);
document.querySelectorAll("[data-stview]").forEach(b => b.onclick = () => stShow(b.dataset.stview));
$(".stviews").addEventListener("keydown", e => {
  const v = ["summary", "tx", "files"], i = v.indexOf(stView), n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: 2 }[e.key];
  if (n == null) return; e.preventDefault(); e.stopPropagation(); stShow(v[(n + 3) % 3]); document.querySelector(\`[data-stview="\${stView}"]\`).focus();
});
// The search row in Transactions pins just under the bar, whatever height the bar wraps to
if (window.ResizeObserver) new ResizeObserver(() => $("#stBody").style.setProperty("--stbar-h", $("#stBar").offsetHeight + "px")).observe($("#stBar"));
// ← and → step through months anywhere on the Statements tab, except while typing or choosing
document.addEventListener("keydown", e => {
  if ((e.key !== "ArrowLeft" && e.key !== "ArrowRight") || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  if (!$("#stBar").getClientRects().length || e.target.closest("input, select, textarea, [contenteditable], dialog, [role=tablist]")) return;
  e.preventDefault(); stStep(e.key === "ArrowLeft" ? -1 : 1);
});`, "wiring");

  /* ---------- Style ---------- */
  rep("</style>", `
/* ==== Statements: pinned month bar and views ==== */
.stbar {
  position: sticky; top: 0; z-index: 6; display: flex; align-items: center; flex-wrap: wrap; gap: 10px 24px;
  margin: 0 0 18px; padding: 12px 0 10px; background: var(--surface); border-bottom: 1px solid var(--text);
}
.stbar-month { display: flex; align-items: stretch; }
.stbar-month select { width: auto; min-width: 190px; border-radius: 0; font: 400 20px/1.2 var(--display); padding: 4px 10px; }
.stnav { width: 36px; padding: 0; border-radius: 0; font: 400 22px/1 var(--display); }
.stnav:first-child { border-right: 0; } .stnav:last-child { border-left: 0; }
.stnav:disabled { opacity: .35; cursor: default; }
.stbar-figs { display: flex; gap: 18px; font: 500 13px var(--mono); color: var(--text); }
.stbar-figs i { font-style: normal; font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin-right: 6px; }
/* View tabs: a segmented switch with a real edge, so the three views read as buttons */
.stviews { display: flex; gap: 0; margin-left: auto; border: 1px solid var(--btn-edge); border-bottom-width: 2px; }
.stviews button {
  background: var(--btn-face); border: 0; border-left: 1px solid var(--btn-edge); border-radius: 0; padding: 9px 14px 8px;
  font: 500 11.5px var(--mono); letter-spacing: .08em; text-transform: uppercase; color: var(--text-2);
}
.stviews button:first-child { border-left: 0; }
.stviews button:hover { color: var(--text); background: var(--btn-face-hi); border-color: var(--btn-edge); }
.stviews button[aria-selected="true"] { color: var(--surface); background: var(--text); box-shadow: inset 0 -3px 0 var(--accent) !important; }
.stviews button i { font-style: normal; color: inherit; opacity: .7; margin-left: 2px; }
#st-tx .txctl { position: sticky; top: var(--stbar-h, 56px); z-index: 5; background: var(--surface); padding: 10px 0; margin: 0; border-bottom: 1px solid var(--line); }
.st-avg { display: flex; justify-content: flex-end; margin: 10px 0 18px; }
.cc-card + .cc-card { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--grid); }
.cc-head { margin: 0 0 8px; }
.cc-head svg { width: 14px; height: 14px; vertical-align: -2px; margin-right: 6px; }
.cc-m svg { width: 12px; height: 12px; flex: none; }
.cc-row { display: flex; flex-wrap: wrap; gap: 6px; }
.cc-m { display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px 4px 7px; border: 1px solid var(--line); font: 500 11.5px var(--mono); letter-spacing: .04em; color: var(--text-2); }
.cc-m.cc-cur { border-color: var(--text); color: var(--text); }
.cc-m.cc-critical { border-color: var(--critical); color: var(--text); cursor: pointer; }
.cc-m.cc-critical:hover, .cc-m.cc-critical:focus-visible { background: var(--foil-wash); }
.go-row { cursor: pointer; }
.go-row:hover > *, .go-row:focus-visible > * { background: var(--foil-wash); }
li.go-row:hover, li.go-row:focus-visible { background: var(--foil-wash); }
.go-row:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
@media (max-width: 720px) {
  .stbar { gap: 8px 14px; padding-top: 8px; }
  .stbar-month { flex: 1 1 100%; } .stbar-month select { flex: 1; min-width: 0; font-size: 17px; }
  .stbar-figs { gap: 12px; font-size: 12px; }
  .stviews { margin-left: 0; flex: 1 1 100%; } .stviews button { flex: 1 1 0; min-height: 40px; padding-inline: 6px; }
}
@media print { .stbar { position: static; } }
</style>`, "css");
  return h;
};
