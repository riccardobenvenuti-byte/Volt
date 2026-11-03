/* Motore dei template Volt Reel: disegna il fotogramma i (30 fps, 1080x1920) a partire dalla timeline. */
"use strict";
const W = 1080, H = 1920, FPS = 30;
const P = "#502379", Y = "#FDC220", WH = "#FFFFFF", BLUE = "#82D0F4", GREEN = "#1BBE6F", RED = "#E63E12";
const INK = "#24173A", GREY = "#6E6680";
const K21 = Math.tan(21 * Math.PI / 180);
const cv = document.getElementById("c");
const ctx = cv.getContext("2d");
let TL = null, IM = {}, ROOM = null, HALL = null;

/* ---------- utilità ---------- */
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, x) => a + (b - a) * x;
const eOut = x => 1 - Math.pow(1 - x, 3);
const eInOut = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const eBack = x => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function font(sz, f) { return `${sz}px ${f || "UB"}`; }
function text(s, x, y, o = {}) {
  ctx.save();
  ctx.font = font(o.size || 40, o.f);
  ctx.fillStyle = o.c || WH;
  ctx.textAlign = o.align || "left";
  ctx.textBaseline = o.base || "alphabetic";
  ctx.letterSpacing = (o.ls || 0) + "px";
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  if (o.shadow) { ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = o.shadow; }
  ctx.fillText(s, x, y);
  ctx.restore();
}
function tw(s, size, f, ls) { ctx.save(); ctx.font = font(size, f); ctx.letterSpacing = (ls || 0) + "px"; const w = ctx.measureText(s).width; ctx.restore(); return w; }
function rr(x, y, w, h, r, fill, stroke, lw) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
}
function wrapText(s, size, f, maxw) {
  const words = s.split(" "), lines = []; let cur = "";
  for (const w of words) { const t = cur ? cur + " " + w : w; if (tw(t, size, f) > maxw && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}
function ell(x, y, rx, ry, c, rot) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); }
function poly(pts, c) { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); }
function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

/* ---------- livello Volt ---------- */
function voltBg(t, seed) {
  rect(0, 0, W, H, P);
  ctx.save();
  ctx.globalAlpha = 0.07;
  const r = rng(seed || 7);
  for (let i = 0; i < 3; i++) {
    const c = 300 + i * 700 + (r() - .5) * 200 + Math.sin(t * 0.3 + i) * 30;
    const th = 140 + r() * 220;
    poly([-10, c + 10 * K21, W + 10, c - (W + 10) * K21, W + 10, c - (W + 10) * K21 + th, -10, c + 10 * K21 + th], WH);
  }
  ctx.restore();
}
function line21(x, y, len, p, w, col) {
  if (p <= 0) return;
  ctx.save(); ctx.strokeStyle = col || Y; ctx.lineWidth = w || 14; ctx.lineCap = "butt";
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len * p, y - len * p * K21); ctx.stroke(); ctx.restore();
}
function pill(s, x, y, size, bg, fg, o = {}) {
  const pad = size * 0.62, h = size * 1.75, w = tw(s, size, o.f || "UB", o.ls || 0.5) + pad * 2;
  const xx = o.align === "center" ? x - w / 2 : (o.align === "right" ? x - w : x);
  rr(xx, y, w, h, h / 2, bg);
  text(s, xx + pad, y + h / 2 + size * 0.36, { size, f: o.f || "UB", c: fg, ls: o.ls || 0.5 });
  return w;
}
/* titolo d'aggancio: due righe a sinistra, bianca e gialla (chiusa dal punto) */
function hookTitle(lines, lt, dur, o = {}) {
  const x = 64, size = 88, lh = 92;
  let top = o.top || 300;
  const out = o.noExit ? 0 : prog(lt, dur - 0.35, dur - 0.05);
  ctx.save();
  if (out > 0) { ctx.globalAlpha = 1 - eInOut(out); ctx.translate(-120 * eInOut(out), 0); }
  if (o.kicker) {
    const p = eOut(prog(lt, 0.0, 0.3));
    ctx.save(); ctx.globalAlpha *= p; pill(o.kicker, x, top + (1 - p) * 20, 30, Y, P); ctx.restore();
    top += 84;
  }
  const widths = lines.map(l => tw(l, size, "UB"));
  if (o.box) {
    const p = eOut(prog(lt, 0.02, 0.32));
    const bw = Math.max(...widths) + 56, bh = lines.length * lh + 44;
    ctx.save(); ctx.globalAlpha *= 0.9;
    ctx.beginPath(); ctx.rect(x - 28, top - 28, bw * p, bh + 20); ctx.clip();
    rr(x - 28, top - 28, bw, bh + 16, 12, P);
    ctx.restore();
  }
  lines.forEach((l, i) => {
    const p = eOut(prog(lt, 0.08 + i * 0.12, 0.45 + i * 0.12));
    ctx.save();
    ctx.beginPath(); ctx.rect(x - 10, top + i * lh - 10, W, lh + 6); ctx.clip();
    text(l, x, top + i * lh + 76 + (1 - p) * 90, { size, f: "UB", c: i === lines.length - 1 ? Y : WH });
    ctx.restore();
  });
  ctx.restore();
}
function subtitles(sc, lt) {
  if (!sc.chunks) return;
  const ch = sc.chunks.find(c => lt >= c.t0 && lt < c.t1);
  if (!ch) return;
  const size = 56, lh = 70, base = 1380;
  const pop = eOut(prog(lt, ch.t0, ch.t0 + 0.12));
  const n = ch.lines.length;
  ctx.save();
  ctx.translate(W / 2, base - 20); ctx.scale(0.94 + 0.06 * pop, 0.94 + 0.06 * pop); ctx.translate(-W / 2, -(base - 20));
  ch.lines.forEach((line, i) => {
    const y = base - (n - 1 - i) * lh;
    const parts = line.map((w, j) => ({ s: w.w + (j < line.length - 1 ? " " : ""), kw: w.kw }));
    const total = parts.reduce((a, p) => a + tw(p.s, size, p.kw ? "UB" : "UM"), 0);
    let x = W / 2 - total / 2;
    for (const p of parts) {
      text(p.s, x, y, { size, f: p.kw ? "UB" : "UM", c: p.kw ? Y : WH, shadow: 14 });
      x += tw(p.s, size, p.kw ? "UB" : "UM");
    }
  });
  ctx.restore();
}
function logo() {
  const x = 64, y = 200, w = 210, h = Math.round(w * 663 / 1592);
  const d = ctx.getImageData(x, y, w, h).data;
  let s = 0; for (let i = 0; i < d.length; i += 16) s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  const lum = s / (d.length / 16) / 255;
  ctx.save();
  if (lum <= 0.7) { ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 12; }
  ctx.drawImage(lum > 0.7 ? IM.logoV : IM.logoW, x, y, w, h);
  ctx.restore();
}
/* card dato sul busto: viola, numero giallo, etichetta bianca, fonte */
function dataCard(card, lt, dur) {
  const x = 120, y = 860, w = 840, h = 430;
  const pin = eOut(prog(lt, 0.15, 0.5)), pout = prog(lt, dur - 0.3, dur - 0.05);
  if (pin <= 0) return;
  ctx.save();
  ctx.globalAlpha = 1 - pout;
  ctx.beginPath();
  const reach = (W + 500) * pin;
  ctx.moveTo(x - 300, y + h + 50); ctx.lineTo(x - 300 + reach, y + h + 50); ctx.lineTo(x - 300 + reach + (h + 100) * K21 * 1.2, y - 50); ctx.lineTo(x - 300, y - 50); ctx.closePath(); ctx.clip();
  ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 30;
  rr(x, y, w, h, 16, P);
  ctx.shadowBlur = 0;
  text(card.num, x + w / 2, y + 205, { size: 170, f: "UB", c: Y, align: "center" });
  card.label.forEach((l, i) => text(l, x + w / 2, y + 285 + i * 48, { size: 40, f: "UB", c: WH, align: "center", ls: 1 }));
  text(card.source, x + w / 2, y + h - 30, { size: 24, f: "UR", c: "rgba(255,255,255,.72)", align: "center" });
  ctx.restore();
}
function nameTag(name, lt, dur) {
  const p = eOut(prog(lt, 0.4, 0.75)), out = prog(lt, dur - 0.4, dur - 0.1);
  if (p <= 0 || out >= 1) return;
  ctx.save(); ctx.globalAlpha = p * (1 - out); ctx.translate(-40 * (1 - p), 0);
  const w1 = pill(name[0], 64, 1080, 40, Y, P);
  const w2 = tw(name[1], 30, "UM") + 40;
  rr(64, 1158, w2, 54, 27, "rgba(15,8,25,.7)");
  text(name[1], 84, 1195, { size: 30, f: "UM", c: WH });
  ctx.restore();
}
function credit(s) { text(s, 64, 340, { size: 26, f: "UM", c: "rgba(255,255,255,.85)", shadow: 8 }); }
function vignette(a) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${a || 0.35})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
/* fascia viola a 21° che attraversa lo schermo: copre il taglio */
function bandWipe(p) {
  if (p <= 0 || p >= 1) return;
  const T = 3200, span = H + W * K21;
  const ctop = lerp(span + 60, -T - 60, eInOut(p));
  const cb = ctop + T;
  ctx.save();
  poly([-20, ctop + 20 * K21, W + 20, ctop - (W + 20) * K21, W + 20, cb - (W + 20) * K21, -20, cb + 20 * K21], P);
  ctx.strokeStyle = Y; ctx.lineWidth = 16;
  ctx.beginPath(); ctx.moveTo(-20, ctop + 20 * K21); ctx.lineTo(W + 20, ctop - (W + 20) * K21); ctx.stroke();
  ctx.restore();
}

/* ---------- la persona (segnaposto disegnato) ---------- */
function mouthOpen(sc, lt) {
  if (!sc.env) return 0;
  const i = Math.floor(lt * FPS);
  const e = sc.env[Math.min(sc.env.length - 1, Math.max(0, i))] || 0;
  return clamp(e * (0.55 + 0.45 * Math.abs(Math.sin(lt * 17.3))) * 1.15);
}
function blink(t) {
  const per = 3.7, ph = (t + Math.sin(Math.floor(t / per) * 12.9) * 0.9) % per;
  return ph < 0.13 ? 1 - Math.sin(ph / 0.13 * Math.PI) * 0.92 : 1;
}
function prerenderRoom() {
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  const lg = g.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, "#EFE6D8"); lg.addColorStop(1, "#DCCFBE");
  g.fillStyle = lg; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(900, 260, 40, 900, 260, 760); glow.addColorStop(0, "rgba(255,226,170,.55)"); glow.addColorStop(1, "rgba(255,226,170,0)");
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  // libreria
  g.fillStyle = "#6E4B33"; g.fillRect(-20, 260, 360, 1500);
  g.fillStyle = "#4E3422"; g.fillRect(0, 280, 320, 1460);
  const r = rng(11), cols = ["#C65D3B", "#3E6E8E", "#E0B04A", "#5E8C61", "#8A5A9E", "#D9CBB5", "#2F4858", "#B44B5A", "#7B9EA8"];
  for (let s = 0; s < 6; s++) {
    const y0 = 300 + s * 240;
    g.fillStyle = "#6E4B33"; g.fillRect(0, y0 + 200, 330, 22);
    let x = 10;
    while (x < 300) { const bw = 18 + r() * 26, bh = 120 + r() * 70; g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(x, y0 + 200 - bh, bw, bh); x += bw + 3; if (r() < 0.12) x += 30; }
  }
  // quadro
  g.fillStyle = "#F7F2EA"; g.fillRect(760, 300, 230, 290); g.fillStyle = "#3F6E8C"; g.fillRect(780, 320, 190, 250);
  g.fillStyle = "#E7B654"; g.beginPath(); g.arc(880, 420, 55, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#2E5A73"; g.beginPath(); g.moveTo(780, 570); g.lineTo(860, 470); g.lineTo(970, 570); g.fill();
  // pianta
  g.fillStyle = "#B86B4B"; g.beginPath(); g.moveTo(850, 1250); g.lineTo(1010, 1250); g.lineTo(985, 1450); g.lineTo(875, 1450); g.fill();
  const lr = rng(5);
  for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? "#4F7D4A" : "#6A9A5B"; g.beginPath(); g.ellipse(930 + (lr() - .5) * 220, 1100 + lr() * 160, 40, 110, (lr() - .5) * 1.6, 0, Math.PI * 2); g.fill(); }
  const b = document.createElement("canvas"); b.width = W; b.height = H;
  const bg = b.getContext("2d"); bg.filter = "blur(7px)"; bg.drawImage(c, 0, 0);
  return b;
}
function prerenderHall() {
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  const lg = g.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, "#C9D1DA"); lg.addColorStop(1, "#AEB8C4");
  g.fillStyle = lg; g.fillRect(0, 0, W, H);
  g.fillStyle = "#1F3350"; g.fillRect(140, 330, 800, 300);
  g.fillStyle = "#FFFFFF"; g.font = "88px UB"; g.textAlign = "center"; g.fillText("MUNICIPIO XVI", 540, 470);
  g.font = "36px UM"; g.fillText("Consiglio del Municipio", 540, 545);
  for (let i = 0; i < 4; i++) { g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(40 + i * 280, 760, 160, 600); }
  const b = document.createElement("canvas"); b.width = W; b.height = H;
  const bg = b.getContext("2d"); bg.filter = "blur(6px)"; bg.drawImage(c, 0, 0);
  return b;
}
/* Giulia (presentatrice) disegnata nello spazio della "camera" 1080x1920 */
function person(t, open, o = {}) {
  const cx = 540 + Math.sin(t * 0.7) * 5, breath = Math.sin(t * 1.15) * 3;
  const hy = 640 + Math.sin(t * 1.3) * 5 + open * 6;
  const tilt = Math.sin(t * 0.5) * 0.025 + Math.sin(t * 1.9) * 0.008;
  const skin = o.skin || "#E7B38E", skinD = o.skinD || "#D59C77", hair = o.hair || "#3A2417", shirt = o.shirt || "#5B2D86";
  // capelli dietro
  if (!o.short) { ctx.fillStyle = hair; ctx.beginPath(); ctx.ellipse(cx, hy + 120, 205, 300, 0, Math.PI * 0.95, Math.PI * 2.05); ctx.fill(); rr(cx - 200, hy + 60, 400, 300, 120, hair); }
  // busto
  ctx.fillStyle = shirt;
  ctx.beginPath();
  ctx.moveTo(cx - 400, H + 10); ctx.lineTo(cx - 380, 1130 + breath); ctx.quadraticCurveTo(cx - 360, 990 + breath, cx - 200, 960 + breath);
  ctx.lineTo(cx + 200, 960 + breath); ctx.quadraticCurveTo(cx + 360, 990 + breath, cx + 380, 1130 + breath); ctx.lineTo(cx + 400, H + 10); ctx.closePath(); ctx.fill();
  if (o.blazer) {
    ctx.fillStyle = "#F4F4F2"; poly([cx - 110, 960 + breath, cx + 110, 960 + breath, cx + 60, 1260, cx - 60, 1260], "#F4F4F2");
    poly([cx - 26, 990, cx + 26, 990, cx + 36, 1230, cx, 1290, cx - 36, 1230], "#A33A3A");
    poly([cx - 200, 960 + breath, cx - 110, 960 + breath, cx - 40, 1400, cx - 300, 1400], "#25324A");
    poly([cx + 200, 960 + breath, cx + 110, 960 + breath, cx + 40, 1400, cx + 300, 1400], "#25324A");
  }
  // collo
  rr(cx - 62, hy + 120, 124, 200, 40, skinD);
  if (!o.blazer) { ctx.fillStyle = shirt; ctx.beginPath(); ctx.ellipse(cx, 962 + breath, 120, 40, 0, 0, Math.PI); ctx.fill(); }
  ctx.save();
  ctx.translate(cx, hy); ctx.rotate(tilt);
  // orecchie
  ell(-136, 10, 22, 36, skinD); ell(136, 10, 22, 36, skinD);
  // viso
  ell(0, 0, 138, 168, skin);
  ell(0, 70, 120, 90, "rgba(200,130,100,.10)");
  // guance
  ell(-78, 52, 34, 22, "rgba(225,120,110,.22)"); ell(78, 52, 34, 22, "rgba(225,120,110,.22)");
  // occhi
  const bl = blink(t + (o.seed || 0));
  const brow = open * 7;
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(s * 56, -12); ctx.scale(1, bl);
    ell(0, 0, 19, 13, "#FFFFFF"); ell(0, 1, 11, 11.5, "#3B2A20"); ell(-3, -3, 3.5, 3.5, "#FFFFFF");
    ctx.restore();
    ctx.strokeStyle = o.browC || "#3A2417"; ctx.lineWidth = 9; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(s * 30, -50 - brow); ctx.quadraticCurveTo(s * 58, -64 - brow, s * 84, -52 - brow * 0.6); ctx.stroke();
  }
  if (o.glasses) { ctx.strokeStyle = "#2B2B2B"; ctx.lineWidth = 5; ctx.strokeRect(-92, -38, 72, 52); ctx.strokeRect(20, -38, 72, 52); ctx.beginPath(); ctx.moveTo(-20, -14); ctx.lineTo(20, -14); ctx.stroke(); }
  // naso
  ctx.strokeStyle = "rgba(160,95,70,.55)"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-4, 8); ctx.quadraticCurveTo(-14, 44, 2, 50); ctx.stroke();
  // bocca
  const mw = 66 + open * 10, mh = 6 + open * 36;
  ctx.fillStyle = "#7E2E33"; ctx.beginPath(); ctx.ellipse(0, 100 + mh * 0.25, mw / 2, mh / 2 + 2, 0, 0, Math.PI * 2); ctx.fill();
  if (open > 0.25) { ctx.save(); ctx.beginPath(); ctx.ellipse(0, 100 + mh * 0.25, mw / 2, mh / 2 + 2, 0, 0, Math.PI * 2); ctx.clip(); rect(-mw / 2, 100 + mh * 0.25 - mh / 2 - 2, mw, 9, "#F3EEE8"); ctx.restore(); }
  ctx.strokeStyle = "#B4605E"; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(0, 100 + mh * 0.25, mw / 2, mh / 2 + 2, 0, 0, Math.PI * 2); ctx.stroke();
  // capelli davanti
  ctx.fillStyle = hair;
  if (o.short) {
    ctx.beginPath(); ctx.ellipse(0, -110, 150, 90, 0, Math.PI, Math.PI * 2); ctx.fill();
    rr(-150, -120, 40, 120, 20, hair); rr(110, -120, 40, 120, 20, hair);
  } else {
    ctx.beginPath(); ctx.moveTo(-150, 60); ctx.quadraticCurveTo(-170, -150, -40, -175); ctx.quadraticCurveTo(80, -200, 150, -110);
    ctx.quadraticCurveTo(170, -40, 150, 70); ctx.quadraticCurveTo(140, -40, 70, -100); ctx.quadraticCurveTo(-30, -60, -110, -120); ctx.quadraticCurveTo(-140, -40, -150, 60); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.beginPath(); ctx.ellipse(-40, -150, 70, 20, -0.3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
/* la "ripresa" della persona: stanza sfocata + persona; inquadratura con scala e traslazione */
function camera(sc, lt, frame) {
  const open = mouthOpen(sc, lt), t = sc.start + lt;
  ctx.save();
  if (frame.clip) { ctx.beginPath(); ctx.roundRect(frame.clip[0], frame.clip[1], frame.clip[2], frame.clip[3], frame.clip[4] || 0); ctx.clip(); }
  ctx.translate(frame.tx || 0, frame.ty || 0);
  if (frame.s && frame.s !== 1) { const fx = frame.fx || 540, fy = frame.fy || 700; ctx.translate(fx, fy); ctx.scale(frame.s, frame.s); ctx.translate(-fx, -fy); }
  if (!frame.cut) ctx.drawImage(ROOM, 0, 0);
  person(t, open, { seed: 0 });
  ctx.restore();
}

/* ---------- illustrazioni (segnaposto per foto e video) ---------- */
const FAC = ["#E2A65B", "#C8693F", "#E8C36A", "#E3A18B", "#EAD9B8", "#D98E5A"];
function sky(w, h, night, hz) {
  const g = ctx.createLinearGradient(0, 0, 0, hz);
  if (night) { g.addColorStop(0, "#0E1530"); g.addColorStop(1, "#2B2F5C"); } else { g.addColorStop(0, "#7FC0EA"); g.addColorStop(1, "#D8EEF8"); }
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, hz + 2);
}
function palazzo(x, yb, w, h, col, o = {}) {
  rect(x, yb - h, w, h, col);
  rect(x - 8, yb - h - 18, w + 16, 26, o.night ? "#3A3550" : "rgba(0,0,0,.12)");
  rect(x, yb - h * 0.25 - 10, w, 12, "rgba(0,0,0,.08)");
  const cols = Math.max(2, Math.floor(w / 110)), rows = Math.max(2, Math.floor((h - 160) / 150));
  const gx = w / cols;
  const r = rng(o.seed || 3);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const wx = x + gx * i + gx * 0.3, wy = yb - h + 60 + j * 150, ww = gx * 0.4, wh = 90;
    if (wy + wh > yb - 120) continue;
    const lit = o.night && r() < 0.55;
    rect(wx, wy, ww, wh, lit ? "#F6C66B" : (o.night ? "#1D2240" : "#3D4A55"));
    if (!o.night) { rect(wx - ww * 0.42, wy, ww * 0.38, wh, "#4F6B4A"); rect(wx + ww * 1.04, wy, ww * 0.38, wh, "#4F6B4A"); }
    rect(wx - 6, wy + wh, ww + 12, 8, "rgba(255,255,255,.35)");
  }
  if (o.door !== false) rr(x + w / 2 - 50, yb - 170, 100, 170, [50, 50, 0, 0], o.night ? "#151A30" : "#5A3B28");
}
function pine(x, yb, s) {
  ctx.strokeStyle = "#6B4A33"; ctx.lineWidth = 16 * s; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x, yb); ctx.quadraticCurveTo(x - 30 * s, yb - 220 * s, x + 20 * s, yb - 420 * s); ctx.stroke();
  for (const [dx, dy, rx, ry] of [[-90, -430, 150, 60], [60, -460, 170, 70], [0, -500, 140, 55], [140, -420, 110, 45]]) ell(x + dx * s, yb + dy * s, rx * s, ry * s, "#3F5E3A");
}
function tree(x, yb, s, c) {
  rect(x - 9 * s, yb - 150 * s, 18 * s, 150 * s, "#6B4A33");
  for (const [dx, dy, r] of [[0, -230, 95], [-70, -180, 75], [70, -180, 75], [0, -150, 80]]) ell(x + dx * s, yb + dy * s, r * s, r * s, c || "#5E8C4F");
}
function figure(x, yb, s, o = {}) {
  const ph = o.walk === undefined ? 0 : o.walk, sw = Math.sin(ph) * 0.35;
  const skin = o.skin || "#E2AE8A", top = o.top || "#3E6E8E", legs = o.legs || "#2F3442";
  ctx.save(); ctx.translate(x, yb); ctx.scale(s, s);
  ctx.lineCap = "round"; ctx.strokeStyle = legs; ctx.lineWidth = 22;
  ctx.beginPath(); ctx.moveTo(-10, -100); ctx.lineTo(-10 + Math.sin(sw) * 60, 0); ctx.moveTo(10, -100); ctx.lineTo(10 - Math.sin(sw) * 60, 0); ctx.stroke();
  rr(-34, -230, 68, 140, 26, top);
  ctx.strokeStyle = top; ctx.lineWidth = 18;
  if (o.box) {
    ctx.beginPath(); ctx.moveTo(-28, -210); ctx.lineTo(-30, -150); ctx.moveTo(28, -210); ctx.lineTo(30, -150); ctx.stroke();
    rr(-46, -200, 92, 66, 4, "#C9955B"); rect(-46, -175, 92, 6, "#A97842");
  } else if (o.sign) {
    ctx.beginPath(); ctx.moveTo(-28, -210); ctx.lineTo(-50, -280); ctx.moveTo(28, -210); ctx.lineTo(50, -280); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-30, -215); ctx.lineTo(-38 - sw * 40, -120); ctx.moveTo(30, -215); ctx.lineTo(38 + sw * 40, -120); ctx.stroke();
  }
  rect(-10, -250, 20, 24, skin);
  ell(0, -282, 34, 38, skin);
  ctx.fillStyle = o.hair || "#3A2A20"; ctx.beginPath(); ctx.ellipse(0, -296, 36, 28, 0, Math.PI, Math.PI * 2); ctx.fill();
  if (o.long) rr(-36, -300, 72, 70, 20, o.hair || "#3A2A20");
  if (o.bag) rr(26, -210, 22, 80, 8, o.bag);
  if (o.smile) { ctx.strokeStyle = "#7E2E33"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -276, 12, 0.2, Math.PI - 0.2); ctx.stroke(); ell(-12, -292, 3.5, 3.5, "#2A1E18"); ell(12, -292, 3.5, 3.5, "#2A1E18"); }
  ctx.restore();
}
function bus(x, yb, s, night) {
  ctx.save(); ctx.translate(x, yb); ctx.scale(s, s);
  rr(0, -300, 760, 270, 30, "#2C8C8A");
  rect(0, -120, 760, 18, "#F2F2EE");
  for (let i = 0; i < 6; i++) rr(30 + i * 118, -270, 100, 110, 10, night ? "#F5D58B" : "#BFDDE6");
  rr(690, -270, 60, 160, 10, night ? "#F5D58B" : "#BFDDE6");
  rr(560, -290, 190, 34, 6, "#1A1A1A"); text("999", 655, -263, { size: 28, f: "UB", c: "#FFB13B", align: "center" });
  for (const wx of [140, 600]) { ell(wx, -30, 50, 50, "#222"); ell(wx, -30, 22, 22, "#777"); }
  if (night) { const g = ctx.createRadialGradient(770, -70, 5, 770, -70, 220); g.addColorStop(0, "rgba(255,240,190,.9)"); g.addColorStop(1, "rgba(255,240,190,0)"); ctx.fillStyle = g; ctx.fillRect(700, -260, 300, 380); }
  ctx.restore();
}
function streetlamp(x, yb, h, night) {
  rect(x - 6, yb - h, 12, h, "#3A3A44");
  rr(x - 40, yb - h - 20, 80, 26, 10, "#3A3A44");
  if (night) { const g = ctx.createRadialGradient(x, yb - h, 10, x, yb - h + 200, 420); g.addColorStop(0, "rgba(255,214,140,.55)"); g.addColorStop(1, "rgba(255,214,140,0)"); ctx.fillStyle = g; ctx.fillRect(x - 420, yb - h - 40, 840, 900); }
}
function busStop(x, yb, night) {
  rect(x - 5, yb - 330, 10, 330, "#56565E");
  rr(x - 50, yb - 380, 100, 70, 10, "#E8E3D8"); text("999", x, yb - 332, { size: 40, f: "UB", c: "#2C8C8A", align: "center" });
  rr(x + 40, yb - 260, 240, 240, 8, night ? "rgba(160,190,220,.25)" : "rgba(180,210,230,.45)", "#56565E", 4);
}
function ground(w, h, hz, night) {
  rect(0, hz, w, h - hz, night ? "#2A2C36" : "#8C8F96");
  rect(0, hz, w, (h - hz) * 0.22, night ? "#3A3B45" : "#C9C2B6");
}

/* scene illustrate: (t, w, h) disegnano in coordinate locali */
const SCENES = {
  piazza(t, w, h) {
    const hz = h * 0.6;
    sky(w, h, false, hz);
    palazzo(-40, hz, 380, h * 0.42, FAC[0], { seed: 1 }); palazzo(330, hz, 300, h * 0.36, FAC[3], { seed: 2 }); palazzo(620, hz, 520, h * 0.46, FAC[2], { seed: 3 });
    pine(140, hz + 10, h / 1200); pine(900, hz + 30, h / 1100);
    rect(0, hz, w, h - hz, "#D9CDB6");
    for (let i = 0; i < 8; i++) { ctx.strokeStyle = "rgba(0,0,0,.06)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w / 2, hz); ctx.lineTo(-w + i * w * 0.42, h); ctx.stroke(); }
    ell(w / 2, hz + (h - hz) * 0.35, w * 0.16, (h - hz) * 0.06, "#B9C9D6"); rect(w / 2 - 12, hz + (h - hz) * 0.18, 24, (h - hz) * 0.17, "#CFC6B5");
    const r = rng(21), cols = ["#3E6E8E", "#C65D3B", "#E0B04A", "#5E8C61", "#8A5A9E", "#2F4858"];
    for (let i = 0; i < 9; i++) {
      const px = (r() * w * 1.2 - w * 0.1 + t * (r() - .5) * 60) % (w + 100), py = hz + (h - hz) * (0.3 + r() * 0.6);
      const sc = (py - hz) / (h - hz) * h / 1500 + 0.15;
      figure(px, py, sc, { top: cols[i % 6], walk: t * 6 + i, long: i % 3 === 0, hair: i % 2 ? "#3A2A20" : "#7A5236" });
    }
  },
  bench(t, w, h) {
    const hz = h * 0.48;
    sky(w, h, false, hz);
    tree(w * 0.2, hz + 40, h / 900, "#5E8C4F"); tree(w * 0.75, hz + 30, h / 800, "#6A9A5B"); tree(w * 0.45, hz + 10, h / 1300, "#4F7D4A");
    rect(0, hz, w, h - hz, "#8DB86E");
    rect(0, hz + (h - hz) * 0.55, w, (h - hz) * 0.18, "#D6C7A8");
    const bx = w * 0.18 + t * 6, by = hz + (h - hz) * 0.52, bw = w * 0.64;
    rect(bx + 30, by - 20, 18, 120, "#2F3036"); rect(bx + bw - 48, by - 20, 18, 120, "#2F3036");
    for (let i = 0; i < 3; i++) rr(bx, by - 130 + i * 38, bw, 26, 6, "#B07A45");
    rr(bx - 10, by - 10, bw + 20, 30, 6, "#9C6A3A");
    rr(bx + bw * 0.62, by - 230, 120, 40, 8, Y); text("NUOVA", bx + bw * 0.62 + 60, by - 200, { size: 26, f: "UB", c: P, align: "center" });
  },
  flowers(t, w, h) {
    const hz = h * 0.45;
    sky(w, h, false, hz);
    palazzo(-20, hz + 20, w * 0.55, h * 0.4, FAC[4], { seed: 4 }); palazzo(w * 0.5, hz + 20, w * 0.6, h * 0.36, FAC[1], { seed: 5 });
    rect(0, hz + 20, w, h, "#CFC3AE");
    const fx = w * 0.08, fy = hz + (h - hz) * 0.4, fw = w * 0.84, fh = (h - hz) * 0.32;
    rr(fx, fy, fw, fh, 24, "#9B5B3D"); rr(fx + 14, fy + 14, fw - 28, fh - 28, 18, "#6B4A33");
    const r = rng(9), fc = ["#E35D6A", "#F4C542", "#F28C38", "#C86DD7", "#FFFFFF"];
    for (let i = 0; i < 70; i++) {
      const x = fx + 30 + r() * (fw - 60), y = fy + 30 + r() * (fh - 60), sw = Math.sin(t * 2 + i) * 3;
      ctx.strokeStyle = "#4F7D4A"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y + 30); ctx.lineTo(x + sw, y); ctx.stroke();
      ell(x + sw, y, 14, 14, fc[i % 5]); ell(x + sw, y, 5, 5, "#7A4A20");
    }
  },
  school(t, w, h) {
    const hz = h * 0.5;
    sky(w, h, false, hz);
    palazzo(w * 0.05, hz, w * 0.9, h * 0.38, "#E6D3A3", { seed: 6, door: false });
    rr(w * 0.3, hz - h * 0.38 + 40, w * 0.4, 70, 8, "#2F4858"); text("SCUOLA", w * 0.5, hz - h * 0.38 + 92, { size: 48, f: "UB", c: WH, align: "center", ls: 4 });
    rect(0, hz, w, h - hz, "#5B5F66"); rect(0, hz, w, (h - hz) * 0.18, "#C9C2B6");
    const cy = hz + (h - hz) * 0.42;
    for (let i = 0; i < 9; i++) rect(w * 0.08 + i * w * 0.1, cy, w * 0.06, (h - hz) * 0.3, "#F2F2EE");
    const r = rng(31);
    for (let i = 0; i < 5; i++) figure(((w * 0.1 + i * w * 0.18 + t * 70) % (w + 120)) - 60, cy + (h - hz) * 0.25, h / 1900 * (i % 2 ? 0.75 : 1), { top: ["#E35D6A", "#3E6E8E", "#F4C542", "#5E8C61", "#8A5A9E"][i], walk: t * 7 + i, bag: i % 2 ? "#2F4858" : "#C65D3B", long: i === 2 });
    rr(w * 0.82, hz - 200, 10, 220, 0, "#56565E"); poly([w * 0.82 - 50, hz - 260, w * 0.82 + 60, hz - 260, w * 0.82 + 5, hz - 170], "#FFFFFF");
  },
  library(t, w, h, o = {}) {
    rect(0, 0, w, h, "#E3B072");
    rect(0, h * 0.08, w, 14, "rgba(0,0,0,.08)");
    const r0 = rng(8);
    for (const wx of [w * 0.06, w * 0.18, w * 0.74, w * 0.86]) for (const wy of [h * 0.14, h * 0.5]) {
      rect(wx, wy, w * 0.07, h * 0.22, "#3D4A55"); rect(wx - w * 0.03, wy, w * 0.026, h * 0.22, "#4F6B4A"); rect(wx + w * 0.074, wy, w * 0.026, h * 0.22, "#4F6B4A");
    }
    rr(w * 0.3, h * 0.47, w * 0.4, h * 0.1, 8, "#2F4858");
    text("BIBLIOTECA", w / 2, h * 0.47 + h * 0.075, { size: h * 0.06, f: "UB", c: WH, align: "center", ls: 3 });
    const dx = w * 0.37, dw = w * 0.26, dy = h * 0.6, dh = h * 0.36;
    rr(dx, dy, dw, dh, [dw / 2, dw / 2, 0, 0], "#2B2235");
    const r = rng(12);
    for (let s2 = 0; s2 < 3; s2++) { let x = dx + 20; while (x < dx + dw - 30) { const bw = 8 + r() * 10; rect(x, dy + dh * 0.38 + s2 * dh * 0.22, bw, -dh * 0.14 * (0.6 + r() * 0.4), ["#C65D3B", "#3E6E8E", "#E0B04A", "#5E8C61"][Math.floor(r() * 4)]); x += bw + 3; } }
    const sh = o.shutter || 0;
    if (sh > 0) {
      ctx.save(); ctx.beginPath(); ctx.roundRect(dx, dy, dw, dh, [dw / 2, dw / 2, 0, 0]); ctx.clip();
      rect(dx, dy, dw, dh * sh, "#9AA0A8");
      for (let y = dy; y < dy + dh * sh; y += 12) rect(dx, y, dw, 4, "#7D838B");
      ctx.restore();
    }
    rect(0, h * 0.96, w, h * 0.04, "#C9C2B6");
  },
  closed(t, w, h) {
    rect(0, 0, w, h, "#9AA0A8");
    for (let y = 0; y < h; y += 22) rect(0, y, w, 6, "#7D838B");
    ctx.save(); ctx.translate(w * 0.42 + Math.sin(t) * 4, h * 0.68); ctx.rotate(-0.04);
    rr(-w * 0.2, -h * 0.28, w * 0.4, h * 0.52, 4, "#FAFAF6");
    rect(-w * 0.06, -h * 0.31, w * 0.12, h * 0.06, "rgba(240,230,200,.85)");
    text("CHIUSA", 0, -h * 0.07, { size: h * 0.13, f: "UB", c: "#1E1E1E", align: "center" });
    text("fino a nuovo avviso", 0, h * 0.04, { size: h * 0.05, f: "UM", c: "#333", align: "center" });
    text("La direzione", 0, h * 0.16, { size: h * 0.04, f: "UR", c: "#555", align: "center" });
    ctx.restore();
  },
  volunteers(t, w, h) {
    const hz = h * 0.66;
    sky(w, h, false, h * 0.12);
    palazzo(-30, hz, w + 60, h * 0.75, "#E3B072", { seed: 8, door: false });
    const dx = w * 0.56, dw = w * 0.3, dh = h * 0.36;
    rr(dx, hz - dh, dw, dh, [dw / 2, dw / 2, 0, 0], "#2B2235");
    rr(dx - 20, hz - dh - 90, dw + 40, 70, 8, "#2F4858"); text("BIBLIOTECA", dx + dw / 2, hz - dh - 40, { size: 40, f: "UB", c: WH, align: "center", ls: 2 });
    rect(0, hz, w, h - hz, "#C9C2B6");
    const people = [["#E35D6A", 0], ["#3E6E8E", 1.3], ["#F4C542", 2.6], ["#5E8C61", 3.9], ["#8A5A9E", 5.2]];
    for (const [c, off] of people) {
      const x = ((t * 120 + off * 190) % (w + 300)) - 150;
      figure(x, hz + (h - hz) * 0.75, h / 1250, { top: c, walk: t * 7 + off, box: true, long: off > 2 && off < 3 });
    }
    figure(w * 0.32, hz + (h - hz) * 0.82, h / 1150, { top: "#2F4858", hair: "#C9C9C9", long: true, walk: 0, smile: true });
  },
  group(t, w, h) {
    const hz = h * 0.62;
    sky(w, h, false, h * 0.1);
    palazzo(-30, hz, w + 60, h * 0.7, "#E3B072", { seed: 8, door: false });
    rr(w * 0.25, hz - h * 0.56, w * 0.5, 90, 8, "#2F4858"); text("BIBLIOTECA", w / 2, hz - h * 0.56 + 64, { size: 52, f: "UB", c: WH, align: "center", ls: 3 });
    rect(0, hz, w, h - hz, "#C9C2B6");
    const cols = ["#E35D6A", "#3E6E8E", "#F4C542", "#5E8C61", "#8A5A9E", "#2F4858", "#C65D3B", "#7B9EA8", "#B44B5A"];
    for (let row = 0; row < 2; row++) for (let i = 0; i < 5; i++) {
      const x = w * (0.12 + i * 0.19 + row * 0.09), y = hz + (h - hz) * (0.42 + row * 0.38);
      if (row === 0 && i === 4) continue;
      figure(x, y, h / (row ? 1250 : 1500), { top: cols[(i + row * 5) % 9], smile: true, long: (i + row) % 2 === 0, hair: ["#3A2A20", "#7A5236", "#C9C9C9", "#2A1E18"][(i + row) % 4] });
    }
    ctx.save(); ctx.translate(w * 0.5, hz - h * 0.11); ctx.rotate(-0.05);
    rr(-150, -60, 300, 100, 8, "#FFFFFF"); text("RIAPERTA!", 0, 12, { size: 52, f: "UB", c: P, align: "center" }); ctx.restore();
  },
  nightbus(t, w, h) {
    const hz = h * 0.62;
    sky(w, h, true, hz);
    palazzo(-60, hz, 460, h * 0.5, "#6A5A70", { seed: 13, night: true }); palazzo(380, hz, 380, h * 0.42, "#5C5068", { seed: 14, night: true }); palazzo(740, hz, 420, h * 0.55, "#6E5E74", { seed: 15, night: true });
    ground(w, h, hz, true);
    streetlamp(w * 0.12, hz + 40, h * 0.42, true);
    busStop(w * 0.7, hz + (h - hz) * 0.25, true);
    figure(w * 0.83, hz + (h - hz) * 0.25, h / 1700, { top: "#C65D3B", bag: "#2F4858", long: true });
    const bx = t < 1.6 ? -60 : -60 + Math.pow(t - 1.6, 2) * 160;
    bus(bx, hz + (h - hz) * 0.62, h / 1500, true);
  },
  nightstreet(t, w, h) {
    const hz = h * 0.55;
    sky(w, h, true, hz);
    for (let i = 0; i < 40; i++) { const r = rng(i + 40); ell(r() * w, r() * hz * 0.6, 2, 2, "rgba(255,255,255,.7)"); }
    palazzo(-60, hz, 420, h * 0.42, "#5F5370", { seed: 16, night: true }); palazzo(340, hz, 360, h * 0.48, "#6A5A70", { seed: 17, night: true }); palazzo(680, hz, 460, h * 0.4, "#56496A", { seed: 18, night: true });
    ground(w, h, hz, true);
    streetlamp(w * 0.85, hz + 30, h * 0.36, true); streetlamp(w * 0.15, hz + 30, h * 0.36, true);
    const bx = ((t * 260) % (w + 1400)) - 1300;
    bus(bx, hz + (h - hz) * 0.5, h / 1700, true);
    busStop(w * 0.62, hz + (h - hz) * 0.18, true);
  },
  students(t, w, h) {
    const hz = h * 0.6;
    sky(w, h, true, hz);
    palazzo(-40, hz, w + 80, h * 0.5, "#5C5068", { seed: 19, night: true });
    ground(w, h, hz, true);
    streetlamp(w * 0.2, hz + 30, h * 0.42, true);
    busStop(w * 0.5, hz + (h - hz) * 0.3, true);
    const pp = [[0.32, "#E0B04A", "#2F4858"], [0.62, "#3E6E8E", "#C65D3B"], [0.78, "#8A5A9E", "#5E8C61"]];
    pp.forEach(([x, c, b], i) => figure(w * x + Math.sin(t + i) * 4, hz + (h - hz) * 0.42, h / 1300, { top: c, bag: b, long: i === 1, smile: false }));
    const g = ctx.createRadialGradient(w * 0.62 + 30, hz + (h - hz) * 0.42 - 260 * h / 1300, 2, w * 0.62 + 30, hz + (h - hz) * 0.42 - 260 * h / 1300, 90); g.addColorStop(0, "rgba(160,210,255,.8)"); g.addColorStop(1, "rgba(160,210,255,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  },
  nurse(t, w, h) {
    const hz = h * 0.58;
    sky(w, h, true, hz);
    palazzo(-40, hz, w * 0.7, h * 0.52, "#E9E4DA", { seed: 20, night: true });
    rr(w * 0.08, hz - h * 0.5 + 30, w * 0.5, 80, 8, "#C9302C"); text("PRONTO SOCCORSO", w * 0.33, hz - h * 0.5 + 84, { size: 40, f: "UB", c: WH, align: "center" });
    palazzo(w * 0.66, hz, w * 0.5, h * 0.4, "#5C5068", { seed: 22, night: true });
    ground(w, h, hz, true);
    streetlamp(w * 0.75, hz + 30, h * 0.4, true);
    figure(w * 0.2 + t * 90, hz + (h - hz) * 0.5, h / 1150, { top: "#7FB8B0", legs: "#7FB8B0", walk: t * 6, long: true, hair: "#2A1E18", bag: "#2F4858" });
  },
  shop(t, w, h) {
    const hz = h * 0.7;
    sky(w, h, true, h * 0.2);
    palazzo(-40, hz, w + 80, h * 0.78, "#7A6A62", { seed: 23, night: true, door: false });
    const sx = w * 0.12, sw = w * 0.76, sh = h * 0.36;
    rr(sx - 10, hz - sh - 90, sw + 20, 80, 6, "#2F4858"); text("ALIMENTARI", w / 2, hz - sh - 32, { size: 46, f: "UB", c: "#F6C66B", align: "center", ls: 3 });
    rect(sx, hz - sh, sw, sh, "#F3DDA0");
    const down = clamp(t / 2.2) * 0.85;
    rect(sx, hz - sh, sw, sh * down, "#9AA0A8"); for (let y = hz - sh; y < hz - sh + sh * down; y += 14) rect(sx, y, sw, 4, "#7D838B");
    rect(0, hz, w, h - hz, "#3A3B45");
    figure(w * 0.72, hz + (h - hz) * 0.5, h / 1150, { top: "#5E8C61", sign: true, hair: "#C9C9C9" });
  },
};
/* "foto" e "video": scena illustrata a tutto schermo con movimento di macchina */
function footage(name, t, rectA, kb, o) {
  const [x, y, w, h] = rectA;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.translate(x, y);
  const k = kb || [1.0, 1.08, 0, 0], p = o && o.p !== undefined ? o.p : 0;
  const s = lerp(k[0], k[1], p), dx = lerp(0, k[2], p), dy = lerp(0, k[3], p);
  ctx.translate(w / 2 + dx, h / 2 + dy); ctx.scale(s, s); ctx.translate(-w / 2, -h / 2);
  SCENES[name](t, w, h, o || {});
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const g = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(20,10,30,.28)"); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.restore();
}
