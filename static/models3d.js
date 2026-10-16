/*
 * PRASA IP: rotating 3D patent figures.
 * Replaces the flat layered SVG drawing inside each .draw3d[data-fig] with one
 * slowly turning WebGL model drawn as thin gold lines (chip, globe, mark,
 * molecule, product). Desktop only, lazy, pauses offscreen or in a hidden tab.
 * The SVG drawing stays as the fallback: it is only hidden (.is-3d) once the
 * first WebGL frame has rendered. No WebGL, a failed import or reduced motion
 * leaves the page exactly as it was.
 */
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
const GATE = '(min-width:1000px) and (hover:hover)';
const RM = '(prefers-reduced-motion: reduce)';
const TURN = 36; // seconds per full turn

function allowed() {
  try {
    if (!matchMedia(GATE).matches || matchMedia(RM).matches) return false;
    if (navigator.connection && navigator.connection.saveData) return false;
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return false;
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    return true;
  } catch (e) { return false; }
}

/* ---------- shaders ---------- */

// Screen-space thick lines: one instanced quad per segment, soft edges,
// depth fade (far side dimmer) and an optional travelling light pulse.
const LINE_VS = `
attribute vec3 iA, iB, iP; attribute vec2 iS;
uniform vec2 uRes; uniform float uW, uNear, uFar;
varying float vF, vY, vT; varying vec2 vS; varying float vPh;
void main(){
  vec4 mA = modelViewMatrix * vec4(iA, 1.0), mB = modelViewMatrix * vec4(iB, 1.0);
  vec4 a = projectionMatrix * mA, b = projectionMatrix * mB;
  vec2 d = (b.xy / b.w - a.xy / a.w) * uRes;
  float l = length(d); d = l > 1e-5 ? d / l : vec2(1.0, 0.0);
  vec2 n = vec2(-d.y, d.x);
  float w = uW * iS.x;
  vec4 p = mix(a, b, position.x);
  p.xy += (n * position.y * w + d * (position.x * 2.0 - 1.0) * w * 0.5) / uRes * 2.0 * p.w;
  gl_Position = p;
  vF = clamp((uFar + mix(mA.z, mB.z, position.x)) / (uFar - uNear), 0.0, 1.0);
  vY = position.y; vS = iS; vT = mix(iP.x, iP.y, position.x); vPh = iP.z;
}`;
const LINE_FS = `
uniform vec3 uC, uH; uniform float uA, uTime;
varying float vF, vY, vT; varying vec2 vS; varying float vPh;
void main(){
  float e = 1.0 - smoothstep(0.3, 1.0, abs(vY));
  float al = uA * vS.y * (0.2 + 0.8 * vF) * e;
  vec3 c = uC;
  if (vPh >= 0.0) {
    float h = fract(uTime * 0.14 + vPh) * 1.6 - 0.3;
    float k = vT < h ? smoothstep(0.16, 0.0, h - vT) : 0.0;
    c = mix(c, uH, k);
    al = max(al, uA * e * k * (0.45 + 0.55 * vF));
  }
  gl_FragColor = vec4(c, al);
}`;
// Rim-lit surfaces: dark translucent bodies that hide lines behind them, and gold atoms.
const RIM_VS = `
varying vec3 vN, vV;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal); vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;
const RIM_FS = `
uniform vec3 uB, uC; uniform float uA, uO, uS, uR;
varying vec3 vN, vV;
void main(){
  vec3 n = normalize(vN), v = normalize(vV);
  float r = 1.0 - abs(dot(n, v)); r *= r;
  float s = uS * pow(max(dot(n, normalize(vec3(-0.35, 0.55, 0.75))), 0.0), 26.0);
  gl_FragColor = vec4(mix(uB, uC, r * uR) + s * vec3(1.0, 0.95, 0.8), uA * clamp(uO + r * 0.6 * uR + s, 0.0, 1.0));
}`;

/* ---------- small geometry helpers (points are [x, y, z]) ---------- */

function Lines() {
  const d = [];
  const push = (a, b, w, al, t0, t1, ph) => d.push(a[0], a[1], a[2], b[0], b[1], b[2], w, al, t0, t1, ph);
  return {
    d,
    seg(a, b, w = 1, al = 1) { push(a, b, w, al, 0, 0, -1); },
    poly(p, o = {}) {
      const pts = o.closed ? p.concat([p[0]]) : p, c = [0];
      for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
      const L = c[c.length - 1] || 1, ph = o.pulse == null ? -1 : o.pulse;
      for (let i = 1; i < pts.length; i++) push(pts[i - 1], pts[i], o.w || 1, o.a == null ? 1 : o.a, c[i - 1] / L, c[i] / L, ph);
    }
  };
}
const circ = (r, n, f) => Array.from({ length: n }, (_, i) => f(Math.cos(i / n * 2 * Math.PI) * r, Math.sin(i / n * 2 * Math.PI) * r));
// rounded rectangle outline in 2D, half sizes w,h, corner radius r
function rrect(w, h, r, k = 6) {
  const p = [];
  [[w - r, h - r, 0], [-w + r, h - r, 1], [-w + r, -h + r, 2], [w - r, -h + r, 3]].forEach(([cx, cy, q]) => {
    for (let i = 0; i <= k; i++) { const a = (q + i / k) * Math.PI / 2; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  });
  return p;
}
function quad(a, c, b, n) { // quadratic bezier in 2D, excluding start
  const p = [];
  for (let i = 1; i <= n; i++) { const t = i / n, u = 1 - t; p.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); }
  return p;
}

/* ---------- the models ---------- */
// Each returns { obj, R (radius), tilt [x, z], refs: [[label, fx, fy, point]], tags, update(t) }

const MODELS = {
  chip(T, K) {
    const L = Lines(), g = new T.Group(), B = 1.75, refs = [];
    L.poly(rrect(B, B, .16).map(([x, z]) => [x, 0, z]), { closed: 1, a: .5 });
    for (let k = -4; k <= 4; k++) for (let j = 0; j < 10; j++) {
      const z0 = -B + j * .35, z1 = z0 + .35, x = k * .35, f = r => .2 * Math.max(0, 1 - r / 2.1);
      L.seg([x, 0, z0], [x, 0, z1], .6, f(Math.hypot(x, z0 + .175)));
      L.seg([z0, 0, x], [z1, 0, x], .6, f(Math.hypot(x, z0 + .175)));
    }
    // package: chamfered block with die and a small neural net
    const body = K.fill(new T.CylinderGeometry(.57 * Math.SQRT2, .62 * Math.SQRT2, .18, 4, 1), K.dark);
    body.rotation.y = Math.PI / 4; body.position.y = .13; g.add(body);
    const sq = (h, y) => [[h, y, h], [-h, y, h], [-h, y, -h], [h, y, -h]];
    L.poly(sq(.62, .04), { closed: 1, w: 1.2 }); L.poly(sq(.57, .22), { closed: 1, w: 1.2 });
    sq(.62, .04).forEach((p, i) => L.seg(p, sq(.57, .22)[i], 1.2));
    L.poly(sq(.33, .222), { closed: 1, a: .9 }); L.poly(sq(.28, .222), { closed: 1, a: .45, w: .7 });
    L.poly(circ(.035, 10, (x, z) => [x - .46, .222, z - .46]), { closed: 1, a: .8, w: .8 });
    const layers = [[-.18, [-.15, -.05, .05, .15]], [0, [-.2, -.1, 0, .1, .2]], [.18, [-.1, 0, .1]]].map(([x, zs]) => zs.map(z => [x, .222, z]));
    for (let a = 0; a < 2; a++) layers[a].forEach((p, i) => layers[a + 1].forEach((q, j) => L.poly([p, q], { w: .55, a: .4, pulse: ((i * 7 + j * 3 + a * 5) % 11) / 11 })));
    layers.flat().forEach(p => L.poly(circ(.022, 8, (x, z) => [p[0] + x, .222, p[2] + z]), { closed: 1, w: 1.1 }));
    // gull-wing pins and the traces they feed
    [[1, 0], [0, 1], [-1, 0], [0, -1]].forEach(([dx, dz], si) => {
      const tx = -dz, tz = dx;
      for (let i = 0; i < 7; i++) {
        const o = -.45 + i * .15, P = (r, y, e = 0) => [dx * r + tx * (o + e), y, dz * r + tz * (o + e)];
        [-.026, .026].forEach(e => L.poly([P(.62, .13, e), P(.69, .13, e), P(.73, 0, e), P(.82, 0, e)], { w: .8 }));
        L.seg(P(.82, 0, -.026), P(.82, 0, .026), .8);
        const run = .1 + ((i * 3 + si * 2) % 5) * .07, bend = (i < 3 ? -1 : i > 3 ? 1 : 0) * (.1 + ((i + si) % 3) * .07);
        const end = 1.22 + ((i * 13 + si * 7) % 5) * .09, q = P(end, 0, bend);
        L.poly([P(.82, 0), P(.82 + run, 0), P(.82 + run + Math.abs(bend), 0, bend), q], { w: .95, a: .85, pulse: ((i * .37 + si * .23) % 1) });
        L.poly(circ(.045, 10, (x, z) => [q[0] + x, 0, q[2] + z]), { closed: 1, w: .9 });
        if (si === 2 && i === 1) refs.push(['14', .06, .82, q]);
      }
    });
    refs.push(['10', .07, .12, [-.57, .22, .57]], ['12', .9, .1, [.33, .222, -.33]], ['16', .93, .86, [B, 0, B]]);
    g.add(K.lines(L));
    return { obj: g, R: 2.05, tilt: [.6, 0], refs };
  },

  globe(T, K) {
    const L = Lines(), g = new T.Group(), R = 1.3, n = 72;
    const sph = (lat, lon, r = R) => { const a = lat * Math.PI / 180, b = lon * Math.PI / 180; return [r * Math.cos(a) * Math.sin(b), r * Math.sin(a), r * Math.cos(a) * Math.cos(b)]; };
    [-60, -40, -20, 0, 20, 40, 60].forEach(lat => L.poly(circ(1, n, (c, s) => sph(lat, Math.atan2(s, c) * 180 / Math.PI)), { closed: 1, a: lat ? .55 : .95, w: lat ? .8 : 1.1 }));
    for (let lon = 0; lon < 180; lon += 30) L.poly(circ(1, n, (c, s) => sph(Math.atan2(s, c) * 180 / Math.PI, lon)), { closed: 1, a: lon ? .55 : .8, w: .8 });
    g.add(K.fill(new T.SphereGeometry(R * .985, 40, 24), K.glass));
    const off = { IN: [12.97, 77.59], US: [38.9, -77.0], EP: [48.14, 11.58], PCT: [46.2, 6.14] }, tags = [];
    const unit = p => p.map(v => v / R);
    const slerp = (a, b, t) => {
      const A = unit(a), B2 = unit(b), d = Math.acos(Math.min(1, A[0] * B2[0] + A[1] * B2[1] + A[2] * B2[2])), s = Math.sin(d) || 1;
      const k1 = Math.sin((1 - t) * d) / s, k2 = Math.sin(t * d) / s, lift = R * (1 + Math.sin(Math.PI * t) * (.05 + d * .09));
      return [0, 1, 2].map(i => (A[i] * k1 + B2[i] * k2) * lift);
    };
    [['IN', 'US'], ['IN', 'EP'], ['IN', 'PCT'], ['EP', 'US'], ['PCT', 'US']].forEach(([a, b], k) => {
      const A = sph(...off[a]), B2 = sph(...off[b]);
      L.poly(Array.from({ length: 41 }, (_, i) => slerp(A, B2, i / 40)), { w: 1.15, a: .95, pulse: k * .23 });
    });
    Object.keys(off).forEach(key => {
      const p = sph(...off[key]), dot = K.fill(new T.SphereGeometry(.035, 12, 8), K.gold);
      dot.position.set(...p); g.add(dot);
      const N = new T.Vector3(...p).normalize(), U = new T.Vector3(0, 1, 0).cross(N).normalize(), V = N.clone().cross(U);
      L.poly(circ(.085, 16, (c, s) => [p[0] + U.x * c + V.x * s, p[1] + U.y * c + V.y * s, p[2] + U.z * c + V.z * s]), { closed: 1, w: .9 });
      tags.push([key, p, key === 'PCT' ? -1 : 1]);
    });
    g.add(K.lines(L));
    // instrument ring that does not turn with the globe
    const ring = Lines(), rr = 1.62;
    ring.poly(circ(rr, 120, (x, y) => [x, y, 0]), { closed: 1, a: .45, w: .7 });
    for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2, l = i % 6 ? .05 : .1; ring.seg([Math.cos(a) * rr, Math.sin(a) * rr, 0], [Math.cos(a) * (rr - l), Math.sin(a) * (rr - l), 0], .7, .6); }
    const ringObj = K.lines(ring);
    return {
      obj: g, R: 1.75, tilt: [.32, -.18], tags, fixed: ringObj,
      refs: [['30', .07, .12, sph(55, -40)], ['32', .92, .88, [rr * Math.cos(-.75), rr * Math.sin(-.75), 0], 1]],
      update(t) { ringObj.rotation.z = -t * .05; }
    };
  },

  mark(T, K) {
    const L = Lines(), g = new T.Group(), S = 1.15;
    const out = [[0, 1.08], [.8, .78], [.8, -.02]].concat(quad([.8, -.02], [.8, -.68], [0, -1.06], 14), quad([0, -1.06], [-.8, -.68], [-.8, -.02], 14), [[-.8, .78]]).map(([x, y]) => [x * S, (y + .01) * S]);
    const inner = out.map(([x, y]) => [x * .86, y * .86 - .02]);
    const at = (p, z) => p.map(([x, y]) => [x, y, z]);
    const F = .1, Z = .17;
    L.poly(at(out, F), { closed: 1, w: 1.3, pulse: .1 }); L.poly(at(out, -F), { closed: 1, w: 1.3 });
    L.poly(at(inner, Z), { closed: 1 }); L.poly(at(inner, -Z), { closed: 1 });
    [0, 1, 2, 16, 30, 31].forEach(i => { L.seg([...out[i], F], [...out[i], -F], 1.1); L.seg([...out[i], F], [...inner[i], Z], .8, .7); L.seg([...out[i], -F], [...inner[i], -Z], .8, .7); });
    // body: side band, bevel bands and caps
    const strip = (A, B2) => { const v = []; for (let i = 0; i < A.length; i++) { const j = (i + 1) % A.length; v.push(...A[i], ...B2[i], ...B2[j], ...A[i], ...B2[j], ...A[j]); } return v; };
    const fan = (P, z, s) => { const v = []; for (let i = 0; i < P.length; i++) { const j = (i + 1) % P.length, a = [0, -.04, z], b = [...P[i], z], c = [...P[j], z]; v.push(...a, ...(s > 0 ? b : c), ...(s > 0 ? c : b)); } return v; };
    const v = strip(at(out, -F), at(out, F)).concat(strip(at(out, F), at(inner, Z)), strip(at(inner, -Z), at(out, -F)), fan(inner, Z, 1), fan(inner, -Z, -1));
    const bg = new T.BufferGeometry(); bg.setAttribute('position', new T.Float32BufferAttribute(v, 3)); bg.computeVertexNormals();
    g.add(K.fill(bg, Object.assign({ side: T.DoubleSide }, K.dark)));
    // registered-mark emblem on both faces
    [1, -1].forEach(s => {
      const z = s * (Z + .004), P = (x, y) => [x * s, y, z];
      L.poly(circ(.44, 48, P), { closed: 1, w: 1.1 }); L.poly(circ(.38, 48, P), { closed: 1, w: .7, a: .6 });
      const bowl = [[-.14, -.24], [-.14, .23], [.04, .23]].concat(Array.from({ length: 13 }, (_, i) => { const a = Math.PI / 2 - i / 12 * Math.PI; return [.04 + .115 * Math.cos(a), .115 + .115 * Math.sin(a)]; }), [[-.14, 0]]);
      L.poly(bowl.map(p => P(...p)), { w: 1.3 }); L.poly([P(-.02, 0), P(.15, -.24)], { w: 1.3 });
    });
    g.add(K.lines(L));
    // seal ring of ticks around the mark, turning slowly in the picture plane
    const ring = Lines(), r1 = 1.6;
    for (let i = 0; i < 90; i++) { const a = i / 90 * Math.PI * 2, l = i % 5 ? .06 : .12; ring.seg([Math.cos(a) * r1, Math.sin(a) * r1, 0], [Math.cos(a) * (r1 - l), Math.sin(a) * (r1 - l), 0], .7, .7); }
    ring.poly(circ(r1, 120, (x, y) => [x, y, 0]), { closed: 1, a: .55, w: .8 });
    for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2; ring.seg([Math.cos(a) * 1.75, Math.sin(a) * 1.75, 0], [Math.cos(a + .06) * 1.75, Math.sin(a + .06) * 1.75, 0], .7, .45); }
    const ringObj = K.lines(ring);
    return {
      obj: g, R: 1.85, tilt: [.12, 0], fixed: ringObj,
      refs: [['40', .07, .12, [out[1][0], out[1][1], F]], ['42', .92, .12, [.31, .31, Z]], ['44', .07, .88, [-1.2, -1.06, 0], 1], ['46', .92, .88, [.15, -.24, Z]]],
      update(t) { ringObj.rotation.z = t * .04; }
    };
  },

  molecule(T, K) {
    const g = new T.Group(), L = Lines(), b = .42, h = b * Math.sqrt(3) / 2, at = [], bonds = [];
    const hex = cx => Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 6 + i * Math.PI / 3; return [cx + b * Math.cos(a), b * Math.sin(a), 0]; });
    const A = hex(-h), B2 = hex(h), add = (p, kind) => (at.push([p, kind]), p), bond = (p, q, dbl) => bonds.push([p, q, dbl]);
    A.concat([B2[0], B2[1], B2[4], B2[5]]).forEach(p => add(p, 'C'));
    [A, B2].forEach((r, k) => { for (let i = 0; i < 6; i++) if (k === 0 || i !== 2) bond(r[i], r[(i + 1) % 6]); });
    [-h, h].forEach(cx => L.poly(circ(.22, 36, (x, y) => [cx + x, y, 0]), { closed: 1, w: .8, a: .7, pulse: cx > 0 ? .5 : 0 }));
    const out = (p, cx, l, z = 0) => { const d = [p[0] - cx, p[1]], m = Math.hypot(...d); return [p[0] + d[0] / m * l, p[1] + d[1] / m * l, z]; };
    const sub = (p, q, kind) => { add(q, kind); bond(p, q); return q; };
    // ring hydrogens
    [[A[1], -h], [A[3], -h], [B2[0], h], [B2[4], h]].forEach(([p, cx]) => sub(p, out(p, cx, .32), 'H'));
    // methoxy on A[2]
    const O1 = sub(A[2], out(A[2], -h, .4), 'O'), C1 = sub(O1, [O1[0] - .2, O1[1] + .3, .18], 'C');
    [[-.28, .1, .1], [-.05, .22, .3], [-.1, .02, .45]].forEach(d => sub(C1, [C1[0] + d[0], C1[1] + d[1], C1[2] + d[2]], 'H'));
    // amine on A[4]
    const N1 = sub(A[4], out(A[4], -h, .4), 'N');
    [[-.22, -.12, .22], [.1, -.22, -.24]].forEach(d => sub(N1, [N1[0] + d[0], N1[1] + d[1], d[2]], 'H'));
    // methyl on B[1]
    const C2 = sub(B2[1], out(B2[1], h, .42), 'C');
    [[0, .3, 0], [-.18, .1, .26], [.18, .1, -.26]].map(d => sub(C2, [C2[0] + d[0], C2[1] + d[1], d[2]], 'H'));
    // carboxyl on B[5]
    const C3 = sub(B2[5], out(B2[5], h, .42), 'C'), O2 = add([C3[0] + .36, C3[1] + .14, .12], 'O'), O3 = add([C3[0] + .04, C3[1] - .4, -.12], 'O');
    bond(C3, O2, 1); bond(C3, O3); sub(O3, [O3[0] + .3, O3[1] - .12, -.1], 'H');
    const cyl = new T.CylinderGeometry(1, 1, 1, 10, 1, true), up = new T.Vector3(0, 1, 0);
    bonds.forEach(([p, q, dbl]) => {
      const P = new T.Vector3(...p), Q = new T.Vector3(...q), d = Q.clone().sub(P), side = new T.Vector3(0, 0, 1).cross(d).normalize().multiplyScalar(.035);
      (dbl ? [side, side.clone().negate()] : [new T.Vector3()]).forEach(o => {
        const m = K.fill(cyl, K.stick); m.scale.set(.02, d.length(), .02);
        m.quaternion.setFromUnitVectors(up, d.clone().normalize()); m.position.copy(P).add(Q).multiplyScalar(.5).add(o); g.add(m);
      });
    });
    const ball = new T.SphereGeometry(1, 24, 16), size = { C: .085, O: .1, N: .095, H: .05 };
    at.forEach(([p, k]) => { const m = K.fill(ball, k === 'H' ? K.pale : K.gold); m.scale.setScalar(size[k]); m.position.set(...p); g.add(m); });
    g.add(K.lines(L));
    g.position.x = -.05;
    return { obj: g, R: 1.6, tilt: [.28, .1], refs: [['50', .07, .12, A[2]], ['52', .92, .12, O2], ['54', .07, .88, N1], ['56', .92, .88, C2]] };
  },

  product(T, K) {
    const g = new T.Group(), L = Lines(), w = .62, hh = 1.22, D = .085;
    const o = rrect(w, hh, .2), bev = rrect(w - .035, hh - .035, .17), at = (p, z) => p.map(([x, y]) => [x, y, z]);
    L.poly(at(o, D), { closed: 1, w: 1.2, pulse: .3 }); L.poly(at(o, -D), { closed: 1, w: 1.2 });
    L.poly(at(bev, D + .02), { closed: 1, a: .7, w: .8 }); L.poly(at(bev, -D - .02), { closed: 1, a: .7, w: .8 });
    [0, 6, 7, 13, 14, 20, 21, 27].forEach(i => L.seg([...o[i], D], [...o[i], -D], 1.1));
    L.poly(at(rrect(w - .07, hh - .1, .12), D + .021), { closed: 1, a: .9 });
    L.poly([[-.1, hh - .055, D + .021], [.1, hh - .055, D + .021]], { w: .9 });
    L.poly(circ(.018, 10, (x, y) => [x + .2, y + hh - .055, D + .021]), { closed: 1, w: .8 });
    // camera block and lenses on the back
    const cz = -D - .045, cb = rrect(.2, .2, .07).map(([x, y]) => [x - .32, y + .92]);
    L.poly(at(cb, cz), { closed: 1 }); L.poly(at(cb, -D - .02), { closed: 1, a: .5, w: .8 });
    [[-.38, .98], [-.38, .86], [-.24, .98]].forEach(([x, y], i) => L.poly(circ(i < 2 ? .05 : .02, 18, (a, b) => [x + a, y + b, cz]), { closed: 1, w: .9 }));
    // side keys
    [[.55, .35], [.25, .07]].forEach(([y, l]) => L.poly([[w + .012, y, .03], [w + .012, y - l, .03], [w + .012, y - l, -.03], [w + .012, y, -.03]], { closed: 1, w: .8 }));
    // body for hidden lines
    const sh = new T.Shape(o.map(([x, y]) => new T.Vector2(x, y)));
    const ex = new T.ExtrudeGeometry(sh, { depth: 2 * D, bevelEnabled: false, curveSegments: 4 }); ex.translate(0, 0, -D);
    g.add(K.fill(ex, K.dark));
    // dimension lines with extension lines and arrowheads
    const dim = (a, b, n, e1, e2) => {
      L.poly([a, b], { w: .75, a: .8 });
      [[a, b], [b, a]].forEach(([p, q]) => { const d = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], m = Math.hypot(...d) / .07; L.poly([p.map((v, i) => v + d[i] / m + n[i] * .03), p, p.map((v, i) => v + d[i] / m - n[i] * .03)], { w: .75, a: .8 }); });
      e1 && L.seg(e1[0], e1[1], .6, .55); e2 && L.seg(e2[0], e2[1], .6, .55);
    };
    dim([-w - .28, -hh, 0], [-w - .28, hh, 0], [1, 0, 0], [[-w - .04, hh, 0], [-w - .34, hh, 0]], [[-w - .04, -hh, 0], [-w - .34, -hh, 0]]);
    dim([-w, -hh - .28, 0], [w, -hh - .28, 0], [0, 1, 0], [[-w, -hh - .04, 0], [-w, -hh - .34, 0]], [[w, -hh - .04, 0], [w, -hh - .34, 0]]);
    dim([w + .3, hh - .4, -D], [w + .3, hh - .4, D], [0, 1, 0], [[w + .04, hh - .4, D], [w + .36, hh - .4, D]], [[w + .04, hh - .4, -D], [w + .36, hh - .4, -D]]);
    g.add(K.lines(L));
    return { obj: g, R: 1.5, tilt: [.14, -.1], refs: [['60', .07, .12, [-.3, .6, D + .02]], ['62', .92, .12, [-.32, 1.1, cz]], ['64', .07, .88, [-w - .28, -.4, 0]], ['66', .92, .88, [.3, -hh - .28, 0]]] };
  }
};

/* ---------- scene per figure ---------- */

async function start(root, T) {
  const fig = MODELS[root.getAttribute('data-fig')] ? root.getAttribute('data-fig') : 'chip';
  T.ColorManagement.enabled = false; // colours below are used as written (sRGB)
  const canvas = document.createElement('canvas');
  canvas.className = 'm3d-cv';
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (e) { return; }
  renderer.setClearColor(0, 0);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  renderer.setPixelRatio(dpr);

  const U = {
    uRes: { value: new T.Vector2(1, 1) }, uW: { value: 1 }, uNear: { value: 1 }, uFar: { value: 2 },
    uA: { value: 0 }, uTime: { value: 0 }, uC: { value: new T.Color('#e3c46b') }, uH: { value: new T.Color('#fff3c8') }
  };
  const lineMat = new T.ShaderMaterial({ vertexShader: LINE_VS, fragmentShader: LINE_FS, uniforms: U, transparent: true, depthWrite: false });
  const quadPos = new T.Float32BufferAttribute([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0], 3);
  const mats = {};
  const K = {
    dark: { base: '#2a0a1b', rim: '#b78621', o: .72, s: 0, r: .5 },
    glass: { base: '#2a0a1b', rim: '#b78621', o: .2, s: 0, r: .55, dw: false },
    gold: { base: '#6e4c12', rim: '#f0d48a', o: .95, s: .9 },
    pale: { base: '#8a7046', rim: '#f6e6b4', o: .9, s: .7 },
    stick: { base: '#8a6418', rim: '#e3c46b', o: .9, s: .35 },
    lines(l) {
      const g = new T.InstancedBufferGeometry(), ib = new T.InstancedInterleavedBuffer(new Float32Array(l.d), 11);
      g.setAttribute('position', quadPos); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('iA', new T.InterleavedBufferAttribute(ib, 3, 0));
      g.setAttribute('iB', new T.InterleavedBufferAttribute(ib, 3, 3));
      g.setAttribute('iS', new T.InterleavedBufferAttribute(ib, 2, 6));
      g.setAttribute('iP', new T.InterleavedBufferAttribute(ib, 3, 8));
      g.instanceCount = l.d.length / 11;
      const m = new T.Mesh(g, lineMat); m.frustumCulled = false; m.renderOrder = 2;
      return m;
    },
    fill(geo, o) {
      const key = o.base + o.rim + o.o + o.r + (o.side || 0);
      const mat = mats[key] || (mats[key] = new T.ShaderMaterial({
        vertexShader: RIM_VS, fragmentShader: RIM_FS, transparent: true, depthWrite: o.dw !== false, side: o.side || T.FrontSide,
        polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2,
        uniforms: { uA: U.uA, uB: { value: new T.Color(o.base) }, uC: { value: new T.Color(o.rim) }, uO: { value: o.o }, uS: { value: o.s }, uR: { value: o.r || 1 } }
      }));
      const m = new T.Mesh(geo, mat); m.renderOrder = 1;
      return m;
    }
  };

  const M = MODELS[fig](T, K);
  const scene = new T.Scene(), FOV = 28, cam = new T.PerspectiveCamera(FOV, 1, .1, 100);
  const D = M.R / (.8 * Math.tan(FOV / 2 * Math.PI / 180));
  cam.position.set(0, 0, D);
  U.uNear.value = D - M.R; U.uFar.value = D + M.R;
  const tilt = new T.Group(), spin = new T.Group();
  scene.add(tilt); tilt.add(spin); spin.add(M.obj);
  if (M.fixed) { const f = new T.Group(); f.rotation.x = M.tilt[0] * .35; f.add(M.fixed); scene.add(f); }

  // HTML overlay: reference numerals with leader lines, office tags, FIG. 1
  const ov = document.createElement('div'); ov.className = 'm3d-ov';
  const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
  ov.appendChild(svg);
  const span = (txt, cls) => { const s = document.createElement('span'); s.className = cls; s.textContent = txt; ov.appendChild(s); return s; };
  const refs = (M.refs || []).map(([n, fx, fy, p, fixed]) => {
    const path = document.createElementNS(NS, 'path'); svg.appendChild(path);
    return { el: span(n, 'm3d-ref'), path, fx, fy, v: new T.Vector3(...p), fixed };
  });
  const tags = (M.tags || []).map(([n, p, s]) => ({ el: span(n, 'm3d-tag'), v: new T.Vector3(...p), s }));
  span('FIG. 1', 'm3d-fig');

  let W = 1, H = 1, offX = 0, offY = 0;
  function size() {
    const r = canvas.getBoundingClientRect(), rr = root.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    offX = r.left - rr.left; offY = r.top - rr.top;
    renderer.setSize(W, H, false);
    cam.aspect = W / H; cam.updateProjectionMatrix();
    U.uRes.value.set(W * dpr, H * dpr); U.uW.value = .95 * dpr;
    svg.setAttribute('viewBox', '0 0 ' + rr.width + ' ' + rr.height);
    ov.style.setProperty('--w', rr.width + 'px');
  }

  const tmp = new T.Vector3(), camDir = new T.Vector3();
  function project(v, obj) {
    tmp.copy(v).applyMatrix4(obj.matrixWorld);
    const z = tmp.z; tmp.project(cam);
    return [(tmp.x + 1) / 2 * W + offX, (1 - tmp.y) / 2 * H + offY, z];
  }
  function overlay() {
    const bw = root.clientWidth, bh = root.clientHeight;
    refs.forEach(r => {
      const [x, y, z] = project(r.v, r.fixed ? M.fixed : M.obj), lx = r.fx * bw, ly = r.fy * bh;
      const op = .35 + .65 * Math.min(1, Math.max(0, (z + M.R) / (2 * M.R)));
      const sx = lx + (r.fx < .5 ? 20 : -8), sy = ly + (r.fy < .5 ? 6 : -18);
      r.path.setAttribute('d', 'M' + sx.toFixed(1) + ' ' + sy.toFixed(1) + ' Q ' + ((sx + x) / 2).toFixed(1) + ' ' + (sy + (r.fy < .5 ? 26 : -26)).toFixed(1) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1));
      r.path.style.opacity = op.toFixed(2);
      r.el.style.transform = 'translate(' + (lx - (r.fx < .5 ? 0 : 14)) + 'px,' + (ly - (r.fy < .5 ? 10 : 22)) + 'px)';
    });
    tags.forEach(t => {
      const [x, y] = project(t.v, M.obj);
      camDir.copy(t.v).applyMatrix4(M.obj.matrixWorld);
      const facing = camDir.clone().normalize().dot(cam.position.clone().sub(camDir).normalize());
      t.el.style.transform = 'translate(' + (t.s < 0 ? x - 9 - t.el.offsetWidth : x + 9).toFixed(1) + 'px,' + (y - (t.s < 0 ? 4 : 22)).toFixed(1) + 'px)';
      t.el.style.opacity = Math.max(0, Math.min(1, facing * 4)).toFixed(2);
    });
  }

  // pointer tilt, eased
  let mx = 0, my = 0, ex = 0, ey = 0;
  const area = root.parentElement || root;
  area.addEventListener('mousemove', e => {
    const r = root.getBoundingClientRect();
    mx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / r.width));
    my = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / r.height));
  }, { passive: true });
  area.addEventListener('mouseleave', () => { mx = my = 0; });

  let t = 0, last = 0, raf = 0, inView = false, shown = false, dead = false;
  const phase = { chip: .5, globe: -1.4, mark: -.5, molecule: .3, product: -.6 }[fig] || 0;
  function frame(now) {
    raf = 0;
    if (dead || !inView || document.hidden) return;
    const dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now; t += dt;
    const k = Math.min(1, dt * 2.2); ex += (mx - ex) * k; ey += (my - ey) * k;
    tilt.rotation.set(M.tilt[0] + ey * .16 + Math.sin(t * .31) * .03, ex * .3, M.tilt[1]);
    tilt.position.y = Math.sin(t * .55) * .045 * M.R;
    spin.rotation.y = phase + t * 2 * Math.PI / TURN;
    M.update && M.update(t);
    U.uTime.value = t; U.uA.value = Math.min(1, t / 1.6);
    renderer.render(scene, cam);
    overlay();
    if (!shown) { shown = true; root.classList.add('is-3d'); }
    raf = requestAnimationFrame(frame);
  }
  const go = () => { if (!raf && inView && !document.hidden && !dead) { last = 0; raf = requestAnimationFrame(frame); } };

  root.appendChild(canvas); root.appendChild(ov);
  size();
  new ResizeObserver(() => { size(); }).observe(root);
  new IntersectionObserver(en => { inView = en[0].isIntersecting; go(); }).observe(root);
  document.addEventListener('visibilitychange', go);
  const stop = () => { dead = true; root.classList.remove('is-3d'); canvas.remove(); ov.remove(); };
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); stop(); });
  const mq = matchMedia(RM);
  mq.addEventListener && mq.addEventListener('change', () => { if (mq.matches) { stop(); try { renderer.dispose(); } catch (e) {} } });
  inView = true; go();
}

function init() {
  const roots = [...document.querySelectorAll('.draw3d[data-fig]')];
  if (!roots.length || !allowed() || !('IntersectionObserver' in window)) return;
  let lib;
  const io = new IntersectionObserver(async en => {
    for (const e of en) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      try {
        lib = lib || import(THREE_URL);
        await start(e.target, await lib);
      } catch (err) { /* keep the SVG drawing */ }
    }
  }, { rootMargin: '200px' });
  roots.forEach(r => io.observe(r));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
