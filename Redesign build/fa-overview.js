/* ---------- Overview story (personal charts and margin notes) ---------- */
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
const monShort = k => `${MONTHS[+k.slice(5, 7) - 1]} ${k.slice(0, 4)}`;
// Reveal blocks once as they scroll into view; charts redraw on resize without replaying.
const seenIO = "IntersectionObserver" in window && !REDUCE ? new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("seen"); seenIO.unobserve(en.target); } }), { threshold: .12, rootMargin: "0px 0px -6% 0px" }) : null;
function watchRise(scope) { scope.querySelectorAll(".rise:not(.seen)").forEach(r => seenIO ? seenIO.observe(r) : r.classList.add("seen")); }
function revealWords(h, str) {
  if (h.dataset.said === str) return;
  h.dataset.said = str; h.setAttribute("aria-label", str); h.textContent = "";
  let wi = 0;
  str.split(/(\s+)/).forEach(part => {
    if (!part.trim()) { h.appendChild(document.createTextNode(part)); return; }
    const s = document.createElement("span"); s.className = "w"; s.setAttribute("aria-hidden", "true"); s.style.setProperty("--wi", wi++); s.textContent = part; h.appendChild(s);
  });
  h.classList.remove("is-visible");
  if (REDUCE) h.classList.add("is-visible"); else requestAnimationFrame(() => requestAnimationFrame(() => h.classList.add("is-visible")));
}

function historyPoints(c) {
  const rec = [...D.history].sort((a, b) => a.date.localeCompare(b.date)).filter(p => p.date !== monthKey());
  const hasData = D.assets.length || D.debts.length;
  return { rec, pts: hasData ? [...rec, { date: monthKey(), net: c.net, assets: c.assets, debt: c.debt, now: true }] : rec };
}

function overviewStory(c, sim) {
  const empty = !D.income.length && !D.expenses.length && !D.debts.length && !D.assets.length && !D.goals.length;
  const { pts } = historyPoints(c);
  const prev = pts.length > 1 ? pts[pts.length - 2] : null;

  // Headline and dek
  let head, dek;
  if (empty) { head = "Your full picture starts here."; dek = "Add what you earn, spend, own and owe, and this page turns it into your story."; }
  else {
    const d = prev ? c.net - prev.net : 0;
    head = prev ? `You're worth ${fmt(c.net)} this month, ${d >= 0 ? "up" : "down"} ${fmt(Math.abs(d))} since ${MONTHS_L[+prev.date.slice(5, 7) - 1]}.` : `You're worth ${fmt(c.net)} today.`;
    if (pts.length >= 3) {
      const first = pts[0], lo = pts.reduce((m, p) => p.net < m.net ? p : m, pts[0]);
      let best = null; pts.forEach((p, i) => { if (i) { const g = p.net - pts[i - 1].net; if (!best || g > best.g) best = { p, g }; } });
      dek = `${pts.length - 1} months ago you were at ${fmt(first.net)}.` +
        (lo !== pts[pts.length - 1] && lo !== first ? ` Your low point was ${MONTHS_L[+lo.date.slice(5, 7) - 1]} at ${fmt(lo.net)}.` : "") +
        (best && best.g > 0 ? ` Your best month was ${best.p.now ? "this one" : MONTHS_L[+best.p.date.slice(5, 7) - 1]}, up ${fmt(best.g)}.` : "");
    } else dek = `That's ${fmt(c.assets)} you own minus ${fmt(c.debt)} you owe. Press Record this month each month and this becomes a line you can read.`;
  }
  revealWords($("#ovTitle"), head);
  $("#ovDek").textContent = dek;

  // Next step, from the Advisor's review
  const np = $("#ovNext");
  if (NEXT) {
    const m = NEXT.match(/^<b>(.*?)<\/b>\s*([\s\S]*)$/);
    if (m) m[2] = m[2].replace(/^[,;:.]\s*/, "").replace(/^./, ch => ch.toUpperCase());
    np.innerHTML = `<span class="lbl">Your next step</span><h3>${m ? m[1] : NEXT}</h3>${m && m[2] ? `<p>${m[2]}</p>` : ""}<div class="row"><button class="primary" data-goto="advisor">Advisor's review</button><button data-goto="strategy">Strategy</button></div>`;
    np.classList.remove("hidden");
  } else np.classList.add("hidden");

  // Margin note for the story chart
  const avg = paceOf(pts);
  $("#noteStory").innerHTML = pts.length >= 3
    ? `<span class="lbl">On the chart</span>Hover any month for the exact figure.${avg ? ` The dashed line is where you'd be in six months at your recent pace of <b>${avg >= 0 ? "+" : "−"}${fmt(Math.abs(avg))}</b> a month.` : ""}`
    : `<span class="lbl">On the chart</span>Each point is a month you pressed <b>Record this month</b>. Two or more months draw your line.`;

  calendar(); road(sim); runway(c); goalNote(c);
  // Redraw the story chart if its column changes width (first layout, rail collapse, zoom)
  const box = $("#chHist");
  if (window.ResizeObserver && !box._ro) { let lastW = box.clientWidth; box._ro = new ResizeObserver(() => { const w = box.clientWidth; if (Math.abs(w - lastW) > 4) { lastW = w; chartHist(calc()); } }); box._ro.observe(box.parentElement); }
  watchRise($("#tab-overview"));
}

function paceOf(pts) {
  if (pts.length < 3) return 0;
  const tail = pts.slice(-Math.min(7, pts.length));
  return (tail[tail.length - 1].net - tail[0].net) / (tail.length - 1);
}

/* Day-by-day calendar for the latest full statement month */
function calendar() {
  const box = $("#ovCal"), note = $("#noteCal"), title = $("#calTitle");
  const months = monthsList();
  if (!months.length) {
    title.innerHTML = "Your month, <em>day by day</em>";
    box.innerHTML = `<div class="empty">Add a bank or card statement and your month appears here, one square per day, with paydays marked.</div><button data-goto="statements">Add statements</button>`;
    note.innerHTML = `<p class="note">Statements stay on this computer. The file is read inside this page and never uploaded.</p>`;
    return;
  }
  const k = latestFullMonth(months), st = monthStats(k);
  const y = +k.slice(0, 4), mo = +k.slice(5, 7) - 1, days = new Date(y, mo + 1, 0).getDate(), lead = new Date(y, mo, 1).getDay();
  const spend = Array(days + 1).fill(0), house = Array(days + 1).fill(0), pay = new Set();
  st.tx.forEach(t => {
    const d = +t.date.slice(8, 10);
    if (t.category === "Income" && t.amount > 0) pay.add(d);
    if (isSpend(t)) { spend[d] -= t.amount; if (t.category === "Housing") house[d] -= t.amount; }
  });
  const daily = spend.slice(1).filter((v, i) => v > 0 && !house[i + 1]).sort((a, b) => a - b);
  const q = p => daily.length ? daily[Math.min(daily.length - 1, Math.floor(daily.length * p))] : 0;
  const [q1, q2, q3] = [q(.25), q(.5), q(.8)];
  title.innerHTML = `Your ${MONTHS_L[mo]}, <em>day by day</em>`;
  let h = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => `<div class="dow">${d}</div>`).join("");
  for (let i = 0; i < lead; i++) h += `<div class="day pad" aria-hidden="true"></div>`;
  for (let d = 1; d <= days; d++) {
    const v = spend[d], lv = house[d] > 0 ? "rent" : v <= 0 ? "zero" : v <= q1 ? "l1" : v <= q2 ? "l2" : v <= q3 ? "l3" : "l4";
    h += `<div class="day ${lv}${pay.has(d) ? " pay" : ""}" data-d="${d}"><span>${d}</span><span class="amt">${v > 0 ? fmt(v) : "—"}</span></div>`;
  }
  box.innerHTML = `<div class="cal" role="img" aria-label="Spending each day in ${MONTHS_L[mo]} ${y}, ${fmt(st.spend)} in total">${h}</div>` +
    `<div class="cal-key">less <span style="background:var(--surface-2)"></span><span style="background:color-mix(in oklch, var(--accent) 14%, var(--surface-2))"></span><span style="background:color-mix(in oklch, var(--accent) 32%, var(--surface-2))"></span><span style="background:color-mix(in oklch, var(--accent) 74%, var(--surface-2))"></span><span style="background:var(--accent)"></span> more · <span style="background:var(--text)"></span> housing · <b style="color:var(--good-text);font-weight:600">PAY</b> payday · ${fmt(st.spend)} spent</div>`;
  box.querySelectorAll(".day[data-d]").forEach(cell => {
    const d = +cell.dataset.d, list = st.tx.filter(t => +t.date.slice(8, 10) === d && isSpend(t)).sort((a, b) => a.amount - b.amount);
    bindTip(cell, () => tipRows(`${MONTHS[mo]} ${d}`, list.length ? list.slice(0, 6).map(t => [t.desc.slice(0, 26), fmt(-t.amount)]).concat(list.length > 6 ? [[`and ${list.length - 6} more`, ""]] : []) : [["No spending", ""]]));
  });

  // Notes, only what the numbers support
  const notes = [];
  const houseTot = house.reduce((s, v) => s + v, 0);
  if (houseTot > 0 && st.spend > 0) notes.push(`<span class="lbl">The pattern</span>Housing is <b>${pct(houseTot / st.spend)}</b> of the month's spending.`);
  const top = spend.map((v, d) => ({ v, d })).filter(x => x.d && !house[x.d] && x.v > 0).sort((a, b) => b.v - a.v).slice(0, 2);
  if (top.length) {
    const near = top.filter(x => [...pay].some(p => x.d >= p && x.d - p <= 3));
    const ord = n => n + (n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th");
    notes.push(`Your biggest ${top.length > 1 ? "days were" : "day was"} the <b>${top.map(x => ord(x.d)).join("</b> and the <b>")}</b>${near.length === top.length && pay.size ? ", right after payday" : ""}.`);
  }
  const zero = spend.slice(1).filter((v, i) => v <= 0 && !house[i + 1]).length;
  if (zero) notes.push(`${zero} day${zero > 1 ? "s" : ""} with no spending at all. An average day cost you <b>${fmt(st.spend / days)}</b>.`);
  note.innerHTML = notes.map((n, i) => `<p class="note${i ? "" : " first"}">${n}</p>`).join("") + (isPartial(months[months.length - 1]) && k !== months[months.length - 1] ? `<p class="note">Showing ${MONTHS_L[mo]}, your latest full month.</p>` : "");
}

/* The road to debt-free, one bar per debt, from today to its payoff month */
function road(sim) {
  const box = $("#ovRoad"), note = $("#noteDebt");
  const s = sim && sim.b, list = s ? s.debts.filter(d => D.debts[d.idx]) : [];
  if (!list.length) { box.innerHTML = `<div class="empty">No debts to pay off${D.debts.length ? " besides a mortgage" : ""}. That's a good road to be on.</div>`; note.innerHTML = ""; return; }
  const fin = list.filter(d => d.paidOff != null && isFinite(d.paidOff));
  const span = Math.ceil(Math.max(...fin.map(d => d.paidOff), 12) / 12) * 12 + 12;
  const y0 = new Date().getFullYear(), years = [];
  for (let i = 0; i <= span / 12; i++) years.push(y0 + i);
  const rows = [...list].sort((a, b) => (a.paidOff ?? 1e9) - (b.paidOff ?? 1e9));
  const topApr = Math.max(...list.map(d => d.apr));
  box.innerHTML = `<div class="road"><div class="road-years">${years.map(y => `<span>${y}</span>`).join("")}</div>` + rows.map(d => {
    const src = D.debts[d.idx], ok = d.paidOff != null && isFinite(d.paidOff);
    const w = ok ? Math.max(2, d.paidOff / span * 100) : 100, label = ok ? `gone ${dateIn(d.paidOff)}` : "not on track";
    return `<div class="road-row"><h4>${esc(src.name || src.type)}<small>${fmt(+src.balance)} · ${(+src.apr || 0).toFixed(2)}%</small></h4><div class="road-bar${d.apr === topApr && d.apr >= 15 ? " hot" : ""}"><i class="grow" style="width:${w}%"></i><span${w > 60 ? ' class="end"' : ""} style="left:${w}%">${label}</span></div></div>`;
  }).join("") + `</div>`;
  const hot = list.filter(d => d.apr >= 8).sort((a, b) => b.apr - a.apr)[0];
  const last = fin.length === list.length ? Math.max(...fin.map(d => d.paidOff)) : null;
  note.innerHTML = (hot ? `<p class="note"><span class="lbl">Why ${esc(D.debts[hot.idx].name || D.debts[hot.idx].type)} first</span>At <b>${hot.apr.toFixed(2)}%</b> it costs about <b>${fmt((+D.debts[hot.idx].balance) * hot.apr / 1200)} a month</b> in interest. Every extra dollar there earns more than a savings account.</p>` : "") +
    (last ? `<p class="note">With ${fmt(+D.extra || 0)} extra a month, you're debt-free by <b>${dateIn(last)}</b>. Change the extra amount on the Debt plan page.</p>` : `<p class="note">Some payments don't cover the interest yet. The Debt plan page shows what it takes.</p>`);
}

/* Months of essentials the cushion covers */
function runway(c) {
  const box = $("#ovRunway"), note = $("#noteRunway");
  if (!c.essentialMonthly) { box.innerHTML = `<div class="empty">Add your bills to see how long your savings would last.</div>`; note.innerHTML = ""; return; }
  const have = isFinite(c.efMonths) ? c.efMonths : 12, n = Math.min(12, Math.max(c.efTarget, Math.ceil(have)));
  const cells = [], labels = [];
  for (let i = 0; i < n; i++) { cells.push(`<div><i class="grow" style="--f:${Math.max(0, Math.min(1, have - i)).toFixed(3)}"></i></div>`); labels.push(`<span>${i + 1}${i + 1 === c.efTarget ? " · goal" : ""}</span>`); }
  box.innerHTML = `<div class="runway" style="grid-template-columns:repeat(${n},1fr)" role="img" aria-label="Your cushion covers ${have.toFixed(1)} of ${c.efTarget} months of essentials">${cells.join("")}</div><div class="runway-labels" style="grid-template-columns:repeat(${n},1fr)">${labels.join("")}</div>`;
  note.innerHTML = `<p class="note"><span class="lbl">If your pay stopped</span>Your ${fmt(c.cash)} cushion would cover <b>${have >= 12 ? "a year or more" : have.toFixed(1) + " month" + (have.toFixed(1) === "1.0" ? "" : "s")}</b> of essentials at ${fmt(c.essentialMonthly)} a month. The goal for you is ${c.efTarget}.</p>`;
}

function goalNote(c) {
  const note = $("#noteGoals"), gs = D.goals.filter(g => +g.target > 0 && (+g.saved || 0) < +g.target);
  if (!gs.length) { note.innerHTML = ""; return; }
  const soon = gs.map(g => ({ g, m: +g.monthly > 0 ? (+g.target - (+g.saved || 0)) / +g.monthly : Infinity })).sort((a, b) => a.m - b.m)[0];
  note.innerHTML = `<p class="note"><span class="lbl">Closest finish line</span><b>${esc(soon.g.name || "A goal")}</b>${isFinite(soon.m) ? `, reached ${dateIn(soon.m)} at ${fmt(+soon.g.monthly)} a month.` : " has no monthly amount yet."}</p>`;
}
