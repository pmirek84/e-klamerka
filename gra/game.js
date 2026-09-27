import { NEW_WORLD, REGIONS, WORLD_PLACES, normalizeWorld, unlocked } from './world/regions.js';
export const SAVE_KEY = 'eklamerka-world-v1';
export const BREED_TIME = 60_000;
export const MAX_BABIES = 6;
export const INITIAL = { version: 1, world: NEW_WORLD, crystals: 0, name: '', avatar: 'girl', wood: 4, stone: 3, carrots: 0, coins: 8, seeds: 0, houseLevel: 0, landLevel: 0, pen: false, rabbits: false, babies: 0, planted: false, watered: false, nextBirthAt: null };
const count = (value, max = 999999) => Math.min(max, Math.max(0, Math.floor(Number(value) || 0)));
export function normalize(raw = {}) {
  const s = { ...INITIAL };
  for (const k of ['wood', 'stone', 'carrots', 'coins', 'seeds', 'babies', 'crystals']) s[k] = count(raw[k] ?? s[k]);
  s.world = normalizeWorld(raw.world);
  s.houseLevel = count(raw.houseLevel || (raw.house ? 1 : 0), 3);
  s.landLevel = count(raw.landLevel, 3);
  s.name = String(raw.name || '').slice(0, 20);
  s.avatar = raw.avatar === 'boy' ? 'boy' : 'girl';
  for (const k of ['pen', 'rabbits', 'planted', 'watered']) s[k] = Boolean(raw[k]);
  // A pending litter has already been fed. Legacy timers are intentionally not migrated.
  s.nextBirthAt = raw.version === 1 && Number.isFinite(raw.nextBirthAt) && raw.nextBirthAt > 0 ? raw.nextBirthAt : null;
  return s;
}
export function loadGame(storage = localStorage) {
  try { const raw = storage.getItem(SAVE_KEY) || storage.getItem('farm-v2'); return normalize(raw ? JSON.parse(raw) : {}); }
  catch { return { ...INITIAL }; }
}
export const COSTS = { house: { wood: 6, stone: 5 }, upgrade: { wood: 8, stone: 6, coins: 5 }, pen: { wood: 5, stone: 2 } };
export function transact(state, action, now = Date.now()) {
  const s = { ...state, crystals: state.crystals || 0, world: normalizeWorld(state.world) };
  const fail = message => ({ state, message, ok: false });
  const pay = cost => {
    if (Object.entries(cost).some(([k, n]) => s[k] < n)) return false;
    for (const [k, n] of Object.entries(cost)) s[k] -= n;
    return true;
  };
  let message;
  switch (action) {
    case 'visit:woodland': case 'visit:quarry': case 'visit:meadow': {
      const id=action.split(':')[1];
      if(!unlocked(id,s)||s.world.visited.includes(id))return {state,ok:false};
      s.world.visited=[...s.world.visited,id];message=`Odkryto: ${REGIONS[id].name}`;break;
    }
    case 'unlock:quarry': case 'unlock:meadow': {
      const id=action.split(':')[1];
      if(s.world[id])return fail('Ten most jest już gotowy.');
      if(!s.houseLevel)return fail('Zbuduj najpierw dom, żeby mieć dokąd wracać.');
      if(!pay(REGIONS[id].cost))return fail('Brakuje materiałów pokazanych przy moście.');
      s.world[id]=true;message=`Most gotowy! ${REGIONS[id].name} czekają na odkrycie.`;break;
    }
    case 'grove':
      if(now-s.world.lastGrove<12000)return fail('Las odpoczywa. Wróć za chwilkę.');
      s.wood+=5;s.world.lastGrove=now;message='+5 drewna ze starych dębów';break;
    case 'crystals':
      if(!s.world.quarry)return fail('Najpierw napraw most do Kryształowych Wzgórz.');
      if(now-s.world.lastCrystals<12000)return fail('Kryształy odrastają. Wróć za chwilkę.');
      s.stone+=3;s.crystals++;s.world.lastCrystals=now;message='+3 kamienie i 1 kryształ';break;
    case 'chest':
      if(s.world.chest)return fail('Skarb został już zebrany.');
      s.world.chest=true;s.coins+=8;s.seeds+=2;message='Skarb odkrywcy! +8 monet i 2 paczuszki nasion';break;
    case 'orchard':
      if(!s.world.meadow)return fail('Najpierw otwórz drogę na łąkę.');
      if(s.world.orchard)return fail('Sad już rośnie i zwiększa zbiory na farmie.');
      if(!pay({wood:10,stone:4,coins:8}))return fail('Na sad potrzeba 10 drewna, 4 kamieni i 8 monet.');
      s.world.orchard=true;message='Sad zasadzony! Każdy zbiór na farmie daje 2 dodatkowe marchewki.';break;
    case 'windmill':
      if(!s.world.meadow)return fail('Najpierw otwórz drogę na łąkę.');
      if(s.world.windmill)return fail('Wiatrak już pracuje dla farmy.');
      if(!pay({wood:14,stone:8,crystals:2}))return fail('Na wiatrak potrzeba 14 drewna, 8 kamieni i 2 kryształów.');
      s.world.windmill=true;message='Wiatrak gotowy! Każdy zbiór daje jeszcze 2 marchewki.';break;
    case 'sell-crystal':
      if(!pay({crystals:1}))return fail('Przynieś kryształ ze wzgórz.');
      s.coins+=4;message='Sprzedano kryształ · +4 monety';break;
    case 'forest': s.wood += 2; message = '+2 drewna do plecaka'; break;
    case 'mine': s.stone += 2; message = '+2 kamienia do plecaka'; break;
    case 'house': {
      if (s.houseLevel >= 3) return fail('Twój dom ma już wszystkie piętra!');
      if (!pay(s.houseLevel ? COSTS.upgrade : COSTS.house)) return fail('Zbierz jeszcze materiały pokazane przy budowie.');
      s.houseLevel++; message = s.houseLevel === 1 ? 'To już Twój dom! Teraz czas na króliczą zagrodę.' : 'Nowe piętro, większy dom!'; break;
    }
    case 'pen':
      if (!s.houseLevel) return fail('Najpierw zbuduj swój dom.');
      if (s.pen) return fail('Zagroda jest gotowa.');
      if (!pay(COSTS.pen)) return fail('Na zagrodę potrzeba 5 drewna i 2 kamieni.');
      s.pen = true; s.rabbits = true; message = 'Bezuch i Karmelka zamieszkali na farmie!'; break;
    case 'feed':
      if (!s.pen || !s.rabbits) return fail('Najpierw przygotuj zagrodę dla królików.');
      if (s.nextBirthAt) return fail('Królicza rodzinka już czeka na maluszka.');
      if (s.babies >= MAX_BABIES) return fail('Zagroda jest pełna. Znajdź maluszkom dom w sklepie.');
      if (!pay({ carrots: 2 })) return fail('Przynieś 2 marchewki z ogródka lub sklepu.');
      s.nextBirthAt = now + BREED_TIME; message = 'Króliki nakarmione. Maluszek pojawi się za minutę.'; break;
    case 'tick':
      if (!s.nextBirthAt || now < s.nextBirthAt) return { state, ok: false };
      s.nextBirthAt = null;
      if (s.babies < MAX_BABIES) { s.babies++; message = 'W zagrodzie pojawił się mały króliczek!'; }
      break;
    case 'garden':
      if (!s.planted) {
        if (!pay({ seeds: 1 })) return fail('Kup nasionka w sklepiku za 2 monety.');
        s.planted = true; message = 'Posiane! Podejdź i podlej grządkę.';
      } else if (!s.watered) { s.watered = true; message = 'Marchewki są gotowe do zebrania!'; }
      else { s.carrots += harvestYield(s); s.planted = false; s.watered = false; message = `Zebrano ${harvestYield(s)} marchewki`; }
      break;
    case 'land':
      if (s.landLevel >= 3) return fail('Cała polana należy już do Ciebie.');
      if (!pay({ wood: 8 + s.landLevel * 4, stone: 4 + s.landLevel * 2, coins: 5 })) return fail('Dołączanie polany wymaga materiałów i 5 monet.');
      s.landLevel++; message = 'Nowa polana i dodatkowa grządka są Twoje!'; break;
    case 'buy-seeds':
      if (!pay({ coins: 2 })) return fail('Brakuje monet. Możesz sprzedać drewno lub kamień.');
      s.seeds++; message = 'Kupiono nasionka · −2 monety'; break;
    case 'buy-carrots':
      if (!pay({ coins: 3 })) return fail('Potrzebujesz 3 monet.');
      s.carrots += 2; message = 'Kupiono 2 marchewki · −3 monety'; break;
    case 'sell-wood':
      if (!pay({ wood: 2 })) return fail('Przynieś 2 drewna.');
      s.coins += 2; message = 'Sprzedano drewno · +2 monety'; break;
    case 'sell-stone':
      if (!pay({ stone: 2 })) return fail('Przynieś 2 kamienie.');
      s.coins += 2; message = 'Sprzedano kamień · +2 monety'; break;
    case 'sell-baby':
      if (!pay({ babies: 1 })) return fail('Nie masz jeszcze małego króliczka.');
      s.coins += 5; message = 'Maluszek ma nowy dom · +5 monet'; break;
    default: return fail('Nieznana akcja.');
  }
  return { state: s, message, ok: true };
}
export const harvestYield=s=>3+s.landLevel+(s.world?.orchard?2:0)+(s.world?.windmill?2:0);
export const PLACES = {
  ...WORLD_PLACES,
  house: { title: 'Twój dom', short: 'Dom', x: -3, z: -2, approach: [-3, 1.5], label: [-3, 4.8, -2] },
  forest: { title: 'Leśna ścieżka', short: 'Las', x: -9, z: -4, approach: [-7, -1.3], label: [-8.7, 4, -4] },
  mine: { title: 'Kryształowe skały', short: 'Kopalnia', x: 6.8, z: -5.5, approach: [5.5, -3.3], label: [6.6, 3.6, -5.5] },
  garden: { title: 'Marchewkowy ogród', short: 'Ogród', x: -4.8, z: 5, approach: [-2.8, 5.5], label: [-5, 1.2, 5] },
  pen: { title: 'Bezuch i Karmelka', short: 'Króliki', x: 5.3, z: 2.3, approach: [3, 4.8], label: [5.3, 2.8, 2.3] },
  shop: { title: 'Sklepik pod klamerką', short: 'Sklepik', x: -9, z: 3.8, approach: [-7, 2.6], label: [-9, 3.5, 3.8] },
  land: { title: 'Nowa polana', short: 'Rozbudowa', x: 11, z: 5, approach: [9, 5.8], label: [10.8, 1.6, 5] },
};
export function actionFor(place, s) {
  switch (place) {
    case 'quarryGate': case 'meadowGate': {
      const id=place==='quarryGate'?'quarry':'meadow',r=REGIONS[id];
      return s.world?.[id]?{label:'Wyrusz na wyprawę',hint:r.name,action:`travel:${r.destination}`,icon:r.icon}:{label:'Napraw most',hint:'Połącz farmę z nową wyspą.',cost:r.cost,action:`unlock:${id}`,disabled:!s.houseLevel,icon:'land'};
    }
    case 'grove': return {label:'Zbierz drewno',hint:'5 drewna · dęby odpoczywają 12 sekund po zbiorze.',action:'grove',icon:'wood'};
    case 'crystals': return {label:'Wydobądź kryształ',hint:'3 kamienie i 1 kryształ · odnowienie co 12 sekund.',action:'crystals',icon:'crystal'};
    case 'chest': return {label:s.world?.chest?'Skarb odnaleziony':'Otwórz skrzynkę',hint:'Jednorazowo 8 monet i 2 paczuszki nasion.',action:'chest',disabled:s.world?.chest,icon:'coins'};
    case 'orchard': return {label:s.world?.orchard?'Sad już rośnie':'Zasadź sad',hint:'Dodatkowe 2 marchewki przy każdym zbiorze na farmie.',cost:{wood:10,stone:4,coins:8},action:'orchard',disabled:s.world?.orchard,icon:'leaf'};
    case 'windmill': return {label:s.world?.windmill?'Wiatrak pracuje':'Zbuduj wiatrak',hint:'Dodaje kolejne 2 marchewki do każdego zbioru.',cost:{wood:14,stone:8,crystals:2},action:'windmill',disabled:s.world?.windmill,icon:'house'};
    case 'forest': return { label: 'Zbierz drewno', hint: 'Dwa kawałki drewna na każdą wyprawę.', action: 'forest', icon: 'wood' };
    case 'mine': return { label: 'Wydobądź kamień', hint: 'Kilof w dłoń! Zdobędziesz 2 kamienie.', action: 'mine', icon: 'stone' };
    case 'house': return { label: s.houseLevel ? s.houseLevel >= 3 ? 'Dom ukończony' : 'Rozbuduj dom' : 'Zbuduj dom', hint: s.houseLevel ? 'Nowe piętro, dach i więcej miejsca.' : 'Tu zaczyna się Twoja własna farma.', cost: s.houseLevel ? COSTS.upgrade : COSTS.house, action: 'house', disabled: s.houseLevel >= 3, icon: 'house' };
    case 'pen': return s.pen ? { label: 'Nakarm króliczki', hint: s.nextBirthAt ? 'Maluszek jest już w drodze.' : `${s.babies}/${MAX_BABIES} maluszków · nakarm rodziców, by powiększyć rodzinę.`, cost: { carrots: 2 }, action: 'feed', disabled: !!s.nextBirthAt || s.babies >= MAX_BABIES, icon: 'rabbit' } : { label: 'Zbuduj zagrodę', hint: 'Przytulny dom dla Bezucha i Karmelki.', cost: COSTS.pen, action: 'pen', disabled: !s.houseLevel, icon: 'rabbit' };
    case 'garden': return { label: !s.planted ? 'Posiej marchewki' : !s.watered ? 'Podlej ogród' : 'Zbierz marchewki', hint: 'Nasionko, trochę wody i pyszne chrupanie.', cost: !s.planted ? { seeds: 1 } : null, action: 'garden', icon: 'carrot' };
    case 'shop': return { label: 'Otwórz sklepik', hint: 'Nasionka, zapasy i nowe domy dla maluszków.', action: 'shop', icon: 'shop' };
    case 'land': return { label: 'Powiększ farmę', hint: 'Więcej ziemi i większe zbiory marchewek.', cost: { wood: 8 + s.landLevel * 4, stone: 4 + s.landLevel * 2, coins: 5 }, action: 'land', disabled: s.landLevel >= 3, icon: 'land' };
    default: return null;
  }
}
