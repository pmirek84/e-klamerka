import { NEW_WORLD, REGIONS, WORLD_PLACES, normalizeWorld, unlocked } from './world/regions.js';
export const SAVE_KEY = 'eklamerka-world-v1';
export const BREED_TIME = 45_000;
export const MAX_BABIES_PER_LEVEL = 6;

export const DEFAULT_VISITORS = [
  { id: 'v1', name: 'Leśny Wędrowiec', desc: 'Szuka chrupiących jabłek na drogę przez las.', wants: { apples: 3 }, gives: { coins: 12 }, icon: 'apple' },
  { id: 'v2', name: 'Kupiec z Wzgórz', desc: 'Potrzebuje marchewek i drewna do kopalni.', wants: { carrots: 5, wood: 2 }, gives: { coins: 15, seeds: 1 }, icon: 'carrot' },
  { id: 'v3', name: 'Podróżnik z Łąki', desc: 'Chętnie kupi świeżą mąkę z wiatraka i małego króliczka.', wants: { flour: 2, babies: 1 }, gives: { coins: 28, crystals: 1 }, icon: 'rabbit' }
];

export const OWL_RIDDLES = [
  {
    id: 1,
    question: 'Mam długie puszyste uszy, uwielbiam chrupać marchewki i wesoło kicami po polanie. Kim jestem?',
    options: ['Królik', 'Wilk', 'Wiewiórka'],
    answer: 0,
    reward: { coins: 8, carrots: 2 },
    fact: 'Brawo! Króliki słyszą dźwięki z ogromnych odległości i uwielbiają kicać!'
  },
  {
    id: 2,
    question: 'Wisi na gałęzi w sadzie. Jest okrągłe, soczyste, czerwone i pyszne na deser. Co to?',
    options: ['Szyszka', 'Jabłko', 'Kamyk'],
    answer: 1,
    reward: { coins: 8, apples: 2 },
    fact: 'Świetnie! Jedno jabłko dziennie daje mnóstwo witamin i siły do zabawy!'
  },
  {
    id: 3,
    question: 'Co jest najbardziej potrzebne ziarenku w ziemi, żeby wyrosła z niego soczysta roślinka?',
    options: ['Słońce i woda', 'Mróz i ciemność', 'Cukierki'],
    answer: 0,
    reward: { coins: 10, seeds: 2 },
    fact: 'Mądra odpowiedź! Rośliny piją wodę z ziemi i łapią ciepłe promyki słońca!'
  },
  {
    id: 4,
    question: 'Błyszczy na wysokich wzgórzach, ma piękny błękitny kolor jak bezchmurne niebo. Co to za skarb?',
    options: ['Kryształ', 'Węgiel', 'Kawałek lodu'],
    answer: 0,
    reward: { coins: 12, crystals: 1 },
    fact: 'Znakomicie! Błękitne kryształy rozświetlają całą krainę i mają magiczną moc!'
  },
  {
    id: 5,
    question: 'Obracam ogromnymi skrzydłami na wietrze i pomagam mleć ziarna na mąkę. Co to za budowla?',
    options: ['Płot', 'Wiatrak', 'Most'],
    answer: 1,
    reward: { coins: 10, wood: 4 },
    fact: 'Wspaniale! Wiatrak wykorzystuje czystą siłę wiatru do pracy na farmie!'
  },
  {
    id: 6,
    question: 'Mieszkam w starym dębie, mam wielkie mądre oczy i wiem wszystko o świecie przyrody. Kto to?',
    options: ['Niedźwiedź', 'Mądra Sowa Klara', 'Ropucha'],
    answer: 1,
    reward: { coins: 15, crystals: 1 },
    fact: 'Huhu! To właśnie ja – Mądra Sowa Klara, Twoja skrzydlata przyjaciółka!'
  }
];

export const hasConnectedWorld = (s) => Boolean(s.world?.quarry || s.world?.meadow || (s.world?.visited && s.world?.visited.length > 1));

export function getAvailableVisitors(s) {
  if (!s || !hasConnectedWorld(s)) return [];
  const list = [];
  // Leśny wędrowiec przychodzi, gdy odwiedzono Szumiący Las
  if (s.world?.visited?.includes('woodland') || s.world?.quarry || s.world?.meadow) {
    list.push(s.visitors?.find(v => v.id === 'v1') || DEFAULT_VISITORS[0]);
  }
  // Kupiec ze Wzgórz przychodzi po naprawie mostu do Kryształowych Wzgórz
  if (s.world?.quarry) {
    list.push(s.visitors?.find(v => v.id === 'v2') || DEFAULT_VISITORS[1]);
  }
  // Podróżnik z Łąki przychodzi po naprawie mostu na Słoneczną Łąkę
  if (s.world?.meadow) {
    list.push(s.visitors?.find(v => v.id === 'v3') || DEFAULT_VISITORS[2]);
  }
  return list.length ? list : [s.visitors?.[0] || DEFAULT_VISITORS[0]];
}

export const TOURIST_GUESTS = [
  {
    id: 't1',
    name: 'Mikołaj Podróżnik',
    origin: 'Kryształowe Wzgórza',
    avatar: 'hat',
    greeting: '„Witajcie! Po całym dniu wspinaczki przez most marzę o ciepłym posiłku i miękkim łóżku. Wasza rezydencja jest słynna w całych Wzgórzach!”',
    favorite: 'chleb',
    wantsHint: 'Najbardziej ucieszy się ze świeżego bochenka chleba z mąki wiatracznej.',
    review: '„⭐⭐⭐⭐⭐ Wspaniały pobyt! Zapach świeżo pieczonego chleba obudził mnie o poranku!”'
  },
  {
    id: 't2',
    name: 'Łucja Zielarka',
    origin: 'Słoneczna Łąka',
    avatar: 'ribbon',
    greeting: '„Dzień dobry! Przyszłam zbierać rzadkie zioła. Wasz sad pachnie tak cudownie! Czy znajdzie się dla mnie wolny pokój z widokiem na jabłonie?”',
    favorite: 'jablka',
    wantsHint: 'Uwielbia soczyste czerwone jabłka z sadu.',
    review: '„⭐⭐⭐⭐⭐ Najbardziej uroczy dom w dolinie! Jabłka były niesamowicie słodkie i orzeźwiające.”'
  },
  {
    id: 't3',
    name: 'Kacper Wędrowny Bard',
    origin: 'Szumiący Las',
    avatar: 'cap',
    greeting: '„Witajcie przyjaciele! Piszę pieśń o wiatraku i pracowitych króliczkach. Czy mogę przenocować w Waszych gościnnych progach?”',
    favorite: 'marchewki',
    wantsHint: 'Chętnie schrupie świeże słodkie marchewki z ogrodu.',
    review: '„⭐⭐⭐⭐⭐ Cisza, spokój i wspaniała gościnność. Skomponowałem tu nową balladę o farmie!”'
  },
  {
    id: 't4',
    name: 'Zuzia Odkrywczyni',
    origin: 'Tajemnicze Jaskinie',
    avatar: 'crown',
    greeting: '„Cześć! Badałam jaskinie w poszukiwaniu skarbów. Wasza rezydencja to najprzytulniejsze miejsce na całej mapie!”',
    favorite: 'chleb',
    wantsHint: 'Chętnie skosztuje ciepłego chleba z mąki lub soczystych owoców.',
    review: '„⭐⭐⭐⭐⭐ Przytulne łóżko i serdeczni gospodarze. Na pewno wrócę z kolejnej wyprawy!”'
  }
];

export const INITIAL = {
  version: 2,
  world: NEW_WORLD,
  crystals: 0,
  apples: 0,
  flour: 0,
  name: '',
  avatar: 'girl',
  wood: 4,
  stone: 3,
  carrots: 0,
  coins: 10,
  seeds: 1,
  houseLevel: 0,
  landLevel: 0,
  penLevel: 1,
  pen: false,
  rabbits: false,
  babies: 0,
  planted: false,
  watered: false,
  nextBirthAt: null,
  helper: false,
  stall: false,
  orchardLevel: 0,
  lastOrchard: 0,
  lastTouristIncome: 0,
  guestIndex: 0,
  hostedGuestsCount: 0,
  guestReviews: [],
  solvedRiddles: [],
  visitors: DEFAULT_VISITORS
};

const count = (value, max = 999999) => Math.min(max, Math.max(0, Math.floor(Number(value) || 0)));

export function normalize(raw = {}) {
  const s = { ...INITIAL };
  for (const k of ['wood', 'stone', 'carrots', 'apples', 'flour', 'coins', 'seeds', 'babies', 'crystals']) s[k] = count(raw[k] ?? s[k]);
  s.world = normalizeWorld(raw.world);
  s.houseLevel = count(raw.houseLevel || (raw.house ? 1 : 0), 3);
  s.landLevel = count(raw.landLevel, 3);
  s.penLevel = count(raw.penLevel || 1, 3);
  s.orchardLevel = count(raw.orchardLevel || (raw.world?.orchard ? 1 : 0), 3);
  s.name = String(raw.name || '').slice(0, 20);
  s.avatar = raw.avatar === 'boy' ? 'boy' : 'girl';
  for (const k of ['pen', 'rabbits', 'planted', 'watered', 'helper', 'stall']) s[k] = Boolean(raw[k]);
  s.nextBirthAt = Number.isFinite(raw.nextBirthAt) && raw.nextBirthAt > 0 ? raw.nextBirthAt : null;
  s.lastOrchard = Number.isFinite(raw.lastOrchard) ? raw.lastOrchard : 0;
  s.lastTouristIncome = Number.isFinite(raw.lastTouristIncome) ? raw.lastTouristIncome : 0;
  s.guestIndex = Number.isInteger(raw.guestIndex) ? raw.guestIndex : 0;
  s.hostedGuestsCount = Number.isInteger(raw.hostedGuestsCount) ? raw.hostedGuestsCount : 0;
  s.guestReviews = Array.isArray(raw.guestReviews) ? raw.guestReviews : [];
  s.solvedRiddles = Array.isArray(raw.solvedRiddles) ? raw.solvedRiddles : [];
  s.visitors = Array.isArray(raw.visitors) && raw.visitors.length ? raw.visitors : DEFAULT_VISITORS;
  return s;
}

export function loadGame(storage = localStorage) {
  try {
    // Check all past save keys in priority order to safely preserve any player save!
    const keysToCheck = [SAVE_KEY, 'farm-v2', 'farm-world-save', 'eklamerka-save', 'farm-save'];
    for (const key of keysToCheck) {
      const raw = storage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            return normalize(parsed);
          }
        } catch {
          // continue to next key
        }
      }
    }
    return { ...INITIAL };
  } catch {
    return { ...INITIAL };
  }
}

export const maxBabies = (s) => (s.penLevel || 1) * MAX_BABIES_PER_LEVEL;

export const COSTS = {
  house: { wood: 6, stone: 5 },
  upgrade2: { wood: 10, stone: 8, coins: 8 },
  upgrade3: { wood: 16, stone: 12, crystals: 2, coins: 15 },
  pen: { wood: 5, stone: 2 },
  penUpgrade: { wood: 10, stone: 6, carrots: 4 },
  helper: { coins: 12, wood: 6, carrots: 4 },
  stall: { wood: 8, stone: 4, coins: 6 },
  orchard: { wood: 10, stone: 4, coins: 8 },
  orchardUpgrade: { wood: 12, seeds: 2, coins: 10 },
  lake: { wood: 16, stone: 12, crystals: 3 },
  clouds: { wood: 20, stone: 15, crystals: 6 }
};

export function houseCost(level) {
  if (level === 0) return COSTS.house;
  if (level === 1) return COSTS.upgrade2;
  return COSTS.upgrade3;
}

export function transact(state, action, now = Date.now()) {
  const s = { ...state, crystals: state.crystals || 0, apples: state.apples || 0, world: normalizeWorld(state.world) };
  const fail = message => ({ state, message, ok: false });
  const pay = cost => {
    if (!cost) return true;
    if (Object.entries(cost).some(([k, n]) => (s[k] || 0) < n)) return false;
    for (const [k, n] of Object.entries(cost)) s[k] -= n;
    return true;
  };

  let message;
  switch (action) {
    case 'visit:woodland': case 'visit:quarry': case 'visit:meadow': case 'visit:lake': case 'visit:clouds': {
      const id = action.split(':')[1];
      if (!unlocked(id, s) || s.world.visited.includes(id)) return { state, ok: false };
      s.world.visited = [...s.world.visited, id];
      message = `Odkryto: ${REGIONS[id].name}`;
      break;
    }
    case 'unlock:quarry': case 'unlock:meadow': case 'unlock:lake': case 'unlock:clouds': {
      const id = action.split(':')[1];
      if (s.world[id]) return fail('Ten most jest już gotowy.');
      if (!s.houseLevel) return fail('Zbuduj najpierw dom, żeby mieć dokąd wracać.');
      if (!pay(REGIONS[id].cost)) return fail('Brakuje materiałów pokazanych przy moście.');
      s.world[id] = true;
      message = `Most gotowy! ${REGIONS[id].name} czekają na odkrycie.`;
      break;
    }
    case 'fish':
      if (now - (s.world.lastLake || 0) < 10000) return fail('Rybki pływają w głębinach. Zarzuć wędkę za chwilkę.');
      s.coins += 8;
      s.seeds = (s.seeds || 0) + 1;
      s.world.lastLake = now;
      message = 'Złowiono 2 lśniące złote rybki z pomostu! +8 monet i +1 nasionko.';
      break;
    case 'pearls':
      if (now - (s.world.lastLake || 0) < 12000) return fail('Woda musi się uspokoić. Spróbuj zanurkować za chwilkę.');
      s.crystals = (s.crystals || 0) + 1;
      s.coins += 6;
      s.world.lastLake = now;
      message = 'Wyłowiono lśniącą perłę z dna jeziora! +1 błękitny kryształ i +6 monet.';
      break;
    case 'stargaze':
      if (now - (s.world.lastObservatory || 0) < 15000) return fail('Czekamy na przejrzyste gwieździste niebo.');
      s.crystals = (s.crystals || 0) + 2;
      s.coins += 15;
      s.world.lastObservatory = now;
      message = 'Spojrzano w gwiazdy przez kryształowy teleskop! Odkryto tajemnice nieba (+15 monet, +2 kryształy)!';
      break;
    case 'grove':
      if (now - s.world.lastGrove < 12000) return fail('Las odpoczywa. Wróć za chwilkę.');
      s.wood += 5;
      s.world.lastGrove = now;
      message = '+5 drewna ze starych dębów';
      break;
    case 'crystals':
      if (!s.world.quarry) return fail('Najpierw napraw most do Kryształowych Wzgórz.');
      if (now - s.world.lastCrystals < 12000) return fail('Kryształy odrastają. Wróć za chwilkę.');
      s.stone += 3;
      s.crystals++;
      s.world.lastCrystals = now;
      message = '+3 kamienie i 1 błękitny kryształ';
      break;
    case 'chest':
      if (s.world.chest) return fail('Skarb został już zebrany.');
      s.world.chest = true;
      s.coins += 10;
      s.seeds += 3;
      message = 'Skarb odkrywcy! +10 monet i 3 paczuszki nasion';
      break;
    case 'orchard':
      if (!s.world.meadow && s.orchardLevel === 0) return fail('Najpierw otwórz drogę na Słoneczną Łąkę.');
      if (s.orchardLevel === 0) {
        if (!pay(COSTS.orchard)) return fail('Na posadzenie sadu potrzeba 10 drewna, 4 kamieni i 8 monet.');
        s.orchardLevel = 1;
        s.world.orchard = true;
        s.apples += 4;
        s.lastOrchard = now;
        message = 'Sad zasadzony! Zebrano pierwsze soczyste jabłka (+4 jabłka).';
      } else {
        if (now - s.lastOrchard < 15000) {
          const waitSec = Math.ceil((15000 - (now - s.lastOrchard)) / 1000);
          return fail(`Jabłka jeszcze dojrzewają na gałęziach (${waitSec}s).`);
        }
        const yieldApples = 3 + s.orchardLevel * 2;
        s.apples += yieldApples;
        s.lastOrchard = now;
        message = `Zebrano ${yieldApples} soczystych czerwonych jabłek!`;
      }
      break;
    case 'upgrade-orchard':
      if (s.orchardLevel >= 3) return fail('Sad osiągnął maksymalny poziom rozkwitu!');
      if (!pay(COSTS.orchardUpgrade)) return fail('Na rozbudowę sadu potrzeba 12 drewna, 2 nasion i 10 monet.');
      s.orchardLevel++;
      s.apples += 6;
      message = `Sad rozbudowany do poziomu ${s.orchardLevel}! Więcej jabłoni i większe zbiory.`;
      break;
    case 'windmill':
      if (!s.world.meadow) return fail('Najpierw otwórz drogę na Słoneczną Łąkę.');
      if (s.world.windmill) return fail('Wiatrak już pracuje dla farmy.');
      if (!pay({ wood: 14, stone: 8, crystals: 2 })) return fail('Na wiatrak potrzeba 14 drewna, 8 kamieni i 2 kryształów.');
      s.world.windmill = true;
      message = 'Wiatrak gotowy! Skrzydła mielą mąkę, nawadniają grządki i przyspieszają hodowlę króliczków!';
      break;
    case 'mill-flour':
      if (!s.world?.windmill) return fail('Najpierw wybuduj wiatrak na łące.');
      if (!pay({ seeds: 1 })) return fail('Do zmielenia mąki potrzebujesz paczuszki nasion.');
      s.flour = (s.flour || 0) + 2;
      message = 'Skrzydła wiatraka zmieliły ziarna! Otrzymano 2 worki mąki (+2 mąka).';
      break;
    case 'sell-flour':
      if (!pay({ flour: 1 })) return fail('Przynieś worek mąki.');
      s.coins += 4;
      message = 'Sprzedano mąkę · +4 monety';
      break;
    case 'host-guest:bread': {
      if (s.houseLevel < 3) return fail('Rozbuduj dom na 3. poziom (Rezydencja), by przyjmować turystów!');
      if (!hasConnectedWorld(s)) return fail('Połącz farmę z inną krainą, by turyści mogli Cię odwiedzać!');
      if (now - (s.lastTouristIncome || 0) < 12000) {
        const waitSec = Math.ceil((12000 - (now - (s.lastTouristIncome || 0))) / 1000);
        return fail(`Pokoje są sprzątane i wietrzone. Kolejny gość przybędzie za ${waitSec}s.`);
      }
      if (!pay({ flour: 1 })) return fail('Do upieczenia chleba potrzebujesz 1 worka mąki z wiatraka.');
      s.coins += 25;
      s.crystals = (s.crystals || 0) + 1;
      s.hostedGuestsCount = (s.hostedGuestsCount || 0) + 1;
      const guest = TOURIST_GUESTS[(s.guestIndex || 0) % TOURIST_GUESTS.length];
      s.guestReviews = [{ name: guest.name, origin: guest.origin, text: guest.review, stars: 5, date: 'przed chwilą' }, ...(s.guestReviews || []).slice(0, 4)];
      s.guestIndex = ((s.guestIndex || 0) + 1) % TOURIST_GUESTS.length;
      s.lastTouristIncome = now;
      message = `Ugoszczono turystę (${guest.name}) ciepłym chlebem! +25 monet, +1 błękitny kryształ i 5 gwiazdek w księdze gości! ⭐⭐⭐⭐⭐`;
      break;
    }
    case 'host-guest:apples': {
      if (s.houseLevel < 3) return fail('Rozbuduj dom na 3. poziom (Rezydencja), by przyjmować turystów!');
      if (!hasConnectedWorld(s)) return fail('Połącz farmę z inną krainą, by turyści mogli Cię odwiedzać!');
      if (now - (s.lastTouristIncome || 0) < 12000) {
        const waitSec = Math.ceil((12000 - (now - (s.lastTouristIncome || 0))) / 1000);
        return fail(`Pokoje są sprzątane i wietrzone. Kolejny gość przybędzie za ${waitSec}s.`);
      }
      if (!pay({ apples: 2 })) return fail('Potrzebujesz 2 soczystych jabłek ze swojego sadu.');
      s.coins += 20;
      s.seeds = (s.seeds || 0) + 3;
      s.hostedGuestsCount = (s.hostedGuestsCount || 0) + 1;
      const guest = TOURIST_GUESTS[(s.guestIndex || 0) % TOURIST_GUESTS.length];
      s.guestReviews = [{ name: guest.name, origin: guest.origin, text: `„⭐⭐⭐⭐⭐ Cudowny wypoczynek i przepyszne słodkie jabłka!”`, stars: 5, date: 'przed chwilą' }, ...(s.guestReviews || []).slice(0, 4)];
      s.guestIndex = ((s.guestIndex || 0) + 1) % TOURIST_GUESTS.length;
      s.lastTouristIncome = now;
      message = `Ugoszczono turystę (${guest.name}) jabłkami z sadu! +20 monet, +3 nasionka i wspaniała opinia! ⭐⭐⭐⭐⭐`;
      break;
    }
    case 'host-guest:carrots': {
      if (s.houseLevel < 3) return fail('Rozbuduj dom na 3. poziom (Rezydencja), by przyjmować turystów!');
      if (!hasConnectedWorld(s)) return fail('Połącz farmę z inną krainą, by turyści mogli Cię odwiedzać!');
      if (now - (s.lastTouristIncome || 0) < 12000) {
        const waitSec = Math.ceil((12000 - (now - (s.lastTouristIncome || 0))) / 1000);
        return fail(`Pokoje są sprzątane i wietrzone. Kolejny gość przybędzie za ${waitSec}s.`);
      }
      if (!pay({ carrots: 3 })) return fail('Potrzebujesz 3 marchewek z ogrodu.');
      s.coins += 15;
      s.seeds = (s.seeds || 0) + 2;
      s.hostedGuestsCount = (s.hostedGuestsCount || 0) + 1;
      const guest = TOURIST_GUESTS[(s.guestIndex || 0) % TOURIST_GUESTS.length];
      s.guestReviews = [{ name: guest.name, origin: guest.origin, text: `„⭐⭐⭐⭐⭐ Bardzo przytulny pokój i chrupiące marchewki!”`, stars: 5, date: 'przed chwilą' }, ...(s.guestReviews || []).slice(0, 4)];
      s.guestIndex = ((s.guestIndex || 0) + 1) % TOURIST_GUESTS.length;
      s.lastTouristIncome = now;
      message = `Ugoszczono turystę (${guest.name}) marchewkami! +15 monet, +2 nasionka i uśmiech gościa! ⭐⭐⭐⭐⭐`;
      break;
    }
    case 'host-guest:rest': {
      if (s.houseLevel < 3) return fail('Rozbuduj dom na 3. poziom (Rezydencja), by przyjmować turystów!');
      if (!hasConnectedWorld(s)) return fail('Połącz farmę z inną krainą, by turyści mogli Cię odwiedzać!');
      if (now - (s.lastTouristIncome || 0) < 12000) {
        const waitSec = Math.ceil((12000 - (now - (s.lastTouristIncome || 0))) / 1000);
        return fail(`Pokoje są sprzątane i wietrzone. Kolejny gość przybędzie za ${waitSec}s.`);
      }
      s.coins += 10;
      s.hostedGuestsCount = (s.hostedGuestsCount || 0) + 1;
      const guest = TOURIST_GUESTS[(s.guestIndex || 0) % TOURIST_GUESTS.length];
      s.guestReviews = [{ name: guest.name, origin: guest.origin, text: `„⭐⭐⭐⭐ Miły i cichy nocleg na pięknej farmie.”`, stars: 4, date: 'przed chwilą' }, ...(s.guestReviews || []).slice(0, 4)];
      s.guestIndex = ((s.guestIndex || 0) + 1) % TOURIST_GUESTS.length;
      s.lastTouristIncome = now;
      message = `Przyjęto wędrowca (${guest.name}) na nocleg! +10 monet za pokój gościnny! ⭐⭐⭐⭐`;
      break;
    }
    case 'host-tourist': {
      if (s.houseLevel < 3) return fail('Rozbuduj dom na 3. poziom (Rezydencja), by przyjmować turystów na nocleg!');
      if (!hasConnectedWorld(s)) return fail('Połącz farmę z inną krainą, by turyści mogli Cię odwiedzać!');
      if (now - (s.lastTouristIncome || 0) < 12000) {
        const waitSec = Math.ceil((12000 - (now - (s.lastTouristIncome || 0))) / 1000);
        return fail(`Pokoje gościnne są wietrzone po wizycie. Kolejny gość przybędzie za ${waitSec}s.`);
      }
      let treated = false;
      if (s.flour >= 1) { s.flour -= 1; treated = 'świeżym chlebkiem z mąki'; s.crystals = (s.crystals || 0) + 1; s.coins += 25; }
      else if (s.apples >= 2) { s.apples -= 2; treated = 'soczystymi jabłkami z sadu'; s.seeds = (s.seeds || 0) + 3; s.coins += 20; }
      else if (s.carrots >= 3) { s.carrots -= 3; treated = 'chrupiącymi marchewkami'; s.seeds = (s.seeds || 0) + 2; s.coins += 15; }
      else {
        s.coins += 10;
        treated = 'miłym odpoczynkiem i herbatką';
      }
      s.hostedGuestsCount = (s.hostedGuestsCount || 0) + 1;
      const guest = TOURIST_GUESTS[(s.guestIndex || 0) % TOURIST_GUESTS.length];
      s.guestReviews = [{ name: guest.name, origin: guest.origin, text: guest.review, stars: 5, date: 'przed chwilą' }, ...(s.guestReviews || []).slice(0, 4)];
      s.guestIndex = ((s.guestIndex || 0) + 1) % TOURIST_GUESTS.length;
      s.lastTouristIncome = now;
      message = `Ugoszczono turystę (${guest.name}) ${treated}! Otrzymano zapłatę za nocleg i recenzję!`;
      break;
    }
    case 'helper':
      if (s.helper) return fail('Pomocnik Franek już pracuje w Twoim ogrodzie!');
      if (s.houseLevel < 2) return fail('Rozbuduj dom na 2. poziom, aby stworzyć pokój dla pomocnika!');
      if (!hasConnectedWorld(s)) return fail('Połącz najpierw farmę z inną krainą (np. most do Wzgórz lub Łąki), aby zaprosić pomocnika!');
      if (!pay(COSTS.helper)) return fail('Na zatrudnienie pomocnika potrzeba 12 monet, 6 drewna i 4 marchewek.');
      s.helper = true;
      message = 'Pomocnik Franek zamieszkał na piętrze i pomaga w ogrodzie!';
      break;
    case 'stall':
      if (s.stall) return fail('Stragan wędrowców jest już otwarty!');
      if (s.houseLevel < 2) return fail('Rozbuduj dom na 2. poziom, aby prowadzić handel z wędrowcami!');
      if (!hasConnectedWorld(s)) return fail('Połącz farmę z innymi krainami (zbuduj most), by goście mogli tu dotrzeć!');
      if (!pay(COSTS.stall)) return fail('Na wybudowanie straganu potrzeba 8 drewna, 4 kamieni i 6 monet.');
      s.stall = true;
      message = 'Stragan gotowy! Wędrowcy i goście z innych krain już tu zmierzają.';
      break;
    case 'solve-riddle': {
      return fail('Wybierz odpowiedź w oknie zagadki.');
    }
    case 'fulfill:v1': case 'fulfill:v2': case 'fulfill:v3': {
      const vId = action.split(':')[1];
      const visitor = s.visitors.find(v => v.id === vId);
      if (!visitor) return fail('Wędrowiec wyruszył już w dalszą drogę.');
      if (!hasConnectedWorld(s)) return fail('Połącz farmę z innymi krainami, aby goście mogli Cię odwiedzać!');
      if (!pay(visitor.wants)) return fail('Brakuje produktów, o które prosi wędrowiec.');
      const multiplier = s.houseLevel >= 3 ? 1.5 : 1;
      for (const [k, n] of Object.entries(visitor.gives)) {
        const amt = k === 'coins' ? Math.round(n * multiplier) : n;
        s[k] = (s[k] || 0) + amt;
      }
      s.visitors = s.visitors.map(v => v.id === vId ? {
        ...v,
        wants: vId === 'v1' ? { apples: 3 + Math.floor(Math.random() * 3) } : vId === 'v2' ? { carrots: 4 + Math.floor(Math.random() * 4), wood: 2 } : { apples: 3, carrots: 3 },
        gives: { coins: 14 + Math.floor(Math.random() * 10), ...(Math.random() > 0.5 ? { crystals: 1 } : { seeds: 1 }) }
      } : v);
      message = s.houseLevel >= 3 ? `Zamówienie zrealizowane! +50% bonusu za Rezydencję Gościnną.` : `Zamówienie zrealizowane! Otrzymano zapłatę.`;
      break;
    }
    case 'sell-crystal':
      if (!pay({ crystals: 1 })) return fail('Przynieś kryształ ze wzgórz.');
      s.coins += 4;
      message = 'Sprzedano kryształ · +4 monety';
      break;
    case 'sell-apples':
      if (!pay({ apples: 2 })) return fail('Przynieś 2 jabłka z sadu.');
      s.coins += 3;
      message = 'Sprzedano 2 jabłka · +3 monety';
      break;
    case 'forest':
      s.wood += 2;
      message = '+2 drewna do plecaka';
      break;
    case 'mine':
      s.stone += 2;
      message = '+2 kamienia do plecaka';
      break;
    case 'house': {
      if (s.houseLevel >= 3) return fail('Twój dom ma już wszystkie piętra i pokoje gościnne!');
      const cost = houseCost(s.houseLevel);
      if (!pay(cost)) return fail('Zbierz jeszcze materiały pokazane przy budowie domu.');
      s.houseLevel++;
      if (s.houseLevel === 1) message = 'To Twój pierwszy dom! Odblokowano zagrodę królików.';
      else if (s.houseLevel === 2) message = 'Dom rozbudowany o piętro! Możesz teraz zatrudnić pomocnika i postawić stragan.';
      else message = 'Wielka Rezydencja Gościnna gotowa! Turyści płacą czynsz za pobyt (+8 monet co minutę)!';
      break;
    }
    case 'pen':
      if (!s.houseLevel) return fail('Najpierw zbuduj swój dom.');
      if (!s.pen) {
        if (!pay(COSTS.pen)) return fail('Na zagrodę potrzeba 5 drewna i 2 kamieni.');
        s.pen = true;
        s.rabbits = true;
        message = 'Bezuch i Karmelka zamieszkali na farmie!';
      } else if (s.penLevel < 3) {
        if (!pay(COSTS.penUpgrade)) return fail('Rozbudowa zagrody wymaga 10 drewna, 6 kamieni i 4 marchewek.');
        s.penLevel++;
        message = `Zagroda powiększona do poziomu ${s.penLevel}! Zmieści teraz aż ${maxBabies(s)} króliczków.`;
      } else {
        return fail('Zagroda ma już maksymalny poziom.');
      }
      break;
    case 'feed': {
      if (!s.pen || !s.rabbits) return fail('Najpierw przygotuj zagrodę dla królików.');
      if (s.nextBirthAt) return fail('Królicza rodzinka już czeka na maluszka.');
      if (s.babies >= maxBabies(s)) return fail('Zagroda jest pełna. Rozbuduj zagrodę lub znajdź maluszkom dom.');
      if (!pay({ carrots: 2 })) return fail('Przynieś 2 marchewki z ogródka lub sklepu.');
      const breedDuration = s.world?.windmill ? 20_000 : BREED_TIME;
      s.nextBirthAt = now + breedDuration;
      message = s.world?.windmill
        ? 'Króliki nakarmione i posilone otrębami z wiatraka! Maluszek pojawi się za 20 sekund.'
        : 'Króliki nakarmione. Maluszek pojawi się za 45 sekund.';
      break;
    }
    case 'tick': {
      let updated = false;
      if (s.nextBirthAt && now >= s.nextBirthAt) {
        s.nextBirthAt = null;
        if (s.babies < maxBabies(s)) {
          s.babies++;
          message = 'W zagrodzie pojawił się mały króliczek!';
          updated = true;
        }
      }
      // Helper auto-tending garden
      if (s.helper && !s.planted && s.seeds > 0 && Math.random() < 0.25) {
        s.seeds--;
        s.planted = true;
        s.watered = true;
        updated = true;
      } else if (s.helper && s.planted && !s.watered) {
        s.watered = true;
        updated = true;
      }
      // Windmill automated watering pump
      if (s.world?.windmill && s.planted && !s.watered) {
        s.watered = true;
        updated = true;
      }
      if (!updated && !message) return { state, ok: false };
      break;
    }
    case 'garden':
      if (!s.planted) {
        if (!pay({ seeds: 1 })) return fail('Kup nasionka w sklepiku za 2 monety.');
        s.planted = true;
        message = 'Posiane! Podejdź i podlej grządkę.';
      } else if (!s.watered) {
        s.watered = true;
        message = 'Marchewki podlane i gotowe do zebrania!';
      } else {
        const y = harvestYield(s);
        s.carrots += y;
        s.planted = false;
        s.watered = false;
        message = `Zebrano ${y} marchewek!`;
      }
      break;
    case 'land':
      if (s.landLevel >= 3) return fail('Cała polana należy już do Ciebie.');
      if (!pay({ wood: 8 + s.landLevel * 4, stone: 4 + s.landLevel * 2, coins: 5 })) return fail('Dołączanie polany wymaga materiałów i 5 monet.');
      s.landLevel++;
      message = 'Nowa polana i dodatkowa grządka są Twoje!';
      break;
    case 'buy-seeds':
      if (!pay({ coins: 2 })) return fail('Brakuje monet. Możesz sprzedać drewno lub kamień.');
      s.seeds++;
      message = 'Kupiono nasionka · −2 monety';
      break;
    case 'buy-carrots':
      if (!pay({ coins: 3 })) return fail('Potrzebujesz 3 monet.');
      s.carrots += 2;
      message = 'Kupiono 2 marchewki · −3 monety';
      break;
    case 'sell-wood':
      if (!pay({ wood: 2 })) return fail('Przynieś 2 drewna.');
      s.coins += 2;
      message = 'Sprzedano drewno · +2 monety';
      break;
    case 'sell-stone':
      if (!pay({ stone: 2 })) return fail('Przynieś 2 kamienie.');
      s.coins += 2;
      message = 'Sprzedano kamień · +2 monety';
      break;
    case 'sell-baby':
      if (!pay({ babies: 1 })) return fail('Nie masz jeszcze małego króliczka.');
      s.coins += 5;
      message = 'Maluszek ma nowy dom · +5 monet';
      break;
    default:
      return fail('Nieznana akcja.');
  }
  return { state: s, message, ok: true };
}

export const harvestYield = s => 3 + s.landLevel + (s.world?.orchard ? 2 : 0) + (s.world?.windmill ? 2 : 0) + (s.helper ? 2 : 0);

export const PLACES = {
  ...WORLD_PLACES,
  house: { title: 'Twój dom', short: 'Dom', x: -3, z: -2, approach: [-3, 1.5], label: [-3, 4.8, -2] },
  forest: { title: 'Leśna ścieżka', short: 'Las', x: -9, z: -4, approach: [-7, -1.3], label: [-8.7, 4, -4] },
  mine: { title: 'Kryształowe skały', short: 'Kopalnia', x: 6.8, z: -5.5, approach: [5.5, -3.3], label: [6.6, 3.6, -5.5] },
  garden: { title: 'Marchewkowy ogród', short: 'Ogród', x: -4.8, z: 5, approach: [-2.8, 5.5], label: [-5, 1.2, 5] },
  helper: { title: 'Pomocnik Franek', short: 'Pomocnik', x: -3.8, z: 6.8, approach: [-3.5, 6.2], label: [-3.8, 1.9, 6.8] },
  pen: { title: 'Bezuch i Karmelka', short: 'Króliki', x: 5.3, z: 2.3, approach: [3, 4.8], label: [5.3, 2.8, 2.3] },
  stall: { title: 'Stragan wędrowców', short: 'Stragan', x: -1.2, z: 8.5, approach: [-1.2, 7.2], label: [-1.2, 2.6, 8.5] },
  owl: { title: 'Mądra Sowa Klara', short: 'Sowa', x: 1.6, z: -5.0, approach: [1.6, -3.8], label: [1.6, 3.2, -5.0] },
  shop: { title: 'Sklepik pod klamerką', short: 'Sklepik', x: -9, z: 3.8, approach: [-7, 2.6], label: [-9, 3.5, 3.8] },
  land: { title: 'Nowa polana', short: 'Rozbudowa', x: 11, z: 5, approach: [9, 5.8], label: [10.8, 1.6, 5] },
};

export function actionFor(place, s) {
  switch (place) {
    case 'quarryGate': case 'meadowGate': case 'lakeGate': case 'cloudsGate': {
      const id = place === 'quarryGate' ? 'quarry' : place === 'meadowGate' ? 'meadow' : place === 'lakeGate' ? 'lake' : 'clouds';
      const r = REGIONS[id];
      return s.world?.[id]
        ? { label: 'Wyrusz na wyprawę', hint: r.name, action: `travel:${r.destination}`, icon: r.icon }
        : { label: 'Napraw most / ścieżkę', hint: `Połącz farmę z: ${r.name}`, cost: r.cost, action: `unlock:${id}`, disabled: !s.houseLevel, icon: 'land' };
    }
    case 'lakeDock':
      return { label: 'Złów złote rybki', hint: 'Złów 2 lśniące rybki na obiad dla turystów lub na sprzedaż.', action: 'fish', icon: 'coins' };
    case 'lakePearls':
      return { label: 'Zanurkuj po perłę', hint: 'Wyłów lśniącą błękitną perłę z dna jeziora.', action: 'pearls', icon: 'crystal' };
    case 'observatory':
      return { label: 'Spójrz w gwiazdy', hint: 'Odkryj tajemnice nieba przez kryształowy teleskop.', action: 'stargaze', icon: 'star' };
    case 'grove':
      return { label: 'Zbierz drewno', hint: '5 drewna ze starych dębów.', action: 'grove', icon: 'wood' };
    case 'crystals':
      return { label: 'Wydobądź kryształ', hint: '3 kamienie i 1 błękitny kryształ.', action: 'crystals', icon: 'crystal' };
    case 'chest':
      return { label: s.world?.chest ? 'Skarb odnaleziony' : 'Otwórz skrzynkę', hint: '10 monet i 3 paczuszki nasion.', action: 'chest', disabled: s.world?.chest, icon: 'coins' };
    case 'orchard':
      return s.orchardLevel > 0
        ? { label: 'Zbierz jabłka', hint: `Sad poziomu ${s.orchardLevel} · soczyste czerwone owoce.`, action: 'orchard', icon: 'apple' }
        : { label: 'Zasadź sad jabłoni', hint: 'Soczyste jabłka i bonus do wszystkich zbiorów.', cost: COSTS.orchard, action: 'orchard', disabled: !s.world?.meadow, icon: 'apple' };
    case 'windmill':
      return s.world?.windmill
        ? { label: 'Zmiel mąkę', hint: `Młyn zbożowy · zmiel 1 nasionko na 2 worki mąki (masz: ${s.flour || 0} mąki).`, cost: { seeds: 1 }, action: 'mill-flour', icon: 'flour' }
        : { label: 'Zbuduj wiatrak', hint: 'Mielenie mąki, automatyczne nawadnianie grządek i 2x szybsza hodowla królików.', cost: { wood: 14, stone: 8, crystals: 2 }, action: 'windmill', disabled: !s.world?.meadow, icon: 'windmill' };
    case 'forest':
      return { label: 'Zbierz drewno', hint: 'Dwa kawałki drewna do plecaka.', action: 'forest', icon: 'wood' };
    case 'mine':
      return { label: 'Wydobądź kamień', hint: 'Wydobądź 2 kamienie.', action: 'mine', icon: 'stone' };
    case 'house': {
      const hLvl = s.houseLevel || 0;
      const hCost = houseCost(hLvl);
      if (hLvl >= 3) {
        const connected = hasConnectedWorld(s);
        return {
          label: 'Pokoje gościnne · Turyści',
          hint: !connected
            ? 'Połącz farmę z inną krainą, by przybyli turyści szukający noclegu.'
            : 'Otwórz pokoje gościnne, porozmawiaj z turystą i przygotuj poczęstunek!',
          action: 'house-modal',
          disabled: false,
          icon: 'house'
        };
      }
      const hint = hLvl === 0 ? 'Budowa chatki odblokuje zagrodę dla zwierząt.' : hLvl === 1 ? 'Poziom 2 (Piętro): Pokoje pomocnika i otwarcie straganu.' : 'Poziom 3 (Rezydencja): Pokoje gościnne i noclegi dla turystów!';
      const label = hLvl === 0 ? 'Zbuduj chatkę' : hLvl === 1 ? 'Rozbuduj o piętro' : 'Stwórz Rezydencję';
      return { label, hint, cost: hCost, action: 'house', icon: 'house' };
    }
    case 'pen':
      return s.pen
        ? (s.penLevel < 3 && s.babies >= maxBabies(s)
          ? { label: 'Powiększ zagrodę', hint: `Zagroda pełna (${s.babies}/${maxBabies(s)}). Rozbuduj na poziom ${s.penLevel + 1}.`, cost: COSTS.penUpgrade, action: 'pen', icon: 'rabbit' }
          : { label: 'Nakarm króliczki', hint: s.nextBirthAt ? 'Maluszek w drodze!' : `${s.babies}/${maxBabies(s)} maluszków · nakarm, by powiększyć rodzinkę.`, cost: { carrots: 2 }, action: 'feed', disabled: !s.nextBirthAt && s.babies >= maxBabies(s), icon: 'rabbit' })
        : { label: 'Zbuduj zagrodę', hint: 'Przytulny dom dla Bezucha i Karmelki.', cost: COSTS.pen, action: 'pen', disabled: !s.houseLevel, icon: 'rabbit' };
    case 'garden':
      return { label: !s.planted ? 'Posiej marchewki' : !s.watered ? 'Podlej ogród' : 'Zbierz marchewki', hint: 'Słodkie marchewki dla króliczków i na handel.', cost: !s.planted ? { seeds: 1 } : null, action: 'garden', icon: 'carrot' };
    case 'helper': {
      const connected = hasConnectedWorld(s);
      const hLvlOk = s.houseLevel >= 2;
      return s.helper
        ? { label: 'Pomocnik Franek', hint: 'Franek automatycznie sieje i podlewa grządki!', action: 'helper-status', icon: 'helper' }
        : {
            label: 'Zatrudnij pomocnika',
            hint: !hLvlOk
              ? 'Wymaga domu na poziomie 2 (pokój na piętrze).'
              : !connected
              ? 'Połącz farmę z innymi krainami (napraw most do Wzgórz lub Łąki), by zaprosić pomocnika.'
              : 'Franek pomoże w podlewaniu i zwiększy plony.',
            cost: COSTS.helper,
            action: 'helper',
            disabled: !hLvlOk || !connected,
            icon: 'helper'
          };
    }
    case 'stall': {
      const connected = hasConnectedWorld(s);
      const hLvlOk = s.houseLevel >= 2;
      return s.stall
        ? { label: 'Kram wędrowców', hint: connected ? 'Odwiedzający z innych krain kupują Twoje plony!' : 'Połącz farmę z krainami, aby przybyli wędrowcy.', action: 'stall-modal', icon: 'stall' }
        : {
            label: 'Wybuduj stragan',
            hint: !hLvlOk
              ? 'Wymaga domu na poziomie 2.'
              : !connected
              ? 'Połącz farmę z inną krainą (napraw most), by wędrowcy mogli dotrzeć do straganu.'
              : 'Sprzedawaj jabłka, marchewki i kryształy gościom.',
            cost: COSTS.stall,
            action: 'stall',
            disabled: !hLvlOk || !connected,
            icon: 'stall'
          };
    }
    case 'owl':
      return { label: 'Zagadka Mądrej Sowy', hint: 'Rozwiąż zagadkę i zdobądź niespodziankę!', action: 'owl-modal', icon: 'owl' };
    case 'shop':
      return { label: 'Otwórz sklepik', hint: 'Nasionka, wymiana i nowe domy dla maluszków.', action: 'shop', icon: 'shop' };
    case 'land':
      return { label: 'Powiększ polanę', hint: 'Nowa ziemia i dodatkowa grządka.', cost: { wood: 8 + s.landLevel * 4, stone: 4 + s.landLevel * 2, coins: 5 }, action: 'land', disabled: s.landLevel >= 3, icon: 'land' };
    default:
      return null;
  }
}
