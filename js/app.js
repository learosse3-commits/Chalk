/* Chalk — application */
{
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fr = (n, d = 0) => n == null || isNaN(n) ? '–' : Number(n).toLocaleString('fr-FR', { maximumFractionDigits: d, minimumFractionDigits: 0 });
const TYPES = { crossfit: ['CrossFit', 'var(--cf)'], muscu: ['Muscu', 'var(--mu)'], mixte: ['Mixte', 'var(--mx)'], course: ['Course', 'var(--run)'] };
const BEFORE = [['energie', 'Énergie'], ['motivation', 'Motivation'], ['sommeil', 'Sommeil'], ['courbatures', 'Courbatures'], ['stress', 'Stress']];
const AFTER = [['energie', 'Énergie'], ['fatigue', 'Fatigue'], ['satisfaction', 'Satisfaction'], ['rpe', 'Effort (RPE)']];

// ---------- données ----------
let D = CH.load();
if (!D) { D = { profile: {}, sessions: CH.demo(), customExos: [], demo: true }; }
D.profile = D.profile || {}; D.customExos = D.customExos || [];
let EX = CH.allExos(D), MAP = CH.exoMap(D);
const refreshExos = () => { EX = CH.allExos(D); MAP = CH.exoMap(D); };
D.sessions.forEach(s => { if (s.type !== 'course' && !s.blocks) s.blocks = CH.parse(s.text || '', EX).blocks; });
const persist = () => { if (!CH.save(D)) toast('Sauvegarde impossible sur cet appareil'); };
persist();

const sorted = () => D.sessions.slice().sort((a, b) => b.date.localeCompare(a.date) || (b.created || 0) - (a.created || 0));
const usage = () => { const u = {}; D.sessions.forEach(s => (s.blocks || []).forEach(b => b.entries.forEach(e => { u[e.exo] = (u[e.exo] || 0) + 1; }))); return u; };
const kcalOf = s => CH.kcal(s, D.profile);
const summary = s => {
  if (s.type === 'course' && s.run) return [fr(s.run.km, 2) + ' km', CH.fmtPace(CH.pace(s.run.km, s.run.sec)) + '/km', s.run.kind].filter(Boolean).join(' · ');
  const names = []; (s.blocks || []).forEach(b => b.entries.forEach(e => { if (!names.includes(e.name)) names.push(e.name); }));
  return names.join(', ') || (s.text || '').slice(0, 80);
};

let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200); }

// ---------- feuille modale ----------
const sheet = $('#sheet');
function openSheet(html, onMount) {
  $('#sheetBody').innerHTML = html;
  if (!sheet.open) sheet.showModal();
  sheet.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeSheet));
  if (onMount) onMount($('#sheetBody'));
}
let sheetStop = null;
function closeSheet() { if (sheetStop) { sheetStop(); sheetStop = null; } sheet.close(); }
sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });
sheet.addEventListener('close', () => { if (sheetStop) { sheetStop(); sheetStop = null; } });
const closeBtn = '<button class="iconbtn" data-close aria-label="Fermer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>';

// ---------- navigation ----------
const VIEWS = ['journal', 'seance', 'progres', 'corps', 'exos', 'profil'];
function route() {
  let v = location.hash.slice(1);
  if (!VIEWS.includes(v)) v = 'journal';
  $$('.view').forEach(s => s.classList.toggle('on', s.id === 'v-' + v));
  $$('nav.tabs a').forEach(a => { if (a.dataset.v === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  ({ journal: renderJournal, seance: renderForm, progres: renderProg, corps: renderBody, exos: renderExos, profil: renderProfil })[v]();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);

// ---------- journal ----------
function plate(type, cls = '') { return `<span class="plate ${cls}" style="--c:${(TYPES[type] || TYPES.crossfit)[1]}"></span>`; }
function renderJournal() {
  $('#demoBanner').innerHTML = D.demo && D.sessions.some(s => s.demo)
    ? `<div class="banner"><span>Ce sont des séances d'exemple pour voir l'appli tourner. Elles disparaissent dès ta première séance.</span><button class="btn sm" id="clearDemo">Effacer maintenant</button></div>` : '';
  const cd = $('#clearDemo'); if (cd) cd.onclick = () => { D.sessions = D.sessions.filter(s => !s.demo); D.demo = false; persist(); renderJournal(); };
  const mon = CH.monday(new Date()), today = CH.today();
  const J = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  let html = '';
  const wk = [];
  for (let i = 0; i < 7; i++) {
    const d = CH.iso(CH.addDays(mon, i));
    const ss = D.sessions.filter(s => s.date === d);
    wk.push(...ss);
    html += `<div class="day ${d === today ? 'today' : ''}"><div class="plates">${ss.length ? ss.map(s => plate(s.type)).join('') : (d <= today ? '<span class="plate none"></span>' : '')}</div><small>${J[i]} ${CH.dateOf(d).getDate()}</small></div>`;
  }
  $('#week').innerHTML = html;
  const n = wk.length, min = wk.reduce((a, s) => a + (s.type === 'course' && s.run ? s.run.sec / 60 : s.duration || 0), 0);
  const kc = wk.reduce((a, s) => a + (kcalOf(s) || 0), 0), km = wk.reduce((a, s) => a + (s.type === 'course' && s.run ? s.run.km || 0 : 0), 0);
  $('#weekTitle').textContent = n ? (n === 1 ? '1 séance cette semaine' : n + ' séances cette semaine') : 'Cette semaine';
  $('#weekFigs').innerHTML = [
    [Math.floor(min / 60) + 'h' + String(Math.round(min % 60)).padStart(2, '0'), 'd\'entraînement'],
    [CH.bmr(D.profile) ? fr(kc) : '–', CH.bmr(D.profile) ? 'kcal estimées' : '<a href="#profil">profil à remplir</a> pour les kcal'],
    [fr(km, 1), 'km courus'],
    [streak(), 'semaines d\'affilée']
  ].map(f => `<div class="fig-n"><b>${f[0]}</b><span>${f[1]}</span></div>`).join('');
  const all = sorted(), list = all.slice(0, JLIM);
  $('#sessList').innerHTML = list.length ? list.map(s => {
    const k = kcalOf(s);
    return `<button class="sess" data-s="${s.id}">${plate(s.type)}<div><h3>${TYPES[s.type][0]} · ${CH.fmtDate(s.date)}</h3><p>${esc(summary(s))}</p></div><div class="k">${k ? fr(k) : (s.duration || '–')}<small>${k ? 'kcal' : 'min'}</small></div></button>`;
  }).join('') : `<div class="empty">Aucune séance pour l'instant.<br><a class="btn red" style="display:inline-flex;margin-top:12px;align-items:center" href="#seance">Ajouter ma première séance</a></div>`;
  if (all.length > JLIM) $('#sessList').insertAdjacentHTML('beforeend', `<button class="btn" id="more" type="button">Voir plus (${all.length - JLIM})</button>`);
  const mb = $('#more'); if (mb) mb.onclick = () => { JLIM += 15; renderJournal(); };
  $$('#sessList .sess').forEach(b => b.onclick = () => openSession(b.dataset.s));
}
let JLIM = 10;
function streak() {
  let n = 0, w = CH.monday(new Date());
  const has = d => D.sessions.some(s => s.date >= CH.iso(d) && s.date < CH.iso(CH.addDays(d, 7)));
  if (!has(w)) w = CH.addDays(w, -7);
  while (has(w) && n < 200) { n++; w = CH.addDays(w, -7); }
  return n;
}

// ---------- séance (détail) ----------
function blockLabel(b) {
  const t = { strength: 'Force', amrap: 'AMRAP', emom: b.every > 1 ? 'E' + b.every + 'MOM' : 'EMOM', rounds: (b.rounds || '') + ' tours', fortime: 'For time', tabata: 'Tabata' }[b.kind] || 'Bloc';
  const extra = [b.minutes && b.kind !== 'tabata' ? b.minutes + ' min' : '', b.scheme ? b.scheme.join('-') : '', b.cap ? 'cap ' + b.cap + ' min' : ''].filter(Boolean).join(' · ');
  const res = [b.score, b.timeSec ? 'en ' + CH.fmtDur(b.timeSec) : ''].filter(Boolean).join(' · ');
  return { t, extra, res };
}
function entryText(e) {
  const p = [];
  if (e.sets && e.reps) p.push(e.sets + ' × ' + e.reps); else if (e.reps) p.push(e.reps + ' reps'); else if (e.sets) p.push(e.sets + ' séries');
  if (e.kgs) p.push(e.kgs.join('/') + ' kg'); else if (e.kg) p.push(fr(e.kg, 1) + ' kg');
  if (e.dist) p.push(e.dist >= 1000 ? fr(e.dist / 1000, 2) + ' km' : e.dist + ' m');
  if (e.cal) p.push(e.cal + ' cal');
  if (e.sec) p.push(CH.fmtDur(e.sec));
  if (e.pct) p.push(e.pct + ' %');
  return p.join(' · ');
}
function feelHtml(s) {
  const cell = (lab, v) => `<div>${lab}<b>${v == null ? '–' : v}</b></div>`;
  return `<h3 style="margin:18px 0 8px">Avant</h3><div class="feel">${BEFORE.map(([k, l]) => cell(l, s.before && s.before[k])).join('')}</div>
  <h3 style="margin:18px 0 8px">Après</h3><div class="feel">${AFTER.map(([k, l]) => cell(l, k === 'rpe' ? s.rpe : s.after && s.after[k])).join('')}</div>`;
}
function muscleBars(load, max = 8) {
  const arr = Object.entries(load).filter(x => x[1] > .05).sort((a, b) => b[1] - a[1]).slice(0, max);
  if (!arr.length) return '<p class="muted small">Aucun muscle identifié.</p>';
  const top = arr[0][1];
  return `<div class="bars">${arr.map(([k, v]) => `<div class="bar"><span>${CH.MUSCLES[k]}</span><span class="t"><i style="width:${v / top * 100}%;--c:${heat(v / top)}"></i></span><b>${fr(v, 1)}</b></div>`).join('')}</div>`;
}
const heat = v => v > .66 ? 'var(--heat-hi)' : v > .33 ? 'var(--heat-mid)' : 'var(--heat-lo)';
function openSession(id) {
  const s = D.sessions.find(x => x.id === id); if (!s) return;
  const k = kcalOf(s);
  const figs = s.type === 'course' && s.run
    ? [[fr(s.run.km, 2), 'km'], [CH.fmtDur(s.run.sec), 'temps'], [CH.fmtPace(CH.pace(s.run.km, s.run.sec)), 'min/km'], [k ? fr(k) : '–', 'kcal']]
    : [[s.duration || '–', 'minutes'], [k ? fr(k) : '–', 'kcal'], [s.rpe || '–', 'effort /10']];
  const blocks = s.type === 'course' ? (s.run && s.run.text ? `<p>${esc(s.run.text)}</p>` : '') :
    (s.blocks || []).map(b => { const l = blockLabel(b); return `<div class="blk"><h4>${l.t}<span>${l.extra}</span>${l.res ? `<span>${l.res}</span>` : ''}</h4>${b.entries.map(e => `<div class="ent"><span class="nm">${esc(e.name)}${e.warmup ? ' <small class="muted">échauffement</small>' : ''}</span><span class="muted small">${entryText(e)}</span></div>`).join('')}</div>`; }).join('');
  openSheet(`<div class="grab"><div><h2 style="margin:0">${TYPES[s.type][0]}</h2><span class="muted">${CH.fmtDate(s.date)}${s.run && s.run.kind ? ' · ' + s.run.kind : ''}</span></div>${closeBtn}</div>
    <div class="figs">${figs.map(f => `<div class="fig-n"><b>${f[0]}</b><span>${f[1]}</span></div>`).join('')}</div>
    <div class="card sec">${blocks || '<p class="muted">Pas de détail.</p>'}</div>
    ${s.text && s.type !== 'course' ? `<details class="sec"><summary class="muted">Ce que tu as écrit</summary><p style="white-space:pre-wrap;margin-top:8px">${esc(s.text)}</p></details>` : ''}
    ${feelHtml(s)}
    <h3 style="margin:18px 0 8px">Muscles</h3>${muscleBars(CH.muscleLoad(s, MAP), 6)}
    <div class="row sec"><button class="btn pri" id="sBody">Voir sur le corps</button><button class="btn" id="sEdit">Modifier</button><button class="btn ghost" id="sDel">Supprimer</button></div>`, root => {
    root.querySelector('#sBody').onclick = () => { closeSheet(); BODY.mode = 'sess'; BODY.sid = s.id; location.hash = 'corps'; if (location.hash === '#corps') renderBody(); };
    root.querySelector('#sEdit').onclick = () => { closeSheet(); editSession(s); };
    const del = root.querySelector('#sDel');
    del.onclick = () => {
      if (del.dataset.ok) { D.sessions = D.sessions.filter(x => x.id !== s.id); persist(); closeSheet(); toast('Séance supprimée'); route(); }
      else { del.dataset.ok = 1; del.textContent = 'Confirmer la suppression'; del.classList.add('red'); }
    };
  });
}

// ---------- formulaire de séance ----------
const DRAFT = 'chalk.draft';
const blankForm = () => ({ id: null, type: 'crossfit', date: CH.today(), duration: '', text: '', blocks: [], unknown: [], ignored: [], run: { km: '', time: '', kind: 'Footing', dplus: '', text: '' }, before: { energie: 6, motivation: 6, sommeil: 6, courbatures: 3, stress: 3 }, after: { energie: 6, fatigue: 5, satisfaction: 7 }, rpe: 7 });
let F = null;
try { F = JSON.parse(localStorage.getItem(DRAFT)); } catch (e) {}
if (!F || !F.before) F = blankForm();
const saveDraft = () => { try { localStorage.setItem(DRAFT, JSON.stringify(F)); } catch (e) {} };
function editSession(s) {
  F = blankForm();
  Object.assign(F, { id: s.id, type: s.type, date: s.date, duration: s.duration || '', text: s.text || '', blocks: JSON.parse(JSON.stringify(s.blocks || [])), before: Object.assign({}, F.before, s.before), after: Object.assign({}, F.after, s.after), rpe: s.rpe || 7 });
  if (s.run) F.run = { km: s.run.km, time: CH.fmtDur(s.run.sec), kind: s.run.kind || 'Footing', dplus: s.run.dplus || '', text: s.run.text || '' };
  F.keepBlocks = true;
  saveDraft();
  location.hash = 'seance';
}
let formBound = false;
function renderForm() {
  if (!formBound) bindForm();
  $('#formTitle').textContent = F.id ? 'Modifier la séance' : 'Nouvelle séance';
  $$('#typeSeg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === F.type));
  $('#fDate').value = F.date; $('#fDur').value = F.duration; $('#fText').value = F.text;
  $('#rKm').value = F.run.km; $('#rTime').value = F.run.time; $('#rKind').value = F.run.kind; $('#rDplus').value = F.run.dplus; $('#rText').value = F.run.text;
  const run = F.type === 'course';
  $('#trainBox').hidden = run; $('#runBox').hidden = !run; $('#durWrap').hidden = run;
  sliders('#slBefore', BEFORE, F.before);
  sliders('#slAfter', AFTER, F.after);
  if (!F.keepBlocks) reparse(); else { F.keepBlocks = false; F.unknown = CH.parse(F.text, EX).unknown; }
  renderPreview(); renderSuggest(); live();
}
function sliders(sel, list, obj) {
  $(sel).innerHTML = list.map(([k, l]) => {
    const v = k === 'rpe' ? F.rpe : obj[k];
    return `<label class="sl"><span>${l}</span><input type="range" min="1" max="10" step="1" value="${v}" data-k="${k}" style="--p:${(v - 1) / 9 * 100}%"><output>${v}</output></label>`;
  }).join('');
  $$(sel + ' input').forEach(inp => inp.oninput = () => {
    const v = +inp.value; inp.style.setProperty('--p', (v - 1) / 9 * 100 + '%'); inp.nextElementSibling.textContent = v;
    if (inp.dataset.k === 'rpe') F.rpe = v; else obj[inp.dataset.k] = v;
    saveDraft(); live();
  });
}
function reparse() {
  const r = CH.parse(F.text, EX);
  F.blocks = r.blocks; F.unknown = r.unknown.filter(u => !F.ignored.includes(u.guess));
}
let parseT;
function bindForm() {
  formBound = true;
  $$('#typeSeg button').forEach(b => b.onclick = () => { F.type = b.dataset.t; saveDraft(); renderForm(); });
  $('#fDate').onchange = e => { F.date = e.target.value || CH.today(); saveDraft(); };
  $('#fDur').oninput = e => { F.duration = e.target.value; saveDraft(); live(); };
  const ta = $('#fText');
  ta.oninput = () => { F.text = ta.value; saveDraft(); renderSuggest(); clearTimeout(parseT); parseT = setTimeout(() => { reparse(); renderPreview(); live(); }, 250); };
  ta.onkeyup = ta.onclick = () => renderSuggest();
  ['rKm', 'rTime', 'rKind', 'rDplus', 'rText'].forEach(id => $('#' + id).oninput = e => {
    F.run[{ rKm: 'km', rTime: 'time', rKind: 'kind', rDplus: 'dplus', rText: 'text' }[id]] = e.target.value; saveDraft(); live();
  });
  $('#saveBtn').onclick = saveSession;
}
function currentWord() {
  const ta = $('#fText'), pos = ta.selectionStart == null ? ta.value.length : ta.selectionStart;
  const before = ta.value.slice(0, pos);
  const m = before.match(/([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\- ]{1,24})$/);
  if (!m) return null;
  // ne garder que les 1 à 3 derniers mots
  const words = m[1].trimStart().split(' ').slice(-3).join(' ');
  return { text: words, start: pos - words.length, end: pos };
}
function insertFor(e) {
  const st = CH.exoStats(D.sessions, e.id);
  let s = e.name;
  if (st && st.last && st.last.entry) {
    const en = st.last.entry;
    if (en.sets && en.reps) s += ' ' + en.sets + 'x' + en.reps;
    else if (en.reps) s = en.reps + ' ' + s;
    if (en.kg) s += ' ' + String(en.kg).replace('.', ',') + 'kg';
  }
  return s;
}
function renderSuggest() {
  if (F.type === 'course') return;
  const w = currentWord(), u = usage();
  let list;
  if (w && w.text.trim().length >= 2) {
    const q = CH.norm(w.text);
    const qs = [q, q.split(' ').pop()].filter((x, i, a) => x.length >= 2 && a.indexOf(x) === i);
    list = EX.filter(e => e.aliases.some(a => { const n = CH.norm(a); return qs.some(x => n.startsWith(x) || n.includes(' ' + x)); }))
      .sort((a, b) => (u[b.id] || 0) - (u[a.id] || 0)).slice(0, 8);
    if (list.length === 1 && CH.norm(list[0].name) === q) list = [];
  } else {
    list = EX.filter(e => u[e.id]).sort((a, b) => u[b.id] - u[a.id]).slice(0, 8);
  }
  const box = $('#suggest');
  box.innerHTML = list.map(e => { const st = CH.exoStats(D.sessions, e.id); const last = st && st.last.max ? fr(st.last.max, 1) + ' kg' : ''; return `<button type="button" class="chip" data-e="${e.id}">${esc(e.name)}${last ? `<small>${last}</small>` : ''}</button>`; }).join('');
  box.querySelectorAll('.chip').forEach(c => c.onmousedown = ev => ev.preventDefault());
  box.querySelectorAll('.chip').forEach(c => c.onclick = () => {
    const e = MAP[c.dataset.e], ta = $('#fText'), ins = insertFor(e);
    const cw = w && w.text.trim().length >= 2 ? currentWord() : null;
    let v = ta.value, a, b;
    if (cw) { a = cw.start; b = cw.end; } else { a = b = v.length; if (v && !/\n$/.test(v)) { v += '\n'; a = b = v.length; } }
    ta.value = v.slice(0, a) + ins + v.slice(b);
    const p = a + ins.length; ta.focus(); ta.setSelectionRange(p, p);
    ta.dispatchEvent(new Event('input'));
  });
}
function renderPreview() {
  const box = $('#preview');
  if (!F.text.trim()) { box.innerHTML = `<p class="muted small" style="margin:0">Écris ta séance comme tu la raconterais : exercices, séries (5x5, 3 séries de 10), charges (60kg, 60/65/70kg), formats (AMRAP 12 min, EMOM 10, For time 21-15-9, 5 tours). L'appli s'occupe du découpage.</p>`; return; }
  let html = `<h3 style="margin-bottom:4px">Ce que j'ai compris</h3>`;
  if (!F.blocks.length) html += `<p class="muted small">Aucun exercice reconnu pour l'instant.</p>`;
  F.blocks.forEach((b, bi) => {
    const l = blockLabel(b);
    html += `<div class="blk"><h4>${l.t}<span>${l.extra}</span>${l.res ? `<span>${l.res}</span>` : ''}</h4>` + b.entries.map((e, ei) => {
      const ex = MAP[e.exo], load = ex && (ex.cat === 'halt' || ex.cat === 'muscu') || e.kg;
      return `<div class="ent"><span class="nm">${esc(e.name)}${e.dist ? ` <small class="muted">${e.dist >= 1000 ? fr(e.dist / 1000, 2) + ' km' : e.dist + ' m'}</small>` : ''}${e.cal ? ` <small class="muted">${e.cal} cal</small>` : ''}${e.sec ? ` <small class="muted">${CH.fmtDur(e.sec)}</small>` : ''}</span><span class="vals">
        ${b.kind === 'strength' ? `<input type="number" inputmode="numeric" value="${e.sets || ''}" data-b="${bi}" data-e="${ei}" data-f="sets" aria-label="Séries"><span class="u">×</span>` : ''}
        <input type="number" inputmode="numeric" value="${e.reps || ''}" data-b="${bi}" data-e="${ei}" data-f="reps" aria-label="Répétitions"><span class="u">reps</span>
        ${load ? `<input type="number" inputmode="decimal" step="0.5" value="${e.kg || ''}" data-b="${bi}" data-e="${ei}" data-f="kg" aria-label="Charge"><span class="u">kg</span>` : ''}
        <button type="button" class="x" data-rm="${bi}.${ei}" aria-label="Retirer">×</button></span></div>`;
    }).join('') + '</div>';
  });
  F.unknown.forEach((u, i) => {
    html += `<div class="unk" data-u="${i}"><div><b>« ${esc(u.guess)} »</b> <span class="muted small">n'est pas dans ta base</span></div><div class="row"><button type="button" class="btn sm pri" data-addu="${i}">C'est un exercice</button><button type="button" class="btn sm ghost" data-ign="${i}">Ignorer</button></div></div>`;
  });
  box.innerHTML = html;
  box.querySelectorAll('input[data-f]').forEach(inp => inp.onchange = () => {
    const e = F.blocks[inp.dataset.b].entries[inp.dataset.e], v = parseFloat(inp.value);
    if (isNaN(v)) delete e[inp.dataset.f]; else e[inp.dataset.f] = v;
    if (inp.dataset.f === 'kg') delete e.kgs;
    F.keepBlocks = true; saveDraft(); live();
  });
  box.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { const [bi, ei] = b.dataset.rm.split('.').map(Number); F.blocks[bi].entries.splice(ei, 1); if (!F.blocks[bi].entries.length) F.blocks.splice(bi, 1); saveDraft(); renderPreview(); live(); });
  box.querySelectorAll('[data-ign]').forEach(b => b.onclick = () => { const u = F.unknown[+b.dataset.ign]; F.ignored.push(u.guess); F.unknown.splice(+b.dataset.ign, 1); saveDraft(); renderPreview(); });
  box.querySelectorAll('[data-addu]').forEach(b => b.onclick = () => { const u = F.unknown[+b.dataset.addu]; exoForm({ name: u.guess.replace(/^./, c => c.toUpperCase()) }, () => { reparse(); renderPreview(); live(); }); });
}
function formSession() {
  const s = { type: F.type, date: F.date, duration: +F.duration || null, rpe: F.rpe, before: F.before, after: F.after };
  if (F.type === 'course') {
    const km = parseFloat(String(F.run.km).replace(',', '.')), sec = CH.parseDur(F.run.time);
    s.run = { km: km || 0, sec: sec || 0, kind: F.run.kind, dplus: +F.run.dplus || 0, text: F.run.text };
    s.duration = sec ? Math.round(sec / 60) : null;
  } else { s.text = F.text; s.blocks = F.blocks; }
  return s;
}
function live() {
  const s = formSession(), k = kcalOf(s);
  $('#liveKcal').textContent = k ? fr(k) + ' kcal' : (CH.bmr(D.profile) ? '– kcal' : 'Profil à remplir');
  const l = CH.muscleLoad(s, MAP), top = Object.entries(l).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => CH.MUSCLES[x[0]]);
  $('#liveMus').textContent = top.join(', ');
  if (F.type === 'course') {
    const p = CH.pace(s.run.km, s.run.sec), v = s.run.sec ? s.run.km / (s.run.sec / 3600) : null;
    $('#runLive').innerHTML = [[CH.fmtPace(p), 'min/km'], [v ? fr(v, 1) : '–', 'km/h'], [k ? fr(k) : '–', 'kcal']].map(f => `<div class="fig-n"><b>${f[0]}</b><span>${f[1]}</span></div>`).join('');
  }
}
function saveSession() {
  const s = formSession();
  if (F.type === 'course') { if (!s.run.km || !s.run.sec) { toast('Indique la distance et le temps'); return; } }
  else {
    if (!F.text.trim()) { toast('Décris ta séance'); $('#fText').focus(); return; }
    if (!s.duration) { toast('Indique la durée de la séance'); $('#fDur').focus(); return; }
  }
  if (D.demo) { D.sessions = D.sessions.filter(x => !x.demo); D.demo = false; }
  if (F.id) { const i = D.sessions.findIndex(x => x.id === F.id); s.id = F.id; s.created = (D.sessions[i] || {}).created; if (i >= 0) D.sessions[i] = s; else D.sessions.push(s); }
  else { s.id = CH.uid(); s.created = Date.now(); D.sessions.push(s); }
  persist();
  const prs = newPRs(s);
  F = blankForm(); localStorage.removeItem(DRAFT);
  toast(prs.length ? 'Nouveau record : ' + prs.join(', ') : 'Séance enregistrée');
  location.hash = 'journal';
}
function newPRs(s) {
  const out = [];
  (s.blocks || []).forEach(b => b.entries.forEach(e => {
    if (!e.kg) return;
    const prev = D.sessions.filter(x => x.id !== s.id).flatMap(x => (x.blocks || []).flatMap(bb => bb.entries)).filter(x => x.exo === e.exo && x.kg);
    if (prev.length && e.kg > Math.max(...prev.map(x => x.kg)) && !out.includes(e.name)) out.push(e.name + ' ' + fr(e.kg, 1) + ' kg');
  }));
  return out;
}

// ---------- ajout / édition d'exercice ----------
function exoForm(pre, done) {
  const st = { name: pre.name || '', cat: pre.cat || 'muscu', m: Object.assign({}, pre.m || {}), aliases: (pre.aliases || []).filter(a => a !== pre.name).join(', '), id: pre.id };
  const chips = () => Object.keys(CH.MUSCLES).map(k => { const v = st.m[k]; return `<button type="button" class="chip" data-m="${k}" aria-pressed="${!!v}">${CH.MUSCLES[k]}${v ? `<small>${v >= 1 ? 'principal' : 'secondaire'}</small>` : ''}</button>`; }).join('');
  openSheet(`<div class="grab"><h2 style="margin:0">${st.id ? 'Modifier' : 'Nouvel exercice'}</h2>${closeBtn}</div>
    <div class="fields"><label class="f">Nom<input type="text" id="xName" value="${esc(st.name)}"></label>
    <label class="f">Catégorie<select id="xCat">${Object.entries(CH.CATS).map(([k, l]) => `<option value="${k}" ${k === st.cat ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
    <label class="f sec">Autres façons de l'écrire<input type="text" id="xAl" value="${esc(st.aliases)}" placeholder="lateral raise, élévations"></label>
    <h3 class="sec" style="margin-bottom:4px">Muscles travaillés</h3><p class="muted small">Touche une fois pour principal, deux fois pour secondaire.</p>
    <div class="chips wrap" id="xM">${chips()}</div>
    <div class="row sec"><button class="btn red" id="xSave" type="button">Enregistrer</button>${st.id ? '<button class="btn ghost" id="xDel" type="button">Supprimer</button>' : ''}</div>`, root => {
    const bindChips = () => root.querySelectorAll('#xM .chip').forEach(c => c.onclick = () => {
      const k = c.dataset.m, v = st.m[k];
      if (!v) st.m[k] = 1; else if (v >= 1) st.m[k] = .5; else delete st.m[k];
      root.querySelector('#xM').innerHTML = chips(); bindChips();
    });
    bindChips();
    root.querySelector('#xSave').onclick = () => {
      const name = root.querySelector('#xName').value.trim();
      if (!name) { toast('Donne un nom'); return; }
      if (!Object.keys(st.m).length) { toast('Choisis au moins un muscle'); return; }
      const ex = { id: st.id || 'c_' + CH.uid(), name, cat: root.querySelector('#xCat').value, m: st.m, aliases: root.querySelector('#xAl').value.split(',').map(x => x.trim()).filter(Boolean) };
      const i = D.customExos.findIndex(x => x.id === ex.id);
      if (i >= 0) D.customExos[i] = ex; else D.customExos.push(ex);
      persist(); refreshExos(); closeSheet(); toast('Exercice ajouté à ta base');
      D.sessions.forEach(s => (s.blocks || []).forEach(b => b.entries.forEach(e => { if (e.exo === ex.id) e.name = ex.name; })));
      if (done) done(ex);
    };
    const del = root.querySelector('#xDel');
    if (del) del.onclick = () => {
      if (!del.dataset.ok) { del.dataset.ok = 1; del.textContent = 'Confirmer'; del.classList.add('red'); return; }
      D.customExos = D.customExos.filter(x => x.id !== st.id); persist(); refreshExos(); closeSheet(); if (done) done();
    };
  });
}

// ---------- progrès ----------
let PROG = 'force', PEX = null;
function renderProg() {
  $$('#progSeg button').forEach(b => { b.setAttribute('aria-pressed', b.dataset.p === PROG); b.onclick = () => { PROG = b.dataset.p; renderProg(); }; });
  ({ force: progForce, course: progRun, ressenti: progFeel, regul: progRegul })[PROG]($('#progBody'));
}
function progForce(el) {
  const u = usage();
  const used = EX.filter(e => u[e.id] && e.cat !== 'cardio').sort((a, b) => u[b.id] - u[a.id]);
  if (!used.length) { el.innerHTML = '<div class="empty">Ajoute des séances pour voir ta progression.</div>'; return; }
  if (!PEX || !used.find(e => e.id === PEX)) PEX = used[0].id;
  const st = CH.exoStats(D.sessions, PEX), e = MAP[PEX];
  const loaded = st.hist.some(p => p.max);
  const first = st.hist.find(p => p.max), gain = loaded && first ? st.pr.max - first.max : null;
  const bestE = Math.max(...st.hist.map(p => p.e1rm || 0));
  const title = loaded ? (gain > 0 ? `${e.name} : +${fr(gain, 1)} kg depuis le ${CH.fmtShort(first.date)}` : `${e.name} : record à ${fr(st.pr.max, 1)} kg`) : `${e.name} : ${st.last.reps || '–'} reps max par série`;
  const prs = used.map(x => ({ e: x, s: CH.exoStats(D.sessions, x.id) })).filter(x => x.s && x.s.pr);
  el.innerHTML = `<label class="f" style="max-width:420px">Exercice<select id="pEx">${used.map(x => `<option value="${x.id}" ${x.id === PEX ? 'selected' : ''}>${esc(x.name)} (${u[x.id]})</option>`).join('')}</select></label>
    <h2>${esc(title)}</h2>
    <div class="figs">${(loaded ? [[fr(st.pr.max, 1) + ' kg', 'record · ' + CH.fmtShort(st.pr.date)], [fr(bestE, 1) + ' kg', '1RM estimé'], [fr(st.last.max, 1) + ' kg', 'dernière fois'], [st.count, 'séances']] : [[st.last.reps || '–', 'reps (dernière)'], [Math.max(...st.hist.map(p => p.reps)), 'meilleure série'], [st.count, 'séances']]).map(f => `<div class="fig-n"><b>${f[0]}</b><span>${f[1]}</span></div>`).join('')}</div>
    <div class="card sec"><div class="chart" id="cForce"></div><p class="muted small" style="margin:8px 0 0">${loaded ? 'Trait plein : charge max de la séance. Pointillés : 1RM estimé (formule d\'Epley).' : 'Répétitions max par série.'}</p></div>
    <h2>Dernières séances</h2><div class="scroll"><table><thead><tr><th>Date</th><th>Détail</th>${loaded ? '<th class="n">Max</th><th class="n">Volume</th>' : ''}</tr></thead><tbody>
    ${st.hist.slice().reverse().slice(0, 8).map(p => `<tr><td>${CH.fmtShort(p.date)}</td><td>${entryText(p.entry)}</td>${loaded ? `<td class="n">${fr(p.max, 1)} kg</td><td class="n">${fr(p.vol)} kg</td>` : ''}</tr>`).join('')}</tbody></table></div>
    ${prs.length ? `<h2>Tous tes records</h2><div class="scroll"><table><thead><tr><th>Exercice</th><th class="n">Record</th><th class="n">Date</th></tr></thead><tbody>${prs.sort((a, b) => b.s.pr.max - a.s.pr.max).map(x => `<tr><td>${esc(x.e.name)}</td><td class="n">${fr(x.s.pr.max, 1)} kg</td><td class="n">${CH.fmtShort(x.s.pr.date)}</td></tr>`).join('')}</tbody></table></div>` : ''}`;
  $('#pEx').onchange = ev => { PEX = ev.target.value; progForce(el); };
  const pts = st.hist.map(p => ({ x: CH.dateOf(p.date), y: loaded ? p.max : p.reps })).filter(p => p.y);
  const ser = [{ pts, color: 'var(--red)', name: loaded ? 'max' : 'reps', area: true }];
  if (loaded) ser.push({ pts: st.hist.filter(p => p.e1rm).map(p => ({ x: CH.dateOf(p.date), y: p.e1rm })), color: 'var(--ink)', dash: true, name: '1RM', width: 2 });
  CH.lineChart($('#cForce'), ser, { fmt: v => fr(v, 1) });
}
function progRun(el) {
  const runs = D.sessions.filter(s => s.type === 'course' && s.run && s.run.km).sort((a, b) => a.date.localeCompare(b.date));
  if (!runs.length) { el.innerHTML = '<div class="empty">Aucune sortie de course pour l\'instant.</div>'; return; }
  const since = CH.iso(CH.addDays(new Date(), -30));
  const r30 = runs.filter(r => r.date >= since), km30 = r30.reduce((a, r) => a + r.run.km, 0);
  const pace30 = r30.length ? r30.reduce((a, r) => a + r.run.sec, 0) / km30 : null;
  const longest = runs.reduce((a, r) => r.run.km > a.run.km ? r : a, runs[0]);
  const fast = runs.filter(r => r.run.km >= 5).reduce((a, r) => !a || r.run.sec / r.run.km < a.run.sec / a.run.km ? r : a, null);
  const first = runs[0], last = runs[runs.length - 1];
  const dp = CH.pace(first.run.km, first.run.sec) - CH.pace(last.run.km, last.run.sec);
  const mon = CH.monday(new Date()), cols = [];
  for (let i = 11; i >= 0; i--) {
    const a = CH.iso(CH.addDays(mon, -7 * i)), b = CH.iso(CH.addDays(mon, -7 * i + 7));
    cols.push({ label: CH.fmtShort(a).split(' ')[0] + '/' + (CH.dateOf(a).getMonth() + 1), v: Math.round(runs.filter(r => r.date >= a && r.date < b).reduce((x, r) => x + r.run.km, 0) * 10) / 10, color: 'var(--run)' });
  }
  el.innerHTML = `<h2>${fr(km30, 1)} km courus sur les 30 derniers jours</h2>
    <div class="figs">${[[CH.fmtPace(pace30), 'allure moyenne 30 j'], [fr(longest.run.km, 1) + ' km', 'plus longue sortie'], [fast ? CH.fmtPace(fast.run.sec / fast.run.km) : '–', 'meilleure allure (5 km et +)'], [runs.length, 'sorties']].map(f => `<div class="fig-n"><b>${f[0]}</b><span>${f[1]}</span></div>`).join('')}</div>
    <div class="grid2 sec"><div class="card"><h3>Kilomètres par semaine</h3><div class="chart" id="cKm" style="height:220px"></div></div>
    <div class="card"><h3>Allure par sortie</h3><div class="chart" id="cPace" style="height:220px"></div><p class="muted small" style="margin:8px 0 0">${dp > 0 ? `Tu as gagné ${Math.round(dp)} s/km entre ta première et ta dernière sortie.` : 'Plus la courbe monte, plus tu vas vite.'}</p></div></div>
    <h2>Sorties récentes</h2><div class="scroll"><table><thead><tr><th>Date</th><th>Type</th><th class="n">Km</th><th class="n">Temps</th><th class="n">Allure</th></tr></thead><tbody>
    ${runs.slice().reverse().slice(0, 10).map(r => `<tr><td>${CH.fmtShort(r.date)}</td><td>${esc(r.run.kind || '')}</td><td class="n">${fr(r.run.km, 2)}</td><td class="n">${CH.fmtDur(r.run.sec)}</td><td class="n">${CH.fmtPace(r.run.sec / r.run.km)}</td></tr>`).join('')}</tbody></table></div>`;
  CH.colChart($('#cKm'), cols, { fmt: v => fr(v, 1) });
  CH.lineChart($('#cPace'), [{ pts: runs.map(r => ({ x: CH.dateOf(r.date), y: r.run.sec / r.run.km })), color: 'var(--ink)', name: '' }], { invert: true, fmt: v => CH.fmtPace(v) });
}
function progFeel(el) {
  const ss = D.sessions.filter(s => s.before && s.after).sort((a, b) => a.date.localeCompare(b.date));
  if (ss.length < 2) { el.innerHTML = '<div class="empty">Il faut au moins deux séances pour voir l\'évolution de ton ressenti.</div>'; return; }
  const avg = (arr, f) => { const v = arr.map(f).filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const now = new Date(), c1 = CH.iso(CH.addDays(now, -28)), c2 = CH.iso(CH.addDays(now, -56));
  const A = ss.filter(s => s.date >= c1), B = ss.filter(s => s.date >= c2 && s.date < c1);
  const rows = [...BEFORE.map(([k, l]) => ['Avant · ' + l, s => s.before[k], k]), ...AFTER.map(([k, l]) => ['Après · ' + l, s => k === 'rpe' ? s.rpe : s.after[k], k])];
  const good = ss.filter(s => s.before.sommeil >= 7), bad = ss.filter(s => s.before.sommeil < 7);
  let insight = '';
  if (good.length >= 2 && bad.length >= 2) {
    const g = avg(good, s => s.after.satisfaction), b = avg(bad, s => s.after.satisfaction);
    insight = `Quand tu as bien dormi (7/10 et plus), ta satisfaction après la séance est de ${fr(g, 1)}/10, contre ${fr(b, 1)}/10 sinon.`;
  }
  el.innerHTML = `<h2>Énergie avant et après tes séances</h2>
    <div class="card"><div class="chart" id="cFeel"></div></div>
    ${insight ? `<p class="sec" style="font-size:17px">${insight}</p>` : ''}
    <h2>4 dernières semaines</h2><div class="scroll"><table><thead><tr><th>Critère</th><th class="n">Moyenne</th><th class="n">4 sem. avant</th></tr></thead><tbody>
    ${rows.map(([l, f, k]) => { const a = avg(A, f), b = avg(B, f), d = a != null && b != null ? a - b : null; const better = ['courbatures', 'stress', 'fatigue'].includes(k) ? d < 0 : d > 0; return `<tr><td>${l}</td><td class="n">${fr(a, 1)}${d != null && Math.abs(d) >= .3 ? ` <span class="${better ? 'up' : 'down'}">${d > 0 ? '+' : ''}${fr(d, 1)}</span>` : ''}</td><td class="n">${fr(b, 1)}</td></tr>`; }).join('')}</tbody></table></div>`;
  CH.lineChart($('#cFeel'), [
    { pts: ss.map(s => ({ x: CH.dateOf(s.date), y: s.before.energie })), color: 'var(--blue)', name: 'avant', width: 2.5 },
    { pts: ss.map(s => ({ x: CH.dateOf(s.date), y: s.after.energie })), color: 'var(--red)', name: 'après', width: 2.5 }
  ], { min: 0, right: 60 });
}
function progRegul(el) {
  const mon = CH.monday(new Date()), W = 16;
  let grid = '<div class="scroll"><div style="display:grid;grid-template-columns:2.4em repeat(' + W + ',minmax(14px,1fr));gap:4px;min-width:320px">';
  const J = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  for (let d = 0; d < 7; d++) {
    grid += `<span class="muted small">${J[d]}</span>`;
    for (let w = W - 1; w >= 0; w--) {
      const iso = CH.iso(CH.addDays(mon, -7 * w + d)), s = D.sessions.find(x => x.date === iso);
      grid += `<span title="${iso}" style="aspect-ratio:1;border-radius:50%;background:${s ? TYPES[s.type][1] : 'var(--surf2)'};${iso > CH.today() ? 'opacity:.3' : ''}"></span>`;
    }
  }
  grid += '</div></div>';
  const cols = [];
  for (let w = 11; w >= 0; w--) {
    const a = CH.iso(CH.addDays(mon, -7 * w)), b = CH.iso(CH.addDays(mon, -7 * w + 7));
    cols.push({ label: CH.dateOf(a).getDate() + '/' + (CH.dateOf(a).getMonth() + 1), v: D.sessions.filter(s => s.date >= a && s.date < b).length, color: 'var(--ink)' });
  }
  const last8 = cols.slice(-9, -1), avg = last8.reduce((a, c) => a + c.v, 0) / 8;
  const byType = {}; D.sessions.filter(s => s.date >= CH.iso(CH.addDays(new Date(), -56))).forEach(s => { byType[s.type] = (byType[s.type] || 0) + 1; });
  el.innerHTML = `<h2>${fr(avg, 1)} séances par semaine en moyenne sur 8 semaines</h2>
    <div class="figs">${[[streak(), 'semaines d\'affilée'], ...Object.entries(byType).map(([t, n]) => [n, TYPES[t][0] + ' (8 sem.)'])].map(f => `<div class="fig-n"><b>${f[0]}</b><span>${f[1]}</span></div>`).join('')}</div>
    <div class="card sec"><h3 style="margin-bottom:10px">16 dernières semaines</h3>${grid}<div class="legend" style="margin-top:10px"><span><i style="--c:var(--cf)"></i>CrossFit</span><span><i style="--c:var(--mu)"></i>Muscu</span><span><i style="--c:var(--mx)"></i>Mixte</span><span><i style="--c:var(--run)"></i>Course</span></div></div>
    <div class="card sec"><h3>Séances par semaine</h3><div class="chart" id="cReg" style="height:200px"></div></div>`;
  CH.colChart($('#cReg'), cols);
}

// ---------- corps 3D ----------
const BODY = { mode: 'last', sid: null };
let body3d = null;
function renderBody() {
  const host = $('#body3d');
  if (!body3d) {
    body3d = CH.Body3D(host, id => { const t = $('#bodyTip'); if (id) { t.textContent = CH.MUSCLES[id]; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 1800); } });
    $$('[data-face]').forEach(b => b.onclick = () => body3d && body3d.face(b.dataset.face));
  }
  $$('#bodySeg button').forEach(b => { b.setAttribute('aria-pressed', b.dataset.b === BODY.mode || (BODY.mode === 'sess' && b.dataset.b === 'last')); b.onclick = () => { BODY.mode = b.dataset.b; BODY.sid = null; renderBody(); }; });
  const all = sorted();
  let ss, note;
  if (BODY.mode === 'sess' || BODY.mode === 'last') {
    const s = BODY.mode === 'sess' ? D.sessions.find(x => x.id === BODY.sid) : all[0];
    ss = s ? [s] : []; note = s ? `${TYPES[s.type][0]} du ${CH.fmtDate(s.date)}` : 'Aucune séance.';
    $('#bodyTitle').textContent = 'Muscles de la séance';
  } else if (BODY.mode === 'all') { ss = all; note = `${all.length} séances au total`; $('#bodyTitle').textContent = 'Muscles travaillés'; }
  else { const from = CH.iso(CH.addDays(new Date(), -(+BODY.mode - 1))); ss = all.filter(s => s.date >= from); note = `${ss.length} séance${ss.length > 1 ? 's' : ''} sur ${BODY.mode} jours`; $('#bodyTitle').textContent = 'Muscles travaillés'; }
  const load = CH.sumLoads(ss, MAP), max = Math.max(0, ...Object.values(load));
  const lv = {}; Object.keys(CH.MUSCLES).forEach(k => { lv[k] = max ? (load[k] || 0) / max : 0; });
  if (body3d) body3d.set(lv);
  $('#bodyNote').textContent = note + ' · valeurs en séries équivalentes';
  const arr = Object.keys(CH.MUSCLES).map(k => [k, load[k] || 0]).sort((a, b) => b[1] - a[1]);
  $('#bodyBars').innerHTML = arr.map(([k, v]) => `<div class="bar"><span>${CH.MUSCLES[k]}</span><span class="t"><i style="width:${max ? v / max * 100 : 0}%;--c:${heat(max ? v / max : 0)}"></i></span><b>${fr(v, 1)}</b></div>`).join('');
  const low = arr.filter(x => max && x[1] / max < .15).map(x => CH.MUSCLES[x[0]]);
  $('#bodyLow').innerHTML = ss.length > 1 && low.length ? `<div class="card"><h3>Peu sollicités</h3><p class="muted" style="margin:6px 0 0">${low.join(', ')}</p></div>` : '';
}

// ---------- exercices ----------
let EXCAT = 'all';
function renderExos() {
  const cats = [['all', 'Tous'], ...Object.entries(CH.CATS), ['mine', 'Mes exos']];
  $('#exCats').innerHTML = cats.map(([k, l]) => `<button type="button" class="chip" data-c="${k}" aria-pressed="${k === EXCAT}">${l}</button>`).join('');
  $$('#exCats .chip').forEach(c => c.onclick = () => { EXCAT = c.dataset.c; renderExos(); });
  $('#exSearch').oninput = drawExGrid;
  $('#addExo').onclick = () => exoForm({}, () => renderExos());
  drawExGrid();
}
function drawExGrid() {
  const u = usage(), q = CH.norm($('#exSearch').value);
  const list = EX.filter(e => (EXCAT === 'all' || (EXCAT === 'mine' ? e.custom : e.cat === EXCAT)) && (!q || e.aliases.some(a => CH.norm(a).includes(q))))
    .sort((a, b) => (u[b.id] || 0) - (u[a.id] || 0) || a.name.localeCompare(b.name));
  const g = $('#exGrid');
  g.innerHTML = list.length ? list.map(e => {
    const st = u[e.id] ? CH.exoStats(D.sessions, e.id) : null;
    const top = Object.entries(e.m || {}).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => CH.MUSCLES[x[0]]).join(', ');
    return `<button class="ex" data-x="${e.id}"><div class="pic" data-anim="${e.anim || ''}">${CH.hasAnim(e.anim) ? '' : `<div class="noanim">${CH.CATS[e.cat] || ''}</div>`}</div><b>${esc(e.name)}</b><small>${top}</small>${st ? `<span class="pr">${st.pr ? fr(st.pr.max, 1) + ' kg' : st.count + ' fois'}</span>` : ''}</button>`;
  }).join('') : '<div class="empty">Aucun exercice. Ajoute le tien.</div>';
  g.querySelectorAll('.pic').forEach(p => { if (CH.hasAnim(p.dataset.anim)) CH.figure(p, p.dataset.anim); });
  g.querySelectorAll('.ex').forEach(b => b.onclick = () => openExo(b.dataset.x));
}
function openExo(id) {
  const e = MAP[id]; if (!e) return;
  const st = CH.exoStats(D.sessions, id);
  const ms = Object.entries(e.m || {}).sort((a, b) => b[1] - a[1]);
  openSheet(`<div class="grab"><div><h2 style="margin:0">${esc(e.name)}</h2><span class="muted">${CH.CATS[e.cat] || ''}${e.custom ? ' · ajouté par toi' : ''}</span></div>${closeBtn}</div>
    <div class="bigfig" id="xFig">${CH.hasAnim(e.anim) ? '' : '<div class="noanim">Pas d\'animation pour cet exercice. Les muscles ciblés s\'affichent sur le corps 3D.</div>'}</div>
    <h3 class="sec" style="margin-bottom:8px">Muscles ciblés</h3>
    <div class="chips wrap">${ms.map(([k, v]) => `<span class="chip" ${v >= .75 ? 'aria-pressed="true"' : ''}>${CH.MUSCLES[k]}<small>${v >= .75 ? 'principal' : 'secondaire'}</small></span>`).join('')}</div>
    ${st ? `<div class="figs sec">${[[st.pr ? fr(st.pr.max, 1) + ' kg' : '–', 'record'], [st.last.entry ? entryText(st.last.entry) : '–', 'dernière fois'], [st.count, 'séances']].map(f => `<div class="fig-n"><b style="font-size:${String(f[0]).length > 10 ? 20 : 30}px">${f[0]}</b><span>${f[1]}</span></div>`).join('')}</div>
    ${st.hist.length > 1 && st.pr ? '<div class="card sec"><div class="chart" id="xChart" style="height:180px"></div></div>' : ''}` : '<p class="muted sec">Pas encore fait dans tes séances.</p>'}
    <div class="row sec"><button class="btn pri" id="xBody">Voir sur le corps</button>${e.custom ? '<button class="btn" id="xEdit">Modifier</button>' : ''}</div>`, root => {
    if (CH.hasAnim(e.anim)) sheetStop = CH.figure(root.querySelector('#xFig'), e.anim, { animate: true });
    const c = root.querySelector('#xChart');
    if (c) CH.lineChart(c, [{ pts: st.hist.filter(p => p.max).map(p => ({ x: CH.dateOf(p.date), y: p.max })), color: 'var(--red)', area: true, name: 'kg' }], { fmt: v => fr(v, 1) });
    root.querySelector('#xBody').onclick = () => { closeSheet(); showExoBody(e); };
    const ed = root.querySelector('#xEdit'); if (ed) ed.onclick = () => exoForm(e, () => renderExos());
  });
}
function showExoBody(e) {
  location.hash = 'corps';
  setTimeout(() => {
    const lv = {}; Object.keys(CH.MUSCLES).forEach(k => { lv[k] = (e.m || {})[k] || 0; });
    if (body3d) body3d.set(lv);
    $('#bodyTitle').textContent = e.name;
    $('#bodyNote').textContent = 'Muscles ciblés par ce mouvement';
    $('#bodyBars').innerHTML = Object.entries(e.m || {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="bar"><span>${CH.MUSCLES[k]}</span><span class="t"><i style="width:${v * 100}%;--c:${heat(v)}"></i></span><b>${v >= .75 ? 'princ.' : 'sec.'}</b></div>`).join('');
    $('#bodyLow').innerHTML = '';
    $$('#bodySeg button').forEach(b => b.setAttribute('aria-pressed', 'false'));
  }, 30);
}

// ---------- profil ----------
function renderProfil() {
  const p = D.profile;
  $$('#sexSeg button').forEach(b => { b.setAttribute('aria-pressed', b.dataset.s === p.sex); b.onclick = () => { p.sex = b.dataset.s; persist(); renderProfil(); }; });
  [['pAge', 'age'], ['pWeight', 'weight'], ['pHeight', 'height']].forEach(([id, k]) => { const i = $('#' + id); i.value = p[k] || ''; i.oninput = () => { p[k] = parseFloat(i.value) || null; persist(); bmrNote(); }; });
  bmrNote();
  $('#dataNote').textContent = `${D.sessions.filter(s => !s.demo).length} séances enregistrées, ${D.customExos.length} exercice${D.customExos.length > 1 ? 's' : ''} perso.`;
  $('#expBtn').onclick = () => {
    const blob = new Blob([JSON.stringify(D, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'chalk-sauvegarde-' + CH.today() + '.json';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('Sauvegarde exportée');
  };
  $('#impFile').onchange = ev => {
    const f = ev.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (!d || !Array.isArray(d.sessions)) throw 0;
        openSheet(`<div class="grab"><h2 style="margin:0">Importer ?</h2>${closeBtn}</div><p>Ce fichier contient ${d.sessions.length} séances. Il remplace les données actuelles de l'appli.</p><div class="row sec"><button class="btn red" id="impOk">Remplacer</button><button class="btn ghost" data-close>Annuler</button></div>`, root => {
          root.querySelector('#impOk').onclick = () => { D = d; D.profile = D.profile || {}; D.customExos = D.customExos || []; refreshExos(); persist(); closeSheet(); toast('Données importées'); renderProfil(); };
        });
      } catch (e) { toast('Fichier non reconnu'); }
      ev.target.value = '';
    };
    r.readAsText(f);
  };
  const rb = $('#resetBtn'); rb.textContent = 'Tout effacer'; rb.classList.remove('red'); delete rb.dataset.ok;
  rb.onclick = () => {
    if (!rb.dataset.ok) { rb.dataset.ok = 1; rb.textContent = 'Confirmer : tout effacer'; rb.classList.add('red'); return; }
    D = { profile: D.profile, sessions: [], customExos: [], demo: false }; refreshExos(); persist(); toast('Données effacées'); renderProfil();
  };
}
function bmrNote() {
  const b = CH.bmr(D.profile);
  $('#bmrNote').textContent = b ? `Métabolisme de base estimé : ${fr(b)} kcal par jour. Une heure de CrossFit à 8/10 d'effort ≈ ${fr(CH.kcal({ type: 'crossfit', rpe: 8, duration: 60 }, D.profile))} kcal.` : 'Remplis les quatre champs pour obtenir une estimation des calories de chaque séance.';
}

route();
}
