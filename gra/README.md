# E-Klamerka — Polana 3D

Mobilna gra PWA: prawdziwa scena 3D, animowana postać i króliki, budowa i rozbudowa,
ogród oraz sklep z zapisem transakcji. Postęp jest lokalny, bez serwerowych kont.

## Praca nad grą

W folderze `gra`: `npm ci`, `npm run dev`. Build: `npm run build`.
Testy ekonomii: `npm test`. Testy w przeglądarce: `npx playwright install chromium`,
a następnie `npm run test:browser` (uruchamia własny lokalny serwer).

Opis sterowania i migracji zapisu: `docs/3d-redesign.md`.

## Wdrożenie przez istniejące repozytorium

Ta paczka zawiera folder `gra` z kodem i gotową kompilacją. Skopiuj go do swojego
lokalnego repozytorium `e-klamerka`, zastępując pliki. W GitHub Desktop sprawdź
zmiany, zrób commit i Push. Po pojawieniu się zmian na gałęzi wdrażanej przez OVH
uruchom wdrożenie. Samo skopiowanie plików na komputer nie zmienia strony.

Bieżąca wersja: 0.3.0, pamięć aplikacji `eklamerka-world-3d-v2`.
Zapis poprzedniej gry nie jest usuwany. Grafika wymaga WebGL2.

## Sprawdzone

14 testów logiki gry i nawigacji; automatyczna próba zbierania, budowy trzech poziomów domu,
ogrodu, narodzin, sprzedaży, zapisu po odświeżeniu, powiększenia terenu i sterowania dotykowego.
Testy przeglądarkowe odbyły się w Chromium z emulacją ekranu telefonu.
Wydajność na fizycznym telefonie nie została potwierdzona.


Wersja 0.3.0 dodaje trzy wyspy, naprawę mostów, kryształy, sad, wiatrak i mapę.
Joystick został zastąpiony gestami na planszy. Testy świata i gestów:
`npm run test:world`. Testy korzystają z Chromium instalowanego przez Playwright.
Współdzielony świat i konta serwerowe nie są jeszcze częścią tej wersji.
