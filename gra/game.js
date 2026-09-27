export const SAVE_KEY = 'eklamerka-world-v1';
export const BREED_TIME = 60_000;
export const MAX_BABIES = 6;
export const INITIAL = { version: 1, name: '', avatar: 'girl', wood: 4, stone: 3, carrots: 0, coins: 8, seeds: 0, houseLevel: 0, landLevel: 0, pen: false, rabbits: false, babies: 0, planted: false, watered: false, nextBirthAt: null };
const count = (value, max = 999999) => Math.min(max, Math.max(0, Math.floor(Number(value) || 0)));
export function normalize(raw = {}) {
  const s = { ...INITIAL };
  for (const k of ['wood', 'stone', 'carrots', 'coins', 'seeds', 'babies']) s[k] = count(raw[k] ?? s[k]);
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
  const s = { ...state };
  const fail = message => ({ state, message, ok: false });
  const pay = cost => {
    if (Object.entries(cost).some(([k, n]) => s[k] < n)) return false;
    for (const [k, n] of Object.entries(cost)) s[k] -= n;
    return true;
  };
  let message;
  switch (action) {
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
      else { s.carrots += 3 + s.landLevel; s.planted = false; s.watered = false; message = `Zebrano ${3 + s.landLevel} marchewki`; }
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
export const PLACES = {
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
