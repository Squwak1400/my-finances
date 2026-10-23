/* ---------- Overview story (headline, days-late counter, next step, year chart, filing rail, margin notes) ---------- */
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Reveal blocks once as they scroll into view; re-renders don't replay them.
const seenIO = 'IntersectionObserver' in window && !REDUCE ? new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('seen'); seenIO.unobserve(en.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' }) : null;
function watchRise(scope) { scope.querySelectorAll('.rise:not(.seen)').forEach(r => seenIO ? seenIO.observe(r) : r.classList.add('seen')); }
function revealWords(h, str) {
  if (h.dataset.said === str) return;
  h.dataset.said = str; h.setAttribute('aria-label', str); h.textContent = '';
  let wi = 0;
  str.split(/(\s+)/).forEach(part => {
    if (!part.trim()) { h.appendChild(document.createTextNode(part)); return; }
    const s = document.createElement('span'); s.className = 'w'; s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--wi', wi++); s.textContent = part; h.appendChild(s);
  });
  h.classList.remove('is-visible');
  if (REDUCE) h.classList.add('is-visible'); else requestAnimationFrame(() => requestAnimationFrame(() => h.classList.add('is-visible')));
}
const overviewShown = () => !$('#tab-overview').classList.contains('hidden');

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
const say = n => n < WORDS.length ? WORDS[n] : n.toLocaleString('en-CA');
const lower = n => n < WORDS.length ? WORDS[n].toLowerCase() : n.toLocaleString('en-CA');
const plural = (n, one, many) => n === 1 ? one : (many || one + 's');
// A return is due April 30 of the next year.
function daysLate(y) { const t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((t - new Date(y + 1, 3, 30)) / 864e5); }
// The estimate only means something once work income (T4, contract or EI) is entered for the year.
function yearEst(y) { const e = taxEst(y); return { e, has: e.emp + e.se + e.ei > 0, bal: e.balance }; }
const estText = x => !x || !x.has ? '' : x.bal < -1 ? money(-x.bal) + ' back' : x.bal > 1 ? money(x.bal) + ' owing' : 'about even';
const STATUS = { filed: ['ok', 'Filed'], ready: ['ok', 'Ready for CPA'], 'in-progress': ['warn', 'In progress'], 'not-started': ['', 'Not started'] };
const TRACK = [['slips', 'download your slips from CRA'], ['crypto', 'finish the crypto review'], ['cpa', 'go over it with your CPA'], ['filed', 'file it'], ['noa', 'wait for the notice of assessment']];

// The days-late figure counts up once, the first time the overview is on screen.
function countUp(box, n) {
  if (box.dataset.n === String(n)) return;
  if (!overviewShown()) { box.textContent = '—'; delete box.dataset.n; return; }
  const from = box.dataset.n == null ? 0 : +box.dataset.n; box.dataset.n = n;
  if (REDUCE || from === n) { box.textContent = n.toLocaleString('en-CA'); return; }
  // Lands on the number even if animation frames are paused (a background tab)
  setTimeout(() => { if (box.dataset.n === String(n)) box.textContent = n.toLocaleString('en-CA'); }, 1400);
  const t0 = performance.now();
  (function step(t) { const p = Math.min(1, (t - t0) / 1300); box.textContent = Math.round(from + (n - from) * (1 - Math.pow(1 - p, 4))).toLocaleString('en-CA'); if (p < 1 && box.dataset.n === String(n)) requestAnimationFrame(step); })(t0);
}

function renderOverview() {
  const has = state.files.length > 0;
  const open = R.items.filter(i => i.needs).length;
  const st = FILE_YEARS.map(y => ({ y, s: filingStatus(y), x: yearEst(y), d: yr(y) }));
  const unfiled = st.filter(o => o.s !== 'filed'), ready = unfiled.filter(o => o.s === 'ready'), going = unfiled.filter(o => o.s === 'in-progress');
  const refunds = unfiled.filter(o => o.x.has && o.x.bal < -1), owing = unfiled.filter(o => o.x.has && o.x.bal > 1);

  // Headline and dek
  const head = !unfiled.length ? (st.length > 1 ? 'All ' + lower(st.length) + ' returns are filed.' : 'Your ' + st[0].y + ' return is filed.') + ' The catch-up is done.'
    : say(unfiled.length) + ' ' + plural(unfiled.length, 'return') + ' to file. ' +
      (ready.length ? say(ready.length) + (ready.length > 1 ? ' are' : ' is') + ' ready for your CPA.' : going.length ? say(going.length) + (going.length > 1 ? ' are' : ' is') + ' under way.' : 'None are started yet.');
  revealWords($('#ovTitle'), head);
  $('#ovDek').textContent = has
    ? 'Your crypto is matched across ' + lower(state.files.length) + ' ' + plural(state.files.length, 'file') + (R.matchCount ? ', with ' + lower(R.matchCount) + ' ' + plural(R.matchCount, 'transfer') + ' between your own accounts paired up' : '') + ', and each coin’s cost is averaged the way CRA expects. ' +
      (open ? say(open) + ' ' + plural(open, 'decision') + ' in the review list could still change the numbers.' : 'Nothing in the review list is waiting on you.')
    : 'Import your exchange history and this page works out each year’s crypto gains and income, and keeps track of what’s left before each return can be filed.';

  // Days late, from the newest unfiled year
  if (unfiled.length) {
    const ny = unfiled[unfiled.length - 1].y, oy = unfiled[0].y, days = Math.max(0, daysLate(ny));
    countUp($('#lateDays'), days);
    $('#lateNote').innerHTML = '<b>' + plural(days, 'day') + ' since your ' + ny + ' return was due</b> on April 30, ' + (ny + 1) + '.' +
      (oy < ny ? ' The oldest, ' + oy + ', has been due for ' + daysLate(oy).toLocaleString('en-CA') + ' days.' : '') +
      ' Late penalties only apply to years where you owe' +
      (refunds.length ? ', and ' + lower(refunds.length) + ' of your ' + lower(unfiled.length) + ' unfiled ' + plural(unfiled.length, 'year') + (refunds.length > 1 ? ' look' : ' looks') + ' like ' + plural(refunds.length, 'a refund', 'refunds') + '.'
        : owing.length ? '. ' + say(owing.length) + ' ' + plural(owing.length, 'year looks', 'years look') + ' like a balance owing.'
        : '. Add each year’s T4 on Work and deductions to see which years owe.');
  } else { countUp($('#lateDays'), 0); $('#lateNote').innerHTML = '<b>days late.</b> ' + (st.length > 1 ? 'Every return from ' + yearSpan() + ' is filed.' : 'Your ' + yearSpan() + ' return is filed.'); }
  // Live: tick over at midnight while the page stays open
  clearTimeout(renderOverview.mid);
  const mid = new Date(); mid.setHours(24, 0, 5, 0);
  renderOverview.mid = setTimeout(() => R && renderOverview(), mid - Date.now());

  // Crypto to report, unfiled years
  const total = FILE_YEARS.map(yr).reduce((s, y) => s + y.taxableAfterLoss + y.income, 0);
  $('#heroVal').textContent = money(total);
  $('#heroNote').textContent = has ? (open ? 'An estimate. ' + say(open) + ' ' + plural(open, 'item') + ' still need review, so this may change.' : 'Taxable capital gains plus crypto income for ' + yearSpan() + ', before any other income.') : 'Import your exchange files to see this.';

  // Key figures
  const filedCount = st.length - unfiled.length;
  const yearsWith = Object.values(R.years).filter(y => y.disposals).length;
  const k = [
    ['Returns to file', String(unfiled.length), filedCount ? filedCount + ' of ' + st.length + ' filed' : yearSpan() + ', oldest first', filedCount === st.length ? 'ok' : 'warn'],
    ['Needs your review', String(open), open ? 'Transfers, prices or gaps' : 'All clear', open ? 'warn' : 'ok'],
    ['Transactions read', R.evs.length.toLocaleString('en-CA'), state.files.length + ' ' + plural(state.files.length, 'file') + ', ' + R.matchCount + ' ' + plural(R.matchCount, 'transfer') + ' matched', null],
    ['Sales and swaps', R.disps.length.toLocaleString('en-CA'), yearsWith ? 'across ' + yearsWith + ' tax ' + plural(yearsWith, 'year') : 'none yet', null]
  ];
  $('#kpis').innerHTML = k.map(([l, v, f, s]) => '<div class="card kpi"><div class="label">' + l + '</div><div class="value">' + v + '</div><div class="foot">' + (s ? ICON[s] : '') + esc(f) + '</div></div>').join('');

  nextStep(has, open, unfiled);
  penaltyNote(unfiled, owing);
  yearBlock(st);
  attention(has, unfiled);
  filingRail(st, unfiled, refunds);
  watchRise($('#tab-overview'));
}

/* Next step: the first step of your plan, or the next step of the catch-up */
function nextStep(has, open, unfiled) {
  const np = $('#ovNext'), plan = stratPlan(), first = s => (String(s).match(/^.*?[.!?](?=\s|$)/) || [s])[0];
  let p;
  if (plan.length) p = { h: plan[0].title, t: first(plan[0].text), when: plan[0].when, go: [['strategy', 'Your plan']] };
  else if (!has) p = { h: 'Import every crypto record', t: 'Every exchange and wallet from your very first purchase. Anything the Import tab can’t read goes on the manual template.', go: [['import', 'Import files']] };
  else if (open) p = { h: 'Clear the review list', t: say(open) + ' ' + plural(open, 'item needs', 'items need') + ' a decision: transfers to match, prices to fill in or gaps in history.', go: [['review', 'Review now']] };
  else if (!unfiled.length) p = { h: 'Keep each year’s papers', t: 'CRA can ask for slips and receipts for six years after each return is filed.', go: [['filing', 'Filing plan']] };
  else {
    const o = unfiled[0], t = state.tracker[o.y] || {};
    p = !t.slips ? { h: 'Download your ' + o.y + ' slips', t: 'T4, T4A, T5, T4E and RRSP receipts, under Tax information slips in CRA My Account.', go: [['filing', 'Filing plan']] }
      : !t.cpa ? { h: 'Book a CPA review for ' + o.y, t: 'Bring the export from Year reports, your slips and your notes for the year.', go: [['years', 'Year reports'], ['filing', 'Filing plan']] }
      : { h: 'File ' + o.y + ', then the next year', t: 'Oldest first. Tick it off on the Filing plan once it’s in.', go: [['filing', 'Filing plan']] };
  }
  if (!plan.length && !stratState().done) p.go.push(['strategy', 'Build a plan']);
  np.innerHTML = '<span class="lbl">Your next step</span><h3>' + esc(p.h) + '</h3><p>' + esc(p.t) + '</p>' + (p.when ? '<p class="when">When: ' + esc(p.when) + '</p>' : '') +
    '<div class="row">' + p.go.map(([g, l], i) => '<button' + (i ? '' : ' class="primary"') + ' data-goto="' + g + '">' + l + '</button>').join('') + '</div>';
  np.classList.remove('hidden');
}

/* What lateness costs, from the years that look like they owe */
function penaltyNote(unfiled, owing) {
  const lbl = '<span class="lbl">What lateness costs</span>';
  if (!unfiled.length) { $('#noteLate').innerHTML = lbl + 'Nothing, now. Keep slips and receipts for six years after each return.'; return; }
  if (!owing.length) { $('#noteLate').innerHTML = lbl + 'The penalty is 5% of the balance plus 1% for each full month late, up to 12, and only on years you owe. Refund years carry none.'; return; }
  const pen = owing.reduce((s, o) => s + o.x.bal * (.05 + .01 * Math.min(12, Math.max(0, Math.floor(daysLate(o.y) / 30.44)))), 0);
  $('#noteLate').innerHTML = lbl + 'On ' + owing.map(o => o.y).join(' and ') + ', the late-filing penalty is about <b>' + money(pen) + '</b> so far: 5% of the balance plus 1% for each full month late, up to 12. Interest comes on top.';
}

/* Year by year: chart, table and notes */
function yearBlock(st) {
  const byYear = {}; st.forEach(o => byYear[o.y] = o);
  const ys = Object.values(R.years).filter(y => y.disposals || y.income || FILE_YEARS.includes(y.year)).sort((a, b) => a.year - b.year);
  const shown = ys.length ? ys : FILE_YEARS.map(yr);
  const mx = Math.max(1, ...shown.map(y => Math.abs(y.net)));
  $('#yrTable').innerHTML = '<div class="scrollx"><table class="data yrs"><thead><tr><th>Year</th><th>Status</th><th class="hide-sm">Crypto gain or loss</th><th class="n">Taxable</th><th class="n hide-sm">Income</th><th class="n">Estimate</th></tr></thead><tbody>' +
    shown.map(y => {
      const o = byYear[y.year], s = o ? STATUS[o.s] : ['', 'Filed'];
      const flag = y.missing ? 'has gaps' : y.estimated ? 'some estimates' : '';
      const w = (Math.abs(y.net) / mx * 50).toFixed(1), ex = o ? estText(o.x) : '';
      return '<tr><td class="y">' + y.year + '</td><td><span class="pill ' + s[0] + '">' + s[1] + '</span>' + (flag ? '<small>' + flag + '</small>' : '') + '</td>' +
        '<td class="hide-sm"><div class="div">' + (Math.abs(y.net) >= .5 ? '<i class="grow ' + (y.net > 0 ? 'pos' : 'neg') + '" style="width:' + w + '%"></i>' : '') + '</div><small>' + (y.net ? (y.net > 0 ? '+' : '') + money(y.net) : 'none') + '</small></td>' +
        '<td class="n">' + money(y.taxableAfterLoss) + (y.applied > 0.005 ? '<small>after ' + money(y.applied) + ' carried loss</small>' : '') + '</td>' +
        '<td class="n hide-sm">' + money(y.income) + '</td>' +
        '<td class="n' + (o && o.x.has ? (o.x.bal > 1 ? ' owe' : o.x.bal < -1 ? ' back' : '') : '') + '">' + (ex || '<span style="color:var(--muted)">—</span>') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  drawYears(shown, byYear);

  // Notes, only what the numbers support
  const fy = FILE_YEARS.map(yr), notes = [];
  const big = [...fy].sort((a, b) => b.taxableAfterLoss - a.taxableAfterLoss)[0];
  if (big && big.taxableAfterLoss > 0.5) notes.push('<span class="lbl">Reading the chart</span>Bars above the line are gains, below are losses. ' + big.year + ' was your biggest year: <b>' + money(big.taxableAfterLoss) + '</b> taxable after the 50% inclusion.');
  const loss = fy.filter(y => y.net < -0.5).sort((a, b) => a.net - b.net)[0];
  if (loss) notes.push('The ' + loss.year + ' loss of <b>' + money(-loss.net) + '</b> can go back up to three years against earlier gains (form T1A), and what’s left carries forward with no time limit.');
  const inc = fy.reduce((s, y) => s + y.income, 0);
  if (inc > 0.5) notes.push('Staking and rewards added <b>' + money(inc) + '</b> of income. That’s taxed in full, not half.');
  if (!notes.length) notes.push('<span class="lbl">Reading the chart</span>Import your files and each year’s gain, loss and income appears here.');
  $('#noteYears').innerHTML = notes.map(n => '<p class="note">' + n + '</p>').join('');
}

function drawYears(ys, byYear) {
  const svg = $('#chYears');
  const W = svg.clientWidth || 600, H = Math.round(Math.max(190, Math.min(250, W * .34))), padL = 58, padB = 40, padT = 26;
  const S = [['net', 'Net capital gain or loss', 'var(--s1)'], ['income', 'Crypto income', 'var(--s2)']];
  $('#yrLegend').innerHTML = S.map(s => '<span><i style="background:' + s[2] + '"></i>' + s[1] + '</span>').join('');
  const vals = ys.flatMap(y => [y.net, y.income]);
  let mx = Math.max(0, ...vals), mn = Math.min(0, ...vals);
  if (mx - mn < 1) mx = 100;
  const raw = (mx - mn) / 4, p10 = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * p10).find(s => s >= raw);
  mn = Math.floor(mn / step) * step; mx = Math.ceil(mx / step) * step;
  const ticks = []; for (let v = mn; v <= mx + step / 2; v += step) ticks.push(Math.round(v));
  const yS = v => padT + (mx - v) / (mx - mn) * (H - padT - padB);
  const plotW = W - padL - 6, gw = plotW / ys.length, bw = Math.max(4, Math.min(30, (gw - 16) / 2)), y0 = yS(0);
  let grid = '', g = '', bars = '';
  for (const t of ticks) if (t) grid += '<line x1="' + padL + '" x2="' + (W - 6) + '" y1="' + yS(t) + '" y2="' + yS(t) + '" stroke="var(--grid)"/>';
  for (const t of ticks) g += '<text class="m" x="' + (padL - 10) + '" y="' + (yS(t) + 4) + '" text-anchor="end">' + money(t) + '</text>';
  const best = ys.reduce((m, y, i) => y.taxableAfterLoss > (m < 0 ? 0.5 : ys[m].taxableAfterLoss) ? i : m, -1);
  ys.forEach((y, i) => {
    const cx = padL + gw * i + gw / 2;
    S.forEach(([key, , col], j) => {
      const v = y[key], h = Math.abs(yS(v) - y0);
      if (h >= 0.5) bars += '<rect x="' + (cx - bw - 1 + j * (bw + 2)).toFixed(1) + '" y="' + Math.min(y0, yS(v)).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + col + '"/>';
    });
    const o = byYear[y.year], filed = !o || o.s === 'filed';
    g += '<text x="' + cx + '" y="' + (H - 20) + '" text-anchor="middle" class="v">' + y.year + '</text>';
    g += '<text x="' + cx + '" y="' + (H - 5) + '" text-anchor="middle" class="m">' + (filed ? 'filed' : o.s === 'ready' ? 'ready' : 'to file') + '</text>';
    if (i === best) g += '<text class="ann" x="' + Math.max(padL + 40, Math.min(W - 46, cx)) + '" y="' + Math.max(14, Math.min(yS(y.net), yS(y.income)) - 8) + '" text-anchor="middle">biggest year</text>';
  });
  g += '<line x1="' + padL + '" x2="' + (W - 6) + '" y1="' + y0 + '" y2="' + y0 + '" stroke="var(--text)"/>';
  ys.forEach((y, i) => g += '<rect class="hit" data-i="' + i + '" x="' + (padL + gw * i) + '" y="0" width="' + gw + '" height="' + (H - padB) + '" fill="transparent"/>');
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('height', H);
  svg.innerHTML = grid + '<g class="bars" style="transform-origin:0 ' + y0.toFixed(1) + 'px">' + bars + '</g>' + g;
  svg.setAttribute('aria-label', 'By year: ' + ys.map(y => y.year + ' net ' + money(y.net) + ', income ' + money(y.income)).join('; '));
  // Grow the bars from the zero line, the first time the chart is on screen
  if (!REDUCE && !svg.dataset.drawn && overviewShown()) {
    svg.dataset.drawn = '1';
    const b = svg.querySelector('.bars'); b.style.transform = 'scaleY(0)';
    requestAnimationFrame(() => requestAnimationFrame(() => { b.style.transition = 'transform 1.1s cubic-bezier(.16,1,.3,1) .3s'; b.style.transform = ''; }));
  }
  svg.querySelectorAll('.hit').forEach(h => {
    h.onmousemove = ev => { const y = ys[+h.dataset.i], o = byYear[y.year]; showTip('<b>' + y.year + '</b>' + S.map(s => '<div class="r"><span><i class="dot" style="background:' + s[2] + '"></i> ' + s[1] + '</span><span>' + money(y[s[0]]) + '</span></div>').join('') + '<div class="r"><span>Taxable gain</span><span>' + money(y.taxableAfterLoss) + '</span></div>' + (o && o.x.has ? '<div class="r"><span>Estimate</span><span>' + estText(o.x) + '</span></div>' : ''), ev); };
    h.onmouseleave = hideTip;
  });
}

/* Needs your attention: review groups, old years, missing pay and province */
function attention(has, unfiled) {
  const it = R.items.filter(i => i.needs), list = [];
  const pre = Object.values(R.years).filter(y => isFiledBefore(y.year) && (y.disposals || y.income));
  const G = {
    short: [n => n + ' ' + plural(n, 'sale') + ' with no purchase history', 'The coins were sold but never bought in your records, so they’re costed at $0. Import the older file or add them on the template.', 'crit'],
    price: [n => n + ' ' + plural(n, 'transaction') + ' with no CAD value', 'Add a price file on Import, or type the price on the review list.', ''],
    out: [n => n + ' ' + plural(n, 'transfer') + ' out with no destination', 'If they went to your own wallet, confirm it so they aren’t counted as sales.', ''],
    in: [n => n + ' ' + plural(n, 'deposit') + ' with no known source', 'Say where they came from so their cost is right.', '']
  };
  Object.entries(G).forEach(([kd, [h, p, c]]) => { const n = it.filter(i => i.kind === kd).length; if (n) list.push([h(n), p, 'review', 'Review', c]); });
  if (!state.years) list.push(['Choose the years you’re filing', 'Set to ' + yearSpan() + ' until you choose. Years before the first one count as already filed.', 'filing', 'Choose', '']);
  if (pre.length) list.push(['Crypto in ' + pre.map(y => y.year).join(', ') + ', a year already filed', 'If it wasn’t on that return, ask your CPA about adjusting it.', 'years', 'Year reports', '']);
  const noPay = unfiled.filter(o => { const w = (state.work || {})[o.y] || {}; return !wn(w.t4inc) && !wn(w.ctGross) && !wn(w.eiInc); }).map(o => o.y);
  if (noPay.length) list.push(['No pay entered for ' + (noPay.length > 2 ? noPay[0] + ' to ' + noPay[noPay.length - 1] : noPay.join(' and ')), 'Paste your pay summary or type the T4 amounts, so each year’s estimate includes your work income.', 'work', 'Add pay', '']);
  if (unfiled.length && !taxSettings().province) list.push(['Choose your province', 'It sets the provincial part of each year’s estimate.', 'work', 'Choose', '']);
  $('#attn').innerHTML = list.length
    ? '<ol class="attn">' + list.map(([h, p, g, b, c]) => '<li' + (c ? ' class="' + c + '"' : '') + '><div><h4>' + esc(h) + '</h4><p>' + esc(p) + '</p></div><button data-goto="' + g + '">' + b + '</button></li>').join('') + '</ol>'
    : '<div class="empty">' + (has ? 'Nothing needs your attention.' : 'Import files to start.') + '</div>';
}

/* Filing rail, one stop per year to file, filled up to the last filed year */
function filingRail(st, unfiled, refunds) {
  const lastFiled = st.map(o => o.s === 'filed').lastIndexOf(true), nowI = st.findIndex(o => o.s !== 'filed');
  $('#ovFiling').innerHTML = '<ol class="rail-steps" style="--p:' + (lastFiled > 0 ? lastFiled / (st.length - 1) : 0).toFixed(3) + '"><span class="fill" aria-hidden="true"></span>' + st.map((o, i) => {
    const t = state.tracker[o.y] || {}, s = STATUS[o.s], nx = TRACK.find(([k]) => !t[k]);
    const line = o.s === 'filed' ? (t.noa ? 'Filed and assessed.' : 'Filed. Waiting for the notice of assessment.') : 'Next: ' + (nx ? nx[1] : 'file it') + '.' + (o.x.has ? ' Estimate ' + estText(o.x) + '.' : '');
    return '<li class="' + (o.s === 'filed' ? 'done' : i === nowI ? 'now' : '') + '"><h4>' + o.y + ' return <span class="pill ' + s[0] + '">' + s[1] + '</span></h4><p>' + esc(line) + '</p></li>';
  }).join('') + '</ol>';

  const notes = [];
  if (unfiled.length > 1) notes.push('<span class="lbl">In order</span>Oldest first: <b>' + unfiled.map(o => o.y).join(' → ') + '</b>.' + (refunds.length ? ' Refund years carry no penalty, so ' + refunds.map(o => o.y).join(' and ') + (refunds.length > 1 ? ' are' : ' is') + ' quick wins.' : ''));
  const hs = [...R.holdings].sort((a, b) => b.acb - a.acb), cost = hs.reduce((s, h) => s + h.acb, 0);
  notes.push((hs.length ? '<span class="lbl">Still held</span>' + hs.slice(0, 3).map(h => '<b>' + qty(h.units) + ' ' + esc(h.asset) + '</b>').join(', ') + (hs.length > 3 ? ' and ' + (hs.length - 3) + ' more' : '') + ', at a total cost of ' + money(cost) + '. ' : '') +
    'Moving coins between your own wallets isn’t taxable. Only sales, swaps, spending and crypto income count.');
  $('#noteFiling').innerHTML = notes.map(n => '<p class="note">' + n + '</p>').join('');
}
