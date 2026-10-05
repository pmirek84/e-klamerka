import * as T from 'three';
import { REGIONS } from './regions.js';
import { fbm, noise2, rng } from './shared.js';
import { fluffyTree, pineTree, bush, rock } from './nature.js';
import { bake } from './models.js';

// Voxel terrace world: every 1×1 cell is a grass/dirt column (one instanced draw call),
// regions are flat plateaus at y=0, ringed by rivers, with terraced hills between them.
export const GRID = { x0: -56, z0: -52, w: 112, h: 106 };
export const WATER_Y = -.32;

const REGION_TOP = { farm: '#7cc35b', woodland: '#62ab4f', quarry: '#a3b48c', meadow: '#a9cb5b', lake: '#79c467', clouds: '#b2a8e2', lavender: '#a893d8' };
const HILL_TOP = '#6db352';

// Farm trails (former curved path meshes) — rasterised into dirt-path cells.
const FARM_TRAILS = [
  [[[0, 10.8], [.3, 7], [0, 3.8], [-.7, 1.8], [-1.5, -.2], [-3, -.1]], 1.9],
  [[[-9, 3], [-6.5, 2.4], [-3.4, 2], [0, 2.7], [3.2, 4.7], [6.8, 5.6], [11, 5.6]], 1.5],
  [[[-7, -4.3], [-7.1, -1.8], [-5, .5], [-3.5, 1.4]], 1.3],
  [[[0, 2.7], [2, .1], [4, -2.7], [6.3, -4.2]], 1.5],
  [[[-.1, 7], [-2.5, 7.7], [-3.3, 8]], 1.3],
  [[[-2.5, 7.7], [-5.2, 7.8], [-8.6, 8.6]], 1.4],
  [[[-7, 1], [-9, 0], [-13.5, 0]], 1.5],
  [[[0, 1], [1, -3], [0, -6], [0, -11.5]], 1.4],
  [[[6, -3.3], [9, -3], [13.5, -3]], 1.4],
  [[[4, -2.7], [6.2, -5.6], [9.2, -9.2]], 1.4],
];
// Region paths, relative to region centre: [region, x, z, w, d, rotY]
const REGION_PATHS = [
  ['woodland', 0, 1, 18, 1.4, 0], ['woodland', -3, 2.5, 1.3, 4, 0],
  ['quarry', 0, 3.5, 1.6, 10, 0], ['quarry', 1, -1, 5, 1.6, 0],
  ['meadow', 0, -2, 20, 1.5, 0], ['meadow', -2, 0, 1.4, 5, 0], ['meadow', 2, -2.3, 4, 1.6, 0],
  ['lake', 0, -4, 1.5, 9, 0], ['lake', -2, 1, 7, 1.5, 0],
  ['clouds', -3.2, 3.2, 11, 1.5, Math.PI / 4], ['clouds', 0, 0, 1.5, 6, 0],
  ['lavender', 3.2, -3.2, 11, 1.5, -Math.PI / 4], ['lavender', 0, 0, 1.5, 6, 0],
];
// Rivers under every bridge.
const CORRIDORS = [[-12, 0, -21, 0], [0, -10, 0, -21], [11.8, -3, 22, -3], [0, 10, 0, 21], [8, -8, 22, -22], [-8, 8, -22, 22]];
// Ponds carved into the plateaus.
export const PONDS = [{ x: 1.9, z: -7.8, rx: 2.7, rz: 1.7 }, { x: 2.5, z: 33.2, rx: 5, rz: 4.6 }];

function segDist(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(px - ax - dx * t, pz - az - dz * t);
}

export function landIslands(landLevel = 0) {
  return Array.from({ length: landLevel }, (_, i) => ({ id: 'farm', x: 13 + i * 2.8, z: 4.8, rx: 2.8, rz: 3.8 }));
}

export function computeCells(state = {}) {
  const { x0, z0, w, h } = GRID;
  const ovals = [...Object.entries(REGIONS).map(([id, r]) => ({ id, x: r.x, z: r.z, rx: r.rx, rz: r.rz })), ...landIslands(state.landLevel || 0)];
  const allTrails = [...FARM_TRAILS];
  if (state.landLevel > 0) {
    const pts = [[11, 5.6]];
    for (let k = 0; k < state.landLevel; k++) pts.push([13 + k * 2.8, 4.8]);
    allTrails.push([pts, 1.4]);
  }
  const trailPolys = allTrails.map(([pts, width]) => {
    const curve = new T.CatmullRomCurve3(pts.map(([x, z]) => new T.Vector3(x, 0, z)));
    return { pts: curve.getPoints(48), half: width / 2 };
  });
  const cells = new Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const cx = x0 + i + .5, cz = z0 + j + .5;
    let region = null, qWalk = 9, dEdge = 99;
    for (const o of ovals) {
      const q = ((cx - o.x) / (o.rx + .95)) ** 2 + ((cz - o.z) / (o.rz + .95)) ** 2;
      const qw = ((cx - o.x) / o.rx) ** 2 + ((cz - o.z) / o.rz) ** 2;
      const d = (Math.sqrt(q) - 1) * ((o.rx + o.rz) / 2 + .95);
      if (q < 1 && !region) { region = o.id; qWalk = qw; }
      dEdge = Math.min(dEdge, d);
    }
    const outer = Math.min(cx - x0, x0 + w - cx, cz - z0, z0 + h - cz);
    const c = { type: 'hill', top: 1, kind: 0, region, qWalk };
    if (region) {
      c.type = 'land'; c.top = 0;
      if (PONDS.some(p => ((cx - p.x) / p.rx) ** 2 + ((cz - p.z) / p.rz) ** 2 < 1)) { c.type = 'water'; c.top = -1.2; c.kind = 2; }
    } else if (outer < 4.5) { c.type = 'ocean'; c.top = -1.6; c.kind = 2; }
    else if (outer < 7.5) { c.type = 'beach'; c.top = -.12; c.kind = 2; }
    else if (dEdge < 2.6 || CORRIDORS.some(s => segDist(cx, cz, ...s) < 2.4)) { c.type = 'water'; c.top = -1.2; c.kind = 2; }
    else {
      const dd = dEdge - 2.6, n = fbm(cx * .11, cz * .11);
      let lvl = 1 + Math.floor(dd * .38 + (n - .45) * 2.6);
      lvl = Math.min(lvl, 1 + Math.floor((outer - 7.5) * .45));
      c.top = Math.max(1, Math.min(5, lvl));
    }
    cells[j * w + i] = c;
  }
  // Paths.
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const c = cells[j * w + i]; if (c.type !== 'land') continue;
    const cx = x0 + i + .5, cz = z0 + j + .5;
    let path = false;
    if (c.region === 'farm') {
      for (const t of trailPolys) { for (let k = 0; k < t.pts.length - 1 && !path; k++) if (segDist(cx, cz, t.pts[k].x, t.pts[k].z, t.pts[k + 1].x, t.pts[k + 1].z) < t.half) path = true; if (path) break; }
    }
    for (const [rid, px, pz, pw, pd, rot] of REGION_PATHS) {
      if (path || rid !== c.region) continue;
      const r = REGIONS[rid], lx = cx - (r.x + px), lz = cz - (r.z + pz);
      const ux = lx * Math.cos(rot) - lz * Math.sin(rot), uz = lx * Math.sin(rot) + lz * Math.cos(rot);
      if (Math.abs(ux) < pw / 2 + .2 && Math.abs(uz) < pd / 2 + .2) path = true;
    }
    if (path) { c.kind = 1; c.top = -.05; }
  }
  // Sandy banks where plateaus meet water (outside the walkable oval, so gameplay stays identical).
  for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) {
    const c = cells[j * w + i]; if (c.type !== 'land' || c.kind === 1) continue;
    const wet = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const n = cells[(j + b) * w + i + a]; return n.type === 'water' || n.type === 'ocean'; });
    if (wet && c.qWalk > 1.0) { c.kind = 2; c.top = -.08; }
  }
  return cells;
}

// ---------- Block material (procedural grass tops, dirt strata, grass lip) ----------
function blockMaterial() {
  const mat = new T.MeshStandardMaterial({ roughness: .93, metalness: 0 });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec3 aTopColor; attribute vec2 aInfo;
        varying vec3 vTopColor; varying vec2 vInfo; varying vec3 vW; varying vec3 vWN;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vTopColor = aTopColor; vInfo = aInfo;
        vec4 bw = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          bw = instanceMatrix * bw;
        #endif
        vW = (modelMatrix * bw).xyz;
        vWN = normal;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vTopColor; varying vec2 vInfo; varying vec3 vW; varying vec3 vWN;
        float bh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`)
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', `
        float kind = vInfo.x; float topY = vInfo.y;
        float depth = topY - vW.y;
        vec3 grass = vTopColor;
        vec3 dirt = vec3(.25, .11, .045);
        vec3 sand = vec3(.78, .6, .33);
        vec3 pathC = vec3(.55, .33, .14);
        vec3 col;
        if (vWN.y > .5) {
          float tile = bh(floor(vW.xz));
          float speck = bh(floor(vW.xz * 4.0));
          if (kind < .5) col = grass * (.93 + tile * .12) * (.97 + speck * .05);
          else if (kind < 1.5) col = pathC * (.9 + tile * .1) * (.92 + speck * .12);
          else col = sand * (.95 + tile * .07) * (.96 + speck * .06);
        } else {
          float wob = sin(vW.x * 7.3 + vW.z * 5.1) * .05 + sin(vW.x * 17.0 - vW.z * 13.0) * .025;
          float lip = 1.0 - smoothstep(.16, .2, depth + wob);
          float strata = smoothstep(.0, .05, fract(depth + .02)) * (1.0 - smoothstep(.93, 1.0, fract(depth + .02)));
          float rough = bh(floor(vec2(vW.x + vW.z, vW.y) * vec2(3.0, 5.0)));
          vec3 side = kind > 1.5 ? sand * .9 : dirt * (.86 + rough * .16) * mix(.78, 1.0, strata);
          side *= 1.0 - .28 * clamp(depth / 3.0, 0.0, 1.0);
          col = kind < .5 ? mix(side, grass * .82, lip) : side;
        }
        vec4 diffuseColor = vec4(col, opacity);`);
  };
  mat.customProgramCacheKey = () => 'voxelBlock';
  return mat;
}

function waterMaterial(maskTex) {
  const uniforms = T.UniformsUtils.merge([T.UniformsLib.fog, {
    uMask: { value: null }, uTime: { value: 0 }, uNight: { value: 0 },
    uDeep: { value: new T.Color('#2381b3') }, uShallow: { value: new T.Color('#3fc0cc') },
    uFoam: { value: new T.Color('#f4fbff') }, uSky: { value: new T.Color('#bfe6ff') },
    uOrigin: { value: new T.Vector2(GRID.x0, GRID.z0) }, uSize: { value: new T.Vector2(GRID.w, GRID.h) },
  }]);
  uniforms.uMask.value = maskTex;
  return new T.ShaderMaterial({
    uniforms, fog: true,
    vertexShader: `
      #include <fog_pars_vertex>
      uniform float uTime; varying vec3 vW;
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.0);
        w.y += sin(w.x * .6 + uTime * 1.2) * .025 + cos(w.z * .5 + uTime) * .02;
        vW = w.xyz;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      #include <common>
      #include <fog_pars_fragment>
      uniform sampler2D uMask; uniform float uTime, uNight; uniform vec3 uDeep, uShallow, uFoam, uSky; uniform vec2 uOrigin, uSize;
      varying vec3 vW;
      void main(){
        vec2 uv = (vW.xz - uOrigin) / uSize;
        float m = texture2D(uMask, uv).r;
        vec3 col = mix(uDeep, uShallow, smoothstep(.0, .5, m));
        float r1 = sin(vW.x * 1.7 + uTime * 1.3 + sin(vW.z * 1.1 + uTime) * 1.2);
        float r2 = sin(vW.z * 2.3 - uTime * 1.1 + sin(vW.x * .9 - uTime * .7) * 1.5);
        float r3 = sin((vW.x + vW.z) * 3.1 + uTime * 2.0);
        col += smoothstep(1.75, 1.98, r1 + r2) * .1 * (1.0 - uNight * .6);
        col += smoothstep(.9, 1.0, r3 * r1) * .03;
        float band = smoothstep(.38, .47, m);
        float wave = .5 + .5 * sin(m * 38.0 - uTime * 2.4 + vW.x * .4 + vW.z * .3);
        col = mix(col, uFoam, band * (.35 + .65 * wave) * .7);
        vec3 V = normalize(cameraPosition - vW);
        float fres = pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0);
        col = mix(col, uSky, fres * .3);
        col *= mix(1.0, .42, uNight);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}

export function buildTerrain(scene, state, quality) {
  const root = new T.Group(); scene.add(root);
  const { x0, z0, w, h } = GRID;
  const cells = computeCells(state);
  // --- columns ---
  const geo = new T.BoxGeometry(1, 1, 1); geo.translate(0, .5, 0);
  const count = w * h, bottom = -1.8;
  const topColors = new Float32Array(count * 3), info = new Float32Array(count * 2);
  const mesh = new T.InstancedMesh(geo, blockMaterial(), count);
  const o = new T.Object3D(), col = new T.Color();
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = j * w + i, c = cells[k], cx = x0 + i + .5, cz = z0 + j + .5;
    o.position.set(cx, bottom, cz); o.scale.set(1, c.top - bottom, 1); o.updateMatrix(); mesh.setMatrixAt(k, o.matrix);
    if (c.type === 'hill') col.set(HILL_TOP).offsetHSL((noise2(cx * .2, cz * .2) - .5) * .03, 0, -c.top * .012);
    else col.set(REGION_TOP[c.region] || HILL_TOP);
    const n = (fbm(cx * .18, cz * .18) - .5) * .1;
    col.r = Math.max(0, col.r + n * .6); col.g = Math.max(0, col.g + n); col.b = Math.max(0, col.b + n * .3);
    c.color = col.clone();
    topColors.set([col.r, col.g, col.b], k * 3); info.set([c.kind, c.top], k * 2);
  }
  geo.setAttribute('aTopColor', new T.InstancedBufferAttribute(topColors, 3));
  geo.setAttribute('aInfo', new T.InstancedBufferAttribute(info, 2));
  mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
  root.add(mesh);

  // --- water with shoreline foam from a blurred land mask ---
  let mask = new Float32Array(count);
  cells.forEach((c, k) => { mask[k] = c.top > WATER_Y ? 1 : 0; });
  for (let pass = 0; pass < 3; pass++) {
    const out = new Float32Array(count);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      let s = 0, n = 0;
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= w || jj >= h) continue; s += mask[jj * w + ii]; n++; }
      out[j * w + i] = s / n;
    }
    mask = out;
  }
  const bytes = new Uint8Array(count * 4);
  mask.forEach((v, k) => { const b = Math.round(v * 255); bytes.set([b, b, b, 255], k * 4); });
  const maskTex = new T.DataTexture(bytes, w, h, T.RGBAFormat); maskTex.magFilter = T.LinearFilter; maskTex.minFilter = T.LinearFilter; maskTex.needsUpdate = true;
  const water = new T.Mesh(new T.PlaneGeometry(900, 900, 1, 1).rotateX(-Math.PI / 2), waterMaterial(maskTex));
  water.position.set(0, WATER_Y, 0); root.add(water);

  // --- decoration: hill forests, bank bushes, rocks, lily pads ---
  const decor = new T.Group(); root.add(decor);
  const r = rng(77), detail = quality === 'low' ? 1 : 2;
  const density = quality === 'low' ? .55 : 1;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const c = cells[j * w + i], cx = x0 + i + .5, cz = z0 + j + .5;
    if (c.type === 'hill') {
      const roll = r();
      const jx = cx + (r() - .5) * .5, jz = cz + (r() - .5) * .5;
      if (roll < .085 * density) {
        const pick = r();
        if (pick < .45) pineTree(decor, jx, jz, .8 + r() * .5, { y: c.top });
        else fluffyTree(decor, jx, jz, .7 + r() * .45, Math.floor(r() * 12), { y: c.top, detail });
      } else if (roll < .12 * density) bush(decor, jx, jz, .7 + r() * .5, Math.floor(r() * 9), { y: c.top });
      else if (roll < .135 * density) rock(decor, jx, jz, .35 + r() * .4, Math.floor(r() * 6), { y: c.top });
    } else if (c.type === 'land' && c.kind === 0 && c.qWalk > 1.04 && r() < .2 * density) {
      bush(decor, cx + (r() - .5) * .4, cz + (r() - .5) * .4, .55 + r() * .35, Math.floor(r() * 9), r() < .25 ? { berries: '#ff6b8a' } : {});
    } else if (c.type === 'beach' && r() < .025) rock(decor, cx, cz, .3 + r() * .3, Math.floor(r() * 6), { y: c.top });
  }
  // Lily pads + cattails on ponds.
  const lilyMat = new T.MeshStandardMaterial({ color: '#6fae4c', roughness: .7 }), bloomMat = new T.MeshStandardMaterial({ color: '#ffd1e0', roughness: .5 });
  for (const p of PONDS) {
    for (let n = 0; n < Math.round(p.rx * 2.4); n++) {
      const a = r() * 6.28, d = .3 + r() * .55;
      const lx = p.x + Math.cos(a) * p.rx * d, lz = p.z + Math.sin(a) * p.rz * d;
      const pad = new T.Mesh(new T.CylinderGeometry(.28 + r() * .12, .3, .03, 12, 1, false, .3, 5.8), lilyMat); pad.position.set(lx, WATER_Y + .04, lz); pad.rotation.y = r() * 6; pad.receiveShadow = true; decor.add(pad);
      if (r() < .4) { const b = new T.Mesh(new T.IcosahedronGeometry(.09, 0), bloomMat); b.position.set(lx + .05, WATER_Y + .11, lz); decor.add(b); }
    }
  }
  const reedMat = new T.MeshStandardMaterial({ color: '#5f9a45' }), tipMat = new T.MeshStandardMaterial({ color: '#7a4b2c' });
  for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) {
    const c = cells[j * w + i]; if (c.type !== 'water' || r() > .05) continue;
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => cells[(j + b) * w + i + a].top > WATER_Y);
    if (!near) continue;
    const cx = x0 + i + .5, cz = z0 + j + .5;
    for (let n = 0; n < 3; n++) {
      const hgt = .8 + r() * .5, x = cx + (r() - .5) * .7, z = cz + (r() - .5) * .7;
      const s = new T.Mesh(new T.CylinderGeometry(.025, .03, hgt, 4), reedMat); s.position.set(x, WATER_Y + hgt / 2, z); decor.add(s);
      const t = new T.Mesh(new T.CapsuleGeometry(.05, .18, 2, 6), tipMat); t.position.set(x, WATER_Y + hgt + .05, z); decor.add(t);
    }
  }

  const discs = []; decor.traverse(m => { if (m.isMesh && m.material.transparent) discs.push(m); });
  discs.forEach(m => m.removeFromParent());
  bake(decor);

  function cellAt(x, z) {
    const i = Math.floor(x - x0), j = Math.floor(z - z0);
    if (i < 0 || j < 0 || i >= w || j >= h) return null;
    return cells[j * w + i];
  }
  function maskAt(x, z) {
    const i = Math.floor(x - x0), j = Math.floor(z - z0);
    if (i < 0 || j < 0 || i >= w || j >= h) return 0;
    return mask[j * w + i];
  }
  // Pick cells for grass: mostly on plateaus, some on hill tops.
  const landCells = [], hillCells = [];
  cells.forEach((c, k) => { if (c.kind !== 0) return; (c.type === 'land' ? landCells : c.type === 'hill' ? hillCells : []).push(k); });

  return {
    root, cells, water, cellAt, maskAt, landCells, hillCells, decor,
    update(time, night, skyColor) { water.material.uniforms.uTime.value = time; water.material.uniforms.uNight.value = night; if (skyColor) water.material.uniforms.uSky.value.copy(skyColor); },
    dispose() { root.traverse(o2 => { if (o2.geometry) o2.geometry.dispose(); }); maskTex.dispose(); root.removeFromParent(); },
  };
}
