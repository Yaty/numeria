# Portail de jeux d'orthophonie — conception

Demande : un portail de jeux avec comptes et abonnement Stripe à 6 €/an, une dizaine
de jeux classés par domaine de l'orthophonie, un accès « orthophoniste » protégé
contre le partage. Backend en Rails. Carte blanche : les choix ci-dessous sont les
miens et peuvent être revus.

## Architecture

- `portail/` : application Rails 8.1 (vues serveur + Turbo, SQLite, authentification
  Rails 8). Elle gère comptes, abonnements, profils, patients, statistiques, admin.
- Racine (`src/`) : projet Vite/TypeScript des jeux. Une entrée `src/portal.ts`
  est compilée dans `portail/public/jeux/` ; la page d'un jeu (Rails) contient
  `<div id="jeu" data-…>` et le bundle y monte le jeu demandé.
- Les jeux parlent à Rails par JSON : lecture/sauvegarde de l'état (`game_states`)
  et enregistrement des essais (`attempts`). Jeton CSRF Rails.
- La voix neuronale (Piper) est partagée par tous les jeux.

## Comptes

| Type | Accès | Prix |
|---|---|---|
| Famille | profils enfants (4 max), tous les jeux, à la maison | 6 €/an (Stripe Checkout, abonnement annuel) |
| Orthophoniste | patients illimités, jeux en séance, statistiques, réglages | gratuit après vérification du numéro RPPS (choix modifiable) |
| Admin | validation des orthophonistes, comptes signalés | — |

- Stripe : Checkout en mode abonnement (`price_data` annuel 600 centimes EUR),
  webhook signé (`checkout.session.completed`, `customer.subscription.*`,
  `invoice.paid`) qui met à jour `paid_until`, portail client Stripe pour résilier.
  Sans clé Stripe configurée, le paiement est indisponible (message clair) et
  l'admin peut activer un compte à la main.
- Liaison famille ↔ orthophoniste : l'orthophoniste génère un code de liaison pour un
  patient ; le parent le saisit sur le profil de son enfant (consentement explicite,
  révocable). L'orthophoniste voit alors les résultats faits à la maison, peut
  jouer avec ce profil en séance et régler les jeux.

## Garde-fous des comptes orthophonistes

1. Inscription avec numéro RPPS (11 chiffres, clé de Luhn) : compte « en attente »
   jusqu'à validation manuelle par l'admin (lien vers l'annuaire santé).
2. Deux appareils connectés au maximum : une nouvelle connexion déconnecte la plus
   ancienne et l'orthophoniste voit la liste de ses appareils (avec déconnexion).
3. Détection de partage : trop d'adresses IP distinctes ou de connexions sur 24 h →
   compte suspendu automatiquement, à réexaminer par l'admin.
4. Session pro expirée après 12 h ; actions sensibles (exporter, supprimer, régler)
   derrière une re-saisie du mot de passe (15 min).
5. Filigrane nominatif sur l'espace pro, pages `noindex` et `no-store`.
6. Cloisonnement : chaque requête est limitée aux patients du compte (tests).
7. Connexion limitée en débit (rate limit Rails).
8. Données minimales : prénom ou pseudonyme et année de naissance, aucune donnée
   médicale ; journal des connexions.

## Jeux (11)

| Domaine | Jeu | Tâche |
|---|---|---|
| Conscience phonologique | Le train des syllabes | compter les syllabes orales d'un mot |
| | Rimes en folie | trouver le mot qui rime |
| | Le son caché | entendre un son et le situer (début, milieu, fin) |
| Langage écrit | Lecture flash | lire un mot présenté brièvement, choisir l'image |
| | Mots collés | segmenter une phrase écrite sans espaces |
| Orthographe | Les homophones | a/à, et/est, son/sont, on/ont, ces/ses… en contexte |
| Lexique et sémantique | L'intrus | catégorisation : trouver le mot qui n'appartient pas |
| | Contraires et synonymes | relations de sens |
| Morphosyntaxe et compréhension | Phrases en désordre | remettre les mots dans l'ordre |
| | Qui fait quoi ? | compréhension de phrases (passives, relatives) avec images |
| Mémoire et attention | La mémoire des mots | empan auditif : redire une suite de mots |
| Logico-mathématiques | Numéria | le jeu existant |

Chaque jeu : 3 niveaux, progression automatique (≥ 80 % sur 10 essais → niveau
suivant, < 50 % → niveau précédent), niveau forcé possible par l'adulte, consigne
lue à voix haute, images en émojis, essais enregistrés (contexte « séance » ou
« maison »).

## Hors périmètre / à faire par l'humain

- Mise en ligne (hébergeur Rails, domaine, clés Stripe live, SMTP).
- Mentions légales, CGV, politique de confidentialité, et la question de
  l'hébergement de données de santé (HDS) : les résultats d'un patient suivi par un
  orthophoniste peuvent être considérés comme données de santé.
