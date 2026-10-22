// Builds "My finances.html": the Money and Taxes volumes in one file, one rail, one lock.
// Runs build-fa.js and build-tc.js into Redesign build/out, then merges their output.
const fs = require("fs"), path = require("path"), crypto = require("crypto"), { execFileSync } = require("child_process");
// --share: leave out Redesign build/personal/ and write <dir>/Share/My finances.html instead
const SHARE = process.argv.includes("--share");
if (SHARE) process.env.FA_SHARE = "1";
const B = __dirname, P = process.argv[2], OUT = path.join(B, SHARE ? "out-share" : "out");
fs.mkdirSync(OUT, { recursive: true });
for (const s of ["build-fa.js", "build-tc.js"]) execFileSync(process.execPath, [path.join(B, s), P, OUT], { stdio: "inherit" });
const fa = fs.readFileSync(path.join(OUT, "Financial Advisor.html"), "utf8");
const tc = fs.readFileSync(path.join(OUT, "Tax Coordinator.html"), "utf8");

const cut = (h, from, to, label, keepFrom = true) => {
  const a = h.indexOf(from); if (a < 0) throw new Error("not found: " + label);
  const b = h.indexOf(to, a + from.length); if (b < 0) throw new Error("end not found: " + label);
  return h.slice(keepFrom ? a : a + from.length, b);
};
function rep(s, from, to, label) { if (!s.includes(from)) throw new Error("patch anchor not found: " + label); return s.split(from).join(to); }
const scripts = h => [...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const ids = h => new Set([...h.matchAll(/\bid="([\w-]+)"/g)].map(m => m[1]));

/* ---------- Pieces of each page ---------- */
const parts = h => ({
  tabs: cut(h, '<nav class="tabs"', "  </aside>", "rail"),
  main: cut(h, '<main class="wrap folio">', "</main>", "main") + "</main>",
  after: cut(h, "</main>\n  </div>\n</div>\n", "<script>", "after", false),
  css: cut(h, "<style>", "</style>", "style", false)
});
const F = parts(fa), T = parts(tc);
let [faJs] = scripts(fa), [tcEngine, tcJs] = scripts(tc);

/* ---------- Tax IDs that clash with Money's get a tx- prefix ---------- */
const faIds = ids(fa), clash = [...ids(tc)].filter(x => faIds.has(x) || x.startsWith("tab-"));
const alt = clash.map(x => x.replace(/[-]/g, "\\-")).join("|");
function txIds(s) {
  return s
    .replace(new RegExp(`\\b(id|for|aria-labelledby|aria-controls|aria-describedby)=(["'])(${alt})\\2`, "g"), "$1=$2tx-$3$2")
    .replace(new RegExp(`#(${alt})(?![\\w-])`, "g"), "#tx-$1")
    .replace(new RegExp(`getElementById\\((["'])(${alt})\\1\\)`, "g"), "getElementById($1tx-$2$1)");
}

/* ---------- Tax script: its own tabs, its own lock class, follows the Money lock ---------- */
tcJs = rep(tcJs, "'#tab-' +", "'#tx-tab-' +", "tab sel");
tcJs = rep(tcJs, "'tab-' +", "'tx-tab-' +", "tab id");
tcJs = rep(tcJs, "section[id^=tab-]", "section[id^=tx-tab-]", "sections");
tcJs = rep(tcJs, "$$('nav.tabs button')", "$$('#txTabs button')", "tc tab buttons");
tcJs = rep(tcJs, "$('nav.tabs')", "$('#txTabs')", "tc tab nav");
tcJs = rep(tcJs, "$('nav.tabs button[data-tab=\"'", "$('#txTabs button[data-tab=\"'", "tc tab one");
tcJs = rep(tcJs, "const g = e.target.closest('[data-goto]'); if (g) goTab(", "const g = e.target.closest('[data-goto]'); if (g && g.closest('[data-vol=\"tax\"]')) goTab(", "tc goto");
tcJs = rep(tcJs, "document.body.classList.toggle('is-locked', isLocked());", "document.body.classList.toggle('tx-locked', isLocked());", "tc lock class");
tcJs = rep(tcJs, "localStorage.setItem('taxCoordinator.theme', nx);", "localStorage.setItem('taxCoordinator.theme', nx); localStorage.setItem('financial-advisor-data-v1-theme', nx);", "tc theme");
tcJs = rep(tcJs, "localStorage.setItem(SUM_KEY, JSON.stringify(CK ? await seal(o, CK, SALT) : o));", "localStorage.setItem(SUM_KEY, JSON.stringify(CK ? await seal(o, CK, SALT) : o)); dispatchEvent(new Event('tax-summary'));", "tc summary");
tcJs = rep(tcJs, "    openLock('unlock');\n    if (!CRYPTO_OK)", "    if (faSealed() && CRYPTO_OK) return; // the Money volume asks for the passphrase and passes it over\n    openLock('unlock');\n    if (!CRYPTO_OK)", "tc load lock");
const tcEnd = tcJs.lastIndexOf("})();");
tcJs = tcJs.slice(0, tcEnd) + `/* ---------- one file: follow the Money volume's lock, redraw when shown ---------- */
addEventListener('fa-pass', async e => {
  const p = e.detail; if (!p || !CRYPTO_OK) return;
  if (isLocked()) {
    try { if (await doUnlock(p) === 'old') { openLock('unlock'); oldPassStep = true; lockCtx = p; $('#lockMsg').textContent = 'Your passphrase was changed in Vol. I · My finances. Type your previous passphrase once so your tax data can switch to the new one.'; } }
    catch (x) { openLock('unlock'); }
    return;
  }
  // Passphrase turned on or changed: seal the tax data with it from now on
  SALT = crypto.getRandomValues(new Uint8Array(16)); CK = await deriveKey(p, SALT); NEED = true; sessSet(p); await save(); lockUI(); render();
});
addEventListener('fa-lock-off', async () => { if (isLocked()) return; CK = null; SALT = null; NEED = false; sessSet(null); await save(); lockUI(); render(); });
addEventListener('fa-erased', () => { state = blank(); PENDING = null; PLAIN = null; CK = null; SALT = null; NEED = false; sessSet(null); closeLock(); lockUI(); render(); });
addEventListener('vol-shown', e => { if (e.detail !== 'tax' || !R) return; const b = $$('#txTabs button').find(b => b.getAttribute('aria-selected') === 'true'); goTab(b ? b.dataset.tab : 'overview'); });
` + tcJs.slice(tcEnd);
tcJs = txIds(tcJs);
/* CPA report: a professional one-year summary page under Taxes (from the Oct 10 folder-rail design).
   "Print this year" in Year reports now opens it. */
T.tabs = rep(T.tabs, '<span>Filing plan</span></button>', '<span>Filing plan</span></button>\n      <button role="tab" data-tab="cpa" data-label="CPA report" aria-selected="false"><span class="r" aria-hidden="true">ix</span><span>CPA report</span></button>', "tc cpa tab");
T.main = T.main.slice(0, T.main.lastIndexOf("</main>")) + `<!-- CPA REPORT -->
  <section id="tx-tab-cpa" class="hidden">
    <div class="cpa-bar noprint"><div class="chips" id="cpaYears" role="group" aria-label="Tax year"></div>
      <div class="actions"><button type="button" class="primary" id="cpaPrint">Print or save as PDF</button><button type="button" id="cpaCsv">Export disposals CSV</button></div></div>
    <p class="desc noprint" style="margin:6px 0 14px">A plain one-page summary of the year for your CPA. It prints on white, without the dashboard around it.</p>
    <article class="cpa-sheet" id="cpaSheet" aria-label="Return summary for CPA review"></article>
  </section>
</main>`;
const tcEnd2 = tcJs.lastIndexOf("})();");
tcJs = tcJs.slice(0, tcEnd2) + `/* ---------- CPA report ---------- */
function renderCpa() {
  if (!R || isLocked()) { $('#cpaSheet').innerHTML = '<p class="empty">Unlock to see the report.</p>'; return; }
  renderYears();
  const yy = state.year, S = taxSummary(), y = (S.years || []).find(x => x.year === yy) || null;
  $('#cpaYears').innerHTML = FILE_YEARS.map(v => '<button type="button" aria-pressed="' + (v === yy) + '" data-cpay="' + v + '">' + v + '</button>').join('');
  const money = n => (n < 0 ? '(' : '') + Math.abs(n).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + (n < 0 ? ')' : '');
  const LINES = [['employment', 'Employment income (T4)', 'line 10100'], ['perDiemTaxable', 'Taxable meal / per diem allowance', 'in employment income'],
    ['selfEmployment', 'Self-employment income (net)', 'line 13500'], ['ei', 'EI benefits (T4E)', 'line 11900'],
    ['cryptoGains', 'Taxable capital gains (crypto)', 'Schedule 3 → line 12700'], ['other', 'Other income (incl. crypto income)', 'line 13000'],
    ['perDiemTaxFree', 'Tax-free per diem (not income)', 'excluded']];
  const inc = y ? LINES.filter(([k]) => y.income && +y.income[k]) : [];
  const plain = id => { const t = $('#' + id + ' table'); if (!t) return '<p class="empty">None recorded for this year.</p>';
    const tot = r => /^total/i.test(r.cells[0]?.textContent.trim() || '');
    return '<div class="cpa-tw"><table>' + [...t.rows].map((r, i) => '<tr' + (i && tot(r) ? ' class="tot"' : '') + '>' + [...r.cells].map(c => { const tag = i === 0 ? 'th' : 'td', n = c.classList.contains('n') ? ' class="n"' : '', sp = c.colSpan > 1 ? ' colspan="' + c.colSpan + '"' : '';
      return '<' + tag + sp + n + '>' + esc(c.textContent.replace(/\\s+/g, ' ').trim()) + '</' + tag + '>'; }).join('') + '</tr>').join('') + '</table></div>'; };
  const kpis = $$('#yearKpis .kpi').map(k => [k.querySelector('.label')?.textContent.trim() || '', k.querySelector('.value')?.textContent.trim() || '', k.querySelector('.foot')?.textContent.trim() || '']);
  const raise = [...(y && y.notes || []), ...(S.ops || []).filter(o => o.year === yy).map(o => o.title)];
  const today = new Date().toLocaleDateString('en-CA', { day: 'numeric', month: 'short', year: 'numeric' });
  $('#cpaSheet').innerHTML =
    '<header class="hd"><div><div class="kick">Tax year ' + yy + (y ? ' · ' + esc(TAX_STATUS_WORD[y.status] || '') : '') + '</div><h2>Return summary for CPA review</h2><span class="stamp">' + (y && y.status === 'filed' ? 'Filed' : 'Estimate · not filed') + '</span></div>' +
    '<div class="meta">Taxpayer <b>________________</b><br>Prepared <b>' + esc(today) + '</b><br>Source <b>My finances (offline)</b><br>Crypto cost method <b>Average cost (ACB)</b></div></header>' +
    '<h3>Income <span>amounts in CAD</span></h3>' + (inc.length ? '<div class="cpa-tw"><table><thead><tr><th>Item</th><th>Where it goes</th><th class="n">Amount</th></tr></thead><tbody>' +
      inc.map(([k, l, ref]) => '<tr><td>' + l + '</td><td class="ref">' + ref + '</td><td class="n">' + money(+y.income[k]) + '</td></tr>').join('') +
      (y.taxableIncome ? '<tr class="tot"><td>Taxable income (estimate)</td><td></td><td class="n">' + money(+y.taxableIncome) + '</td></tr>' : '') +
      (y.balance ? '<tr><td>' + (y.balance > 0 ? 'Estimated balance owing' : 'Estimated refund') + '</td><td class="ref">before CPA review</td><td class="n">' + money(Math.abs(+y.balance)) + '</td></tr>' : '') +
      '</tbody></table></div>' : '<p class="empty">No income entered for this year yet (Work and deductions).</p>') +
    (y && y.deductions && y.deductions.length ? '<h3>Deductions and credits <span>as entered</span></h3><div class="cpa-tw"><table><tbody>' + y.deductions.map(d => '<tr><td>' + esc(d.label) + '</td><td class="n">' + money(+d.amount) + '</td></tr>').join('') + '</tbody></table></div>' : '') +
    '<h3>Crypto summary <span>Schedule 3 · 50% inclusion</span></h3><div class="cpa-tw"><table><tbody>' + kpis.map(([l, v, f]) => '<tr><td>' + esc(l) + '</td><td class="ref">' + esc(f) + '</td><td class="n">' + esc(v) + '</td></tr>').join('') + '</tbody></table></div>' +
    '<h3>Crypto disposals <span>each at its CAD value on the day</span></h3>' + plain('dispTable') +
    '<h3>Crypto income <span>staking, interest, rewards</span></h3>' + plain('incTable') +
    '<div class="two"><div><h3>To raise with the CPA</h3>' + (raise.length ? '<ol>' + raise.map(q => '<li>' + esc(q) + '</li>').join('') + '</ol>' : '<p class="empty">Nothing noted for this year.</p>') + '</div>' +
    '<div><h3>Basis</h3><ol><li>Cost base: average cost per coin, pooled across every exchange and wallet, fees included.</li><li>Transfers between your own wallets are matched and left out of disposals.</li><li>Figures are estimates for discussion; the CPA confirms the final treatment.</li></ol></div></div>' +
    '<footer class="fine"><span>Prepared with My finances, offline, for discussion with a CPA.</span><span>' + yy + '</span></footer>';
}
const TAX_STATUS_WORD = { 'filed': 'Filed', 'ready': 'Ready for CPA', 'in-progress': 'In progress', 'not-started': 'Not started' };
$('#cpaYears').addEventListener('click', e => { const b = e.target.closest('[data-cpay]'); if (!b) return; state.year = +b.dataset.cpay; renderCpa(); });
$('#cpaPrint').onclick = () => { renderCpa(); document.body.classList.add('cpa-printing'); window.print(); setTimeout(() => document.body.classList.remove('cpa-printing'), 400); };
$('#cpaCsv').onclick = () => $('#btnExpDisp').click();
$('#tx-btnPrint').onclick = () => { goTab('cpa'); renderCpa(); scrollTo(0, 0); };
$('#txTabs').addEventListener('click', e => { if (e.target.closest('[data-tab="cpa"]')) renderCpa(); });
addEventListener('vol-shown', e => { if (e.detail === 'tax' && $('#txTabs [data-tab="cpa"]').getAttribute('aria-selected') === 'true') renderCpa(); });
` + tcJs.slice(tcEnd2);
/* One backup file: Save and Open in the Taxes volume use the shared ones in Vol. I */
T.tabs = rep(T.tabs, "Save a backup file of your tax workspace", "Save one backup file of everything, taxes included", "tc save title");
F.tabs = rep(F.tabs, "Save a backup file of your numbers", "Save one backup file of everything, taxes included", "fa save title");
tcJs = rep(tcJs, "$('#tx-btnSave').onclick = async () => {", "window.__taxBackup = () => isLocked() ? PENDING : state;\nwindow.__taxRestore = s => { if (isSealed(s)) { if (CRYPTO_OK) openLock('file', s); return; } useBackup(s); };\n$('#tx-btnSave').onclick = () => document.getElementById('btnSave').click();\nconst oldSave = async () => {", "tc backup save");
tcJs = rep(tcJs, "$('#tx-btnLoad').onclick = () => $('#backupIn').click();", "$('#tx-btnLoad').onclick = () => document.getElementById('fileIn').click();", "tc backup open");
/* Tax wording: the lock and the summary belong to the Money volume of the same file */
for (const [from, to] of [
  ["Type the passphrase you use for the Financial Advisor.", "Type the passphrase you use for My finances."],
  ["Lock both pages until the passphrase is typed again", "Lock everything until the passphrase is typed again"],
  ["Your passphrase was changed on the Financial Advisor. Type your previous passphrase once so this page can switch", "Your passphrase was changed in Vol. I · My finances. Type your previous passphrase once so your tax data can switch"],
  [" with the offline Tax Coordinator.", " with My finances, offline."],
  ["That file is not a Tax Coordinator backup", "That file is not a My finances backup"],
  ["download('Tax Coordinator backup '", "download('My finances - Taxes backup '"]
]) tcJs = rep(tcJs, from, to, "tc copy: " + from.slice(0, 30));
T.main = rep(T.main, "shared with the Financial Advisor so it can plan", "shared with Vol. I · My finances so it can plan", "tc copy: room desc");
T.after = rep(T.after, "The lock is shared with your Financial Advisor. Turn it on, off or change it there.", "One lock covers all of My finances. Turn it on, off or change it in Vol. I · My finances.", "tc copy: lock note");

/* ---------- Money script: its own tabs, tells the Tax volume about the lock ---------- */
faJs = rep(faJs, '[...document.querySelectorAll("nav.tabs button")]', '[...document.querySelectorAll("#faTabs button")]', "fa tab buttons");
faJs = rep(faJs, '$("nav.tabs")', '$("#faTabs")', "fa tab nav");
faJs = rep(faJs, 'document.querySelectorAll("nav.tabs button").forEach', 'document.querySelectorAll("#faTabs button").forEach', "fa tab click");
faJs = rep(faJs, 'const g = e.target.closest("[data-goto]"); if (g) showTab(', 'const g = e.target.closest("[data-goto]"); if (g && !g.closest(\'[data-vol="tax"]\')) showTab(', "fa goto");
faJs = rep(faJs, '<a class="btn" href="Tax Coordinator.html" style="text-decoration:none;display:inline-block">Open the Tax Coordinator</a>', '<button data-vol-go="tax">Open Vol. II · Taxes</button>', "fa tax link");
faJs = rep(faJs, 'localStorage.setItem(KEY + "-theme", document.documentElement.dataset.theme);', 'localStorage.setItem(KEY + "-theme", document.documentElement.dataset.theme); localStorage.setItem("taxCoordinator.theme", document.documentElement.dataset.theme);', "fa theme");
faJs = rep(faJs, "sessSet(p1);", 'sessSet(p1); dispatchEvent(new CustomEvent("fa-pass", { detail: p1 }));', "fa pass set/unlock");
faJs = rep(faJs, "sessSet(sp);", 'sessSet(sp); dispatchEvent(new CustomEvent("fa-pass", { detail: sp }));', "fa pass handoff");
faJs = rep(faJs, "await resealOthers(old); signalLock(); sessSet(null);", 'await resealOthers(old); signalLock(); sessSet(null); dispatchEvent(new Event("fa-lock-off"));', "fa lock off");
faJs = rep(faJs, "writing = writing.then(() => { eraseAll(); signalLock(); });", 'writing = writing.then(() => { eraseAll(); signalLock(); dispatchEvent(new Event("fa-erased")); });', "fa clear");
faJs = rep(faJs, "  eraseAll(); signalLock();\n  PENDING = null;", '  eraseAll(); signalLock(); dispatchEvent(new Event("fa-erased"));\n  PENDING = null;', "fa reset");
/* Money wording: one file with two volumes, not two pages */
for (const [from, to] of [
  ["where the Tax Coordinator estimates", "where the Taxes volume estimates"],
  ["The Tax Coordinator has your checklist.", "The Taxes volume has your checklist."],
  ["the Tax Coordinator can check whether", "the Taxes volume can check whether"],
  ["The Tax Coordinator tracks the tax side", "The Taxes volume tracks the tax side"],
  ["Based on the Tax Coordinator's numbers", "Based on the Taxes volume's numbers"],
  ["The Tax Coordinator's summary is locked. Unlock this page with your passphrase to read it.", "Your tax summary is locked. Unlock with your passphrase to read it."],
  ["Nothing from the Tax Coordinator yet. Open it with the switch at the top, add your slips and transactions, and its summary shows up here and in the Advisor's review.", "Nothing from the Taxes volume yet. Open it below or from the rail, add your slips and transactions, and its summary shows up here and in your My finances review."],
  ["From the Tax Coordinator${TAX.updated", "From the Taxes volume${TAX.updated"],
  ["The Tax Coordinator shows ${fmt(fhsaRoom)}", "The Taxes volume shows ${fmt(fhsaRoom)}"],
  ["checking with the Tax Coordinator or a CPA", "checking in the Taxes volume or with a CPA"],
  ["with the Tax Coordinator or a CPA before filing", "in the Taxes volume or with a CPA before filing"],
  ["From your Tax Coordinator</h3>", "From your Taxes volume</h3>"],
  ["`The Tax Coordinator estimates ${fmt(TX.owing)}", "`The Taxes volume estimates ${fmt(TX.owing)}"],
  ["From the Tax Coordinator. See the Taxes tab for details.", "From the Taxes volume. See the Taxes tab for details."],
  ["Lock both pages until the passphrase is typed again", "Lock everything until the passphrase is typed again"],
  ["Turn off the passphrase lock? Both pages (this dashboard and the Tax Coordinator) will be stored unencrypted", "Turn off the passphrase lock? Your numbers and taxes will be stored unencrypted"],
  ["Lock turned off on both pages", "Lock turned off"],
  ["Erase the locked numbers on both pages (this dashboard and the Tax Coordinator) and start empty?", "Erase all the locked numbers, taxes included, and start empty?"],
  ["Locked on both pages.", "Everything is locked."],
  ["Passphrase changed on both pages", "Passphrase changed"],
  ["`financial-data-${new Date().toISOString().slice(0, 10)}.json`", "`My finances backup ${new Date().toISOString().slice(0, 10)}.json`"],
  ['description: "Financial data"', 'description: "My finances backup"'],
  ["`financial-backup-${thisMonth()}.json`", "`My finances monthly backup ${thisMonth()}.json`"],
  ["That file isn't a dashboard backup", "That file isn't a My finances backup"],
  ["Clear every number from both pages (this dashboard and the Tax Coordinator), and turn off the passphrase lock? Save a backup on each page first", "Clear every number, taxes included, and turn off the passphrase lock? Save a backup first"]
]) faJs = rep(faJs, from, to, "fa copy: " + from.slice(0, 30));
faJs = rep(faJs, '"Vol. I — Money · "', '"Vol. I — My finances · "', "fa folio head");
F.main = rep(F.main, "Vol. I — Money", "Vol. I — My finances", "fa folio head markup");
F.tabs = rep(F.tabs, 'aria-label="Money sections"', 'aria-label="My finances sections"', "fa tabs label");

/* One backup file for both volumes: { myFinances: 1, money, taxes }, sealed as a whole when the lock is on.
   Old single-volume backups still open: a Money file as before, a Tax file is handed to the Taxes volume. */
faJs = rep(faJs, "$(\"#btnSave\").onclick = async () => {\n  const body = CK ? await seal(D, CK, SALT) : D;",
  "async function bundle() { const o = { myFinances: 1, money: D, taxes: window.__taxBackup ? window.__taxBackup() : null }; return CK ? seal(o, CK, SALT) : o; }\n$(\"#btnSave\").onclick = async () => {\n  const body = await bundle();", "fa backup save");
faJs = rep(faJs, "  const body = CK ? await seal(D, CK, SALT) : D;\n  const fh = await cfg.dir", "  const body = await bundle();\n  const fh = await cfg.dir", "fa monthly backup");
faJs = rep(faJs, 'function useBackup(o) { D = sanitize(o); persist(); renderAll(); toast("Backup opened"); }',
  `function useBackup(o) {
  if (o && Array.isArray(o.files)) { window.__taxRestore && window.__taxRestore(o); return; }
  if (o && o.myFinances) { if (o.taxes) window.__taxRestore && window.__taxRestore(o.taxes); o = o.money || {}; }
  D = sanitize(o); persist(); renderAll(); toast("Backup opened");
}`, "fa backup open");
faJs = rep(faJs, `<div class="mapgrid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))"></div>`, `<div class="mapgrid profgrid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))"></div>`, "fa profile grid");
/* Notebook view: its money-flow options and Statements cards read the app's own month figures and reuse "open these transactions" */
faJs = rep(faJs, "function plannedBy() {", 'window.__nb = { monthStats: k => monthStats(k), plannedBy: () => plannedBy(), period: () => stMonth, openTx: (q, c) => stOpenTx(q, c), pretty: d => prettyMerchant(d),\n' +
  '  months: () => monthsList(), partial: k => isPartial(k), prevOf: k => prevPeriod(k, monthsList()), name: (k, o) => monthName(k, o), periodName: k => periodName(k), tol: () => OVER_TOL,\n' +
  '  isSpend: t => isSpend(t), txCats: () => TX_CATS, cc: () => ccData(), pick: k => { stMonth = k; txLimit = 150; renderStatements(); } };\nfunction plannedBy() {', "notebook hook");
const faEnd = faJs.lastIndexOf("})();");
faJs = faJs.slice(0, faEnd) + `/* one file: redraw when this volume is shown, pick up tax changes made in this page */
addEventListener("vol-shown", e => { if (e.detail === "money") showTab(TAB_BTNS.find(b => b.getAttribute("aria-selected") === "true")?.dataset.tab || "overview"); });
addEventListener("tax-summary", () => loadTax());
` + faJs.slice(faEnd);

/* ---------- Shell: switch volumes, remember the last one ---------- */
const shellJs = `
(() => {
  const NAMES = { money: "My finances", tax: "Taxes", settings: "Settings" };
  // Tab icon: a cream ledger page with three rising bars, teal for My finances, sienna for Taxes
  const icon = c => "data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect x='1' y='1' width='30' height='30' fill='#f3eedf' stroke='#15140f' stroke-width='2'/><path fill='" + c + "' d='M6 17h5v9H6zM13.5 12h5v14h-5zM21 6h5v20h-5z'/></svg>");
  function show(v) {
    if (!NAMES[v]) v = "money";
    document.body.classList.toggle("vol-money", v === "money"); document.body.classList.toggle("vol-tax", v === "tax"); document.body.classList.toggle("vol-settings", v === "settings");
    document.querySelectorAll("[data-vol]").forEach(e => { e.hidden = e.dataset.vol !== v; });
    // Folder rail: the open volume's drawer slides open, the others fold away (inert so Tab skips them)
    document.querySelectorAll(".folder").forEach(f => {
      const o = f.dataset.folder === v, b = f.querySelector(".fold");
      f.classList.toggle("open", o); b.setAttribute("aria-expanded", o); o ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current");
      f.querySelector(".drawer").inert = !o;
    });
    document.querySelectorAll(".foot-wrap").forEach(f => { f.hidden = f.dataset.foot !== (v === "tax" ? "tax" : "money"); });
    if (v === "settings") setPage();
    try { localStorage.setItem("fa-vol", v); } catch (e) {}
    document.title = "My finances";
    const fav = document.getElementById("favicon"); if (fav) fav.href = icon(v === "tax" ? "#a04a2a" : "#1b4b5a");
    dispatchEvent(new CustomEvent("vol-shown", { detail: v }));
  }
  document.addEventListener("click", e => { const b = e.target.closest("[data-vol-go]"); if (b) { show(b.dataset.volGo); scrollTo(0, 0); } });
  document.querySelectorAll(".folder").forEach(f => { const c = f.querySelector(".count"); if (c) c.textContent = f.querySelectorAll(".drawer nav.tabs button").length; });
  /* Settings: five pages that reuse the existing controls, so nothing is duplicated */
  const SET = { backups: "Backups", lock: "Lock", appearance: "Appearance", setup: "Setup", start: "Start over" };
  let page = "backups"; try { page = localStorage.getItem("fa-set-page") || "backups"; } catch (e) {}
  function setPage(p) {
    if (p) page = p; if (!SET[page]) page = "backups";
    document.querySelectorAll("#setTabs button").forEach(b => { const on = b.dataset.set === page; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; });
    document.querySelectorAll("#volSettings [data-set]").forEach(s => { s.hidden = s.dataset.set !== page; });
    const h = document.getElementById("setHead"); if (h) h.textContent = "Settings · " + SET[page];
    // only offer controls the app is showing right now (e.g. "change passphrase" once one is set)
    document.querySelectorAll("#volSettings [data-proxy]").forEach(b => { const t = document.getElementById(b.dataset.proxy); b.hidden = !t || t.classList.contains("hidden"); });
    const th = document.getElementById("setThemeNow"); if (th) th.textContent = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    try { localStorage.setItem("fa-set-page", page); } catch (e) {}
  }
  document.addEventListener("click", e => {
    const t = e.target.closest("#setTabs [data-set]"); if (t) { setPage(t.dataset.set); return; }
    const p = e.target.closest("#volSettings [data-proxy]"); if (p) { document.getElementById(p.dataset.proxy)?.click(); setTimeout(() => setPage(), 50); return; }
    const m = e.target.closest("[data-set-monthly]"); if (m) { show("money"); document.querySelector('#faTabs [data-tab="numbers"]')?.click(); setTimeout(() => document.getElementById("abCard")?.scrollIntoView({ block: "start" }), 60); }
  });
  let v = "money"; try { v = localStorage.getItem("fa-vol") || "money"; } catch (e) {}
  show(location.hash === "#taxes" ? "tax" : location.hash === "#money" ? "money" : v);
})();
`;

/* ---------- CSS: Money's base, the Tax-only rules scoped to the Tax volume, the theme, the shell ---------- */
function rules(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = []; let i = 0;
  (function block(ctx) {
    while (i < css.length) {
      const o = css.indexOf("{", i), c = css.indexOf("}", i);
      if (c >= 0 && (o < 0 || c < o)) { i = c + 1; return; }
      if (o < 0) { i = css.length; return; }
      const sel = css.slice(i, o).trim(); i = o + 1;
      if (sel.startsWith("@media")) { block(sel); continue; }
      const e = css.indexOf("}", i); out.push([ctx, sel.replace(/\s+/g, " "), css.slice(i, e).trim()]); i = e + 1;
    }
  })("");
  return out;
}
const THEME = "/* ==== Ledger theme";
const faBase = F.css.slice(0, F.css.indexOf(THEME)), theme = F.css.slice(F.css.indexOf(THEME));
const have = new Set(rules(faBase).map(r => r[0] + "|" + r[1]));
const scope = sel => sel.split(",").map(s => { const m = s.trim().match(/^(:root(?::not\([^)]*\))?\s+)?([\s\S]*)$/); return (m[1] || "") + ':where([data-vol="tax"]) ' + m[2]; }).join(", ");
const tcOnly = rules(T.css.slice(0, T.css.indexOf(THEME))).filter(r => !have.has(r[0] + "|" + r[1]) && !/^:root|^html|^body|^\*/.test(r[1]));
const tcCss = "/* ==== Tax-only rules from the original Tax Coordinator, kept to the Tax volume ==== */\n" +
  tcOnly.map(([ctx, sel, body]) => (ctx ? ctx + " { " : "") + scope(sel) + " { " + body + " }" + (ctx ? " }" : "")).join("\n") + "\n";
const shellCss = `
/* ==== One file: two volumes in one shell ==== */
[data-vol][hidden] { display: none !important; }
/* Folder rail: each volume is a folder; the open one's pages slide out between it and the next (Oct 10 design) */
.tree { display: flex; flex-direction: column; }
.folder + .folder { border-top: 1px solid var(--desk-rule); }
.rail .fold { all: unset; box-sizing: border-box; width: 100%; display: flex; align-items: center; gap: 10px; padding: 11px 0; cursor: pointer;
  font: 500 11px var(--mono); letter-spacing: .1em; text-transform: uppercase; color: var(--desk-soft); transition: color .15s; }
.rail .fold:hover, .rail .folder.open > .fold { color: var(--desk-ink); background: none; }
.rail .fold:focus-visible { outline: 2px solid var(--desk-ink); outline-offset: 2px; }
.fold .chev { width: 9px; height: 9px; flex: none; transition: transform .25s var(--ease); }
.folder.open .chev { transform: rotate(90deg); }
.fold .count { margin-left: auto; font-size: 10px; opacity: .7; letter-spacing: 0; }
.drawer { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .28s var(--ease); }
.folder.open .drawer { grid-template-rows: 1fr; }
.drawer > div { overflow: hidden; min-height: 0; }
.drawer nav.tabs { margin: 0 0 12px 4px; padding-left: 4px; border-left: 1px solid var(--desk-rule); }
.drawer nav.tabs button { opacity: 0; transform: translateY(-4px); transition: opacity .2s var(--ease), transform .2s var(--ease), color .15s; }
.folder.open .drawer nav.tabs button { opacity: 1; transform: none; }
.folder.open .drawer nav.tabs button:nth-child(2) { transition-delay: 20ms; } .folder.open .drawer nav.tabs button:nth-child(3) { transition-delay: 40ms; }
.folder.open .drawer nav.tabs button:nth-child(4) { transition-delay: 60ms; } .folder.open .drawer nav.tabs button:nth-child(5) { transition-delay: 80ms; }
.folder.open .drawer nav.tabs button:nth-child(n+6) { transition-delay: 100ms; }
.foot-wrap { margin-top: auto; display: flex; flex-direction: column; }
.foot-wrap[hidden] { display: none !important; }
@media (prefers-reduced-motion: reduce) { .drawer, .fold .chev, .drawer nav.tabs button { transition: none !important; } }
@media (max-width: 900px) { .drawer nav.tabs { border-left: 0; margin-left: 0; padding-left: 0; } }
/* Settings volume */
#volSettings h1.set-title { font: 400 34px/1.1 var(--display); margin: 22px 0 8px; }
#volSettings section > .card { margin-top: 22px; }
#volSettings .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
#volSettings .desc { max-width: 64ch; }
/* CPA report: a plain, professional page inside the Taxes volume; prints on its own, black on white */
.cpa-bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 8px; }
.cpa-bar .actions { display: flex; gap: 8px; flex-wrap: wrap; }
.cpa-sheet { background: #fff; color: #1a1a18; padding: 44px 50px 36px; font: 400 13.5px/1.5 var(--serif); box-shadow: 0 0 0 1px var(--line), 0 20px 40px -26px rgba(0,0,0,.4); }
.cpa-sheet .hd { display: grid; grid-template-columns: 1fr auto; gap: 20px; border-bottom: 1.5px solid #1a1a18; padding-bottom: 14px; }
.cpa-sheet h2 { font: 400 25px/1.15 var(--display); margin: 0; color: #1a1a18; }
.cpa-sheet .kick { font: 500 10.5px var(--mono); letter-spacing: .12em; text-transform: uppercase; color: #6a6350; margin-bottom: 6px; }
.cpa-sheet .meta { font: 400 11.5px/1.7 var(--mono); color: #4a463b; text-align: right; }
.cpa-sheet .meta b { font-weight: 500; color: #1a1a18; }
.cpa-sheet .stamp { display: inline-block; margin-top: 6px; border: 1px solid #a04a2a; color: #a04a2a; font: 500 10px var(--mono); letter-spacing: .1em; text-transform: uppercase; padding: 3px 7px; }
.cpa-sheet h3 { font: 500 10.5px var(--mono); letter-spacing: .12em; text-transform: uppercase; color: #1a1a18; margin: 24px 0 6px; padding-bottom: 5px; border-bottom: 1px solid #1a1a18; display: flex; justify-content: space-between; gap: 12px; }
.cpa-sheet h3 span { color: #6a6350; letter-spacing: .06em; text-transform: none; font-weight: 400; }
.cpa-sheet table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
.cpa-sheet :is(td, th) { padding: 5px 6px; border-bottom: 1px solid #ddd4bd; text-align: left; vertical-align: top; color: #1a1a18; background: none; font: 400 13px var(--serif); }
.cpa-sheet .cpa-tw { overflow-x: auto; }
.cpa-sheet table th, .cpa-sheet table th.n { font: 500 10px var(--mono); letter-spacing: .08em; text-transform: uppercase; color: #6a6350; }
.cpa-sheet :is(td, th).n { text-align: right; font-family: var(--mono); font-size: 12.5px; }
.cpa-sheet tr.tot td { border-top: 1px solid #1a1a18; border-bottom: 0; font-weight: 600; }
.cpa-sheet .ref { font: 400 11px var(--mono); color: #6a6350; }
.cpa-sheet .two { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
.cpa-sheet ol { margin: 6px 0 0; padding-left: 20px; } .cpa-sheet li { margin-bottom: 5px; }
.cpa-sheet .empty { color: #6a6350; font-style: italic; padding: 6px 0; }
.cpa-sheet .fine { margin-top: 24px; padding-top: 10px; border-top: 1px solid #ddd4bd; font: 400 10.5px/1.6 var(--mono); color: #6a6350; display: flex; justify-content: space-between; gap: 20px; }
/* On screen the page is dark (Ledger dark tokens) in both themes so it doesn't glare (owner, 2026-10-12); print keeps the white page above */
@media screen {
  .cpa-sheet { background: #1f1d17; color: #efe8d6; box-shadow: 0 0 0 1px #463f33, 0 20px 40px -26px rgba(0,0,0,.5); }
  .cpa-sheet .hd { border-bottom-color: #efe8d6; }
  .cpa-sheet h2, .cpa-sheet h3, .cpa-sheet .meta b, .cpa-sheet :is(td, th) { color: #efe8d6; }
  .cpa-sheet .meta { color: #cbc2ab; }
  .cpa-sheet :is(.kick, h3 span, .ref, .empty, .fine), .cpa-sheet table th, .cpa-sheet table th.n { color: #9b927b; }
  .cpa-sheet h3, .cpa-sheet tr.tot td { border-color: #efe8d6; }
  .cpa-sheet :is(td, th) { border-bottom-color: #3a352b; }
  .cpa-sheet tr.tot td { border-bottom-color: transparent; }
  .cpa-sheet .fine { border-top-color: #3a352b; }
  .cpa-sheet .stamp { border-color: #e2906a; color: #e2906a; }
}
@media (max-width: 760px) { .cpa-sheet { padding: 24px 16px; } .cpa-sheet .hd, .cpa-sheet .two { grid-template-columns: 1fr; } .cpa-sheet .meta { text-align: left; } }
@media print {
  body.cpa-printing .rail, body.cpa-printing .folio-head, body.cpa-printing .noprint, body.cpa-printing #volTax > :not(#tx-tab-cpa), body.cpa-printing #tx-tab-cpa > :not(.cpa-sheet) { display: none !important; }
  body.cpa-printing .cpa-sheet { box-shadow: none; padding: 0; }
}
body.tx-locked [data-vol="tax"].folio > :not(.folio-head), body.tx-locked [data-vol="tax"] nav.tabs, body.tx-locked [data-vol="tax"] .actions > :not(#tx-btnLock):not(#tx-btnTheme) { display: none !important; }
body.tx-locked [data-vol="tax"].folio::after { content: "Locked. Press Unlock and type your passphrase."; display: block; padding: 60px 0; font: italic 400 22px var(--display); color: var(--muted); }
/* About you: label, box and hint share rows across each line of fields, so every box in a line sits level */
.profgrid { row-gap: 0; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)) !important; } /* wide enough for the longest answers */
.profgrid label { grid-row: span 3; grid-template-rows: subgrid; row-gap: 4px; align-items: end; padding-bottom: 12px; }
.profgrid label > span, .profgrid label > .fld-in { align-self: start; }
`;
const nbCss = fs.readFileSync(path.join(B, "notebook.css"), "utf8"), nbJs = fs.readFileSync(path.join(B, "notebook.js"), "utf8");
const css = (faBase + txIds(tcCss) + theme + shellCss + nbCss).split("dialog#lockDlg").join("dialog:is(#lockDlg, #tx-lockDlg)");

/* ---------- Rail pieces: each volume's page list goes in its folder, its footer stays at the bottom ---------- */
const splitFoot = (s, label) => { const i = s.indexOf('<div class="rail-foot">'); if (i < 0) throw new Error("rail-foot not found: " + label); return [s.slice(0, i), s.slice(i)]; };
const [faNav, faFoot] = splitFoot(F.tabs, "fa"), [txNav, txFoot] = splitFoot(txIds(T.tabs), "tc");
const CHEV = '<svg class="chev" viewBox="0 0 10 10" aria-hidden="true"><path d="M3 1.5 7 5 3 8.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const folder = (id, name, nav, open) => `<div class="folder${open ? " open" : ""}" data-folder="${id}">
        <button type="button" class="fold" data-vol-go="${id}" aria-expanded="${!!open}" aria-controls="drawer-${id}">${CHEV}<span>${name}</span><span class="count"></span></button>
        <div class="drawer" id="drawer-${id}"${open ? "" : " inert"}><div>${nav}</div></div>
      </div>`;
const SET_PAGES = [["backups", "Backups"], ["lock", "Lock"], ["appearance", "Appearance"], ["setup", "Setup"], ["start", "Start over"]];
const SET_NAV = `<nav class="tabs" id="setTabs" role="tablist" aria-label="Settings" aria-orientation="vertical">${SET_PAGES.map(([k, l], i) => `<button role="tab" data-set="${k}" aria-selected="${!i}"><span class="r" aria-hidden="true">${["i", "ii", "iii", "iv", "v"][i]}</span><span>${l}</span></button>`).join("")}</nav>`;
const SET_MAIN = `<main class="wrap folio" id="volSettings" data-vol="settings" hidden>
    <div class="folio-head"><span class="lbl" id="setHead">Settings · Backups</span><span class="lbl hide-sm">My finances</span></div>
    <section data-set="backups">
      <h1 class="set-title">Backups</h1>
      <p class="desc">One backup file holds everything, taxes included. Keep it somewhere that isn't synced to the cloud, so not OneDrive, Google Drive or Dropbox.</p>
      <div class="actions"><button type="button" class="primary" data-proxy="btnSave">Save backup</button><button type="button" data-proxy="btnLoad">Open backup</button></div>
      <div class="card"><h2>Monthly backup</h2><p class="desc">Choose a folder once, and a backup is saved there the first time you open My finances each month.</p><div class="actions"><button type="button" data-set-monthly>Set up the monthly backup</button></div></div>
      <div class="card"><h2>Net worth history</h2><p class="desc">Record today's net worth so the history chart on the Overview grows month to month.</p><div class="actions"><button type="button" data-proxy="btnSnap">Record this month</button></div></div>
    </section>
    <section data-set="lock" hidden>
      <h1 class="set-title">Lock</h1>
      <p class="desc">A passphrase locks your numbers and your taxes in this browser. Nothing can be read until it's typed again, and backups saved while it's on are locked too.</p>
      <div class="actions"><button type="button" class="primary" data-proxy="btnLock">Lock</button><button type="button" data-proxy="btnLockSet">Change or turn off the passphrase</button></div>
    </section>
    <section data-set="appearance" hidden>
      <h1 class="set-title">Appearance</h1>
      <p class="desc">My finances is in <b id="setThemeNow">light</b> mode. The choice is remembered on this computer.</p>
      <div class="actions"><button type="button" data-proxy="btnTheme">Switch light or dark</button></div>
      <div class="card"><h2>Page style</h2><p class="desc">Notebook draws the pages by hand: sketched charts, sticky notes, handwritten titles. Ledger is the plain printed look. The switch at the top of every page does the same.</p><div class="actions"><span class="nb-views" role="group" aria-label="Page style"><button type="button" data-v="ledger">Ledger</button><button type="button" data-v="notebook">Notebook</button></span></div></div>
    </section>
    <section data-set="setup" hidden>
      <h1 class="set-title">Setup</h1>
      <p class="desc">The guided setup walks through your numbers a step at a time: about you, income, bills, debts, what you own and your goals.</p>
      <div class="actions"><button type="button" class="primary" data-proxy="btnWizard">Start guided setup</button></div>
    </section>
    <section data-set="start" hidden>
      <h1 class="set-title">Start over</h1>
      <p class="desc">Clears every number, taxes included, and turns off the passphrase lock. Save a backup first if you might want any of it back.</p>
      <div class="actions"><button type="button" data-proxy="btnSave">Save backup first</button><button type="button" class="danger" data-proxy="btnClear">Clear all numbers</button></div>
    </section>
  </main>`;

/* ---------- Assemble ---------- */
const FAV = favUri("#1b4b5a");
let head = fa.slice(0, fa.indexOf("<style>")).replace(/<title>[^<]*<\/title>/, () => "<title>My finances</title>\n<link rel=\"icon\" id=\"favicon\" type=\"image/svg+xml\" href=\"" + FAV + "\">");
function favUri(c) { return "data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect x='1' y='1' width='30' height='30' fill='#f3eedf' stroke='#15140f' stroke-width='2'/><path fill='" + c + "' d='M6 17h5v9H6zM13.5 12h5v14h-5zM21 6h5v20h-5z'/></svg>"); }
const all = [faJs, tcEngine, tcJs, shellJs, nbJs];
const hashes = all.map(s => "'sha256-" + crypto.createHash("sha256").update(s, "utf8").digest("base64") + "'");
const cspBefore = head;
head = head.replace(/script-src (?:'sha256-[^']+' ?)+/, "script-src " + hashes.join(" ") + " ");
if (head === cspBefore) throw new Error("CSP not updated");

const html = head + "<style>" + css + "</style>\n</head>\n" + `<body class="vol-money">
<div class="shell">
  <aside class="rail" aria-label="Index">
    <div class="rail-brand">My finances<small>Private ledger · offline</small></div>
    <div class="tree" role="group" aria-label="Volumes">
      ${folder("money", "Vol. I · My finances", faNav.replace('<nav class="tabs"', '<nav class="tabs" id="faTabs"'), true)}
      ${folder("tax", "Vol. II · Taxes", txNav.replace('<nav class="tabs"', '<nav class="tabs" id="txTabs"'))}
      ${folder("settings", "Settings", SET_NAV)}
    </div>
    <div class="foot-wrap" data-foot="money">${faFoot}</div>
    <div class="foot-wrap" data-foot="tax" hidden>${txFoot}</div>
  </aside>
  <div class="desk">
  ${F.main.replace('<main class="wrap folio">', '<main class="wrap folio" id="volMoney" data-vol="money">')}
  ${txIds(T.main).replace('<main class="wrap folio">', '<main class="wrap folio" id="volTax" data-vol="tax" hidden>')}
  ${SET_MAIN}
  </div>
</div>
${F.after}${txIds(T.after)}${all.map(s => "<script>" + s + "</script>\n").join("")}</body>
</html>
`;

// Every id once
const seen = {}, dup = [];
for (const m of html.replace(/<script>[\s\S]*?<\/script>/g, "").matchAll(/\bid="([\w-]+)"/g)) { if (seen[m[1]]) dup.push(m[1]); seen[m[1]] = 1; }
if (dup.length) throw new Error("duplicate ids: " + dup.join(" "));
const out = SHARE ? path.join(P, "Share", "My finances.html") : path.join(P, "My finances.html");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log("ok", out, html.length, "renamed", clash.length, "tax ids, tax-only css rules", tcOnly.length);
