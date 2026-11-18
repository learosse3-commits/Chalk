/* Chalk — lecture du texte libre d'une séance (règles locales, sans IA)
   Comprend aussi bien les listes ("Back squat 5x5 60kg") que le récit
   ("on a appris le dumbbell snatch avec un poids de 10, j'en ai fait 30 reps à l'échauffement…") */
window.CH = window.CH || {};
{
const norm = CH.norm;
const esc = s => s.replace(/[.*+?^${}()|[\]\\&]/g, m => '\\' + m);

const STOP = new Set(('de des du d la le les l a au aux avec puis et en pour fini finir fin par j ai fait fais faits faire faite sur un une min mn kg reps rep repetitions series serie tours tour rounds round ' +
  'x sec s total chaque apres avant ensuite encore lourd leger legers bien mal assez tres trop plus moins max maximum sans charge poids pdc ' +
  'je j me m suis on c est ca cela cetait etait ete pas peu kilos kilo km m cal score temps environ the of and with then my ok nickel dur facile top bon bonne ' +
  'nous vous il elle ils elles mon ma mes ton ta son sa nos notre leur duo binome partenaire coach pendant que qui quand donc alors dirais dirai dire ' +
  'deja appris apprendre utilise utiliser utilisee entrainer entraine entrainement entraines passe passer passait passee devait devoir enchainer enchaine ' +
  'autant possible fois variantes variante plusieurs parallele toute tout tous toutes seance seances moment debut milieu ou y tete ensemble aussi meme ' +
  'travail travaille bosse taff session wod metcon partie bloc premier premiere deuxieme dernier derniere ici la vers environ genre style truc trucs ' +
  'sprint finisher force').split(' '));
const NOTE = /\b(echauffement|echauf|warm ?up|mobilite|etirements?|stretching|retour au calme|cool ?down)\b/;
const PRON = /(^|[^a-z])(ca|cela|ce mouvement|cet exercice|ces mouvements|la meme chose|pareil|le meme)(?=[^a-z]|$)/g;

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

function findHits(s, matcher) {
  const taken = new Array(s.length).fill(false), found = [];
  const mark = (start, end, e) => {
    for (let i = start; i < end; i++) if (taken[i]) return;
    for (let i = start; i < end; i++) taken[i] = true;
    found.push({ start, end, e });
  };
  for (const m of matcher) {
    m.re.lastIndex = 0;
    let r;
    while ((r = m.re.exec(s))) { const st = r.index + r[1].length; mark(st, st + r[2].length + (r[3] || '').length, m.e); }
  }
  PRON.lastIndex = 0;
  let r;
  while ((r = PRON.exec(s))) { const st = r.index + r[1].length; mark(st, st + r[2].length, 'REF'); }
  return found.sort((a, b) => a.start - b.start);
}

// coupe un morceau qui contient plusieurs exercices (ou "ça") ; les nombres juste avant un exercice lui appartiennent
const LEAD = /(\d+(?:\.\d+)?\s*(?:x\s*\d+\s*)?(?:reps?|repetitions?|series?|fois|tours?|rounds?|kg)?\s*(?:de |d |des |du )?)$/;
function segments(s, hits) {
  if (!hits.length) return [];
  const cuts = [0];
  for (let i = 1; i < hits.length; i++) {
    const before = s.slice(cuts[cuts.length - 1], hits[i].start);
    const m = before.match(LEAD);
    cuts.push(hits[i].start - (m ? m[1].length : 0));
  }
  return hits.map((h, i) => {
    const a = cuts[i], b = i + 1 < cuts.length ? cuts[i + 1] : s.length;
    const seg = s.slice(a, b);
    return { hit: h, text: seg.slice(0, Math.max(0, h.start - a)) + ' ' + seg.slice(Math.max(0, h.end - a)) };
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
  eat(/(\d+)\s*fois\b/g, a => { if (!out.sets) out.sets = +a[1]; });
  eat(/(?:poids|charge|haltere?s?|kettlebell|kb|db|barre|disques?|lest)\s*(?:de|a|avec)?\s*(\d+(?:\.\d+)?)\s*(?:kg|kilos?)?(?![a-z0-9])/g, a => { (out.kgs = out.kgs || []).push(+a[1]); });
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
  eat(/(\d+)\s*(reps?|repetitions?)(?![a-z0-9])/g, a => { if (out.reps == null) out.reps = +a[1]; });
  eat(/(?:@|\ba)\s*(\d+(?:\.\d+)?)(?![a-z0-9])/g, a => { out.at = +a[1]; });
  const rest = t.match(/\d+(?:\.\d+)?/g);
  if (rest) out.loose = rest.map(Number);
  out.words = t.replace(/[^a-z& ]/g, ' ').split(/\s+/).filter(w => w && w.length > 1 && !STOP.has(w));
  out.has = !!(out.sets || out.reps || out.kgs || out.dist || out.cal || out.sec || out.at || out.loose);
  return out;
}

// en-têtes de bloc écrits "à la liste" (AMRAP 12 min, EMOM 10, 5 tours, For time 21-15-9)
function header(s) {
  let h = null, rest = s;
  const take = (re, mk) => {
    if (h) return;
    const r = rest.match(re);
    if (r) { h = mk(r); rest = rest.replace(r[0], ' '); }
  };
  take(/\bamrap\s*(?:de\s*)?(\d+)?\s*(?:min|mn|minutes)?/, r => ({ kind: 'amrap', minutes: r[1] ? +r[1] : null }));
  take(/\be(\d)?mom\s*(?:de\s*)?(\d+)?\s*(?:min|mn|minutes)?|\botm\s*(\d+)?/, r => ({ kind: 'emom', every: r[1] ? +r[1] : 1, minutes: r[2] ? +r[2] : (r[3] ? +r[3] : null) }));
  take(/\btabata\b/, () => ({ kind: 'tabata', minutes: 4 }));
  take(/(^|[^a-z])(?<!fait |fais |score |realise |reussi |termine )(\d+)\s*(?:rounds?|tours?|rft)\b(?:\s*(?:for time|pour le temps))?(?!\s*(?:\+|et \d))/, r => ({ kind: 'rounds', rounds: +r[2] }));
  take(/\b(for time|fortime|pour le temps|chrono|le plus vite possible|le plus rapidement possible)\b/, () => ({ kind: 'fortime' }));
  // récit : "en 10 minutes ... autant de fois possible", "le plus de tours possible", "chaque minute"
  take(/\b(autant de (?:fois|tours|rounds)(?: que)?(?: possible)?|le (?:plus|max) de (?:tours|rounds)(?: possible)?|max(?:imum)? de (?:tours|rounds)|en boucle)\b/, () => ({ kind: 'amrap', minutes: null }));
  take(/\b(chaque minute|toutes les minutes|toutes les (\d) minutes)\b/, r => ({ kind: 'emom', every: r[2] ? +r[2] : 1, minutes: null }));
  const sc = rest.match(/\b(\d+(?:~\d+){2,})\b/);
  if (sc) { h = h || { kind: 'fortime' }; h.scheme = sc[1].split('~').map(Number); rest = rest.replace(sc[0], ' '); }
  if (h) {
    if (!h.minutes && (h.kind === 'amrap' || h.kind === 'emom')) {
      const mm = rest.match(/\b(?:en|pendant|sur|de)\s*(\d+)\s*(?:min|mn|minutes)\b/) || rest.match(/\b(\d+)\s*(?:min|mn|minutes)\b/);
      if (mm) { h.minutes = +mm[1]; rest = rest.replace(mm[0], ' '); }
    }
    const cap = rest.match(/\b(?:time cap|cap)\s*(\d+)/);
    if (cap) { h.cap = +cap[1]; rest = rest.replace(cap[0], ' '); }
  }
  return h ? { h, rest } : null;
}

function scoreOf(s) {
  const r = {};
  const t = s.match(/§t(\d+)§/);
  if (t) r.timeSec = +t[1];
  const sc = s.match(/(\d+)\s*(?:tours?|rounds?)(?:\s*(?:et|\+)\s*(\d+)(?:\s*reps?)?)?/);
  if (sc && /\b(fait|fais|score|realise|reussi|termine|boucle|complete)\b|\+|\bet \d/.test(s)) r.score = sc[1] + ' tours' + (sc[2] ? ' + ' + sc[2] : '');
  else if (sc && /^\s*(score\s*)?\d+\s*(tours?|rounds?)/.test(s)) r.score = sc[1] + ' tours';
  return (r.timeSec || r.score) ? r : null;
}

function prep(text) {
  return (text || '').split('\n').map(l => norm(l.replace(/(\d)\s*-\s*(?=\d)/g, '$1~'))).join('\n')
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/(\d{1,2}):(\d{2})(?::(\d{2}))?/g, (m, a, b, c) => '§t' + (c ? (+a * 3600 + +b * 60 + +c) : (+a * 60 + +b)) + '§')
    // fautes et abréviations courantes
    .replace(/\bpdt\b/g, 'pendant').replace(/\bfaisca\b/g, 'fais ca').replace(/\bfaitca\b/g, 'fait ca').replace(/\bnsuite\b/g, 'ensuite')
    .replace(/\bapres\s+ca\b/g, 'ensuite').replace(/\bderriere\b/g, 'ensuite').replace(/\bet\s+(?=ensuite\b)/g, '')
    // "3-4 fois" -> 4 fois ; "8-10 reps" -> 10 reps
    .replace(/\b(\d+)~(\d+)(?=\s*(?:fois|reps?|repetitions?|series?|tours?|rounds?|kg|min))/g, (m, a, b) => String(Math.max(+a, +b)));
}

function parse(text, exos) {
  const matcher = buildMatcher(exos);
  const blocks = [], unknown = [];
  let cur = null, sticky = false, last = null, lastMet = null;
  const newBlock = h => { cur = Object.assign({ kind: 'strength', entries: [] }, h || {}); blocks.push(cur); if (cur.kind !== 'strength') lastMet = cur; return cur; };
  const rawLines = (text || '').split('\n');

  const fill = (en, n, e, segText) => {
    const isLoad = e && (e.cat === 'halt' || e.cat === 'muscu' || /kb|db|haltere|kettlebell/.test(segText));
    if (n.sets && !en.sets) en.sets = n.sets;
    if (n.reps && !en.reps) en.reps = n.reps;
    if (n.dist) en.dist = n.dist;
    if (n.cal) en.cal = n.cal;
    if (n.sec && !en.sec) en.sec = n.sec;
    if (n.pct) en.pct = n.pct;
    let kgs = n.kgs || [];
    if (!kgs.length && n.at && isLoad) kgs = [n.at];
    if (n.loose && n.loose.length) {
      if (!en.reps && !en.dist && !en.cal && !en.sec && !n.sets) en.reps = n.loose[0];
      else if (!kgs.length && isLoad && en.sets) kgs = [n.loose[n.loose.length - 1]];
    }
    if (kgs.length) { en.kg = Math.max(...kgs); if (kgs.length > 1) en.kgs = kgs; else delete en.kgs; }
    if (!en.sets && en.kgs) en.sets = en.kgs.length;
    if (NOTE.test(segText)) en.warmup = true;
  };
  const finish = en => {
    if (cur && cur.scheme && !en.reps) en.reps = cur.scheme.reduce((a, b) => a + b, 0);
    if (cur && cur.kind === 'strength' && en.reps && !en.sets) en.sets = 1;
  };
  const ensure = strengthLike => {
    if (!cur || (strengthLike && cur.kind !== 'strength')) { newBlock(); sticky = false; }
  };
  // "ça", "pareil" ou des chiffres seuls : on complète le dernier exercice
  const toLast = (n, segText) => {
    if (!last || !n.has) return false;
    const blank = !last.reps && !last.sets && !last.sec && !last.dist && !last.cal;
    if (blank || (n.sets && !last.sets && !n.reps)) { fill(last, n, MAP[last.exo], segText); finish(last); return true; }
    ensure(n.sets && n.reps);
    const en = { exo: last.exo, name: last.name };
    if (last.kg && !n.kgs && !n.at) en.kg = last.kg;
    fill(en, n, MAP[last.exo], segText); finish(en); cur.entries.push(en); last = en;
    return true;
  };
  const MAP = {}; exos.forEach(e => { MAP[e.id] = e; });

  prep(text).split('\n').forEach((line0, li) => {
    const line = line0.replace(/^\s*[-•*·>]+\s*/, '').trim();
    if (!line) { cur = null; sticky = false; return; }
    if (!sticky && cur && cur.kind !== 'strength') cur = null;
    let lineHadHeader = false, itemsAfterHeader = 0;
    const chunks = line.split(/\.(?!\d)|\bensuite\b|\bpuis\b|\bdonc\b|\bpour finir\b|\bet pour finir\b|\bon a fini par\b|\bfini par\b/);
    chunks.forEach((chunk0, ci) => {
      let chunk = chunk0.trim();
      if (!chunk) return;
      if (ci > 0 && !sticky && cur && cur.kind !== 'strength') {
        const sc = scoreOf(chunk);
        if (sc && !findHits(chunk, matcher).some(h => h.e !== 'REF')) { Object.assign(cur, sc); return; }
        cur = null;
      }
      // récit : l'en-tête ("en 10 minutes… autant de fois possible") vaut pour toute la phrase
      if (!chunk.includes(':') && /\b(autant de|le (?:plus|max) de (?:tours|rounds)|max(?:imum)? de (?:tours|rounds)|en boucle|chaque minute|toutes les (?:\d )?minutes|amrap|e\d?mom)\b/.test(chunk)) {
        const hd = header(chunk);
        if (hd) {
          newBlock(hd.h); chunk = hd.rest; lineHadHeader = true; sticky = false;
          const sc = scoreOf(chunk);
          if (sc) { Object.assign(cur, sc); chunk = chunk.replace(/(?:j ai |on a )?(?:fait|fais|realise|reussi|score)?\s*\d+\s*(?:tours?|rounds?)(?:\s*(?:et|\+)\s*\d+(?:\s*reps?)?)?/, ' '); }
        }
      }
      chunk.split(':').forEach(part => {
        part.split(/[,;+]|\bet\b|\bthen\b|\bsuivi de\b|\bavant de\b/).forEach(it0 => {
          let it = it0.trim();
          if (!it) return;
          const hd = header(it);
          if (hd) {
            newBlock(hd.h); it = hd.rest.trim(); lineHadHeader = true; sticky = false;
            const sc = scoreOf(it);
            if (sc && cur.kind === 'amrap' && sc.score) { Object.assign(cur, sc); it = it.replace(/(?:j ai |on a )?(?:fait|fais|realise|reussi|score)?\s*\d+\s*(?:tours?|rounds?)(?:\s*(?:et|\+)\s*\d+(?:\s*reps?)?)?/, ' ').trim(); }
            if (!it) return;
          }
          const hits = findHits(it, matcher);
          if (!hits.length) {
            const n = parseNumbers(it);
            const sc = scoreOf(it);
            if (sc && (cur && cur.kind !== 'strength' || lastMet)) { Object.assign(cur && cur.kind !== 'strength' ? cur : lastMet, sc); return; }
            if (n.has && last && !n.words.length && toLast(n, it)) return;
            if (NOTE.test(it) || !n.has) return;
            const words = n.words;
            if (words.length && words.length <= 4 && words.join(' ').length >= 3) {
              const guess = words.join(' ');
              if (!unknown.some(u => u.guess === guess)) unknown.push({ guess, raw: (rawLines[li] || '').trim(), piece: it });
            }
            return;
          }
          // ce qui précède le premier exercice et qui n'est que des chiffres complète l'exercice précédent
          segments(it, hits).forEach(seg => {
            const n = parseNumbers(seg.text);
            if (seg.hit.e === 'REF') { toLast(n, seg.text); return; }
            const e = seg.hit.e;
            ensure(n.sets && (n.reps || n.kgs || n.at));
            const en = { exo: e.id, name: e.name };
            fill(en, n, e, seg.text);
            finish(en);
            cur.entries.push(en); last = en;
            if (lineHadHeader) itemsAfterHeader++;
          });
        });
      });
    });
    if (lineHadHeader) sticky = itemsAfterHeader === 0 || /:\s*$/.test(line);
  });
  const clean = blocks.filter(b => b.entries.length || b.timeSec || b.score);
  return { blocks: clean, unknown, count: clean.reduce((a, b) => a + b.entries.length, 0) };
}

CH.parse = parse;
CH.parseNumbers = parseNumbers;
CH.prepText = prep;
}
