# Numéria

Jeu de logico-mathématiques pour l'orthophonie (dès 6 ans), fondé sur le triple
code de Dehaene. Conception détaillée : [`docs/specs/2026-10-05-numeria-design.md`](docs/specs/2026-10-05-numeria-design.md).

## Lancer

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # tests du moteur (numération, échanges, problèmes, profils)
npm run build    # version statique dans dist/
```

En ligne : **https://yaty.github.io/numeria/** — pour publier une nouvelle version :
`npm run deploy` (teste, compile, puis publie sur la branche `gh-pages`).

Le dossier `dist/` est un site statique : il peut être déposé sur n'importe quel
hébergement (Netlify, GitHub Pages, serveur du cabinet…) et ouvert sur tablette.
Les données restent dans le navigateur de l'appareil ; pour passer du cabinet à la
maison, utiliser **Espace orthophoniste → Exporter**, puis **Importer** sur l'autre appareil.

## Organisation

- `src/core/` — moteur sans interface, testé : écriture des nombres en lettres
  (`french.ts`), numération (`numbers.ts`), jeu incrémental (`economy.ts`), problèmes
  du détective A–E (`problems.ts`), questionnaire (`placement.ts`), profils (`profile.ts`).
- `src/ui/` — interface : rendu des trois codes (`codes.ts`), fenêtre d'enquête
  (`problemView.ts`), écrans (`screens/`).
