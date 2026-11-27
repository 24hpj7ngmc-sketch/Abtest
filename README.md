# Abtest

Le jeu du projet Jv : le lobby (l'Île céleste) et ses mini-jeux. L'appli : https://24hpj7ngmc-sketch.github.io/Abtest/

- `index.html`, `manifest.webmanifest`, `icon-*.png` : l'appli publiée par GitHub Pages (ne pas modifier `index.html` à la main : il est fabriqué).
- `atelier/` : les sources du lobby, ses outils et ses tests. Lire `atelier/NOTES.md` en premier.
  - `atelier/ile/ile-pour-lobby.js` (L'Île des Cinq) et `atelier/dt/dt-pour-lobby.js` (Dernier Toit) : les mini-jeux, collés tels quels.
  - Après une modification : `cd atelier && ./publier.sh` (assemble la page et remplace `index.html`), puis le test du sujet (`node tests/…`).
