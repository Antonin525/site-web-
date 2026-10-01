# Faîte — site vitrine pour une entreprise de charpente

Site statique (HTML / CSS / JS, sans étape de build) au style « observatoire de nuit » :
toile noire `#010101`, grands titres serif, étiquettes mono façon instrument de mesure,
et des **images 3D très claires** (bois blond sur fond studio) présentées dans des cadres.
Le seul accent coloré, un cyan, n'existe que *dans* les images (le trait du laser de chantier).

## Lancer en local

```bash
cd charpente
npx http-server -p 8080 .
# puis http://localhost:8080
```

Un serveur est nécessaire (modules ES). Publication : GitHub Pages, Netlify ou tout hébergement statique.
Tout est inclus dans le dossier (polices, librairies, images) : aucun appel à un service externe.

## Ce qui est animé

| Section | Effets |
|---|---|
| Chargement | compteur réel (polices → moteur 3D → première image), rideau |
| Bandeau 3D | ouverture en volet, **maison à ossature bois qui se monte pièce par pièce** en temps réel, laser rotatif cyan qui balaie les montants, caméra qui suit la souris, glisser pour pivoter, repli en grand cadre arrondi au scroll |
| Savoir-faire / titres | lettres monumentales qui se révèlent (flou → net) et dérivent au scroll, lignes de texte masquées, filets qui se tracent, compteurs |
| Anatomie | **ferme 3D interactive** : 3 types (poinçon, fermette, entrait retroussé), étiquettes reliées aux pièces par des traits qui suivent la 3D, survol = pièce isolée et soulignée en cyan, vue éclatée, rotation au glisser |
| Méthode | section collante pilotée par le scroll : **relevé laser (nuage de points) → épure filaire → pièces taillées en pile → levage (les pièces volent à leur place) → liteaux et couverture zinc** |
| Ouvrages | 6 rendus haute qualité, balayage d'une image à l'autre au survol ou au scroll, cadre qui s'incline en 3D sous la souris |
| Partout | curseur « réticule » avec coordonnées, pastilles magnétiques, libellés qui défilent au survol, en-tête qui se masque en descendant |

Le site respecte `prefers-reduced-motion`. Sans WebGL, les rendus fixes remplacent la 3D temps réel.
La résolution 3D baisse automatiquement si l'ordinateur peine.

## Structure

| Fichier | Rôle |
|---|---|
| `index.html` | contenu |
| `css/style.css` | jetons de design (couleurs, typographie, rayons) et mise en page |
| `js/main.js` | chargement, scroll fluide (Lenis), animations (GSAP), survols, branchement 3D |
| `js/3d/kit.js` | texture de bois procédurale, pièces de charpente, éclairage studio, trait laser |
| `js/3d/models.js` | modèles : fermes, toitures, maisons, halle en lamellé-collé, pergola, surélévation, rénovation |
| `js/3d/views.js` | vues temps réel (bandeau, anatomie, méthode) |
| `js/3d/offline.js`, `tools/` | générateur des images fixes de `img/` |
| `vendor/` | three.js r160, GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.13 |
| `fonts/` | Cormorant Garamond, Inter, IBM Plex Mono (licence OFL) |

## Régénérer les images

Les images de `img/` sont calculées à partir des mêmes modèles 3D (ombres douces et occlusion
ambiante accumulées sur 48 passes). Après une modification d'un modèle ou d'un cadrage :

```bash
cd charpente
npm i -D playwright && npx playwright install chromium
node tools/render.mjs              # toutes les images
node tools/render.mjs pergola      # une seule
node tools/render.mjs --preview    # aperçus rapides dans tools/preview/
# ajouter --cpu sur une machine sans carte graphique
```

## À personnaliser avant mise en ligne

Ces éléments sont des **exemples** à remplacer :

- le nom **Faîte** (logo, titres, pied de page) ;
- téléphone `04 00 00 00 00`, email `contact@faite-charpente.fr` (`index.html` et `js/main.js`),
  adresse de l'atelier (« Isère (38) » par défaut), horaires ;
- SIRET, numéro d'assurance décennale, mentions légales ;
- les affirmations à vérifier : « Garantie décennale », « Maquette validée avant taille »,
  classes de bois (C24, GL24h), essences citées, scanner laser, taille sur machine à commande numérique ;
- les rendus de la section *Ouvrages* sont des **exemples de typologies**, pas des chantiers réalisés
  (c'est indiqué sur le site) : remplacez-les par vos photos ou vos propres maquettes si vous le souhaitez.

Le formulaire ouvre la messagerie du visiteur avec la demande pré-remplie (`mailto:`).
Pour recevoir les demandes directement, branchez-le sur un service comme Formspree ou Netlify Forms.
