import * as T from 'three';

// Global uniforms shared by every animated shader (wind, grass push, day/night).
export const U = {
  uTime: { value: 0 },
  uPlayer: { value: new T.Vector3(0, 0, 6) },
  uNight: { value: 0 },
};

// Deterministic RNG so the world looks the same on every load.
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// Cheap value noise used for terrain heights and colour variation.
function hash(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
export function noise2(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, z) { return noise2(x, z) * .6 + noise2(x * 2.1 + 5, z * 2.1 - 3) * .3 + noise2(x * 4.3 - 7, z * 4.3 + 9) * .1; }

// Adaptive quality: full effects on desktop, lighter on phones/tablets.
export function detectQuality() {
  const q = new URLSearchParams(location.search).get('quality');
  if (q === 'low' || q === 'high') return q;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const small = Math.min(screen.width, screen.height) < 820;
  const cores = navigator.hardwareConcurrency || 4;
  return coarse && (small || cores <= 6) ? 'low' : 'high';
}

// Injects world-space wind sway into a standard material (used by trees/bushes).
export function addFoliageWind(mat, strength = .05) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = U.uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 fw = modelMatrix * vec4(transformed, 1.0);
        float amp = ${strength.toFixed(3)} * clamp(fw.y - 1.2, 0.0, 4.0);
        transformed.x += sin(uTime * 1.6 + fw.x * .35 + fw.z * .21) * amp;
        transformed.z += cos(uTime * 1.3 + fw.z * .31 + fw.x * .17) * amp * .7;`);
  };
  mat.customProgramCacheKey = () => 'foliage' + strength;
  return mat;
}
