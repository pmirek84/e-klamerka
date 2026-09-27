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
zagrodę, sklep i skały. Na telefonie działa joystick; na komputerze WASD i strzałki.
Klawisz E wykonuje dostępną akcję przy obiekcie. Dwa palce lub kółko myszy zmieniają
przybliżenie. Prawy przycisk myszy z przeciąganiem obraca kamerę; dostępne są też
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
