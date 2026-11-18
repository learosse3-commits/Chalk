/* Chalk — base de données des muscles et des exercices */
window.CH = window.CH || {};
{
const MUSCLES = {
  pecs: 'Pectoraux', delts: 'Épaules', biceps: 'Biceps', triceps: 'Triceps',
  forearms: 'Avant-bras', abs: 'Abdos', obliques: 'Obliques', traps: 'Trapèzes',
  lats: 'Dorsaux', lowback: 'Lombaires', glutes: 'Fessiers', quads: 'Quadriceps',
  hams: 'Ischios', adductors: 'Adducteurs', calves: 'Mollets'
};

const CATS = { halt: 'Haltéro', muscu: 'Muscu', gym: 'Gym', cardio: 'Cardio' };

// id, nom affiché, catégorie, animation, muscles {id: poids 0-1}, alias reconnus dans le texte
const E = (id, name, cat, anim, m, aliases) => ({ id, name, cat, anim, m, aliases: [name, ...aliases] });

const EXOS = [
  E('backsquat', 'Back squat', 'halt', 'backsquat', { quads: 1, glutes: .8, adductors: .5, lowback: .4, hams: .3, abs: .3 }, ['squat arriere', 'squat barre', 'squat', 'squats', 'bs']),
  E('frontsquat', 'Front squat', 'halt', 'frontsquat', { quads: 1, glutes: .6, abs: .5, adductors: .4, lowback: .3, traps: .2 }, ['squat avant', 'fs']),
  E('ohs', 'Overhead squat', 'halt', 'ohs', { quads: .9, delts: .7, glutes: .6, abs: .6, traps: .5 }, ['ohs', 'squat bras tendus']),
  E('airsquat', 'Air squat', 'gym', 'airsquat', { quads: 1, glutes: .6, adductors: .3 }, ['air squats', 'squat poids du corps', 'squats poids du corps']),
  E('pistol', 'Pistol squat', 'gym', 'airsquat', { quads: 1, glutes: .7, abs: .3 }, ['pistol', 'pistols', 'pistol squats']),
  E('goblet', 'Goblet squat', 'muscu', 'goblet', { quads: 1, glutes: .6, abs: .4, biceps: .2 }, ['goblet', 'goblet squats']),
  E('deadlift', 'Deadlift', 'halt', 'deadlift', { lowback: 1, hams: .9, glutes: .9, traps: .5, forearms: .5, quads: .4, lats: .3 }, ['souleve de terre', 'sdt', 'deadlifts']),
  E('sumo', 'Sumo deadlift', 'halt', 'deadlift', { glutes: 1, adductors: .8, lowback: .7, quads: .6, hams: .6, traps: .4 }, ['sdt sumo', 'sumo', 'sumo deadlift high pull', 'sdhp']),
  E('rdl', 'Romanian deadlift', 'muscu', 'rdl', { hams: 1, glutes: .8, lowback: .7, forearms: .3 }, ['rdl', 'sdt roumain', 'souleve de terre roumain', 'jambes tendues']),
  E('powerclean', 'Power clean', 'halt', 'clean', { quads: .8, glutes: .8, traps: .8, hams: .6, lowback: .6, delts: .4, forearms: .3 }, ['clean', 'cleans', 'epaule', 'power cleans', 'squat clean', 'full clean']),
  E('hangclean', 'Hang clean', 'halt', 'hangclean', { traps: .8, glutes: .8, quads: .7, hams: .6, lowback: .5, delts: .4 }, ['hang power clean', 'hpc', 'hang squat clean', 'epaule suspendu']),
  E('cj', 'Clean & jerk', 'halt', 'clean', { quads: .8, delts: .8, glutes: .7, traps: .7, triceps: .5, lowback: .5 }, ['clean and jerk', 'clean et jerk', 'epaule jete', 'c&j', 'cj']),
  E('snatch', 'Snatch', 'halt', 'snatch', { traps: .9, glutes: .8, delts: .8, quads: .7, hams: .6, lowback: .6, abs: .4, triceps: .3 }, ['arrache', 'power snatch', 'squat snatch', 'snatchs', 'hang snatch', 'hang power snatch']),
  E('dbsnatch', 'Dumbbell snatch', 'halt', 'dbsnatch', { delts: .8, glutes: .7, traps: .6, hams: .5, quads: .5, obliques: .4 }, ['db snatch', 'arrache haltere', 'snatch haltere', 'kb snatch']),
  E('strictpress', 'Strict press', 'halt', 'press', { delts: 1, triceps: .7, traps: .4, abs: .3 }, ['shoulder press', 'developpe militaire', 'overhead press', 'press', 'military press', 'developpe epaules']),
  E('pushpress', 'Push press', 'halt', 'pushpress', { delts: 1, triceps: .8, quads: .4, traps: .4, glutes: .3, abs: .3 }, ['push presses']),
  E('pushjerk', 'Push jerk', 'halt', 'pushpress', { delts: 1, triceps: .7, quads: .5, glutes: .3 }, ['jerk', 'split jerk', 'jete', 'jerks']),
  E('bench', 'Bench press', 'muscu', 'bench', { pecs: 1, triceps: .7, delts: .5 }, ['developpe couche', 'bench', 'dc']),
  E('row', 'Rowing barre', 'muscu', 'barbellrow', { lats: .9, traps: .6, biceps: .6, lowback: .4, delts: .4 }, ['bent over row', 'rowing haltere', 'tirage buste penche', 'pendlay row']),
  E('pulldown', 'Tirage vertical', 'muscu', 'pullup', { lats: 1, biceps: .7, traps: .3 }, ['lat pulldown', 'tirage poitrine', 'tirage nuque']),
  E('curl', 'Curl biceps', 'muscu', 'curl', { biceps: 1, forearms: .5 }, ['curl', 'curls', 'biceps curl', 'curl haltere', 'curl barre']),
  E('hipthrust', 'Hip thrust', 'muscu', 'hipthrust', { glutes: 1, hams: .6, quads: .3 }, ['hip thrusts', 'pont fessier', 'glute bridge']),
  E('thruster', 'Thruster', 'halt', 'thruster', { quads: .9, delts: .9, glutes: .7, triceps: .6, abs: .4 }, ['thrusters']),
  E('wallball', 'Wall ball', 'gym', 'wallball', { quads: .9, glutes: .7, delts: .7, triceps: .4 }, ['wall balls', 'wallball', 'wallballs', 'wb', 'wall ball shots']),
  E('kbswing', 'Kettlebell swing', 'gym', 'kbswing', { glutes: 1, hams: .8, lowback: .6, forearms: .4, delts: .3, abs: .3 }, ['kb swing', 'kb swings', 'swing', 'swings', 'russian swing', 'american swing', 'kettlebell swings']),
  E('lunge', 'Fentes', 'muscu', 'lunge', { quads: 1, glutes: .9, hams: .4, adductors: .4, calves: .2 }, ['fente', 'lunges', 'lunge', 'walking lunges', 'fentes marchees', 'fentes sautees', 'front rack lunges', 'overhead lunges']),
  E('boxjump', 'Box jump', 'gym', 'boxjump', { quads: .9, calves: .8, glutes: .7, hams: .4 }, ['box jumps', 'bj', 'box jump over', 'bjo', 'step up', 'step ups']),
  E('burpee', 'Burpee', 'gym', 'burpee', { pecs: .6, quads: .6, triceps: .5, abs: .5, delts: .4, glutes: .4, calves: .3 }, ['burpees', 'burpee over the bar', 'bar facing burpees', 'burpees over bar']),
  E('devilpress', 'Devil press', 'gym', 'burpee', { delts: .7, glutes: .7, hams: .5, pecs: .5, triceps: .5, quads: .4 }, ['devil presses']),
  E('pullup', 'Pull-up', 'gym', 'pullup', { lats: 1, biceps: .8, forearms: .6, traps: .4, delts: .3, abs: .2 }, ['pull up', 'pull ups', 'pullups', 'pullup', 'tractions', 'traction', 'chin up', 'chin ups', 'kipping pull up', 'strict pull up', 'butterfly pull up']),
  E('c2b', 'Chest to bar', 'gym', 'pullup', { lats: 1, biceps: .8, forearms: .6, traps: .5, abs: .3 }, ['c2b', 'ctb', 'chest to bar pull up']),
  E('muscleup', 'Muscle-up', 'gym', 'muscleup', { lats: 1, triceps: .8, pecs: .6, biceps: .6, forearms: .6, abs: .5, delts: .5 }, ['muscle up', 'muscle ups', 'muscle-ups', 'bar muscle up', 'ring muscle up', 'bmu', 'rmu']),
  E('t2b', 'Toes to bar', 'gym', 't2b', { abs: 1, obliques: .6, lats: .6, forearms: .6 }, ['t2b', 'ttb', 'knees to elbows', 'k2e', 'toes to bars', 'knee raises', 'releves de jambes']),
  E('hspu', 'Handstand push-up', 'gym', 'hspu', { delts: 1, triceps: .9, traps: .5, abs: .3 }, ['hspu', 'handstand push up', 'handstand push ups', 'pompes en equilibre', 'pike push up']),
  E('pushup', 'Pompes', 'gym', 'pushup', { pecs: 1, triceps: .7, delts: .5, abs: .3 }, ['pompe', 'push up', 'push ups', 'pushups', 'push-ups', 'hand release push up']),
  E('dips', 'Dips', 'gym', 'dips', { triceps: 1, pecs: .7, delts: .5 }, ['dip', 'ring dips', 'bar dips']),
  E('situp', 'Sit-up', 'gym', 'situp', { abs: 1, obliques: .4 }, ['sit up', 'sit ups', 'situps', 'abmat', 'crunch', 'crunchs', 'abdos', 'ghd sit up']),
  E('plank', 'Gainage', 'gym', 'plank', { abs: 1, obliques: .6, delts: .4, lowback: .3 }, ['planche', 'plank', 'gainage ventral']),
  E('ropeclimb', 'Rope climb', 'gym', 'ropeclimb', { forearms: 1, lats: .9, biceps: .9, abs: .4 }, ['rope climbs', 'montee de corde', 'montees de corde', 'legless rope climb']),
  E('du', 'Double unders', 'cardio', 'jumprope', { calves: 1, quads: .3, delts: .3, forearms: .3 }, ['double under', 'dus', 'double-unders', 'doubles']),
  E('su', 'Single unders', 'cardio', 'jumprope', { calves: .8, quads: .2 }, ['corde a sauter', 'sauts a la corde', 'single under', 'singles']),
  E('rower', 'Rameur', 'cardio', 'rower', { lats: .7, quads: .7, hams: .5, glutes: .5, biceps: .4, lowback: .3, delts: .2 }, ['row', 'rowing', 'concept2', 'rameur concept2']),
  E('bike', 'Assault bike', 'cardio', 'bike', { quads: 1, glutes: .6, hams: .5, calves: .3, delts: .3 }, ['bike', 'air bike', 'echo bike', 'velo', 'bike erg', 'airbike']),
  E('ski', 'Ski erg', 'cardio', 'ski', { lats: .9, triceps: .7, abs: .6, delts: .4, glutes: .3 }, ['skierg', 'ski']),
  E('run', 'Run', 'cardio', 'run', { quads: .8, calves: .8, hams: .6, glutes: .6 }, ['running', 'course', 'sprint', 'sprints', 'shuttle run'])
];

const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();

CH.MUSCLES = MUSCLES;
CH.CATS = CATS;
CH.BASE_EXOS = EXOS;
CH.norm = norm;
}
