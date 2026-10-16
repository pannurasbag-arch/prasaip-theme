/*
 * PRASA IP hero layer: "drawing sheets in glass".
 * Five frosted panels, each carrying a patent-style line drawing in gold,
 * drift slowly in depth over the home hero while a sparse field of gold
 * dust turns around them. Desktop only, lazy, pauses when not seen.
 * Three.js is loaded with a dynamic import only after every gate passes,
 * so phones, tablets and reduced-motion visitors never download it.
 */
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
const GATE = '(min-width:1024px) and (hover:hover) and (pointer:fine)';
const GOLD = '#f0d48a';

function allowed() {
  try {
    if (!matchMedia(GATE).matches) return false;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (navigator.connection && navigator.connection.saveData) return false;
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return false;
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    return true;
  } catch (e) { return false; }
}

/* ---------- Line drawings on a 2D canvas (400 x 500 design units) ---------- */

function sheet(fig, total, draw, zoom) {
  const S = 1.28, c = document.createElement('canvas');
  c.width = 512; c.height = 640;
  const g = c.getContext('2d');
  g.scale(S, S);
  g.strokeStyle = GOLD; g.fillStyle = GOLD;
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(240,212,138,.55)'; g.shadowBlur = 6;
  // sheet frame, corner ticks and sheet number
  g.globalAlpha = .4; g.lineWidth = 1.4;
  g.strokeRect(20, 20, 360, 460);
  g.globalAlpha = .7; g.lineWidth = 1.4;
  [[20, 20, 1, 1], [380, 20, -1, 1], [20, 480, 1, -1], [380, 480, -1, -1]].forEach(([x, y, a, b]) => {
    line(g, x - 8 * a, y, x + 14 * a, y); line(g, x, y - 8 * b, x, y + 14 * b);
  });
  g.globalAlpha = .75;
  g.font = '500 12px "DM Sans",Arial,sans-serif';
  g.fillText(fig + '/' + total, 340, 40);
  g.globalAlpha = 1; g.lineWidth = 3;
  g.save(); g.translate(200, 250); g.scale(zoom, zoom); g.translate(-200, -250);
  g.lineWidth = 3 / zoom;
  draw(g);
  g.restore();
  g.globalAlpha = 1;
  g.font = 'italic 500 26px Newsreader,Georgia,serif';
  g.fillText('FIG. ' + fig, 272, 458);
  return c;
}

function line(g, x1, y1, x2, y2) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
function circle(g, x, y, r, fill) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); fill ? g.fill() : g.stroke(); }
function thin(g, fn) { const w = g.lineWidth, a = g.globalAlpha; g.lineWidth = 1.7; g.globalAlpha = .75; fn(); g.lineWidth = w; g.globalAlpha = a; }
function dashed(g, pat, fn) { g.setLineDash(pat); fn(); g.setLineDash([]); }

// Reference numeral with a curved leader line, patent style.
function ref(g, n, tx, ty, px, py) {
  thin(g, () => {
    g.beginPath(); g.moveTo(tx + (px > tx ? 18 : -4), ty - 5);
    g.quadraticCurveTo((tx + px) / 2, ty - 26, px, py); g.stroke();
  });
  g.font = 'italic 17px Newsreader,Georgia,serif';
  g.fillText(String(n), tx - (px > tx ? 0 : 18), ty);
}

function figChip(g) {
  const x = 125, y = 150, w = 150, h = 150;
  g.beginPath(); g.roundRect(x, y, w, h, 12); g.stroke();
  for (let i = 0; i < 9; i++) {
    const t = x + 17 + i * 14.5;
    line(g, t, y, t, y - 20); line(g, t, y + h, t, y + h + 20);
    line(g, x, y + 17 + i * 14.5, x - 20, y + 17 + i * 14.5);
    line(g, x + w, y + 17 + i * 14.5, x + w + 20, y + 17 + i * 14.5);
  }
  dashed(g, [5, 5], () => { g.strokeRect(x + 34, y + 34, w - 68, h - 68); });
  const N = [];
  for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) N.push([x + 52 + k * 23, y + 52 + r * 23]);
  thin(g, () => {
    N.forEach((a, i) => N.forEach((b, j) => { if (j > i && Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) < 47) line(g, a[0], a[1], b[0], b[1]); }));
    // traces leaving the package
    [[x - 20, y + 31, 60, 96], [x + w + 20, y + 89, 342, 120], [x + 60, y + h + 20, 96, 392], [x + w + 20, y + 118, 330, 360]].forEach(([a, b, c, d]) => {
      g.beginPath(); g.moveTo(a, b); g.lineTo((a + c) / 2, b); g.lineTo((a + c) / 2, d); g.lineTo(c, d); g.stroke(); circle(g, c, d, 4);
    });
  });
  N.forEach(([a, b]) => circle(g, a, b, 3.4, true));
  ref(g, 10, 60, 360, x + 8, y + h - 16);
  ref(g, 12, 330, 74, x + w - 4, y - 14);
  ref(g, 14, 300, 250, x + w - 40, y + h - 46);
}

function figCircuit(g) {
  // rails
  line(g, 60, 120, 340, 120); line(g, 60, 360, 340, 360);
  // resistor
  g.beginPath(); g.moveTo(110, 120); g.lineTo(110, 160);
  for (let i = 0; i < 6; i++) g.lineTo(110 + (i % 2 ? -12 : 12), 168 + i * 10);
  g.lineTo(110, 228); g.lineTo(110, 250); g.stroke();
  // capacitor
  line(g, 110, 250, 110, 278); line(g, 88, 278, 132, 278); line(g, 88, 292, 132, 292); line(g, 110, 292, 110, 360);
  // amplifier
  g.beginPath(); g.moveTo(190, 190); g.lineTo(190, 290); g.lineTo(276, 240); g.closePath(); g.stroke();
  line(g, 110, 210, 190, 210); line(g, 190, 270, 160, 270); line(g, 160, 270, 160, 360);
  line(g, 276, 240, 340, 240);
  g.font = '500 15px "DM Sans",Arial,sans-serif'; g.fillText('+', 197, 216); g.fillText('−', 197, 276);
  // feedback
  thin(g, () => { g.beginPath(); g.moveTo(300, 240); g.lineTo(300, 160); g.lineTo(150, 160); g.lineTo(150, 210); g.stroke(); });
  // ground
  line(g, 230, 360, 230, 384); line(g, 212, 384, 248, 384); line(g, 219, 392, 241, 392); line(g, 226, 400, 234, 400);
  [[110, 120], [110, 210], [160, 360], [110, 360], [300, 240], [150, 210]].forEach(([a, b]) => circle(g, a, b, 4.2, true));
  circle(g, 340, 240, 6);
  ref(g, 20, 52, 196, 102, 190);
  ref(g, 22, 52, 314, 88, 286);
  ref(g, 24, 300, 322, 250, 262);
}

function hexPts(cx, cy, r, rot) {
  const p = [];
  for (let i = 0; i < 6; i++) { const a = rot + i * Math.PI / 3; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return p;
}
function figMolecule(g) {
  const r = 46, A = hexPts(160, 230, r, Math.PI / 6), B = hexPts(160 + r * Math.sqrt(3), 230, r, Math.PI / 6);
  [A, B].forEach(P => { g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.stroke(); });
  thin(g, () => { circle(g, 160, 230, 27); circle(g, 160 + r * Math.sqrt(3), 230, 27); });
  // side groups
  const atom = (x, y, s) => {
    g.save(); g.shadowBlur = 0; g.globalCompositeOperation = 'destination-out'; circle(g, x, y, 13, true); g.restore();
    g.font = 'italic 19px Newsreader,Georgia,serif'; g.fillText(s, x - 6, y + 6);
  };
  const a1 = A[3], b1 = B[0], b5 = B[5];
  line(g, a1[0], a1[1], a1[0] - 46, a1[1]); atom(a1[0] - 58, a1[1], 'O');
  line(g, b1[0], b1[1], b1[0] + 40, b1[1] + 24); line(g, b1[0] + 40, b1[1] + 24, b1[0] + 80, b1[1]); atom(b1[0] + 92, b1[1], 'N');
  line(g, b5[0], b5[1], b5[0], b5[1] - 56); line(g, b5[0] + 5, b5[1] - 4, b5[0] + 5, b5[1] - 52);
  atom(b5[0], b5[1] - 68, 'O');
  const a4 = A[4]; line(g, a4[0], a4[1], a4[0] - 24, a4[1] - 44);
  thin(g, () => dashed(g, [4, 6], () => line(g, a4[0] - 24, a4[1] - 44, a4[0] - 60, a4[1] - 54)));
  ref(g, 30, 64, 348, 140, 268);
  ref(g, 32, 312, 360, B[1][0] + 6, B[1][1] + 4);
}

function gearPath(g, cx, cy, n, ro, ri, ph) {
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const a = ph + i * 2 * Math.PI / n, s = Math.PI / n;
    const P = [[ri, a - s * .55], [ro, a - s * .28], [ro, a + s * .28], [ri, a + s * .55]];
    P.forEach(([r, t], k) => { const x = cx + r * Math.cos(t), y = cy + r * Math.sin(t); (i || k) ? g.lineTo(x, y) : g.moveTo(x, y); });
  }
  g.closePath(); g.stroke();
}
function figGear(g) {
  const c1 = [160, 260], c2 = [160 + 128 * Math.cos(-.62), 260 + 128 * Math.sin(-.62)];
  gearPath(g, c1[0], c1[1], 16, 86, 74, 0);
  gearPath(g, c2[0], c2[1], 9, 50, 39, Math.PI / 9);
  circle(g, c1[0], c1[1], 18); circle(g, c2[0], c2[1], 11);
  // keyway
  g.strokeRect(c1[0] - 4, c1[1] - 24, 8, 8);
  thin(g, () => {
    circle(g, c1[0], c1[1], 58); circle(g, c2[0], c2[1], 30);
    for (let i = 0; i < 5; i++) { const a = i * 2 * Math.PI / 5 + .3; line(g, c1[0] + 18 * Math.cos(a), c1[1] + 18 * Math.sin(a), c1[0] + 58 * Math.cos(a), c1[1] + 58 * Math.sin(a)); }
    dashed(g, [18, 5, 3, 5], () => {
      line(g, c1[0] - 110, c1[1], c1[0] + 110, c1[1]); line(g, c1[0], c1[1] - 110, c1[0], c1[1] + 110);
      line(g, c1[0], c1[1], c2[0] + 40 * Math.cos(-.62), c2[1] + 40 * Math.sin(-.62));
    });
    // rotation arrow
    g.beginPath(); g.arc(c2[0], c2[1], 70, -2.3, -1.2); g.stroke();
    const e = [c2[0] + 70 * Math.cos(-1.2), c2[1] + 70 * Math.sin(-1.2)];
    line(g, e[0], e[1], e[0] - 12, e[1] - 4); line(g, e[0], e[1], e[0] - 6, e[1] + 10);
  });
  ref(g, 40, 52, 392, 106, 318);
  ref(g, 42, 330, 214, c2[0] + 40, c2[1] + 22);
  ref(g, 44, 52, 150, c1[0] - 14, c1[1] - 12);
}

function figSeal(g) {
  const cx = 200, cy = 236;
  circle(g, cx, cy, 128); thin(g, () => { circle(g, cx, cy, 120); circle(g, cx, cy, 82); });
  circle(g, cx, cy, 74);
  // ring lettering
  const words = 'REGISTERED · TRADE MARK · CLASS 45 · ';
  g.font = '600 13px "DM Sans",Arial,sans-serif';
  const step = 2 * Math.PI / words.length;
  for (let i = 0; i < words.length; i++) {
    const a = -Math.PI / 2 + i * step;
    g.save(); g.translate(cx + 101 * Math.cos(a), cy + 101 * Math.sin(a)); g.rotate(a + Math.PI / 2);
    g.fillText(words[i], -4, 4); g.restore();
  }
  // the symbol
  g.font = '500 92px Newsreader,Georgia,serif';
  g.fillText('R', cx - 30, cy + 32);
  thin(g, () => { for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; line(g, cx + 128 * Math.cos(a), cy + 128 * Math.sin(a), cx + 136 * Math.cos(a), cy + 136 * Math.sin(a)); } });
  ref(g, 50, 52, 418, cx - 92, cy + 92);
}

function figGlobe(g) {
  const cx = 200, cy = 240, R = 120;
  circle(g, cx, cy, R);
  thin(g, () => {
    [86, 46].forEach(rx => { g.beginPath(); g.ellipse(cx, cy, rx, R, 0, 0, Math.PI * 2); g.stroke(); });
    line(g, cx, cy - R, cx, cy + R);
    [-70, -30, 0, 30, 70].forEach(dy => { const w = Math.sqrt(R * R - dy * dy); g.beginPath(); g.ellipse(cx, cy + dy, w, w * .18, 0, 0, Math.PI * 2); g.stroke(); });
  });
  const P = { IN: [252, 262], US: [130, 214], EP: [206, 176], JP: [292, 214] };
  [['IN', 'US'], ['IN', 'EP'], ['IN', 'JP'], ['EP', 'US']].forEach(([a, b]) => {
    const p = P[a], q = P[b]; g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo((p[0] + q[0]) / 2, Math.min(p[1], q[1]) - 54, q[0], q[1]); g.stroke();
  });
  g.font = '600 13px "DM Sans",Arial,sans-serif';
  Object.entries(P).forEach(([k, [x, y]]) => { circle(g, x, y, 5, true); g.fillText(k, x + 9, y + 18); });
  ref(g, 60, 52, 420, cx - 60, cy + 96);
  ref(g, 62, 330, 80, 248, 180);
}

function figPhone(g) {
  const x = 130, y = 90, w = 140, h = 280;
  g.beginPath(); g.roundRect(x, y, w, h, 24); g.stroke();
  thin(g, () => { g.beginPath(); g.roundRect(x + 11, y + 26, w - 22, h - 52, 8); g.stroke(); });
  g.beginPath(); g.roundRect(x + 52, y + 10, 36, 7, 3.5); g.stroke();
  circle(g, x + w / 2, y + h - 13, 6);
  // side view
  g.beginPath(); g.roundRect(310, y, 16, h, 7); g.stroke();
  line(g, 326, y + 70, 331, y + 70); line(g, 326, y + 100, 331, y + 100);
  // dimension lines
  thin(g, () => {
    line(g, 104, y, 104, y + h); line(g, 98, y + 6, 104, y); line(g, 110, y + 6, 104, y); line(g, 98, y + h - 6, 104, y + h); line(g, 110, y + h - 6, 104, y + h);
    line(g, x, y + h + 26, x + w, y + h + 26); line(g, x + 6, y + h + 20, x, y + h + 26); line(g, x + 6, y + h + 32, x, y + h + 26); line(g, x + w - 6, y + h + 20, x + w, y + h + 26); line(g, x + w - 6, y + h + 32, x + w, y + h + 26);
  });
  ref(g, 70, 52, 60, x + 10, y + 20);
  ref(g, 72, 352, 60, 318, y + 40);
}

function figHelix(g) {
  const cx = 200, top = 70, bot = 410, A = 70;
  const pt = (t, ph) => [cx + A * Math.sin(t + ph), top + (bot - top) * (t / (Math.PI * 4))];
  [0, Math.PI].forEach(ph => { g.beginPath(); for (let i = 0; i <= 120; i++) { const t = i / 120 * Math.PI * 4, [x, y] = pt(t, ph); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); });
  thin(g, () => { for (let i = 1; i < 16; i++) { const t = i / 16 * Math.PI * 4, a = pt(t, 0), b = pt(t, Math.PI); if (Math.abs(a[0] - b[0]) > 14) line(g, a[0], a[1], b[0], b[1]); } });
  for (let i = 1; i < 16; i += 2) { const t = i / 16 * Math.PI * 4; const a = pt(t, 0), b = pt(t, Math.PI); circle(g, a[0], a[1], 4, true); circle(g, b[0], b[1], 4, true); }
  ref(g, 80, 52, 140, cx - 50, 120);
  ref(g, 82, 330, 360, cx + 30, 330);
}

function figTower(g) {
  const cx = 200, base = 400, topY = 150;
  line(g, cx - 54, base, cx, topY); line(g, cx + 54, base, cx, topY);
  thin(g, () => { for (let k = 0; k < 4; k++) { const y1 = topY + 30 + k * 55, y2 = y1 + 55, f = y => (y - topY) / (base - topY) * 54; line(g, cx - f(y1), y1, cx + f(y2), y2); line(g, cx + f(y1), y1, cx - f(y2), y2); } });
  line(g, cx - 70, base, cx + 70, base);
  circle(g, cx, topY - 6, 8);
  [44, 76, 108].forEach((r, i) => {
    g.globalAlpha = 1 - i * .22;
    g.beginPath(); g.arc(cx, topY - 6, r, -Math.PI * .8, -Math.PI * .2); g.stroke();
    g.beginPath(); g.arc(cx, topY - 6, r, Math.PI * .2, Math.PI * .45); g.stroke();
    g.beginPath(); g.arc(cx, topY - 6, r, Math.PI * .55, Math.PI * .8); g.stroke();
  });
  g.globalAlpha = 1;
  g.font = '600 13px "DM Sans",Arial,sans-serif'; g.fillText('5G NR', 262, 300);
  ref(g, 90, 52, 380, cx - 40, 340);
  ref(g, 92, 330, 80, cx + 60, topY - 50);
}

function figLock(g) {
  const cx = 200, y = 220, w = 170, h = 150;
  g.beginPath(); g.arc(cx, y, 56, Math.PI, 0); g.lineTo(cx + 56, y); g.stroke();
  line(g, cx - 56, y, cx - 56, y);
  g.beginPath(); g.moveTo(cx - 56, y); g.lineTo(cx - 56, y - 2); g.stroke();
  thin(g, () => { g.beginPath(); g.arc(cx, y, 40, Math.PI, 0); g.stroke(); });
  g.beginPath(); g.roundRect(cx - w / 2, y, w, h, 14); g.stroke();
  circle(g, cx, y + 58, 14);
  g.beginPath(); g.moveTo(cx - 7, y + 68); g.lineTo(cx - 10, y + 104); g.lineTo(cx + 10, y + 104); g.lineTo(cx + 7, y + 68); g.stroke();
  thin(g, () => dashed(g, [5, 6], () => { g.strokeRect(cx - w / 2 + 12, y + 12, w - 24, h - 24); }));
  ref(g, 96, 52, 130, cx - 50, y - 40);
  ref(g, 98, 330, 420, cx + 10, y + 100);
}

const FIGS = [figChip, figSeal, figMolecule, figGear, figCircuit, figGlobe, figPhone, figHelix, figTower, figLock];
const ZOOM = [1.05, 1, 1.22, 1.08, 1.05, 1.05, 1, 1, 1, 1.05];

/* ---------- Shaders ---------- */

const PANEL_VS = `
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const PANEL_FS = `
uniform sampler2D map; uniform vec2 size; uniform float radius, uTime, phase, reveal, fade, back;
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
float sdRound(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main(){
  vec2 p = (vUv - 0.5) * size;
  float d = sdRound(p, size * 0.5, radius);
  float aa = fwidth(d) * 1.2;
  float inside = 1.0 - smoothstep(-aa, aa, d);
  if (inside < 0.01) discard;
  float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0);
  // smoked wine glass, lit from the top left
  float grad = clamp(0.65 * vUv.y + 0.35 * (1.0 - vUv.x), 0.0, 1.0);
  vec3 glassC = mix(vec3(0.17, 0.03, 0.10), vec3(0.50, 0.24, 0.33), grad);
  float glassA = (0.40 + 0.12 * grad + 0.2 * fres) * (1.0 - back * 0.82);
  // slow light sweep across the face
  float k = vUv.x + vUv.y * 0.55 - fract(uTime * 0.03 + phase) * 3.4 + 0.7;
  float sheen = smoothstep(0.22, 0.0, abs(k)) * 0.10 * (1.0 - back);
  // hairline edge, brighter along the lit top edge
  float edge = 1.0 - smoothstep(0.0, aa * 2.5 + 0.006, abs(d + 0.006));
  float lit = 0.45 + 0.55 * smoothstep(0.2, 0.95, vUv.y * 0.8 + (1.0 - vUv.x) * 0.2);
  float bevel = smoothstep(-0.07, 0.0, d);
  float rimA = edge * lit * mix(1.0, 0.4, back) + bevel * (0.12 + 0.5 * fres);
  float hot = pow(max(0.0, 1.0 - length(vUv - vec2(0.15 + 0.7 * fract(uTime * 0.05 + phase), 0.92)) * 2.2), 4.0) * bevel * 1.4 * (1.0 - back);
  rimA += hot;
  vec3 col = glassC; float a = glassA;
  col = mix(col, vec3(1.0, 0.95, 0.85), sheen / max(a + sheen, 0.001)); a += sheen;
  vec3 rimC = mix(vec3(1.0, 0.88, 0.62), vec3(1.0, 0.72, 0.78), 0.5 + 0.5 * sin(vUv.x * 5.0 + vUv.y * 3.0 + uTime * 0.4));
  col = mix(col, rimC, rimA / max(a + rimA, 0.001)); a = a + rimA * (1.0 - a);
  if (back < 0.5) {
    float w = (1.0 - vUv.y) * 0.72 + vUv.x * 0.28;
    float m = smoothstep(reveal, reveal - 0.05, w);
    float front = smoothstep(0.05, 0.0, abs(w - reveal)) * step(reveal, 0.999);
    float ink = texture2D(map, vUv).a * m;
    vec3 inkC = vec3(0.97, 0.84, 0.54) + front * 0.25;
    col = mix(col, inkC, ink); a = a + ink * (1.0 - a);
  }
  gl_FragColor = vec4(col, a * inside * fade);
}`;

const WASH_FS = `
uniform float fade; uniform vec2 c; varying vec2 vUv;
void main(){
  float d = length((vUv - c) * vec2(1.6, 1.0));
  float g = smoothstep(0.22, 0.0, d) * 0.10;
  gl_FragColor = vec4(mix(vec3(0.10, 0.015, 0.06), vec3(0.85, 0.6, 0.3), g / (g + 0.6)), (smoothstep(0.7, 0.0, d) * 0.78 + g) * fade);
}`;

const DUST_VS = `
attribute vec4 seed; uniform float uTime, uPx, uS; varying float vA;
void main(){
  float r = seed.x;
  float ang = seed.y + uTime * (0.03 + 0.22 / (r * r));
  vec3 p = vec3(cos(ang) * r, seed.z + sin(uTime * 0.21 + seed.w * 6.283) * 0.14, sin(ang) * r * 0.55);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPx * (0.5 + seed.w * 1.6) * (9.0 / -mv.z) * uS;
  vA = (0.3 + 0.7 * seed.w) * (0.65 + 0.35 * sin(uTime * 0.9 + seed.w * 47.0));
}`;

const DUST_FS = `
uniform float fade; varying float vA;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d); a *= a;
  gl_FragColor = vec4(vec3(1.0, 0.86, 0.55), a * vA * fade);
}`;

/* Screen position as a share of the half-frame at the panel's depth: x, y, then z, scale, rotY */
const LAYOUT = [
  [0.47, -0.06, 0.0, 1.11, -0.30],
  [0.81, 0.40, -1.5, 0.74, -0.42],
  [0.21, 0.40, -3.0, 0.80, -0.16],
  [0.85, -0.52, 0.6, 0.72, -0.50],
  [0.22, -0.60, -2.2, 0.78, -0.20]
];

/* ---------- Scene ---------- */

async function start(host) {
  let T, renderer, canvas, alive = true;
  const disposables = [];
  const off = [];
  const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); off.push(() => t.removeEventListener(ev, fn, o)); };

  function dispose() {
    alive = false;
    try { renderer && renderer.setAnimationLoop(null); } catch (e) {}
    off.forEach(f => { try { f(); } catch (e) {} });
    disposables.forEach(d => { try { d.dispose(); } catch (e) {} });
    try { renderer && renderer.dispose(); renderer && renderer.forceContextLoss(); } catch (e) {}
    if (canvas) canvas.remove();
    host.classList.remove('hero3d-on');
  }

  try {
    T = await import(THREE_URL);
    if (document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]);
    if (!alive) return;

    canvas = document.createElement('canvas');
    canvas.className = 'hero3d';
    canvas.setAttribute('aria-hidden', 'true');
    renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power', premultipliedAlpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    on(canvas, 'webglcontextlost', e => { e.preventDefault(); dispose(); });

    const scene = new T.Scene();
    const FOV = 30, CAMZ = 10;
    const camera = new T.PerspectiveCamera(FOV, 1, 0.1, 60);
    camera.position.set(0, 0, CAMZ);
    const rig = new T.Group(); scene.add(rig);

    const gl2 = renderer.capabilities.isWebGL2;
    const geo = new T.PlaneGeometry(1.5, 1.875); disposables.push(geo);
    const NP = FIGS.length, DIRS = [];
    for (let i = 0; i < NP; i++) { const y = 1 - (i + 0.5) / NP * 2, r = Math.sqrt(1 - y * y), a = i * 2.39996; DIRS.push(new T.Vector3(Math.cos(a) * r, y * 0.86, Math.sin(a) * r).normalize()); }
    const ball = new T.Group(); rig.add(ball);
    const panels = Array.from({ length: NP }, (_, i) => FIGS[i % FIGS.length]).map((draw, i) => {
      const tex = new T.CanvasTexture(sheet((i % FIGS.length) + 1, FIGS.length, draw, ZOOM[i % FIGS.length]));
      tex.generateMipmaps = gl2;
      tex.minFilter = gl2 ? T.LinearMipmapLinearFilter : T.LinearFilter;
      tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      disposables.push(tex);
      const mk = backFace => {
        const m = new T.ShaderMaterial({
          vertexShader: PANEL_VS, fragmentShader: PANEL_FS, transparent: true, depthWrite: false, side: T.DoubleSide,
          extensions: { derivatives: true },
          uniforms: { map: { value: tex }, size: { value: new T.Vector2(1.5, 1.875) }, radius: { value: 0.12 }, uTime: { value: 0 },
            phase: { value: i * 0.23 }, reveal: { value: 0 }, fade: { value: 0 }, back: { value: backFace ? 1 : 0 } }
        });
        disposables.push(m);
        return m;
      };
      const node = new T.Group();
      const glassBack = new T.Mesh(geo, mk(true)); glassBack.position.z = -0.035; glassBack.position.x = 0.01;
      const glassFront = new T.Mesh(geo, mk(false));
      node.add(glassBack, glassFront);
      node.userData = { dir: DIRS[i], mats: [glassBack.material, glassFront.material], ph: i * 1.7 + 0.4, delay: 0.2 + i * 0.12 };
      ball.add(node);
      return node;
    });

    // faint gold globe lines so the cluster reads as a ball
    const gPts = [];
    for (let k = 1; k < 6; k++) { const la = -Math.PI / 2 + k * Math.PI / 6, cy = Math.sin(la), cr = Math.cos(la); for (let j = 0; j < 64; j++) { const a0 = j / 64 * Math.PI * 2, a1 = (j + 1) / 64 * Math.PI * 2; gPts.push(Math.cos(a0) * cr, cy, Math.sin(a0) * cr, Math.cos(a1) * cr, cy, Math.sin(a1) * cr); } }
    for (let m = 0; m < 8; m++) { const lo = m / 8 * Math.PI; for (let j = 0; j < 48; j++) { const b0 = j / 48 * Math.PI * 2, b1 = (j + 1) / 48 * Math.PI * 2; gPts.push(Math.cos(lo) * Math.cos(b0), Math.sin(b0), Math.sin(lo) * Math.cos(b0), Math.cos(lo) * Math.cos(b1), Math.sin(b1), Math.sin(lo) * Math.cos(b1)); } }
    const gGeo = new T.BufferGeometry(); gGeo.setAttribute('position', new T.Float32BufferAttribute(gPts, 3));
    const gMat = new T.LineBasicMaterial({ color: 0xe3c46b, transparent: true, opacity: 0, depthWrite: false });
    disposables.push(gGeo, gMat);
    const globe = new T.LineSegments(gGeo, gMat); ball.add(globe);

    // gold dust
    const N = 3600, seeds = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      const u = Math.random();
      seeds[i * 4] = 1.08 + Math.pow(u, 1.8) * 2.4;
      seeds[i * 4 + 1] = Math.random() * Math.PI * 2;
      seeds[i * 4 + 2] = (Math.random() - 0.5) * (u < 0.55 ? 0.35 : 1.6);
      seeds[i * 4 + 3] = Math.pow(Math.random(), 2.2);
    }
    const dGeo = new T.BufferGeometry();
    dGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(N * 3), 3));
    dGeo.setAttribute('seed', new T.BufferAttribute(seeds, 4));
    dGeo.boundingSphere = new T.Sphere(new T.Vector3(), 12);
    const dMat = new T.ShaderMaterial({
      vertexShader: DUST_VS, fragmentShader: DUST_FS, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPx: { value: 3.0 * renderer.getPixelRatio() }, uS: { value: 1 }, fade: { value: 0 } }
    });
    disposables.push(dGeo, dMat);
    const dust = new T.Points(dGeo, dMat);
    dust.rotation.set(0.38, 0, -0.22);
    const dust2 = new T.Points(dGeo, dMat);
    dust2.rotation.set(-0.5, 1.1, 0.35);
    scene.add(dust, dust2);

    // soft wine wash behind the sheets so gold reads over the photo
    const wGeo = new T.PlaneGeometry(1, 1);
    const wMat = new T.ShaderMaterial({ vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: WASH_FS, transparent: true, depthWrite: false, uniforms: { fade: { value: 0 }, c: { value: new T.Vector2(0.74, 0.47) } } });
    disposables.push(wGeo, wMat);
    const wash = new T.Mesh(wGeo, wMat); wash.position.z = -6; wash.renderOrder = -1;
    scene.add(wash);

    // layout follows the hero's size and aspect
    let W = 1, H = 1;
    function layout() {
      const r = host.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      const tanH = Math.tan(T.MathUtils.degToRad(FOV / 2));
      // narrow frames: shrink a little so the column of sheets still fits
      const s = Math.min(1, Math.max(0.82, camera.aspect / 1.55));
      const hz = (CAMZ + 1) * tanH;
      ball.position.set(0.5 * hz * camera.aspect, -0.04 * hz, -1); ball.userData.by = -0.04 * hz;
      ball.userData.R = Math.min(0.62 * hz, 0.27 * hz * camera.aspect * 2) * s;
      globe.scale.setScalar(ball.userData.R * 0.93);
      panels.forEach(p => p.scale.setScalar(0.64 * s));
      const hd = (CAMZ + 1.4) * tanH;
      dust.position.copy(ball.position); dust2.position.copy(ball.position);
      dust.scale.setScalar(ball.userData.R); dust2.scale.setScalar(ball.userData.R * 0.9);
      dMat.uniforms.uS.value = 1.4;
      const hw = (CAMZ + 6) * tanH;
      wash.scale.set(hw * 2 * camera.aspect, hw * 2, 1);
    }
    layout();
    const ro = new ResizeObserver(layout); ro.observe(host); off.push(() => ro.disconnect());

    // pointer parallax, eased
    let mx = 0, my = 0, ex = 0, ey = 0;
    on(window, 'mousemove', e => { mx = e.clientX / innerWidth * 2 - 1; my = e.clientY / innerHeight * 2 - 1; }, { passive: true });

    host.prepend(canvas);
    host.classList.add('hero3d-on');

    let t = 0, last = performance.now(), shown = false;
    const look = new T.Vector3();
    function frame(now) {
      const dt = Math.min(0.1, (now - last) / 1000); last = now; t += dt;
      ex += (mx - ex) * Math.min(1, dt * 2.2); ey += (my - ey) * Math.min(1, dt * 2.2);
      camera.position.set(ex * 0.38, -ey * 0.24, CAMZ);
      look.set(ex * 0.1, -ey * 0.06, -2); camera.lookAt(look);
      const f = Math.min(1, t / 1.6), ease = 1 - Math.pow(1 - f, 3);
      const BR = ball.userData.R;
      ball.rotation.set(0.32 + ey * 0.18, t * 0.22 + ex * 0.35, -0.12);
      ball.position.y = ball.userData.by + (1 - ease) * -0.35 + Math.sin(t * 0.5) * 0.06;
      ball.updateMatrixWorld();
      gMat.opacity = 0.22 * ease;
      panels.forEach(p => {
        const u = p.userData;
        p.position.copy(u.dir).multiplyScalar(BR);
        p.lookAt(ball.localToWorld(u.dir.clone().multiplyScalar(BR * 3)));
        const wz = p.getWorldPosition(look).z - ball.position.z, depth = Math.max(0, Math.min(1, (wz / BR + 1) / 2));
        const rv = Math.min(1, Math.max(0, (t - u.delay) / 1.9));
        u.mats.forEach(m => {
          m.uniforms.uTime.value = t; m.uniforms.fade.value = ease * (0.22 + 0.78 * depth);
          m.uniforms.reveal.value = rv * rv * (3 - 2 * rv) * 1.06;
        });
      });
      dMat.uniforms.uTime.value = t; dMat.uniforms.fade.value = ease; wMat.uniforms.fade.value = ease;
      renderer.render(scene, camera);
      if (!shown) { shown = true; requestAnimationFrame(() => canvas.classList.add('is-in')); }
    }

    // run only while the hero is on screen, the tab is visible and the gate still matches
    let inView = true;
    const mq = matchMedia(GATE);
    const sync = () => {
      const run = alive && inView && !document.hidden && mq.matches;
      if (run) { last = performance.now(); renderer.setAnimationLoop(frame); } else renderer.setAnimationLoop(null);
    };
    const io = new IntersectionObserver(es => { inView = es[es.length - 1].isIntersecting; sync(); }, { threshold: 0 });
    io.observe(host); off.push(() => io.disconnect());
    on(document, 'visibilitychange', sync);
    on(mq, 'change', sync);
    sync();
  } catch (e) {
    dispose();
  }
}

export function boot(sel = '.hero--spec') {
  const host = document.querySelector(sel);
  if (!host || !allowed()) return;
  const go = () => ('requestIdleCallback' in window ? requestIdleCallback(() => start(host), { timeout: 2500 }) : setTimeout(() => start(host), 300));
  if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
}

boot();
