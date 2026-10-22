import { spawn } from "child_process"; import fs from "fs";
const W = +(process.argv[2] || 1300), OUTN = process.argv[3] || "st", EXTRA = process.argv[4] || "";
const PORT = 9350 + Math.floor(Math.random() * 40), ch = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${process.env.S}/r${Date.now()}`, "about:blank"]);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let t; for (let i = 0; i < 40 && !t; i++) { await sleep(250); try { t = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find(x => x.type === "page"); } catch {} }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = {}, errs = []; ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) pend[d.id](d); if (d.method === "Runtime.exceptionThrown") errs.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); if (d.method === "Log.entryAdded" && d.params.entry.level === "error") errs.push(d.params.entry.text); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => { const r = (await send("Runtime.evaluate", { expression: `(async()=>{${e}})()`, awaitPromise: true, returnByValue: true })).result; return r.exceptionDetails ? "EXC " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text) : r.result?.value; };
await send("Runtime.enable"); await send("Log.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: 900, deviceScaleFactor: 1, mobile: W < 700 });
await send("Page.navigate", { url: `${process.env.PAGE || 'file:///C:/Claude%20Projects/Financial%20Advisor/My%20finances.html'}` }); await sleep(1500);
const info = await ev(`document.getElementById('btnSample').click(); await new Promise(r=>setTimeout(r,600));
 document.querySelectorAll('dialog[open]').forEach(d=>d.close());
 document.querySelector('#faTabs button[data-tab=statements]').click(); await new Promise(r=>setTimeout(r,800));
 ${EXTRA}
 return {h: document.documentElement.scrollHeight, tx: document.querySelectorAll('#txTable tr[data-tid]').length, months: document.querySelectorAll('#stMonth option').length, t: document.title};`);
console.log(JSON.stringify(info), JSON.stringify(errs));
const full = process.argv[5] !== "view";
const m = await send("Page.getLayoutMetrics");
const h = full ? Math.min(m.result.cssContentSize.height, 9000) : 900;
const s = await send("Page.captureScreenshot", full ? { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: W, height: h, scale: 0.5 } } : { format: "png" });
fs.writeFileSync(`${process.env.S}/${OUTN}.png`, Buffer.from(s.result.data, "base64"));
ws.close(); ch.kill();
