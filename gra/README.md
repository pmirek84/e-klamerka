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

Bieżąca wersja: 0.2.0, pamięć aplikacji `eklamerka-world-3d-v1`.
Zapis poprzedniej gry nie jest usuwany. Grafika wymaga WebGL2.

## Sprawdzone

7 testów logiki gry; automatyczna próba zbierania, budowy trzech poziomów domu,
ogrodu, narodzin, sprzedaży, zapisu po odświeżeniu, powiększenia terenu i joysticka.
Testy przeglądarkowe odbyły się w Chromium z emulacją ekranu telefonu.
Wydajność na fizycznym telefonie nie została potwierdzona.
