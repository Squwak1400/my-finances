// Turns BMO chequing ("Everyday Banking") PDF statements into one CSV that My finances can import.
//   node "Redesign build/tools-bmo-chq-pdf.js" "<folder with the PDFs>" ["<output name>.csv"]
// The sibling of tools-bmo-pdf.js (Mastercard). Needs pdftotext from Git Bash. Each statement must add up three
// ways or the file isn't written: its deductions and additions match the "Closing totals" line, and every
// printed running balance matches opening balance + transactions so far. Money out comes out negative.
// The file is named "BMO Checking ..." so the app files it under the BMO Checking account the owner already has.
const fs = require("fs"), path = require("path"), os = require("os"), { execFileSync } = require("child_process");
const MON = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const r2 = n => Math.round(n * 100) / 100, money = s => +s.replace(/[$,]/g, "");

function parse(text, name) {
  const pe = text.match(/period ending\s*([A-Z][a-z]+)\s*(\d{1,2}),\s*(\d{4})/);
  if (!pe || !/Everyday Banking/.test(text)) throw new Error(name + ": no 'period ending' date; is this a BMO chequing statement?");
  const eMon = MONTHS.indexOf(pe[1]) + 1, eYear = +pe[3];
  // Amounts are told apart by column: under "from your account" (out), "to your account" (in) or "Balance"
  let cols = null, balCol = null; // "Balance ($)" can sit on the header line above or below "from your account"
  const center = (line, word) => { const i = line.indexOf(word); return i < 0 ? null : i + word.length / 2; };
  const kind = (line, m) => { const c = m.index + m[0].length / 2; return Object.entries(cols).sort((a, b) => Math.abs(a[1] - c) - Math.abs(b[1] - c))[0][0]; };
  const tx = []; let open = null, totals = null, last = null, bal = null, badBal = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.includes("Balance ($)")) { balCol = center(line, "Balance ($)"); if (cols) cols.bal = balCol; }
    if (line.includes("from your account")) cols = { out: center(line, "from your account ($)"), in: center(line, "to your account ($)"), bal: balCol };
    const m = line.match(/^\s*([A-Z][a-z]{2}) (\d{2})\s{2,}(.+)$/);
    if (m && MON[m[1]] && cols && cols.bal) {
      const nums = [...m[3].matchAll(/-?[\d,]+\.\d\d\b/g)], firstNum = nums.length ? m[3].indexOf(nums[0][0]) : m[3].length;
      const desc = m[3].slice(0, firstNum).replace(/\s+/g, " ").trim(), off = line.length - m[3].length;
      const got = {}; nums.forEach(n => { got[kind(line, { index: n.index + off, 0: n[0] })] = money(n[0]); });
      if (/^Opening balance/.test(desc)) { open = got.bal; bal = open; last = null; continue; }
      if (/^Closing totals/.test(desc)) { totals = { out: got.out || 0, in: got.in || 0 }; last = null; continue; }
      const mo = MON[m[1]], y = mo > eMon ? eYear - 1 : eYear;
      const amount = got.out != null ? -got.out : got.in != null ? got.in : NaN;
      last = { date: `${y}-${String(mo).padStart(2, "0")}-${m[2]}`, desc, amount };
      tx.push(last);
      bal = r2(bal + amount);
      if (got.bal != null && Math.abs(got.bal - bal) > 0.005) badBal.push(`${last.date} ${desc}: printed ${got.bal}, worked out ${bal}`);
      continue;
    }
    // A description that wraps (the exchange rate on a foreign ATM withdrawal): short, no amounts, under the description
    const t = line.trim();
    if (last && t && /^\s{6,}\S/.test(line) && t.length <= 40 && !/\d+\.\d\d\b|Page|continued|Description|Date|Amounts|Owner|Account|Here's/.test(t)) { last.desc += " " + t; continue; }
    if (t) last = null;
  }
  const out = r2(tx.filter(t => t.amount < 0).reduce((s, t) => s - t.amount, 0)), inn = r2(tx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0));
  const problems = [...badBal];
  if (open == null || !totals) problems.push("no opening balance or closing totals found");
  else {
    if (Math.abs(out - totals.out) > 0.005) problems.push(`money out ${out} vs closing totals ${totals.out}`);
    if (Math.abs(inn - totals.in) > 0.005) problems.push(`money in ${inn} vs closing totals ${totals.in}`);
  }
  if (tx.some(t => !Number.isFinite(t.amount))) problems.push("a transaction with no amount");
  return { name, statement: `${eYear}-${String(eMon).padStart(2, "0")}`, tx, problems, ok: !problems.length };
}

const dir = process.argv[2];
if (!dir) { console.log('Usage: node tools-bmo-chq-pdf.js "<folder with the PDFs>" ["<output>.csv"]'); process.exit(1); }
const pdfs = fs.readdirSync(dir).filter(f => /\.pdf$/i.test(f));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "bmochq-"));
const all = pdfs.map(f => {
  const txt = path.join(tmp, f + ".txt");
  execFileSync("pdftotext", ["-table", path.join(dir, f), txt]);
  return parse(fs.readFileSync(txt, "utf8"), f);
}).sort((a, b) => a.statement.localeCompare(b.statement));
fs.rmSync(tmp, { recursive: true, force: true });
all.forEach(s => console.log(`${s.statement}  ${s.name.padEnd(24)} ${String(s.tx.length).padStart(3)} transactions  ${s.ok ? "adds up" : "OFF: " + s.problems.join("; ")}`));
if (all.some(s => !s.ok)) { console.log("Not written: a statement doesn't add up, so some transactions weren't read right."); process.exit(2); }
const rows = all.flatMap(s => s.tx).map((t, i) => ({ ...t, i })).sort((a, b) => a.date.localeCompare(b.date) || a.i - b.i);
const q = s => `"${String(s).replace(/"/g, '""')}"`;
const MN = Object.keys(MON), first = rows[0].date, lastD = rows[rows.length - 1].date;
const mn = s => MN[+s.slice(5, 7) - 1], span = first.slice(0, 4) === lastD.slice(0, 4) ? `${mn(first)}-${mn(lastD)} ${lastD.slice(0, 4)}` : `${mn(first)} ${first.slice(0, 4)}-${mn(lastD)} ${lastD.slice(0, 4)}`;
const file = path.join(dir, process.argv[3] || `BMO Checking ${span}.csv`);
fs.writeFileSync(file, "Date,Description,Amount\r\n" + rows.map(t => [t.date, q(t.desc), t.amount.toFixed(2)].join(",")).join("\r\n") + "\r\n");
console.log(`Wrote ${rows.length} transactions to ${file}`);
