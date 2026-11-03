/* Seconda parte: grafiche Volt, layout delle scene, fotogramma. */
"use strict";
const fmtIt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
/* etichetta IA: obbligatoria, dal campo «etichetta» del reel, visibile dal primo all'ultimo fotogramma */
function aiLabel() {
  const s = String(TL.etichetta || "").toUpperCase();
  if (!s) return;
  const w = tw(s, 22, "UB", 0.6) + 32;
  rr(1016 - w, 202, w, 44, 22, "rgba(15,8,25,.55)");
  text(s, 1016 - w + 16, 232, { size: 22, f: "UB", c: WH, ls: 0.6 });
}
function chapter(c, lt) {
  const p = eOut(prog(lt, 0.05, 0.35));
  ctx.save(); ctx.globalAlpha = p;
  const w1 = pill(c[0], 64, 300, 30, Y, P);
  text(c[1], 64 + w1 + 18, 300 + 39, { size: 40, f: "UB", c: WH, ls: 1 });
  ctx.restore();
}
function icon(kind, x, y, r) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = P; ctx.fillStyle = P; ctx.lineWidth = r * 0.12; ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (kind === "bulb") {
    ctx.beginPath(); ctx.arc(0, -r * 0.12, r * 0.38, Math.PI * 0.8, Math.PI * 2.2); ctx.lineTo(r * 0.16, r * 0.38); ctx.lineTo(-r * 0.16, r * 0.38); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 0.15, r * 0.52); ctx.lineTo(r * 0.15, r * 0.52); ctx.stroke();
  } else if (kind === "check") {
    ctx.beginPath(); ctx.moveTo(-r * 0.36, 0); ctx.lineTo(-r * 0.08, r * 0.28); ctx.lineTo(r * 0.4, -r * 0.3); ctx.stroke();
  } else if (kind === "ballot") {
    ctx.strokeRect(-r * 0.42, -r * 0.05, r * 0.84, r * 0.48);
    ctx.beginPath(); ctx.moveTo(-r * 0.18, -r * 0.05); ctx.lineTo(-r * 0.18, -r * 0.45); ctx.lineTo(r * 0.22, -r * 0.45); ctx.lineTo(r * 0.22, -r * 0.05); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 0.22, r * 0.2); ctx.lineTo(r * 0.22, r * 0.2); ctx.stroke();
  } else if (kind === "pin") {
    ctx.beginPath(); ctx.arc(0, -r * 0.1, r * 0.3, Math.PI, 0); ctx.lineTo(0, r * 0.45); ctx.closePath(); ctx.fill();
  } else if (kind === "comment") {
    ctx.beginPath(); ctx.roundRect(-r * 0.45, -r * 0.35, r * 0.9, r * 0.6, r * 0.15); ctx.moveTo(-r * 0.15, r * 0.25); ctx.lineTo(-r * 0.3, r * 0.48); ctx.lineTo(r * 0.05, r * 0.25); ctx.fill();
  }
  ctx.restore();
}
function stepCard(c, x, y, w, h, p) {
  ctx.save();
  ctx.globalAlpha = p; ctx.translate((1 - p) * 220, 0);
  ctx.shadowColor = "rgba(0,0,0,.25)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
  rr(x, y, w, h, 22, WH); ctx.shadowColor = "transparent";
  ell(x + 120, y + h / 2, 72, 72, Y); icon(c.icon, x + 120, y + h / 2, 80);
  text(c.t, x + 232, y + 108, { size: 64, f: "UB", c: P });
  wrapText(c.b, 34, "UM", w - 280).forEach((l, i) => text(l, x + 232, y + 162 + i * 42, { size: 34, f: "UM", c: INK }));
  pill(c.n, x + w - 30, y + 26, 26, Y, P, { align: "right" });
  ctx.restore();
}
function endcard(lt, dur) {
  voltBg(lt + 100, 3);
  const cols = [BLUE, GREEN, Y, RED];
  cols.forEach((c, i) => {
    const p = eOut(prog(lt, 0.1 + i * 0.08, 0.7 + i * 0.08));
    const c0 = 1640 + i * 64, th = 44, x1 = -20 + (W + 40) * p;
    poly([-20, c0 + 20 * K21, x1, c0 - x1 * K21, x1, c0 - x1 * K21 + th, -20, c0 + 20 * K21 + th], c);
  });
  const lp = eOut(prog(lt, 0.0, 0.45));
  ctx.save(); ctx.globalAlpha = lp; const s = 0.92 + 0.08 * lp; ctx.translate(540, 640); ctx.scale(s, s);
  ctx.drawImage(IM.starsW, -260, -258, 520, 517); ctx.restore();
  const tp = eOut(prog(lt, 0.25, 0.65));
  ctx.save(); ctx.globalAlpha = tp; ctx.translate(0, (1 - tp) * 40);
  text("VIENI A", 540, 1060, { size: 96, f: "UB", c: Y, align: "center" });
  text("CONOSCERCI", 540, 1160, { size: 96, f: "UB", c: Y, align: "center" });
  text("@voltroma", 540, 1250, { size: 46, f: "UM", c: WH, align: "center" });
  ctx.restore();
}
function proofCard(sc, lt, dur) {
  voltBg(sc.start + lt, 5);
  const x = 90, w = 900;
  const p = eOut(prog(lt, 0.0, 0.4));
  const head = wrapText(sc.head, 60, "UB", w - 80);
  const paras = sc.body.map(b => wrapText(b, 42, "UR", w - 80));
  let h = 150 + head.length * 70 + 30 + paras.reduce((a, l) => a + l.length * 56 + 28, 0) + 20;
  const y = Math.round(900 - h / 2);
  ctx.save();
  ctx.globalAlpha = p; ctx.translate(540, y + h / 2 + (1 - p) * 90); ctx.rotate((1 - p) * -0.03); ctx.translate(-540, -(y + h / 2));
  ctx.shadowColor = "rgba(0,0,0,.3)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
  rr(x, y, w, h, 16, WH); ctx.shadowColor = "transparent";
  pill(sc.pill, x + 40, y + 40, 26, Y, P);
  let yy = y + 170;
  head.forEach((l, i) => text(l, x + 40, yy + i * 70, { size: 60, f: "UB", c: INK }));
  yy += head.length * 70 + 22;
  paras.forEach((lines, pi) => {
    lines.forEach((l, li) => {
      const ly = yy + li * 56;
      if (pi === sc.hl) {
        const n = lines.length, a = 0.3 + 0.4 * li / n, b = 0.3 + 0.4 * (li + 1) / n;
        const q = eInOut(prog(lt / dur, a, b));
        const lw = tw(l, 42, "UM");
        rect(x + 34, ly - 42, (lw + 12) * q, 56, "rgba(253,194,32,.85)");
      }
      text(l, x + 40, ly, { size: 42, f: pi === sc.hl ? "UM" : "UR", c: pi === sc.hl ? INK : "#4A4060" });
    });
    yy += lines.length * 56 + 28;
  });
  ctx.restore();
}
function mapScene(sc, lt, dur) {
  voltBg(sc.start + lt, 9);
  ctx.save(); ctx.globalAlpha = eOut(prog(lt, 0, 0.3)); pill("LA MAPPA DEI PROGETTI", 64, 300, 30, Y, P); ctx.restore();
  const shape = [130, 520, 420, 430, 700, 470, 960, 600, 990, 900, 860, 1180, 560, 1250, 280, 1190, 110, 930];
  ctx.save();
  ctx.beginPath(); ctx.moveTo(shape[0], shape[1]); for (let i = 2; i < shape.length; i += 2) ctx.lineTo(shape[i], shape[i + 1]); ctx.closePath();
  ctx.fillStyle = "rgba(255,255,255,.09)"; ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 5; ctx.setLineDash([18, 12]); ctx.stroke(); ctx.setLineDash([]);
  ctx.clip();
  ctx.strokeStyle = BLUE; ctx.lineWidth = 34; ctx.beginPath(); ctx.moveTo(60, 1100); ctx.bezierCurveTo(400, 950, 600, 1150, 1020, 820); ctx.stroke();
  const rp = prog(lt, 0.05, 0.45);
  ctx.strokeStyle = Y; ctx.lineWidth = 12;
  [[100, 800, 1000, 800 - 900 * K21], [200, 1200, 900, 470], [480, 420, 560, 1260]].forEach(([x1, y1, x2, y2], i) => {
    const q = eInOut(clamp(rp * 1.6 - i * 0.25));
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(lerp(x1, x2, q), lerp(y1, y2, q)); ctx.stroke();
  });
  ctx.restore();
  const pins = [[330, 760, "Panchine in via dei Gelsi"], [690, 640, null], [520, 980, "Attraversamento davanti alla scuola"], [800, 900, null], [300, 1080, null]];
  pins.forEach(([x, y, lab], i) => {
    const a = 0.25 + i * 0.1, q = prog(lt / dur, a, a + 0.08);
    if (q <= 0) return;
    const s = eBack(q);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ell(0, 0, 30, 30, WH); ell(0, 0, 17, 17, Y); ctx.restore();
    if (lab) {
      const lp = eOut(prog(lt / dur, a + 0.05, a + 0.15));
      ctx.save(); ctx.globalAlpha = lp;
      const lw = tw(lab, 30, "UM") + 36, lx = Math.min(x + 44, 1016 - lw);
      rr(lx, y - 26, lw, 52, 26, "rgba(15,8,25,.6)"); text(lab, lx + 18, y + 10, { size: 30, f: "UM", c: WH });
      ctx.restore();
    }
  });
}
function bigNum(sc, lt, dur) {
  voltBg(sc.start + lt, 4);
  const q = eOut(prog(lt, 0.1, 1.1));
  const n = Math.round(sc.num * q);
  text(n + sc.suffix, 540, 960, { size: 360, f: "UB", c: Y, align: "center" });
  const lp = eOut(prog(lt, 0.5, 0.9));
  ctx.save(); ctx.globalAlpha = lp;
  sc.label.forEach((l, i) => text(l, 540, 1080 + i * 66, { size: 56, f: "UB", c: WH, align: "center", ls: 1 }));
  text(sc.source, 540, 1250, { size: 28, f: "UR", c: "rgba(255,255,255,.72)", align: "center" });
  ctx.restore();
  line21(64, 1460, 560, eInOut(prog(lt, 0.2, 0.9)), 14);
  line21(560, 470, 440, eInOut(prog(lt, 0.4, 1.1)), 14);
}
function pillsScene(sc, lt, dur) {
  voltBg(sc.start + lt, 6);
  hookTitle(sc.title, lt - dur * 0.55, 99, { noExit: true });
  sc.pills.forEach((s, i) => {
    const a = 0.02 + i * 0.16, q = prog(lt / dur, a, a + 0.12);
    if (q <= 0) return;
    const sc2 = eBack(q);
    ctx.save(); ctx.translate(540, 760 + i * 170); ctx.scale(sc2, sc2);
    pill(s, 0, -64, 70, Y, P, { align: "center" });
    ctx.restore();
  });
}
function previewScene(sc, lt, dur, recap) {
  voltBg(sc.start + lt, recap ? 12 : 8);
  hookTitle(recap ? sc.title : ["IN TRE", "PUNTI."], lt, 99, { noExit: true, kicker: TL.topic });
  sc.items.forEach((s, i) => {
    const a = recap ? 0.05 + i * 0.12 : 0.36 + i * 0.17, q = eOut(prog(lt / dur, a, a + 0.12));
    if (q <= 0) return;
    const y = 700 + i * 220;
    ctx.save(); ctx.globalAlpha = q; ctx.translate((1 - q) * 200, 0);
    ctx.shadowColor = "rgba(0,0,0,.25)"; ctx.shadowBlur = 24; rr(64, y, 952, 180, 22, WH); ctx.shadowColor = "transparent";
    ell(160, y + 90, 58, 58, Y);
    if (recap) icon("check", 160, y + 90, 80); else text(String(i + 1), 160, y + 116, { size: 76, f: "UB", c: P, align: "center" });
    text(s, 260, y + 116, { size: 72, f: "UB", c: P });
    if (recap) pill("OK", 990, y + 62, 26, GREEN, WH, { align: "right" });
    ctx.restore();
  });
}
function beforeAfter(sc, lt, dur) {
  voltBg(sc.start + lt, 10);
  ctx.save(); ctx.globalAlpha = eOut(prog(lt, 0, 0.3)); pill("PASSAGGIO LIBERO SUL MARCIAPIEDE", 64, 300, 30, Y, P); ctx.restore();
  const cards = [
    { chip: "PRIMA", col: RED, big: "1 m", txt: "di passaggio libero", y: 450, a: 0.0 },
    { chip: "DOPO", col: GREEN, big: "1,5 m", txt: "anche nelle strade pedonali", y: 900, a: 0.4 },
  ];
  cards.forEach((c, i) => {
    const q = eOut(prog(lt / dur, c.a, c.a + 0.1));
    if (q <= 0) return;
    const dim = i === 0 ? 1 - 0.45 * eOut(prog(lt / dur, 0.4, 0.5)) : 1;
    ctx.save(); ctx.globalAlpha = q * dim; ctx.translate(0, (1 - q) * 80);
    ctx.shadowColor = "rgba(0,0,0,.25)"; ctx.shadowBlur = 24; rr(64, c.y, 952, 400, 22, WH); ctx.shadowColor = "transparent";
    pill(c.chip, 104, c.y + 40, 30, c.col, WH);
    text(c.big, 104, c.y + 260, { size: 170, f: "UB", c: P });
    text(c.txt, 104, c.y + 340, { size: 40, f: "UM", c: INK });
    ctx.restore();
  });
}
function bandContent(sc, lt, dur, area) {
  const [x, y, w, h] = area, t = sc.start + lt;
  const b = sc.band;
  if (b === "library" || b === "closed") {
    let sh = 0;
    if (sc.shutter) sh = eInOut(prog(lt / dur, sc.shutter[0], sc.shutter[1]));
    footage(b, t, area, [1.0, 1.06, 0, 10], { p: lt / dur, shutter: sh });
    return;
  }
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  rect(x, y, w, h, P);
  ctx.globalAlpha = 0.07; poly([0, 520, W, 520 - W * K21, W, 520 - W * K21 + 160, 0, 680], WH); ctx.globalAlpha = 1;
  if (sc.chapter) chapter(sc.chapter, lt);
  if (b === "contract") {
    const p = eOut(prog(lt, 0.05, 0.45));
    ctx.save(); ctx.translate(500, 462 + (1 - p) * 60); ctx.rotate(-0.035); ctx.globalAlpha = p;
    ctx.shadowColor = "rgba(0,0,0,.3)"; ctx.shadowBlur = 30; rr(-300, -165, 600, 330, 8, WH); ctx.shadowColor = "transparent";
    text("CONVENZIONE", -250, -100, { size: 44, f: "UB", c: INK, ls: 2 });
    text("Biblioteca di via dei Gelsi", -250, -58, { size: 28, f: "UM", c: GREY });
    for (let i = 0; i < 3; i++) rect(-250, -24 + i * 30, 500 - (i === 2 ? 180 : 0), 10, "#D5D0DC");
    text("Firma del Municipio", -250, 105, { size: 26, f: "UR", c: GREY });
    rect(-250, 130, 300, 4, "#9A93A8");
    ctx.restore();
    const sp = prog(lt / dur, 0.45, 0.55);
    if (sp > 0) { const s = 1.6 - 0.6 * eOut(sp); ctx.save(); ctx.translate(780, 560); ctx.rotate(-0.18); ctx.scale(s, s); ctx.globalAlpha = eOut(sp); pill("NON FIRMATA", 0, -30, 34, RED, WH, { align: "center" }); ctx.restore(); }
  } else if (b === "number") {
    const q = eOut(prog(lt, 0.1, 1.0)), n = Math.round(3200 * q);
    text(fmtIt(n), 540, 520, { size: 210, f: "UB", c: Y, align: "center" });
    ctx.save(); ctx.globalAlpha = eOut(prog(lt, 0.4, 0.8)); text(sc.label, 540, 590, { size: 44, f: "UB", c: WH, align: "center", ls: 2 }); ctx.restore();
  } else if (b === "sidewalk") {
    const top = 372;
    rect(0, top, W, 40, "rgba(255,255,255,.35)");
    rect(0, top + 40, W, 214, "rgba(255,255,255,.12)");
    rect(0, top + 254, W, 30, "rgba(0,0,0,.28)");
    text("EDIFICIO", 1016, top + 30, { size: 24, f: "UB", c: "rgba(255,255,255,.8)", align: "right", ls: 2 });
    for (let i = 0; i < 5; i++) {
      const q = eBack(prog(lt / dur, 0.1 + i * 0.05, 0.2 + i * 0.05));
      if (q <= 0) continue;
      const cx = 150 + i * 190, cy = top + 92;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(q, q);
      rr(-62, -16, 28, 32, 5, WH); rr(34, -16, 28, 32, 5, WH); ell(0, 0, 38, 38, Y); ctx.restore();
    }
    const ap = eInOut(prog(lt / dur, 0.5, 0.75));
    if (ap > 0) {
      ctx.save(); ctx.globalAlpha = ap;
      rect(0, top + 146, W, 108, "rgba(253,194,32,.22)");
      ctx.strokeStyle = Y; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(960, top + 154); ctx.lineTo(960, top + 246); ctx.stroke();
      poly([940, top + 172, 980, top + 172, 960, top + 148], Y); poly([940, top + 228, 980, top + 228, 960, top + 252], Y);
      text("1,5 m", 64, top + 222, { size: 64, f: "UB", c: WH });
      text("di passaggio libero", 250, top + 216, { size: 34, f: "UM", c: WH });
      ctx.restore();
    }
  } else if (b === "hours") {
    const x0 = 340, x1 = 1000, pph = (x1 - x0) / 8;
    const rows = [["LUN–GIO", 6, 0.15], ["VEN–SAB", 7, 0.5]];
    rows.forEach(([lab, hrs, a], i) => {
      const yy = 400 + i * 100;
      text(lab, 64, yy + 38, { size: 36, f: "UB", c: WH, ls: 1 });
      rr(x0, yy, x1 - x0, 52, 26, "rgba(255,255,255,.15)");
      const q = eInOut(prog(lt / dur, a, a + 0.25));
      if (q > 0) rr(x0, yy, Math.max(52, pph * hrs * q), 52, 26, i ? "rgba(253,194,32,.78)" : Y);
      if (q >= 1) text(i ? "all'1" : "alle 24", x0 + pph * hrs + 16, yy + 38, { size: 32, f: "UB", c: WH });
    });
    ["18", "20", "22", "24", "02"].forEach((l, i) => text(l, x0 + i * pph * 2, 620, { size: 30, f: "UM", c: "rgba(255,255,255,.8)", align: "center" }));
  } else if (b === "controls") {
    const s1 = eOut(prog(lt / dur, 0.3, 0.45)), s2 = eOut(prog(lt / dur, 0.62, 0.77));
    ctx.save(); ctx.globalAlpha = s1; text("4", 260, 560, { size: 200, f: "UB", c: Y, align: "center" }); text("AGENTI DEDICATI", 260, 615, { size: 32, f: "UB", c: WH, align: "center", ls: 1 }); ctx.restore();
    ctx.save(); ctx.globalAlpha = s2; text("1.000 €", 740, 540, { size: 130, f: "UB", c: Y, align: "center" }); text("MULTA MASSIMA", 740, 615, { size: 32, f: "UB", c: WH, align: "center", ls: 1 }); ctx.restore();
  }
  ctx.restore();
}
function official(sc, lt) {
  const t = sc.start + lt, open = mouthOpen(sc, lt);
  ctx.drawImage(HALL, 0, 0);
  ctx.save(); ctx.translate(540, 760); ctx.scale(0.95, 0.95); ctx.translate(-540, -760);
  person(t, open, { short: true, hair: "#9A9A9A", browC: "#6E6E6E", skin: "#E3AF8C", skinD: "#CF9873", blazer: true, glasses: true, shirt: "#25324A", seed: 1.3 });
  ctx.restore();
  rr(240, 1240, 600, 700, 18, "#7A5236"); rect(240, 1240, 600, 40, "#8E6444");
  for (const dx of [-60, 0, 60]) { ctx.strokeStyle = "#222"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(540 + dx, 1240); ctx.lineTo(540 + dx * 0.6, 1120); ctx.stroke(); ell(540 + dx * 0.6, 1105, 16, 22, "#333"); }
  vignette(0.3);
}

/* ---------- regia ---------- */
let ENDS = [];
function sceneAt(t) { let k = 0; while (k < ENDS.length - 1 && t >= ENDS[k]) k++; return k; }
const PRESENTER_K = new Set(["presenter", "band", "corner"]);
function presenterFrame(sc, lt, dur) {
  let s = sc.frame === "tight" ? 1.2 : 1.0;
  if (sc.punch && lt > sc.punch * dur) s = 1.2;
  return { s, fx: 540, fy: 680 };
}
function shotAt(sc, lt, dur) {
  const n = sc.shots.length, cuts = sc.cuts || sc.shots.map((_, j) => j / n);
  let i = 0; while (i < n - 1 && lt >= cuts[i + 1] * dur) i++;
  const a = cuts[i] * dur, b = (i < n - 1 ? cuts[i + 1] : 1) * dur;
  return [i, lt - a, b - a];
}
function drawScene(k, lt) {
  const sc = TL.scenes[k], dur = sc.dur, t = sc.start + lt;
  const prev = TL.scenes[k - 1];
  switch (sc.k) {
    case "title_photo": {
      voltBg(t, 2);
      const p = eOut(prog(lt, 0.0, 0.5));
      ctx.save(); const top = 1230 + (1 - p) * 300;
      ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(W, top - W * K21); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.clip();
      footage(sc.photo, t, [0, 0, W, H], [1.06, 1.0, 0, 0], { p: lt / dur });
      ctx.restore();
      line21(0, 1230 + (1 - p) * 300 - 30, W * 1.08, eInOut(prog(lt, 0.3, 0.8)), 14);
      hookTitle(sc.title, lt, dur, { kicker: sc.kicker });
      break;
    }
    case "photo": footage(sc.photo, t, [0, 0, W, H], sc.kb, { p: lt / dur }); break;
    case "bignum": bigNum(sc, lt, dur); break;
    case "video": {
      const [i, sl, sd] = shotAt(sc, lt, dur);
      footage(sc.shots[i], sl + i * 3, [0, 0, W, H], [1.04, 1.12, 0, 0], { p: sl / sd });
      if (sc.title) hookTitle(sc.title, lt, dur, { box: true });
      if (sc.name) nameTag(sc.name, lt, dur);
      break;
    }
    case "steps": {
      voltBg(t, 1);
      sc.cards.forEach((c, i) => {
        const keep = sc.keep && i < sc.keep;
        const a = keep ? -1 : (c.at || 0) * dur;
        const q = keep ? 1 : eOut(prog(lt, a + 0.05, a + 0.45));
        if (q > 0) stepCard(c, 64, 540 + i * 290, 952, 250, q);
      });
      line21(64, 1560, 520, eInOut(prog(lt + (sc.keep ? 2 : 0), 0.1, 0.8)), 14);
      break;
    }
    case "map": mapScene(sc, lt, dur); break;
    case "proof": proofCard(sc, lt, dur); break;
    case "pills": pillsScene(sc, lt, dur); break;
    case "end": endcard(lt, dur); break;
    case "preview": previewScene(sc, lt, dur, false); break;
    case "recap": previewScene(sc, lt, dur, true); break;
    case "beforeafter": beforeAfter(sc, lt, dur); break;
    case "presenter": {
      camera(sc, lt, presenterFrame(sc, lt, dur));
      if (TL.topic && !sc.title) { ctx.save(); ctx.globalAlpha = 0.95; pill(TL.topic, 64, 312, 26, Y, P); ctx.restore(); }
      if (sc.title) hookTitle(sc.title, lt, dur, { box: true, kicker: sc.kicker });
      if (sc.card) dataCard(sc.card, lt, dur);
      if (sc.question) {
        const q = eOut(prog(lt, 0.1, 0.45));
        ctx.save(); ctx.globalAlpha = q; ctx.translate(0, (1 - q) * 60);
        ctx.shadowColor = "rgba(0,0,0,.3)"; ctx.shadowBlur = 30; rr(90, 900, 900, 380, 26, WH); ctx.shadowColor = "transparent";
        poly([200, 1278, 290, 1278, 190, 1350], WH);
        sc.question.forEach((l, i) => text(l, 140, 1010 + i * 82, { size: 72, f: "UB", c: P }));
        ell(160, 1200, 34, 34, Y); icon("comment", 160, 1202, 50);
        text(sc.qsub, 214, 1214, { size: 38, f: "UM", c: INK });
        ctx.restore();
      }
      break;
    }
    case "band": {
      const fromBand = prev && prev.k === "band";
      const e = fromBand ? 1 : eOut(prog(lt, 0, 0.4));
      camera(sc, lt, { s: 1, ty: 300 * e });
      ctx.save(); ctx.translate(0, -650 * (1 - e));
      bandContent(sc, lt, dur, [0, 0, W, 650]);
      rect(0, 650, W, 8, "rgba(0,0,0,.18)");
      ctx.restore();
      break;
    }
    case "cutout": {
      footage(sc.bg, t, [0, 0, W, H], [1.0, 1.06, 0, 0], { p: lt / dur });
      const e = eOut(prog(lt, 0, 0.35));
      camera(sc, lt, { cut: true, s: 0.92, fx: 540, fy: 1920, tx: 0, ty: 260 + (1 - e) * 200 });
      break;
    }
    case "clip": {
      official(sc, lt);
      nameTag(sc.name, lt, dur);
      credit(sc.credit);
      break;
    }
    case "corner": {
      const [i, sl, sd] = shotAt(sc, lt, dur);
      footage(sc.shots[i], sl, [0, 0, W, H], [1.02, 1.1, 0, 0], { p: sl / sd });
      const e = eOut(prog(lt, 0, 0.35));
      const bx = 64, by = 700, bw = 400, bh = 540;
      ctx.save(); ctx.globalAlpha = e; ctx.translate(-(1 - e) * 120, 0);
      ctx.shadowColor = "rgba(0,0,0,.4)"; ctx.shadowBlur = 30; rr(bx - 6, by - 6, bw + 12, bh + 12, 28, WH); ctx.shadowColor = "transparent";
      ctx.save(); ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 24); ctx.clip();
      ctx.translate(bx + bw / 2, by + bh * 0.42); ctx.scale(0.56, 0.56); ctx.translate(-540, -700);
      camera(sc, lt, { s: 1 });
      ctx.restore(); ctx.restore();
      break;
    }
  }
}
function frame(i) {
  const t = i / FPS;
  const k = sceneAt(t), sc = TL.scenes[k], lt = t - sc.start;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  rect(0, 0, W, H, "#000");
  drawScene(k, lt);
  if (sc.subs !== false) subtitles(sc, lt);
  if (sc.k !== "end") logo();
  aiLabel();
  const nx = TL.scenes[k + 1];
  if (nx && nx.trans === "band" && t > nx.start - 0.14) bandWipe((t - (nx.start - 0.14)) / 0.28);
  if (sc.trans === "band" && lt < 0.14) bandWipe((lt + 0.14) / 0.28);
  return cv.toDataURL("image/jpeg", 0.92);
}
async function init(tl, fonts, imgs) {
  TL = tl;
  ENDS = TL.scenes.map(s => s.start + s.dur);
  for (const [name, url, weight] of fonts) { const f = new FontFace(name, `url(${url})`); await f.load(); document.fonts.add(f); }
  for (const [k, url] of Object.entries(imgs)) { const im = new Image(); im.src = url; await im.decode(); IM[k] = im; }
  ROOM = prerenderRoom(); HALL = prerenderHall();
  return TL.frames;
}
