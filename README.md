# VORA — Site vitrine plomberie, Voreppe (38340)

Site statique (HTML / CSS / JS, sans build) au style « chambre noire » éditorial :
toile noyer `#100904`, typographie crème `#ffedd7`, une seule couleur braise `#dc5000`
réservée aux crédits, et une pièce de plomberie en 3D (coude cuivre + vanne ¼ de tour)
traitée comme un objet de musée.

## Lancer en local

```bash
npx http-server -p 8080 .
# puis ouvrir http://localhost:8080
```

Un serveur est nécessaire (les modules ES ne se chargent pas en `file://`).
Pour publier : GitHub Pages (Settings → Pages → branche + dossier racine), Netlify ou tout hébergement statique.

## Structure

| Fichier | Rôle |
|---|---|
| `index.html` | Contenu des 8 sections + pied de page |
| `styles.css` | Jetons de design (couleurs, typo, rayons) et mise en page |
| `main.js` | Loader, scroll fluide, animations au scroll, effets de survol, trajectoire de l'objet 3D |
| `scene.js` | Modélisation et rendu Three.js de la pièce |
| `vendor/` | GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.13, Three.js r160 (embarqués, aucun CDN requis) |

## Animations

- **Loader** compteur 000 → 100, puis rideau et lettres du logo qui montent.
- **Objet 3D** fixe qui change de pose à chaque section (rotation, position, échelle),
  suit légèrement la souris, et **se démonte pièce par pièce** dans la section « Anatomie » (épinglée).
- **Titres** révélés mot à mot, **corps de texte** qui s'allume au rythme du scroll.
- **Méthode** : défilement horizontal épinglé, cartes qui penchent selon la vitesse.
- **Compteurs**, séparateurs pointillés tracés au scroll, **bandeau des communes** dont la vitesse et le sens suivent le scroll.
- **Survol** : curseur personnalisé avec libellé, boutons magnétiques, texte qui défile (« roll »),
  aperçu flottant qui suit le curseur sur la liste des services, halo circulaire sur les cartes,
  radar de la zone d'intervention (survoler les points pour voir les communes).
- `prefers-reduced-motion` est respecté ; si le JS ou WebGL échoue, tout le contenu reste lisible.

## À personnaliser avant mise en ligne

Ces valeurs sont des **exemples** à remplacer par les vôtres :

- Nom **VORA** (logo, titre, pied de page) — rechercher `VORA` dans `index.html`.
- Téléphone `04 00 00 00 00` / `tel:+33400000000` (hero, contact).
- Email `contact@vora-plomberie.fr` (`index.html` et `main.js`, fonction `setupForm`).
- Horaires, SIRET, n° d'assurance décennale (pied de page).
- Chiffres de la section « Chiffres » (7 j/7, 15 km, 100 % devis écrit) : à ajuster selon votre réalité.

Le formulaire ouvre la messagerie du visiteur avec la demande pré-remplie (`mailto:`).
Pour recevoir les demandes sans messagerie, branchez-le sur un service comme Formspree ou Netlify Forms.
