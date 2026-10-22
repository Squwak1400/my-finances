// Builds the redesigned Tax Coordinator.html from the untouched original.
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const B = __dirname, P = process.argv[2];
const src = path.join(P, "Originals (before redesign)", "Tax Coordinator.html");
const out = path.join(process.argv[3] || P, "Tax Coordinator.html");
let h = fs.readFileSync(src, "utf8");
// The owner's own work history (personal/tax.js), left out of shareable builds
for (const [mine, plain] of [...(require("./personal.js")("tax.js") || [])].reverse()) {
  if (h.split(plain).length !== 2) throw new Error("personal tax anchor: " + plain.slice(0, 60));
  h = h.replace(plain, () => mine);
}
/* Which years are still to file is a setting */
h = require("./tax-years.js")(h);
const theme = fs.readFileSync(path.join(B, "theme.css"), "utf8");
const story = fs.readFileSync(path.join(B, "tc-overview.js"), "utf8");

function swap(from, to, rep, label) {
  const a = h.indexOf(from); if (a < 0) throw new Error("anchor not found: " + label);
  const b = to == null ? a + from.length : h.indexOf(to, a + from.length); if (b < 0) throw new Error("end not found: " + label);
  h = h.slice(0, a) + rep + h.slice(b);
}
const once = (s, r, label) => swap(s, null, r, label);

/* CSS */
swap("/* ==== Shared theme", "</style>", theme, "theme");
once("body.is-locked .wrap > :not(header):not(.pageswitch), body.is-locked header .actions > :not(#btnLock):not(#btnTheme):not(a) { display: none !important; }\n", "", "lock css");

/* Shell: rail + folio. The rail nav keeps class "pageswitch": the unlock handoff listens on '.pageswitch a'. */
const tab = (t, r, label, sel, extra) => `      <button role="tab" data-tab="${t}" data-label="${label}" aria-selected="${sel ? "true" : "false"}"><span class="r" aria-hidden="true">${r}</span><span>${label}${extra || ""}</span></button>`;
swap("<body>\n<div class=\"wrap\">", "  <!-- OVERVIEW -->", `<body class="vol-tax">
<div class="shell">
  <aside class="rail" aria-label="Index">
    <div class="rail-brand">My finances<small>Private ledger · offline</small></div>
    <nav class="vols pageswitch" aria-label="Switch page"><a href="Financial Advisor.html" title="Switch to Financial Advisor">Vol. I · Money</a><span aria-current="page">Vol. II · Taxes</span></nav>
    <nav class="tabs" role="tablist" aria-label="Tax sections" aria-orientation="vertical">
${tab("overview", "i", "Overview", true)}
${tab("import", "ii", "Import")}
${tab("review", "iii", "Review", false, ' <span id="revCount"></span>')}
${tab("years", "iv", "Year reports")}
${tab("holdings", "v", "Holdings")}
${tab("work", "vi", "Work and deductions")}
${tab("strategy", "vii", "Strategy")}
${tab("filing", "viii", "Filing plan")}
    </nav>
    <div class="rail-foot">
      <div class="stat">Offline, on this computer</div>
      <div class="stat">Catch-up, <span data-yspan>2021 to 2025</span></div>
      <div class="actions">
        <button class="primary" id="btnSave" title="Save a backup file of your tax workspace">Save backup</button>
        <button id="btnLoad" title="Open a backup file you saved earlier">Open backup</button>
        <button id="btnLock" class="hidden">Lock now</button>
        <button id="btnTheme" class="ghost" title="Switch light or dark" aria-label="Switch light or dark"><svg viewBox="0 0 16 16" width="14" height="14" style="display:block"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 1.8a6.2 6.2 0 0 1 0 12.4z" fill="currentColor"/></svg></button>
        <input type="file" id="backupIn" accept=".json,application/json" class="hidden">
      </div>
    </div>
  </aside>
  <div class="desk">
  <main class="wrap folio">
  <div class="folio-head"><span class="lbl" id="folioHead">Vol. II — Taxes · Overview</span><span class="lbl hide-sm">Catch-up, <span data-yspan>2021 to 2025</span></span></div>

`, "shell");

/* Overview */
swap("  <!-- OVERVIEW -->", "  <!-- IMPORT -->", `  <!-- OVERVIEW -->
  <section id="tab-overview">
    <div id="welcome" class="card hidden" style="margin-top:24px">
      <h2>Let's get your crypto <em>sorted for CRA.</em></h2>
      <p class="desc" style="margin-bottom:12px">Import your full transaction history from Crypto.com and Kraken, from your very first purchase. I'll match transfers between your accounts, work out your average cost (ACB) the way CRA requires, and give you a gain, loss and income summary for each year you need to file. Nothing leaves this computer.</p>
      <div class="actions" style="display:flex;gap:8px;flex-wrap:wrap"><button class="primary" data-goto="import">Import my files</button><button id="btnSample">Try it with sample data</button></div>
    </div>
    <div id="sampleNote" class="notice hidden" style="margin-top:20px"><b>You're looking at made-up sample data.</b> <button id="btnClearSample" style="margin-left:8px">Remove sample data</button></div>

    <div class="spread">
      <div>
        <div class="opening">
          <h1 id="ovTitle"></h1>
          <p class="dek" id="ovDek"></p>
          <div class="late"><div class="big" id="lateDays">—</div><p id="lateNote"></p></div>
        </div>
        <div class="grid g-kpi figs rise" id="kpis"></div>
      </div>
      <aside class="margin">
        <div class="plate rise hidden" id="ovNext"></div>
        <div class="m-block rise"><span class="lbl">Crypto to report, <span data-yspan>2021 to 2025</span></span><div class="mfig" id="heroVal">$0</div><p class="desc" id="heroNote" style="margin:6px 0 0;font-size:13.5px"></p></div>
        <p class="note rise" id="noteLate"></p>
      </aside>
    </div>

    <div class="spread">
      <section class="block rise">
        <div class="block-head"><h2>Year <em>by year</em></h2><button class="go" data-goto="years">Year reports</button></div>
        <div class="legend" id="yrLegend"></div>
        <svg class="chart" id="chYears" height="220" role="img" aria-label="Net capital gain or loss and crypto income by year"></svg>
        <div id="yrTable" style="margin-top:28px"></div>
      </section>
      <aside class="margin rise" id="noteYears" style="padding-top:100px"></aside>
    </div>

    <div class="spread">
      <section class="block rise">
        <div class="two">
          <div>
            <div class="block-head"><h2>Needs <em>your attention</em></h2><button class="go" data-goto="review">Review</button></div>
            <div id="attn"></div>
          </div>
          <div>
            <div class="block-head"><h2>Filing <em>rail</em></h2><button class="go" data-goto="filing">Filing plan</button></div>
            <div id="ovFiling"></div>
          </div>
        </div>
      </section>
      <aside class="margin rise" id="noteFiling" style="padding-top:100px"></aside>
    </div>
    <div class="folio-foot"><span class="lbl">General guidance, not a licensed tax professional</span><span class="lbl">— ii —</span></div>
  </section>

`, "overview");

/* Close the folio, desk and shell */
once(`  </section>
</div>
<dialog id="lockDlg"`, `  </section>
  </main>
  </div>
</div>
<dialog id="lockDlg"`, "close shell");

/* JS: the overview story replaces renderOverview() and drawYears() */
swap("function renderOverview() {", "\nfunction fileCheck() {", story, "story");

/* JS: rail keys, folio head, redraw the overview when it comes back into view */
once("const j = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ?", "const j = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ?", "keys");
once("  try { sessionStorage.setItem('tc.tab', name); } catch (e) {}\n}", `  try { sessionStorage.setItem('tc.tab', name); } catch (e) {}
  const tb = $('nav.tabs button[data-tab="' + name + '"]');
  $('#folioHead').textContent = 'Vol. II — Taxes · ' + (tb ? tb.dataset.label : '');
  if (name === 'overview' && R) renderOverview();
}`, "goTab");

/* CSP: hash both inline scripts, in order */
const hashes = [];
for (let at = 0, s0; (s0 = h.indexOf("<script>", at)) >= 0; at = s0) {
  s0 += 8; const s1 = h.indexOf("</script>", s0);
  hashes.push("'sha256-" + crypto.createHash("sha256").update(h.slice(s0, s1), "utf8").digest("base64") + "'");
}
if (hashes.length !== 2) throw new Error("expected 2 scripts, found " + hashes.length);
h = h.replace(/script-src 'sha256-[^']+' 'sha256-[^']+'/, "script-src " + hashes.join(" "));
if (!h.includes("script-src " + hashes.join(" "))) throw new Error("CSP not updated");
fs.writeFileSync(out, h);
console.log("ok", out, h.length, hashes.join(" "));
