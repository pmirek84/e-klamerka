import * as T from 'three';
import { blobGeometry } from './nature.js';
import { rng, U } from './shared.js';
import { WATER_Y, PONDS } from './terrain.js';

const std = (color, extra = {}) => new T.MeshStandardMaterial({ color, roughness: .8, ...extra });
function mesh(parent, geo, mat, x = 0, y = 0, z = 0, sx = 1, sy = sx, sz = sx) {
  const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
const SPH = new T.SphereGeometry(1, 14, 10), BOX = new T.BoxGeometry(1, 1, 1), CYL = new T.CylinderGeometry(1, 1, 1, 10);

// Lantern glass glows at night (bloom picks it up on desktop).
export const lanternGlass = std('#fff1c4', { emissive: '#ffb547', emissiveIntensity: .1 });
export const LANTERNS = [[1.5, 9.6], [-1.9, 3.6], [3.4, 6.2], [-8.2, 1.6], [11.3, -1.6], [-11.6, 1.5], [1.5, -9.8]];
export const CAMPFIRE = [-26.3, 5];

function lantern(parent, x, z) {
  const g = new T.Group(); g.position.set(x, 0, z); parent.add(g);
  const wood = std('#5b3b28'), metal = std('#2f3337', { roughness: .5 });
  mesh(g, CYL, wood, 0, .9, 0, .07, 1.8, .07);
  mesh(g, CYL, wood, 0, .08, 0, .16, .16, .16);
  mesh(g, BOX, wood, .2, 1.72, 0, .5, .06, .06);
  const lamp = new T.Group(); lamp.position.set(.4, 1.42, 0); g.add(lamp);
  mesh(lamp, BOX, metal, 0, .2, 0, .26, .04, .26);
  mesh(lamp, BOX, lanternGlass, 0, 0, 0, .19, .32, .19);
  mesh(lamp, BOX, metal, 0, -.18, 0, .22, .04, .22);
  for (const [a, b] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) mesh(lamp, BOX, metal, a * .1, 0, b * .1, .025, .34, .025);
  mesh(lamp, new T.ConeGeometry(.2, .14, 4), metal, 0, .29, 0).rotation.y = Math.PI / 4;
  return g;
}

function sheep(parent, seed) {
  const root = new T.Group(); parent.add(root);
  const wool = std('#fbfbf6', { roughness: 1 }), face = std('#3b302b'), leg = std('#3b302b');
  const body = new T.Group(); root.add(body);
  [[0, .62, 0, .48, .4, .58], [0, .78, -.12, .36], [0, .74, .22, .34], [-.22, .68, -.05, .3], [.22, .68, .05, .3]]
    .forEach(([x, y, z, sx, sy = sx, sz = sx], i) => mesh(body, blobGeometry(1, i + 2, .18), wool, x, y, z, sx, sy, sz));
  const head = new T.Group(); head.position.set(0, .68, .5); body.add(head);
  mesh(head, SPH, face, 0, 0, .06, .17, .19, .2);
  mesh(head, blobGeometry(1, 5, .2), wool, 0, .14, 0, .18, .12, .16);
  const ears = [];
  for (const s of [-1, 1]) {
    mesh(head, SPH, std('#ffffff'), s * .08, .04, .2, .045);
    mesh(head, SPH, std('#111111'), s * .08, .04, .235, .022);
    const ear = mesh(head, SPH, face, s * .18, .04, -.02, .09, .04, .05);
    ears.push(ear);
  }
  // Fluffy little tail
  const tail = mesh(body, SPH, wool, 0, .68, -.45, .1, .1, .12);
  const legs = [];
  for (const [x, z] of [[-.2, -.25], [.2, -.25], [-.2, .25], [.2, .25]]) { const l = mesh(body, CYL, leg, x, .2, z, .06, .4, .06); legs.push(l); }
  const shadow = new T.Mesh(new T.CircleGeometry(.55, 20), new T.MeshBasicMaterial({ color: '#1d3322', transparent: true, opacity: .2, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .03; root.add(shadow);
  return { root, body, head, legs, ears, tail, seed, state: 'idle', until: 0, target: new T.Vector3(), yaw: 0, hopTime: 0 };
}

function duck(parent) {
  const g = new T.Group(); parent.add(g);
  const body = std('#fff7e0'), beak = std('#f39a2c');
  const torso = mesh(g, SPH, body, 0, .12, 0, .2, .14, .26);
  const head = mesh(g, SPH, body, 0, .3, .14, .11);
  mesh(head, SPH, beak, 0, -.02, .12, .06, .025, .07);
  mesh(head, SPH, std('#5aa04a'), 0, .04, -.01, .08, .05, .08);
  mesh(g, new T.ConeGeometry(.07, .14, 6), body, 0, .2, -.26).rotation.x = -1.2;
  for (const s of [-1, 1]) mesh(head, SPH, std('#111'), s * .07, .03, .08, .018);
  return { g, head, torso, dip: 0 };
}

function chicken(parent, seed) {
  const root = new T.Group(); parent.add(root);
  const white = std('#fffdf5'), red = std('#d94336'), orange = std('#f38d26'), legCol = std('#e59a35');
  const body = new T.Group(); root.add(body);
  mesh(body, SPH, white, 0, .24, 0, .18, .2, .24);
  // Wings
  const wings = [-1, 1].map(s => {
    const w = mesh(body, SPH, white, s * .17, .24, 0, .04, .13, .16);
    w.rotation.z = s * .15;
    return w;
  });
  // Tail feathers
  const tail = mesh(body, new T.ConeGeometry(.07, .2, 5), white, 0, .32, -.2);
  tail.rotation.x = -1.1;
  // Head & comb
  const head = new T.Group(); head.position.set(0, .38, .16); body.add(head);
  mesh(head, SPH, white, 0, 0, 0, .11, .13, .12);
  mesh(head, BOX, red, 0, .13, 0, .035, .09, .12); // red comb
  mesh(head, new T.ConeGeometry(.035, .1, 4), orange, 0, -.01, .14).rotation.x = Math.PI / 2; // beak
  mesh(head, SPH, red, 0, -.08, .08, .03, .05, .03); // wattle
  for (const s of [-1, 1]) mesh(head, SPH, std('#111'), s * .06, .025, .08, .015);
  // Legs
  const legs = [-1, 1].map(s => mesh(body, CYL, legCol, s * .07, .08, 0, .018, .16, .018));
  // Shadow
  const shadow = new T.Mesh(new T.CircleGeometry(.24, 14), new T.MeshBasicMaterial({ color: '#1d3322', transparent: true, opacity: .22, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .02; root.add(shadow);
  return { root, body, head, wings, legs, seed, state: 'idle', until: 0, target: new T.Vector3(), yaw: 0, peckTime: 0 };
}

function makeGlowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}

export function createAmbient(scene, { walkable, quality }) {
  const root = new T.Group(); scene.add(root);
  const r = rng(1234);
  const low = quality === 'low';
  LANTERNS.forEach(([x, z]) => lantern(root, x, z));

  // Night lights: warm glow near the house and the campfire.
  const houseLight = new T.PointLight('#ffb35c', 0, 12, 1.6); houseLight.position.set(-2.4, 2.4, .6); root.add(houseLight);
  const fireLight = new T.PointLight('#ff8a3c', 0, 10, 1.6); fireLight.position.set(CAMPFIRE[0], 1.2, CAMPFIRE[1]); root.add(fireLight);
  const heroLight = new T.PointLight('#ffd29a', 0, 9, 1.4); root.add(heroLight);
  if (low) { houseLight.visible = false; }

  // Campfire in the woodland camp.
  const fire = new T.Group(); fire.position.set(CAMPFIRE[0], 0, CAMPFIRE[1]); root.add(fire);
  for (let i = 0; i < 3; i++) { const l = mesh(fire, CYL, std('#6b4630'), 0, .12, 0, .08, .8, .08); l.rotation.z = Math.PI / 2; l.rotation.y = i * 1.05; }
  const flameMat = [std('#ff7a2a', { emissive: '#ff5a1a', emissiveIntensity: 2.2 }), std('#ffd25a', { emissive: '#ffc23a', emissiveIntensity: 2.6 })];
  const flames = [[0, .35, 0, .28, .7, 0], [.1, .3, .08, .18, .5, 1], [-.1, .28, -.06, .16, .45, 1]].map(([x, y, z, rr, hh, m]) => mesh(fire, new T.ConeGeometry(rr, hh, 7), flameMat[m], x, y, z));
  flames.forEach(f => { f.castShadow = false; });

  // Sheep wandering on the farm pasture and the meadow.
  const pastures = [[7.6, 6.6, 2.4], [-7.5, -6, 1.6], [29, -5, 3], [26, 3, 2.5]];
  const flock = [];
  pastures.forEach(([px, pz, rad], pi) => {
    const n = pi === 1 ? 1 : 2;
    for (let k = 0; k < n; k++) {
      const s = sheep(root, pi * 3 + k); s.home = [px, pz, rad];
      s.root.position.set(px + (r() - .5) * rad, 0, pz + (r() - .5) * rad); s.root.scale.setScalar(.85 + r() * .25);
      s.until = r() * 3; flock.push(s);
    }
  });

  // Chickens strutting on the farm
  const chickenSpots = [[3.5, 3.8, 1.8], [6.2, 5.5, 2.0], [-1.5, 4.2, 1.5]];
  const chickens = chickenSpots.map(([cx, cz, rad], i) => {
    const ch = chicken(root, 77 + i);
    ch.home = [cx, cz, rad];
    ch.root.position.set(cx + (r() - .5) * rad, 0, cz + (r() - .5) * rad);
    ch.until = r() * 2;
    return ch;
  });

  // Ducks paddling on the ponds.
  const ducks = [];
  PONDS.forEach((p, pi) => {
    for (let k = 0; k < (pi ? 3 : 2); k++) {
      const d = duck(root);
      ducks.push({ d, p, a: r() * 6.28, speed: .14 + r() * .14, rr: .35 + r() * .35, nextDip: 2 + r() * 5, dipVal: 0 });
    }
  });

  // Water ripples on the ponds.
  const rippleCount = low ? 6 : 14;
  const rippleGeo = new T.RingGeometry(.08, .12, 16); rippleGeo.rotateX(-Math.PI / 2);
  const rippleMat = new T.MeshBasicMaterial({ color: '#c4f3fa', transparent: true, opacity: .45, depthWrite: false });
  const ripples = Array.from({ length: rippleCount }, () => {
    const m = new T.Mesh(rippleGeo, rippleMat.clone());
    m.position.y = WATER_Y + .01; m.visible = false; root.add(m);
    return { mesh: m, life: 0, maxLife: 1.8, x: 0, z: 0 };
  });
  let nextRippleIdx = 0;
  function spawnRipple(x, z) {
    const rp = ripples[nextRippleIdx]; nextRippleIdx = (nextRippleIdx + 1) % rippleCount;
    rp.x = x; rp.z = z; rp.life = rp.maxLife;
    rp.mesh.position.set(x, WATER_Y + .01, z);
    rp.mesh.visible = true;
  }

  // Floating atmospheric leaves & petals drifting across the breeze.
  const leafCount = low ? 18 : 45;
  const leafGeo = new T.PlaneGeometry(.14, .18); leafGeo.rotateX(Math.PI / 4);
  const leafColors = ['#f59e42', '#e85d43', '#88c558', '#ffd152', '#f2a7be'];
  const leafMats = leafColors.map(c => new T.MeshBasicMaterial({ color: c, side: T.DoubleSide, transparent: true, opacity: .85 }));
  const leaves = Array.from({ length: leafCount }, (_, i) => {
    const mat = leafMats[i % leafMats.length];
    const m = new T.Mesh(leafGeo, mat);
    root.add(m);
    return {
      m,
      seed: r() * 100,
      x: (r() - .5) * 44,
      y: 1.2 + r() * 4.5,
      z: (r() - .5) * 44,
      speedY: .4 + r() * .5,
      rotSpeed: (r() - .5) * 3,
      wobbleSpeed: 1.2 + r() * 1.5,
    };
  });

  // Butterflies (day) and fireflies (night).
  const wingGeo = new T.CircleGeometry(.11, 8); wingGeo.translate(.1, 0, 0);
  const butterflies = [];
  for (let i = 0; i < (low ? 8 : 16); i++) {
    const color = ['#ffd34f', '#ff8fb8', '#9fd2ff', '#ffffff', '#c3a2ff'][i % 5];
    const m = new T.MeshStandardMaterial({ color, side: T.DoubleSide, emissive: color, emissiveIntensity: .25 });
    const g = new T.Group(); root.add(g);
    const wl = new T.Mesh(wingGeo, m), wr = new T.Mesh(wingGeo, m); wr.scale.x = -1; g.add(wl, wr);
    butterflies.push({ g, wl, wr, seed: r() * 100, ox: (r() - .5) * 22, oz: (r() - .5) * 18 });
  }
  const glowTex = makeGlowTexture();
  const ffCount = low ? 50 : 110, ffPos = new Float32Array(ffCount * 3), ffSeed = [];
  for (let i = 0; i < ffCount; i++) ffSeed.push([(r() - .5) * 30, .4 + r() * 2.2, (r() - .5) * 26, r() * 10]);
  const ffGeo = new T.BufferGeometry(); ffGeo.setAttribute('position', new T.BufferAttribute(ffPos, 3));
  const fireflies = new T.Points(ffGeo, new T.PointsMaterial({ map: glowTex, color: '#d8ff7a', size: .5, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
  fireflies.frustumCulled = false; root.add(fireflies);

  // Chimney smoke.
  const smokeMat = new T.SpriteMaterial({ map: glowTex, color: '#f4f1ea', transparent: true, opacity: 0, depthWrite: false });
  const puffs = Array.from({ length: 12 }, (_, i) => { const s = new T.Sprite(smokeMat.clone()); s.userData.t = i / 12 * 4; root.add(s); return s; });
  const fireSparks = Array.from({ length: 6 }, (_, i) => { const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: '#ffb347', transparent: true, depthWrite: false, blending: T.AdditiveBlending })); s.userData.t = i / 6 * 1.5; root.add(s); return s; });

  let houseLevel = 0;
  const tmp = new T.Vector3();
  let lastRippleCheck = 0;

  function update(dt, time, { night, player }) {
    lanternGlass.emissiveIntensity = .15 + night * 3.2;
    houseLight.intensity = houseLevel ? night * 14 : 0;
    heroLight.intensity = night * 9; heroLight.position.set(player.x, 2.2, player.z + .6);
    fireLight.intensity = (1.5 + night * 16) * (.85 + Math.sin(time * 13) * .08 + Math.sin(time * 7.3) * .07);
    flames.forEach((f, i) => { f.scale.y = 1 + Math.sin(time * (9 + i * 2) + i) * .18; f.rotation.y = time * (1 + i); });
    fireSparks.forEach(s => { s.userData.t = (s.userData.t + dt) % 1.5; const t = s.userData.t / 1.5; s.position.set(CAMPFIRE[0] + Math.sin(t * 9 + s.id) * .2, .4 + t * 1.6, CAMPFIRE[1] + Math.cos(t * 7 + s.id) * .2); s.scale.setScalar(.18 * (1 - t)); s.material.opacity = 1 - t; });

    // Sheep updates
    for (const s of flock) {
      const p = s.root.position;
      if (s.state === 'idle' && time > s.until) {
        if (r() < .25) {
          // Playful hop!
          s.state = 'hop';
          s.hopTime = 0;
        } else {
          for (let tries = 0; tries < 6; tries++) {
            const [hx, hz, rad] = s.home, a = r() * 6.28, d = r() * rad;
            s.target.set(hx + Math.cos(a) * d, 0, hz + Math.sin(a) * d);
            if (walkable(s.target.x, s.target.z)) { s.state = 'walk'; break; }
          }
          s.until = time + 2 + r() * 4;
        }
      }

      if (s.state === 'hop') {
        s.hopTime += dt * 3.8;
        const hopY = Math.sin(s.hopTime * Math.PI) * .28;
        s.body.position.y = Math.max(0, hopY);
        s.head.rotation.x = -hopY * .5;
        s.ears.forEach((e, i) => { e.rotation.z = (i === 0 ? -1 : 1) * Math.sin(s.hopTime * 8) * .35; });
        if (s.tail) s.tail.rotation.y = Math.sin(s.hopTime * 14) * .6;
        if (s.hopTime >= 1) { s.state = 'idle'; s.until = time + 1.5 + r() * 3; s.body.position.y = 0; }
      } else if (s.state === 'walk') {
        tmp.copy(s.target).sub(p); const len = tmp.length();
        if (len < .1) { s.state = 'idle'; s.until = time + 2 + r() * 4; }
        else {
          tmp.normalize(); p.addScaledVector(tmp, Math.min(len, dt * .7));
          const want = Math.atan2(tmp.x, tmp.z); s.yaw += Math.atan2(Math.sin(want - s.yaw), Math.cos(want - s.yaw)) * Math.min(1, dt * 5);
          s.legs.forEach((l, i) => { l.rotation.x = Math.sin(time * 10 + i * Math.PI) * .4; });
          s.body.position.y = Math.abs(Math.sin(time * 10)) * .03;
          s.ears.forEach(e => { e.rotation.z = Math.sin(time * 10) * .1; });
          if (s.tail) s.tail.rotation.y = Math.sin(time * 12) * .4;
        }
      } else {
        // Idle / Grazing
        s.legs.forEach(l => { l.rotation.x = 0; });
        s.head.rotation.x = .35 + Math.sin(time * 3 + s.seed) * .15; // grazing
        s.head.rotation.y = Math.sin(time * 1.2 + s.seed) * .12;
        s.body.position.y = 0;
        s.ears.forEach((e, i) => { e.rotation.z = (i === 0 ? -1 : 1) * (.05 + Math.sin(time * 4 + s.seed) * .08); });
        if (s.tail) s.tail.rotation.y = Math.sin(time * 5 + s.seed) * .25;
      }
      if (s.state === 'walk' || s.state === 'hop') s.head.rotation.x = 0;
      s.root.rotation.y = s.yaw;
    }

    // Chicken updates
    for (const ch of chickens) {
      const p = ch.root.position;
      if (ch.state === 'idle' && time > ch.until) {
        if (r() < .45) {
          ch.state = 'peck';
          ch.peckTime = 0;
        } else {
          for (let tries = 0; tries < 6; tries++) {
            const [hx, hz, rad] = ch.home, a = r() * 6.28, d = r() * rad;
            ch.target.set(hx + Math.cos(a) * d, 0, hz + Math.sin(a) * d);
            if (walkable(ch.target.x, ch.target.z)) { ch.state = 'walk'; break; }
          }
          ch.until = time + 1.5 + r() * 3;
        }
      }

      if (ch.state === 'peck') {
        ch.peckTime += dt * 5;
        ch.head.rotation.x = Math.abs(Math.sin(ch.peckTime * Math.PI)) * .65; // pecking down
        if (ch.peckTime >= 2.5) { ch.state = 'idle'; ch.until = time + 1.5 + r() * 2.5; ch.head.rotation.x = 0; }
      } else if (ch.state === 'walk') {
        tmp.copy(ch.target).sub(p); const len = tmp.length();
        if (len < .08) { ch.state = 'idle'; ch.until = time + 1 + r() * 3; }
        else {
          tmp.normalize(); p.addScaledVector(tmp, Math.min(len, dt * .65));
          const want = Math.atan2(tmp.x, tmp.z); ch.yaw += Math.atan2(Math.sin(want - ch.yaw), Math.cos(want - ch.yaw)) * Math.min(1, dt * 6);
          ch.legs.forEach((l, i) => { l.rotation.x = Math.sin(time * 14 + i * Math.PI) * .45; });
          ch.body.position.y = Math.abs(Math.sin(time * 14)) * .02;
          ch.head.position.z = .16 + Math.sin(time * 14) * .03; // chicken head-bobbing stride
        }
      } else {
        ch.legs.forEach(l => { l.rotation.x = 0; });
        ch.body.position.y = 0;
        ch.head.rotation.x = Math.sin(time * 2 + ch.seed) * .08;
      }
      ch.root.rotation.y = ch.yaw;
    }

    // Ducks updates
    for (const dk of ducks) {
      dk.a += dt * dk.speed;
      const x = dk.p.x + Math.cos(dk.a) * dk.p.rx * dk.rr, z = dk.p.z + Math.sin(dk.a) * dk.p.rz * dk.rr;
      // Head dipping underwater occasionally
      if (time > dk.nextDip) {
        dk.dipVal = Math.sin((time - dk.nextDip) * 3);
        if (time - dk.nextDip > Math.PI / 3) { dk.nextDip = time + 4 + r() * 7; dk.dipVal = 0; }
      }
      dk.d.g.position.set(x, WATER_Y - .04 + Math.sin(time * 2.5 + dk.a * 3) * .02, z);
      dk.d.g.rotation.y = Math.atan2(-Math.sin(dk.a) * dk.p.rx, Math.cos(dk.a) * dk.p.rz);
      dk.d.head.rotation.x = dk.dipVal * .8;
      dk.d.torso.rotation.x = -dk.dipVal * .3;
    }

    // Water ripple spawn check
    if (time - lastRippleCheck > .35) {
      lastRippleCheck = time;
      ducks.forEach(dk => {
        if (r() < .4) spawnRipple(dk.d.g.position.x, dk.d.g.position.z);
      });
    }
    // Update water ripples
    ripples.forEach(rp => {
      if (rp.life > 0) {
        rp.life -= dt;
        const progress = 1 - (rp.life / rp.maxLife);
        rp.mesh.scale.setScalar(1 + progress * 2.2);
        rp.mesh.material.opacity = (1 - progress) * .45;
        if (rp.life <= 0) rp.mesh.visible = false;
      }
    });

    // Floating leaves & petals updates
    leaves.forEach(l => {
      l.y -= l.speedY * dt;
      l.x += Math.sin(time * l.wobbleSpeed + l.seed) * dt * .8;
      l.z += Math.cos(time * (l.wobbleSpeed * .8) + l.seed) * dt * .5;
      l.m.rotation.z += l.rotSpeed * dt;
      l.m.rotation.y = Math.sin(time * 2 + l.seed);
      // Reset if below ground
      if (l.y < .05) {
        l.y = 3.5 + r() * 3.5;
        l.x = player.x + (r() - .5) * 36;
        l.z = player.z + (r() - .5) * 36;
      }
      l.m.position.set(l.x, l.y, l.z);
    });

    const day = 1 - night;
    for (const b of butterflies) {
      const t = time * .35 + b.seed;
      b.g.visible = day > .2;
      b.g.position.set(player.x + b.ox + Math.sin(t * 1.3) * 3, .7 + Math.sin(t * 2.1) * .35 + Math.sin(time * 8 + b.seed) * .05, player.z + b.oz + Math.cos(t) * 3);
      b.g.rotation.y = t * 1.3 + Math.cos(t);
      const flap = Math.sin(time * 18 + b.seed) * 1.1; b.wl.rotation.y = flap; b.wr.rotation.y = -flap;
      b.g.scale.setScalar(day);
    }
    fireflies.material.opacity = Math.max(0, night - .3) * 1.4;
    if (fireflies.material.opacity > 0) {
      for (let i = 0; i < ffCount; i++) {
        const [ox, oy, oz, sd] = ffSeed[i];
        ffPos[i * 3] = player.x + ox + Math.sin(time * .5 + sd) * 1.4;
        ffPos[i * 3 + 1] = oy + Math.sin(time * .9 + sd * 2) * .4;
        ffPos[i * 3 + 2] = player.z + oz + Math.cos(time * .4 + sd) * 1.4;
      }
      ffGeo.attributes.position.needsUpdate = true;
    }
    const h = houseLevel >= 2 ? 3.45 : 2.3;
    puffs.forEach(s => {
      s.userData.t = (s.userData.t + dt) % 4; const t = s.userData.t / 4;
      s.visible = houseLevel > 0;
      s.position.set(-1.95 + t * .9 + Math.sin(t * 6 + time) * .1, h + 1.75 + t * 3, -2.55 - t * .4);
      s.scale.setScalar(.35 + t * 1.3); s.material.opacity = (1 - t) * .55 * Math.min(1, t * 6);
    });
  }
  return { root, update, setHouseLevel(l) { houseLevel = l; } };
}
