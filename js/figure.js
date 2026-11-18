/* Chalk — silhouettes animées des mouvements (vue de profil)
   Angles en degrés. Jambes et bras : 0 = vers le bas, 90 = vers l'avant, 180 = vers le haut.
   Buste k : 0 = vertical, 90 = penché vers l'avant à l'horizontale. */
window.CH = window.CH || {};
{
const L = { th: .44, sh: .44, to: .54, ua: .29, fa: .27, head: .1, neck: .07 };
const BASE = { k: 0, tf: 0, sf: 0, tb: null, sb: null, uf: 0, ff: 0, ub: null, fb: null, lift: 0, dx: 0 };
const P = o => Object.assign({}, BASE, o);

const ST = P({});
const RACK = { uf: 100, ff: -105 };
const OVER = { uf: 176, ff: 178 };
const BACK = { uf: -40, ff: 150 };
const SQ = { k: 38, tf: 88, sf: -28 };
const HALF = { k: 22, tf: 45, sf: -18 };
const FLOOR = { k: 62, tf: 62, sf: -14, uf: 2, ff: 2 };

const A = {
  backsquat: { eq: 'bar', at: 'back', f: [P(BACK), P(Object.assign({}, SQ, BACK, { k: 45 }))] },
  frontsquat: { eq: 'bar', f: [P(RACK), P(Object.assign({}, SQ, RACK, { k: 20 }))] },
  ohs: { eq: 'bar', f: [P(OVER), P(Object.assign({}, SQ, { k: 22, uf: 168, ff: 170 }))] },
  airsquat: { f: [P({ uf: 5, ff: 5 }), P(Object.assign({}, SQ, { uf: 95, ff: 95 }))] },
  goblet: { eq: 'kbchest', f: [P({ uf: 20, ff: 160 }), P(Object.assign({}, SQ, { k: 25, uf: 30, ff: 165 }))] },
  deadlift: { eq: 'bar', f: [P(FLOOR), P({ uf: 0, ff: 0 })] },
  rdl: { eq: 'bar', f: [P({ uf: 0, ff: 0 }), P({ k: 72, tf: 12, sf: -4, uf: 0, ff: 0 })] },
  clean: { eq: 'bar', f: [P(FLOOR), P({ k: -8, tf: -5, sf: -10, uf: 8, ff: 8, lift: .06 }), P(Object.assign({}, SQ, RACK, { k: 20 })), P(RACK)] },
  hangclean: { eq: 'bar', f: [P({ k: 35, tf: 25, sf: -10, uf: 0, ff: 0 }), P({ k: -8, tf: -5, sf: -10, uf: 10, ff: 10, lift: .06 }), P(Object.assign({}, HALF, RACK, { k: 12 })), P(RACK)] },
  snatch: { eq: 'bar', f: [P(Object.assign({}, FLOOR, { k: 58 })), P({ k: -10, tf: -5, sf: -10, uf: 15, ff: 15, lift: .06 }), P(Object.assign({}, SQ, { k: 22, uf: 168, ff: 170 })), P(OVER)] },
  dbsnatch: { eq: 'db', f: [P({ k: 60, tf: 55, sf: -15, uf: 0, ff: 0, ub: 30, fb: 40 }), P({ k: -5, uf: 120, ff: 150, ub: 10, fb: 20, lift: .04 }), P({ uf: 176, ff: 178, ub: 5, fb: 10 })] },
  press: { eq: 'bar', f: [P(RACK), P(OVER)] },
  pushpress: { eq: 'bar', f: [P(RACK), P(Object.assign({}, HALF, RACK, { k: 4, tf: 30, sf: -25 })), P(Object.assign({ lift: .03 }, OVER))] },
  thruster: { eq: 'bar', f: [P(Object.assign({}, SQ, RACK, { k: 20 })), P(Object.assign({}, OVER))] },
  wallball: { eq: 'ball', scene: 'target', f: [P(Object.assign({}, SQ, { k: 22, uf: 35, ff: 165 })), P({ uf: 165, ff: 172, lift: .05 })] },
  kbswing: { eq: 'kb', f: [P({ k: 62, tf: 32, sf: -12, uf: -18, ff: -25 }), P({ k: -4, uf: 95, ff: 95 })] },
  lunge: { f: [P({ tf: 5, sf: 0, tb: -5, sb: 0, uf: 5, ff: 5 }), P({ tf: 82, sf: 0, tb: -28, sb: -95, uf: 5, ff: 5 })] },
  boxjump: { scene: 'box', f: [P({ dx: -.55, uf: 5, ff: 5 }), P({ dx: -.55, k: 40, tf: 55, sf: -25, uf: -45, ff: -40 }), P({ dx: -.2, k: 15, tf: 100, sf: -10, uf: 110, ff: 120, lift: .72 }), P({ dx: 0, lift: .6, uf: 10, ff: 10 })], loop: true },
  burpee: { f: [P({ uf: 5, ff: 5 }), P(Object.assign({}, SQ, { k: 60, uf: 15, ff: 15 })), P({ k: 72, tf: -72, sf: -72, uf: 0, ff: 0 }), P({ k: 86, tf: -86, sf: -86, uf: -55, ff: 70 }), P(Object.assign({}, SQ, { k: 55, uf: 10, ff: 10 })), P({ uf: 175, ff: 178, lift: .25 })], loop: true },
  pushup: { f: [P({ k: 66, tf: -66, sf: -66, uf: 0, ff: 0 }), P({ k: 82, tf: -82, sf: -82, uf: -58, ff: 72 })] },
  pullup: { scene: 'bar', anchor: 'hang', f: [P({ k: -4, tf: 6, sf: -6, uf: 178, ff: 178 }), P({ k: -6, tf: 10, sf: -15, uf: 112, ff: -134 })] },
  muscleup: { scene: 'bar', anchor: 'hang', f: [P({ k: -8, tf: 10, sf: -10, uf: 178, ff: 178 }), P({ k: 15, tf: 30, sf: -5, uf: 112, ff: -134 }), P({ k: 10, tf: 8, sf: -6, uf: -8, ff: 8 })], loop: true },
  t2b: { scene: 'bar', anchor: 'hang', f: [P({ k: -4, tf: 4, sf: 0, uf: 178, ff: 178 }), P({ k: -30, tf: 150, sf: 165, uf: 160, ff: 165 })] },
  hspu: { scene: 'wall', f: [P({ k: 180, tf: 180, sf: 180, uf: 0, ff: 0 }), P({ k: 175, tf: 182, sf: 182, uf: -50, ff: 40 })] },
  dips: { scene: 'dip', anchor: 'dip', f: [P({ k: 5, tf: 20, sf: -70, uf: -6, ff: 0 }), P({ k: 25, tf: 35, sf: -55, uf: -70, ff: 15 })] },
  situp: { f: [P({ k: -82, tf: 60, sf: -45, uf: -150, ff: -160 }), P({ k: 25, tf: 60, sf: -45, uf: 110, ff: 120 })] },
  plank: { f: [P({ k: 78, tf: -78, sf: -78, uf: 0, ff: 90 }), P({ k: 76, tf: -76, sf: -76, uf: 2, ff: 90 })] },
  hipthrust: { scene: 'bench', eq: 'bar', at: 'hip', f: [P({ k: -55, tf: 45, sf: 0, uf: 30, ff: 70 }), P({ k: -82, tf: 82, sf: 0, uf: 40, ff: 80 })] },
  bench: { scene: 'flatbench', anchor: 'bench', eq: 'bar', f: [P({ k: -90, tf: 70, sf: 10, uf: 180, ff: 180 }), P({ k: -90, tf: 70, sf: 10, uf: 125, ff: 205 })] },
  barbellrow: { eq: 'bar', f: [P({ k: 62, tf: 22, sf: -10, uf: 0, ff: 0 }), P({ k: 62, tf: 22, sf: -10, uf: -62, ff: 25 })] },
  curl: { eq: 'db', f: [P({ uf: 2, ff: 2 }), P({ uf: 8, ff: 150 })] },
  rower: { scene: 'rower', anchor: 'seat', f: [P({ k: 22, tf: 140, sf: 30, uf: 90, ff: 90 }), P({ k: -25, tf: 94, sf: 94, uf: -40, ff: 80 })] },
  bike: { scene: 'bike', anchor: 'bike', f: [P({ k: 30, tf: 70, sf: -10, tb: 20, sb: -5, uf: 55, ff: 80 }), P({ k: 30, tf: 20, sf: -5, tb: 70, sb: -10, uf: 70, ff: 95 })] },
  ski: { scene: 'ski', f: [P({ uf: 165, ff: 165 }), P({ k: 55, tf: 35, sf: -15, uf: -25, ff: -30 })] },
  ropeclimb: { scene: 'rope', anchor: 'rope', f: [P({ k: -3, tf: 95, sf: 0, uf: 170, ff: 175, ub: 150, fb: 175 }), P({ k: 0, tf: 20, sf: -10, uf: 150, ff: 175, ub: 170, fb: 178, lift: .3 })] },
  jumprope: { scene: 'jumprope', f: [P({ uf: -15, ff: 40, lift: 0 }), P({ uf: -15, ff: 40, lift: .14, tf: 8, sf: -8 })] },
  run: { f: [P({ k: 10, tf: 55, sf: -30, tb: -30, sb: -80, uf: -40, ff: 40, ub: 45, fb: 120 }), P({ k: 10, tf: -30, sf: -80, tb: 55, sb: -30, uf: 45, ff: 120, ub: -40, fb: 40, lift: .05 })] }
};

const lerp = (a, b, t) => a + (b - a) * t;
const dd = (a, l) => [Math.sin(a * Math.PI / 180) * l, -Math.cos(a * Math.PI / 180) * l];
const add = (p, v) => [p[0] + v[0], p[1] + v[1]];

function solve(p, anim) {
  const tb = p.tb == null ? p.tf : p.tb, sb = p.sb == null ? p.sf : p.sb;
  const ub = p.ub == null ? p.uf : p.ub, fb = p.fb == null ? p.ff : p.fb;
  const hip = [0, 0];
  const kv = [Math.sin(p.k * Math.PI / 180), Math.cos(p.k * Math.PI / 180)];
  const sh = [kv[0] * L.to, kv[1] * L.to];
  const head = [sh[0] + kv[0] * (L.neck + L.head), sh[1] + kv[1] * (L.neck + L.head)];
  const leg = (t, s) => { const kn = add(hip, dd(t, L.th)), an = add(kn, dd(s, L.sh)); return { kn, an, toe: add(an, dd(s + 90, .14)) }; };
  const arm = (u, f) => { const el = add(sh, dd(u, L.ua)); return { el, ha: add(el, dd(f, L.fa)) }; };
  const pt = { hip, sh, head, lf: leg(p.tf, p.sf), lb: leg(tb, sb), af: arm(p.uf, p.ff), ab: arm(ub, fb) };
  let tx = p.dx, ty = 0;
  const an = anim.anchor || 'ground';
  if (an === 'hang') { tx = -pt.af.ha[0]; ty = 2.3 - pt.af.ha[1]; }
  else if (an === 'dip') { tx = -pt.af.ha[0]; ty = 1.05 - pt.af.ha[1]; }
  else if (an === 'rope') { tx = .06 - pt.af.ha[0]; ty = 1.95 - pt.af.ha[1] + p.lift; }
  else if (an === 'seat') { tx = -.2; ty = .34; }
  else if (an === 'bike') { tx = -.1; ty = .86; }
  else if (an === 'bench') { tx = .15; ty = .52; }
  else {
    const ys = [pt.lf.an[1], pt.lf.toe[1], pt.lb.an[1], pt.lb.toe[1], pt.lf.kn[1], pt.lb.kn[1], pt.af.ha[1], pt.ab.ha[1], pt.head[1] - L.head, hip[1] - .08];
    ty = -Math.min(...ys) + p.lift;
  }
  return { pt, tx, ty };
}

function pose(anim, t) {
  const f = anim.f, n = f.length;
  if (n === 1) return f[0];
  // aller-retour (ping-pong) sauf pour les mouvements qui bouclent
  const loop = anim.loop;
  const span = loop ? n : (n - 1) * 2;
  let x = (t % 1) * span, i = Math.floor(x), u = x - i;
  let a, b;
  if (loop) { a = f[i % n]; b = f[(i + 1) % n]; }
  else { const seq = f.concat(f.slice(1, -1).reverse()); a = seq[i % seq.length]; b = seq[(i + 1) % seq.length]; }
  u = u < .25 ? 0 : u > .85 ? 1 : (u - .25) / .6;
  u = u * u * (3 - 2 * u);
  const o = {};
  for (const k in BASE) {
    const va = a[k] == null ? (k === 'tb' ? a.tf : k === 'sb' ? a.sf : k === 'ub' ? a.uf : k === 'fb' ? a.ff : 0) : a[k];
    const vb = b[k] == null ? (k === 'tb' ? b.tf : k === 'sb' ? b.sf : k === 'ub' ? b.uf : k === 'fb' ? b.ff : 0) : b[k];
    o[k] = lerp(va, vb, u);
  }
  return o;
}

const Y = y => (2.55 - y).toFixed(3);
const X = x => x.toFixed(3);
const line = (a, b, w, c) => `<line x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(b[0])}" y2="${Y(b[1])}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
const circ = (p, r, fill, extra = '') => `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="${r}" fill="${fill}" ${extra}/>`;

function scene(anim, pt, tx, ty, p, t) {
  const T = q => [q[0] + tx, q[1] + ty];
  const s = anim.scene, o = [];
  const metal = 'var(--fig-metal)';
  if (s === 'bar') { o.push(`<line x1="-1.05" y1="${Y(2.3)}" x2="1.15" y2="${Y(2.3)}" stroke="${metal}" stroke-width=".02" opacity=".5"/>`, circ([0, 2.3], .035, metal)); }
  if (s === 'box') o.push(`<rect x="-.28" y="${Y(.6)}" width=".62" height=".6" rx=".03" fill="var(--fig-wood)"/>`);
  if (s === 'target') o.push(`<rect x=".72" y="${Y(2.55)}" width=".06" height="2.55" fill="${metal}" opacity=".35"/><rect x=".55" y="${Y(2.45)}" width=".17" height=".12" fill="var(--red)"/>`);
  if (s === 'wall') o.push(`<rect x="-.62" y="0" width=".05" height="2.55" fill="${metal}" opacity=".35"/>`);
  if (s === 'dip') o.push(`<line x1="-.5" y1="${Y(1.05)}" x2=".6" y2="${Y(1.05)}" stroke="${metal}" stroke-width=".035" stroke-linecap="round"/><line x1=".5" y1="${Y(1.05)}" x2=".5" y2="${Y(0)}" stroke="${metal}" stroke-width=".03"/><line x1="-.4" y1="${Y(1.05)}" x2="-.4" y2="${Y(0)}" stroke="${metal}" stroke-width=".03"/>`);
  if (s === 'rope') o.push(`<line x1=".06" y1="0" x2=".06" y2="${Y(0)}" stroke="var(--fig-wood)" stroke-width=".04"/>`);
  if (s === 'bench') { const sh = T(pt.sh); o.push(`<rect x="${X(sh[0] - .35)}" y="${Y(.42)}" width=".42" height=".08" rx=".02" fill="${metal}"/><rect x="${X(sh[0] - .2)}" y="${Y(.34)}" width=".05" height=".34" fill="${metal}"/>`); }
  if (s === 'flatbench') o.push(`<rect x="-.75" y="${Y(.44)}" width="1.05" height=".07" rx=".02" fill="${metal}"/><rect x="-.55" y="${Y(.37)}" width=".05" height=".37" fill="${metal}"/><rect x="0" y="${Y(.37)}" width=".05" height=".37" fill="${metal}"/>`);
  if (s === 'rower') {
    const ha = T(pt.af.ha);
    o.push(`<line x1="-.9" y1="${Y(.18)}" x2="1.0" y2="${Y(.18)}" stroke="${metal}" stroke-width=".05" stroke-linecap="round"/>`, circ([1.02, .38], .24, 'none', `stroke="${metal}" stroke-width=".05"`),
      `<line x1="${X(ha[0])}" y1="${Y(ha[1])}" x2="1.02" y2="${Y(.38)}" stroke="${metal}" stroke-width=".012"/>`, `<rect x="${X(tx - .12)}" y="${Y(.34)}" width=".24" height=".06" rx=".02" fill="${metal}"/>`, `<line x1=".72" y1="${Y(.18)}" x2=".78" y2="${Y(.5)}" stroke="${metal}" stroke-width=".04"/>`);
  }
  if (s === 'bike') o.push(circ([.75, .36], .34, 'none', `stroke="${metal}" stroke-width=".05"`), `<path d="M${X(tx)} ${Y(.82)} L${X(tx + .12)} ${Y(.3)} L.75 ${Y(.36)} M${X(tx + .12)} ${Y(.3)} L.62 ${Y(1.08)}" stroke="${metal}" stroke-width=".05" fill="none" stroke-linecap="round"/>`, `<line x1="-.35" y1="${Y(.02)}" x2=".95" y2="${Y(.02)}" stroke="${metal}" stroke-width=".04"/>`);
  if (s === 'ski') { const ha = T(pt.af.ha); o.push(`<rect x=".72" y="${Y(2.4)}" width=".14" height="2.4" rx=".03" fill="${metal}" opacity=".7"/>`, `<line x1=".76" y1="${Y(2.2)}" x2="${X(ha[0])}" y2="${Y(ha[1])}" stroke="${metal}" stroke-width=".012"/>`); }
  if (s === 'jumprope') {
    const ha = T(pt.af.ha), ph = Math.cos(t * Math.PI * 2 * (anim.f.length > 1 ? 1 : 1));
    const ry = ph > 0 ? -.03 + ty * 0 : 2.35;
    o.push(`<path d="M${X(ha[0])} ${Y(ha[1])} Q${X(ha[0] + .38)} ${Y(ry)} ${X(ha[0] - .05)} ${Y(ha[1])}" fill="none" stroke="var(--red)" stroke-width=".018"/>`);
  }
  return o.join('');
}

function equip(anim, pt, tx, ty) {
  const T = q => [q[0] + tx, q[1] + ty];
  const ha = T(pt.af.ha);
  if (anim.eq === 'bar') {
    let c = ha;
    if (anim.at === 'back') c = T([pt.sh[0] - .07, pt.sh[1] + .02]);
    if (anim.at === 'hip') c = T([pt.hip[0] + .04, pt.hip[1] + .12]);
    return circ(c, .225, 'var(--plate)') + circ(c, .16, 'none', 'stroke="var(--plate-ring)" stroke-width=".012"') + circ(c, .035, 'var(--fig-metal)');
  }
  if (anim.eq === 'db') return circ(ha, .075, 'var(--fig-metal)') + circ(ha, .03, 'var(--bg)');
  if (anim.eq === 'kb' || anim.eq === 'kbchest') {
    const fa = T(pt.af.el), v = [ha[0] - fa[0], ha[1] - fa[1]], n = Math.hypot(...v) || 1;
    const c = anim.eq === 'kbchest' ? [ha[0], ha[1] - .1] : [ha[0] + v[0] / n * .12, ha[1] + v[1] / n * .12];
    return circ(c, .1, 'var(--fig-metal)') + `<circle cx="${X(ha[0])}" cy="${Y(ha[1])}" r=".045" fill="none" stroke="var(--fig-metal)" stroke-width=".022"/>`;
  }
  if (anim.eq === 'ball') { const c = [ha[0] + .1, ha[1] + .02]; return circ(c, .16, 'var(--ball)') + `<path d="M${X(c[0] - .16)} ${Y(c[1])} h.32" stroke="var(--bg)" stroke-width=".015" opacity=".6"/>`; }
  return '';
}

function draw(anim, t) {
  const p = pose(anim, t);
  const { pt, tx, ty } = solve(p, anim);
  const T = q => [q[0] + tx, q[1] + ty];
  const ink = 'var(--fig-ink)', ink2 = 'var(--fig-ink2)';
  const o = [];
  o.push(`<line x1="-1.2" y1="${Y(0)}" x2="1.4" y2="${Y(0)}" stroke="var(--fig-floor)" stroke-width=".03"/>`);
  o.push(scene(anim, pt, tx, ty, p, t));
  // membres arrière
  o.push(line(T(pt.sh), T(pt.ab.el), .085, ink2), line(T(pt.ab.el), T(pt.ab.ha), .07, ink2));
  o.push(line(T(pt.hip), T(pt.lb.kn), .12, ink2), line(T(pt.lb.kn), T(pt.lb.an), .09, ink2), line(T(pt.lb.an), T(pt.lb.toe), .06, ink2));
  // buste et tête
  o.push(line(T(pt.hip), T(pt.sh), .2, ink));
  o.push(circ(T(pt.head), L.head, ink));
  // membres avant
  o.push(line(T(pt.hip), T(pt.lf.kn), .125, ink), line(T(pt.lf.kn), T(pt.lf.an), .095, ink), line(T(pt.lf.an), T(pt.lf.toe), .065, ink));
  o.push(line(T(pt.sh), T(pt.af.el), .09, ink), line(T(pt.af.el), T(pt.af.ha), .075, ink));
  o.push(equip(anim, pt, tx, ty));
  return o.join('');
}

// Monte une figure dans un élément ; animée si demandé
CH.figure = (el, animKey, opts = {}) => {
  const anim = A[animKey];
  if (!anim) { el.innerHTML = ''; return null; }
  el.innerHTML = `<svg viewBox="-1.15 -.05 2.5 2.65" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Mouvement"></svg>`;
  const svg = el.firstChild;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!opts.animate || reduce) { svg.innerHTML = draw(anim, opts.t == null ? .5 : opts.t); return null; }
  const dur = (anim.f.length > 2 ? 1100 : 1300) * (anim.loop ? anim.f.length : (anim.f.length - 1) * 2) / 2;
  let raf, t0 = performance.now();
  const step = now => { svg.innerHTML = draw(anim, ((now - t0) / dur) % 1); raf = requestAnimationFrame(step); };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
};
CH.hasAnim = k => !!A[k];
}
