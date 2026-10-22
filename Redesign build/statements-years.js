// Statements: besides a month, the picker offers each year (this year as "year to date"). A period key is a month
// ("2026-07"), a year ("2026"), or the first months of a year ("2025<=07", Jan–Jul 2025: what this year so far is
// compared with). The planned budget is scaled to the number of months in the period. Called by build-fa.js.
module.exports = function statementYears(h) {
  const rep = (from, to, label) => { const n = h.split(from).length - 1; if (n !== 1) throw new Error("statement years: anchor x" + n + ": " + label); h = h.replace(from, () => to); };

  rep("function monthStats(k) {", `// Statements periods: a month ("2026-07"), a year ("2026"), or a year's first months ("2025<=07")
const inPeriod = (d, k) => k.length === 7 ? d.slice(0, 7) === k : k.length === 4 ? d.slice(0, 4) === k : d.slice(0, 4) === k.slice(0, 4) && d.slice(5, 7) <= k.slice(6);
function yearsList() { return [...new Set(D.transactions.map(t => t.date.slice(0, 4)))].sort(); }
const thisYear = () => String(new Date().getFullYear());
function periodName(k) {
  if (k.length === 7) return monthName(k);
  if (k.length === 4) return k === thisYear() ? \`\${k} so far\` : k;
  const m = +k.slice(6); return m === 1 ? \`January \${k.slice(0, 4)}\` : \`\${MONTHS[0]}–\${MONTHS[m - 1]} \${k.slice(0, 4)}\`;
}
function yearLabel(y, months) {
  const n = months.filter(m => m.startsWith(y)).length;
  return y === thisYear() ? \`\${y} year to date\` : n >= 12 ? \`\${y} full year\` : \`\${y} · \${n} month\${n > 1 ? "s" : ""}\`;
}
// ‹ and › step through years while a year is showing, months otherwise
const stList = months => stMonth && stMonth.length === 4 ? yearsList() : months;
// What a period is compared with: the month before; for a year, the year before over the same months
function prevPeriod(k, months) {
  if (k.length === 7) { const i = months.indexOf(k); return i > 0 ? months[i - 1] : null; }
  const py = String(+k - 1), ms = months.filter(m => m.startsWith(k)); if (!ms.length) return null;
  const last = ms[ms.length - 1].slice(5);
  if (!months.some(m => m.startsWith(py) && m.slice(5) <= last)) return null;
  return last === "12" ? py : \`\${py}<=\${last}\`;
}
function monthStats(k) {`, "helpers");
  rep("  const tx = D.transactions.filter(t => monthOf(t.date) === k);\n  const by = {};", "  const tx = D.transactions.filter(t => inPeriod(t.date, k));\n  const by = {};", "month stats period");
  rep("return { tx, by, inc, spend, debt, saved, xin, xout, wout, wback, out: spend + debt, net: inc - spend - debt };",
    "return { tx, by, inc, spend, debt, saved, xin, xout, wout, wback, out: spend + debt, net: inc - spend - debt, months: new Set(tx.map(t => monthOf(t.date))).size || 1 };", "month count");

  /* ---------- Month bar ---------- */
  rep("const i = months.indexOf(stMonth), p = months[i - 1], n = months[i + 1];", "const list = stList(months), i = list.indexOf(stMonth), p = list[i - 1], n = list[i + 1];", "bar list");
  rep('$("#stPrev").title = p ? monthName(p) + " (← key)" : "No earlier month";', '$("#stPrev").title = p ? periodName(p) + " (← key)" : "Nothing earlier";', "bar prev title");
  rep('$("#stNext").title = n ? monthName(n) + " (→ key)" : "No later month";', '$("#stNext").title = n ? periodName(n) + " (→ key)" : "Nothing later";', "bar next title");
  rep('$("#stTxN").textContent = D.transactions.filter(t => monthOf(t.date) === stMonth).length;', '$("#stTxN").textContent = D.transactions.filter(t => inPeriod(t.date, stMonth)).length;', "bar count");
  rep("const m = monthsList(), k = m[m.indexOf(stMonth) + d]; if (!k) return;", "const m = stList(monthsList()), k = m[m.indexOf(stMonth) + d]; if (!k) return;", "step");

  /* ---------- Summary ---------- */
  rep("if (!stMonth || !months.includes(stMonth)) stMonth = latestFullMonth(months);", "if (!stMonth || !(months.includes(stMonth) || yearsList().includes(stMonth))) stMonth = latestFullMonth(months);", "keep year");
  rep('$("#stMonth").innerHTML = [...months].reverse().map(k => `<option value="${k}" ${k === stMonth ? "selected" : ""}>${monthName(k)}${isPartial(k) ? " (partial)" : ""}</option>`).join("");',
    '$("#stMonth").innerHTML = `<optgroup label="Years">${yearsList().reverse().map(y => `<option value="${y}" ${y === stMonth ? "selected" : ""}>${yearLabel(y, months)}</option>`).join("")}</optgroup><optgroup label="Months">${[...months].reverse().map(k => `<option value="${k}" ${k === stMonth ? "selected" : ""}>${monthName(k)}${isPartial(k) ? " (partial)" : ""}</option>`).join("")}</optgroup>`;', "picker");
  rep("const cur = monthStats(stMonth), pi = months.indexOf(stMonth), prevK = pi > 0 ? months[pi - 1] : null, prev = prevK ? monthStats(prevK) : null;",
    "const cur = monthStats(stMonth), prevK = prevPeriod(stMonth, months), prev = prevK ? monthStats(prevK) : null;", "compare with");
  rep("const c = calc(), planned = sum(Object.values(plannedBy()), v => v);", "const c = calc(), planned = sum(Object.values(plannedBy()), v => v) * cur.months;", "planned scaled");
  rep('const pm = prevK ? monthName(prevK, { month: "short" }) : "";', 'const pm = prevK ? (prevK.length === 7 ? monthName(prevK, { month: "short" }) : periodName(prevK)) : "";', "compare label");
  rep('["Net for the month", fmt(cur.net),', '[stMonth.length === 7 ? "Net for the month" : stMonth === thisYear() ? "Net so far this year" : "Net for the year", fmt(cur.net),', "net label");
  rep("const W = svg.clientWidth || 400, plan = plannedBy();", "const W = svg.clientWidth || 400, plan = Object.fromEntries(Object.entries(plannedBy()).map(([k, v]) => [k, v * cur.months]));", "actual vs planned");
  rep('style: k === stMonth ? "fill:var(--text);font-weight:600" : ""', 'style: inPeriod(k + "-01", stMonth) ? "fill:var(--text);font-weight:600" : ""', "months chart highlight");
  rep("$(\"#chgDesc\").textContent = `The biggest moves compared with ${monthName(prevK)}.`;", "$(\"#chgDesc\").textContent = `The biggest moves compared with ${periodName(prevK)}.`;", "changes label");
  rep('if (!prev) { $("#chgDesc").textContent = "Add an earlier month\'s statement to see what changed."; ul.innerHTML = ""; return; }',
    'if (!prev) { $("#chgDesc").textContent = stMonth.length === 4 ? "Add statements from the same months a year earlier to see what changed." : "Add an earlier month\'s statement to see what changed."; ul.innerHTML = ""; return; }', "changes empty");

  /* ---------- Wording follows the period ---------- */
  rep("What you really spent this month, against what you planned in My numbers.", 'What you really spent <span class="st-per">this month</span>, against what you planned in My numbers.', "actual desc");
  rep("Your top merchants this month.", 'Your top merchants <span class="st-per">this month</span>.', "merchants desc");
  rep("<h2>What changed since last month</h2>", '<h2>What changed since <span id="chgSince">last month</span></h2>', "changes title");
  rep("  stBar(months, cur); ccCheck();", `  stBar(months, cur); ccCheck();
  document.querySelectorAll(".st-per").forEach(e => e.textContent = stPer()); $("#chgSince").textContent = stMonth.length === 7 ? "last month" : "last year";`, "period words");
  rep('"No spending this month", { "text-anchor": "middle", class: "m" }', '"No spending " + stPer(), { "text-anchor": "middle", class: "m" }', "no spending chart");
  rep("`<div class=\"empty\">No spending this month.</div>`", "`<div class=\"empty\">No spending ${stPer()}.</div>`", "no spending merchants");
  rep('"No money movement this month"', '"No money movement " + stPer()', "no movement");
  rep("const stList = months =>", 'const stPer = () => !stMonth || stMonth.length === 7 ? "this month" : stMonth === thisYear() ? "so far this year" : "in " + stMonth;\nconst stList = months =>', "period words helper");

  // Credit card month chips name the year once statements span more than one
  rep('${icon(lv)}${monthName(p.k, { month: "short" })}', '${icon(lv)}${monthName(p.k, { month: "short" })}${new Set(per.map(x => x.k.slice(0, 4))).size > 1 ? " ’" + p.k.slice(2, 4) : ""}', "card chip year");

  /* ---------- Transactions ---------- */
  rep("D.transactions.filter(t => monthOf(t.date) === stMonth &&", "D.transactions.filter(t => inPeriod(t.date, stMonth) &&", "tx table");
  rep("if (monthOf(p.date) !== stMonth) { stMonth = monthOf(p.date); renderStatements(); }", "if (!inPeriod(p.date, stMonth)) { stMonth = monthOf(p.date); renderStatements(); }", "transfer jump");
  return h;
};
