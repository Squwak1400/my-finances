// Builds the redesigned Financial Advisor.html from the untouched original.
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const B = __dirname, P = process.argv[2];
const src = path.join(P, "Originals (before redesign)", "Financial Advisor.html");
const out = path.join(process.argv[3] || P, "Financial Advisor.html");
let h = fs.readFileSync(src, "utf8");
const theme = fs.readFileSync(path.join(B, "theme.css"), "utf8");
const story = fs.readFileSync(path.join(B, "fa-overview.js"), "utf8");

function swap(from, to, rep, label) {
  const a = h.indexOf(from); if (a < 0) throw new Error("anchor not found: " + label);
  const b = to == null ? a + from.length : h.indexOf(to, a + from.length); if (b < 0) throw new Error("end not found: " + label);
  h = h.slice(0, a) + rep + h.slice(b);
}
const once = (s, r, label) => swap(s, null, r, label);

/* CSS */
swap("/* ==== Shared theme", "</style>", theme, "theme");
once("body.is-locked .wrap > :not(header):not(.pageswitch), body.is-locked header .actions > :not(#btnLock) { display: none !important; }\n", "", "lock css");

/* Setup wizard rows: drop-downs get columns wide enough for their longest option in Cascadia Mono, so nothing is cut off */
once('const cols = `minmax(150px,2fr) ${fields.map(() => "minmax(90px,1fr)").join(" ")}minmax(120px,1.2fr) 32px`;',
  'const WZ_COL = { freq: "156px", season: "182px" };\n    const cols = `minmax(200px,2fr) ${fields.map(([, , t]) => WZ_COL[t] || "minmax(96px,1fr)").join(" ")} 204px 32px`;', "wizard columns");

/* Shell: rail + folio */
const tab = (t, r, label, sel) => `      <button role="tab" data-tab="${t}" aria-selected="${sel ? "true" : "false"}"><span class="r" aria-hidden="true">${r}</span>${label}</button>`;
swap("<body>\n<div class=\"wrap\">", "  <div id=\"abBar\"", `<body class="vol-money">
<div class="shell">
  <aside class="rail" aria-label="Index">
    <div class="rail-brand">My finances<small>Private ledger · offline</small></div>
    <nav class="vols pageswitch" aria-label="Switch page"><span aria-current="page">Vol. I · Money</span><a href="Tax Coordinator.html" title="Switch to Tax Coordinator">Vol. II · Taxes</a></nav>
    <nav class="tabs" role="tablist" aria-label="Money sections" aria-orientation="vertical">
${tab("overview", "i", "Overview", true)}
${tab("numbers", "ii", "My numbers")}
${tab("debt", "iii", "Debt plan")}
${tab("statements", "iv", "Statements")}
${tab("taxes", "v", "Taxes")}
${tab("strategy", "vi", "Strategy")}
${tab("advisor", "vii", "Advisor's review")}
    </nav>
    <div class="rail-foot">
      <div class="stat">Offline, on this computer</div>
      <div class="stat" id="asof"></div>
      <div class="actions">
        <button class="primary" id="btnSave" title="Save a backup file of your numbers">Save backup</button>
        <button id="btnLoad" title="Open a backup file you saved earlier">Open backup</button>
        <button id="btnSnap" title="Record today's net worth so the history chart grows month to month">Record this month</button>
        <button id="btnLock" title="Lock your numbers with a passphrase">Lock</button>
        <button id="btnLockSet" class="hidden" title="Change or turn off the passphrase">Passphrase</button>
        <button id="btnTheme" class="ghost" title="Switch light or dark" aria-label="Switch light or dark"><svg viewBox="0 0 16 16" width="14" height="14" style="display:block"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 1.8a6.2 6.2 0 0 1 0 12.4z" fill="currentColor"/></svg></button>
        <input type="file" id="fileIn" accept=".json,application/json" class="hidden">
      </div>
    </div>
  </aside>
  <div class="desk">
  <main class="wrap folio">
  <div class="folio-head"><span class="lbl" id="folioHead">Vol. I — Money</span><span class="lbl hide-sm" id="folioDate"></span></div>

`, "shell");

/* Overview */
swap("  <!-- OVERVIEW -->", "  <!-- NUMBERS -->", `  <!-- OVERVIEW -->
  <section id="tab-overview">
    <div id="welcome" class="card hidden" style="margin-top:24px">
      <h2>Welcome. Let's get your <em>full picture.</em></h2>
      <p class="desc" style="margin-bottom:12px">Press <b>Start guided setup</b> and I'll walk you through it one topic at a time, filing each answer in the right place. Rough figures are fine; you can sharpen them later. Everything you type is saved only in this browser on this computer, and you can save a backup file at any time. Keep backups somewhere that isn't synced to the cloud, so not OneDrive, Google Drive or Dropbox.</p>
      <div class="actions" style="display:flex;gap:8px;flex-wrap:wrap"><button class="primary" id="btnWizard">Start guided setup</button><button data-goto="numbers">Fill in the tables myself</button><button id="btnSample">Try it with sample data</button></div>
    </div>

    <div class="spread">
      <div>
        <div class="opening">
          <h1 id="ovTitle"></h1>
          <p class="dek" id="ovDek"></p>
          <div class="story"><svg class="chart" id="chHist" height="300" role="img" aria-label="Net worth history"></svg></div>
        </div>
        <div class="grid g-kpi figs rise" id="kpis"></div>
      </div>
      <aside class="margin">
        <div class="plate rise hidden" id="ovNext"></div>
        <div class="m-block rise"><span class="lbl">What you own and owe</span><div class="legend" id="nwLegend"></div><svg class="chart" id="chNW" height="72" role="img" aria-label="Assets compared with debts"></svg></div>
        <p class="note rise" id="noteStory"></p>
      </aside>
    </div>

    <div class="spread">
      <section class="block rise">
        <div class="block-head"><h2 id="calTitle">Your month, <em>day by day</em></h2><button class="go" data-goto="statements">Statements</button></div>
        <div id="ovCal"></div>
      </section>
      <aside class="margin rise" id="noteCal" style="padding-top:100px"></aside>
    </div>

    <div class="spread">
      <section class="block rise">
        <div class="two">
          <div>
            <div class="block-head"><h2>Where the <em>month goes</em></h2><button class="go" data-goto="numbers">Edit</button></div>
            <svg class="chart" id="chSpend" role="img" aria-label="Spending by category"></svg>
          </div>
          <div>
            <div class="block-head"><h2>Every <em>$100</em> you earn</h2></div>
            <div id="chAlloc" role="img" aria-label="Monthly income allocation"></div>
            <div class="unit-key" id="allocLegend"></div>
            <div id="allocTable"></div>
          </div>
        </div>
      </section>
      <aside class="margin" style="padding-top:100px"><p class="note rise" id="noteSpend"></p></aside>
    </div>

    <div class="spread">
      <section class="block rise">
        <div class="block-head"><h2>The road <em>to debt-free</em></h2><button class="go" data-goto="debt">Debt plan</button></div>
        <div id="ovRoad"></div>
        <div class="block-head" style="margin-top:40px"><h2>How long <em>you could coast</em></h2><span class="lbl">months of essentials</span></div>
        <div id="ovRunway"></div>
      </section>
      <aside class="margin rise" style="padding-top:100px"><div id="noteDebt"></div><div id="noteRunway" style="margin-top:20px"></div></aside>
    </div>

    <div class="spread">
      <section class="block rise">
        <div class="block-head"><h2>Savings <em>goals</em></h2><button class="go" data-goto="numbers">Edit</button></div>
        <div id="goals"></div>
      </section>
      <aside class="margin rise" id="noteGoals" style="padding-top:100px"></aside>
    </div>
    <div class="folio-foot"><span class="lbl">Rough guidance from a rule-based review, not a licensed advisor</span><span class="lbl">— i —</span></div>
  </section>

`, "overview");

/* Close the folio, desk and shell */
once(`  </section>
</div>
<div class="tip" id="tip"></div>`, `  </section>
  </main>
  </div>
</div>
<div class="tip" id="tip"></div>`, "close shell");

/* JS: units chart replaces the stacked bar */
const allocStart = h.indexOf("function chartAlloc(c) {"), allocEnd = h.indexOf("\nfunction chartSpend() {");
const oldAlloc = h.slice(allocStart, allocEnd);
const tail = oldAlloc.slice(oldAlloc.indexOf('  if (c.leftover < 0) $("#allocTable")'));
h = h.slice(0, allocStart) + `function chartAlloc(c) {
  const box = $("#chAlloc"), key = $("#allocLegend");
  // 50/30/20: needs include minimum debt payments; savings include extra debt payments
  const parts = [
    ["Needs", c.needs + c.debtPay, "n", 50, "var(--text)"],
    ["Wants", c.wants + c.spendGoals, "w", 30, "var(--want)"],
    ["Saved, and extra on debt", c.saveGoals + c.extra, "s", 20, "var(--good)"],
    ["No job yet", Math.max(c.leftover, 0), "u", null, "transparent"]
  ];
  const total = Math.max(c.income, sum(parts.slice(0, 3), p => p[1]));
  if (!total) { box.innerHTML = '<div class="empty">Add income and expenses to see where each $100 goes.</div>'; key.innerHTML = ""; $("#allocTable").innerHTML = ""; return; }
  // Share out 100 squares by largest remainder so they always add up
  const raw = parts.map(p => p[1] / total * 100), n = raw.map(Math.floor);
  let left = 100 - n.reduce((s, v) => s + v, 0);
  raw.map((v, i) => [v - n[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0 && parts[i][1] > 0) { n[i]++; left--; } });
  box.setAttribute("aria-label", "Of every $100 you take home: " + parts.map((p, i) => n[i] ? \`$\${n[i]} \${p[0].toLowerCase()}\` : "").filter(Boolean).join(", "));
  let cells = "", k = 0;
  parts.forEach((p, i) => { for (let j = 0; j < n[i]; j++) cells += \`<i class="\${p[2]}" style="--i:\${k++}" data-p="\${i}"></i>\`; });
  box.innerHTML = \`<div class="units">\${cells}</div>\`;
  box.querySelectorAll("i").forEach(cell => { const p = parts[+cell.dataset.p]; bindTip(cell, tipRows(p[0], [["Per month", fmt(p[1])], ["Of every $100", "$" + n[+cell.dataset.p]], ...(p[3] ? [["Guideline", "$" + p[3]]] : [])])); });
  key.innerHTML = parts.map((p, i) => n[i] || p[3] ? \`<div><span class="sw" style="background:\${p[4]};\${p[2] === "u" ? "box-shadow:inset 0 0 0 1px var(--line)" : ""}"></span><span>$\${n[i]} \${p[2] === "n" ? "to needs" : p[2] === "w" ? "to wants" : p[2] === "s" ? "saved or on debt" : "with no job yet"}</span><span>\${p[3] ? "guide $" + p[3] : ""}</span></div>\` : "").join("");
  const over = n[0] - 50, note = $("#noteSpend");
  if (note) note.innerHTML = c.income ? \`<span class="lbl">The squeeze</span>\${over > 0 ? \`Needs take <b>$\${n[0]}</b> of every $100, \${over} more than the guideline.\` : \`Needs fit inside the guideline at <b>$\${n[0]}</b> of every $100.\`} \${n[2] < 20 ? \`Saving is $\${n[2]}, short of the $20 target.\` : \`Saving is on target at $\${n[2]}.\`}\` : "";
` + tail + h.slice(allocEnd);

/* JS: net worth story chart with your own annotations and a pace projection */
const histStart = h.indexOf("function chartHist(c) {"), histEnd = h.indexOf("\nfunction chartDebt() {");
h = h.slice(0, histStart) + `function chartHist(c) {
  const svg = $("#chHist"); clear(svg);
  const W = svg.clientWidth || 600, H = Math.round(Math.max(220, Math.min(320, W * .42)));
  svg.setAttribute("height", H);
  const { rec, pts } = historyPoints(c);
  if (pts.length < 2) {
    svg.setAttribute("aria-label", "Not enough months recorded yet");
    el("line", { x1: 0, x2: W, y1: H - 30, y2: H - 30, stroke: "var(--line)" }, svg);
    // This month is the live "Now" point, so recording it doesn't start the line; say so rather than "no months"
    const thisRec = D.history.some(p => p.date === monthKey());
    text(svg, W / 2, H / 2 - 6, rec.length ? "One month recorded so far." : thisRec ? \`\${MONTHS_L[new Date().getMonth()]} is recorded.\` : "No months recorded yet.", { "text-anchor": "middle", class: "ann" });
    text(svg, W / 2, H / 2 + 16, rec.length || thisRec ? "Record again next month and your line starts here." : "Press Record this month each month and your line appears here.", { "text-anchor": "middle", class: "m" });
    return;
  }
  const avg = paceOf(pts), proj = [];
  if (avg) for (let i = 1; i <= 6; i++) proj.push(pts[pts.length - 1].net + avg * i);
  const n = pts.length + proj.length;
  const L = 46, R = 16, T = 34, B = 30;
  const vals = pts.map(p => p.net).concat(proj), mx = Math.max(...vals), mn = Math.min(...vals);
  const pad = (mx - mn) * .12 || Math.abs(mx) * .1 || 100, ax = axis(mx - mn + pad * 2, 4);
  const lo = Math.floor((mn - pad) / ax.step) * ax.step, hi = Math.ceil((mx + pad) / ax.step) * ax.step;
  const x = i => L + (W - L - R) * i / (n - 1), y = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  for (let v = lo; v <= hi + ax.step / 2; v += ax.step) { el("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: "var(--grid)" }, svg); text(svg, 0, y(v) + 4, compact(v), { class: "m" }); }
  const lab = i => { if (i < pts.length) { const p = pts[i]; return p.now ? "Now" : \`\${MONTHS[+p.date.slice(5, 7) - 1]} ’\${p.date.slice(2, 4)}\`; } const d = new Date(); d.setMonth(d.getMonth() + (i - pts.length + 1)); return \`\${MONTHS[d.getMonth()]} ’\${String(d.getFullYear()).slice(2)}\`; };
  const step = Math.max(1, Math.ceil(n / (W < 520 ? 4 : 7)));
  for (let i = 0; i < n; i += step) if (x(n - 1) - x(i) >= 64 || i === 0) text(svg, x(i), H - 8, lab(i), { "text-anchor": i === 0 ? "start" : "middle", class: "m" });
  text(svg, x(n - 1), H - 8, lab(n - 1), { "text-anchor": "end", class: "m" });
  const d = pts.map((p, i) => \`\${i ? "L" : "M"}\${x(i).toFixed(1)},\${y(p.net).toFixed(1)}\`).join("");
  el("path", { d: d + \`L\${x(pts.length - 1)},\${y(lo)}L\${x(0)},\${y(lo)}Z\`, fill: "var(--s1-wash)" }, svg);
  const line = el("path", { d, fill: "none", stroke: "var(--accent)", "stroke-width": 2.25, "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);
  const last = pts.length - 1;
  let projLine = null;
  if (proj.length) projLine = el("path", { d: [pts[last].net, ...proj].map((v, i) => \`\${i ? "L" : "M"}\${x(last + i).toFixed(1)},\${y(v).toFixed(1)}\`).join(""), fill: "none", stroke: "var(--accent)", "stroke-width": 1.5, "stroke-dasharray": "4 5", opacity: .8 }, svg);

  // Your own annotations: the low point, the best month, and where this pace leads
  const ann = el("g", {}, svg);
  const mark = (i, v, dy, str, anchor) => {
    el("line", { x1: x(i), x2: x(i), y1: y(v) + (dy > 0 ? 7 : -7), y2: y(v) + dy, stroke: "var(--text-2)", "stroke-dasharray": "2 3" }, ann);
    text(ann, Math.max(L, Math.min(W - R, x(i))), y(v) + dy + (dy > 0 ? 14 : -6), str, { class: "ann", "text-anchor": anchor || "middle" });
  };
  const loI = pts.reduce((m, p, i) => p.net < pts[m].net ? i : m, 0);
  let bestI = -1, bestG = 0; pts.forEach((p, i) => { if (i && p.net - pts[i - 1].net > bestG) { bestG = p.net - pts[i - 1].net; bestI = i; } });
  const side = i => i < n * .2 ? "start" : i > n * .8 ? "end" : "middle";
  if (pts.length >= 3 && loI !== last && loI !== 0) mark(loI, pts[loI].net, 26, \`Low point, \${compact(pts[loI].net)}\`, side(loI));
  if (pts.length >= 3 && bestI > 0 && bestI !== loI) mark(bestI, pts[bestI].net, -30, \`Best month, +\${compact(bestG)}\`, side(bestI));
  if (proj.length) text(ann, W - R, Math.max(14, y(proj[proj.length - 1]) - 12), \`≈\${compact(proj[proj.length - 1])} by \${lab(n - 1).replace("’", "")}, at this pace\`, { class: "ann", "text-anchor": "end" });
  const dot = el("circle", { cx: x(last), cy: y(pts[last].net), r: 5, fill: "var(--surface)", stroke: "var(--accent)", "stroke-width": 2.5 }, svg);

  // Draw the line once, the first time the chart appears
  if (!REDUCE && !svg.dataset.drawn) {
    svg.dataset.drawn = "1";
    const len = line.getTotalLength(); line.style.strokeDasharray = len; line.style.strokeDashoffset = len;
    [projLine, ann, dot].forEach(e => e && (e.style.opacity = 0));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      line.style.transition = "stroke-dashoffset 1.5s cubic-bezier(.16,1,.3,1) .35s"; line.style.strokeDashoffset = 0;
      [projLine, dot, ann].forEach((e, k) => { if (e) { e.style.transition = \`opacity .6s ease \${1.4 + k * .15}s\`; e.style.opacity = ""; } });
    }));
  }

  svg.setAttribute("aria-label", \`Net worth by month: \` + pts.map(p => \`\${p.now ? "now" : MONTHS_L[+p.date.slice(5, 7) - 1] + " " + p.date.slice(0, 4)} \${fmt(p.net)}\`).join(", ") + (proj.length ? \`. At this pace, about \${fmt(proj[proj.length - 1])} in six months.\` : ""));
  const cross = el("line", { y1: T, y2: H - B, stroke: "var(--text)", opacity: 0 }, svg);
  const hd = el("circle", { r: 4.5, fill: "var(--accent)", stroke: "var(--surface)", "stroke-width": 2, opacity: 0 }, svg);
  const hit = el("rect", { x: L, y: 0, width: W - L - R, height: H - B, fill: "transparent" }, svg);
  hit.addEventListener("mousemove", e => {
    const bx = svg.getBoundingClientRect(), i = Math.max(0, Math.min(n - 1, Math.round((e.clientX - bx.left - L) / (W - L - R) * (n - 1))));
    const v = i < pts.length ? pts[i].net : proj[i - pts.length], pv = i ? (i - 1 < pts.length ? pts[i - 1].net : proj[i - 1 - pts.length]) : null;
    cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("opacity", .3);
    hd.setAttribute("cx", x(i)); hd.setAttribute("cy", y(v)); hd.setAttribute("opacity", 1);
    const p = pts[i];
    showTip(tipRows(i >= pts.length ? lab(i).replace("’", "20") + " (at this pace)" : p.now ? "Now (not recorded yet)" : \`\${MONTHS_L[+p.date.slice(5, 7) - 1]} \${p.date.slice(0, 4)}\`,
      [["Net worth", fmt(v)], ...(p && p.assets ? [["Assets", fmt(p.assets)], ["Debts", fmt(p.debt)]] : []), ...(pv != null ? [["Change", (v - pv >= 0 ? "+" : "") + fmt(v - pv)]] : [])]), e);
  });
  hit.addEventListener("mouseleave", () => { cross.setAttribute("opacity", 0); hd.setAttribute("opacity", 0); hideTip(); });
}
` + h.slice(histEnd);

/* JS: next step from the review, story render, rail keys */
once("function review(c, sim) {", "let NEXT = null;\nfunction review(c, sim) {", "review");
once("  const actions = steps.slice(0, 3);", "  const actions = steps.slice(0, 3);\n  NEXT = steps[0] || null;", "actions");
once("function renderAll(rebuild = true) {", story + "\nfunction renderAll(rebuild = true) {", "story");
{ const a = h.indexOf('  $("#heroNW").textContent = fmt(c.net);\n'); const b = h.indexOf("\n", h.indexOf('  $("#heroNote").innerHTML', a)) + 1; if (a < 0 || b <= 0) throw new Error("hero lines"); h = h.slice(0, a) + h.slice(b); }
once("sim = chartDebt(); debtTable(sim); review(c, sim);", "sim = chartDebt(); debtTable(sim); review(c, sim);\n  if (!$(\"#tab-overview\").classList.contains(\"hidden\")) overviewStory(c, sim);\n  $(\"#folioDate\").textContent = new Date().toLocaleDateString(LOC, { month: \"long\", year: \"numeric\" });", "renderAll");
once(`  const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TAB_BTNS.length - 1 }[e.key];`, `  const n = { ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: TAB_BTNS.length - 1 }[e.key];`, "keys");
once(`  try { localStorage.setItem(KEY + "-tab", t); } catch (e) {}\n  renderAll(false);`, `  try { localStorage.setItem(KEY + "-tab", t); } catch (e) {}\n  $("#folioHead").textContent = "Vol. I — Money · " + (TAB_BTNS.find(b => b.dataset.tab === t)?.textContent.replace(/^[ivx]+/, "") || "");\n  renderAll(false);`, "folio head");

/* My numbers on a phone: each cell carries its column name so rows can stack as labelled cards (theme.css) */
once("td.appendChild(inp); tr.appendChild(td);", "td.dataset.label = f.label; td.appendChild(inp); tr.appendChild(td);", "editor cell labels");
once('const td = document.createElement("td"); const rm = document.createElement("button"); rm.className = "rm";', 'const td = document.createElement("td"); td.className = "rmc"; const rm = document.createElement("button"); rm.className = "rm"; rm.setAttribute("aria-label", "Remove this row");', "editor remove cell");

/* Bar-chart labels: the column was capped at 130px, which cut off long names like "Bank fees & interest" in the mono font */
if (h.split("labW = Math.min(130, ").length !== 4) throw new Error("label cap: expected 3 charts");
h = h.split("labW = Math.min(130, ").join("labW = Math.min(Math.max(130, W * .45), ");

/* Statements tab: pinned month bar and views */
h = require("./statements.js")(h);
/* Statements: a file's closing balance updates the linked account in What you own */
h = require("./statements-balance.js")(h);
/* Statements: work expenses paid back inside a pay cheque */
h = require("./statements-wx.js")(h);
/* Transactions: a category change applies to that one transaction; the rest are offered */
h = require("./statements-onecat.js")(h);
/* Statements: an Unsorted category, so Other can be chosen on purpose */
h = require("./statements-unsorted.js")(h);
/* Statements: places from the owner's own statements */
h = require("./statements-myplaces.js")(h);
/* Statement import: whole-word payment matching, and "pending" in a web address isn't pending */
h = require("./import-fixes.js")(h);
/* Statements: years (this year as year to date) alongside months */
h = require("./statements-years.js")(h);
/* Transactions: a year listed by month, with month buttons in the pinned bar */
h = require("./statements-txyear.js")(h);

/* CSP: hash the one inline script */
const s0 = h.indexOf("<script>") + 8, s1 = h.indexOf("</script>", s0);
const hash = crypto.createHash("sha256").update(h.slice(s0, s1), "utf8").digest("base64");
h = h.replace(/script-src 'sha256-[^']+'/, `script-src 'sha256-${hash}'`);
fs.writeFileSync(out, h);
console.log("ok", out, h.length, "sha256-" + hash);
