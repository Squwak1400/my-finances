/* Notebook view: a hand-drawn reading of My finances, Taxes and Settings (owner chose it 2026-10-12).
   Runs after the app. Reads only what the app renders and its own month figures (window.__nb,
   exposed by build-one.js), so every number is live and nothing leaves this computer.
   The Ledger/Notebook switch sits in every folio head and on Settings → Appearance. */
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const fmt = n => "$" + Math.round(Math.abs(n)).toLocaleString("en-CA");
  const VOLS = ["#volMoney", "#volTax", "#volSettings"];
  const isNb = () => document.documentElement.classList.contains("nb");

  // wobble for edges and lines; pencil = wobble + grain, for fills; sketch = outline + diagonal hatching, for chart bars
  const HATCH_TILE = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="7" height="7"><path d="M-1 1l2-2M0 7l7-7M6 8l2-2" stroke="#000" stroke-width="2" opacity=".8"/></svg>');
  const SKETCH = `      <feImage href="${HATCH_TILE}" x="0" y="0" width="7" height="7" result="t"/><feTile in="t" result="m"/>
      <feComposite in="SourceGraphic" in2="m" operator="in" result="hatch"/>
      <feComponentTransfer in="SourceGraphic" result="tint"><feFuncA type="linear" slope=".2"/></feComponentTransfer>
      <feMorphology in="SourceAlpha" operator="erode" radius="1.3" result="inner"/>
      <feComposite in="SourceGraphic" in2="inner" operator="out" result="ring"/>
      <feMerge result="all"><feMergeNode in="tint"/><feMergeNode in="hatch"/><feMergeNode in="ring"/></feMerge>
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="w"/>
      <feDisplacementMap in="all" in2="w" scale="2.4" xChannelSelector="R" yChannelSelector="G"/>
`;
  document.body.insertAdjacentHTML("afterbegin", `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <filter id="nbwob" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="2.6" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="nbpencil" x="-4%" y="-4%" width="108%" height="108%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="w"/>
      <feDisplacementMap in="SourceGraphic" in2="w" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="1" seed="11" result="g"/>
      <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.6 0 0 0 1.55" result="m"/>
      <feComposite in="d" in2="m" operator="in"/>
    </filter>
    <filter id="nbsketch" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">
${SKETCH}    </filter>
    <filter id="nbsketchsvg" filterUnits="userSpaceOnUse" x="-20" y="-20" width="1500" height="800" color-interpolation-filters="sRGB">
${SKETCH}    </filter></svg>`);

  // ── Ledger / Notebook switch in every volume's folio head ──
  for (const v of VOLS) $(v + " .folio-head")?.insertAdjacentHTML("beforeend", '<span class="nb-views noprint" role="group" aria-label="How to show this page"><button type="button" data-v="ledger">Ledger</button><button type="button" data-v="notebook">Notebook</button></span>');
  const setView = v => {
    document.documentElement.classList.toggle("nb", v === "notebook");
    $$(".nb-views [data-v]").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === v));
    store.set("fa-nb-view", v);
    if (v === "notebook") refresh();
    flow.render(); st.render();
  };
  document.addEventListener("click", e => { const b = e.target.closest(".nb-views [data-v]"); if (b) setView(b.dataset.v); });

  // ── icons on headings, picked by what the section is about ──
  const IC = {
    coins: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v4c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 10v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4M5 14v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/>',
    receipt: '<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="1.5"/><path d="M4 10h16M8 3v4M16 3v4"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
    chain: '<path d="M10 14l4-4"/><path d="M8.5 11.5l-2 2a3 3 0 0 0 4 4l2-2M15.5 12.5l2-2a3 3 0 0 0-4-4l-2 2"/>',
    piggy: '<path d="M4 13c0-4 3.5-7 8-7s8 3 8 6.5c0 2.3-1.3 3.8-2.8 4.8V20h-3v-1.5h-4V20h-3v-2.6C5.6 16.4 4 15 4 13z"/><path d="M20 11l2-1M10 6c0-2 4-2 4 0"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 12l7-7M16 5h3v3"/>',
    hourglass: '<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9"/>',
    house: '<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/>',
    card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h4"/>',
    flow: '<path d="M3 7c6 0 6 10 12 10h6M3 7c6 0 6-3 12-3h6M3 7c5 0 7 6 12 6h6"/>',
    scales: '<path d="M12 4v16M7 20h10M5 7h14"/><path d="M5 7l-3 6h6zM19 7l-3 6h6z"/>',
    bars: '<path d="M5 20V11M10 20V6M15 20v-8M20 20V4M3 20h19"/>',
    arrows: '<path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="M15 15l5 5"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="1.5"/><path d="M9 7V4h6v3M3 12h18"/>',
    doc: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
    folder: '<path d="M3 7h6l2 2h10v10H3z"/>',
    list: '<path d="M10 6h10M10 12h10M10 18h10"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    btc: '<circle cx="12" cy="12" r="8.5"/><path d="M10 8h3.2a2 2 0 0 1 0 4H10zm0 4h3.8a2 2 0 0 1 0 4H10zM10 7v10M12 6v2M12 16v2"/>',
    box: '<path d="M3 8l9-4 9 4v10l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v10"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7"/>',
    sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5 5l1.8 1.8M17.2 17.2 19 19M5 19l1.8-1.8M17.2 6.8 19 5"/>',
    wand: '<path d="M4 20 16 8M14 4v2M18 8h2M19 4l-1.5 1.5M11 3v1M20 11h1"/>',
    check: '<path d="M5 12l4 4 10-10"/><path d="M4 20h16"/>',
    flame: '<path d="M12 21c-4 0-6-3-6-6 0-4 4-6 4-11 3 2 4 4 4 6 1-1 2-2 2-3 2 2 2 5 2 8 0 3-2 6-6 6z"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8"/>',
    plane: '<path d="M3 11l18-7-7 18-2.5-8z"/><path d="M11.5 14 21 4"/>'
  };
  const ICON_FOR = [
    [/welcome|let's get|setup|guided|let's build/i, "wand"], [/day by day/i, "calendar"], [/money went|flow/i, "flow"],
    [/month goes|bills|spending|spent the most|spent/i, "receipt"], [/every \$100|income|take-home|money in/i, "coins"],
    [/debt-free|road|payoff/i, "flag"], [/debt/i, "chain"], [/coast|cushion|emergency/i, "hourglass"], [/goal/i, "target"],
    [/worth|you own|holdings|still hold/i, "house"], [/credit card/i, "card"], [/actual vs|planned/i, "scales"],
    [/in and out|by month|year by year/i, "bars"], [/changed/i, "arrows"], [/unsorted|transactions|search/i, "search"],
    [/work|deduction|employ|business/i, "briefcase"], [/pay less|ways to/i, "bulb"], [/pilot|flying/i, "plane"], [/estimate/i, "scales"], [/crypto|coin|swap|disposal/i, "btc"], [/import|files|statements/i, "folder"],
    [/review|attention|checklist|needs/i, "list"], [/strategy|plan|filing rail|catch-up/i, "compass"],
    [/return|tax|cra|schedule|report/i, "doc"], [/backup/i, "box"], [/lock|passphrase/i, "lock"], [/about you/i, "person"],
    [/appearance|page style/i, "sun"], [/question/i, "chat"], [/start over/i, "alert"], [/history|record/i, "bars"]];
  const svgIc = (k, cls = "nbico") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;
  function addIcons() {
    for (const v of VOLS) for (const h of $$(v + " h2")) {
      if (h.querySelector(".nbico") || h.closest("#tx-tab-cpa, #nbMemo, .folio-head")) continue;
      const m = ICON_FOR.find(([re]) => re.test(h.textContent)); if (!m) continue;
      h.insertAdjacentHTML("afterbegin", svgIc(m[1]));
    }
  }

  // ── figures inside handwritten headings and notes go back to mono ──
  const NUM = /([−+-]?\$?\d[\d,]*(?:\.\d+)?%?)/;
  let busy = false;
  function wrapNumbers() {
    if (!isNb() || busy) return;
    busy = true;
    for (const v of VOLS) for (const el of $$(v + " :is(h1, h2, h3, .margin .note, .ann)")) {
      if (el.closest("svg, button, select, label, .nbn, .num, .folio-head, #nbMemo, #tx-tab-cpa")) continue;
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const nodes = []; let n;
      while ((n = w.nextNode())) if (NUM.test(n.nodeValue) && !n.parentElement.closest(".nbn, svg, button, input, select, option")) nodes.push(n);
      for (const t of nodes) {
        const frag = document.createDocumentFragment();
        t.nodeValue.split(NUM).forEach((p, i) => { if (!p) return; if (i % 2) { const s = document.createElement("span"); s.className = "nbn"; s.textContent = p; frag.append(s); } else frag.append(p); });
        // inside a flex or grid heading the pieces would become separate items, so they stay in one span
        if (/flex|grid/.test(getComputedStyle(t.parentElement).display)) { const run = document.createElement("span"); run.append(frag); t.replaceWith(run); } else t.replaceWith(frag);
      }
    }
    busy = false;
  }
  function refresh() { busy = true; addIcons(); busy = false; wrapNumbers(); buildMemo(); }
  let wt; const mo = new MutationObserver(() => { if (busy || !isNb()) return; clearTimeout(wt); wt = setTimeout(refresh, 140); });
  for (const v of VOLS) { const el = $(v); if (el) mo.observe(el, { childList: true, subtree: true }); }

  // ── notebook Advisor's review, rebuilt from the live Ledger memo ──
  const memo = $("#memo");
  memo.insertAdjacentHTML("afterend", '<div class="card memo nb-skip" id="nbMemo" aria-label="Advisor\'s review, notebook view"></div>');
  const out = $("#nbMemo");
  const money = s => +String(s).replace(/[^\d.-]/g, "").replace(/^-/, "") || 0;
  const DOODLES = [IC.doc, IC.piggy, '<path d="M6 30l10-10 8 8 18-18"/><path d="M32 10h10v10"/><path d="M8 42h34"/>', '<path d="M10 24l9 9 19-19"/><circle cx="24" cy="24" r="19"/>'];
  const DOODLE_VB = ["0 0 24 24", "0 0 24 24", "0 0 48 48", "0 0 48 48"];
  const SERIES = [
    [/needs|living/i, "var(--text-2)"], [/wants|lifestyle/i, "var(--want)"], [/minimum debt/i, "var(--s2)"], [/extra debt/i, "var(--s2)", 1],
    [/savings goals|goals/i, "var(--s3)"], [/saving up|purchases/i, "var(--s3)", 1], [/tax/i, "var(--s4)", 1], [/not yet|unassigned/i, "var(--surface-2)"]];
  const STATUS = { act: ["var(--critical)", "M10 21c3-4 7-4 10 0"], watch: ["var(--warning)", "M10 19h10"], healthy: ["var(--good)", "M10 18c3 4 7 4 10 0"] };
  const SEV = { "Needs attention": ["var(--critical)", "Needs attention", "alert"], "Watch": ["var(--warning)", "Watch", "eye"], "Note": ["var(--accent)", "Good to know", "bulb"] };
  const box = (cls, inner, style = "", wash = true) => `<div class="hb ${cls}" style="${style}"><span class="edge"></span>${wash ? '<span class="wash"></span>' : ""}${inner}</div>`;
  const nums = s => esc(s).replace(/([−+-]?\$?\d[\d,]*(?:\.\d+)?%?)/g, '<span class="num">$1</span>');
  function buildMemo() {
    if (!isNb()) return;
    const lh = $(".letterhead", memo);
    if (!lh) { out.innerHTML = memo.innerHTML; return; }
    const tables = $$("table.data", memo);
    const rows = t => t ? $$("tbody tr", t).map(r => [...r.cells].map(c => c.textContent.trim())) : [];
    const glance = rows(tables[0]), ratios = rows(tables[1]);
    const take = glance.find(r => /take-home/i.test(r[0]));
    const parts = glance.filter(r => r !== take).map(r => { const s = SERIES.find(([re]) => re.test(r[0])) || [null, "var(--muted)"]; return { k: r[0].replace(/\s*\(.*\)$/, ""), v: money(r[1]), c: s[1], h: s[2] }; }).filter(p => p.v > 0);
    const tot = parts.reduce((a, p) => a + p.v, 0) || 1;
    const summary = $(":scope > p", memo)?.innerHTML.replace(/<b>Summary\.<\/b>\s*/, "") || "";
    const steps = $$(".steps > li", memo).map(li => { const b = $("b", li)?.textContent || ""; return { b, rest: li.textContent.replace(b, "").trim() }; });
    const after = $(".steps", memo)?.nextElementSibling?.textContent.trim() || "";
    const findings = $$(".finding", memo).map(f => ({ sev: f.querySelector("svg")?.getAttribute("aria-label") || "Note", t: $("h3", f)?.textContent || "", p: $("p", f)?.textContent || "" }));
    const unassigned = parts.find(p => /not yet/i.test(p.k));
    out.innerHTML = `
      <div class="lh"><div><h2>${svgIc("list")}Advisor's review</h2><div class="desc">${esc($(".desc", lh)?.textContent || "")}</div></div>
        <div><button type="button" id="nbPrint">Print or save as PDF</button></div></div>
      <p class="summary">${summary}</p>
      <div class="grid-a">
        ${box("", `<p class="h3"><span class="badge">1</span>Where your take-home goes</p>
          <div class="note">You bring home <span class="big">${esc(take ? take[1] : "")}</span> a month.</div>
          <div class="hbar">${parts.map(p => `<i class="${p.h ? "hatch" : ""}" title="${esc(p.k)}: $${p.v.toLocaleString()}" style="width:${p.v / tot * 100}%;${p.h ? `--c2:${p.c};background-color:transparent` : `background:${p.c}`}"></i>`).join("")}</div>
          <div class="legend">${parts.map(p => `<span class="${p.h ? "h" : ""}" style="--c:${p.c}">${esc(p.k)}<span class="num">$${p.v.toLocaleString()}</span></span>`).join("")}</div>
          ${unassigned ? `<p class="quiet" style="margin:10px 0 0">← <span class="num">$${unassigned.v.toLocaleString()}</span> has no job yet. Give it one in step 2.</p>` : ""}`, "", false)}
        <div class="steps-nb">
          <p class="h3" style="margin:0 0 4px"><span class="badge">2</span>Do these next, in order</p>
          ${steps.map((s, i) => box("tinted step", `<div class="row"><svg class="doodle" viewBox="${DOODLE_VB[i % 4]}" aria-hidden="true">${DOODLES[i % 4]}</svg><div class="note"><b>${nums(s.b)}</b> ${nums(s.rest)}</div></div>`)).join('<svg class="down" viewBox="0 0 30 20" aria-hidden="true"><path d="M15 1c-2 6 2 9 0 16M10 12l5 6 5-6"/></svg>')}
          ${after ? `<p class="quiet" style="margin:6px 0 0">${nums(after)}</p>` : ""}
        </div>
      </div>
      <div class="sec"><p class="h3"><span class="badge">3</span>Quick health check</p>
        <div class="checks">${ratios.map(r => { const [c, mouth] = STATUS[(r[3] || "").toLowerCase().trim()] || STATUS.watch;
          return box("chk", `<svg class="face" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="12"/><path d="M11 12v1M19 12v1"/><path d="${mouth}"/></svg><div class="k">${esc(r[0])}</div><div class="v">${esc(r[1])}</div><div class="aim">aim: ${esc(r[2])}</div><span class="st">${esc(r[3])}</span>`, `--st:${c}`); }).join("")}</div></div>
      <div class="sec"><p class="h3"><span class="badge">4</span>Heads up</p>
        ${Object.keys(SEV).map(k => { const list = findings.filter(f => f.sev === k); if (!list.length) return ""; const [c, label, ic] = SEV[k];
          return `<div class="grp">${label} · ${list.length}</div><div class="heads">${list.map((f, i) => box("sticky", `<i class="tape"></i><span class="sev">${svgIc(ic, "")}${label}</span><h4>${esc(f.t)}</h4><p>${nums(f.p)}</p>`, `--st:${c};--r:${[-1, .7, -.5, .9, -.8][i % 5]}deg`)).join("")}</div>`; }).join("")}
      </div>
      <p class="foot">${esc($(".disclaimer", memo)?.textContent || "")}</p>`;
    $("#nbPrint").onclick = () => $("#btnPrint")?.click();
  }
  let mt; new MutationObserver(() => { clearTimeout(mt); mt = setTimeout(buildMemo, 80); }).observe(memo, { childList: true, subtree: true, characterData: true });

  // ── Where your money went: two new options beside the original ──
  const flow = (() => {
    const NB = window.__nb;
    const svgOrig = $("#chFlow"); if (!svgOrig || !NB) return { render() {} };
    const card = svgOrig.closest(".card"), desc = $(":scope > .desc", card), legend = $(":scope > .legend", card), wrap = svgOrig.parentElement;
    desc.insertAdjacentHTML("afterend", '<span class="nb-views nb-flowpick" role="group" aria-label="Chart style"><button type="button" data-fv="pic">Illustrated</button><button type="button" data-fv="jars">Jars</button></span>');
    wrap.insertAdjacentHTML("afterend", '<div id="nbFlow" aria-live="polite"></div>');
    const box = $("#nbFlow");
    // two notebook views: Illustrated (default) and Jars; Ledger keeps the original chart
    let mode = store.get("fa-nb-flow") === "jars" ? "jars" : "pic";
    card.addEventListener("click", e => { const b = e.target.closest("[data-fv]"); if (!b) return; mode = b.dataset.fv; store.set("fa-nb-flow", mode); render(); });

    function data() {
      const k = NB.period(); if (!k) return null;
      const cur = NB.monthStats(k), planM = NB.plannedBy(), plan = {};
      Object.entries(planM).forEach(([c, v]) => plan[c] = v * cur.months);
      const src = {};
      cur.tx.filter(t => t.category === "Income" && t.amount > 0).forEach(t => { const n = NB.pretty(t.desc) || t.desc; src[n] = (src[n] || 0) + t.amount; });
      return { k, cur, plan, src };
    }
    const hatch = (id, c) => `<pattern id="${id}" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(40)"><rect width="7" height="7" style="fill:${c};opacity:.22"/><line x1="1" y1="0" x2="1" y2="7" style="stroke:${c}" stroke-width="2.2" opacity=".75"/></pattern>`;
    const COL = { inc: "var(--s3)", spend: "var(--s2)", debt: "var(--s5)", saved: "var(--s1)", left: "var(--good)", from: "var(--muted)" };

    // where the money came from (left) and where it went (right): six biggest categories, the rest
    // grouped, then debt payments, saving and whatever was left over (or taken from savings)
    function split(d) {
      const { cur } = d, inc = cur.inc;
      let srcs = Object.entries(d.src).sort((a, b) => b[1] - a[1]);
      const srcTot = srcs.reduce((a, s) => a + s[1], 0) || 1;
      if (srcs.length > 3) srcs = [...srcs.slice(0, 2), ["Other income", srcs.slice(2).reduce((a, s) => a + s[1], 0)]];
      const left = srcs.map(([n, v]) => ({ n, v: v / srcTot * inc, kind: "inc", c: COL.inc }));
      const cats = Object.entries(cur.by).filter(([, v]) => v > 0.5).sort((a, b) => b[1] - a[1]);
      const top = cats.slice(0, 6), rest = cats.slice(6);
      const right = top.map(([n, v]) => ({ n, v, kind: "spend", cat: n, c: COL.spend }));
      if (rest.length) right.push({ n: "Everything else", v: rest.reduce((a, r) => a + r[1], 0), kind: "spend", c: COL.spend, list: rest.map(r => r[0]) });
      if (cur.debt > 0.5) right.push({ n: "Debt payments", v: cur.debt, kind: "debt", cat: "Debt payment", c: COL.debt });
      if (cur.saved > 0.5) right.push({ n: "Saved & invested", v: cur.saved, kind: "saved", cat: "Saving & investing", c: COL.saved });
      const outTot = right.reduce((a, r) => a + r.v, 0), gap = inc - outTot;
      if (gap > 0.5) right.push({ n: "Left over", v: gap, kind: "left", c: COL.left });
      if (gap < -0.5) left.push({ n: "From savings", v: -gap, kind: "from", c: COL.from });
      return { inc, left, right, rest, outTot, gap };
    }

    function renderJars(d) {
      const { cur, plan } = d;
      const cats = [...new Set([...Object.keys(cur.by), ...Object.keys(plan)])].filter(c => (cur.by[c] || 0) > 0.5 || (plan[c] || 0) > 0.5);
      const maxA = Math.max(1, ...cats.map(c => cur.by[c] || 0));
      const rows = cats.map(c => { const a = cur.by[c] || 0, p = plan[c] || 0; return { c, a, p, over: p ? a - p : 0 }; })
        .sort((x, y) => (y.over > 0) - (x.over > 0) || y.over - x.over || y.a - x.a);
      const planTot = Object.values(plan).reduce((a, v) => a + v, 0);
      const JAR = "M24 6h36v9c0 4 14 7 14 20v55c0 6-4 10-10 10H20c-6 0-10-4-10-10V35c0-13 14-16 14-20z";
      box.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${hatch("nbj-ok", "var(--accent)")}${hatch("nbj-over", "var(--s2)")}${hatch("nbj-none", "var(--muted)")}</defs></svg>
        <div class="head"><span>In <b>${fmt(cur.inc)}</b></span><span>Spent <b>${fmt(cur.spend)}</b> of a <b>${fmt(planTot)}</b> plan</span><span>Debt payments <b>${fmt(cur.debt)}</b></span></div>
        <div class="jars">${rows.map((r, i) => {
          const ratio = r.p ? r.a / r.p : r.a / maxA * .8, fillH = Math.min(1, ratio) * 84, over = r.p && r.a > r.p * 1.02;
          const pat = over ? "over" : r.p ? "ok" : "none";
          const st = !r.p ? `<span class="st none">no plan</span>` : over ? `<span class="st over">${fmt(r.a - r.p)} over</span>` : r.p - r.a < 1 ? `<span class="st left">on plan</span>` : `<span class="st left">${fmt(r.p - r.a)} left</span>`;
          return `<button type="button" class="jar" data-open="${esc(r.c)}" aria-label="${esc(r.c)}: ${fmt(r.a)}${r.p ? " of " + fmt(r.p) + " planned" : ""}">
            <svg viewBox="0 0 84 104" aria-hidden="true"><defs><clipPath id="nbj${i}"><path d="${JAR}"/></clipPath></defs>
              <g clip-path="url(#nbj${i})"><rect x="0" y="${100 - fillH}" width="84" height="${fillH + 4}" fill="url(#nbj-${pat})" filter="url(#nbpencil)"/><path d="M8 ${100 - fillH}h68" style="stroke:var(--text)" stroke-width="1.2" fill="none" filter="url(#nbwob)"/></g>
              ${r.p ? `<path d="M12 ${100 - 84 / Math.max(1, ratio)}h60" style="stroke:var(--text)" stroke-width="1.3" stroke-dasharray="3 3" fill="none"/>` : ""}
              <path d="${JAR}" fill="none" style="stroke:var(--text)" stroke-width="1.8" filter="url(#nbwob)"/>
              ${over ? `<path class="heap" d="M21 9c0-9 42-9 42 0z" fill="url(#nbj-over)"/>` : `<path d="M22 6h40" style="stroke:var(--text)" stroke-width="3" stroke-linecap="round" filter="url(#nbwob)"/>`}
              ${over ? `<g class="drip"><path d="M23 8c-5 1-9 5-11 12M61 8c5 1 9 5 11 12"/><path d="M10.5 22.5c-1.6 2.4-2 3.6-.2 4.3 1.8.6 2.2-1.5.2-4.3zM73.5 22.5c1.6 2.4 2 3.6.2 4.3-1.8.6-2.2-1.5-.2-4.3z"/></g>` : ""}
            </svg>
            <span class="nm">${esc(r.c)}</span><span class="fg">${fmt(r.a)}${r.p ? " / " + fmt(r.p) : ""}</span>${st}</button>`; }).join("")}</div>
        <p class="fnote">Each jar is filled to what you spent against your plan; the dashed line is the plan. Tap a jar to see its transactions.</p>`;
      box.onclick = e => { const o = e.target.closest("[data-open]"); if (o) NB.openTx("", o.dataset.open); };
    }

    // ── Illustrated: a cute infographic (art direction from the gpt-image-2 hand-drawn template).
    // Every object is drawn here in SVG rather than as a picture, so the figures stay live and
    // nothing leaves the computer. Pointing at a card or its slice of the dollar bar lights both up.
    const face = (x, y, mood = "") => `<g class="face">${mood === "worry" ? `<path d="M${x - 9} ${y - 4.5}l4.5 -2.2M${x + 9} ${y - 4.5}l-4.5 -2.2"/>` : ""}<circle cx="${x - 6}" cy="${y}" r="1.9"/><circle cx="${x + 6}" cy="${y}" r="1.9"/>` +
      (mood === "worry" ? `<path d="M${x - 3} ${y + 6}q3 -3 6 0"/>` : `<path d="M${x - 3.2} ${y + 4}q3.2 3 6.4 0"/>`) +
      `<ellipse class="blush" cx="${x - 10}" cy="${y + 4}" rx="2.6" ry="1.5"/><ellipse class="blush" cx="${x + 10}" cy="${y + 4}" rx="2.6" ry="1.5"/></g>`;
    const ART = {
      house: `<path class="b" d="M13 31 32 14l19 17v22H13z"/><path class="ln c" d="M8 32 32 10l24 22"/><path class="ln" d="M27 53v-7h10v7"/>${face(32, 34)}`,
      bag: `<path class="ln c" d="M24 24c-3-6-5-9-4-13M27 24c0-5 2-9 6-11M38 24c2-5 6-8 10-8"/><path class="b" d="M14 24h36l-3 30H17z"/>${face(32, 38)}`,
      bowl: `<path class="ln" d="M24 26c-3-4 3-6 0-11M32 26c-3-4 3-6 0-11"/><path class="ln c" d="M40 30 53 11M44 31 57 14"/><path class="b" d="M9 31h46c0 12-10 21-23 21S9 43 9 31z"/>${face(32, 38)}`,
      car: `<path class="b" d="M7 44v-8c0-3 2-5 5-5h5l6-10h18l6 10h5c3 0 5 2 5 5v8z"/><path class="ln" d="M24 31l4-6h8l4 6"/><circle class="w" cx="19" cy="46" r="5"/><circle class="w" cx="45" cy="46" r="5"/>${face(32, 37)}`,
      shop: `<path class="ln" d="M24 22c0-11 16-11 16 0"/><path class="b" d="M14 22h36l-2 32H16z"/><path class="c f" d="M44 26c-1.5-2.5-5.5-1-4 2l4 3.5 4-3.5c1.5-3-2.5-4.5-4-2z"/>${face(30, 40)}`,
      bulb: `<path class="ln c" d="M7 22h-4M61 22h-4M12 8 9 5M52 8l3-3"/><path class="b" d="M32 7c-11 0-18 8-18 17 0 7 5 11 8 15v6h20v-6c3-4 8-8 8-15 0-9-7-17-18-17z"/><path class="ln" d="M24 50h16M26 55h12"/>${face(32, 25)}`,
      phone: `<rect class="b" x="18" y="7" width="28" height="50" rx="5"/><path class="ln" d="M28 51h8"/><path class="ln c" d="M50 14c3 3 3 8 0 11M54 10c5 5 5 14 0 19"/>${face(32, 28)}`,
      umbrella: `<path class="ln" d="M32 32v16c0 4 6 4 6 0"/><path class="b" d="M7 32C7 18 18 9 32 9s25 9 25 23c-4-3-8-3-12 0-4-3-8-3-13 0-4-3-8-3-12 0-4-3-8-3-13 0z"/>${face(32, 22)}`,
      tv: `<path class="ln" d="M24 7l8 8 8-8M22 55h20"/><rect class="b" x="7" y="15" width="50" height="34" rx="5"/><path class="c f" d="M45 20v8l6-4z"/>${face(30, 33)}`,
      ticket: `<path class="b" d="M7 19h50v9a4 4 0 0 0 0 8v9H7v-9a4 4 0 0 0 0-8z"/><path class="ln c" d="M45 21v22" stroke-dasharray="3 3"/>${face(25, 31)}`,
      bottle: `<path class="ln" d="M38 15h7v5"/><path class="c f" d="M26 13h12v11H26z"/><path class="b" d="M21 24h22v28c0 3-2 5-5 5H26c-3 0-5-2-5-5z"/>${face(32, 39)}`,
      card: `<rect class="b" x="5" y="17" width="54" height="34" rx="5"/><path class="c f" d="M5 25h54v6H5z"/><path class="drop" d="M54 5c-3 4-3 7 0 7s3-3 0-7z"/>${face(28, 41, "worry")}`,
      piggy: `<circle class="c f" cx="34" cy="8" r="4.5"/><path class="b" d="M11 35c0-10 9-17 21-17s21 7 21 16c0 6-3 10-7 12v7h-6v-5H26v5h-6v-7c-5-2-9-6-9-11z"/><path class="ln" d="M53 31l5-2M27 18c1-4 6-5 8-2"/>${face(29, 33)}`,
      wallet: `<path class="b" d="M7 20h45c2 0 4 2 4 4v24c0 2-2 4-4 4H7z"/><path class="c f" d="M42 30h14v10H42z"/>${face(24, 36)}`,
      gift: `<path class="b" d="M10 26h44v28H10z"/><path class="c f" d="M29 26h6v28h-6z"/><path class="ln c" d="M32 26c-6-10-16-6-10 0M32 26c6-10 16-6 10 0"/>${face(20, 40)}`,
      suitcase: `<path class="ln" d="M25 18v-6h14v6"/><rect class="b" x="8" y="18" width="48" height="34" rx="5"/><path class="c f" d="M8 30h48v4H8z"/>${face(32, 42)}`,
      heart: `<path class="b" d="M32 55C14 42 8 33 8 24c0-8 6-13 12-13 5 0 9 3 12 7 3-4 7-7 12-7 6 0 12 5 12 13 0 9-6 18-24 31z"/><path class="ln c" d="M48 6v8M44 10h8"/>${face(32, 29)}`,
      book: `<path class="b" d="M8 14h22c2 0 2 2 2 2v38s0-2-2-2H8zM56 14H34c-2 0-2 2-2 2v38s0-2 2-2h22z"/>${face(20, 30)}`,
      box: `<path class="b" d="M10 24 32 14l22 10v24L32 58 10 48z"/><path class="ln" d="M10 24l22 10 22-10M32 34v24"/><path class="ln c" d="M44 6c4 0 5 5 1 6-2 1-2 2-2 4M43 20v.5"/>${face(21, 41)}`
    };
    const ART_FOR = [[/hous|rent|mortgage/i, "house"], [/grocer/i, "bag"], [/dining|restaurant|takeout|food/i, "bowl"], [/transport|gas|fuel|auto|\bcars?\b|transit/i, "car"],
      [/shopping|cloth/i, "shop"], [/utilit|hydro|electric/i, "bulb"], [/phone|internet|mobile/i, "phone"], [/insur/i, "umbrella"], [/subscri|stream/i, "tv"],
      [/entertain|fun|concert|movie/i, "ticket"], [/personal|care|gym|beauty/i, "bottle"], [/debt|loan|credit/i, "card"], [/sav|invest/i, "piggy"],
      [/left over/i, "wallet"], [/gift|giving|donat/i, "gift"], [/travel|trip|vacation/i, "suitcase"], [/health|medic|pharm|dental/i, "heart"], [/educat|school|tuition|book/i, "book"]];
    const PAL = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)", "var(--s7)"]; // --s5 is kept for debt payments
    const SPARK = (x, y, s = 1) => `<path class="spark" d="M${x} ${y - 6 * s}q${s} ${5 * s} ${6 * s} ${6 * s}q${-5 * s} ${s} ${-6 * s} ${6 * s}q${-s} ${-5 * s} ${-6 * s} ${-6 * s}q${5 * s} ${-s} ${6 * s} ${-6 * s}z"/>`;

    function renderPic(d) {
      const { cur, plan } = d, { inc, left, right, gap } = split(d);
      let pi = 0;
      const items = right.map(n => ({ ...n, art: (ART_FOR.find(([re]) => re.test(n.n)) || [0, "box"])[1],
        c: n.kind === "debt" ? "var(--s5)" : n.kind === "saved" ? "var(--s3)" : n.kind === "left" ? "var(--good)" : PAL[pi++ % PAL.length] }));
      const T = Math.max(inc, items.reduce((a, n) => a + n.v, 0)) || 1;
      const srcs = left.filter(n => n.kind === "inc").map(n => esc(n.n)).join(", ");
      const dip = gap < -0.5 ? -gap : 0;
      const note = n => {
        const p = n.cat && plan[n.cat], share = inc ? Math.round(n.v / inc * 100) : 0;
        return `${esc(n.n)}: <b>${fmt(n.v)}</b>, ${share}% of what came in.` + (p ? (n.v > p * 1.02 ? ` Plan <b>${fmt(p)}</b>, so <b class="over">${fmt(n.v - p)} over</b>.` : ` Plan <b>${fmt(p)}</b>, <b class="left">${p - n.v < 1 ? "right on plan" : fmt(p - n.v) + " left"}</b>.`) : "") +
          (n.list ? ` Holds ${esc(n.list.join(", "))}.` : "");
      };
      const sticker = n => { const p = n.cat && plan[n.cat]; if (!p) return ""; const over = n.v > p * 1.02;
        return `<span class="stk ${over ? "over" : "ok"}"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5"/><path d="${over ? "M5.2 11.4q2.8-2.4 5.6 0" : "M5.2 9.6q2.8 2.6 5.6 0"}"/><circle class="e" cx="6" cy="6.6" r=".9"/><circle class="e" cx="10" cy="6.6" r=".9"/></svg>${over ? fmt(n.v - p) + " over" : p - n.v < 1 ? "on plan" : fmt(p - n.v) + " left"}</span>`; };
      box.innerHTML = `<div class="ill">
        <div class="ill-top">
          <svg class="mascot" viewBox="0 0 120 96" aria-hidden="true">
            ${SPARK(14, 20, .9)}${SPARK(106, 14, 1.1)}${SPARK(98, 52, .7)}
            <circle class="coin" cx="30" cy="12" r="6"/><circle class="coin" cx="88" cy="30" r="5"/><circle class="coin" cx="20" cy="46" r="4.5"/>
            <path class="ln" d="M33 56c-8-2-12-10-10-16M87 56c8-2 12-12 9-18"/>
            <path class="b" d="M30 40h58c3 0 5 2 5 5v36c0 3-2 5-5 5H30c-3 0-5-2-5-5V45c0-3 2-5 5-5z"/><path class="flap" d="M70 54h23v16H70z"/><circle class="ln" cx="77" cy="62" r="2"/>
            ${face(48, 60, dip ? "worry" : "")}
          </svg>
          <div class="ill-pay"><span class="tape" aria-hidden="true"></span><span class="k">Your pay this month</span><b>${fmt(inc)}</b>${srcs ? `<span class="src">from ${srcs}</span>` : ""}${dip ? `<span class="dip">and <b>${fmt(dip)}</b> came out of savings</span>` : ""}</div>
        </div>
        <p class="ill-k">Every dollar that came in went to…</p>
        <div class="ill-bar">${items.map((n, i) => `<span class="seg" data-i="${i}" style="--c:${n.c};width:${Math.max(.6, n.v / T * 100)}%" title="${esc(n.n)}: ${fmt(n.v)}"></span>`).join("")}</div>
        <svg class="ill-arrow" viewBox="0 0 200 40" aria-hidden="true"><path d="M20 4c10 22 50 30 80 22s52-8 68 6"/><path d="M160 24l9 8-12 3"/></svg>
        <div class="ill-grid">${items.map((n, i) => `<button type="button" class="ill-card" data-i="${i}" style="--c:${n.c};--r:${[-1.1, .8, -.4, 1, -.7, .5][i % 6]}deg"${n.cat ? ` data-open="${esc(n.cat)}"` : ""} aria-label="${esc(n.n)}: ${fmt(n.v)}">
          <svg class="art" viewBox="0 0 64 64" aria-hidden="true">${ART[n.art]}</svg>
          <span class="nm">${esc(n.n)}</span><span class="fg">${fmt(n.v)}</span><span class="pc">${inc ? Math.round(n.v / inc * 100) : 0}% of pay</span>${sticker(n)}</button>`).join("")}</div>
        <p class="fnote ill-note">Point at a card or a slice of the bar to see it; tap a card to open its transactions.</p></div>`;
      const ill = $(".ill", box), info = $(".ill-note", box), base = info.innerHTML;
      const on = i => { ill.classList.add("focus"); $$("[data-i]", ill).forEach(e => e.classList.toggle("on", e.dataset.i == i)); info.innerHTML = note(items[i]); };
      const off = () => { ill.classList.remove("focus"); $$("[data-i].on", ill).forEach(e => e.classList.remove("on")); info.innerHTML = base; };
      $$("[data-i]", ill).forEach(e => { e.addEventListener("pointerenter", () => on(+e.dataset.i)); e.addEventListener("pointerleave", off);
        e.addEventListener("focus", () => on(+e.dataset.i)); e.addEventListener("blur", off); });
      box.onclick = e => { const o = e.target.closest(".ill-card[data-open]"); if (o) NB.openTx("", o.dataset.open); };
    }

    function render() {
      $$("[data-fv]", card).forEach(b => b.setAttribute("aria-pressed", b.dataset.fv === mode));
      const on = isNb();
      box.classList.toggle("on", on); legend?.classList.toggle("flow-hide", on); wrap.classList.toggle("flow-hide", on);
      if (!on) return;
      const d = data(); if (!d) { box.innerHTML = ""; return; }
      mode === "jars" ? renderJars(d) : renderPic(d);
    }
    let ft; new MutationObserver(() => { clearTimeout(ft); ft = setTimeout(render, 120); }).observe(svgOrig, { childList: true });
    return { render, ART, ART_FOR, face, SPARK };
  })();

  // ── Statements: the other summary graphs as compact sketched cards (owner chose the v2 mockup, 2026-10-13).
  // Each card keeps its heading and description; in Notebook view its Ledger chart is hidden and a drawn version
  // is rendered beside it from the same figures. Ledger view is untouched.
  const st = (() => {
    const NB = window.__nb;
    if (!NB || !flow.ART) return { render() {} };
    const { ART, ART_FOR, face, SPARK } = flow;
    const artFor = name => (ART_FOR.find(([re]) => re.test(name)) || [0, "box"])[1];
    const GROUP = [[/hous|rent|mortgage|utilit|hydro|electric|phone|internet|insur/i, "var(--s1)"], [/grocer|transport|gas|fuel|auto|\bcars?\b|transit|personal|health|medic|pharm/i, "var(--s4)"],
      [/dining|restaurant|food|shopping|cloth|entertain|subscri|travel|gift/i, "var(--s2)"], [/debt|loan|credit/i, "var(--s5)"], [/sav|invest/i, "var(--s3)"]];
    const colOf = name => (GROUP.find(([re]) => re.test(name)) || [0, "var(--s7)"])[1];
    const ic = (name, mood = "", c = colOf(name)) => `<svg class="ic" viewBox="0 0 64 64" aria-hidden="true" style="--c:${c}">${ART[artFor(name)].replace(/<g class="face">[\s\S]*<\/g>$/, "")}${artFace(name, mood)}</svg>`;
    // the drawings carry a happy face; swap in a worried one where a row is over plan or costs more
    const FACE_AT = { house: [32, 34], bag: [32, 38], bowl: [32, 38], car: [32, 37], shop: [30, 40], bulb: [32, 25], phone: [32, 28], umbrella: [32, 22], tv: [30, 33], ticket: [25, 31],
      bottle: [32, 39], card: [28, 41], piggy: [29, 33], wallet: [24, 36], gift: [20, 40], suitcase: [32, 42], heart: [32, 29], book: [20, 30], box: [21, 41] };
    const artFace = (name, mood) => { const [x, y] = FACE_AT[artFor(name)] || [32, 36]; return face(x, y, mood); };
    const mascot = mood => `<svg class="nbst-mascot" viewBox="0 0 120 96" aria-hidden="true" style="--c:var(--s1)">${SPARK(14, 20, .9)}${SPARK(106, 14, 1.1)}
      <circle class="coin" cx="30" cy="12" r="6"/><circle class="coin" cx="88" cy="28" r="5"/><path class="ln" d="M33 56c-8-2-12-10-10-16M87 56c8-2 12-12 9-18"/>
      <path class="b" d="M30 40h58c3 0 5 2 5 5v36c0 3-2 5-5 5H30c-3 0-5-2-5-5V45c0-3 2-5 5-5z"/><path class="flap" d="M70 54h23v16H70z"/><circle class="ln" cx="77" cy="62" r="2"/>${face(48, 60, mood)}</svg>`;
    const fmt2 = n => "$" + Math.abs(n).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const k1 = n => (n < 0 ? "−" : "+") + (Math.abs(n) >= 1000 ? (Math.abs(n) / 1000).toFixed(1) + "k" : Math.round(Math.abs(n)));
    const short = k => NB.name(k, { month: "short" });
    const per = () => { const k = NB.period(); return !k || k.length === 7 ? "this month" : "in this period"; };

    // one slot per card: the drawn version sits after the Ledger content, which is hidden in Notebook view
    const SLOTS = [["#cc", "cc"], ["#chActual", "actual"], ["#chMonths", "months"], ["#changes", "changes"], ["#merchants", "merchants"]].map(([sel, key]) => {
      const orig = $(sel); if (!orig) return null;
      const card = orig.closest(".card"), slot = document.createElement("div");
      slot.className = "nbst nbst-" + key; slot.setAttribute("aria-live", "polite");
      orig.after(slot);
      const hide = [orig, ...(key === "actual" || key === "months" ? $$(":scope > .legend", card) : []), ...(key === "months" ? [$("#monthsNote")] : [])].filter(Boolean);
      card.insertAdjacentHTML("afterbegin", mascot(""));
      return { key, orig, card, slot, hide };
    }).filter(Boolean);

    const mark = lv => lv === "none" ? `<svg viewBox="0 0 30 30" aria-hidden="true"><path class="dash" d="M10 15h10"/></svg>`
      : `<svg viewBox="0 0 30 30" aria-hidden="true" class="mk-${lv}"><circle cx="15" cy="15" r="12"/><path d="${lv === "bad" ? "M10 10l10 10M20 10L10 20" : lv === "info" ? "M15 8.5v8M15 21v.5" : "M9 15.5l4 4 8-9"}"/></svg>`;

    function drawCC(s) {
      const cards = NB.cc(); if (!cards.length) { s.slot.innerHTML = ""; return false; }
      const all = NB.months(), cols = all.filter(k => cards.some(c => c.ms.includes(k))).slice(-12);
      const years = new Set(cols.map(k => k.slice(0, 4))).size > 1, cur = NB.period();
      const lvOf = p => !p ? "none" : p.interest > 0.005 || p.bad.length ? "bad" : p.fees.length ? "info" : "good";
      const colLv = k => { const ls = cards.map(c => lvOf(c.per.find(p => p.k === k))); return ls.includes("bad") ? "bad" : ls.includes("info") ? "info" : "good"; };
      const clean = cols.filter(k => colLv(k) === "good").length;
      const interest = cards.reduce((t, c) => t + c.per.reduce((u, p) => u + p.interest + p.bad.reduce((v, b) => v - b.amount, 0), 0), 0);
      const fees = cards.reduce((t, c) => t + c.per.reduce((u, p) => u + p.fees.reduce((v, b) => v - b.amount, 0), 0), 0);
      const streak = c => { let n = 0; for (let i = c.per.length - 1; i >= 0 && lvOf(c.per[i]) !== "bad"; i--) n++; return n; };
      const label = k => `${short(k)}${years ? " ’" + k.slice(2, 4) : ""}${NB.partial(k) ? "*" : ""}`;
      const hits = cards.filter(c => c.hit.length);
      s.card.querySelector(".nbst-mascot").outerHTML = mascot(hits.length ? "worry" : "");
      s.slot.innerHTML = `<p class="nbst-say"><b class="${hits.length ? "over" : "good"}">${clean} of ${cols.length}</b> month${cols.length > 1 ? "s" : ""} with no interest${cards.length > 1 ? " on any card" : ""}${interest > 0.005 ? ` · <b class="over">${fmt2(interest)}</b> interest and late fees` : ""}</p>
        <div class="nbst-cc" style="--n:${cols.length}">
          <span></span>${cols.map(k => { const lv = colLv(k); return `<span class="mo${k === cur ? " cur" : ""}"><svg viewBox="0 0 64 64" aria-hidden="true" style="--c:${lv === "bad" ? "var(--s5)" : lv === "info" ? "var(--s4)" : "var(--s3)"}">${ART.card.replace(/<path class="drop"[^>]*\/>/, lv === "bad" ? '<path class="drop" d="M54 5c-3 4-3 7 0 7s3-3 0-7z"/>' : "").replace(/<g class="face">[\s\S]*<\/g>$/, "")}${face(28, 41, lv === "bad" ? "worry" : "")}</svg>${label(k)}</span>`; }).join("")}
          ${cards.map(c => `<span class="lab">${esc(c.a)}</span>` + cols.map(k => { const p = c.per.find(x => x.k === k), lv = lvOf(p);
            const note = !p ? "no statement" : lv === "bad" ? fmt2(p.interest + p.bad.reduce((v, b) => v - b.amount, 0)) + (p.interest > 0.005 ? " interest" : " late fee") : lv === "info" ? fmt2(p.fees.reduce((v, b) => v - b.amount, 0)) + " fee" : "paid " + fmt(p.paid);
            const tip = p ? `${NB.name(k)}${NB.partial(k) ? " (so far)" : ""}: ${note}. Charged ${fmt2(p.charged)}, paid ${fmt2(p.paid)}.` : `${NB.name(k)}: no statement for ${c.a}`;
            return lv === "bad" ? `<button type="button" class="cell" data-ccgo="${k}" title="${esc(tip)}" aria-label="${esc(c.a + ", " + tip + " Show these charges.")}">${mark(lv)}<small class="over">${note}</small></button>`
              : `<span class="cell" title="${esc(tip)}">${mark(lv)}<small${lv === "info" ? ' class="warn"' : ""}>${note}</small><i class="sr-only">${esc(c.a + ", " + tip)}</i></span>`; }).join("")).join("")}
          <span class="st-row"></span>${cols.map(k => { const lv = colLv(k); return `<span class="st-row"><span class="stamp ${lv}">${lv === "bad" ? "interest" : lv === "info" ? "fee" : cols.length > 8 ? "in full" : "paid in full"}</span></span>`; }).join("")}
        </div>
        <ul class="nbst-chips">
          <li style="--c:var(--good)">${svgIc("check")}Clean months <b>${clean} of ${cols.length}</b></li>
          <li style="--c:var(--critical-text)">${svgIc("alert")}Interest <b>${fmt2(interest)}</b></li>
          <li style="--c:var(--s1)">${svgIc("card")}Fees <b>${fmt2(fees)}</b></li>
          ${cards.map(c => { const n = streak(c); return `<li style="--c:var(--s4)">${svgIc("flame")}${esc(c.a)} streak <b>${n} month${n === 1 ? "" : "s"}</b></li>`; }).join("")}
        </ul>
        ${cards.filter(c => c.behind).map(c => `<p class="sticky nbst-warn"><span class="tape"></span><b>${esc(c.a)}: check the balance</b>From ${esc(c.span)} you charged ${fmt(c.gap)} more than you paid the month after. Whatever is still on the card after its due date starts costing interest.</p>`).join("")}
        <p class="nbst-foot">${hits.length ? "Pay the full statement balance by the due date and the interest stops. Tap a red mark to see its charges. " : ""}${cols.some(NB.partial) ? "* Month still in progress." : ""}</p>`;
      return true;
    }

    function drawActual(s) {
      const k = NB.period(); if (!k) return false;
      const cur = NB.monthStats(k), planM = NB.plannedBy(), plan = {}, tol = NB.tol();
      Object.entries(planM).forEach(([c, v]) => plan[c] = v * cur.months);
      const cats = [...new Set([...Object.keys(cur.by), ...Object.keys(plan)])].filter(c => (cur.by[c] || 0) > 0.5 || (plan[c] || 0) > 0.5)
        .sort((a, b) => (cur.by[b] || 0) - (cur.by[a] || 0) || (plan[b] || 0) - (plan[a] || 0));
      if (!cats.length) { s.slot.innerHTML = `<p class="nbst-say">No spending ${per()}.</p>`; return true; }
      const planned = Object.values(plan).reduce((a, v) => a + v, 0), diff = cur.spend - planned;
      const max = Math.max(...cats.map(c => Math.max(cur.by[c] || 0, plan[c] || 0))) * 1.03, txc = NB.txCats();
      s.card.querySelector(".nbst-mascot").outerHTML = mascot(planned && diff > planned * tol ? "worry" : "");
      s.slot.innerHTML = `<p class="nbst-say">${planned ? `Spent <b>${fmt(cur.spend)}</b> of a <b>${fmt(planned)}</b> plan · <b class="${diff > planned * tol ? "over" : "good"}">${fmt(diff)} ${diff > 0 ? "over" : "under"}</b>` : `Spent <b>${fmt(cur.spend)}</b> · no plan yet in My numbers`}</p>
        <ul class="nbst-rows">${cats.map(c => { const a = cur.by[c] || 0, p = plan[c] || 0, over = p > 0 && a > p * (1 + tol);
          const note = !p ? `<small>no plan</small>` : over ? `<small class="over">${fmt(a - p)} over</small>` : p - a < 1 ? `<small>on plan</small>` : `<small class="good">${fmt(p - a)} left</small>`;
          const open = txc.includes(c);
          return `<li><${open ? `button type="button" data-cat="${esc(c)}" aria-label="${esc(`${c}: ${fmt(a)}${p ? ", plan " + fmt(p) : ""}. Show these transactions.`)}"` : "span"} class="row">${ic(c, over ? "worry" : "")}<span class="nm">${esc(c)}</span>
            <span class="track"><span class="bar" style="--c:${over ? "var(--critical)" : colOf(c)};width:${Math.max(a / max * 100, a > 0 ? 1 : 0)}%"></span>${p ? `<span class="plan" style="left:${p / max * 100}%"></span>` : ""}</span>
            <span class="fig">${fmt(a)}${note}</span></${open ? "button" : "span"}></li>`; }).join("")}</ul>
        <ul class="nbst-legend"><li><span class="sw dash"></span>your plan</li><li style="--c:var(--critical)"><span class="sw"></span>over plan</li></ul>`;
      return true;
    }

    function drawMonths(s) {
      const ks = NB.months().slice(-12); if (!ks.length) return false;
      const st = ks.map(NB.monthStats), cur = NB.period();
      const full = ks.map((k, i) => ({ k, s: st[i] })).filter(x => !NB.partial(x.k));
      const best = full.length > 1 ? full.reduce((a, x) => x.s.net > a.s.net ? x : a) : null, worst = full.length > 1 ? full.reduce((a, x) => x.s.net < a.s.net ? x : a) : null;
      const box = s.slot.clientWidth || s.card.clientWidth - 40 || 400, notes = best && box >= 460;
      const W = Math.max(260, Math.round(notes ? box - 154 : box)), H = 220, base = 186, ch = 158, gw = W / ks.length, bw = Math.max(5, Math.min(22, gw / 2 - 5));
      const max = Math.max(1, ...st.map(x => Math.max(x.inc, x.out))) * 1.06, y = v => base - v / max * ch;
      const kept = st.reduce((a, x, i) => a + (NB.partial(ks[i]) ? 0 : x.net), 0), green = full.filter(x => x.s.net >= 0).length;
      const hatch = (id, c) => `<pattern id="${id}" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="6" height="6" style="fill:${c};opacity:.2"/><line x1="1" y1="0" x2="1" y2="6" style="stroke:${c}" stroke-width="1.8" opacity=".85"/></pattern>`;
      s.card.querySelector(".nbst-mascot").outerHTML = mascot(full.length && green < full.length ? "worry" : "");
      s.slot.innerHTML = `<p class="nbst-say">${full.length ? `${kept >= 0 ? `You kept <b class="good">${fmt(kept)}</b>` : `You spent <b class="over">${fmt(kept)}</b> more than came in`} over ${full.length} full month${full.length > 1 ? "s" : ""} · ${green === full.length ? "every month in the green" : `${green} of ${full.length} in the green`}` : "Money in against money out, month by month."}</p>
        <div class="nbst-mwrap${notes ? " notes" : ""}"><svg class="nbst-chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Money in compared with money out, ${ks.length} months">
          <defs>${hatch("nbm-in", "var(--s3)")}${hatch("nbm-out", "var(--s2)")}${hatch("nbm-debt", "var(--s5)")}</defs>
          <path class="axis" d="M2 ${base}H${W - 2}"/>
          ${ks.map((k, i) => { const x = st[i], cx = i * gw + gw / 2, part = NB.partial(k), on = cur && (k === cur || k.startsWith(cur + "") && cur.length === 4);
            const tip = `${NB.name(k)}${part ? " (partial)" : ""}: money in ${fmt(x.inc)}, spending ${fmt(x.spend)}, debt payments ${fmt(x.debt)}, net ${x.net < 0 ? "−" : ""}${fmt(x.net)}`;
            return `<g class="mo${part ? " part" : ""}${k === cur ? " cur" : ""}" data-k="${k}" tabindex="0" role="button" aria-label="${esc(tip)}. Show this month."><title>${esc(tip)}</title>
              <rect class="hit" x="${i * gw}" y="0" width="${gw}" height="${H}"/>
              ${x.inc > 0 ? `<rect class="mk" x="${cx - bw - 1.5}" y="${y(x.inc)}" width="${bw}" height="${base - y(x.inc)}" rx="2" fill="url(#nbm-in)" style="stroke:var(--s3)"/>` : ""}
              ${x.spend > 0 ? `<rect class="mk" x="${cx + 1.5}" y="${y(x.spend)}" width="${bw}" height="${base - y(x.spend)}" rx="2" fill="url(#nbm-out)" style="stroke:var(--s2)"/>` : ""}
              ${x.debt > 0 ? `<rect class="mk" x="${cx + 1.5}" y="${y(x.out)}" width="${bw}" height="${y(x.spend) - y(x.out)}" rx="2" fill="url(#nbm-debt)" style="stroke:var(--s5)"/>` : ""}
              <text x="${cx}" y="${base + 20}" text-anchor="middle" class="h">${short(k)}${part ? "*" : ""}</text>
              ${k === cur ? `<path class="axis cur-line" d="M${cx - 13} ${base + 26}q13 3 26 0"/>` : ""}
              ${part ? "" : `<text x="${cx}" y="${y(Math.max(x.inc, x.out)) - 6}" text-anchor="middle" class="v ${x.net < 0 ? "neg" : "pos"}">${k1(x.net)}</text>`}</g>`; }).join("")}
        </svg>${notes ? `<div class="nbst-notes"><p class="sticky"><span class="tape"></span><b>Best: ${NB.name(best.k, { month: "long" })}</b>kept ${fmt(best.s.net)}</p>
          <p class="sticky"><span class="tape"></span><b>Tight: ${NB.name(worst.k, { month: "long" })}</b>${worst.s.net < 0 ? `${fmt(worst.s.net)} more out than in` : `kept ${fmt(worst.s.net)}`}, spent ${fmt(worst.s.spend)}</p></div>` : ""}</div>
        <ul class="nbst-legend"><li style="--c:var(--s3)"><span class="sw"></span>money in</li><li style="--c:var(--s2)"><span class="sw"></span>spending</li><li style="--c:var(--s5)"><span class="sw"></span>debt payments</li><li><b class="nbst-k">+1.2k</b> kept</li></ul>
        ${ks.some(NB.partial) ? `<p class="nbst-foot">* Partial month: the statement doesn't cover the whole month yet. Tap a month to see it.</p>` : `<p class="nbst-foot">Tap a month to see it.</p>`}`;
      return true;
    }

    function drawChanges(s) {
      const k = NB.period(), pk = k && NB.prevOf(k); if (!pk) { s.slot.innerHTML = ""; return true; }
      const cur = NB.monthStats(k), prev = NB.monthStats(pk), txc = NB.txCats();
      const rows = [...new Set([...Object.keys(cur.by), ...Object.keys(prev.by)])].map(c => ({ c, was: prev.by[c] || 0, now: cur.by[c] || 0 }))
        .map(r => ({ ...r, d: r.now - r.was })).filter(r => Math.abs(r.d) >= 10).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 6);
      const tot = cur.spend - prev.spend, max = Math.max(1, ...rows.map(r => Math.abs(r.d))) * 1.05;
      s.card.querySelector(".nbst-mascot").outerHTML = mascot(tot > 0 ? "worry" : "");
      s.slot.innerHTML = `<p class="nbst-say">Spending <b class="${tot <= 0 ? "good" : "over"}">${tot > 0 ? "up" : "down"} ${fmt(tot)}</b> · ${fmt(prev.spend)} → <b>${fmt(cur.spend)}</b></p>
        ${rows.length ? `<ul class="nbst-rows wide">${rows.map(r => { const good = r.d <= 0, c = good ? "var(--good)" : "var(--critical)", w = Math.abs(r.d) / max * 100, open = txc.includes(r.c);
          return `<li><${open ? `button type="button" data-cat="${esc(r.c)}" aria-label="${esc(`${r.c}: ${fmt(r.was)} to ${fmt(r.now)}, ${r.d > 0 ? "up" : "down"} ${fmt(r.d)}. Show these transactions.`)}"` : "span"} class="row">${ic(r.c, good ? "" : "worry")}<span class="nm">${esc(r.c)}<small>${fmt(r.was)} → ${fmt(r.now)}</small></span>
            <span class="split"><span>${r.d < 0 ? `<span class="bar" style="--c:${c};right:0;width:${w}%"></span>` : ""}</span><span>${r.d > 0 ? `<span class="bar" style="--c:${c};left:0;width:${w}%"></span>` : ""}</span></span>
            <span class="fig"><span class="nbst-pill ${good ? "good" : "over"}">${r.d > 0 ? "▲" : "▼"} ${fmt(r.d)}</span></span></${open ? "button" : "span"}></li>`; }).join("")}</ul>
        <ul class="nbst-legend"><li style="--c:var(--good)"><span class="sw"></span>spent less</li><li style="--c:var(--critical)"><span class="sw"></span>spent more</li><li>left of the line = less, right = more</li></ul>` : `<p class="nbst-foot">No category moved by $10 or more.</p>`}`;
      return true;
    }

    function drawMerchants(s) {
      const k = NB.period(); if (!k) return false;
      const cur = NB.monthStats(k), by = {};
      cur.tx.filter(NB.isSpend).forEach(t => { const m = NB.pretty(t.desc) || t.desc; by[m] = by[m] || { v: 0, n: 0, cat: t.category, q: t.desc.toLowerCase().includes(m.toLowerCase()) ? m : t.desc }; by[m].v -= t.amount; by[m].n++; });
      const rows = Object.entries(by).sort((a, b) => b[1].v - a[1].v).slice(0, 8);
      if (!rows.length) { s.slot.innerHTML = `<p class="nbst-say">No spending ${per()}.</p>`; return true; }
      const top = rows.reduce((a, [, o]) => a + o.v, 0), max = rows[0][1].v;
      s.slot.innerHTML = `<p class="nbst-say">Your top ${rows.length} place${rows.length > 1 ? "s" : ""} took <b>${cur.spend ? Math.round(top / cur.spend * 100) : 100}%</b> of <b>${fmt(cur.spend)}</b> spent</p>
        <ul class="nbst-rows wide">${rows.map(([m, o], i) => `<li><button type="button" class="row" data-q="${esc(o.q)}" aria-label="${esc(`${m}: ${fmt2(o.v)}, ${o.n} visit${o.n > 1 ? "s" : ""}. Show these transactions.`)}">${ic(o.cat)}
          <span class="nm"><span class="rank">${i + 1}</span>${esc(m)}<small>${o.n} visit${o.n > 1 ? "s" : ""}${o.n > 1 ? ` · about ${fmt(o.v / o.n)} each` : ""} · ${esc(o.cat)}</small></span>
          <span class="track"><span class="bar" style="--c:${colOf(o.cat)};width:${Math.max(o.v / max * 100, 1)}%"></span></span>
          <span class="fig">${fmt2(o.v)}<small>${cur.spend ? Math.round(o.v / cur.spend * 100) : 0}%</small></span></button></li>`).join("")}</ul>`;
      return true;
    }

    const DRAW = { cc: drawCC, actual: drawActual, months: drawMonths, changes: drawChanges, merchants: drawMerchants };
    function render() {
      const on = isNb();
      for (const s of SLOTS) {
        let drawn = false;
        if (on && !s.card.closest(".hidden")) { try { drawn = DRAW[s.key](s); } catch (e) { console.error(e); drawn = false; } }
        s.slot.classList.toggle("on", drawn); s.card.classList.toggle("nbst-card", drawn);
        s.hide.forEach(el => el.classList.toggle("nbst-hide", drawn));
        if (!drawn) s.slot.innerHTML = "";
      }
    }
    // taps: open the matching transactions, or jump to a month
    for (const s of SLOTS) s.slot.addEventListener("click", e => {
      const b = e.target.closest("[data-cat], [data-q], [data-ccgo], g.mo[data-k]"); if (!b) return;
      if (b.dataset.ccgo) { NB.pick(b.dataset.ccgo); NB.openTx("", "Bank fees & interest"); }
      else if (b.dataset.k) NB.pick(b.dataset.k);
      else NB.openTx(b.dataset.q || "", b.dataset.cat || "");
    });
    $$(".nbst-months").forEach(sl => sl.addEventListener("keydown", e => { const g = e.target.closest("g.mo[data-k]"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); NB.pick(g.dataset.k); } }));
    // redraw whenever the app redraws one of these cards, or the window changes width (the month chart is drawn to size)
    let rt; const later = () => { clearTimeout(rt); rt = setTimeout(render, 120); };
    for (const s of SLOTS) new MutationObserver(later).observe(s.orig, { childList: true, subtree: s.key === "cc" });
    let lastW = innerWidth; addEventListener("resize", () => { if (Math.abs(innerWidth - lastW) > 40) { lastW = innerWidth; later(); } });
    return { render };
  })();

  setView(store.get("fa-nb-view") || "notebook");
})();
