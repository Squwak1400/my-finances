// Statements → What you own: when a statement file has a balance column, its newest balance updates the
// matching account. The account remembers which statement it's linked to (stmt) and the date of the
// balance it holds (asOf), so an older file never overwrites a newer balance. Called by build-fa.js.
module.exports = function statementBalance(h) {
  const rep = (from, to, label) => { const n = h.split(from).length - 1; if (n !== 1) throw new Error("statement balance: anchor x" + n + ": " + label); h = h.replace(from, () => to); };

  /* ---------- Data: keep the link and the balance date through saves, backups and the setup wizard ---------- */
  rep("        else out[f.k] = num(v);\n      });\n      return out;",
    "        else out[f.k] = num(v);\n      });\n      if (key === \"assets\") { if (r.stmt) out.stmt = str(r.stmt, 80); if (DATE_RE.test(r.asOf)) out.asOf = r.asOf; }\n      return out;", "sanitize");
  rep('      if (st.sec === "expenses") x.kind = NEEDS.has(x.category) ? "need" : "want";\n      out[st.sec].push(x);',
    '      if (st.sec === "expenses") x.kind = NEEDS.has(x.category) ? "need" : "want";\n      if (st.sec === "assets") { if (r.stmt) x.stmt = r.stmt; if (r.asOf) x.asOf = r.asOf; }\n      out[st.sec].push(x);', "wizard keeps link");

  /* ---------- My numbers: a balance typed by hand is dated today; a linked one says where it came from ---------- */
  rep('            row[f.k] = f.type === "text" || f.type === "select" ? inp.value : (inp.value === "" ? "" : +inp.value);',
    '            row[f.k] = f.type === "text" || f.type === "select" ? inp.value : (inp.value === "" ? "" : +inp.value);\n            if (key === "assets" && f.k === "value") { row.asOf = isoToday(); inp.title = ""; }\n            if (key === "assets" && f.k === "name") { const m = stmtAccounts().find(a => a.toLowerCase() === inp.value.trim().toLowerCase()); if (m) linkStmt(row, m); stmtMissing(card, draw); }', "manual edit dates");
  rep('          inp.setAttribute("aria-label", f.label); inp.autocomplete = "off";',
    '          if (key === "assets" && f.k === "value" && row.stmt && row.asOf) inp.title = `From your ${row.stmt} statement, ${balDate(row.asOf)}`;\n          if (key === "assets" && f.k === "name") inp.setAttribute("list", "stmtAccts");\n          inp.setAttribute("aria-label", f.label); inp.autocomplete = "off";', "linked title");

  /* ---------- My numbers: statement accounts as a drop-down on the name, and a one-click add for the ones not here yet ---------- */
  rep('  const box = $("#editors"); box.innerHTML = "";', `  const box = $("#editors"); box.innerHTML = "";
  const dl = document.createElement("datalist"); dl.id = "stmtAccts";
  stmtAccounts().forEach(a => { const o = document.createElement("option"); o.value = a; dl.appendChild(o); });
  box.appendChild(dl);`, "datalist");
  rep("      updateTotals();\n    };\n    card.querySelector(\".add\").onclick", "      if (key === \"assets\") stmtMissing(card, draw);\n      updateTotals();\n    };\n    card.querySelector(\".add\").onclick", "missing accounts");
  rep("function buildEditors() {", `// Accounts named in your statements; credit cards are left out because they're owed, not owned
function stmtAccounts() {
  const cards = cardAccounts();
  return [...new Set(D.transactions.map(t => t.account))].filter(a => a && !cards.has(a)).sort((a, b) => a.localeCompare(b));
}
function linkStmt(row, acct) {
  D.assets.forEach(x => { if (x !== row && (x.stmt || "").toLowerCase() === acct.toLowerCase()) delete x.stmt; });
  row.stmt = acct;
}
function stmtMissing(card, draw) {
  let el = card.querySelector(".stmt-missing");
  if (!el) { el = document.createElement("div"); el.className = "stmt-missing"; card.querySelector(".add").before(el); }
  const have = new Set(D.assets.flatMap(a => [(a.stmt || "").toLowerCase(), (a.name || "").trim().toLowerCase()]));
  const miss = stmtAccounts().filter(a => !have.has(a.toLowerCase()));
  el.classList.toggle("hidden", !miss.length);
  el.innerHTML = miss.length ? \`<p class="desc">In your statements but not listed here yet. Add one, then type its balance, or add its statement file again and the balance fills in.</p><div>\${miss.map(a => \`<button type="button" data-acct="\${esc(a)}">+ \${esc(a)}</button>\`).join("")}</div>\` : "";
  el.querySelectorAll("[data-acct]").forEach(b => b.onclick = () => {
    const a = b.dataset.acct, r = { name: a, type: guessFile("assets", a, "Chequing"), value: "" };
    linkStmt(r, a); D.assets.push(r); persist(); draw(); renderAll(false);
    const ins = card.querySelectorAll("tbody tr:last-child input"); if (ins[1]) ins[1].focus();
  });
}
function buildEditors() {`, "missing helpers");
  rep("</style>", `
/* ==== My numbers: statement accounts not listed yet ==== */
.stmt-missing { margin: 14px 0 4px; padding-top: 12px; border-top: 1px solid var(--grid); }
.stmt-missing .desc { margin: 0 0 8px; }
.stmt-missing div { display: flex; flex-wrap: wrap; gap: 8px; }
</style>`, "css");

  // Setup wizard: a name that says chequing is chequing, even at a bank known for savings (Tangerine Chequing)
  rep('[/saving|hisa|eq bank|tangerine/, "Savings (HISA)"], [/chequing|checking|cheque/, "Chequing"]', '[/chequing|checking|cheque/, "Chequing"], [/saving|hisa|eq bank|tangerine/, "Savings (HISA)"]', "chequing first");

  /* ---------- Import: find the balance column ---------- */
  rep("credit: find(/credit(?! card)|deposit|money in|paid in|inflow/i) };", "credit: find(/credit(?! card)|deposit|money in|paid in|inflow/i), balance: find(/balance|solde/i) };", "balance header");
  // No header row (TD): date, description, money out, money in, balance; the balance is the last number column
  rep("{ map.debit = cand[0]; map.credit = cand[1]; map.amount = -1; }", "{ map.debit = cand[0]; map.credit = cand[1]; map.amount = -1; if (cand.length >= 3) map.balance = cand[cand.length - 1]; }", "headerless balance");

  rep("function showMapper(name, g) {", `// The balance at the end of a file: the newest day's last row, whichever way the bank sorts its rows
function latestBalance(data, map) {
  if (!(map.balance >= 0)) return null;
  const rows = [];
  data.forEach(r => {
    const date = parseDate(r[map.date], map.dmy), v = parseAmount(r[map.balance]);
    if (!date || isNaN(v) || /\\bpending\\b/i.test(r[map.desc] || "") || r.some(c => /^pending$/i.test(c))) return;
    rows.push({ date, v });
  });
  if (!rows.length) return null;
  const newestFirst = rows[0].date > rows[rows.length - 1].date;
  const max = rows.reduce((m, r) => r.date > m ? r.date : m, rows[0].date), day = rows.filter(r => r.date === max);
  const b = newestFirst ? day[0] : day[day.length - 1];
  return { date: b.date, v: Math.round(b.v * 100) / 100 };
}
// The account in What you own a statement feeds: the one linked before, or one with the same name
function balAsset(acct) {
  const n = String(acct || "").trim().toLowerCase(); if (!n) return -1;
  const i = D.assets.findIndex(a => (a.stmt || "").toLowerCase() === n);
  return i >= 0 ? i : D.assets.findIndex(a => (a.name || "").trim().toLowerCase() === n);
}
const isoToday = () => { const d = new Date(); return \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, "0")}-\${String(d.getDate()).padStart(2, "0")}\`; };
const balDate = d => new Date(d + "T12:00:00").toLocaleDateString(LOC, { month: "short", day: "numeric", year: "numeric" });
function showMapper(name, g) {`, "helpers");

  /* ---------- Import: pick the column and the account, see what will change ---------- */
  rep('      <label class="mP">Money in column<select id="mCred">${opts(m.credit)}</select></label>\n    </div>',
    `      <label class="mP">Money in column<select id="mCred">\${opts(m.credit)}</select></label>
      <label>Balance column<select id="mBal">\${opts(m.balance)}</select></label>
      <label>Update this balance in What you own<select id="mAsset"><option value="-1">Don't update</option>\${D.assets.map((a, i) => \`<option value="\${i}">\${esc(a.name || a.type)}\${a.name && a.name !== a.type ? " · " + esc(a.type) : ""}</option>\`).join("")}</select></label>
    </div>`, "mapper fields");
  rep('    <div id="mPrev" style="overflow-x:auto"></div>', '    <div id="mPrev" style="overflow-x:auto"></div>\n    <p class="desc" id="mBalNote" style="margin:10px 0 0"></p>', "mapper note");
  rep("dmy: $(\"#mDmy\").checked, type: m.type ?? -1 });", "dmy: $(\"#mDmy\").checked, type: m.type ?? -1, balance: +$(\"#mBal\").value });", "read balance");
  rep("    $(\"#mGo\").disabled = !tx.length;\n  };", `    // Follow the account name to its linked account, until one is picked by hand
    if (an !== lastAn) { lastAn = an; if (!assetPicked) $("#mAsset").value = String(balAsset(an)); }
    const bal = latestBalance(g.data, mm), ba = D.assets[+$("#mAsset").value];
    $("#mBalNote").innerHTML = !bal ? (ba ? \`No balance column picked, so <b>\${esc(ba.name)}</b> keeps its balance.\` : "")
      : !ba ? \`Balance on \${balDate(bal.date)}: \${fmt(bal.v, 2)}. Pick an account above to update it in What you own.\`
      : ba.asOf && bal.date < ba.asOf ? \`This file's balance (\${fmt(bal.v, 2)} on \${balDate(bal.date)}) is older than the one <b>\${esc(ba.name)}</b> already has from \${balDate(ba.asOf)}, so it stays at \${fmt(+ba.value || 0, 2)}.\`
      : \`Adding will set <b>\${esc(ba.name)}</b> to <b>\${fmt(bal.v, 2)}</b>, the balance on \${balDate(bal.date)}. It's \${fmt(+ba.value || 0, 2)} now.\`;
    $("#mGo").disabled = !tx.length;
  };
  let lastAn = null, assetPicked = false;
  $("#mAsset").addEventListener("change", () => { assetPicked = true; });`, "mapper preview");
  rep("    const linked = matchTransfers();\n", `    const linked = matchTransfers();
    const bal = latestBalance(g.data, read()), ba = D.assets[+$("#mAsset").value];
    let balMsg = "";
    if (ba) {
      // One statement feeds one account
      D.assets.forEach(x => { if (x !== ba && (x.stmt || "").toLowerCase() === acctName.toLowerCase()) delete x.stmt; });
      ba.stmt = acctName;
      if (bal && !(ba.asOf && bal.date < ba.asOf)) { ba.value = bal.v; ba.asOf = bal.date; balMsg = \`. \${ba.name} is now \${fmt(bal.v, 2)}\`; }
    }
    // My numbers lists statement accounts, so it's redrawn after every import
    buildEditors();
`, "apply balance");
  rep('D.transactions = []; D.rules = {}; persist(); renderStatements();', 'D.transactions = []; D.rules = {}; persist(); buildEditors(); renderStatements();', "clear refreshes editors");
  rep('transfer${linked > 1 ? "s" : ""} between your accounts` : ""}`);', 'transfer${linked > 1 ? "s" : ""} between your accounts` : ""}${balMsg}`);', "toast");
  return h;
};
