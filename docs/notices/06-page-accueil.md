# Notice 06 — Page d'accueil

## Composition de la page

La page est découpée en trois sections ayant chacune un objectif précis : présenter le service et sa recherche, expliquer le parcours en quatre étapes, puis proposer les artisans du mois. Un seul `h1` décrit la page ; les deux rubriques suivantes utilisent des `h2`.

```text
HomePage
├── présentation + SearchForm
├── parcours en quatre étapes
└── artisans du mois
    ├── LoadingState
    ├── ErrorState + nouvelle tentative
    ├── EmptyState
    └── ArtisanCard × 3
```

## Données dynamiques

Les artisans du mois ne sont jamais recopiés dans React. `getFeaturedArtisans` interroge `/api/artisans/featured`, puis la page sélectionne un état exclusif : chargement, succès ou erreur. Une requête est annulée avec `AbortController` lorsque la page disparaît, ce qui évite un traitement devenu inutile.

Le bouton « Réessayer » incrémente une clé de requête et relance le même effet. Cette approche garde la logique réseau dans un seul endroit et évite de dupliquer l'appel initial dans le gestionnaire du bouton.

## Carte et notation

`ArtisanCard` reçoit un objet typé et reste utilisable sur l'accueil comme dans le futur catalogue. Le lien étendu rend toute la surface de la carte cliquable sans imbriquer plusieurs éléments interactifs.

Les étoiles sont décoratives et masquées aux technologies d'assistance. La valeur textuelle « Note : 4,8 sur 5 » est toujours exposée : l'information ne dépend donc ni de la forme des étoiles ni de leur couleur. La valeur est bornée entre 0 et 5 avant affichage.

## Responsive et métadonnées

La grille utilise une colonne sur mobile, deux sur tablette et trois sur ordinateur. Les étapes suivent une progression similaire jusqu'à quatre colonnes. `minmax(0, 1fr)` autorise les colonnes à rétrécir sans créer de débordement horizontal.

Le composant `Seo` met à jour le titre du document et sa description lors de l'affichage de la page. Cette responsabilité est isolée afin que les pages suivantes puissent fournir leurs propres métadonnées sans manipuler directement le DOM.

## Organisation des styles

`main.scss` est uniquement le point d'entrée : il configure Bootstrap puis assemble des modules Sass répartis par responsabilité.

```text
styles/
├── _tokens.scss
├── base/_global.scss
├── layout/_header.scss et _footer.scss
├── components/_search-form.scss, _states.scss et _artisan-card.scss
├── pages/_home.scss
└── main.scss
```

Chaque module importe explicitement les tokens dont il dépend. Les styles d'un nouveau composant ou d'une nouvelle page pourront ainsi évoluer sans alourdir le point d'entrée ni mélanger les responsabilités.

## Commandes de vérification

```bash
make quality-check
make prod-build
make up
make check
curl http://localhost:5174/api/artisans/featured
make down
```

Les tests couvrent les quatre textes attendus, les trois cartes, la note accessible, le chargement, la panne avec nouvelle tentative et l'absence inattendue de données.
