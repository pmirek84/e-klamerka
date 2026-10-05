import * as T from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { U, noise2, addFoliageWind, rng } from './shared.js';

// ---------- Materials ----------
// One vertex-coloured foliage material for every tree colour → a single draw call per baked group.
export const foliageMat = addFoliageWind(new T.MeshStandardMaterial({ vertexColors: true, roughness: .92, metalness: 0 }), .045);
export const bushMat = addFoliageWind(new T.MeshStandardMaterial({ vertexColors: true, roughness: .95 }), .02);
export const rockMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: .95, flatShading: true });
export const barkMat = new T.MeshStandardMaterial({ color: '#8a5a3b', roughness: .95 });
export const darkBarkMat = new T.MeshStandardMaterial({ color: '#6b4630', roughness: .95 });

export const TREE_COLORS = {
  green: ['#86cc5c', '#3c8a3d'],
  deep: ['#66b552', '#2c6a35'],
  light: ['#b2d96d', '#5b9a46'],
  pink: ['#ffc6da', '#d9739f'],
  autumn: ['#f6b456', '#c4632e'],
  pine: ['#4f9a4c', '#1f5530'],
  bush: ['#7cc45a', '#3b7d3a'],
};

// ---------- Geometry helpers ----------
const cache = new Map();
function cached(key, make) { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); }

function paintGradient(geo, top, bottom, minY, maxY, jitter = .06, seed = 1) {
  const pos = geo.attributes.position, colors = new Float32Array(pos.count * 3);
  const a = new T.Color(top), b = new T.Color(bottom), c = new T.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i), t = T.MathUtils.clamp((y - minY) / (maxY - minY), 0, 1);
    c.copy(b).lerp(a, t * t * (3 - 2 * t));
    const n = (noise2(pos.getX(i) * 3 + seed, pos.getZ(i) * 3 - seed) - .5) * jitter;
    colors[i * 3] = Math.max(0, c.r + n); colors[i * 3 + 1] = Math.max(0, c.g + n); colors[i * 3 + 2] = Math.max(0, c.b + n * .5);
  }
  geo.setAttribute('color', new T.BufferAttribute(colors, 3));
  return geo;
}

// Lumpy "cauliflower" blob — the signature cozy-game foliage shape.
export function blobGeometry(detail = 2, seed = 0, lump = .22) {
  return cached(`blob${detail}-${seed}-${lump}`, () => {
    let g = new T.IcosahedronGeometry(1, detail);
    g.deleteAttribute('normal'); g.deleteAttribute('uv');
    g = mergeVertices(g);
    const p = g.attributes.position, v = new T.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).normalize();
      const n = noise2(v.x * 2.3 + seed * 7.1, v.z * 2.3 + v.y * 1.7 - seed * 3.3);
      const n2 = noise2(v.x * 5.1 - seed, v.y * 5.1 + v.z * 3.2 + seed);
      const r = 1 + (n - .5) * lump * 2 + (n2 - .5) * lump * .6;
      v.multiplyScalar(r); v.y *= .88;
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  });
}

function coloredBlob(detail, seed, palette, y0, y1) {
  return cached(`cb${detail}-${seed}-${palette}-${y0}-${y1}`, () => {
    const g = blobGeometry(detail, seed).clone();
    const [top, bottom] = TREE_COLORS[palette];
    // Gradient in local space (-1..1), so each blob is lighter on top like sun-lit foliage.
    return paintGradient(g, top, bottom, y0, y1, .07, seed);
  });
}

function addMesh(parent, geo, mat, x, y, z, sx = 1, sy = sx, sz = sx) {
  const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz);
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}

function blobShadow(parent, r) {
  const m = new T.Mesh(cached('shadowDisc', () => new T.CircleGeometry(1, 24)), cached('shadowMat', () => new T.MeshBasicMaterial({ color: '#1d3a22', transparent: true, opacity: .16, depthWrite: false })));
  m.rotation.x = -Math.PI / 2; m.position.y = .03; m.scale.setScalar(r); parent.add(m); return m;
}

// ---------- Trees ----------
const PALETTE_BY_VARIANT = ['green', 'deep', 'light', 'green', 'pink', 'deep', 'green', 'autumn', 'light', 'green', 'deep', 'pink'];
export function fluffyTree(p, x, z, scale = 1, variant = 0, opts = {}) {
  const detail = opts.detail ?? 2;
  const palette = opts.palette || PALETTE_BY_VARIANT[variant % PALETTE_BY_VARIANT.length];
  const g = new T.Group(); g.position.set(x, opts.y || 0, z); g.scale.setScalar(scale); p.add(g);
  blobShadow(g, 1.5);
  const r = rng(variant * 31 + 7);
  const trunkH = 1.7 + r() * .5;
  addMesh(g, cached('trunk', () => new T.CylinderGeometry(.17, .3, 1, 8)), barkMat, 0, trunkH / 2, 0, 1, trunkH, 1);
  const root = addMesh(g, cached('root', () => new T.CylinderGeometry(.3, .42, .3, 8)), barkMat, 0, .12, 0);
  root.rotation.y = r();
  const br = addMesh(g, cached('branch', () => new T.CylinderGeometry(.07, .12, 1, 6)), barkMat, .28, trunkH * .85, .05, 1, .9, 1); br.rotation.z = -.7;
  const cy = trunkH + .75;
  const blobs = [[0, cy, 0, 1.25], [-.85, cy - .35, .25, .9], [.85, cy - .2, -.2, .95], [.1, cy - .35, .85, .85], [-.2, cy - .25, -.8, .85], [.15, cy + .75, -.05, .85]];
  blobs.forEach(([bx, by, bz, br2], i) => {
    const s = br2 * (.92 + r() * .16);
    addMesh(g, coloredBlob(detail, (variant * 5 + i) % 9, palette, -1, 1.1), foliageMat, bx, by, bz, s, s * .92, s);
  });
  if (opts.fruit) {
    const fruitMat = cached('fruitMat', () => new T.MeshStandardMaterial({ color: '#e5443b', roughness: .5 }));
    for (let i = 0; i < 9; i++) {
      const a = i * 2.39, h = cy - .4 + (i % 3) * .45;
      addMesh(g, cached('fruit', () => new T.SphereGeometry(.13, 8, 6)), fruitMat, Math.cos(a) * 1.25, h, Math.sin(a) * 1.15);
    }
  }
  return g;
}

export function pineTree(p, x, z, scale = 1, opts = {}) {
  const g = new T.Group(); g.position.set(x, opts.y || 0, z); g.scale.setScalar(scale); p.add(g);
  blobShadow(g, 1.25);
  addMesh(g, cached('pineTrunk', () => new T.CylinderGeometry(.16, .24, 1.2, 7)), darkBarkMat, 0, .6, 0);
  const tiers = 4;
  for (let i = 0; i < tiers; i++) {
    const rad = 1.45 - i * .3, h = 1.35 - i * .12;
    const geo = cached(`pineTier${i}`, () => {
      let c = new T.ConeGeometry(rad, h, 12, 2, false);
      c.deleteAttribute('normal'); c.deleteAttribute('uv'); c = mergeVertices(c);
      const pos = c.attributes.position;
      for (let k = 0; k < pos.count; k++) {
        const y = pos.getY(k);
        if (y < -h / 2 + .01) {
          // Ruffled skirt: alternate bottom vertices up/down for a soft frilled silhouette.
          const a = Math.atan2(pos.getZ(k), pos.getX(k));
          pos.setY(k, y + Math.sin(a * 6) * .09 - .05);
          pos.setX(k, pos.getX(k) * 1.04); pos.setZ(k, pos.getZ(k) * 1.04);
        }
      }
      c.computeVertexNormals();
      const [top, bottom] = TREE_COLORS.pine;
      return paintGradient(c, top, bottom, -h / 2, h / 2, .05, i);
    });
    addMesh(g, geo, foliageMat, 0, 1.25 + i * .78, 0);
  }
  return g;
}

export function bush(p, x, z, scale = 1, seed = 0, opts = {}) {
  const g = new T.Group(); g.position.set(x, opts.y || 0, z); g.scale.setScalar(scale); p.add(g);
  const palette = opts.palette || 'bush';
  [[0, .42, 0, .55], [-.45, .3, .1, .42], [.42, .32, -.08, .45]].forEach(([bx, by, bz, s], i) =>
    addMesh(g, coloredBlob(1, (seed + i) % 9, palette, -1, 1), bushMat, bx, by, bz, s, s * .85, s));
  if (opts.berries) {
    const m = cached('berryMat', () => new T.MeshStandardMaterial({ color: opts.berries, roughness: .4 }));
    for (let i = 0; i < 6; i++) { const a = i * 1.9; addMesh(g, cached('berry', () => new T.SphereGeometry(.06, 6, 5)), m, Math.cos(a) * .5, .45 + (i % 2) * .2, Math.sin(a) * .45); }
  }
  return g;
}

export function rock(p, x, z, scale = 1, seed = 0, opts = {}) {
  const geo = cached(`rock${seed % 6}`, () => {
    let g = new T.IcosahedronGeometry(1, 1); g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g);
    const pos = g.attributes.position, v = new T.Vector3();
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); const n = noise2(v.x * 1.7 + seed, v.z * 1.7 + v.y + seed * 2); v.multiplyScalar(.8 + n * .4); v.y = v.y * .62; pos.setXYZ(i, v.x, v.y, v.z); }
    g = g.toNonIndexed(); g.computeVertexNormals();
    return paintGradient(g, '#c3c7bd', '#7f8679', -.6, .6, .08, seed);
  });
  const m = addMesh(p, geo, rockMat, x, (opts.y || 0) + .15 * scale, z, scale);
  m.rotation.y = seed * 1.3; return m;
}

// ---------- Grass & flowers (instanced, wind + player push in the vertex shader) ----------
function windyInstanced(mat, maxH) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = U.uTime; shader.uniforms.uPlayer = U.uPlayer;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime; uniform vec3 uPlayer; varying float vH;')
      .replace('#include <project_vertex>', `
        float h = clamp(position.y / ${maxH.toFixed(2)}, 0.0, 1.0);
        vH = h;
        vec4 wp = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          wp = instanceMatrix * wp;
        #endif
        wp = modelMatrix * wp;
        float gust = sin(uTime * 1.9 + wp.x * .42 + wp.z * .27) * .6 + sin(uTime * 3.7 + wp.x * 1.3) * .25;
        wp.x += gust * .13 * h * h;
        wp.z += cos(uTime * 1.5 + wp.z * .5) * .06 * h * h;
        vec2 d = wp.xz - uPlayer.xz; float len = length(d);
        if (len < 1.0) wp.xz += normalize(d + 1e-4) * (1.0 - len) * .55 * h;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vH;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= mix(.62, 1.16, vH);');
  };
  mat.customProgramCacheKey = () => 'windy' + maxH;
  return mat;
}

function tuftGeometry() {
  const verts = [], idx = [], r = rng(9);
  for (let b = 0; b < 6; b++) {
    const a = r() * Math.PI * 2, off = r() * .12, h = .2 + r() * .17, w = .05 + r() * .03, lean = (r() - .5) * .3;
    const ox = Math.cos(a) * off, oz = Math.sin(a) * off, dirx = Math.cos(a + 1.57), dirz = Math.sin(a + 1.57);
    const base = verts.length / 3, seg = 3;
    for (let s = 0; s <= seg; s++) {
      const t = s / seg, ww = w * (1 - t * .92), y = h * t, bend = lean * t * t;
      verts.push(ox - dirx * ww + Math.cos(a) * bend, y, oz - dirz * ww + Math.sin(a) * bend);
      verts.push(ox + dirx * ww + Math.cos(a) * bend, y, oz + dirz * ww + Math.sin(a) * bend);
      if (s < seg) { const k = base + s * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
  g.setAttribute('normal', new T.Float32BufferAttribute(new Array(verts.length).fill(0).map((_, i) => i % 3 === 1 ? 1 : 0), 3));
  g.setIndex(idx);
  return g;
}

// sampler(rand) → {x, y, z, color: THREE.Color} | null
export function grassField(parent, count, sampler, seed = 3) {
  const mat = windyInstanced(new T.MeshStandardMaterial({ side: T.DoubleSide, roughness: 1 }), .38);
  const mesh = new T.InstancedMesh(tuftGeometry(), mat, count);
  const r = rng(seed), o = new T.Object3D(); let n = 0;
  for (let tries = 0; tries < count * 5 && n < count; tries++) {
    const s = sampler(r); if (!s) continue;
    o.position.set(s.x, s.y, s.z); o.rotation.y = r() * 6.28; o.scale.set(.8 + r() * .6, .75 + r() * .45, .8 + r() * .6); o.updateMatrix();
    mesh.setMatrixAt(n, o.matrix); mesh.setColorAt(n, s.color); n++;
  }
  mesh.count = n; mesh.receiveShadow = true; mesh.frustumCulled = false;
  parent.add(mesh); return mesh;
}

export function flowerField(parent, count, sampler, seed = 5) {
  const geo = new T.IcosahedronGeometry(.075, 0); geo.scale(1, .55, 1); geo.translate(0, .3, 0);
  const mat = windyInstanced(new T.MeshStandardMaterial({ roughness: .6, emissive: '#222', emissiveIntensity: .15 }), .38);
  const mesh = new T.InstancedMesh(geo, mat, count);
  const colors = ['#fff4f0', '#ffd75e', '#ff9cc0', '#c9a7ff', '#ffffff', '#ff7f6b'].map(c => new T.Color(c));
  const r = rng(seed), o = new T.Object3D(); let n = 0;
  for (let tries = 0; tries < count * 5 && n < count; tries++) {
    const s = sampler(r); if (!s) continue;
    o.position.set(s.x, s.y, s.z); o.rotation.y = r() * 6.28; o.scale.setScalar(.8 + r() * .6); o.updateMatrix();
    mesh.setMatrixAt(n, o.matrix); mesh.setColorAt(n, colors[Math.floor(r() * colors.length)]); n++;
  }
  mesh.count = n; mesh.frustumCulled = false; parent.add(mesh); return mesh;
}
