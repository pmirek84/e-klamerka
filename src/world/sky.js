import * as T from 'three';
import { blobGeometry } from './nature.js';
import { U, rng } from './shared.js';

// Day/night keyframes: [hour, skyTop, horizon, sunColor, sunIntensity, hemiSky, hemiGround, hemiIntensity, fog, night]
const KEYS = [
  [0, '#13234d', '#34497e', '#b4c4ff', .95, '#8296d4', '#34465c', 1.2, '#34497e', 1],
  [4.5, '#1f3366', '#52588f', '#b8c0ff', .9, '#8a92cc', '#3a4458', 1.2, '#52588f', .9],
  [6, '#4f78c0', '#ffbf9a', '#ffbb8c', 1.2, '#c4b4d0', '#5f5c4a', 1.0, '#f0c4ac', .35],
  [7.5, '#5db3f2', '#ffe6c8', '#fff0d6', 2.6, '#e0f1ff', '#708b5a', 1.35, '#dcecf3', 0],
  [12, '#46a6f2', '#d2efff', '#fffaf0', 3.0, '#e8f6ff', '#7b9b60', 1.45, '#d2ebf6', 0],
  [16.5, '#58a6e8', '#ffe2b6', '#ffe4b4', 2.7, '#f4e8d2', '#7b8b56', 1.3, '#f0e0c4', 0],
  [19, '#4b62ab', '#ff9e70', '#ff9d60', 1.7, '#e3ab9c', '#5b5242', 1.05, '#f2aa8a', .2],
  [20.5, '#26386f', '#6e5e9a', '#b8b0ff', .95, '#8088c4', '#36405a', 1.15, '#5a5a90', .8],
  [24, '#13234d', '#34497e', '#b4c4ff', .95, '#8296d4', '#34465c', 1.2, '#34497e', 1],
].map(k => [k[0], new T.Color(k[1]), new T.Color(k[2]), new T.Color(k[3]), k[4], new T.Color(k[5]), new T.Color(k[6]), k[7], new T.Color(k[8]), k[9]]);

const PHASES = [[5, 'Noc'], [7, 'Świt'], [11, 'Rano'], [14, 'Południe'], [18, 'Popołudnie'], [21, 'Wieczór'], [24, 'Noc']];

export function createSky(scene, { sun, hemi, quality }) {
  const uniforms = {
    uTop: { value: new T.Color() }, uHorizon: { value: new T.Color() }, uSunDir: { value: new T.Vector3(0, 1, 0) },
    uSunCol: { value: new T.Color() }, uNight: U.uNight,
  };
  const dome = new T.Mesh(new T.SphereGeometry(420, 32, 16), new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false, uniforms,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uTop, uHorizon, uSunDir, uSunCol; uniform float uNight; varying vec3 vDir;
      void main(){
        float h = clamp(vDir.y, -1.0, 1.0);
        vec3 col = mix(uHorizon, uTop, pow(smoothstep(-.05, .6, h), .8));
        col = mix(col, uHorizon * .85, smoothstep(.0, -.3, h));
        float s = max(dot(normalize(vDir), normalize(uSunDir)), 0.0);
        col += uSunCol * (pow(s, 64.0) * 1.2 + pow(s, 6.0) * .18);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  dome.renderOrder = -10; dome.frustumCulled = false; scene.add(dome);

  // Stars fade in at night.
  const r = rng(11), starPos = [];
  for (let i = 0; i < 700; i++) { const a = r() * 6.28, y = .08 + r() * .92, rr = Math.sqrt(1 - y * y); starPos.push(Math.cos(a) * rr * 400, y * 400, Math.sin(a) * rr * 400); }
  const starGeo = new T.BufferGeometry(); starGeo.setAttribute('position', new T.Float32BufferAttribute(starPos, 3));
  const stars = new T.Points(starGeo, new T.PointsMaterial({ color: '#fff8e8', size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  stars.frustumCulled = false; scene.add(stars);

  // Puffy drifting clouds.
  const cloudMat = new T.MeshStandardMaterial({ color: '#ffffff', roughness: 1, emissive: '#ffffff', emissiveIntensity: .35, flatShading: false });
  const clouds = [];
  for (let i = 0; i < (quality === 'low' ? 7 : 12); i++) {
    const g = new T.Group();
    const n = 4 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const m = new T.Mesh(blobGeometry(1, (i + k) % 9, .12), cloudMat);
      const s = 2.2 + r() * 2;
      m.scale.set(s * 1.3, s * .75, s); m.position.set((k - n / 2) * 2.6 + r(), r() * 1.2, (r() - .5) * 2.5); g.add(m);
    }
    g.position.set(-90 + r() * 180, 30 + r() * 12, -80 + r() * 120);
    g.userData.speed = .5 + r() * .6;
    scene.add(g); clouds.push(g);
  }

  let hour = 9;
  const tmp = { top: new T.Color(), hor: new T.Color(), sunC: new T.Color(), hs: new T.Color(), hg: new T.Color(), fog: new T.Color() };
  const sunDir = new T.Vector3();

  function sample(hh) {
    let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] <= hh) i++;
    const a = KEYS[i], b = KEYS[i + 1], t = T.MathUtils.smoothstep(hh, a[0], b[0]);
    tmp.top.copy(a[1]).lerp(b[1], t); tmp.hor.copy(a[2]).lerp(b[2], t); tmp.sunC.copy(a[3]).lerp(b[3], t);
    tmp.hs.copy(a[5]).lerp(b[5], t); tmp.hg.copy(a[6]).lerp(b[6], t); tmp.fog.copy(a[8]).lerp(b[8], t);
    return { sunI: a[4] + (b[4] - a[4]) * t, hemiI: a[7] + (b[7] - a[7]) * t, night: a[9] + (b[9] - a[9]) * t };
  }

  function update(dt, center) {
    // Days are long, nights are short and gentle (it's a kids' game).
    const rate = hour >= 6 && hour < 20.5 ? 1 / 25 : 1 / 9;
    hour = (hour + dt * rate) % 24;
    const k = sample(hour);
    let a, isSun = hour >= 5 && hour < 20.5;
    if (isSun) a = (hour - 5) / 15.5 * Math.PI; else a = (((hour - 20.5) + 24) % 24) / 8.5 * Math.PI;
    sunDir.set(-Math.cos(a) * .85, Math.max(Math.sin(a), .12) * 1.15, .5).normalize();
    const fade = Math.min(1, Math.sin(a) * 5);
    sun.color.copy(tmp.sunC); sun.intensity = k.sunI * Math.max(.05, fade);
    sun.position.copy(center).addScaledVector(sunDir, 40); sun.target.position.copy(center);
    hemi.color.copy(tmp.hs); hemi.groundColor.copy(tmp.hg); hemi.intensity = k.hemiI;
    if (scene.fog) scene.fog.color.copy(tmp.fog);
    uniforms.uTop.value.copy(tmp.top); uniforms.uHorizon.value.copy(tmp.hor);
    uniforms.uSunDir.value.copy(sunDir); uniforms.uSunCol.value.copy(tmp.sunC).multiplyScalar(isSun ? fade : fade * .4);
    U.uNight.value = k.night;
    stars.material.opacity = Math.max(0, k.night - .2) * 1.1;
    cloudMat.emissive.copy(tmp.hor).lerp(tmp.sunC, .3); cloudMat.emissiveIntensity = .35 - k.night * .2;
    dome.position.copy(center); stars.position.copy(center);
    for (const c of clouds) { c.position.x += c.userData.speed * dt; if (c.position.x - center.x > 110) c.position.x -= 220; }
    return { night: k.night, horizon: tmp.hor };
  }

  function clock() {
    const hh = Math.floor(hour), mm = Math.floor((hour - hh) * 60);
    const phase = PHASES.find(([end]) => hour < end)[1];
    return { label: `${hh}:${String(mm).padStart(2, '0')}`, phase, night: U.uNight.value > .5, hour };
  }

  return { update, clock, setHour(h) { hour = h; }, dome };
}
