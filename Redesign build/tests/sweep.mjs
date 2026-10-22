// Audit sweep: every tab in both volumes, light/dark, desktop/phone. Writes sweep.json + screenshots in $S/sweep/.
import { spawn } from "child_process"; import fs from "fs";
const S = process.env.S, OUT = S + "/sweep"; fs.mkdirSync(OUT, { recursive: true });
const PAGE = process.env.PAGE || "file:///C:/Claude%20Projects/Financial%20Advisor/My%20finances.html";
const PORT = 9400 + Math.floor(Math.random() * 50);
const ch = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${S}/sw${Date.now()}`, "--hide-scrollbars", "about:blank"]);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let t; for (let i = 0; i < 40 && !t; i++) { await sleep(250); try { t = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find(x => x.type === "page"); } catch {} }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = {}, errs = [];
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) pend[d.id](d); if (d.method === "Runtime.exceptionThrown") errs.push(d.params.exceptionDetails.exception?.description?.slice(0, 200) || d.params.exceptionDetails.text); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => { const r = (await send("Runtime.evaluate", { expression: `(async()=>{${e}})()`, awaitPromise: true, returnByValue: true })).result; return r.exceptionDetails ? { exc: r.exceptionDetails.exception?.description || r.exceptionDetails.text } : r.result?.value; };
await send("Runtime.enable");

const PROBE = `
const W = document.documentElement.clientWidth, out = { overflowX: document.documentElement.scrollWidth - W, offRight: [], clipped: [], svgOut: [], svgOverlap: [], contrast: [], small: [] };
const vis = el => { const r = el.getBoundingClientRect(); if (!r.width || !r.height) return false; const cs = getComputedStyle(el); return cs.visibility !== "hidden" && cs.display !== "none" && +cs.opacity > 0.05; };
const name = el => (el.id ? "#" + el.id : el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\\s+/).slice(0, 2).join(".") : "")) + ' "' + (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 40) + '"';
const inScroller = el => { for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === "auto" || o === "scroll") return true; } return false; };
const root = document.querySelector("main[data-vol]:not([hidden])");
const all = [...document.querySelectorAll("body *")].filter(el => !el.closest("[hidden], .hidden, dialog:not([open]), script, style, svg defs") && vis(el));
for (const el of all) {
  const r = el.getBoundingClientRect();
  if (r.right > W + 1 && !inScroller(el) && el.closest(".shell")) out.offRight.push(name(el) + " right=" + Math.round(r.right));
  const cs = getComputedStyle(el);
  if (el.namespaceURI !== "http://www.w3.org/2000/svg" && (cs.overflowX === "hidden" || cs.overflow === "hidden" || cs.textOverflow === "ellipsis") && el.scrollWidth > el.clientWidth + 1 && el.textContent.trim() && !["SELECT","INPUT","TEXTAREA"].includes(el.tagName) && el.children.length < 3)
    out.clipped.push(name(el) + " " + el.scrollWidth + ">" + el.clientWidth);
}
// SVG charts: text outside the svg box, and labels overlapping each other
document.querySelectorAll("svg.chart, svg[role=img]").forEach(svg => {
  if (!vis(svg)) return; const sb = svg.getBoundingClientRect(); const id = svg.id || svg.getAttribute("aria-label")?.slice(0, 30);
  const ts = [...svg.querySelectorAll("text")].filter(x => x.textContent.trim()).map(x => ({ x, b: x.getBoundingClientRect() })).filter(o => o.b.width);
  ts.forEach(o => { if (o.b.left < sb.left - 1 || o.b.right > sb.right + 1 || o.b.top < sb.top - 1 || o.b.bottom > sb.bottom + 1) out.svgOut.push(id + ': "' + o.x.textContent.slice(0, 30) + '" by ' + Math.round(Math.max(sb.left - o.b.left, o.b.right - sb.right, sb.top - o.b.top, o.b.bottom - sb.bottom)) + "px"); });
  for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) { const a = ts[i].b, b = ts[j].b; const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); if (ix > 2 && iy > 3 && !ts[i].x.contains(ts[j].x) && !ts[j].x.contains(ts[i].x)) out.svgOverlap.push(id + ': "' + ts[i].x.textContent.slice(0, 22) + '" × "' + ts[j].x.textContent.slice(0, 22) + '"'); }
});
// Contrast of HTML text against its real background
const rgb = s => { const m = s.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
const mix = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
const bgOf = el => { const layers = []; for (let p = el; p; p = p.parentElement) { const c = rgb(getComputedStyle(p).backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; } } let base = { r: 255, g: 255, b: 255, a: 1 }; for (let i = layers.length - 1; i >= 0; i--) base = mix(layers[i], base); return base; };
const seenC = new Set();
for (const el of all) {
  if (el.namespaceURI === "http://www.w3.org/2000/svg") continue;
  const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); if (!own) continue;
  const cs = getComputedStyle(el); let fg = rgb(cs.color); if (!fg) continue; const bg = bgOf(el); fg = mix(fg, bg);
  const L1 = lum(fg), L2 = lum(bg), ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
  const px = parseFloat(cs.fontSize), large = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700);
  const need = el.closest("button:disabled, [aria-disabled=true]") ? 0 : large ? 3 : 4.5;
  if (ratio < need) { const k = cs.color + "|" + Math.round(ratio * 10); if (!seenC.has(k)) { seenC.add(k); out.contrast.push(name(el) + " " + ratio.toFixed(2) + ":1 (" + cs.color + " on rgb(" + [bg.r, bg.g, bg.b].map(Math.round) + ") " + px + "px)"); } }
}
// Tap targets (phone)
if (W < 700) for (const el of all) { if (!el.matches("button, a[href], select, input:not([type=hidden]), [role=button], [role=tab], label.btn")) continue; const r = el.getBoundingClientRect(); if (r.height < 24 || r.width < 24) out.small.push(name(el) + " " + Math.round(r.width) + "x" + Math.round(r.height)); }
out.offRight = out.offRight.slice(0, 8); out.clipped = out.clipped.slice(0, 8); out.svgOut = out.svgOut.slice(0, 10); out.svgOverlap = out.svgOverlap.slice(0, 10); out.contrast = out.contrast.slice(0, 12); out.smallN = out.small.length; out.small = out.small.slice(0, 8);
return out;`;

const results = [];
for (const [W, H, mobile, wl] of [[1360, 900, false, "desk"], [390, 844, true, "phone"]]) {
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile });
  await send("Page.navigate", { url: PAGE }); await sleep(1600);
  const setup = await ev(`document.getElementById('btnSample').click(); await new Promise(r=>setTimeout(r,700)); document.querySelectorAll('dialog[open]').forEach(d=>d.close());
    document.querySelector('[data-vol-go=tax]').click(); await new Promise(r=>setTimeout(r,300)); document.getElementById('tx-btnSample')?.click(); await new Promise(r=>setTimeout(r,1500)); document.querySelectorAll('dialog[open]').forEach(d=>d.close());
    document.querySelector('[data-vol-go=money]').click(); await new Promise(r=>setTimeout(r,300));
    return { fa: [...document.querySelectorAll('#faTabs button')].map(b=>b.dataset.tab), tx: [...document.querySelectorAll('#txTabs button')].map(b=>b.dataset.tab) };`);
  for (const theme of ["dark", "light"]) {
    const views = [...setup.fa.map(tb => ["money", tb]), ["money", "statements:tx"], ["money", "statements:files"], ...setup.tx.map(tb => ["tax", tb])];
    for (const [vol, tab] of views) {
      const [tb, sub] = tab.split(":");
      await ev(`document.documentElement.dataset.theme='${theme}';
        document.querySelector('[data-vol-go=${vol}]').click(); await new Promise(r=>setTimeout(r,200));
        document.querySelector('${vol === "money" ? "#faTabs" : "#txTabs"} button[data-tab="${tb}"]').click(); await new Promise(r=>setTimeout(r,500));
        ${sub ? `document.querySelector('[data-stview=${sub}]').click(); await new Promise(r=>setTimeout(r,300));` : `document.querySelector('[data-stview=summary]')?.click();`}
        document.querySelectorAll('dialog[open]').forEach(d=>d.close()); scrollTo(0,0); await new Promise(r=>setTimeout(r,300)); return 1;`);
      const p = await ev(PROBE);
      const key = `${wl}-${theme}-${vol}-${tab.replace(":", "_")}`;
      results.push({ key, ...p });
      const m = await send("Page.getLayoutMetrics"); const h = Math.min(m.result.cssContentSize.height, 12000);
      const s = await send("Page.captureScreenshot", { format: "jpeg", quality: 70, captureBeyondViewport: true, clip: { x: 0, y: 0, width: W, height: h, scale: wl === "desk" ? 0.5 : 0.8 } });
      fs.writeFileSync(`${OUT}/${key}.jpg`, Buffer.from(s.result.data, "base64"));
    }
  }
}
fs.writeFileSync(`${OUT}/sweep.json`, JSON.stringify({ results, errs }, null, 1));
console.log("views", results.length, "errors", errs.length);
ws.close(); ch.kill();
