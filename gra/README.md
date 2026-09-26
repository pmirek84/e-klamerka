# E-Klamerka — prototyp PWA

Mobilny prototyp pierwszej farmy z lokalnym zapisem postępu. Zakładka „Wioska” przedstawia koncepcję przyszłych interakcji wieloosobowych, ale nie łączy jeszcze graczy.

W repozytorium e-klamerka gra znajduje się w podkatalogu `gra/`, aby nie zastępować strony głównej. Można ją hostować pod ścieżką `https://e-klamerka.pl/gra/`.

## Uruchomienie

```bash
npm install
npm run dev
```

Do instalacji jako PWA potrzebne jest połączenie HTTPS (poza `localhost`). Zbuduj produkcyjną wersję poleceniem `npm run build`. W hostingu ustaw katalog publikacji na `gra/dist` albo uruchom budowanie z `gra/` i publikuj jego `dist/`.

## Stan prototypu

- farma i postęp zapisują się w `localStorage` przeglądarki;
- brak kont, serwera, synchronizacji między urządzeniami i rzeczywistego multiplayer;
- wioska, sąsiedzi i wspólny most są makietą UX;
- karta testowa znajduje się w `docs/testy-kaja-tola.md`.
