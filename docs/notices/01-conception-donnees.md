# Notice 01 — Comprendre la conception et les données

Cette notice explique le premier lot. Il ne contient encore ni React ni Express : commencer par le domaine évite de construire une interface ou une API autour d'un modèle incohérent.

## 1. Créer la branche

```bash
git switch dev
git status --short --branch
git switch -c dev_01-conception-donnees
```

`git switch dev` place le dépôt sur la branche d'intégration. Le statut vérifie qu'aucun travail inconnu ne risque d'être mélangé. `git switch -c` crée ensuite une branche isolée : en cas de problème, `dev` reste stable.

## 2. Traduire les besoins en règles de gestion

Les besoins fonctionnels établissent qu'un artisan possède une spécialité et qu'une spécialité possède une catégorie. Le modèle retient donc trois entités, plutôt qu'une seule grande table répétant les catégories.

Cette normalisation évite par exemple que « Bâtiment » soit orthographié différemment sur deux artisans. Modifier le libellé d'une catégorie ne demande qu'une seule mise à jour.

Les ressources graphiques sont également contrôlées visuellement, car une extraction textuelle ne restitue pas les images. La palette retenue est `#f1f8fc`, `#0074c7`, `#00497c`, `#384050`, `#cd2c2e` et `#82b864`.

## 3. Passer du MCD au SQL

Le MCD décrit le métier sans dépendre de MySQL. Le MLD ajoute les clés primaires et étrangères. Le script `01-schema.sql` réalise ensuite ce modèle avec des types MySQL, contraintes et index.

Quelques choix importants :

- `NOT NULL` exprime une donnée obligatoire ;
- `UNIQUE` empêche deux slugs identiques ;
- `FOREIGN KEY` interdit une spécialité sans catégorie ;
- `CHECK` protège les notes et chaînes vides même si un bug contourne Express ;
- `utf8mb4` conserve tous les caractères Unicode ;
- `DECIMAL` stocke une note exacte telle que 4,8 ;
- `RESTRICT` empêche une suppression qui laisserait des données orphelines.

La base constitue une dernière ligne de défense. La future validation Express donnera des messages plus agréables, mais elle ne remplace pas les contraintes SQL.

## 4. Alimenter sans dupliquer

`02-seed.sql` ouvre une transaction, insère les référentiels puis les artisans et termine par `COMMIT`. Si une instruction échoue, MySQL peut annuler l'ensemble au lieu de conserver un jeu partiel.

Les `INSERT ... ON DUPLICATE KEY UPDATE` permettent de rejouer le seed sans créer une deuxième copie de chaque ligne. Les identifiants explicites rendent les relations lisibles et déterministes pour ce jeu de référence figé.

## 5. Vérifier avec Docker

Lorsque le service MySQL est disponible, les commandes de contrôle sont :

```bash
make config
docker compose \
  --env-file frontend/.env \
  --env-file frontend/.env.local \
  --env-file backend/.env \
  --env-file backend/.env.local \
  -f compose.yaml -f compose.dev.yaml \
  up -d database --wait
make database-shell
```

Dans le client MySQL :

```sql
SHOW TABLES;
SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM specialties;
SELECT COUNT(*) FROM artisans;
SELECT COUNT(*) FROM artisans WHERE is_featured = TRUE;
```

Les résultats attendus sont respectivement 4, 15, 17 et 3. Pour contrôler les relations :

```sql
SELECT a.name, s.name AS specialty, c.name AS category
FROM artisans AS a
JOIN specialties AS s ON s.id = a.specialty_id
JOIN categories AS c ON c.id = s.category_id
ORDER BY a.id;
```

Attention : les scripts de `/docker-entrypoint-initdb.d` ne sont exécutés automatiquement qu'à la création d'un volume MySQL vierge. Il ne faut jamais supprimer ce volume par réflexe. Sur une base existante, on applique explicitement les scripts ou une migration après sauvegarde.

## 6. Vérifications Git

```bash
git diff --check
git status --short
git diff -- database docs
```

La première commande repère notamment les espaces finaux. La deuxième montre exactement ce qui sera inclus. La troisième permet une relecture ciblée avant votre commit.

## 7. Ce que cela prépare pour React et Express

Les slugs donneront des URL lisibles comme `/artisans/chocolaterie-labbe`. Express transformera les lignes SQL en objets publics en masquant `contact_email`. React recevra ces objets via `/api`, affichera les listes et enverra le formulaire au backend sans connaître l'adresse du destinataire.
