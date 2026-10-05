# Ludortho — jeux d'orthophonie en ligne

Portail de jeux pour l'orthophonie (4-12 ans) :
- comptes **famille** avec abonnement Stripe à 6 €/an ;
- comptes **orthophoniste** vérifiés (RPPS) et protégés contre le partage ;
- une douzaine de jeux, classés par domaine.

Conception : [`docs/specs/2026-10-05-portail-design.md`](docs/specs/2026-10-05-portail-design.md).
Numéria, le jeu de numération d'origine : [`docs/specs/2026-10-05-numeria-design.md`](docs/specs/2026-10-05-numeria-design.md).

## Organisation

- `portail/` — application Rails 8 :
  - comptes, abonnements, profils enfants, patients ;
  - statistiques, administration.
- `src/` — jeux en TypeScript (Vite) :
  - `src/portal/` : contrat entre Rails et les jeux, moteur commun (`quiz.ts`) ;
  - `src/games/<slug>.ts` : un fichier par jeu ;
  - `src/core/`, `src/ui/` : Numéria.
- `portail/config/games.yml` — fiches des jeux : titre, domaine, âge, objectifs cliniques.

## Développement

```bash
npm install && (cd portail && bundle install && bin/rails db:setup)
npm run build:portail            # compile les jeux dans portail/public/jeux (ou watch:portail)
cd portail && bin/rails server   # http://localhost:3000
```

Comptes de démonstration (`db:seed`) : `famille@demo.test`, `ortho@demo.test`, `admin@demo.test`.
Le mot de passe est `motdepasse-demo`.

- Banc d'essai d'un jeu sans Rails : `npm run dev`, puis `/play.html?jeu=<slug>`.
- Tests :
  - `npm test` (jeux, moteur Numéria) ;
  - `cd portail && bin/rails test` (comptes, garde-fous, Stripe, API).

## Mise en production

Image Docker à la racine (`docker build -t ludortho .`). Elle compile les jeux puis Rails.
Base SQLite dans `/rails/storage`, à monter sur un volume persistant.

Variables d'environnement :

| Variable | Rôle |
|---|---|
| `RAILS_MASTER_KEY` | clé de `portail/config/master.key` |
| `APP_HOST` | domaine (liens des e-mails) |
| `STRIPE_SECRET_KEY` | clé secrète Stripe (`sk_live_…` ou `sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | secret du webhook `https://<domaine>/stripe/webhook` |
| `STRIPE_PRICE_ID` | facultatif : prix annuel créé dans Stripe (sinon 6 €/an à la volée) |
| `SMTP_ADDRESS`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `MAIL_FROM` | e-mails (mot de passe oublié) |
| `PORTAIL_NOM`, `PRIX_CENTIMES` | nom du site, prix |

Événements du webhook Stripe : `checkout.session.completed`, `customer.subscription.created`,
`customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`.
Activer aussi le **portail client** dans Stripe (Paramètres → Billing → Portail client)
pour la résiliation.

Créer l'administrateur :
`bin/rails portail:admin EMAIL=… PASSWORD=… NAME=…`.

## Garde-fous des comptes orthophonistes

- Numéro RPPS/ADELI vérifié à la main par l'admin avant l'ouverture.
- 2 appareils au plus (le plus ancien est déconnecté). Session de 12 h.
- Suspension automatique au-delà de 4 adresses IP ou 12 connexions en 24 h.
- Filigrane nominatif, pages non indexées et non mises en cache, journal des connexions.
- Mot de passe ressaisi pour les actions sensibles.
