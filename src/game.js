import { NEW_WORLD, REGIONS, WORLD_PLACES, normalizeWorld, unlocked } from './world/regions.js';

export const SAVE_KEY = 'eklamerka-world-v1';
export const SAVE_VERSION = '0.4.0';

export const BREED_TIME_FIRST = 45_000;
export const BREED_TIME_SUBSEQUENT = 90_000;

export const DEFAULT_VISITORS = [
  { id: 'v1', name: 'Leśny Wędrowiec', desc: 'Szuka drewna i zapasów na drogę przez las.', wants: { wood: 4 }, gives: { coins: 5 }, icon: 'wood' },
  { id: 'v2', name: 'Kupiec ze Wzgórz', desc: 'Potrzebuje kamieni i kryształu do kopalni.', wants: { stone: 4, crystals: 1 }, gives: { coins: 10 }, icon: 'crystal' },
  { id: 'v3', name: 'Podróżniczka z Łąki', desc: 'Chętnie kupi soczyste jabłka ze słonecznego sadu.', wants: { apples: 3 }, gives: { coins: 8 }, icon: 'apple' },
  { id: 'v4', name: 'Sąsiadka Ogrodniczka', desc: 'Poszukuje świeżych, chrupiących marchewek.', wants: { carrots: 4 }, gives: { coins: 5 }, icon: 'carrot' }
];

export const OWL_RIDDLES = [
  {
    id: 1,
    category: 'animals',
    question: 'Mam długie puszyste uszy, uwielbiam chrupać marchewki i wesoło kicam po polanie. Kim jestem?',
    options: ['Królik', 'Wilk', 'Wiewiórka'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'Zwróć uwagę na długie uszy i zamiłowanie do marchewek.',
    fact: 'Brawo! Króliki słyszą dźwięki z ogromnych odległości i potrafią skakać na wysokość metra!'
  },
  {
    id: 2,
    category: 'plants',
    question: 'Wisi na gałęzi w sadzie. Jest okrągłe, soczyste, czerwone i pyszne na deser. Co to?',
    options: ['Szyszka', 'Jabłko', 'Kamyk'],
    answer: 1,
    reward: { coins: 2 },
    hint: 'To owoc rosnący na jabłoni.',
    fact: 'Świetnie! Jabłka mają mnóstwo witamin, a na świecie istnieje ponad 7500 ich odmian!'
  },
  {
    id: 3,
    category: 'plants',
    question: 'Co jest najbardziej potrzebne ziarenku w ziemi, żeby wyrosła z niego soczysta roślinka?',
    options: ['Słońce i woda', 'Mróz i ciemność', 'Cukierki'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'Rośliny potrzebują światła do fotosyntezy oraz nawodnienia.',
    fact: 'Mądra odpowiedź! Rośliny piją wodę z ziemi i łapią ciepłe promyki słońca, by rosnąć!'
  },
  {
    id: 4,
    category: 'rocks',
    question: 'Błyszczy na wysokich wzgórzach, ma piękny błękitny kolor jak bezchmurne niebo. Co to za skarb?',
    options: ['Kryształ', 'Węgiel', 'Kawałek lodu'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'To twardy, błyszczący minerał o niebieskiej barwie.',
    fact: 'Znakomicie! Naturalne kryształy rosną w skałach przez setki tysięcy lat!'
  },
  {
    id: 5,
    category: 'nature',
    question: 'Obracam ogromnymi skrzydłami na wietrze i pomagam mleć ziarna zbóż na mąkę. Co to za budowla?',
    options: ['Płot', 'Wiatrak', 'Most'],
    answer: 1,
    reward: { coins: 2 },
    hint: 'Wykorzystuje siłę wiatru do obracania żaren.',
    fact: 'Wspaniale! Wiatrak wykorzystuje czystą, ekologiczną siłę wiatru do pracy na farmie!'
  },
  {
    id: 6,
    category: 'forest',
    question: 'Mieszkam w starym dębie, mam wielkie mądre oczy i wiem wszystko o świecie przyrody. Kto to?',
    options: ['Niedźwiedź', 'Mądra Sowa Klara', 'Ropucha'],
    answer: 1,
    reward: { coins: 2 },
    hint: 'To nocny ptak o wielkich oczach, Twoja skrzydlata przewodniczka.',
    fact: 'Huhu! To właśnie ja – Mądra Sowa Klara, Twoja skrzydlata przyjaciółka z polany!'
  },
  {
    id: 7,
    category: 'insects',
    question: 'Pracuję niestrudzenie na łące, zbieram słodki nektar z kwiatów i robię z niego złocisty miód. Kto to?',
    options: ['Pszczoła miodna', 'Biedronka', 'Ślimak'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'Mieszka w ulu i głośno bzyczy.',
    fact: 'Świetnie! Jedna pszczoła w ciągu życia produkuje zaledwie jedną łyżeczkę miodu – każda kropelka jest skarbem!'
  },
  {
    id: 8,
    category: 'animals',
    question: 'Mam rude puszyste futerko, wspaniały ogon i zręcznie skaczę po gałęziach chwytając żołędzie i orzechy.',
    options: ['Wiewiórka', 'Dziki dzik', 'Kret'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'Mieszka w dziuplach i chowa zapasy na zimę.',
    fact: 'Znakomicie! Wiewiórki sadzą miliony nowych drzew każdego roku, zapominając, gdzie zakopały orzeszki!'
  },
  {
    id: 9,
    category: 'nature',
    question: 'W nocy świeci na niebie srebrzystym blaskiem i czasami wygląda jak okrągły talerz, a czasami jak rogalik. Co to?',
    options: ['Księżyc', 'Lampa naftowa', 'Chmura'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'Naturalny satelita naszej Ziemi, widoczny w bezchmurną noc.',
    fact: 'Prawda! Fazy Księżyca zależą od tego, jak oświetla go Słońce podczas jego wędrówki dookoła Ziemi!'
  },
  {
    id: 10,
    category: 'insects',
    question: 'Mam czerwone skrzydełka w czarne kropki i pomagam ogrodnikom, zjadając małe mszyce z liści. Kim jestem?',
    options: ['Biedronka', 'Osa', 'Mucha'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'To uroczy mały chrząszczyk o czerwonych skrzydełkach.',
    fact: 'Doskonale! Biedronka siedmiokropka to największy sprzymierzeniec ekologicznego ogrodu!'
  },
  {
    id: 11,
    category: 'water',
    question: 'Pływam w stawie, mam zielone ubarwienie, głośno kumkam i robię wielkie skoki prosto na liść nenufaru.',
    options: ['Żaba', 'Wydra', 'Rybka'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'Jej dzieci to kijanki pływające w wodzie.',
    fact: 'Brawo! Żaby piją wodę całą powierzchnią swojej skóry, zamiast pić ją pyszczkiem!'
  },
  {
    id: 12,
    category: 'forest',
    question: 'Mam tysiące małych igiełek na grzbiecie, w razie niebezpieczeństwa zwijam się w kłującą kulkę. Kto to?',
    options: ['Jeż', 'Szop pracz', 'Królik'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'Tupie cicho nocą w liściach pod krzewami.',
    fact: 'Bardzo dobrze! Dorosły jeż ma na grzbiecie nawet do 7000 igieł, które chronią go przed drapieżnikami!'
  },
  {
    id: 13,
    category: 'plants',
    question: 'Złote pole szumi na letnim wietrze. Z moich ziaren po zmieleniu w młynie powstaje biała mąka na chleb. Co to?',
    options: ['Pszenica', 'Trawa z trawnika', 'Mchy'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'To najważniejsze zboże chlebowe.',
    fact: 'Wspaniale! Pszenica jest uprawiana przez ludzi od ponad 10 tysięcy lat!'
  },
  {
    id: 14,
    category: 'nature',
    question: 'Pojawiam się na niebie po deszczu, kiedy nagle zaświeci słońce. Mam siedem pięknych kolorowych wstęg. Co to?',
    options: ['Tęcza', 'Zorza polarna', 'Latawiec'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'Powstaje, gdy światło słoneczne załamuje się w kropelkach deszczu.',
    fact: 'Cudownie! Każda tęcza jest w rzeczywistości pełnym okręgiem, ale z ziemi widzimy tylko jej górny łuk!'
  },
  {
    id: 15,
    category: 'insects',
    question: 'Gdy zapada letni zmrok, migoczę w trawie zielonkawym, chłodnym światełkiem niczym mała gwiazdka. Kim jestem?',
    options: ['Świetlik', 'Komar', 'Pająk'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'To chrząszcz potrafiący świecić w ciemności.',
    fact: 'Niesamowite! Światło świetlika powstaje bez wytwarzania ciepła – to jedno z najbardziej wydajnych źródeł światła w przyrodzie!'
  },
  {
    id: 16,
    category: 'forest',
    question: 'Stukam dziobem w pnie starych drzew jak leśny lekarz, wyszukując owady ukryte pod korą. Jaki to ptak?',
    options: ['Dzięcioł', 'Wróbel', 'Jaskółka'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'Ma charakterystyczny czerwony pióropusz na główce.',
    fact: 'Świetna wiedza! Głowa dzięcioła ma specjalną amortyzację chroniącą jego mózg przed wstrząsami przy stukaniu!'
  },
  {
    id: 17,
    category: 'plants',
    question: 'Obracam swój wielki żółty kwiat za wędrującym po niebie słońcem, a moje czarne nasiona uwielbiają sikorki.',
    options: ['Słonecznik', 'Tulipan', 'Kaktus'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'Jego nazwa pochodzi wprost od słońca.',
    fact: 'Znakomicie! Młode słoneczniki wykonują ruch zwany heliotropizmem – codziennie śledzą bieg słońca ze wschodu na zachód!'
  },
  {
    id: 18,
    category: 'animals',
    question: 'Buduję tamy na leśnych potokach ze ścinanych gałęzi i mam szeroki, spłaszczony ogon niczym wiosło. Kto to?',
    options: ['Bóbr', 'Wydra', 'Borsuk'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'Ma pomarańczowe zęby, którymi z łatwością ścina drzewa.',
    fact: 'Fantastycznie! Zęby bobra zawierają żelazo, dzięki czemu są niezwykle twarde i mają charakterystyczny pomarańczowy kolor!'
  },
  {
    id: 19,
    category: 'nature',
    question: 'Błyszczące, chłodne kropelki wody, które rankiem osiadają na liściach i trawie, zanim słońce je ogrzeje. Co to?',
    options: ['Rosa', 'Grad', 'Śnieg'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'Powstaje w nocy, gdy wilgotne powietrze ochładza się przy ziemi.',
    fact: 'Prawda! Rosa jest kluczowym źródłem wody dla wielu drobnych owadów i mchów w upalne letnie dni!'
  },
  {
    id: 20,
    category: 'forest',
    question: 'Nazywają mnie królem lasu. Mam rozłożystą koronę z pofałdowanymi liśćmi i rodzę jesienne żołędzie. Jakie to drzewo?',
    options: ['Dąb', 'Brzoza', 'Sosna'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'Może żyć ponad tysiąc lat i ma bardzo twarde drewno.',
    fact: 'Wspaniale! Stary dąb może dać schronienie i pożywienie ponad 500 różnym gatunkom owadów, ptaków i porostów!'
  },
  {
    id: 21,
    category: 'insects',
    question: 'Zaczynam życie jako mała gąsienica, potem zasypiam w kokonie, by obudzić się z bajecznie kolorowymi skrzydłami. Co to?',
    options: ['Motyl', 'Konik polny', 'Żuk'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'Lata z kwiatka na kwiatek w słoneczne dni.',
    fact: 'Brawo! Skrzydła motyla pokryte są tysiącami mikroskopijnych łusek, które odbijają światło niczym małe pryzmaty!'
  },
  {
    id: 22,
    category: 'animals',
    question: 'Mam rude futro, biały pędzelek na ogonie i słynę w bajkach z niezwykłego sprytu. Kto to?',
    options: ['Lis', 'Zając', 'Dzika świnia'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'Mieszka w norach i ma doskonały węch.',
    fact: 'Mądrze! Lisy potrafią słyszeć pisk myszy ukrytej pod metrową warstwą śniegu!'
  },
  {
    id: 23,
    category: 'water',
    question: 'Mam wielkie białe lub różowe płatki, unoszę się na powierzchni jeziora, a moje korzenie sięgają mułu na dnie. Co to?',
    options: ['Grzybienie białe (Lilia wodna)', 'Kaktus', 'Sosna'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'Często siadają na niej małe zielone żabki.',
    fact: 'Świetnie! Liście lilii wodnej mają specjalne woskowate pokrycie, dzięki któremu woda spływa z nich jak perły i nie toną!'
  },
  {
    id: 24,
    category: 'nature',
    question: 'Spadam z nieba zimą w postaci białych, misternych kryształków. Każdy z nich ma sześć ramion i niepowtarzalny wzór. Co to?',
    options: ['Płatek śniegu', 'Kamyk', 'Liść dębu'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'Topnieje na dłoni zamieniając się w kroplę wody.',
    fact: 'Znakomicie! W całej historii Ziemi prawdopodobnie nie było dwóch dokładnie identycznych płatków śniegu!'
  },
  {
    id: 25,
    category: 'animals',
    question: 'Daję pyszne białe mleko, lubię spokojnie paść się na łące pełnej soczystej koniczyny i robię „muuuu”. Kto to?',
    options: ['Krowa', 'Koń', 'Owca'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'Z jej mleka robimy maślankę, sery i masło.',
    fact: 'Bardzo dobrze! Krowy mają swoich najlepszych przyjaciół w stadzie i stają się spokojniejsze, gdy są blisko siebie!'
  },
  {
    id: 26,
    category: 'forest',
    question: 'Rośnie w wilgotnym mchu pod drzewami, ma brązowy kapelusz na grubym trzonie i pięknie pachnie w zupie. Co to?',
    options: ['Borowik (Prawdziwek)', 'Muchomor czerwony', 'Szyszka'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'Król leśnych grzybów jadalnych.',
    fact: 'Wspaniale! Grzybnia borowika żyje w ścisłej przyjaźni z korzeniami drzew leśnych, pomagając im pobierać składniki mineralne!'
  },
  {
    id: 27,
    category: 'nature',
    question: 'Nocne niebo przecina jasna smuga światła. Ludzie mówią, że gdy ją zobaczysz, warto pomyśleć życzenie. Co to?',
    options: ['Spadająca gwiazda (Meteor)', 'Samolot', 'Księżyc'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'To drobina kosmicznego pyłu wpadająca w atmosferę.',
    fact: 'Magiczna wiedza! Prędkość meteoru wpadającego w ziemską atmosferę może wynosić ponad 200 tysięcy kilometrów na godzinę!'
  },
  {
    id: 28,
    category: 'insects',
    question: 'Budujemy wielkie podziemne mrowiska z igieł sosnowych. Choć jestem malutka, potrafię unieść ciężar 20 razy większy od siebie.',
    options: ['Mrówka', 'Żuk gnojowy', 'Pchła'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'Żyje w zorganizowanym państwie z królową.',
    fact: 'Niezwykłe! Mrówki są jednymi z najsilniejszych istot na Ziemi w stosunku do swojej masy ciała!'
  },
  {
    id: 29,
    category: 'animals',
    question: 'Mam długi czerwony dziób i czerwone nogi. Przylatuję na wiosnę z ciepłych krajów i buduję gniazdo na dachach.',
    options: ['Bocian biały', 'Wrona', 'Gołąb'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'Głośno klekocze i zwiastuje nadejście wiosny.',
    fact: 'Brawo! Bociany potrafią pokonać ponad 10 tysięcy kilometrów podczas jesiennej wędrówki do ciepłej Afryki!'
  },
  {
    id: 30,
    category: 'animals',
    question: 'Jestem jedynym ssakiem, który naprawdę potrafi latać. Dzień przesypiam zawieszony głową w dół w jaskini, a nocą poluję na komary.',
    options: ['Nietoperz', 'Wiewiórka latająca', 'Sowa'],
    answer: 0,
    reward: { coins: 2 },
    hint: 'Orientuje się w ciemności za pomocą echolokacji.',
    fact: 'Wspaniale! Jeden mały nietoperz potrafi zjeść nawet 1000 dokuczliwych komarów w ciągu zaledwie jednej godziny!'
  }
];

export const TOURIST_GUESTS = [
  {
    id: 't1',
    name: 'Mikołaj Podróżnik',
    origin: 'Kryształowe Wzgórza',
    avatar: 'hat',
    greeting: '„Witajcie! Po całym dniu wspinaczki przez most marzę o ciepłym posiłku i miękkim łóżku. Wasz dom słynie w całej dolinie!”',
    favorite: 'bread',
    wantsHint: 'Najbardziej ucieszy się z ciepłego pieczywa z mąki.',
    review: '„Spokojnie odpocząłem po trudach wspinaczki. Zapach chleba był wspaniały!”'
  },
  {
    id: 't2',
    name: 'Łucja Zielarka',
    origin: 'Słoneczna Łąka',
    avatar: 'ribbon',
    greeting: '„Dzień dobry! Zbieram rzadkie zioła. Wasz sad pachnie tak cudownie! Czy znajdzie się dla mnie wolny pokój z widokiem na jabłonie?”',
    favorite: 'apples',
    wantsHint: 'Uwielbia soczyste czerwone jabłka z sadu.',
    review: '„Przepyszne jabłka i bardzo przytulny pokój!”'
  },
  {
    id: 't3',
    name: 'Kacper Wędrowny Bard',
    origin: 'Szumiący Las',
    avatar: 'cap',
    greeting: '„Witajcie przyjaciele! Piszę pieśń o wiatraku i pracowitych króliczkach. Czy mogę przenieść się w Wasze gościnne progi na odpoczynek?”',
    favorite: 'carrots',
    wantsHint: 'Chętnie schrupie świeże słodkie marchewki z ogrodu.',
    review: '„Cisza, spokój i wspaniała gościnność. Skomponowałem tu nową balladę o farmie!”'
  },
  {
    id: 't4',
    name: 'Zuzia Odkrywczyni',
    origin: 'Gwiezdna Polana',
    avatar: 'crown',
    greeting: '„Cześć! Wracałam z obserwatorium gwiazd. Wasz dom to najprzytulniejsza przystań na całej mapie!”',
    favorite: 'bread',
    wantsHint: 'Chętnie skosztuje ciepłego chleba z mąki lub soczystych owoców.',
    review: '„Przytulne łóżko i serdeczni gospodarze. Na pewno wrócę z kolejnej wyprawy!”'
  },
  {
    id: 't5',
    name: 'Melisa Aromaterapeutka',
    origin: 'Lawendowa Dolina',
    avatar: 'flower',
    greeting: '„Witajcie! Przybywam z Lawendowej Doliny z bukietem suszonych ziół. Szukam oazy spokoju i pachnącej herbatki!”',
    favorite: 'lavenderTea',
    wantsHint: 'Najbardziej ucieszy się z uspokajającej herbatki lawendowej.',
    review: '„Cudowny relaks, gościnność i wspaniała domowa herbatka z miodem!”'
  }
];

export const FISH_SPECIES = [
  {
    id: 'gold',
    name: 'Złota Rybka Słoneczna',
    rarity: 'Pospolita',
    rarityColor: '#438450',
    minLen: 14,
    maxLen: 24,
    coins: 6,
    icon: '🐟',
    desc: 'Lśni w wodzie niczym złota moneta. Łatwa do złowienia i bardzo przyjazna.'
  },
  {
    id: 'carp',
    name: 'Błękitny Karpik Jeziorny',
    rarity: 'Pospolita',
    rarityColor: '#2b78b8',
    minLen: 22,
    maxLen: 38,
    coins: 9,
    icon: '🐠',
    desc: 'Pływa przy dnie Lazurowego Jeziora. Ma piękne, szafirowe łuski.'
  },
  {
    id: 'trout',
    name: 'Tęczowy Pstrąg Perłowy',
    rarity: 'Rzadka',
    rarityColor: '#9b42b8',
    minLen: 32,
    maxLen: 52,
    coins: 16,
    icon: '🐡',
    desc: 'Skacze ponad falami o zachodzie słońca. Prawdziwa ozdoba każdego akwarium!'
  },
  {
    id: 'pike',
    name: 'Gwiezdny Szczupak Zmierzchu',
    rarity: 'Legendarna',
    rarityColor: '#e0840b',
    minLen: 55,
    maxLen: 88,
    coins: 30,
    icon: '✨',
    desc: 'Rzadki drapieżnik głębin, którego łuski świecą w ciemności niczym gwiazdy.'
  }
];

export const COOKING_RECIPES = [
  {
    id: 'bread',
    name: 'Chrupiący Chlebek Wiejski',
    desc: 'Ciepły bochenek prosto z pieca. Daje siłę do szybkiego biegania!',
    icon: '🍞',
    cost: { flour: 1 },
    effect: 'speed',
    effectDesc: '+40% prędkości chodu (45s)',
    sellPrice: 12,
    buffDuration: 45000
  },
  {
    id: 'applePie',
    name: 'Słoneczna Szarlotka',
    desc: 'Pachnący cynamonem i jabłkami placek ze słonecznego sadu.',
    icon: '🥧',
    cost: { apples: 2, flour: 1 },
    effect: 'coins',
    effectDesc: 'Ulubiony deser podróżników (sprzedaż: +22 monety)',
    sellPrice: 22,
    buffDuration: 60000
  },
  {
    id: 'carrotSoup',
    name: 'Kremowa Zupka Marchewkowa',
    desc: 'Aromatyczna, gęsta zupa z najświeższych marchewek z ogrodu.',
    icon: '🍲',
    cost: { carrots: 3 },
    effect: 'speed',
    effectDesc: '+40% prędkości chodu (60s)',
    sellPrice: 14,
    buffDuration: 60000
  },
  {
    id: 'grilledFish',
    name: 'Pieczona Rybka z Ziołami',
    desc: 'Świeżo złowiona rybka opieczona na pachnącym drewnie.',
    icon: '🐟',
    cost: { fish: 1, wood: 1 },
    effect: 'coins',
    effectDesc: 'Przysmak w kramie (sprzedaż: +25 monet)',
    sellPrice: 25,
    buffDuration: 75000
  },
  {
    id: 'starCookies',
    name: 'Gwiezdne Ciasteczka Miodowe',
    desc: 'Lśniące ciastka obsypane gwiezdnym pyłem z obserwatorium.',
    icon: '✨',
    cost: { flour: 1, apples: 1, crystals: 1 },
    effect: 'all',
    effectDesc: 'Super-przyspieszenie (90s) i +45 monet przy sprzedaży',
    sellPrice: 45,
    buffDuration: 90000
  },
  {
    id: 'honeyTea',
    name: 'Ziołowa Herbatka z Miodem',
    desc: 'Gorący, aromatyczny napar z jabłkiem i złocistym miodem z pasieki.',
    icon: '🍵',
    cost: { apples: 1, honey: 1 },
    effect: 'speed',
    effectDesc: '+40% prędkości chodu (90s)',
    sellPrice: 18,
    buffDuration: 90000
  },
  {
    id: 'gingerbread',
    name: 'Miodowy Piernik Korzenny',
    desc: 'Tradycyjny, pachnący cynamonem piernik pieczony na wiejskim miodzie.',
    icon: '🍯',
    cost: { flour: 1, honey: 1 },
    effect: 'coins',
    effectDesc: 'Przysmak wędrowców (sprzedaż: +28 monet)',
    sellPrice: 28,
    buffDuration: 90000
  },
  {
    id: 'pancakes',
    name: 'Naleśniki z Miodem i Jabłkiem',
    desc: 'Puszyste, złociste naleśniki smażone na wiejskich jajkach ze słodkim miodem.',
    icon: '🥞',
    cost: { flour: 1, eggs: 2, honey: 1 },
    effect: 'speed',
    effectDesc: 'Błyskawiczny bieg z wiatrem (120s) i +35 monet',
    sellPrice: 35,
    buffDuration: 120000
  },
  {
    id: 'omelet',
    name: 'Wiejski Puszysty Omlet',
    desc: 'Ciepły, pożywny omlet ze świeżych jajek z kurnika.',
    icon: '🍳',
    cost: { eggs: 2 },
    effect: 'speed',
    effectDesc: '+35% prędkości chodu (60s)',
    sellPrice: 16,
    buffDuration: 60000
  },
  {
    id: 'lavenderTea',
    name: 'Herbatka Lawendowa z Miodem',
    desc: 'Uspokajający napar z kwiatów lawendy i miodu z pasieki.',
    icon: '🪻',
    cost: { lavender: 1, honey: 1 },
    effect: 'speed',
    effectDesc: '+45% prędkości chodu (90s) i spokój',
    sellPrice: 20,
    buffDuration: 90000
  },
  {
    id: 'lavenderSachet',
    name: 'Woreczek Zapachowy z Ziół',
    desc: 'Pachnący woreczek z suszoną lawendą i drewnem.',
    icon: '🌸',
    cost: { lavender: 2, wood: 1 },
    effect: 'coins',
    effectDesc: 'Pamiątka z doliny (sprzedaż: +18 monet)',
    sellPrice: 18,
    buffDuration: 60000
  }
];

export const STICKERS = [
  { id: 'first_house', title: 'Ciepły Kąt', desc: 'Zbuduj swoją pierwszą chatkę na farmie.', icon: '🏡', reward: { coins: 5 }, check: s => (s.houseLevel || 0) >= 1 },
  { id: 'first_harvest', title: 'Zielony Ogrodnik', desc: 'Zbierz pierwsze świeże warzywa z ogrodu.', icon: '🥕', reward: { coins: 4 }, check: s => (s.carrots > 0 || s.wheat > 0) },
  { id: 'first_baby', title: 'Puszysta Rodzinka', desc: 'Powitaj na świecie małego króliczka.', icon: '🐰', reward: { coins: 6 }, check: s => (s.babies > 0 || s.totalBred > 0) },
  { id: 'first_fish', title: 'Złota Rybka', desc: 'Złów swoją pierwszą rybkę w Lazurowym Jeziorze.', icon: '🐟', reward: { coins: 5 }, check: s => (s.fishCaught?.total > 0 || s.fish > 0) },
  { id: 'pet_cat', title: 'Mruczące Serduszko', desc: 'Pogłaszcz kotka Puszka na ganku chociaż raz.', icon: '🐾', reward: { coins: 4 }, check: s => (s.petPats || 0) > 0 },
  { id: 'honey_harvest', title: 'Bursztynowy Miód', desc: 'Zbierz świeży miód z wiejskiej pasieki.', icon: '🐝', reward: { coins: 5 }, check: s => (s.honey || 0) > 0 },
  { id: 'first_egg', title: 'Złote Jajko', desc: 'Zbierz świeże jajka z wiejskiego kurnika.', icon: '🥚', reward: { coins: 5 }, check: s => (s.eggs || 0) > 0 },
  { id: 'pet_dog', title: 'Wierny Przyjaciel', desc: 'Pobaw się z wesołym pieskiem Łatkiem.', icon: '🐕', reward: { coins: 4 }, check: s => (s.dogPats || 0) > 0 },
  { id: 'first_cook', title: 'Mistrz Patelni', desc: 'Ugotuj ciepłe danie w wiejskiej kuchni.', icon: '🍳', reward: { coins: 5 }, check: s => Object.values(s.dishes || {}).some(v => v > 0) },
  { id: 'master_chef', title: 'Wiejski Szef Kuchni', desc: 'Ugotuj i miej w spiżarni co najmniej 3 dania.', icon: '👨‍🍳', reward: { coins: 10 }, check: s => Object.values(s.dishes || {}).filter(v => v > 0).length >= 3 },
  { id: 'owl_riddles', title: 'Mądra Głowa', desc: 'Rozwiąż co najmniej 3 zagadki Sowy Klary.', icon: '🦉', reward: { coins: 8 }, check: s => (s.solvedRiddles?.length || 0) >= 3 },
  { id: 'bridge_builder', title: 'Odkrywca Mostów', desc: 'Wybuduj i połącz most do dowolnej nowej krainy.', icon: '🌉', reward: { coins: 10 }, check: s => Boolean(s.world?.quarry || s.world?.meadow || s.world?.lake || s.world?.clouds || s.world?.lavender) },
  { id: 'wealthy_farmer', title: 'Złoty Skarbiec', desc: 'Zgromadź w swojej sakiewce co najmniej 50 monet.', icon: '👑', reward: { coins: 15 }, check: s => (s.coins || 0) >= 50 },
  { id: 'first_lavender', title: 'Fioletowy Bukiet', desc: 'Zbierz pachnącą lawendę w Lawendowej Dolinie.', icon: '🪻', reward: { coins: 8 }, check: s => (s.lavender || 0) > 0 },
  { id: 'tractor_ride', title: 'Mistrz Kierownicy', desc: 'Wsiądź i przejedź się traktorkiem odkrywcy.', icon: '🚜', reward: { coins: 8 }, check: s => (s.tractorRides || 0) > 0 },
  { id: 'rainbow_chaser', title: 'Łowca Tęczy', desc: 'Podziwiaj lśniącą tęczę po letnim deszczu.', icon: '🌈', reward: { coins: 8 }, check: s => (s.seenRainbow || 0) > 0 }
];

export const INITIAL = {
  saveVersion: SAVE_VERSION,
  world: NEW_WORLD,
  name: '',
  avatar: 'girl',
  // Core Resources
  wood: 4,
  stone: 3,
  carrots: 0,
  seeds: 2,
  wheat: 0,
  apples: 0,
  flour: 0,
  crystals: 0,
  coins: 8,
  fish: 0,
  honey: 0,
  lastHoney: 0,
  eggs: 0,
  lastEggs: 0,
  lavender: 0,
  lastLavender: 0,
  ridingTractor: false,
  tractorRides: 0,
  seenRainbow: 0,
  stickersClaimed: [],
  // Dishes & Cooking
  dishes: { bread: 0, applePie: 0, carrotSoup: 0, grilledFish: 0, starCookies: 0, honeyTea: 0, gingerbread: 0, pancakes: 0, omelet: 0, lavenderTea: 0, lavenderSachet: 0 },
  speedBoostUntil: 0,
  // Fishing Logs & Pet
  fishCaught: { gold: 0, carp: 0, trout: 0, pike: 0, total: 0 },
  fishRecords: {},
  petPats: 0,
  dogPats: 0,
  // Buildings & Upgrades
  houseLevel: 0, // 0: None, 1: Chatka, 2: Dom gospodarza, 3: Dom odkrywcy
  landLevel: 0,  // 0: 1 grządka, 1: 2 grządki, 2: 3 grządki, 3: 4 grządki
  penLevel: 1,   // 1: 6 maluszków, 2: 12 maluszków, 3: 18 maluszków
  pen: false,
  rabbits: false, // Bezuch & Karmelka
  babies: 0,
  totalBred: 0,
  plantedCrop: 'carrots', // 'carrots' or 'wheat'
  planted: false,
  watered: false,
  plantedAt: null,
  nextBirthAt: null,
  // Helper & Automation
  helper: false,
  seedReserve: 2,
  stall: false,
  orchardLevel: 0,
  lastOrchard: 0,
  // Guests & Hospitalty
  lastTouristIncome: 0,
  currentGuestAt: 0,
  guestIndex: 0,
  hostedGuestsCount: 0,
  guestReviews: [],
  // Tools
  tools: {
    axe: true,
    wateringCan: true,
    pickaxe: false,
    upgradedPickaxe: false,
    basket: false,
    rod: false
  },
  // Quests & Riddles
  activeQuest: 'intro-move',
  completedQuests: [],
  solvedRiddles: [],
  visitors: DEFAULT_VISITORS
};

const count = (value, max = 999999) => Math.min(max, Math.max(0, Math.floor(Number(value) || 0)));

export function normalize(raw = {}) {
  const s = { ...INITIAL };
  s.saveVersion = SAVE_VERSION;
  for (const k of ['wood', 'stone', 'carrots', 'seeds', 'wheat', 'apples', 'flour', 'crystals', 'coins', 'fish', 'honey', 'eggs', 'lavender', 'babies', 'totalBred', 'petPats', 'dogPats', 'tractorRides', 'seenRainbow']) {
    s[k] = count(raw[k] ?? s[k]);
  }
  s.world = normalizeWorld(raw.world);
  s.houseLevel = count(raw.houseLevel ?? (raw.house ? 1 : 0), 3);
  s.landLevel = count(raw.landLevel ?? 0, 3);
  s.penLevel = count(raw.penLevel ?? 1, 3);
  s.orchardLevel = count(raw.orchardLevel ?? (raw.world?.orchard ? 1 : 0), 3);
  s.name = String(raw.name || '').slice(0, 20);
  s.avatar = typeof raw.avatar === 'string' && raw.avatar ? raw.avatar : 'girl';
  s.plantedCrop = raw.plantedCrop === 'wheat' ? 'wheat' : 'carrots';

  // Dishes & cooking
  s.dishes = {
    bread: count(raw.dishes?.bread),
    applePie: count(raw.dishes?.applePie),
    carrotSoup: count(raw.dishes?.carrotSoup),
    grilledFish: count(raw.dishes?.grilledFish),
    starCookies: count(raw.dishes?.starCookies),
    honeyTea: count(raw.dishes?.honeyTea),
    gingerbread: count(raw.dishes?.gingerbread),
    pancakes: count(raw.dishes?.pancakes),
    omelet: count(raw.dishes?.omelet),
    lavenderTea: count(raw.dishes?.lavenderTea),
    lavenderSachet: count(raw.dishes?.lavenderSachet)
  };
  s.speedBoostUntil = Number.isFinite(raw.speedBoostUntil) ? raw.speedBoostUntil : 0;
  s.lastHoney = Number.isFinite(raw.lastHoney) ? raw.lastHoney : 0;
  s.lastEggs = Number.isFinite(raw.lastEggs) ? raw.lastEggs : 0;
  s.lastLavender = Number.isFinite(raw.lastLavender) ? raw.lastLavender : 0;
  s.ridingTractor = Boolean(raw.ridingTractor);
  s.stickersClaimed = Array.isArray(raw.stickersClaimed) ? raw.stickersClaimed : [];

  // Fishing log
  s.fishCaught = {
    gold: count(raw.fishCaught?.gold),
    carp: count(raw.fishCaught?.carp),
    trout: count(raw.fishCaught?.trout),
    pike: count(raw.fishCaught?.pike),
    total: count(raw.fishCaught?.total)
  };
  s.fishRecords = raw.fishRecords && typeof raw.fishRecords === 'object' ? { ...raw.fishRecords } : {};

  for (const k of ['pen', 'rabbits', 'planted', 'watered', 'helper', 'stall']) {
    s[k] = Boolean(raw[k]);
  }
  s.seedReserve = count(raw.seedReserve ?? 2, 50);
  s.nextBirthAt = Number.isFinite(raw.nextBirthAt) && raw.nextBirthAt > 0 ? raw.nextBirthAt : null;
  s.plantedAt = Number.isFinite(raw.plantedAt) && raw.plantedAt > 0 ? raw.plantedAt : null;
  s.lastOrchard = Number.isFinite(raw.lastOrchard) ? raw.lastOrchard : 0;
  s.lastTouristIncome = Number.isFinite(raw.lastTouristIncome) ? raw.lastTouristIncome : 0;
  s.guestIndex = Number.isInteger(raw.guestIndex) ? raw.guestIndex : 0;
  s.hostedGuestsCount = Number.isInteger(raw.hostedGuestsCount) ? raw.hostedGuestsCount : 0;
  s.guestReviews = Array.isArray(raw.guestReviews) ? raw.guestReviews : [];
  s.solvedRiddles = Array.isArray(raw.solvedRiddles) ? raw.solvedRiddles : [];
  s.completedQuests = Array.isArray(raw.completedQuests) ? raw.completedQuests : [];
  s.visitors = Array.isArray(raw.visitors) && raw.visitors.length ? raw.visitors : DEFAULT_VISITORS;

  s.tools = {
    axe: true,
    wateringCan: true,
    pickaxe: Boolean(raw.tools?.pickaxe || s.world?.quarry),
    upgradedPickaxe: Boolean(raw.tools?.upgradedPickaxe),
    basket: Boolean(raw.tools?.basket || s.world?.lake),
    rod: Boolean(raw.tools?.rod || s.world?.lake)
  };

  return s;
}

export function loadGame(storage = localStorage) {
  try {
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
          // ignore corrupted json and try next key
        }
      }
    }
    return { ...INITIAL };
  } catch {
    return { ...INITIAL };
  }
}

export function exportGameSave(state) {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `e-klamerka-farma-${state.name || 'zapis'}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importGameSave(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') throw new Error('Nieprawidłowy plik zapisu');
    return normalize(parsed);
  } catch (e) {
    throw new Error('Błąd odczytu pliku zapisu: ' + e.message);
  }
}

export function maxBabies(s) {
  if (s.penLevel === 1) return 6;
  if (s.penLevel === 2) return 12;
  return 18;
}

export const hasConnectedWorld = (s) => Boolean(s.world?.quarry || s.world?.meadow || (s.world?.visited && s.world?.visited.length > 1));

export function getAvailableVisitors(s) {
  if (!s || !hasConnectedWorld(s)) return [];
  const list = [];
  if (s.world?.visited?.includes('woodland') || s.world?.quarry || s.world?.meadow) {
    list.push(s.visitors?.find(v => v.id === 'v1') || DEFAULT_VISITORS[0]);
  }
  if (s.world?.quarry) {
    list.push(s.visitors?.find(v => v.id === 'v2') || DEFAULT_VISITORS[1]);
  }
  if (s.world?.meadow) {
    list.push(s.visitors?.find(v => v.id === 'v3') || DEFAULT_VISITORS[2]);
  }
  list.push(s.visitors?.find(v => v.id === 'v4') || DEFAULT_VISITORS[3]);
  return list;
}

// Strictly according to Section 4, 5, 10, 11 of v0.4
export const COSTS = {
  // House Levels
  house1: { wood: 8, stone: 6 },
  house2: { wood: 18, stone: 12, coins: 20 },
  house3: { wood: 28, stone: 20, crystals: 6, coins: 50 },
  // Pen Levels
  pen1: { wood: 6, stone: 4 },
  pen2: { wood: 10, stone: 6, coins: 15 },
  pen3: { wood: 16, stone: 10, crystals: 3, coins: 30 },
  // Land / Plots expansions
  land1: { wood: 6, stone: 4, coins: 5 },
  land2: { wood: 10, stone: 8, coins: 15 },
  land3: { wood: 14, stone: 10, crystals: 3, coins: 25 },
  // Buildings & Automation
  pump: { wood: 8, stone: 6, coins: 15 },
  helper: { coins: 15 },
  stall: { wood: 6, stone: 4, coins: 10 },
  windmill: { wood: 12, stone: 8, coins: 12 },
  // Tools
  pickaxe: { wood: 3, stone: 2 },
  upgradedPickaxe: { wood: 6, stone: 6, crystals: 2 },
  basket: { wood: 3 }
};

export function houseCost(level) {
  if (level === 0) return COSTS.house1;
  if (level === 1) return COSTS.house2;
  return COSTS.house3;
}

export function penCost(level) {
  if (level === 0 || !level) return COSTS.pen1;
  if (level === 1) return COSTS.pen2;
  return COSTS.pen3;
}

export function landCost(level) {
  if (level === 0) return COSTS.land1;
  if (level === 1) return COSTS.land2;
  return COSTS.land3;
}

export function transact(state, action, now = Date.now(), params = {}) {
  const s = {
    ...state,
    crystals: state.crystals || 0,
    apples: state.apples || 0,
    wheat: state.wheat || 0,
    flour: state.flour || 0,
    fish: state.fish || 0,
    honey: state.honey || 0,
    lastHoney: state.lastHoney || 0,
    eggs: state.eggs || 0,
    lastEggs: state.lastEggs || 0,
    lavender: state.lavender || 0,
    lastLavender: state.lastLavender || 0,
    ridingTractor: Boolean(state.ridingTractor),
    tractorRides: state.tractorRides || 0,
    seenRainbow: state.seenRainbow || 0,
    dogPats: state.dogPats || 0,
    stickersClaimed: [...(state.stickersClaimed || [])],
    dishes: { ...(state.dishes || { bread: 0, applePie: 0, carrotSoup: 0, grilledFish: 0, starCookies: 0, honeyTea: 0, gingerbread: 0, pancakes: 0, omelet: 0, lavenderTea: 0, lavenderSachet: 0 }) },
    fishCaught: { ...(state.fishCaught || { gold: 0, carp: 0, trout: 0, pike: 0, total: 0 }) },
    fishRecords: { ...(state.fishRecords || {}) },
    world: normalizeWorld(state.world),
    tools: { ...state.tools }
  };
  const fail = message => ({ state, message, ok: false });
  const pay = cost => {
    if (!cost) return true;
    if (Object.entries(cost).some(([k, n]) => (s[k] || 0) < n)) return false;
    for (const [k, n] of Object.entries(cost)) s[k] -= n;
    return true;
  };

  let message;
  switch (action) {
    case 'visit:woodland': case 'visit:quarry': case 'visit:meadow': case 'visit:lake': case 'visit:clouds': case 'visit:lavender': {
      const id = action.split(':')[1];
      if (!unlocked(id, s) || s.world.visited.includes(id)) return { state, ok: false };
      s.world.visited = [...s.world.visited, id];
      message = `Odkryto nową krainę: ${REGIONS[id].name}`;
      break;
    }

    case 'unlock:quarry': case 'unlock:meadow': case 'unlock:lake': case 'unlock:clouds': case 'unlock:lavender': {
      const id = action.split(':')[1];
      if (s.world[id]) return fail('Ten most jest już odbudowany.');
      
      // Prerequisites check according to Section 4
      if (id === 'quarry') {
        if (!s.houseLevel) return fail('Najpierw zbuduj chatkę (Dom poziom 1).');
      } else if (id === 'meadow') {
        if (s.houseLevel < 2) return fail('Wymaga Domu gospodarza (Poziom 2).');
        if (!s.pen) return fail('Wymaga zbudowanej zagrody dla królików.');
      } else if (id === 'lake') {
        if (s.houseLevel < 2) return fail('Wymaga Domu gospodarza (Poziom 2).');
      } else if (id === 'clouds') {
        if (s.houseLevel < 3) return fail('Wymaga Domu odkrywcy (Poziom 3).');
        if (s.penLevel < 2) return fail('Wymaga zagrody na poziomie 2.');
      } else if (id === 'lavender') {
        if (s.houseLevel < 2) return fail('Wymaga Domu gospodarza (Poziom 2).');
      }

      if (!pay(REGIONS[id].cost)) return fail('Brakuje materiałów pokazanych przy moście.');
      s.world[id] = true;
      if (id === 'quarry') s.tools.pickaxe = true;
      message = `Most gotowy! Kraina ${REGIONS[id].name} stoi otworem.`;
      break;
    }

    // Wood & Stone Gathering (Farm - Section 9)
    case 'forest': {
      s.wood += 2;
      message = '+2 drewna zebrane na farmie';
      break;
    }
    case 'mine': {
      s.stone += 2;
      message = '+2 kamienie zebrane na farmie';
      break;
    }

    // Grove (Woodland) - 5 wood (cooldown 25s)
    case 'grove': {
      if (now - (s.world.lastGrove || 0) < 25000) return fail('Stare dęby odpoczywają. Wróć za chwilkę.');
      s.wood += 5;
      s.world.lastGrove = now;
      message = '+5 drewna ze starych dębów w Szumiącym Lesie';
      break;
    }

    // Crystals (Quarry) - 3 stone + 1 crystal (cooldown 45s)
    case 'crystals': {
      if (!s.world.quarry) return fail('Najpierw napraw most do Kryształowych Wzgórz.');
      if (now - (s.world.lastCrystals || 0) < 45000) return fail('Kryształy odrastają w żyle. Wróć za chwilkę.');
      s.stone += 3;
      s.crystals += 1;
      s.world.lastCrystals = now;
      message = '+3 kamienie i +1 błękitny kryształ z Błękitnej Żyły';
      break;
    }

    // Explorer chest (One-time reward: 10 coins, 3 seeds)
    case 'chest': {
      if (s.world.chest) return fail('Skrzynka odkrywcy została już odnaleziona.');
      s.world.chest = true;
      s.coins += 10;
      s.seeds += 3;
      message = 'Otwarto Skrzynkę Odkrywcy! +10 monet i +3 paczki nasion';
      break;
    }

    // Orchard (Meadow) - Section 9 & 10
    case 'orchard': {
      if (!s.world.meadow && s.orchardLevel === 0) return fail('Najpierw otwórz drogę na Słoneczną Łąkę.');
      if (s.orchardLevel === 0) {
        s.orchardLevel = 1;
        s.world.orchard = true;
        s.apples += 3;
        s.lastOrchard = now;
        message = 'Sad zasadzony! Zebrano pierwsze soczyste jabłka (+3 jabłka).';
      } else {
        if (now - (s.lastOrchard || 0) < 120000) {
          const waitSec = Math.ceil((120000 - (now - s.lastOrchard)) / 1000);
          return fail(`Jabłka dojrzewają na drzewach (${waitSec}s).`);
        }
        const yieldApples = 3 * s.orchardLevel;
        s.apples += yieldApples;
        s.lastOrchard = now;
        message = `Zebrano ${yieldApples} soczystych jabłek z sadu!`;
      }
      break;
    }

    // Beehive Honey Harvesting
    case 'harvest-honey': case 'beehive': {
      if (now - (s.lastHoney || 0) < 45000) {
        const waitSec = Math.ceil((45000 - (now - s.lastHoney)) / 1000);
        return fail(`Pszczółki napełniają plastry miodu (${waitSec}s).`);
      }
      s.lastHoney = now;
      s.honey = (s.honey || 0) + 1;
      message = 'Zebrano słoik świeżego, bursztynowego miodu! (+1 miód 🍯)';
      break;
    }

    // Lake Duck Feeding
    case 'feed-duck': case 'duck': {
      if (!s.world?.lake) return fail('Najpierw odblokuj Lazurowe Jezioro.');
      if (!pay({ wheat: 1 })) return fail('Kaczuszka chętnie zje kłos pszenicy (wymaga 1 pszenicy).');
      s.coins += 4;
      message = 'Kaczuszka wesoło zakwakała i zanurkowała po ziarna pszenicy! (+4 monety 🪙)';
      break;
    }

    // Chicken Coop Egg Harvesting
    case 'harvest-eggs': case 'coop': {
      if (now - (s.lastEggs || 0) < 40000) {
        const waitSec = Math.ceil((40000 - (now - s.lastEggs)) / 1000);
        return fail(`Kurki jeszcze wysiadują jajka (${waitSec}s).`);
      }
      s.lastEggs = now;
      s.eggs = (s.eggs || 0) + 2;
      message = 'Zebrano 2 świeże jajka z kurnika! (+2 jajka 🥚)';
      break;
    }

    // Puppy Łatek Interaction
    case 'pet-dog': case 'dog': {
      s.dogPats = (s.dogPats || 0) + 1;
      s.coins += 2;
      const phrases = [
        'Piesek Łatek radośnie szczeka, macha ogonkiem i przynosi patyk! (+2 monety 🐕)',
        'Łatek robi wesoły piruet na trawie i domaga się pieszczot! (+2 monety ✨)',
        'Łatek opiera łapki o Twoje kolano i wesoło poszczekuje! (+2 monety 🪙)'
      ];
      message = phrases[s.dogPats % phrases.length];
      break;
    }

    // Sticker Album Achievements
    case 'claim-sticker': {
      const stickerId = params.id;
      const sticker = STICKERS.find(st => st.id === stickerId);
      if (!sticker) return fail('Nieznana naklejka.');
      s.stickersClaimed = s.stickersClaimed || [];
      if (s.stickersClaimed.includes(stickerId)) return fail('Ta naklejka została już odebrana!');
      if (!sticker.check(s)) return fail('Warunek zdobycia naklejki nie został jeszcze spełniony.');
      s.stickersClaimed.push(stickerId);
      if (sticker.reward?.coins) {
        s.coins += sticker.reward.coins;
      }
      message = `Wklejono naklejkę: „${sticker.title}”! (+${sticker.reward?.coins || 0} monet ⭐)`;
      break;
    }

    // Lake Fishing & Pearls
    case 'lakeDock': case 'fish': {
      if (!s.world.lake) return fail('Najpierw napraw most na Lazurowe Jezioro.');
      if (now - (s.world.lastLake || 0) < 30000) {
        const waitSec = Math.ceil((30000 - (now - s.world.lastLake)) / 1000);
        return fail(`Rybki w jeziorze odpoczywają (${waitSec}s).`);
      }
      s.world.lastLake = now;
      s.coins += 6;
      message = 'Złowiono lśniącą złotą rybkę z Lazurowego Jeziora! (+6 monet)';
      break;
    }
    case 'lakePearls': {
      if (!s.world.lake) return fail('Najpierw napraw most na Lazurowe Jezioro.');
      if (now - (s.world.lastPearls || 0) < 45000) {
        const waitSec = Math.ceil((45000 - (now - (s.world.lastPearls || 0))) / 1000);
        return fail(`Perły jeszcze lśnią na dnie zatoczki (${waitSec}s).`);
      }
      s.world.lastPearls = now;
      s.coins += 8;
      message = 'Wyłowiono lśniącą perłę z Perłowej Zatoczki! (+8 monet)';
      break;
    }

    // Clouds Observatory
    case 'observatory': {
      if (!s.world.clouds) return fail('Najpierw otwórz ścieżkę na Gwiezdną Polanę.');
      if (now - (s.world.lastObservatory || 0) < 45000) {
        const waitSec = Math.ceil((45000 - (now - s.world.lastObservatory)) / 1000);
        return fail(`Teleskop jest nastawiany na nową konstelację (${waitSec}s).`);
      }
      s.world.lastObservatory = now;
      s.coins += 10;
      message = 'Odkryto spadającą gwiazdę przez teleskop! (+10 monet)';
      break;
    }

    // Lavender Valley Harvesting
    case 'lavenderField': case 'harvest-lavender': {
      if (!s.world?.lavender) return fail('Najpierw napraw most do Lawendowej Doliny.');
      if (now - (s.world.lastLavender || 0) < 40000) {
        const waitSec = Math.ceil((40000 - (now - s.world.lastLavender)) / 1000);
        return fail(`Krzaczki lawendy jeszcze kwitną (${waitSec}s).`);
      }
      s.world.lastLavender = now;
      s.lavender = (s.lavender || 0) + 2;
      message = 'Zebrano 2 bukiety pachnącej lawendy! (+2 lawenda 🪻)';
      break;
    }

    // Herbal Tea Gazebo
    case 'teaGazebo': case 'brew-tea': {
      if (!s.world?.lavender) return fail('Najpierw napraw most do Lawendowej Doliny.');
      if ((s.lavender || 0) < 1 || (s.honey || 0) < 1) return fail('Do zaparzenia herbatki potrzebujesz 1 lawendy i 1 miodu.');
      s.lavender -= 1;
      s.honey -= 1;
      s.coins += 8;
      s.dishes.lavenderTea = (s.dishes.lavenderTea || 0) + 1;
      s.speedBoostUntil = Math.max(s.speedBoostUntil || 0, now) + 90000;
      message = 'Zaparzono gorącą herbatkę lawendową z miodem! +8 monet i Bieg z wiatrem 🍵';
      break;
    }

    // Tractor Mount / Dismount
    case 'tractor': case 'mount-tractor': case 'dismount-tractor': {
      s.ridingTractor = !s.ridingTractor;
      if (s.ridingTractor) {
        s.tractorRides = (s.tractorRides || 0) + 1;
        message = 'Wsiadasz do traktorka odkrywcy! Pyr-pyr! Jedziemy z wiatrem! 🚜';
      } else {
        message = 'Zsiadasz z traktorka na pachnącą trawę.';
      }
      break;
    }

    // Rainbow Wonder
    case 'see-rainbow': {
      s.seenRainbow = (s.seenRainbow || 0) + 1;
      s.coins += 5;
      message = 'Podziwiasz barwną tęczę nad farmą! +5 monet szczęścia 🌈';
      break;
    }

    // Auto-water by rain
    case 'water-auto': {
      if (s.planted && !s.watered) {
        s.watered = true;
        message = '🌧️ Letni deszczyk podlał Twoje grządki!';
      }
      break;
    }

    // Windmill (Meadow) - Repair / Milling (Section 9)
    case 'windmill': {
      if (!s.world.meadow) return fail('Najpierw otwórz drogę na Słoneczną Łąkę.');
      if (s.world.windmill) return fail('Wiatrak już pracuje na łące.');
      if (!pay(COSTS.windmill)) return fail('Na naprawę młyna potrzeba 12 drewna, 8 kamieni i 12 monet.');
      s.world.windmill = true;
      message = 'Młyn naprawiony! Możesz mleć zebraną pszenicę na mąkę.';
      break;
    }
    case 'mill-flour': {
      if (!s.world?.windmill) return fail('Najpierw napraw wiatrak na Słonecznej Łące.');
      if (!pay({ wheat: 2 })) return fail('Do zmielenia 1 porcji mąki potrzebujesz 2 sztuk pszenicy.');
      s.flour += 1;
      message = 'Młyn zmielił 2 ziarna pszenicy na 1 worek świeżej mąki (+1 mąka).';
      break;
    }

    // Pump (Farm automation - Section 10)
    case 'build-pump': {
      if (!s.world?.windmill) return fail('Przepis na pompę otrzymasz po uruchomieniu młyna na łące.');
      if (s.world?.pump) return fail('Pompa jest już zainstalowana na Twojej farmie.');
      if (!pay(COSTS.pump)) return fail('Na pompę potrzeba 8 drewna, 6 kamieni i 15 monet.');
      s.world.pump = true;
      message = 'Pompa wodna gotowa! Nowo posiane grządki będą podlewane automatycznie.';
      break;
    }

    // Garden & Farming (Section 9)
    case 'plant:carrots': case 'plant:wheat': case 'garden': {
      const chosenCrop = action.startsWith('plant:') ? action.split(':')[1] : (s.plantedCrop || 'carrots');
      if (!s.planted) {
        if (!pay({ seeds: 1 })) return fail('Kup paczkę nasion w sklepiku (2 monety).');
        s.planted = true;
        s.plantedCrop = chosenCrop;
        s.plantedAt = now;
        // Auto-water if pump is active
        if (s.world?.pump) {
          s.watered = true;
          message = `Posiano ${chosenCrop === 'wheat' ? 'pszenicę' : 'marchewki'}! Pompa automatycznie podlała grządkę.`;
        } else {
          s.watered = false;
          message = `Posiano ${chosenCrop === 'wheat' ? 'pszenicę' : 'marchewki'}! Podejdź i podlej grządkę.`;
        }
      } else if (!s.watered) {
        s.watered = true;
        message = 'Grządka podlana! Rośliny zaczynają rosnąć w słońcu.';
      } else {
        // Harvest
        const isWheat = s.plantedCrop === 'wheat';
        const growTime = isWheat ? 90_000 : 60_000;
        const elapsed = s.plantedAt ? (now - s.plantedAt) : growTime;
        if (elapsed < growTime) {
          const waitSec = Math.ceil((growTime - elapsed) / 1000);
          return fail(`Plony jeszcze dojrzewają (${waitSec}s).`);
        }

        const plotsCount = 1 + (s.landLevel || 0);
        if (isWheat) {
          const yieldWheat = 4 * plotsCount;
          s.wheat += yieldWheat;
          message = `Zebrano ${yieldWheat} kłosów złotej pszenicy!`;
        } else {
          const yieldCarrots = 6 * plotsCount;
          s.carrots += yieldCarrots;
          message = `Zebrano ${yieldCarrots} soczystych marchewek z ogrodu!`;
        }
        s.planted = false;
        s.watered = false;
        s.plantedAt = null;
      }
      break;
    }

    // Rabbit Pen & Breeding (Section 11)
    case 'pen': {
      if (!s.houseLevel) return fail('Najpierw zbuduj chatkę (Dom poziom 1).');
      if (!s.pen) {
        if (!pay(COSTS.pen1)) return fail('Na zagrodę potrzeba 6 drewna i 4 kamieni.');
        s.pen = true;
        s.rabbits = true;
        s.penLevel = 1;
        message = 'Zagroda gotowa! Bezuch i Karmelka zamieszkali na farmie.';
      } else if (s.penLevel < 3) {
        const cost = penCost(s.penLevel);
        if (s.penLevel === 1 && s.houseLevel < 2) return fail('Rozbudowa zagrody na 2. poziom wymaga Domu gospodarza (Poziom 2).');
        if (s.penLevel === 2 && s.houseLevel < 3) return fail('Rozbudowa zagrody na 3. poziom wymaga Domu odkrywcy (Poziom 3).');
        if (!pay(cost)) return fail('Brakuje surowców do powiększenia zagrody.');
        s.penLevel++;
        message = `Zagroda powiększona do poziomu ${s.penLevel}! Mieści teraz do ${maxBabies(s)} maluszków.`;
      } else {
        return fail('Zagroda ma już maksymalny poziom rozbudowy.');
      }
      break;
    }

    case 'feed': {
      if (!s.pen || !s.rabbits) return fail('Najpierw przygotuj zagrodę dla królików.');
      if (s.nextBirthAt) {
        const remaining = Math.max(1, Math.ceil((s.nextBirthAt - now) / 1000));
        return fail(`Królicza rodzinka czeka na maluszka (${remaining}s).`);
      }
      if (s.babies >= maxBabies(s)) return fail(`Zagroda jest pełna (${s.babies}/${maxBabies(s)}). Rozbuduj zagrodę lub znajdź maluszkowi nowy dom.`);
      if (!pay({ carrots: 2 })) return fail('Do nakarmienia króliczej pary potrzebujesz 2 marchewek.');

      const duration = (s.totalBred === 0) ? BREED_TIME_FIRST : BREED_TIME_SUBSEQUENT;
      s.nextBirthAt = now + duration;
      message = `Bezuch i Karmelka nakarmieni! Maluszek pojawi się za ${Math.round(duration / 1000)} sekund.`;
      break;
    }

    // Franek Helper (Section 10)
    case 'helper': {
      if (s.helper) return fail('Franek już pomaga w Twoim ogrodzie.');
      if (s.houseLevel < 2) return fail('Wymaga Domu gospodarza (Poziom 2) z pokojem dla pomocnika.');
      if (!s.world?.quarry) return fail('Franek przybędzie po odbudowaniu mostu do Kryształowych Wzgórz.');
      if (!pay(COSTS.helper)) return fail('Zatrudnienie Franka wymaga 15 monet.');
      s.helper = true;
      message = 'Pomocnik Franek zamieszkał w pokoju na piętrze i pomaga w ogrodzie!';
      break;
    }

    // Stall (Kram Wędrowców - Section 13)
    case 'stall': {
      if (s.stall) return fail('Kram wędrowców jest już otwarty.');
      if (s.houseLevel < 2) return fail('Budowa kramu wymaga Domu gospodarza (Poziom 2).');
      if (!pay(COSTS.stall)) return fail('Na wybudowanie kramu potrzeba 6 drewna, 4 kamieni i 10 monet.');
      s.stall = true;
      message = 'Kram wędrowców gotowy! Goście z krain będą składać zamówienia.';
      break;
    }

    // House Upgrades (Section 5)
    case 'house': {
      if (s.houseLevel >= 3) return fail('Twój dom ma już najwyższy poziom (Dom Odkrywcy)!');
      const cost = houseCost(s.houseLevel);
      if (!pay(cost)) return fail('Brakuje surowców do rozbudowy domu.');
      s.houseLevel++;
      if (s.houseLevel === 1) message = 'Chatka gotowa! Odblokowano garderobę, warsztat i zagrodę dla królików.';
      else if (s.houseLevel === 2) message = 'Dom gospodarza gotowy! Odblokowano kuchnię, pokój Franka i kram wędrowców.';
      else message = 'Dom odkrywcy gotowy! Odblokowano stół wypraw, pokój gościnny i półki na kolekcje.';
      break;
    }

    // Land / Plot Expansions (Section 10)
    case 'land': {
      if (s.landLevel >= 3) return fail('Ogród ma już maksymalną powierzchnię (4 grządki).');
      if (s.landLevel === 0 && s.houseLevel < 1) return fail('Rozszerzenie ogrodu wymaga Chatki (Dom poziom 1).');
      if (s.landLevel === 1 && s.houseLevel < 2) return fail('Rozszerzenie ogrodu wymaga Domu gospodarza (Dom poziom 2).');
      if (s.landLevel === 2 && s.houseLevel < 3) return fail('Rozszerzenie ogrodu wymaga Domu odkrywcy (Dom poziom 3).');
      const cost = landCost(s.landLevel);
      if (!pay(cost)) return fail('Brakuje materiałów lub monet do rozszerzenia terenu.');
      s.landLevel++;
      message = `Ogród powiększony! Masz teraz ${s.landLevel + 1} grządki do upraw.`;
      break;
    }

    // Shop Buy & Sell (Section 12)
    case 'buy-seeds': {
      if (!pay({ coins: 2 })) return fail('Potrzebujesz 2 monet na paczkę nasion.');
      s.seeds++;
      message = 'Kupiono paczkę nasion · −2 monety';
      break;
    }
    case 'buy-carrots': {
      if (!pay({ coins: 3 })) return fail('Potrzebujesz 3 monet na 2 marchewki.');
      s.carrots += 2;
      message = 'Kupiono 2 marchewki · −3 monety';
      break;
    }
    case 'buy-wood': {
      if (!pay({ coins: 3 })) return fail('Potrzebujesz 3 monet na 2 drewna.');
      s.wood += 2;
      message = 'Kupiono 2 drewna · −3 monety';
      break;
    }
    case 'buy-stone': {
      if (!pay({ coins: 3 })) return fail('Potrzebujesz 3 monet na 2 kamienie.');
      s.stone += 2;
      message = 'Kupiono 2 kamienie · −3 monety';
      break;
    }
    case 'buy-crystal': {
      if (!s.world?.quarry) return fail('Kryształy są dostępne w sprzedaży dopiero po odkryciu Wzgórz.');
      if (!pay({ coins: 10 })) return fail('Kupno kryształu kosztuje 10 monet.');
      s.crystals++;
      message = 'Kupiono błękitny kryształ · −10 monet';
      break;
    }
    case 'sell-wood': {
      if (!pay({ wood: 2 })) return fail('Przynieś 2 sztuki drewna.');
      s.coins += 2;
      message = 'Sprzedano 2 drewna · +2 monety';
      break;
    }
    case 'sell-stone': {
      if (!pay({ stone: 2 })) return fail('Przynieś 2 kamienie.');
      s.coins += 2;
      message = 'Sprzedano 2 kamienie · +2 monety';
      break;
    }
    case 'sell-carrot': {
      if (!pay({ carrots: 1 })) return fail('Przynieś marchewkę.');
      s.coins += 1;
      message = 'Sprzedano marchewkę · +1 moneta';
      break;
    }
    case 'sell-wheat': {
      if (!pay({ wheat: 1 })) return fail('Przynieś pszenicę.');
      s.coins += 1;
      message = 'Sprzedano pszenicę · +1 moneta';
      break;
    }
    case 'sell-apples': {
      if (!pay({ apples: 2 })) return fail('Przynieś 2 jabłka.');
      s.coins += 4;
      message = 'Sprzedano 2 jabłka · +4 monety';
      break;
    }
    case 'sell-flour': {
      if (!pay({ flour: 1 })) return fail('Przynieś worek mąki.');
      s.coins += 3;
      message = 'Sprzedano mąkę · +3 monety';
      break;
    }
    case 'sell-crystal': {
      if (!pay({ crystals: 1 })) return fail('Przynieś kryształ.');
      s.coins += 4;
      message = 'Sprzedano kryształ · +4 monety';
      break;
    }
    case 'sell-baby': {
      if (!pay({ babies: 1 })) return fail('W zagrodzie nie ma małego króliczka.');
      s.coins += 5;
      message = 'Maluszek znalazł nowy, kochający dom · +5 monet';
      break;
    }
    case 'sell-honey': {
      if (!pay({ honey: 1 })) return fail('Przynieś słoik miodu.');
      s.coins += 5;
      message = 'Sprzedano słoik miodu · +5 monet';
      break;
    }
    case 'sell-egg': {
      if (!pay({ eggs: 2 })) return fail('Przynieś 2 jajka z kurnika.');
      s.coins += 3;
      message = 'Sprzedano 2 świeże jajka · +3 monety';
      break;
    }
    case 'sell-lavender': {
      if (!pay({ lavender: 1 })) return fail('Przynieś bukiet lawendy.');
      s.coins += 3;
      message = 'Sprzedano bukiet lawendy · +3 monety';
      break;
    }

    // Wardrobe & Outfit customization
    case 'set-avatar': {
      s.avatar = s.avatar.startsWith('boy') ? 'girl' : 'boy';
      message = `Przebrano postać (${s.avatar === 'girl' ? 'Pola' : 'Tomek'})!`;
      break;
    }
    case 'avatar:girl': case 'avatar:girl-green': case 'avatar:girl-yellow': case 'avatar:girl-blue':
    case 'avatar:boy': case 'avatar:boy-green': case 'avatar:boy-yellow': case 'avatar:boy-blue': {
      s.avatar = action.replace('avatar:', '');
      message = 'Wybrano nowy strój w garderobie!';
      break;
    }

    // Guest Hospitality (Section 14: 1 guest, 1 room, exact rewards)
    case 'host-guest:tea': {
      if (s.houseLevel < 3) return fail('Wymaga Domu odkrywcy (Poziom 3) z pokojem gościnnym.');
      if (!hasConnectedWorld(s)) return fail('Połącz farmę z inną krainą, by przybyli goście.');
      if (now - (s.lastTouristIncome || 0) < 30000) {
        const waitSec = Math.ceil((30000 - (now - s.lastTouristIncome)) / 1000);
        return fail(`Pokój gościnny jest wietrzony. Kolejny gość przybędzie za ${waitSec}s.`);
      }
      s.coins += 8;
      s.hostedGuestsCount = (s.hostedGuestsCount || 0) + 1;
      const guest = TOURIST_GUESTS[(s.guestIndex || 0) % TOURIST_GUESTS.length];
      s.guestReviews = [{ name: guest.name, origin: guest.origin, text: '„Spokojnie odpocząłem przy ciepłej herbacie.”', date: 'przed chwilą' }, ...(s.guestReviews || []).slice(0, 4)];
      s.guestIndex = ((s.guestIndex || 0) + 1) % TOURIST_GUESTS.length;
      s.lastTouristIncome = now;
      message = `Ugoszczono podróżnika (${guest.name}) herbatą i noclegiem! +8 monet zapłaty.`;
      break;
    }
    case 'host-guest:carrots': {
      if (s.houseLevel < 3) return fail('Wymaga Domu odkrywcy (Poziom 3).');
      if (now - (s.lastTouristIncome || 0) < 30000) return fail('Pokoje gościnne są przygotowywane.');
      if (!pay({ carrots: 3 })) return fail('Potrzebujesz 3 marchewek na poczęstunek.');
      s.coins += 16;
      s.hostedGuestsCount = (s.hostedGuestsCount || 0) + 1;
      const guest = TOURIST_GUESTS[(s.guestIndex || 0) % TOURIST_GUESTS.length];
      s.guestReviews = [{ name: guest.name, origin: guest.origin, text: '„Chrupiące marchewki i wspaniały odpoczynek!”', date: 'przed chwilą' }, ...(s.guestReviews || []).slice(0, 4)];
      s.guestIndex = ((s.guestIndex || 0) + 1) % TOURIST_GUESTS.length;
      s.lastTouristIncome = now;
      message = `Ugoszczono turystę (${guest.name}) marchewkowym poczęstunkiem! +16 monet zapłaty.`;
      break;
    }
    case 'host-guest:apples': {
      if (s.houseLevel < 3) return fail('Wymaga Domu odkrywcy (Poziom 3).');
      if (now - (s.lastTouristIncome || 0) < 30000) return fail('Pokoje gościnne są przygotowywane.');
      if (!pay({ apples: 2 })) return fail('Potrzebujesz 2 soczystych jabłek.');
      s.coins += 18;
      s.hostedGuestsCount = (s.hostedGuestsCount || 0) + 1;
      const guest = TOURIST_GUESTS[(s.guestIndex || 0) % TOURIST_GUESTS.length];
      s.guestReviews = [{ name: guest.name, origin: guest.origin, text: '„Przepyszne jabłka z sadu i miękkie łóżko!”', date: 'przed chwilą' }, ...(s.guestReviews || []).slice(0, 4)];
      s.guestIndex = ((s.guestIndex || 0) + 1) % TOURIST_GUESTS.length;
      s.lastTouristIncome = now;
      message = `Ugoszczono turystę (${guest.name}) deserem jabłkowym! +18 monet zapłaty.`;
      break;
    }
    case 'host-guest:bread': {
      if (s.houseLevel < 3) return fail('Wymaga Domu odkrywcy (Poziom 3).');
      if (now - (s.lastTouristIncome || 0) < 30000) return fail('Pokoje gościnne są przygotowywane.');
      if (!pay({ flour: 1 })) return fail('Potrzebujesz 1 porcji mąki do upieczenia pieczywa.');
      s.coins += 18;
      s.hostedGuestsCount = (s.hostedGuestsCount || 0) + 1;
      const guest = TOURIST_GUESTS[(s.guestIndex || 0) % TOURIST_GUESTS.length];
      s.guestReviews = [{ name: guest.name, origin: guest.origin, text: '„Zapach świeżo upieczonego chleba był niezapomniany!”', date: 'przed chwilą' }, ...(s.guestReviews || []).slice(0, 4)];
      s.guestIndex = ((s.guestIndex || 0) + 1) % TOURIST_GUESTS.length;
      s.lastTouristIncome = now;
      message = `Ugoszczono turystę (${guest.name}) ciepłym pieczywem! +18 monet zapłaty.`;
      break;
    }

    // Stall Orders (Section 13)
    case 'fulfill:v1': case 'fulfill:v2': case 'fulfill:v3': case 'fulfill:v4': {
      const vId = action.split(':')[1];
      const visitor = s.visitors.find(v => v.id === vId);
      if (!visitor) return fail('Wędrowiec wyruszył w drogę.');
      if (!pay(visitor.wants)) return fail('Brakuje produktów z zamówienia.');
      for (const [k, n] of Object.entries(visitor.gives)) {
        s[k] = (s[k] || 0) + n;
      }
      message = `Zamówienie w kramie zrealizowane! Otrzymano zapłatę.`;
      break;
    }

    // Fishing Action
    case 'catch-fish': {
      const sp = (params && params.species) ? params.species : FISH_SPECIES[0];
      const len = (params && params.length) ? params.length : 18;
      const coinGain = sp.coins || 6;
      s.coins += coinGain;
      s.fish = (s.fish || 0) + 1;
      s.fishCaught = s.fishCaught || { gold: 0, carp: 0, trout: 0, pike: 0, total: 0 };
      s.fishCaught[sp.id] = (s.fishCaught[sp.id] || 0) + 1;
      s.fishCaught.total = (s.fishCaught.total || 0) + 1;
      s.fishRecords = s.fishRecords || {};
      if (!s.fishRecords[sp.id] || len > s.fishRecords[sp.id]) {
        s.fishRecords[sp.id] = len;
      }
      message = `Wspaniały połów! Złowiono: ${sp.name} (${len} cm) · +${coinGain} monet!`;
      break;
    }

    // Cooking & Dining Actions
    case 'cook:bread': case 'cook:applePie': case 'cook:carrotSoup': case 'cook:grilledFish': case 'cook:starCookies': case 'cook:honeyTea': case 'cook:gingerbread': case 'cook:pancakes': case 'cook:omelet': case 'cook:lavenderTea': case 'cook:lavenderSachet': {
      const rId = action.split(':')[1];
      const recipe = COOKING_RECIPES.find(r => r.id === rId);
      if (!recipe) return fail('Nieznany przepis.');
      if (!pay(recipe.cost)) return fail('Brakuje składników do ugotowania tej potrawy.');
      s.dishes = s.dishes || {};
      s.dishes[rId] = (s.dishes[rId] || 0) + 1;
      message = `Ugotowano: ${recipe.name}! Danie trafiło do spiżarni.`;
      break;
    }

    case 'eat:bread': case 'eat:applePie': case 'eat:carrotSoup': case 'eat:grilledFish': case 'eat:starCookies': case 'eat:honeyTea': case 'eat:gingerbread': case 'eat:pancakes': case 'eat:omelet': case 'eat:lavenderTea': case 'eat:lavenderSachet': {
      const rId = action.split(':')[1];
      const recipe = COOKING_RECIPES.find(r => r.id === rId);
      if (!recipe) return fail('Nieznane danie.');
      if (!s.dishes || (s.dishes[rId] || 0) < 1) return fail('Nie masz tej potrawy w spiżarni.');
      s.dishes[rId]--;
      const dur = recipe.buffDuration || 45000;
      s.speedBoostUntil = now + dur;
      message = `Zjedzono: ${recipe.name}! Bieg z wiatrem aktywny na ${Math.round(dur / 1000)}s! ⚡`;
      break;
    }

    case 'sell-dish:bread': case 'sell-dish:applePie': case 'sell-dish:carrotSoup': case 'sell-dish:grilledFish': case 'sell-dish:starCookies': case 'sell-dish:honeyTea': case 'sell-dish:gingerbread': case 'sell-dish:pancakes': case 'sell-dish:omelet': case 'sell-dish:lavenderTea': case 'sell-dish:lavenderSachet': {
      const rId = action.split(':')[1];
      const recipe = COOKING_RECIPES.find(r => r.id === rId);
      if (!recipe) return fail('Nieznane danie.');
      if (!s.dishes || (s.dishes[rId] || 0) < 1) return fail('Nie masz tej potrawy do sprzedania.');
      s.dishes[rId]--;
      s.coins += recipe.sellPrice;
      message = `Sprzedano: ${recipe.name} · +${recipe.sellPrice} monet!`;
      break;
    }

    // Cat Petting
    case 'pet-cat': {
      s.petPats = (s.petPats || 0) + 1;
      const phrases = [
        'Kotek Puszek mruczy głośno i ociera się o Twoje buty! ♥',
        'Puszek rozkosznie przeciąga łapki i puszcza wesołe mruczenie! 🐾',
        'Puszek patrzy wielkimi błyszczącymi ślepkami i prosi o jeszcze! ✨'
      ];
      message = phrases[s.petPats % phrases.length];
      break;
    }

    // Periodic Tick (1 sec interval)
    case 'tick': {
      let updated = false;
      // Rabbit births
      if (s.nextBirthAt && now >= s.nextBirthAt) {
        s.nextBirthAt = null;
        if (s.babies < maxBabies(s)) {
          s.babies++;
          s.totalBred = (s.totalBred || 0) + 1;
          message = 'W zagrodzie pojawił się mały króliczek!';
          updated = true;
        }
      }

      // Franek Helper automation: harvests when ready, reseeds if seeds > seedReserve (Section 10)
      if (s.helper) {
        // Auto-watering
        if (s.planted && !s.watered) {
          s.watered = true;
          updated = true;
        }
        // Auto-harvest & reseed
        const growDuration = s.plantedCrop === 'wheat' ? 90_000 : 60_000;
        if (s.planted && s.watered && s.plantedAt && (now - s.plantedAt >= growDuration)) {
          // Harvest
          const plotsCount = 1 + (s.landLevel || 0);
          if (s.plantedCrop === 'wheat') {
            s.wheat += 4 * plotsCount;
          } else {
            s.carrots += 6 * plotsCount;
          }
          s.planted = false;
          s.watered = false;
          s.plantedAt = null;
          updated = true;

          // Reseed if above reserve
          if (s.seeds > (s.seedReserve || 2)) {
            s.seeds--;
            s.planted = true;
            s.plantedAt = now;
            s.watered = Boolean(s.world?.pump || s.helper);
          }
        }
      }

      // Auto-watering pump
      if (s.world?.pump && s.planted && !s.watered) {
        s.watered = true;
        updated = true;
      }

      if (!updated && !message) return { state, ok: false };
      break;
    }

    default:
      return fail('Nieznana akcja.');
  }

  return { state: s, message, ok: true };
}

export const PLACES = {
  ...WORLD_PLACES,
  house: { title: 'Twój dom', short: 'Dom', x: -3, z: -2, approach: [-3, 1.5], label: [-3, 4.8, -2] },
  cat: { title: 'Kotek Puszek', short: 'Puszek ♥', x: -1.7, z: 1.8, approach: [-1.7, 2.5], label: [-1.7, 1.3, 1.8] },
  dog: { title: 'Piesek Łatek', short: 'Łatek 🐕', x: 0.6, z: 2.6, approach: [0.6, 3.8], label: [0.6, 1.3, 2.6] },
  coop: { title: 'Wiejski Kurnik', short: 'Kurnik 🐔', x: 3.6, z: -2.2, approach: [3.6, -1.0], label: [3.6, 1.8, -2.2] },
  beehive: { title: 'Bursztynowa Pasieka', short: 'Pasieka 🐝', x: 6.8, z: 2.4, approach: [6.8, 3.6], label: [6.8, 1.8, 2.4] },
  duck: { title: 'Kaczuszka Kwaczka', short: 'Kaczuszka 🦆', region: 'lake', x: 0, z: 24.5, approach: [0, 26], label: [0, 1.4, 24.5] },
  forest: { title: 'Leśna ścieżka', short: 'Las', x: -9, z: -4, approach: [-7, -1.3], label: [-8.7, 4, -4] },
  mine: { title: 'Kryształowe skały', short: 'Kopalnia', x: 6.8, z: -5.5, approach: [5.5, -3.3], label: [6.6, 3.6, -5.5] },
  garden: { title: 'Ogród uprawny', short: 'Ogród', x: -4.8, z: 5, approach: [-2.8, 5.5], label: [-5, 1.2, 5] },
  helper: { title: 'Pomocnik Franek', short: 'Pomocnik', x: -3.8, z: 6.8, approach: [-3.5, 6.2], label: [-3.8, 1.9, 6.8] },
  pen: { title: 'Bezuch i Karmelka', short: 'Króliki', x: 5.3, z: 2.3, approach: [3, 4.8], label: [5.3, 2.8, 2.3] },
  stall: { title: 'Kram wędrowców', short: 'Kram', x: -1.2, z: 8.5, approach: [-1.2, 7.2], label: [-1.2, 2.6, 8.5] },
  owl: { title: 'Mądra Sowa Klara', short: 'Sowa', x: 1.6, z: -5.0, approach: [1.6, -3.8], label: [1.6, 3.2, -5.0] },
  shop: { title: 'Sklepik pod klamerką', short: 'Sklepik', x: -9, z: 3.8, approach: [-7, 2.6], label: [-9, 3.5, 3.8] },
  land: { title: 'Nowa polana', short: 'Rozbudowa', x: 11, z: 5, approach: [9, 5.8], label: [10.8, 1.6, 5] },
  tractor: { title: 'Traktorek Odkrywcy', short: 'Traktorek 🚜', x: -3.8, z: 2.2, approach: [-3.8, 3.2], label: [-3.8, 1.8, 2.2] },
};

export function actionFor(place, s) {
  switch (place) {
    case 'tractor':
      return {
        label: s.ridingTractor ? 'Zsiądź z traktorka' : 'Wsiądź do traktorka 🚜',
        hint: s.ridingTractor ? 'Zsiądź z powrotem na trawę.' : 'Pyr-pyr! Szybka jazda traktorkiem odkrywcy po farmie i mostach!',
        action: 'tractor',
        icon: 'tractor'
      };

    case 'cat':
      return {
        label: 'Pogłaszcz kotka',
        hint: `Puszek mruczy z zadowolenia (${s.petPats || 0} pogłaskań).`,
        action: 'pet-cat',
        icon: 'rabbit'
      };

    case 'dog':
      return {
        label: 'Pobaw się z Łatkiem 🐕',
        hint: `Rzuć patyk i pogłaszcz pieska (${s.dogPats || 0} zabaw · +2 monety).`,
        action: 'pet-dog',
        icon: 'dog'
      };

    case 'coop': {
      const elapsed = Date.now() - (s.lastEggs || 0);
      const ready = elapsed >= 40000;
      const waitSec = Math.ceil((40000 - elapsed) / 1000);
      return {
        label: ready ? 'Zbierz jajka 🥚' : `Kurki w gniazdach (${waitSec}s)`,
        hint: 'Wiejski Kurnik · świeże jajka na puszyste omlety i naleśniki.',
        action: 'harvest-eggs',
        disabled: !ready,
        icon: 'egg'
      };
    }

    case 'beehive': {
      const elapsed = Date.now() - (s.lastHoney || 0);
      const ready = elapsed >= 45000;
      const waitSec = Math.ceil((45000 - elapsed) / 1000);
      return {
        label: ready ? 'Zbierz miód 🍯' : `Pszczoły pracują (${waitSec}s)`,
        hint: 'Bursztynowa Pasieka · słodki miód do herbatki i pierników.',
        action: 'harvest-honey',
        disabled: !ready,
        icon: 'honey'
      };
    }

    case 'duck': {
      return {
        label: 'Nakarm kaczuszkę 🦆',
        hint: 'Rzuć kaczuszce kłos pszenicy (koszt: 1 pszenica → nagroda: +4 monety).',
        cost: { wheat: 1 },
        action: 'feed-duck',
        disabled: (s.wheat || 0) < 1,
        icon: 'wheat'
      };
    }

    case 'quarryGate': case 'meadowGate': case 'lakeGate': case 'cloudsGate': case 'lavenderGate': {
      const id = place === 'quarryGate' ? 'quarry' : place === 'meadowGate' ? 'meadow' : place === 'lakeGate' ? 'lake' : place === 'cloudsGate' ? 'clouds' : 'lavender';
      const r = REGIONS[id];
      const isUnlocked = s.world?.[id];
      let disabled = false;
      let reqHint = '';
      if (!isUnlocked) {
        if (id === 'quarry' && !s.houseLevel) { disabled = true; reqHint = 'Wymaga: Chatka (Dom 1).'; }
        if (id === 'meadow' && (s.houseLevel < 2 || !s.pen)) { disabled = true; reqHint = 'Wymaga: Dom 2 i Zagroda.'; }
        if (id === 'lake' && s.houseLevel < 2) { disabled = true; reqHint = 'Wymaga: Dom 2 i kuchnia.'; }
        if (id === 'clouds' && (s.houseLevel < 3 || s.penLevel < 2)) { disabled = true; reqHint = 'Wymaga: Dom 3 i Zagroda 2.'; }
        if (id === 'lavender' && s.houseLevel < 2) { disabled = true; reqHint = 'Wymaga: Dom 2 (kuchnia).'; }
      }
      return isUnlocked
        ? { label: 'Wyrusz na wyprawę', hint: r.name, action: `travel:${r.destination}`, icon: r.icon }
        : { label: 'Napraw most / ścieżkę', hint: reqHint || `Połącz farmę z: ${r.name}`, cost: r.cost, action: `unlock:${id}`, disabled, icon: 'land' };
    }

    case 'grove':
      return { label: 'Zbierz drewno', hint: '5 drewna ze starych dębów (odnawia się co 25s).', action: 'grove', icon: 'wood' };
    case 'crystals':
      return { label: 'Wydobądź kryształ', hint: '3 kamienie i 1 błękitny kryształ z żyły.', action: 'crystals', icon: 'crystal' };
    case 'chest':
      return { label: s.world?.chest ? 'Skarb odkryty' : 'Otwórz skrzynkę', hint: '10 monet i 3 paczki nasion.', action: 'chest', disabled: s.world?.chest, icon: 'coins' };

    case 'orchard':
      return s.orchardLevel > 0
        ? { label: 'Zbierz jabłka', hint: `Sad poziomu ${s.orchardLevel} · soczyste czerwone owoce.`, action: 'orchard', icon: 'apple' }
        : { label: 'Zasadź sad jabłoni', hint: 'Sadzonka jabłoni ze Słonecznej Łąki.', action: 'orchard', disabled: !s.world?.meadow, icon: 'apple' };

    case 'windmill':
      return s.world?.windmill
        ? { label: 'Zmiel mąkę', hint: `Młyn · 2 pszenice → 1 worek mąki (masz: ${s.flour || 0} mąki).`, cost: { wheat: 2 }, action: 'mill-flour', icon: 'flour' }
        : { label: 'Napraw młyn', hint: 'Naprawa wiatraka pozwoli mleć pszenicę na mąkę.', cost: COSTS.windmill, action: 'windmill', disabled: !s.world?.meadow, icon: 'windmill' };

    case 'lakeDock':
      return {
        label: 'Zarzuć wędkę 🎣',
        hint: 'Złota Przystań · połów lśniących rybek z pomostu.',
        action: 'fishing-modal',
        disabled: !s.world?.lake,
        icon: 'stall'
      };

    case 'lakePearls':
      return {
        label: 'Wyłów perłę',
        hint: 'Perłowa Zatoczka · lśniące perły z czystego jeziora (+8 monet).',
        action: 'lakePearls',
        disabled: !s.world?.lake,
        icon: 'crystal'
      };

    case 'observatory':
      return {
        label: 'Spójrz przez teleskop',
        hint: 'Obserwatorium · podglądanie gwiazd na nocnym niebie (+10 monet).',
        action: 'observatory',
        disabled: !s.world?.clouds,
        icon: 'star'
      };

    case 'lavenderField': {
      const elapsed = Date.now() - (s.world?.lastLavender || 0);
      const ready = elapsed >= 40000;
      const waitSec = Math.ceil((40000 - elapsed) / 1000);
      return {
        label: ready ? 'Zbierz lawendę 🪻' : `Lawenda kwitnie (${waitSec}s)`,
        hint: 'Pola Lawendy · 2 bukiety fioletowych kwiatów do herbatki i bukietów.',
        action: 'harvest-lavender',
        disabled: !ready || !s.world?.lavender,
        icon: 'flower'
      };
    }

    case 'teaGazebo':
      return {
        label: 'Zaparz herbatkę lawendową 🍵',
        hint: 'Altanka · 1 lawenda + 1 miód → pyszny napar i Bieg z wiatrem (+8 monet)!',
        cost: { lavender: 1, honey: 1 },
        action: 'brew-tea',
        disabled: !s.world?.lavender || (s.lavender || 0) < 1 || (s.honey || 0) < 1,
        icon: 'tea'
      };

    case 'forest':
      return { label: 'Zbierz drewno', hint: '2 kawałki drewna do plecaka.', action: 'forest', icon: 'wood' };
    case 'mine':
      return { label: 'Wydobądź kamień', hint: '2 kamienie do plecaka.', action: 'mine', icon: 'stone' };

    case 'house': {
      const hLvl = s.houseLevel || 0;
      if (hLvl >= 3) {
        return {
          label: 'Pokoje gościnne · Dom odkrywcy',
          hint: 'Warsztat, kuchnia, stół wypraw i goście z krain!',
          action: 'house-modal',
          icon: 'house'
        };
      }
      const cost = houseCost(hLvl);
      const label = hLvl === 0 ? 'Zbuduj chatkę (Poziom 1)' : hLvl === 1 ? 'Rozbuduj o piętro (Poziom 2)' : 'Stwórz Dom Odkrywcy (Poziom 3)';
      const hint = hLvl === 0
        ? 'Odblokuje pokój, garderobę i zagrodę królików.'
        : hLvl === 1
        ? 'Odblokuje kuchnię, pokój Franka i kram wędrowców.'
        : 'Odblokuje stół wypraw, pokoje gościnne i kolekcje.';
      return { label, hint, cost, action: 'house', icon: 'house' };
    }

    case 'pen':
      return s.pen
        ? (s.penLevel < 3 && s.babies >= maxBabies(s)
          ? { label: 'Powiększ zagrodę', hint: `Zagroda pełna (${s.babies}/${maxBabies(s)}). Rozbuduj na poziom ${s.penLevel + 1}.`, cost: penCost(s.penLevel), action: 'pen', icon: 'rabbit' }
          : { label: 'Nakarm króliczki', hint: s.nextBirthAt ? 'Maluszek w drodze!' : `${s.babies}/${maxBabies(s)} maluszków · 2 marchewki.`, cost: { carrots: 2 }, action: 'feed', disabled: !s.nextBirthAt && s.babies >= maxBabies(s), icon: 'rabbit' })
        : { label: 'Zbuduj zagrodę', hint: 'Przytulny dom dla Bezucha i Karmelki.', cost: COSTS.pen1, action: 'pen', disabled: !s.houseLevel, icon: 'rabbit' };

    case 'garden': {
      const plots = 1 + (s.landLevel || 0);
      if (!s.planted) {
        return {
          label: `Posiej na ${plots} ${plots === 1 ? 'grządce' : 'grządkach'}`,
          hint: `Wybierz marchewki (6 szt.) lub pszenicę (4 szt.). Koszt: 1 nasiono.`,
          cost: { seeds: 1 },
          action: 'garden',
          icon: 'seeds'
        };
      }
      if (!s.watered) {
        return {
          label: 'Podlej ogród',
          hint: 'Podlej rosnące grządki, by przyspieszyć wzrost.',
          action: 'garden',
          icon: 'leaf'
        };
      }
      const cropName = s.plantedCrop === 'wheat' ? 'pszenicę' : 'marchewki';
      return {
        label: `Zbierz ${cropName}`,
        hint: `Zbiór ze wszystkich ${plots} grządek ogrodu!`,
        action: 'garden',
        icon: s.plantedCrop === 'wheat' ? 'wheat' : 'carrot'
      };
    }

    case 'helper': {
      const reqMet = s.houseLevel >= 2 && s.world?.quarry;
      return s.helper
        ? { label: 'Pomocnik Franek', hint: 'Franek dogląda upraw i pomaga w siewie z zachowaniem rezerwy nasion.', action: 'helper-status', icon: 'helper' }
        : {
            label: 'Zatrudnij pomocnika',
            hint: !reqMet
              ? 'Wymaga Domu gospodarza (Poziom 2) i odbudowy mostu do Wzgórz.'
              : 'Franek pomoże w podlewaniu i ponownym siewie.',
            cost: COSTS.helper,
            action: 'helper',
            disabled: !reqMet,
            icon: 'helper'
          };
    }

    case 'stall': {
      const reqMet = s.houseLevel >= 2;
      return s.stall
        ? { label: 'Kram wędrowców', hint: 'Odwiedzający z sąsiednich krain kupują plony.', action: 'stall-modal', icon: 'stall' }
        : {
            label: 'Wybuduj kramik',
            hint: !reqMet ? 'Wymaga Domu gospodarza (Poziom 2).' : 'Umożliwia handel zamówieniami z wędrowcami.',
            cost: COSTS.stall,
            action: 'stall',
            disabled: !reqMet,
            icon: 'stall'
          };
    }

    case 'owl':
      return { label: 'Sowa Klara · Zagadki', hint: 'Rozwiąż zagadkę przyrodniczą i zdobądź monety!', action: 'owl-modal', icon: 'owl' };

    case 'shop':
      return { label: 'Otwórz sklepik', hint: 'Nasiona, wymiana plonów i nowe domy dla maluszków.', action: 'shop', icon: 'shop' };

    case 'land':
      return {
        label: `Powiększ ogród (${s.landLevel + 1}/4 grządki)`,
        hint: 'Dodatkowa powierzchnia grządek zwiększa każdy zbiór!',
        cost: landCost(s.landLevel),
        action: 'land',
        disabled: s.landLevel >= 3 || (s.landLevel === 0 && s.houseLevel < 1) || (s.landLevel === 1 && s.houseLevel < 2) || (s.landLevel === 2 && s.houseLevel < 3),
        icon: 'land'
      };

    default:
      return null;
  }
}
