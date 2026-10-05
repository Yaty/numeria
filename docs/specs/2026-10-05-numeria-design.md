# Numéria — conception (v1)

Source : document « Jeu vidéo » d'Erell Montanuy (2026). Carte blanche donnée pour
l'implémentation ; ce fichier consigne les choix d'interprétation pour relecture.

## Intention

Jeu de logico-mathématiques pour patients en orthophonie, dès 6 ans, utilisé
**en séance** (avec l'orthophoniste) et **à la maison**. Fondé sur le **triple code
de Dehaene** : le jeu fait travailler les relations entre les trois codes.

| Code | Où il apparaît dans le jeu |
|---|---|
| Analogique (quantité) | Le monde : blocs de base dix (cube, barre, plaque) dans chaque rang |
| Arabe (chiffres) | Le tableau de numération en bas d'écran (classes × rangs C/D/U) |
| Verbal (mots) | Bandeau en haut : le nombre écrit en lettres, lu à voix haute sur demande |

## Plateforme

- Application web (Vite + TypeScript, sans framework), jouable sur tablette ou ordinateur, hors ligne une fois chargée.
- Police Andika (conçue pour les lecteurs débutants), embarquée.
- Sauvegarde locale (localStorage) par profil patient ; **export/import d'un fichier
  de profil** pour transporter la progression entre le cabinet et la maison.

## Univers (niveaux 1, 2, 3)

- Le monde est une bande de **zones = classes** : (décimales) · unités · milliers ·
  millions · milliards. Chaque zone montre toujours ses 3 rangs (centaines, dizaines, unités).
- **Déplacement de droite à gauche uniquement** : on ne revient pas en arrière. Chaque
  nouvelle classe s'ouvre avec un **effet de dézoom** : la classe précédente rapetisse à
  droite, le monde devient plus grand.
- **Incrémental** : toucher le bouton « Produire » fabrique une unité. On achète des
  usines qui produisent automatiquement.
- **Échanges** : quand un rang contient 10 éléments, on les échange contre 1 élément
  du rang de gauche. Un rang déborde à 19 : les usines s'arrêtent tant qu'on n'a pas
  échangé. Après 10 échanges manuels sur un rang, on peut acheter une
  « machine à échanger » qui automatise ce rang (réglable par l'orthophoniste :
  manuel→automatisable / toujours manuel / automatique).
- **Passer à la classe suivante** = échanger 10 centaines → 1 unité de la classe
  suivante (ex. 10 centaines → 1 unité de mille), ce qui ouvre la zone et déclenche le dézoom.
- Dans la classe des unités, seule l'usine à unités existe. **À partir des milliers,
  les usines se diversifient** : on peut construire des usines à dizaines, centaines,
  unités de mille, etc. (jusqu'au rang le plus élevé ouvert).
- Payer une usine retire sa valeur du nombre total ; le tableau est alors recomposé
  (les « cassages » d'unités supérieures sont faits automatiquement).
- **Niveau 1** : on démarre aux unités, tout se découvre.
  **Niveau 2** : toutes les classes entières sont ouvertes, pas les décimales.
  **Niveau 3** : toutes les classes ouvertes, y compris les décimales (dixièmes,
  centièmes, millièmes), à droite des unités.

## Détective (niveaux A à E)

- De temps en temps, une usine tombe **en panne** (loupe 🔍). La réparer = résoudre un problème.
  Réussite → usine réparée et bonus de production ×2 pendant 30 s. Erreur → indice
  (schéma en barres de la méthode Singapour ou représentation en blocs), puis nouvel essai.
  Une usine en panne ne produit plus.
- Les nombres des problèmes grandissent avec les classes ouvertes (plafonnés par niveau).
- **Triple code dans les problèmes** : les données peuvent être présentées en chiffres,
  en lettres ou en blocs ; la réponse peut se donner au pavé numérique, en choisissant
  la bonne écriture en lettres ou la bonne collection de blocs. Les codes actifs sont
  réglables.
- Types de problèmes :
  - **Transcodage** (tous niveaux) : passer d'un code à l'autre.
  - **A** : + et − (énoncés avec schéma en barres partie-tout / comparaison).
  - **B** : × et ÷ (tables, multiplications par 10/100/1000), **aire** (quadrillage).
  - **C** : mélange A + B, **proportionnalité** (tableau).
  - **D** : **fonctions** (« machine à nombres » : trouver la sortie ou la règle).
  - **E** : **puissances** (puissances de 10 ↔ classes, carrés, cubes).
- Un niveau inclut les précédents : 60 % de problèmes du niveau courant, 40 % révision.

## Positionnement (questionnaire)

Au premier lancement d'un profil : une série courte de questions, de plus en plus
difficiles (lecture de nombres, valeur des rangs, +, −, ×, ÷, proportionnalité,
fonction, puissance). On s'arrête après 2 erreurs dans un même palier. Le résultat
propose un niveau d'univers (1/2/3) et un niveau de problèmes (A–E) ; l'orthophoniste
peut les modifier.

## Espace orthophoniste

Protégé par un code à 4 chiffres (défini à la première ouverture). Par profil :
niveau d'univers, niveau de problèmes, mode d'échange, codes actifs, fréquence des
pannes, lecture vocale, orthographe des nombres (rectifiée 1990 par défaut /
traditionnelle), statistiques (réussites par type de problème, codes, dernières
réponses), export/import, réinitialisation.

## Hors périmètre v1

Comptes en ligne, synchronisation réseau, enregistrement audio, nombres négatifs,
gains hors ligne, multijoueur.
