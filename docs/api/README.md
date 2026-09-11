# Utiliser l’API

L’API est accessible sous `/api` sur la même origine que le frontend. Le [contrat OpenAPI](openapi.yaml) décrit les routes et paramètres ; aucun jeton client n’est requis. L’adresse privée d’un artisan n’appartient jamais au DTO public.

## Lecture

Exemples pour le port local 5174 (adapter à `FRONTEND_PORT`) :

```bash
curl --fail http://127.0.0.1:5174/api/health
curl --fail http://127.0.0.1:5174/api/categories
curl --fail 'http://127.0.0.1:5174/api/artisans?page=2&limit=12'
curl --fail --get --data-urlencode 'search=Labbé' http://127.0.0.1:5174/api/artisans
curl --fail http://127.0.0.1:5174/api/categories/alimentation/artisans
curl --fail http://127.0.0.1:5174/api/artisans/featured
curl --fail http://127.0.0.1:5174/api/artisans/chocolaterie-labbe
```

Une liste renvoie `{ "data": [], "meta": { "page": 1, "limit": 12, "total": 0, "totalPages": 0 } }` lorsqu’aucun artisan ne correspond. Une fiche renvoie `{ "data": { ... } }`. La pagination commence à 1, accepte au plus 50 éléments par page et 10 000 pages ; une page au-delà du résultat contient une liste vide. La recherche par nom ignore casse et accents ; `%` et `_` sont du texte littéral. Les paramètres inconnus sont refusés. Une catégorie inconnue dans la route catégorie renvoie 404 ; un filtre `category` sans correspondance sur `/artisans` renvoie une liste vide.

## Contact

Exécuter cet exemple uniquement avec le transport local sans livraison, ou avec un destinataire de recette autorisé :

```bash
curl --fail-with-body http://127.0.0.1:5174/api/artisans/chocolaterie-labbe/contact \
  -H 'Content-Type: application/json' \
  --data '{"name":"Camille Martin","email":"camille@example.com","subject":"Demande de devis","message":"Bonjour, je souhaite obtenir un devis pour mon projet.","website":""}'
```

Le serveur résout le destinataire à partir du slug. Le succès renvoie 202 et `{ "data": { "message": "Message envoyé." } }`. Cela indique l’acceptation par le transport configuré, sans garantie de réception finale. Le honeypot renseigné renvoie aussi 202 mais ne transmet rien.

## Erreurs

Les erreurs utilisent `{ "error": { "status": 422, "message": "Paramètres de requête invalides." } }`. Le healthcheck est distinct : 200 avec `status=ok` et `database=connected`, ou 503 avec `status=unavailable` et `database=disconnected`.

| Statut | Cause |
| --- | --- |
| 400 | JSON malformé |
| 403 | Contact identifié cross-site |
| 404 | Route ou ressource absente |
| 413 / 415 | Corps trop grand, format ou encodage refusé |
| 422 | Entrées invalides |
| 429 | Quota général 120/minute ou contact 5/15 minutes atteint |
| 500 / 503 | Erreur interne ou service indisponible, sans détails privés |

Les quotas sont en mémoire par processus et par adresse IP ; les requêtes invalides peuvent les consommer. Le healthcheck est hors quota général. Les restrictions de navigateur ne constituent pas une authentification : l’API reste publiquement consultable par HTTP.
