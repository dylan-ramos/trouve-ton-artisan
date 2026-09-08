# Notice 07 — Catalogue et recherche

## Deux parcours, une seule mécanique

`CatalogPage` lit soit le slug de catégorie dans le chemin, soit le nom recherché dans la query string. Ces URL restent partageables et rechargeables : aucune recherche importante n'est conservée uniquement dans l'état React.

```text
/artisans/services?page=1
/recherche?search=Labbé&page=1
            │
            └── CatalogResults -> API -> ArtisanCard[] -> Pagination
```

La catégorie affichée est retrouvée dans `/api/categories` plutôt que déduite artificiellement de son slug. Les libellés restent ainsi pilotés par la base de données.

## Construction sûre des URL

Le client API utilise `URLSearchParams` pour encoder les accents, espaces et caractères ayant un sens particulier dans une URL. Le slug placé dans le chemin passe par `encodeURIComponent`. Le serveur conserve ensuite sa validation Zod et ses requêtes Sequelize paramétrées.

Une recherche vide affiche une invitation sans appeler l'API. Une valeur de plus de 100 caractères est également refusée côté interface ; cette validation améliore le retour utilisateur mais ne remplace pas la validation serveur.

## Navigation rapide et réponses obsolètes

Chaque chargement possède un `AbortController` et un indicateur `isCurrent`. Lors d'un changement de catégorie, recherche ou page, React démonte l'ancien composant : sa requête est annulée et sa réponse éventuelle est ignorée. Une réponse lente ne peut donc pas remplacer les résultats plus récents.

La clé du composant inclut le mode, la valeur, la page et le numéro de tentative. Elle recrée un état de chargement propre à chaque navigation et permet au bouton « Réessayer » de relancer la requête sans dupliquer la logique réseau.

## Pagination et accessibilité

La pagination conserve tous les paramètres présents dans l'URL et ne remplace que `page`. Les liens précédent et suivant utilisent `rel`, la page courante est annoncée avec `aria-current` et les extrémités désactivées ne sont plus des liens activables.

Le nombre de résultats est placé dans une région `aria-live`. Le fil d'Ariane est une navigation nommée et la page active porte `aria-current="page"`. Les cartes et notes accessibles sont les mêmes que sur l'accueil.

## Styles

Les règles spécifiques résident dans `styles/pages/_catalog.scss`. Les grilles et cartes restent dans leur module de composant afin de ne pas les recopier entre l'accueil et le catalogue.

## Commandes de vérification

```bash
make quality-check
make prod-build
make up
curl 'http://localhost:5174/api/categories/services/artisans?page=1'
curl 'http://localhost:5174/api/artisans?search=Labbé&page=1'
make down
```

Les tests parcourent les quatre catégories, une recherche accentuée avec caractères spéciaux, l'absence de résultat, une valeur trop longue et l'arrivée tardive d'une ancienne réponse.
