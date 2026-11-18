/* Chalk — lecture du texte libre d'une séance (règles locales, sans IA) */
window.CH = window.CH || {};
{
const norm = CH.norm;
const esc = s => s.replace(/[.*+?^${}()|[\]\\&]/g, m => '\\' + m);

const STOP = new Set(('de des du la le les l a au aux avec puis et en pour fini finir fin par j ai fait faire sur un une min mn kg reps rep repetitions series serie tours tour rounds round ' +
  'x sec s total chaque apres avant puis ensuite encore lourd leger leg legers bien mal assez tres trop plus moins max maximum sans charge poids pdc ' +
  'je me suis on c est ca cetait etait ete pas peu kilos kilo km m cal score temps environ the of and with then my ok nickel dur facile top bon bonne').split(' '));
const NOTE = /\b(echauffement|echauf|warm ?up|mobilite|etirements?|stretching|repos|recup|recuperation|cool ?down|retour au calme|technique|skill)\b/;

function buildMatcher(exos) {
  const list = [];
  for (const e of exos) for (const a of e.aliases) {
    const n = norm(a);
    if (n.length < 2) continue;
    list.push({ n, e, re: new RegExp('(^|[^a-z0-9])(' + esc(n) + ')(s|es)?(?=[^a-z0-9]|$)', 'g') });
  }
  list.sort((a, b) => b.n.length - a.n.length);
  return list;
}

function findExos(s, matcher) {
  const taken = new Array(s.length).fill(false), found = [];
  for (const m of matcher) {
    m.re.lastIndex = 0;
    let r;
    while ((r = m.re.exec(s))) {
      const start = r.index + r[1].length, end = start + r[2].length + (r[3] || '').length;
      let free = true;
      for (let i = start; i < end; i++) if (taken[i]) { free = false; break; }
      if (!free) continue;
      for (let i = start; i < end; i++) taken[i] = true;
      found.push({ start, end, e: m.e });
    }
  }
  return found.sort((a, b) => a.start - b.start);
}

// coupe "10 thrusters 40kg 10 pull ups" en deux morceaux
function splitMulti(s, hits) {
  if (hits.length < 2) return [{ s, hit: hits[0] || null }];
  const cuts = [0];
  for (let i = 1; i < hits.length; i++) {
    const before = s.slice(cuts[cuts.length - 1], hits[i].start);
    const m = before.match(/(\d+\s*(?:x\s*)?)$/);
    cuts.push(hits[i].start - (m ? m[1].length : 0));
  }
  return cuts.map((c, i) => {
    const end = i + 1 < cuts.length ? cuts[i + 1] : s.length;
    return { s: s.slice(c, end), hit: hits[i], off: c };
  });
}

function parseNumbers(s) {
  const out = {};
  let t = ' ' + s + ' ';
  const eat = (re, fn) => { t = t.replace(re, (...a) => { fn(a); return ' '; }); };
  eat(/§t(\d+)§/g, a => { out.sec = +a[1]; });
  eat(/(\d+)\s*[x×*]\s*(\d+(?:\.\d+)?)\s*(km|m|cal|s|sec|min)?(?![a-z0-9])/g, a => {
    out.sets = +a[1];
    const v = +a[2], u = a[3];
    if (u === 'm') out.dist = v; else if (u === 'km') out.dist = v * 1000;
    else if (u === 'cal') out.cal = v; else if (u === 's' || u === 'sec') out.sec = v;
    else if (u === 'min') out.sec = v * 60; else out.reps = v;
  });
  eat(/(\d+)\s*series?\s*(?:de\s*)?(\d+)/g, a => { out.sets = +a[1]; out.reps = +a[2]; });
  eat(/(\d+)\s*series?\b/g, a => { out.sets = +a[1]; });
  eat(/(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)+)\s*(kg|kilos?|k|lbs?)?(?![a-z0-9])/g, a => {
    const vals = a[1].split('/').map(Number), lb = /lb/.test(a[2] || '');
    out.kgs = vals.map(v => lb ? Math.round(v * .4536 * 2) / 2 : v);
  });
  eat(/(\d+(?:\.\d+)?)\s*(kg|kilos?|k)(?![a-z0-9])/g, a => { (out.kgs = out.kgs || []).push(+a[1]); });
  eat(/(\d+(?:\.\d+)?)\s*(lbs?)(?![a-z0-9])/g, a => { (out.kgs = out.kgs || []).push(Math.round(+a[1] * .4536 * 2) / 2); });
  eat(/(\d+(?:\.\d+)?)\s*%/g, a => { out.pct = +a[1]; });
  eat(/(\d+(?:\.\d+)?)\s*km(?![a-z0-9])/g, a => { out.dist = +a[1] * 1000; });
  eat(/(\d+)\s*m(?![a-z0-9])/g, a => { out.dist = +a[1]; });
  eat(/(\d+)\s*(cal|calories|kcal)(?![a-z0-9])/g, a => { out.cal = +a[1]; });
  eat(/(\d+)\s*(min|mn|minutes?)(?![a-z0-9])/g, a => { out.sec = (out.sec || 0) + +a[1] * 60; });
  eat(/(\d+)\s*(s|sec|secondes?)(?![a-z0-9])/g, a => { out.sec = (out.sec || 0) + +a[1]; });
  eat(/(\d+)\s*(reps?|repetitions?|fois)(?![a-z0-9])/g, a => { out.reps = +a[1]; });
  eat(/(?:@|\ba)\s*(\d+(?:\.\d+)?)(?![a-z0-9])/g, a => { out.at = +a[1]; });
  const rest = t.match(/\d+(?:\.\d+)?/g);
  if (rest) out.loose = rest.map(Number);
  out.words = t.replace(/[^a-z& ]/g, ' ').split(/\s+/).filter(w => w && !STOP.has(w));
  return out;
}

function header(s) {
  let m, h = null, rest = s;
  const take = (re, mk) => {
    if (h) return;
    const r = rest.match(re);
    if (r) { h = mk(r); rest = rest.replace(r[0], ' '); }
  };
  take(/\bamrap\s*(?:de\s*)?(\d+)?\s*(?:min|mn|')?/, r => ({ kind: 'amrap', minutes: r[1] ? +r[1] : null }));
  take(/\be(\d)?mom\s*(?:de\s*)?(\d+)?\s*(?:min|mn|')?|\botm\s*(\d+)?/, r => ({ kind: 'emom', every: r[1] ? +r[1] : 1, minutes: r[2] ? +r[2] : (r[3] ? +r[3] : null) }));
  take(/\btabata\b/, () => ({ kind: 'tabata', minutes: 4 }));
  take(/\b(\d+)\s*(?:rounds?|tours?|rft)\b(?:\s*(?:for time|pour le temps))?/, r => ({ kind: 'rounds', rounds: +r[1] }));
  take(/\b(for time|fortime|pour le temps|chrono|wod)\b/, () => ({ kind: 'fortime' }));
  const sc = rest.match(/\b(\d+(?:~\d+){2,})\b/);
  if (sc) { h = h || { kind: 'fortime' }; h.scheme = sc[1].split('~').map(Number); rest = rest.replace(sc[0], ' '); }
  if (h) {
    const cap = rest.match(/\b(?:time cap|cap)\s*(\d+)/);
    if (cap) { h.cap = +cap[1]; rest = rest.replace(cap[0], ' '); }
  }
  return h ? { h, rest } : null;
}

function prep(text) {
  return (text || '').split('\n').map(l => norm(l.replace(/(\d)\s*-\s*(?=\d)/g, '$1~'))).join('\n')
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/(\d{1,2}):(\d{2})(?::(\d{2}))?/g, (m, a, b, c) => '§t' + (c ? (+a * 3600 + +b * 60 + +c) : (+a * 60 + +b)) + '§')
    .replace(/(\d+)\s*'\s*(\d+)?/g, (m, a, b) => '§t' + (+a * 60 + (+b || 0)) + '§');
}

function parse(text, exos) {
  const matcher = buildMatcher(exos);
  const blocks = [], unknown = [];
  let cur = null, sticky = false;
  const newBlock = h => { cur = Object.assign({ kind: 'strength', entries: [] }, h || {}); blocks.push(cur); return cur; };
  const rawLines = (text || '').split('\n');
  const lines = prep(text || '').split('\n');

  lines.forEach((line0, li) => {
    let line = line0.replace(/^\s*[-•*·>]+\s*/, '').trim();
    if (!line) { cur = null; sticky = false; return; }
    if (!sticky && cur && cur.kind !== 'strength') cur = null;
    const parts = line.split(':');
    let lineHadHeader = false, itemsAfterHeader = 0;
    parts.forEach(part => {
      const items = part.split(/[,;+]|\.(?!\d)|\bpuis\b|\bet\b|\bthen\b|\bensuite\b|\bsuivi de\b|\bfini par\b/);
      items.forEach(it0 => {
        let it = it0.trim();
        const hd = header(it);
        if (hd) { newBlock(hd.h); it = hd.rest.trim(); lineHadHeader = true; sticky = false; }
        if (!it) return;
        const hits = findExos(it, matcher);
        if (!hits.length) {
          const n = parseNumbers(it);
          if (cur && cur.kind !== 'strength' && (n.sec || /score|tours?|rounds?/.test(it))) {
            if (n.sec) cur.timeSec = n.sec;
            const sc = it.match(/(\d+)\s*(?:tours?|rounds?)(?:\s*(?:et|\+)\s*(\d+))?/);
            if (sc) cur.score = sc[1] + ' tours' + (sc[2] ? ' + ' + sc[2] : '');
            return;
          }
          if (NOTE.test(it)) return;
          const words = n.words.filter(w => w.length > 1);
          if (words.length && words.join(' ').length >= 3) {
            const raw = (rawLines[li] || '').trim();
            const guess = words.join(' ');
            if (!unknown.some(u => u.guess === guess)) unknown.push({ guess, raw, piece: it });
          }
          return;
        }
        splitMulti(it, hits).forEach(seg => {
          const e = seg.hit.e;
          const local = seg.s.slice(0, seg.hit.start - (seg.off || 0)) + ' ' + seg.s.slice(seg.hit.end - (seg.off || 0));
          const n = parseNumbers(local);
          const isLoad = e.cat === 'halt' || e.cat === 'muscu' || /kb|db|haltere|kettlebell/.test(seg.s);
          const strengthLike = n.sets && (n.reps || n.kgs || n.at);
          if (!cur || (strengthLike && cur.kind !== 'strength')) { newBlock(); sticky = false; }
          const en = { exo: e.id, name: e.name };
          if (NOTE.test(it)) en.warmup = true;
          if (n.sets) en.sets = n.sets;
          if (n.reps) en.reps = n.reps;
          if (n.dist) en.dist = n.dist;
          if (n.cal) en.cal = n.cal;
          if (n.sec) en.sec = n.sec;
          if (n.pct) en.pct = n.pct;
          let kgs = n.kgs || [];
          if (!kgs.length && n.at && isLoad) kgs = [n.at];
          if (n.loose && n.loose.length) {
            if (!en.reps && !en.dist && !en.cal && !en.sec) en.reps = n.loose[0];
            else if (!kgs.length && isLoad && n.loose.length && en.sets) kgs = [n.loose[n.loose.length - 1]];
          }
          if (kgs.length) { en.kg = Math.max(...kgs); if (kgs.length > 1) en.kgs = kgs; }
          if (!en.sets && en.kgs) en.sets = en.kgs.length;
          if (cur.scheme && !en.reps) en.reps = cur.scheme.reduce((a, b) => a + b, 0);
          if (cur.kind === 'strength' && en.reps && !en.sets) en.sets = 1;
          cur.entries.push(en);
          if (lineHadHeader) itemsAfterHeader++;
        });
      });
    });
    // un en-tête suivi de ":" sans exercice sur la ligne garde le bloc ouvert pour les lignes suivantes
    if (lineHadHeader) sticky = itemsAfterHeader === 0 || /:\s*$/.test(line);
  });
  const clean = blocks.filter(b => b.entries.length || b.timeSec || b.score);
  return { blocks: clean, unknown, count: clean.reduce((a, b) => a + b.entries.length, 0) };
}

CH.parse = parse;
CH.parseNumbers = parseNumbers;
CH.prepText = prep;
}
