/* Chalk — calculs : calories, muscles, progression, stockage */
window.CH = window.CH || {};
{
const KEY = 'chalk.v1';

CH.load = () => {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.sessions) return d; } catch (e) {}
  return null;
};
CH.save = d => { try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (e) { return false; } };

CH.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

CH.allExos = d => CH.BASE_EXOS.concat((d.customExos || []).map(c => Object.assign({ custom: true, anim: null }, c, { aliases: [c.name].concat(c.aliases || []) })));
CH.exoMap = d => { const m = {}; CH.allExos(d).forEach(e => { m[e.id] = e; }); return m; };

// --- Calories (MET corrigé par le métabolisme de base Mifflin-St Jeor) ---
CH.bmr = p => {
  if (!p || !p.weight || !p.height || !p.age || !p.sex) return null;
  return 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'F' ? -161 : 5);
};
CH.met = s => {
  const rpe = s.rpe || 6;
  if (s.type === 'course' && s.run && s.run.km && s.run.sec) {
    const v = s.run.km * 1000 / (s.run.sec / 60); // m/min
    const grade = s.run.dplus ? s.run.dplus / (s.run.km * 1000) : 0;
    const vo2 = v < 134 ? 3.5 + 0.1 * v + 1.8 * v * grade : 3.5 + 0.2 * v + 0.9 * v * grade; // ACSM marche / course
    return vo2 / 3.5;
  }
  if (s.type === 'muscu') return 2.5 + 0.4 * rpe;
  if (s.type === 'mixte') return 2.8 + 0.52 * rpe;
  return 3 + 0.65 * rpe; // CrossFit
};
CH.kcal = (s, p) => {
  const b = CH.bmr(p);
  const min = s.type === 'course' && s.run && s.run.sec ? s.run.sec / 60 : s.duration;
  if (!b || !min) return null;
  return Math.round(CH.met(s) * b / 1440 * min);
};

// --- Charge musculaire : "séries équivalentes" par muscle ---
CH.entryUnits = (en, b) => {
  if (en.warmup) return 0.3;
  if (b.kind === 'strength') return en.sets || 1;
  const n = Math.max(1, b.entries.length);
  if (b.kind === 'rounds') return b.rounds || 3;
  if (b.kind === 'emom') return Math.max(1, Math.round((b.minutes || 10) / n / (b.every || 1)));
  if (b.kind === 'tabata') return 4;
  if (b.scheme) return b.scheme.length;
  if (b.minutes) return Math.max(1, Math.round(b.minutes / n / 1.5));
  return 3;
};
CH.muscleLoad = (s, map) => {
  const out = {};
  const add = (m, u) => { for (const k in m) out[k] = (out[k] || 0) + m[k] * u; };
  if (s.type === 'course' && s.run) {
    add({ quads: .8, calves: .9, hams: .6, glutes: .6, abs: .15 }, Math.max(1, (s.run.km || 0) / 1.5));
    return out;
  }
  (s.blocks || []).forEach(b => b.entries.forEach(en => {
    const e = map[en.exo];
    if (e) add(e.m || {}, CH.entryUnits(en, b));
  }));
  return out;
};
CH.sumLoads = (sessions, map) => {
  const out = {};
  sessions.forEach(s => { const l = CH.muscleLoad(s, map); for (const k in l) out[k] = (out[k] || 0) + l[k]; });
  return out;
};

// --- Progression par exercice ---
CH.e1rm = (kg, reps) => (!kg ? 0 : (!reps || reps <= 1 ? kg : reps > 12 ? kg : kg * (1 + reps / 30)));
CH.exoHistory = (sessions, id) => {
  const pts = [];
  sessions.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach(s => {
    let max = 0, e1 = 0, vol = 0, reps = 0, last = null;
    (s.blocks || []).forEach(b => b.entries.forEach(en => {
      if (en.exo !== id || en.warmup) return;
      last = en;
      const sets = en.sets || 1, r = en.reps || 0;
      if (en.kg) { max = Math.max(max, en.kg); e1 = Math.max(e1, CH.e1rm(en.kg, r)); vol += sets * r * en.kg; }
      reps = Math.max(reps, r);
    }));
    if (last) pts.push({ date: s.date, id: s.id, max, e1rm: Math.round(e1 * 10) / 10, vol: Math.round(vol), reps, entry: last });
  });
  return pts;
};
CH.exoStats = (sessions, id) => {
  const h = CH.exoHistory(sessions, id);
  if (!h.length) return null;
  let pr = null;
  h.forEach(p => { if (p.max && (!pr || p.max > pr.max)) pr = p; });
  return { count: h.length, last: h[h.length - 1], pr, first: h[0], hist: h };
};

// --- Course ---
CH.pace = (km, sec) => (km && sec ? sec / km : null);
CH.fmtPace = sp => (sp ? Math.floor(sp / 60) + ':' + String(Math.round(sp % 60)).padStart(2, '0') : '–');
CH.fmtDur = sec => {
  if (!sec) return '–';
  const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = Math.round(sec % 60);
  return h ? h + 'h' + String(m).padStart(2, '0') : m + ':' + String(s).padStart(2, '0');
};
CH.parseDur = t => {
  t = (t || '').trim().replace(/h/i, ':').replace(/min|mn|'/i, ':').replace(/s|"/i, '');
  if (!t) return null;
  const p = t.split(':').filter(x => x !== '').map(Number);
  if (p.some(isNaN)) return null;
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return p[0] * 60;
};

// --- Dates ---
CH.today = () => { const d = new Date(); return CH.iso(d); };
CH.iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
CH.dateOf = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
CH.monday = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
CH.addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
CH.fmtDate = s => { const d = CH.dateOf(s); return JOURS[d.getDay()] + ' ' + d.getDate() + ' ' + MOIS[d.getMonth()]; };
CH.fmtShort = s => { const d = CH.dateOf(s); return d.getDate() + ' ' + MOIS[d.getMonth()]; };

// --- Données d'exemple (8 semaines) ---
CH.demo = () => {
  let seed = 7;
  const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  const sessions = [];
  const start = CH.addDays(CH.monday(new Date()), -7 * 8);
  const cf = [
    w => `Back squat 5x5 à ${50 + w * 2.5}kg\nAMRAP 12 min : 10 wall balls 6kg, 10 burpees, 200m run\nScore 5 tours + 4`,
    w => `Deadlift 5x3 à ${80 + w * 2.5}kg\nFor time 21-15-9 :\nThrusters 25kg\nPull-ups\nTemps ${9 - Math.floor(w / 3)}:${String(40 - w * 3).padStart(2, '0')}`,
    w => `Power clean 5x2 à ${40 + w * 1.5}kg\nEMOM 12 min : 12 cal rameur, 10 kb swings 16kg, 8 box jumps`,
    w => `Strict press 5x5 à ${25 + Math.floor(w / 2) * 2.5}kg\n5 rounds : 15 kb swings 16kg, 10 toes to bar, 15 double unders`
  ];
  const mu = w => `Hip thrust 4x10 à ${70 + w * 5}kg\nRDL 3x10 à ${40 + w * 2.5}kg\nFentes 3x12 12kg\nGainage 3x45 sec`;
  for (let w = 0; w <= 8; w++) {
    const days = [0, 2, 3, 5];
    days.forEach((dd, i) => {
      const date = CH.iso(CH.addDays(start, w * 7 + dd));
      if (date > CH.today()) return;
      const r = v => Math.max(1, Math.min(10, Math.round(v + (rnd() - .5) * 3)));
      let s;
      if (i === 1) {
        const km = [5, 6, 5.5, 7, 6, 8, 6.5, 9, 7.5][w], pace = 345 - w * 4 + rnd() * 10;
        s = { type: 'course', duration: Math.round(km * pace / 60), run: { km, sec: Math.round(km * pace), kind: w % 3 === 2 ? 'Fractionné' : (km > 7.5 ? 'Sortie longue' : 'Footing'), dplus: Math.round(rnd() * 60), text: w % 3 === 2 ? '8x400m récup 1min' : '' }, rpe: r(6) };
      } else if (i === 3) {
        s = { type: 'muscu', duration: 60, text: mu(w), rpe: r(7) };
      } else {
        s = { type: 'crossfit', duration: 60, text: cf[(w + i) % 4](w), rpe: r(8) };
      }
      s.id = CH.uid() + i; s.date = date; s.demo = true;
      s.before = { energie: r(7), motivation: r(8), sommeil: r(7), courbatures: r(4), stress: r(4) };
      s.after = { energie: r(6), fatigue: r(6), satisfaction: r(8) };
      sessions.push(s);
    });
  }
  return sessions;
};
}
