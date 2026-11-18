/* Chalk — graphiques SVG dessinés à la taille réelle */
window.CH = window.CH || {};
{
const nice = (lo, hi, n = 4) => {
  if (lo === hi) { lo -= 1; hi += 1; }
  const span = hi - lo, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= step0);
  const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step;
  const t = []; for (let v = a; v <= b + 1e-9; v += step) t.push(+v.toFixed(6));
  return t;
};
const fmtD = d => d.getDate() + '/' + (d.getMonth() + 1);

function mount(host, draw) {
  host.innerHTML = '<svg></svg>';
  const s = host.firstChild;
  const go = () => { const W = host.clientWidth, H = host.clientHeight; if (W && H) s.innerHTML = draw(W, H); };
  if (host._ro) host._ro.disconnect();
  host._ro = new ResizeObserver(go); host._ro.observe(host); go();
}

// séries : [{pts:[{x:Date,y}], color, dash, name, width}]
CH.lineChart = (host, series, o = {}) => mount(host, (W, H) => {
  const all = series.flatMap(s => s.pts);
  if (!all.length) return '';
  const m = { l: 42, r: o.right || 56, t: 16, b: 28 };
  if (W < 520) m.r = Math.min(m.r, 44);
  const xs = all.map(p => +p.x), ys = all.map(p => p.y);
  let x0 = Math.min(...xs), x1 = Math.max(...xs); if (x0 === x1) { x0 -= 864e5 * 3; x1 += 864e5 * 3; }
  const ticks = nice(o.min != null ? Math.min(o.min, ...ys) : Math.min(...ys), Math.max(...ys));
  const y0 = ticks[0], y1 = ticks[ticks.length - 1];
  const X = x => m.l + (x - x0) / (x1 - x0) * (W - m.l - m.r);
  const Y = y => o.invert ? m.t + (y - y0) / (y1 - y0) * (H - m.t - m.b) : H - m.b - (y - y0) / (y1 - y0) * (H - m.t - m.b);
  const fy = o.fmt || (v => Math.round(v * 10) / 10);
  let g = '';
  ticks.forEach((t, i) => {
    if (W < 520 && i % 2 && i !== ticks.length - 1) return;
    g += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--line)"/><text x="${m.l - 8}" y="${Y(t) + 4}" text-anchor="end">${fy(t)}</text>`;
  });
  const nx = W < 520 ? 3 : 5;
  for (let i = 0; i < nx; i++) { const x = x0 + (x1 - x0) * i / (nx - 1); g += `<text x="${X(x)}" y="${H - 6}" text-anchor="${i === 0 ? 'start' : i === nx - 1 ? 'end' : 'middle'}">${fmtD(new Date(x))}</text>`; }
  series.forEach(s => {
    if (!s.pts.length) return;
    const pts = s.pts.slice().sort((a, b) => a.x - b.x);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + X(+p.x).toFixed(1) + ' ' + Y(p.y).toFixed(1)).join('');
    if (s.area) g += `<path d="${d}L${X(+pts[pts.length - 1].x)} ${H - m.b}L${X(+pts[0].x)} ${H - m.b}Z" fill="${s.color}" opacity=".12"/>`;
    g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.width || 3}" stroke-linejoin="round" stroke-linecap="round" ${s.dash ? 'stroke-dasharray="5 6"' : ''}/>`;
    if (!s.dash) pts.forEach(p => { g += `<circle cx="${X(+p.x)}" cy="${Y(p.y)}" r="${pts.length > 30 ? 2.5 : 4}" fill="${s.color}"/>`; });
    const lp = pts[pts.length - 1];
    if (s.name) g += `<text class="lbl" x="${X(+lp.x) + 8}" y="${Y(lp.y) + 4}" style="fill:${s.color}">${s.name}</text>`;
  });
  return g;
});

// colonnes : [{label, v, color}]
CH.colChart = (host, cols, o = {}) => mount(host, (W, H) => {
  if (!cols.length) return '';
  const m = { l: 36, r: 8, t: 22, b: 26 };
  const max = Math.max(1, ...cols.map(c => c.v));
  const ticks = nice(0, max, 3), top = ticks[ticks.length - 1];
  const bw = (W - m.l - m.r) / cols.length;
  let g = '';
  ticks.forEach(t => { const y = H - m.b - t / top * (H - m.t - m.b); g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y}" y2="${y}" stroke="var(--line)"/><text x="${m.l - 6}" y="${y + 4}" text-anchor="end">${t}</text>`; });
  cols.forEach((c, i) => {
    const h = c.v / top * (H - m.t - m.b), x = m.l + i * bw + bw * .18, w = bw * .64, y = H - m.b - h;
    g += `<rect x="${x}" y="${y}" width="${w}" height="${Math.max(0, h)}" rx="${Math.min(6, w / 3)}" fill="${c.color || 'var(--ink)'}"/>`;
    if (c.v && (W > 520 || i === cols.length - 1)) g += `<text class="lbl" x="${x + w / 2}" y="${y - 6}" text-anchor="middle">${o.fmt ? o.fmt(c.v) : c.v}</text>`;
    if (W > 520 || i % 2 === (cols.length - 1) % 2) g += `<text x="${x + w / 2}" y="${H - 6}" text-anchor="middle">${c.label}</text>`;
  });
  return g;
});
}
