// Runtime code for the Statements tab's credit card check. Inserted by statements.js.
/* ---------- Credit cards: paid in full? Interest on a card is the sure sign a balance was carried ---------- */
const CC_INT = /\binterest\b|\bint(e|é)r(e|ê)ts?\b|\bint chg\b|cash advance int/i;
const CC_BAD_FEE = /late (payment )?(fee|charge)|missed payment|over-?limit|returned payment|nsf/i;
// Each card's months: interest, bad fees, other fees, charged, paid; and whether payments kept pace.
// Shared by the Ledger chips below and the Notebook grid (notebook.js, through window.__nb.cc).
function ccData() {
  const months = monthsList();
  const isPay = t => t.amount > 0 && (t.category === CCP || t.link || /payment|paiement|merci|thank you/i.test(t.desc));
  return [...cardAccounts()].map(a => {
    const tx = D.transactions.filter(t => t.account === a);
    const ms = months.filter(k => tx.some(t => monthOf(t.date) === k));
    const per = ms.map(k => {
      const m = tx.filter(t => monthOf(t.date) === k);
      const interest = -sum(m.filter(t => t.amount < 0 && CC_INT.test(t.desc)), t => t.amount);
      const bad = m.filter(t => t.amount < 0 && CC_BAD_FEE.test(t.desc));
      const fees = m.filter(t => t.amount < 0 && t.category === "Bank fees & interest" && !CC_INT.test(t.desc) && !CC_BAD_FEE.test(t.desc));
      const charged = -sum(m.filter(t => !isPay(t)), t => t.amount), paid = sum(m.filter(isPay), t => t.amount);
      return { k, interest, bad, fees, charged, paid };
    });
    // Payments in each month mostly clear the month before, so drop the first month's payments and the last month's charges.
    // A month still in progress may not have its payment yet, so it's left out. Statement dates don't match calendar months,
    // so a gap under about a month of card spending is timing, not a carried balance.
    const full = per.filter(p => !isPartial(p.k)), chg = full.slice(0, -1);
    const chargedAll = sum(chg, p => p.charged), paidAll = sum(full.slice(1), p => p.paid), gap = chargedAll - paidAll;
    const behind = gap > Math.max(50, chargedAll / Math.max(chg.length, 1));
    const span = chg.length ? `${monthName(chg[0].k, { month: "short", year: "numeric" })} to ${monthName(chg[chg.length - 1].k, { month: "short", year: "numeric" })}` : "";
    const hit = per.filter(p => p.interest > 0.005 || p.bad.length);
    return { a, ms, per, full, gap, behind, span, hit };
  });
}
function ccCheck() {
  const box = $("#cc"), data = ccData();
  $("#ccCard").classList.toggle("hidden", !data.length);
  if (!data.length) return;
  box.innerHTML = data.map(({ a, ms, per, full, gap, behind, span, hit }) => {
    const chip = p => {
      const lv = p.interest > 0.005 || p.bad.length ? "critical" : p.fees.length ? "info" : "good";
      const notes = [p.interest > 0.005 ? fmt(p.interest, 2) + " interest" : "No interest", ...p.bad.map(t => `${t.desc} ${fmt(-t.amount, 2)}`), ...p.fees.map(t => `${t.desc} ${fmt(-t.amount, 2)}`)];
      const tip = `${monthName(p.k)}${isPartial(p.k) ? " (so far)" : ""}: ${notes.join(", ")}. Charged ${fmt(p.charged, 2)}, paid ${fmt(p.paid, 2)}.`;
      return `<span class="cc-m cc-${lv}${p.k === stMonth ? " cc-cur" : ""}" title="${esc(tip)}"${lv === "critical" ? ` role="button" tabindex="0" data-ccgo="${p.k}"` : ""}>${icon(lv)}${monthName(p.k, { month: "short" })}${isPartial(p.k) ? "*" : ""}<i class="sr-only">: ${esc(notes.join(", "))}</i></span>`;
    };
    const head = hit.length
      ? `${icon("critical")}<b>${esc(a)}</b>: interest or a late fee in ${hit.map(p => monthName(p.k, { month: "short", year: "numeric" })).join(", ")} (${fmt(sum(hit, p => p.interest + sum(p.bad, t => -t.amount)), 2)}). Pay the full statement balance by the due date and it stops.`
      : `${icon("good")}<b>${esc(a)}</b>: no interest in ${ms.length} month${ms.length > 1 ? "s" : ""} of statements.`;
    const keep = full.length < 2 ? "" : !behind
      ? `Your payments kept pace with what you charged from ${span}.`
      : `From ${span} you charged ${fmt(gap)} more than you paid the month after, more than a month of card spending. Check your latest statement balance: whatever is still on the card after its due date starts costing interest.`;
    return `<div class="cc-card"><p class="cc-head">${head}</p><div class="cc-row">${per.slice(-12).map(chip).join("")}</div>${keep ? `<p class="desc" style="margin:6px 0 0">${keep}</p>` : ""}</div>`;
  }).join("");
  const red = box.querySelector("[data-ccgo]"), part = monthsList().some(isPartial);
  if (red || part) box.insertAdjacentHTML("beforeend", `<p class="desc" style="margin:10px 0 0">${red ? "Click a red month to see its charges. " : ""}${part ? "* Month still in progress." : ""}</p>`);
  box.querySelectorAll("[data-ccgo]").forEach(c => {
    const go = () => { stMonth = c.dataset.ccgo; txLimit = 150; renderStatements(); stOpenTx("", "Bank fees & interest"); };
    c.onclick = go; c.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } };
  });
}
