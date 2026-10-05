import * as T from 'three';

// Procedural chibi hero (girl / boy) with walk cycle, idle breathing, blinking and a "work" swing.
const mats = new Map();
function mat(color, rough = .7) {
  const k = color + rough;
  if (!mats.has(k)) mats.set(k, new T.MeshStandardMaterial({ color, roughness: rough }));
  return mats.get(k);
}
function add(parent, geo, color, x = 0, y = 0, z = 0, sx = 1, sy = sx, sz = sx, rough) {
  const m = new T.Mesh(geo, mat(color, rough)); m.position.set(x, y, z); m.scale.set(sx, sy, sz);
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
const G = {
  sphere: new T.SphereGeometry(1, 24, 18),
  smallSphere: new T.SphereGeometry(1, 12, 10),
  capsule: new T.CapsuleGeometry(1, 1, 4, 10),
  cyl: new T.CylinderGeometry(1, 1, 1, 18),
  hairCap: new T.SphereGeometry(1, 28, 18, 0, Math.PI * 2, 0, Math.PI * .56),
  smile: new T.TorusGeometry(.05, .014, 6, 14, Math.PI),
  shoe: new T.SphereGeometry(1, 14, 10),
};

export function createHero(parent, avatar = 'girl') {
  const girl = avatar !== 'boy';
  const skin = '#f7d2b4';
  const C = girl
    ? { top: '#e65a52', bottom: '#e65a52', shoe: '#8b4a2d', hair: '#6e3b22', bag: '#f2b443', accent: '#fff4e6' }
    : { top: '#3fa2a3', bottom: '#41598f', shoe: '#5b3a28', hair: '#5a3620', bag: '#f2b443', accent: '#fff4e6' };

  const root = new T.Group(); root.scale.setScalar(1.15); parent.add(root);
  const shadow = new T.Mesh(new T.CircleGeometry(.42, 24), new T.MeshBasicMaterial({ color: '#1d3322', transparent: true, opacity: .28, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .03; root.add(shadow);

  const body = new T.Group(); root.add(body);
  // Legs (pivot at hip)
  const legs = [-1, 1].map(s => {
    const hip = new T.Group(); hip.position.set(s * .1, .46, 0); body.add(hip);
    add(hip, G.capsule, girl ? skin : C.bottom, 0, -.2, 0, .075, .16, .075);
    add(hip, G.shoe, C.shoe, 0, -.42, .04, .1, .07, .14);
    return hip;
  });
  // Torso
  if (girl) {
    const dress = new T.Mesh(new T.CylinderGeometry(.19, .34, .52, 20), mat(C.top)); dress.position.y = .66; dress.castShadow = true; body.add(dress);
    add(body, G.cyl, C.accent, 0, .92, 0, .2, .04, .2);
    add(body, G.smallSphere, C.accent, 0, .52, .3, .05);
  } else {
    add(body, G.cyl, C.top, 0, .72, 0, .21, .42, .19);
    add(body, G.cyl, C.bottom, 0, .5, 0, .225, .14, .2);
    add(body, G.cyl, C.accent, 0, .92, 0, .17, .035, .17);
  }
  // Backpack
  add(body, new T.BoxGeometry(.32, .34, .16), C.bag, 0, .72, -.24);
  add(body, new T.BoxGeometry(.26, .12, .04), '#e39a2b', 0, .66, -.33);
  // Arms (pivot at shoulder)
  const arms = [-1, 1].map(s => {
    const sh = new T.Group(); sh.position.set(s * .25, .86, 0); body.add(sh);
    add(sh, G.capsule, C.top, 0, -.06, 0, .07, .06, .07);
    add(sh, G.capsule, skin, 0, -.2, 0, .055, .1, .055);
    add(sh, G.smallSphere, skin, 0, -.33, 0, .065);
    sh.rotation.z = s * .12;
    return sh;
  });
  // Head
  const neck = new T.Group(); neck.position.y = .95; body.add(neck);
  const head = new T.Group(); head.position.y = .38; neck.add(head);
  add(head, G.sphere, skin, 0, 0, 0, .4, .38, .37);
  const eyes = [-1, 1].map(s => {
    const e = new T.Group(); e.position.set(s * .14, -.01, .33); head.add(e);
    add(e, G.smallSphere, '#2a1d17', 0, 0, 0, .055, .075, .03, .3);
    add(e, G.smallSphere, '#ffffff', -.018, .025, .025, .02, .02, .01, .2);
    return e;
  });
  for (const s of [-1, 1]) add(head, G.smallSphere, '#f59a95', s * .23, -.11, .27, .06, .035, .02);
  const mouth = new T.Mesh(G.smile, mat('#8a3b2e')); mouth.rotation.z = Math.PI; mouth.position.set(0, -.13, .355); head.add(mouth);
  add(head, G.smallSphere, '#f0bf9f', 0, -.05, .37, .03, .025, .02);
  // Ears
  for (const s of [-1, 1]) add(head, G.smallSphere, skin, s * .39, -.03, 0, .06, .08, .05);
  // Hair
  const hair = new T.Group(); head.add(hair);
  const cap = new T.Mesh(G.hairCap, mat(C.hair, .8)); cap.scale.set(.43, .43, .41); cap.position.set(0, .02, -.02); cap.rotation.x = -.25; cap.castShadow = true; hair.add(cap);
  if (girl) {
    // Curly bangs + bouncy curls around the head + two puff pigtails.
    for (let i = 0; i < 7; i++) { const a = -.9 + i * .3; add(hair, G.smallSphere, C.hair, Math.sin(a) * .3, .2 - Math.abs(a) * .05, Math.cos(a) * .27, .1, .09, .08, .8); }
    for (let i = 0; i < 11; i++) { const a = Math.PI * .45 + i * (Math.PI * 1.1 / 10); add(hair, G.smallSphere, C.hair, Math.cos(a) * .38, -.12 - (i % 2) * .08, -Math.abs(Math.sin(a)) * .3 - .05, .13, .14, .12, .8); }
    const tails = [-1, 1].map(s => { const t = new T.Group(); t.position.set(s * .38, .08, -.08); hair.add(t); add(t, G.smallSphere, C.hair, s * .08, -.1, 0, .14, .17, .13, .8); add(t, G.smallSphere, '#ffd34d', 0, .03, 0, .05); return t; });
    hair.userData.tails = tails;
  } else {
    for (let i = 0; i < 5; i++) { const a = -.7 + i * .35; const tuft = add(hair, G.smallSphere, C.hair, Math.sin(a) * .28, .24, Math.cos(a) * .28, .11, .08, .1, .8); tuft.rotation.x = .5; }
    const spike = add(hair, G.smallSphere, C.hair, .05, .42, .05, .06, .12, .06, .8); spike.rotation.z = -.4;
  }

  let yaw = 0, phase = 0, lastTime = 0, nextBlink = 2, blinkUntil = 0, lastSin = 0;
  const api = { root, body, onStep: null };

  api.update = ({ moving, speed = 0, dx = 0, dz = 0, time, busy }) => {
    const dt = Math.min(.1, Math.max(0, time - lastTime)); lastTime = time;
    if (moving && (dx || dz)) {
      const target = Math.atan2(dx, dz);
      const diff = Math.atan2(Math.sin(target - yaw), Math.cos(target - yaw));
      yaw += diff * Math.min(1, dt * 12);
    }
    root.rotation.y = yaw;
    if (moving) {
      phase += dt * (6 + speed * 1.6);
      const s = Math.sin(phase);
      legs[0].rotation.x = s * .75; legs[1].rotation.x = -s * .75;
      arms[0].rotation.x = -s * .7; arms[1].rotation.x = s * .7;
      body.position.y = Math.abs(Math.cos(phase)) * .07;
      body.rotation.x = .08;
      head.rotation.set(0, 0, Math.sin(phase) * .04);
      if ((s > 0) !== (lastSin > 0)) api.onStep?.();
      lastSin = s;
    } else {
      const k = Math.min(1, dt * 10);
      legs.forEach(l => { l.rotation.x *= 1 - k; });
      arms.forEach(a => { a.rotation.x *= 1 - k; });
      body.position.y = Math.sin(time * 2.2) * .01; body.rotation.x *= 1 - k;
      body.scale.y = 1 + Math.sin(time * 2.2) * .012;
      head.rotation.y = Math.sin(time * .6) * .25; head.rotation.x = Math.sin(time * .9) * .05;
    }
    if (busy) {
      arms[1].rotation.x = -1.6 + Math.sin(time * 14) * .9;
      arms[0].rotation.x = -.4 + Math.sin(time * 14 + 1) * .3;
      body.position.y = Math.abs(Math.sin(time * 14)) * .05;
    }
    const tails = hair.userData.tails;
    if (tails) tails.forEach((t, i) => { t.rotation.z = Math.sin(time * (moving ? 12 : 2) + i) * (moving ? .18 : .05); });
    // Blink
    if (time > nextBlink) { blinkUntil = time + .12; nextBlink = time + 2.2 + Math.random() * 3; }
    const lid = time < blinkUntil ? .12 : 1; eyes.forEach(e => { e.scale.y = lid; });
  };
  return api;
}
