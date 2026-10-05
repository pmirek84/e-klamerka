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
  for (const s of [-1, 1]) { mesh(head, SPH, std('#ffffff'), s * .08, .04, .2, .045); mesh(head, SPH, std('#111111'), s * .08, .04, .235, .022); mesh(head, SPH, face, s * .18, .04, -.02, .09, .04, .05); }
  const legs = [];
  for (const [x, z] of [[-.2, -.25], [.2, -.25], [-.2, .25], [.2, .25]]) { const l = mesh(body, CYL, leg, x, .2, z, .06, .4, .06); legs.push(l); }
  const shadow = new T.Mesh(new T.CircleGeometry(.55, 20), new T.MeshBasicMaterial({ color: '#1d3322', transparent: true, opacity: .2, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .03; root.add(shadow);
  return { root, body, head, legs, seed, state: 'idle', until: 0, target: new T.Vector3(), yaw: 0 };
}

function duck(parent) {
  const g = new T.Group(); parent.add(g);
  const body = std('#fff7e0'), beak = std('#f39a2c');
  mesh(g, SPH, body, 0, .12, 0, .2, .14, .26);
  mesh(g, SPH, body, 0, .3, .14, .11);
  mesh(g, SPH, beak, 0, .28, .26, .06, .025, .07);
  mesh(g, SPH, std('#5aa04a'), 0, .34, .13, .08, .05, .08);
  mesh(g, new T.ConeGeometry(.07, .14, 6), body, 0, .2, -.26).rotation.x = -1.2;
  for (const s of [-1, 1]) mesh(g, SPH, std('#111'), s * .07, .33, .22, .018);
  return g;
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

  // Ducks paddling on the ponds.
  const ducks = [];
  PONDS.forEach((p, pi) => { for (let k = 0; k < (pi ? 3 : 2); k++) { const d = duck(root); ducks.push({ d, p, a: r() * 6.28, speed: .15 + r() * .15, rr: .35 + r() * .35 }); } });

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

  function update(dt, time, { night, player }) {
    lanternGlass.emissiveIntensity = .15 + night * 3.2;
    houseLight.intensity = houseLevel ? night * 14 : 0;
    heroLight.intensity = night * 9; heroLight.position.set(player.x, 2.2, player.z + .6);
    fireLight.intensity = (1.5 + night * 16) * (.85 + Math.sin(time * 13) * .08 + Math.sin(time * 7.3) * .07);
    flames.forEach((f, i) => { f.scale.y = 1 + Math.sin(time * (9 + i * 2) + i) * .18; f.rotation.y = time * (1 + i); });
    fireSparks.forEach(s => { s.userData.t = (s.userData.t + dt) % 1.5; const t = s.userData.t / 1.5; s.position.set(CAMPFIRE[0] + Math.sin(t * 9 + s.id) * .2, .4 + t * 1.6, CAMPFIRE[1] + Math.cos(t * 7 + s.id) * .2); s.scale.setScalar(.18 * (1 - t)); s.material.opacity = 1 - t; });

    for (const s of flock) {
      const p = s.root.position;
      if (s.state === 'idle' && time > s.until) {
        for (let tries = 0; tries < 6; tries++) {
          const [hx, hz, rad] = s.home, a = r() * 6.28, d = r() * rad;
          s.target.set(hx + Math.cos(a) * d, 0, hz + Math.sin(a) * d);
          if (walkable(s.target.x, s.target.z)) { s.state = 'walk'; break; }
        }
        s.until = time + 2 + r() * 4;
      }
      if (s.state === 'walk') {
        tmp.copy(s.target).sub(p); const len = tmp.length();
        if (len < .1) { s.state = 'idle'; s.until = time + 2 + r() * 4; }
        else {
          tmp.normalize(); p.addScaledVector(tmp, Math.min(len, dt * .7));
          const want = Math.atan2(tmp.x, tmp.z); s.yaw += Math.atan2(Math.sin(want - s.yaw), Math.cos(want - s.yaw)) * Math.min(1, dt * 5);
          s.legs.forEach((l, i) => { l.rotation.x = Math.sin(time * 10 + i * Math.PI) * .4; });
          s.body.position.y = Math.abs(Math.sin(time * 10)) * .03;
        }
      } else {
        s.legs.forEach(l => { l.rotation.x = 0; });
        s.head.rotation.x = .35 + Math.sin(time * 3 + s.seed) * .15; // grazing
        s.body.position.y = 0;
      }
      if (s.state === 'walk') s.head.rotation.x = 0;
      s.root.rotation.y = s.yaw;
    }
    for (const d of ducks) {
      d.a += dt * d.speed;
      const x = d.p.x + Math.cos(d.a) * d.p.rx * d.rr, z = d.p.z + Math.sin(d.a) * d.p.rz * d.rr;
      d.d.position.set(x, WATER_Y - .04 + Math.sin(time * 2.5 + d.a * 3) * .02, z);
      d.d.rotation.y = Math.atan2(-Math.sin(d.a) * d.p.rx, Math.cos(d.a) * d.p.rz);
    }
    const day = 1 - night;
    for (const b of butterflies) {
      const t = time * .35 + b.seed;
      b.g.visible = day > .2;
      b.g.position.set(player.x + b.ox + Math.sin(t * 1.3) * 3, .7 + Math.sin(t * 2.1) * .35 + Math.sin(time * 8 + b.seed) * .05, player.z + b.oz + Math.cos(t) * 3);
      b.g.rotation.y = t * 1.3 + Math.cos(t) ;
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
