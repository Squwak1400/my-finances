// Turns BMO Mastercard PDF statements into one CSV that My finances can import.
//   node "Redesign build/tools-bmo-pdf.js" "<folder with the PDFs>" ["<output name>.csv"]
// Needs pdftotext (xpdf 4, comes with Git for Windows; run it from Git Bash). Each statement's transactions
// must add up to its own change in balance (previous total balance to total balance), or the file isn't written.
// Purchases come out negative and payments/credits positive, the way the app expects. Foreign purchases keep
// the currency and rate at the end of the description, after the merchant.
const fs = require("fs"), path = require("path"), os = require("os"), { execFileSync } = require("child_process");
const MON = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const money = s => +s.replace(/[$,]/g, "");

function parse(text, name) {
  const L = text.split(/\r?\n/);
  const sd = text.match(/Statement date\s+([A-Z][a-z]{2})\.\s+(\d+),\s+(\d{4})/);
  if (!sd) throw new Error(name + ": no statement date; is this a BMO Mastercard statement?");
  const sMon = MON[sd[1]], sYear = +sd[3];
  const prev = money(text.match(/Previous total balance,[^$]*\$([\d,]+\.\d\d)/)[1]);
  const total = money(text.match(/\n\s*Total balance\s+\$([\d,]+\.\d\d)/)[1]);
  // The two dates sometimes come out glued together ("May. 11May. 11")
  const re = /^([A-Z][a-z]{2})\.\s*(\d{1,2})\s*([A-Z][a-z]{2})\.\s*(\d{1,2})\s+(.+?)\s+([\d,]+\.\d\d)(\s+CR)?\s*$/;
  const out = []; let last = null, inTx = false;
  for (const line of L) {
    if (/Transactions since your last statement/.test(line)) inTx = true;
    if (/^Subtotal for|^Total for card number/.test(line.trim())) { inTx = false; last = null; continue; }
    if (!inTx) continue;
    const m = line.match(re);
    if (m) {
      const mo = MON[m[1]], y = mo > sMon ? sYear - 1 : sYear;
      // Foreign purchases start with the currency and rate ("CLP 4270@0.0015..."); the merchant follows, often on the next line
      const d = m[5].replace(/\s+/g, " ").trim(), fx = d.match(/^([A-Z]{3}) ([\d.,]+)@([\d.]+)\s*(.*)$/);
      last = { date: `${y}-${String(mo).padStart(2, "0")}-${String(+m[2]).padStart(2, "0")}`, parts: [fx ? fx[4] : d].filter(Boolean), fx: fx ? `${fx[1]} ${fx[2]} @ ${fx[3]}` : "", amount: Math.round(money(m[6]) * (m[7] ? 1 : -1) * 100) / 100, more: 2 };
      out.push(last); continue;
    }
    // A description that wraps: the rest of the name or the province on the next line or two, indented under the description
    const t = line.trim();
    if (last && last.more && t && /^\s{12,}\S/.test(line) && t.length <= 60 && !/\d+\.\d\d|Page \d|continued|Card number|DESCRIPTION|DATE|Subtotal/.test(t)) { last.parts.push(t.replace(/\s+/g, " ")); last.more--; continue; }
    if (t) last = null;
  }
  out.forEach(t => { t.desc = t.parts.join(" ") + (t.fx ? (t.parts.length ? " " : "") + `(${t.fx})` : ""); delete t.parts; delete t.fx; delete t.more; });
  const net = Math.round(out.reduce((s, t) => s - t.amount, 0) * 100) / 100, expected = Math.round((total - prev) * 100) / 100;
  return { name, statement: `${sYear}-${String(sMon).padStart(2, "0")}`, tx: out, net, expected, ok: Math.abs(net - expected) < 0.005 };
}

const dir = process.argv[2];
if (!dir) { console.log('Usage: node tools-bmo-pdf.js "<folder with the PDFs>" ["<output>.csv"]'); process.exit(1); }
const pdfs = fs.readdirSync(dir).filter(f => /\.pdf$/i.test(f));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "bmo-"));
const all = pdfs.map(f => {
  const txt = path.join(tmp, f + ".txt");
  execFileSync("pdftotext", ["-table", path.join(dir, f), txt]);
  return parse(fs.readFileSync(txt, "utf8"), f);
}).sort((a, b) => a.statement.localeCompare(b.statement));
fs.rmSync(tmp, { recursive: true, force: true });
all.forEach(s => console.log(`${s.statement}  ${s.name.padEnd(24)} ${String(s.tx.length).padStart(3)} transactions  ${s.ok ? "adds up" : `OFF BY ${(s.net - s.expected).toFixed(2)}`}`));
if (all.some(s => !s.ok)) { console.log("Not written: a statement doesn't add up, so some transactions weren't read."); process.exit(2); }
const rows = all.flatMap(s => s.tx).map((t, i) => ({ ...t, i })).sort((a, b) => a.date.localeCompare(b.date) || a.i - b.i);
const q = s => `"${String(s).replace(/"/g, '""')}"`;
// Default name from the statement months, e.g. "BMO Mastercard Jan-Jul 2026.csv"
const MN = Object.keys(MON), first = all[0].statement, last = all[all.length - 1].statement;
const mn = s => MN[+s.slice(5) - 1], span = first === last ? `${mn(first)} ${first.slice(0, 4)}` : first.slice(0, 4) === last.slice(0, 4) ? `${mn(first)}-${mn(last)} ${last.slice(0, 4)}` : `${mn(first)} ${first.slice(0, 4)}-${mn(last)} ${last.slice(0, 4)}`;
const file = path.join(dir, process.argv[3] || `BMO Mastercard ${span}.csv`);
fs.writeFileSync(file, "Date,Description,Amount\r\n" + rows.map(t => [t.date, q(t.desc), t.amount.toFixed(2)].join(",")).join("\r\n") + "\r\n");
console.log(`Wrote ${rows.length} transactions to ${file}`);
