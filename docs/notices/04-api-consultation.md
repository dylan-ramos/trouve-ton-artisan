# Notice 04 — API de consultation

## Architecture d'une requête

```text
route Express -> validation Zod -> service Sequelize -> DTO public -> JSON
```

La route choisit l'action HTTP. Zod refuse les paramètres hors contrat. Le service réalise la recherche et les jointures. Le DTO transforme enfin le modèle interne en réponse publique et exclut toute donnée privée.

## Routes disponibles

```bash
curl http://localhost:5174/api/categories
curl http://localhost:5174/api/artisans/featured
curl 'http://localhost:5174/api/artisans?search=Labbé&page=1&limit=12'
curl http://localhost:5174/api/categories/services/artisans
curl http://localhost:5174/api/artisans/cm-graphisme
```

Le préfixe `/api` appartient au proxy Vite/Nginx. Express reçoit respectivement `/categories` ou `/artisans/...`.

## Validation et erreurs

Les slugs n'acceptent que des minuscules, chiffres et tirets. Une recherche contient 1 à 100 caractères. La page commence à 1 et la limite reste comprise entre 1 et 50. L'objet Zod est strict : un paramètre inconnu produit HTTP 422 au lieu d'être silencieusement ignoré.

Les erreurs suivent une forme stable :

```json
{ "error": { "status": 404, "message": "Artisan introuvable." } }
```

Les erreurs internes deviennent un message générique en production et ne révèlent ni SQL, ni stack technique.

L'API autorise 120 requêtes par minute et par adresse cliente. Au-delà, elle répond avec HTTP 429 et un message JSON stable. Les en-têtes standard `RateLimit` indiquent au client quand il peut reprendre ses appels. La route de santé reste hors de cette limite afin que la supervision puisse continuer à fonctionner.

## Pagination

Les collections renvoient `data` et `meta` : page actuelle, limite, total et nombre total de pages. Une limite serveur évite qu'une requête récupère une quantité non bornée de données.

## Recherche

La collation MySQL choisie est insensible à la casse et aux accents. Les caractères `%`, `_` et `\` sont échappés avant `LIKE` afin qu'ils soient recherchés comme du texte et non utilisés comme jokers SQL. Sequelize conserve le paramétrage de la requête.

## DTO et confidentialité

Un modèle représente la base ; un DTO représente le contrat HTTP. `toPublicArtisan` convertit notamment `DECIMAL` en nombre et construit la spécialité avec sa catégorie. Il ne copie jamais `contactEmail`. Cette liste blanche est plus sûre qu'une suppression après sérialisation.

## Vérification

```bash
make quality-check
make integration-test
make up
make check
curl 'http://localhost:5174/api/artisans?limit=1'
make down
```

Le contrat de référence est également décrit dans `docs/api/openapi.yaml`.
