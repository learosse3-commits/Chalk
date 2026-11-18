/* Chalk — mannequin 3D, muscles colorés selon la charge, rotation 360° au doigt */
window.CH = window.CH || {};
{
CH.Body3D = function (host, onPick) {
  if (!window.THREE) { host.innerHTML = '<p class="muted">Le corps 3D n\'a pas pu se charger.</p>'; return null; }
  const T = THREE;
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  host.appendChild(renderer.domElement);
  const scene = new T.Scene();
  const cam = new T.PerspectiveCamera(32, 1, .1, 20);
  cam.position.set(0, 1.0, 3.6);
  cam.lookAt(0, .93, 0);
  scene.add(new T.HemisphereLight(0xffffff, 0x777777, .75));
  const key = new T.DirectionalLight(0xffffff, .65); key.position.set(1.5, 2.5, 2.5); scene.add(key);
  const rim = new T.DirectionalLight(0xffffff, .35); rim.position.set(-2, 1.5, -2.5); scene.add(rim);

  const root = new T.Group(); scene.add(root);
  const probe = document.createElement('i'); probe.style.display = 'none'; host.appendChild(probe);
  const col = n => { probe.style.color = 'var(' + n + ')'; const c = getComputedStyle(probe).color; const m = c.match(/[\d.]+/g) || [150, 150, 150]; return new T.Color(m[0] / 255, m[1] / 255, m[2] / 255); };
  const skinMat = new T.MeshStandardMaterial({ color: col('--skin'), roughness: .75, metalness: 0 });
  const sph = new T.SphereGeometry(1, 32, 24);
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const UP = V(0, 1, 0);

  const ellip = (p, s, mat, parent = root) => { const m = new T.Mesh(sph, mat); m.position.copy(p); m.scale.set(s[0], s[1], s[2]); parent.add(m); return m; };
  const limb = (a, b, r1, r2, mat) => {
    const d = b.clone().sub(a), len = d.length();
    const g = new T.CylinderGeometry(r2, r1, len, 24, 1);
    const m = new T.Mesh(g, mat);
    m.position.copy(a.clone().add(b).multiplyScalar(.5));
    m.quaternion.setFromUnitVectors(UP, d.normalize());
    root.add(m);
    ellip(a, [r1, r1, r1], mat); ellip(b, [r2, r2, r2], mat);
    return m;
  };
  // squelette de base
  ellip(V(0, 1.67, 0), [.095, .115, .105], skinMat);
  limb(V(0, 1.5, -.01), V(0, 1.6, 0), .05, .045, skinMat);
  ellip(V(0, 1.33, 0), [.175, .17, .11], skinMat);
  ellip(V(0, 1.13, 0), [.135, .15, .095], skinMat);
  ellip(V(0, .96, 0), [.16, .1, .105], skinMat);
  const J = {};
  [1, -1].forEach(sx => {
    const s = sx > 0 ? 'r' : 'l';
    J[s] = {
      sh: V(.2 * sx, 1.43, 0), el: V(.245 * sx, 1.15, -.01), wr: V(.275 * sx, .9, .03),
      hip: V(.09 * sx, .95, 0), kn: V(.105 * sx, .52, .015), an: V(.11 * sx, .09, -.01)
    };
    const j = J[s];
    ellip(j.sh, [.06, .06, .06], skinMat);
    limb(j.sh, j.el, .045, .037, skinMat);
    limb(j.el, j.wr, .036, .027, skinMat);
    ellip(V(.282 * sx, .84, .035), [.03, .05, .02], skinMat);
    limb(j.hip, j.kn, .078, .05, skinMat);
    limb(j.kn, j.an, .05, .033, skinMat);
    ellip(V(.11 * sx, .035, .05), [.042, .03, .1], skinMat);
  });

  // muscles : groupe, position, échelle, orientation optionnelle (segment)
  const muscles = [];
  const M = (id, p, s, seg) => {
    const mat = new T.MeshStandardMaterial({ color: col('--muscle-off'), roughness: .6, metalness: 0 });
    const m = ellip(p, s, mat);
    if (seg) m.quaternion.setFromUnitVectors(UP, seg[1].clone().sub(seg[0]).normalize());
    m.userData.id = id;
    muscles.push(m);
  };
  const mid = (a, b, off) => a.clone().add(b).multiplyScalar(.5).add(off);
  [1, -1].forEach(sx => {
    const j = J[sx > 0 ? 'r' : 'l'];
    M('pecs', V(.08 * sx, 1.375, .09), [.085, .055, .03]);
    M('delts', V(.205 * sx, 1.425, 0), [.064, .068, .066]);
    M('biceps', mid(j.sh, j.el, V(.004 * sx, -.02, .03)), [.033, .09, .03], [j.sh, j.el]);
    M('triceps', mid(j.sh, j.el, V(.004 * sx, -.01, -.032)), [.034, .095, .03], [j.sh, j.el]);
    M('forearms', mid(j.el, j.wr, V(0, .04, .006)), [.034, .085, .033], [j.el, j.wr]);
    M('obliques', V(.102 * sx, 1.12, .055), [.04, .09, .045]);
    M('traps', V(.075 * sx, 1.495, -.03), [.075, .045, .045]);
    M('lats', V(.112 * sx, 1.27, -.068), [.072, .13, .045]);
    M('lowback', V(.042 * sx, 1.07, -.083), [.035, .075, .028]);
    M('glutes', V(.075 * sx, .93, -.064), [.08, .08, .05]);
    M('quads', mid(j.hip, j.kn, V(0, -.01, .03)), [.062, .17, .045], [j.hip, j.kn]);
    M('hams', mid(j.hip, j.kn, V(0, -.01, -.03)), [.056, .16, .042], [j.hip, j.kn]);
    M('adductors', mid(j.hip, j.kn, V(-.035 * sx, .05, 0)), [.03, .12, .04], [j.hip, j.kn]);
    M('calves', V(.107 * sx, .37, -.03), [.043, .105, .042]);
  });
  M('abs', V(0, 1.15, .087), [.068, .14, .03]);
  M('traps', V(0, 1.39, -.088), [.06, .095, .03]);

  // couleurs selon intensité 0..1
  const cOff = col('--muscle-off'), cLo = col('--heat-lo'), cMid = col('--heat-mid'), cHi = col('--heat-hi');
  let levels = {};
  const paint = () => muscles.forEach(m => {
    const v = levels[m.userData.id] || 0;
    const c = new T.Color();
    if (v <= 0) c.copy(cOff);
    else if (v < .5) c.copy(cLo).lerp(cMid, v / .5);
    else c.copy(cMid).lerp(cHi, (v - .5) / .5);
    m.material.color.copy(c);
    m.material.emissive = new T.Color(v > 0 ? c : 0x000000).multiplyScalar(v > 0 ? .12 : 0);
  });

  // rotation au doigt
  let rotY = .5, rotX = .05, drag = null, idle = 0, need = true;
  const el = renderer.domElement;
  el.style.touchAction = 'pan-y';
  el.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, rx: rotX, ry: rotY, moved: 0 }; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
    rotY = drag.ry + dx * .012; rotX = Math.max(-.45, Math.min(.45, drag.rx + dy * .006)); idle = 0; need = true;
  });
  const ray = new T.Raycaster(), ptr = new T.Vector2();
  el.addEventListener('pointerup', e => {
    if (drag && drag.moved < 6 && onPick) {
      const r = el.getBoundingClientRect();
      ptr.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ptr, cam);
      const hit = ray.intersectObjects(muscles)[0];
      onPick(hit ? hit.object.userData.id : null);
    }
    drag = null;
  });

  let w = 0, h = 0, alive = true, last = performance.now();
  const size = () => { w = host.clientWidth; h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); el.style.width = w + 'px'; el.style.height = h + 'px'; cam.aspect = w / h; cam.updateProjectionMatrix(); need = true; };
  const ro = new ResizeObserver(size); ro.observe(host); size();
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tick = now => {
    if (!alive) return;
    const dt = Math.min(64, now - last); last = now;
    idle += dt;
    if (!drag && idle > 2500 && !reduce) { rotY += dt * .00035; need = true; }
    if (need && w) { root.rotation.set(rotX, rotY, 0); renderer.render(scene, cam); need = false; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  paint();
  return {
    set(lv) { levels = lv || {}; paint(); need = true; },
    face(side) { rotY = side === 'dos' ? Math.PI : 0; rotX = .05; idle = 0; need = true; },
    destroy() { alive = false; ro.disconnect(); renderer.dispose(); }
  };
};
}
