# E-Klamerka — prototyp gry PWA

Mobilna, dotykowa gra o rozwijaniu własnej farmy. Kod źródłowy znajduje się w `src/`, a grafiki środowiska w `public/`.

## Build i publikacja

GitHub Actions buduje aplikację po zmianach w `gra/` i zapisuje gotową wersję w katalogu `gra/` repozytorium: `index.html`, `assets/` oraz pliki statyczne. Build nie publikuje strony automatycznie na OVH.

Aby zaktualizować OVH, wgraj do katalogu serwera `/gra/` wygenerowane pliki: `index.html`, cały katalog `assets/`, `cottage.webp`, `farm-day1.webp`, `rabbit-yard.webp`, `raised-garden.webp`, `icon.svg`, `manifest.webmanifest` i `sw.js`. Nie wgrywaj katalogów źródłowych `src/` ani `public/`. Postacie są osadzone w skrypcie buildu.

Build lokalny: w katalogu `gra/` uruchom `npm ci`, a potem `npm run build`.

## Stan prototypu

- postęp farmy zapisuje się lokalnie w przeglądarce;
- sąsiedzkie farmy, wizyty i zaproszenia do wioski są demonstracją interfejsu — nie synchronizują się między graczami;
- logowanie, konta, serwer i prawdziwy multiplayer wymagają osobnego backendu;
- karta testowa: `docs/testy-kaja-tola.md`.
