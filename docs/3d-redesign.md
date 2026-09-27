# Polana 3D — zakres przebudowy

Ta wersja zastępuje płaski obraz planszy sceną Three.js. Świat, dom, sklep, drzewa,
postać i króliki są zbudowane z geometrii 3D. Kamera zmienia położenie względem
świata, a obiekty zasłaniają się zgodnie z głębokością.

## Działająca pętla gry

- Zbierz drewno i kamień, podejdź do fundamentów, zbuduj dom.
- Kolejne poziomy domu dodają piętro, okna, przybudówkę i ganek w geometrii sceny.
- Zagroda ma własne miejsce po prawej stronie polany.
- Kup nasionka, posiej, podlej, zbierz marchewki.
- Nakarm parę królików dwiema marchewkami. Jeden maluszek pojawia się po minucie.
- Zagroda mieści maksymalnie 6 maluszków. Zachowane starsze zapisy z większą
  liczbą nie tracą królików, ale dalsze karmienie jest zablokowane do sprzedaży.
- Sprzedaj maluszka za 5 monet. Dwa króliki założycielskie zostają na farmie.
- Drewno i kamień również można sprzedawać, więc brak monet nie blokuje rozwoju.
- Powiększenie farmy dodaje ziemię i grządkę oraz zwiększa zbiory.

## Sterowanie

Dotknij ziemi lub podpisu miejsca, aby postać do niego podeszła. Trasa omija dom,
zagrodę, sklep i skały. Na telefonie dotknięcie wyznacza cel, a przeciągnięcie palcem prowadzi postać.
Na komputerze działają WASD i strzałki.
Klawisz E wykonuje dostępną akcję przy obiekcie. Dwa palce obracają i przybliżają widok; kółko myszy zmienia przybliżenie. Prawy przycisk myszy z przeciąganiem obraca kamerę; dostępne są też
przyciski kamery. Kompas pokazuje całą farmę.

Postać ma osobno obracane ręce, nogi i głowę. Króliki przemieszczają się po zagrodzie,
podskakują, ruszają łapami i uszami. Te ruchy nie są bujaniem całego obrazka.

## Zapis i granice prototypu

Zapis `farm-v2` jest odczytywany przy pierwszym uruchomieniu. Nowe postępy używają
klucza `eklamerka-world-v1`; stary zapis nie jest usuwany. Przenoszone są zasoby,
postać, poziomy domu, ziemia, ogród i liczba królików. Stary, niespójny zegar
rozmnażania nie jest przenoszony. Nowy zegar jest odporny na odświeżenie strony.

To lokalny prototyp dla jednego gracza. Nie ma serwerowych kont, synchronizacji,
wspólnych wiosek ani prawdziwych transakcji między graczami. Zapis w przeglądarce
nie chroni przed ręczną zmianą zasobów; serwerowa ekonomia wymaga osobnego backendu.

## Struktura

- `src/game.js`: normalizacja, migracja i transakcje ekonomii, niezależne od widoku.
- `src/world/models.js`: geometria budynków, postaci, królików i otoczenia.
- `src/world/scene.js`: renderer, oświetlenie, kamera, animacja, nawigacja i sterowanie.
- `src/main.jsx`, `src/icons.jsx`, `src/style.css`: polski interfejs i sklep.
- `tests/game.test.js`: testy ekonomii i zapisu uruchamiane przez Node.

Scena scala nieruchome elementy według materiału i instancjonuje roślinność.
Rozdzielczość renderowania jest ograniczona, a animacja zatrzymuje się po ukryciu
karty. Płynność na konkretnym telefonie wymaga sprawdzenia na urządzeniu.

## Uruchomienie i budowanie

W katalogu `gra`: `npm ci`, następnie `npm run dev`. Testy: `npm test`.
`npm run build` zapisuje gotowe `index.html`, `assets/`, manifest i service worker
w katalogu `gra`, zgodnie z obecnym wdrażaniem OVH. Nowe wdrożenie powinno zawierać
razem index, wszystkie wskazane przez niego pliki assets oraz nowy service worker.

Nie trzeba pobierać modeli ani bibliotek z CDN w czasie gry. Three.js jest w paczce.


## Świat poza farmą — wersja 0.3.0

Do farmy dołączono trzy rzeczywiste wyspy połączone przechodnimi mostami:
Szumiący Las, Kryształowe Wzgórza i Słoneczną Łąkę. Las jest dostępny od początku.
Wzgórza wymagają domu i naprawy mostu za 10 drewna i 6 kamieni. Most na łąkę kosztuje
14 drewna, 10 kamieni i 3 kryształy. Po naprawieniu mosty pozostają otwarte w zapisie.

Stare dęby dają 5 drewna. Żyła na wzgórzach daje 3 kamienie i 1 kryształ.
Oba miejsca odnawiają zasoby po 12 sekundach. Skrzynka w lesie daje jednorazowo
8 monet i 2 paczuszki nasion. Kryształ można sprzedać w sklepie za 4 monety.

Na łące można zbudować sad oraz wiatrak. Każdy podnosi zbiory marchewek o 2.
Sad pojawia się jako drzewa owocowe; gotowy wiatrak obraca skrzydłami w scenie 3D.
Są to dodatkowe cele, niezależne od trzech wcześniejszych rozszerzeń własnej farmy.

Mapa świata wskazuje bieżącą wyspę, odblokowane przejścia, koszt kolejnych mostów
i liczbę odkrytych miejsc. Wskazanie celu uruchamia chodzenie, nie teleportację.
Przycisk „Do domu” prowadzi z dowolnej odblokowanej wyspy do domu na farmie.
„Zatrzymaj” przerywa marsz. Dane świata są dopisywane do istniejącego zapisu.

Sterowanie mobilne nie ma joysticka. Jeden palec wskazuje lub zmienia trasę;
dwa palce służą wyłącznie do przybliżania i obracania kamery. Gest kamery nie
uruchamia chodzenia po oderwaniu palców. Cel pozostaje widoczny jako znacznik.
