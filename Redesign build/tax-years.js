// Taxes: which years are still to file is a setting (state.years = { first, last }), not a fixed 2021 to 2025.
// Years before the first one count as already filed. The choice sits at the top of Filing plan, and until it is
// made the Overview's attention list asks for it. Workspaces saved before this setting existed keep 2021 to 2025.
// Called by build-tc.js on the original page, before the overview story is swapped in (tc-overview.js uses the
// same helpers: FILE_YEARS, yearSpan(), isFiledBefore()).
module.exports = function taxYears(h) {
  const rep = (from, to, label, all) => {
    const n = h.split(from).length - 1;
    if (!n || (!all && n !== 1)) throw new Error("tax years: anchor x" + n + ": " + label);
    h = h.split(from).join(to);
  };

  rep("const FILE_YEARS = [2021, 2022, 2023, 2024, 2025];\n", `// Years this page has tax tables for; the owner picks which of them are still to file (Filing plan)
const TAX_YEARS = [2021, 2022, 2023, 2024, 2025];
let FILE_YEARS = TAX_YEARS.slice();
const yearSpan = () => FILE_YEARS.length > 1 ? FILE_YEARS[0] + ' to ' + FILE_YEARS[FILE_YEARS.length - 1] : String(FILE_YEARS[0]);
const isFiledBefore = y => y < FILE_YEARS[0];
function applyYears() {
  // A workspace saved before this setting existed was set up for 2021 to 2025 (checked once per loaded workspace)
  if (applyYears.s !== state) { applyYears.s = state; if (!state.years && (state.files.length || Object.keys(state.tracker).length)) state.years = { first: 2021, last: 2025 }; }
  const r = state.years || {}, a = TAX_YEARS.includes(+r.first) ? +r.first : TAX_YEARS[0];
  const b = TAX_YEARS.includes(+r.last) && +r.last >= a ? +r.last : TAX_YEARS[TAX_YEARS.length - 1];
  FILE_YEARS = TAX_YEARS.filter(y => y >= a && y <= b);
  $$('[data-yspan]').forEach(e => e.textContent = yearSpan());
}
`, "FILE_YEARS");
  rep("function render() {\n  R = TC.compute(state);", "function render() {\n  applyYears();\n  R = TC.compute(state);", "render");

  // Years before the first one are filed
  rep("y.year <= 2020", "isFiledBefore(y.year)", "filed years", true);
  rep("(y <= 2020 ? '<span class=\"sm\">filed</span>'", "(isFiledBefore(y) ? '<span class=\"sm\">filed</span>'", "year chips");
  rep("if (firstYear > 2021)", "if (firstYear > FILE_YEARS[0])", "earliest record");
  rep("|| yr(y).income) || 2021;", "|| yr(y).income) || FILE_YEARS[0];", "first year shown");
  rep("yr(2020).disposals", "yr(FILE_YEARS[0] - 1).disposals", "VDP year");
  rep("missing from a filed return such as 2020.", "missing from a filed return such as ' + (FILE_YEARS[0] - 1) + '.", "VDP text");
  rep("out of date until 2021 to 2025 are assessed", "out of date until ' + yearSpan() + (FILE_YEARS.length > 1 ? ' are' : ' is') + ' assessed", "RRSP text");

  // Filing plan: the steps say "your years", and the year picker sits above the year cards
  rep("receipts for 2021 to 2025, under", "receipts for <span data-yspan>2021 to 2025</span>, under", "slips step");
  rep("your slips and your 2020 notice.", "your slips and your last notice of assessment.", "CPA step");
  rep("<b>File 2021, then 2022, 2023, 2024, 2025</b>", "<b>File the oldest year first, then each year after it</b>", "file step");
  rep('    <div class="tracker" id="tracker" style="margin-bottom:16px"></div>', `    <div class="card noprint" id="yearPick" style="margin-bottom:16px">
      <h2>Years you're filing</h2>
      <p class="desc">Pick the first and last return you still need to file. Years before the first count as already filed. This page has tax tables for 2021 to 2025.</p>
      <div class="mapgrid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">
        <label>First year to file<select class="fld-in" id="yrFirst"></select></label>
        <label>Last year to file<select class="fld-in" id="yrLast"></select></label>
      </div>
    </div>
    <div class="tracker" id="tracker" style="margin-bottom:16px"></div>`, "year picker");
  rep("function renderTracker() {\n", `function renderYearPick() {
  const opt = (v, on) => '<option' + (v === on ? ' selected' : '') + '>' + v + '</option>';
  $('#yrFirst').innerHTML = TAX_YEARS.map(v => opt(v, FILE_YEARS[0])).join('');
  $('#yrLast').innerHTML = TAX_YEARS.map(v => opt(v, FILE_YEARS[FILE_YEARS.length - 1])).join('');
}
['yrFirst', 'yrLast'].forEach(id => $('#' + id).onchange = () => {
  let a = +$('#yrFirst').value, b = +$('#yrLast').value;
  if (b < a) { if (id === 'yrFirst') b = a; else a = b; }
  state.years = { first: a, last: b }; save(); render();
});
function renderTracker() {
  renderYearPick();
`, "tracker");
  return h;
};
