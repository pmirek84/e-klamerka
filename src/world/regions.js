// One source of truth for terrain, map, gates and save migration.
export const REGIONS = {
  farm: { name: 'Twoja farma', subtitle: 'Dom, ogród i królicza rodzinka', x: 0, z: 0, rx: 13.1, rz: 11, icon: 'house', destination: 'house', color: '#a3bb76' },
  woodland: { name: 'Szumiący Las', subtitle: 'Stare dęby i skrzynka odkrywcy', x: -29, z: 0, rx: 9.7, rz: 8.7, icon: 'wood', destination: 'grove', color: '#73995f' },
  quarry: { name: 'Kryształowe Wzgórza', subtitle: 'Kamień i niebieskie kryształy', x: 0, z: -29, rx: 9.7, rz: 8.7, icon: 'crystal', destination: 'crystals', gate: 'quarryGate', cost: { wood: 10, stone: 6 }, color: '#aaa5bf' },
  meadow: { name: 'Słoneczna Łąka', subtitle: 'Nowy sad, wiatrak i większe zbiory', x: 31, z: -1, rx: 10.2, rz: 8.7, icon: 'leaf', destination: 'orchard', gate: 'meadowGate', cost: { wood: 14, stone: 10, crystals: 3 }, color: '#d4c683' },
  lake: { name: 'Lazurowe Jezioro', subtitle: 'Złota przystań, połów rybek i perły', x: 0, z: 30, rx: 10.5, rz: 9.2, icon: 'stall', destination: 'lakeDock', gate: 'lakeGate', cost: { wood: 16, stone: 12, crystals: 3 }, color: '#5b9eb8' },
  clouds: { name: 'Gwiezdna Polana', subtitle: 'Gwiezdny pył i kryształowy teleskop', x: 28, z: -28, rx: 9.5, rz: 8.8, icon: 'star', destination: 'observatory', gate: 'cloudsGate', cost: { wood: 20, stone: 15, crystals: 6 }, color: '#8a77b8' },
};

export const WORLD_PLACES = {
  grove: { title: 'Dębowy zakątek', short: 'Stare dęby', region: 'woodland', x: -31, z: -2, approach: [-29, 1], label: [-31, 4, -2] },
  chest: { title: 'Skrzynka odkrywcy', short: 'Skarb lasu', region: 'woodland', x: -33, z: 4, approach: [-32, 3], label: [-33, 1.8, 4] },
  quarryGate: { title: 'Most do wzgórz', short: 'Most do wzgórz', x: 0, z: -10.7, approach: [0, -9.6], label: [0, 1.9, -11] },
  crystals: { title: 'Błękitna żyła', short: 'Kryształy', region: 'quarry', x: 1, z: -30, approach: [0, -27], label: [1, 4.5, -30] },
  meadowGate: { title: 'Most na łąkę', short: 'Most na łąkę', x: 12.5, z: -3, approach: [11, -3], label: [12.5, 2, -3] },
  orchard: { title: 'Sad na Słonecznej Łące', short: 'Sad', region: 'meadow', x: 30, z: 2, approach: [28, 2], label: [30, 3.5, 2] },
  windmill: { title: 'Wiatrak na wzgórzu', short: 'Wiatrak', region: 'meadow', x: 34, z: -4, approach: [33, -1.5], label: [34, 5.5, -4] },
  lakeGate: { title: 'Most na Lazurowe Jezioro', short: 'Most na jezioro', x: 0, z: 10.8, approach: [0, 9.5], label: [0, 1.9, 10.8] },
  lakeDock: { title: 'Złota Przystań', short: 'Przystań', region: 'lake', x: 0, z: 28, approach: [0, 26], label: [0, 3.2, 28] },
  lakePearls: { title: 'Perłowa Zatoczka', short: 'Perły', region: 'lake', x: -3.5, z: 32, approach: [-2.5, 31], label: [-3.5, 2.5, 32] },
  cloudsGate: { title: 'Ścieżka na Gwiezdną Polanę', short: 'Ścieżka gwiazd', x: 16, z: -16, approach: [14.5, -14.5], label: [16, 2.2, -16] },
  observatory: { title: 'Obserwatorium Gwiazd', short: 'Teleskop', region: 'clouds', x: 28, z: -28, approach: [26, -27], label: [28, 4.5, -28] },
};

export const NEW_WORLD = { quarry: false, meadow: false, lake: false, clouds: false, orchard: false, windmill: false, chest: false, visited: ['farm'], lastGrove: 0, lastCrystals: 0, lastLake: 0, lastObservatory: 0 };

export function normalizeWorld(raw={}) {
  raw = raw && typeof raw === 'object' ? raw : {};
  return {
    ...NEW_WORLD,
    quarry: !!raw.quarry,
    meadow: !!raw.meadow,
    lake: !!raw.lake,
    clouds: !!raw.clouds,
    orchard: !!raw.orchard && !!raw.meadow,
    windmill: !!raw.windmill && !!raw.meadow,
    chest: !!raw.chest,
    visited: [...new Set(['farm', ...(Array.isArray(raw.visited) ? raw.visited.filter(id => REGIONS[id]) : [])])],
    lastGrove: Math.max(0, Number(raw.lastGrove) || 0),
    lastCrystals: Math.max(0, Number(raw.lastCrystals) || 0),
    lastLake: Math.max(0, Number(raw.lastLake) || 0),
    lastObservatory: Math.max(0, Number(raw.lastObservatory) || 0)
  };
}

export const unlocked = (id, s) => id === 'farm' || id === 'woodland' || !!s.world?.[id];
const inOval = (x, z, r) => ((x - r.x) / r.rx) ** 2 + ((z - r.z) / r.rz) ** 2 < 1;
export function regionAt(x, z) { return Object.entries(REGIONS).find(([, r]) => inOval(x, z, r))?.[0] || null; }

export function insideWorld(x, z, s) {
  if (Object.entries(REGIONS).some(([id, r]) => unlocked(id, s) && inOval(x, z, r))) return true;
  if (x >= -21 && x <= -11.8 && Math.abs(z) < 1.02) return true;
  if (s.world?.quarry && Math.abs(x) < 1.02 && z >= -21 && z <= -10) return true;
  if (s.world?.meadow && x >= 11.8 && x <= 22 && Math.abs(z + 3) < 1.02) return true;
  if (s.world?.lake && Math.abs(x) < 1.02 && z >= 10 && z <= 21) return true;
  if (s.world?.clouds && x >= 10 && x <= 21 && z <= -10 && z >= -21) return true;
  return Array.from({ length: s.landLevel || 0 }, (_, i) => 13 + i * 2.8).some(cx => ((x - cx) / 2.8) ** 2 + ((z - 4.8) / 3.8) ** 2 < 1);
}

export function visiblePlace(p, s) { return !p.region || unlocked(p.region, s); }
