# Notice 05 — Design system et gabarit commun

## Organisation

Le gabarit `AppLayout` entoure toutes les pages avec le header, la zone principale et le footer. React Router place la page active dans `Outlet`. Cette séparation évite de recopier la structure et les repères HTML sur chaque écran.

```text
AppLayout
├── Header -> navigation API + recherche
├── main -> page active
└── Footer -> contact + informations légales
```

## Tokens Sass et Bootstrap

`_tokens.scss` centralise les couleurs, la police, les rayons, l'ombre et le focus. Ces variables personnalisent Bootstrap avec `@use ... with` avant sa compilation. Modifier un token met donc à jour les composants Bootstrap et les composants propres au site au même endroit.

La feuille est mobile first : les règles de base correspondent aux petits écrans, puis les media queries enrichissent la mise en page à partir de 768 et 992 px. Les éléments interactifs font au minimum 44 à 48 px de haut et le navigateur ne descend jamais sous une largeur utile de 320 px.

Toutes les images utilisent `max-width: 100%` et `height: auto` afin de conserver leurs proportions sans dépasser leur conteneur. Le logo fournit aussi ses dimensions intrinsèques dans le HTML : le navigateur peut réserver le bon ratio avant son téléchargement, ce qui limite les déplacements de mise en page sans imposer une hauteur CSS.

Le remplacement de Graphik par Montserrat est une décision de conception explicite, pas une erreur d'intégration. Graphik est propriétaire et ne peut pas être redistribuée avec les sources disponibles. Montserrat présente une construction géométrique adaptée à l'identité du site et sa licence libre SIL OFL 1.1 permet de l'auto-héberger et de la distribuer avec le projet.

La fonte variable fournit toutes les graisses avec un fichier unique, chargé avec `font-display: swap`. La pile Arial, Helvetica, sans-serif garantit que le texte reste visible pendant son chargement et aucune requête n'est envoyée à un fournisseur de fontes externe.

## Navigation accessible

Le lien d'évitement devient visible au focus et conduit directement à `main`. Le bouton mobile expose `aria-expanded` et `aria-controls`, ce qui annonce son état aux technologies d'assistance. Les liens utilisent `NavLink` : React Router ajoute `aria-current="page"` à la destination active. Le focus ne dépend jamais uniquement de la couleur.

Le menu reste piloté par React. Il ne dépend pas du JavaScript Bootstrap et conserve ainsi une seule source de vérité pour son état ouvert ou fermé.

## Client API et états

`api-client.ts` centralise le préfixe `/api`, l'en-tête JSON et la transformation des échecs HTTP. Le header demande les catégories à l'API avec un `AbortController`, annulé si le composant disparaît. Les composants `LoadingState` et `ErrorState` fournissent des annonces cohérentes et seront réutilisés par les pages suivantes.

La recherche supprime les espaces inutiles, refuse une valeur vide et encode la saisie avec `encodeURIComponent` avant de la placer dans l'URL. L'URL devient partageable et la page de résultats pourra lire ce même paramètre.

## Commandes de vérification

```bash
make quality-check
make prod-build
make up
make check
make down
```

Les tests de composants contrôlent les landmarks, le lien d'évitement, le chargement des catégories, l'état annoncé du menu mobile et la navigation de recherche.
