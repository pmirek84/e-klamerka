// One source of truth for terrain, map, gates and save migration.
export const REGIONS = {
  farm: { name: 'Twoja farma', subtitle: 'Dom, ogród i królicza rodzinka', x: 0, z: 0, rx: 13.1, rz: 11, icon: 'house', destination: 'house', color: '#a3bb76' },
  woodland: { name: 'Szumiący Las', subtitle: 'Stare dęby, Mądra Sowa i skarb lasu', x: -29, z: 0, rx: 9.7, rz: 8.7, icon: 'wood', destination: 'grove', color: '#73995f' },
  quarry: { name: 'Kryształowe Wzgórza', subtitle: 'Kamień i niebieskie kryształy', x: 0, z: -29, rx: 9.7, rz: 8.7, icon: 'crystal', destination: 'crystals', gate: 'quarryGate', cost: { wood: 10, stone: 6 }, color: '#aaa5bf' },
  meadow: { name: 'Słoneczna Łąka', subtitle: 'Nowy sad, wiatrak i większe zbiory', x: 31, z: -1, rx: 10.2, rz: 8.7, icon: 'leaf', destination: 'orchard', gate: 'meadowGate', cost: { wood: 14, stone: 10, crystals: 3 }, color: '#d4c683' },
};
export const WORLD_PLACES = {
  grove: { title: 'Dębowy zakątek', short: 'Stare dęby', region: 'woodland', x: -31, z: -2, approach: [-29, 1], label: [-31, 4, -2] },
  owl: { title: 'Mądra Sowa Klara', short: 'Sowa', region: 'woodland', x: -28, z: -3.5, approach: [-27, -2.5], label: [-28, 4, -3.5] },
  chest: { title: 'Skrzynka odkrywcy', short: 'Skarb lasu', region: 'woodland', x: -33, z: 4, approach: [-32, 3], label: [-33, 1.8, 4] },
  quarryGate: { title: 'Most do wzgórz', short: 'Most do wzgórz', x: 0, z: -10.7, approach: [0, -9.6], label: [0, 1.9, -11] },
  crystals: { title: 'Błękitna żyła', short: 'Kryształy', region: 'quarry', x: 1, z: -30, approach: [0, -27], label: [1, 4.5, -30] },
  meadowGate: { title: 'Most na łąkę', short: 'Most na łąkę', x: 12.5, z: -3, approach: [11, -3], label: [12.5, 2, -3] },
  orchard: { title: 'Sad na Słonecznej Łące', short: 'Sad', region: 'meadow', x: 30, z: 2, approach: [28, 2], label: [30, 3.5, 2] },
  windmill: { title: 'Wiatrak na wzgórzu', short: 'Wiatrak', region: 'meadow', x: 34, z: -4, approach: [33, -1.5], label: [34, 5.5, -4] },
};
export const NEW_WORLD = { quarry: false, meadow: false, orchard: false, windmill: false, chest: false, visited: ['farm'], lastGrove: 0, lastCrystals: 0 };
export function normalizeWorld(raw={}) {
  raw=raw&&typeof raw==='object'?raw:{};
  return { ...NEW_WORLD, quarry:!!raw.quarry, meadow:!!raw.meadow, orchard:!!raw.orchard&&!!raw.meadow, windmill:!!raw.windmill&&!!raw.meadow,
    chest:!!raw.chest, visited:[...new Set(['farm',...(Array.isArray(raw.visited)?raw.visited.filter(id=>REGIONS[id]):[])])],
    lastGrove:Math.max(0,Number(raw.lastGrove)||0),lastCrystals:Math.max(0,Number(raw.lastCrystals)||0) };
}
export const unlocked = (id,s) => id==='farm'||id==='woodland'||!!s.world?.[id];
const inOval=(x,z,r)=>((x-r.x)/r.rx)**2+((z-r.z)/r.rz)**2<1;
export function regionAt(x,z){return Object.entries(REGIONS).find(([,r])=>inOval(x,z,r))?.[0]||null;}
export function insideWorld(x,z,s) {
  if(Object.entries(REGIONS).some(([id,r])=>unlocked(id,s)&&inOval(x,z,r)))return true;
  if(x>=-21&&x<=-11.8&&Math.abs(z)<1.02)return true;
  if(s.world?.quarry&&Math.abs(x)<1.02&&z>=-21&&z<=-10)return true;
  if(s.world?.meadow&&x>=11.8&&x<=22&&Math.abs(z+3)<1.02)return true;
  return Array.from({length:s.landLevel||0},(_,i)=>13+i*2.8).some(cx=>((x-cx)/2.8)**2+((z-4.8)/3.8)**2<1);
}
export function visiblePlace(p,s){return !p.region||unlocked(p.region,s);}
