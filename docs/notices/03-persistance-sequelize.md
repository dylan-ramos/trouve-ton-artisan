# Notice 03 — Persistance avec Sequelize

Cette notice explique comment l'API représente le schéma MySQL en TypeScript, charge les relations et teste la persistance sans mettre en danger les données de développement.

## 1. Rôle d'un ORM

Sequelize est un ORM : il transforme des lignes SQL en objets TypeScript et construit des requêtes paramétrées. Par exemple, `Artisan.findOne({ where: { slug } })` produit une requête SQL sans concaténer directement le texte reçu d'un utilisateur.

L'ORM ne remplace pas la conception SQL. Les fichiers `database/01-schema.sql` et `database/02-seed.sql` restent responsables de la structure et du jeu initial. L'application n'utilise pas `sequelize.sync({ force: true })`, qui pourrait supprimer des données et ne constituerait pas un historique de schéma fiable.

## 2. Connexion à MySQL

`src/config/environment.ts` valide les variables avant le démarrage. `src/config/database.ts` construit ensuite une instance Sequelize avec :

- le dialecte MySQL ;
- un pool borné de connexions ;
- une attente maximale ;
- la convention `snake_case` de la base ;
- la journalisation SQL désactivée par défaut pour éviter du bruit et des données sensibles.

Le pool réutilise plusieurs connexions au lieu d'en ouvrir une pour chaque requête. Trop peu de connexions bloque les requêtes concurrentes ; trop de connexions peut saturer MySQL. La limite initiale de dix est proportionnée à cette application et pourra être mesurée en production.

## 3. Modèles et types

Les classes `Category`, `Specialty` et `Artisan` étendent `Model`. Les types `InferAttributes` et `InferCreationAttributes` dérivent les attributs manipulés par Sequelize depuis les déclarations TypeScript.

Quelques types ont un rôle précis :

- `CreationOptional` indique qu'un identifiant ou timestamp est généré par la base ;
- `ForeignKey` identifie une clé étrangère ;
- `NonAttribute` indique une association chargée par une jointure, pas une colonne locale ;
- `string | null` représente une colonne SQL facultative comme le site web.

MySQL renvoie `DECIMAL` sous forme de chaîne afin de ne pas perdre de précision en JavaScript. La future couche de DTO décidera explicitement comment exposer la note au format JSON.

## 4. Associations

Les associations sont enregistrées dans `src/models.ts` après l'initialisation des trois modèles :

```text
Category.hasMany(Specialty)
Specialty.belongsTo(Category)
Specialty.hasMany(Artisan)
Artisan.belongsTo(Specialty)
```

Les alias `specialties`, `artisans`, `category` et `specialty` sont stables. Les services peuvent ainsi demander une jointure avec `include` sans connaître manuellement les colonnes SQL.

## 5. Confidentialité par défaut

L'adresse `contact_email` sert uniquement au futur envoi d'e-mail. Le modèle Artisan possède donc un `defaultScope` qui exclut cette colonne de toutes les requêtes ordinaires.

Une opération serveur qui en a réellement besoin doit demander explicitement :

```ts
Artisan.scope('withContactEmail').findOne(...)
```

Cette stratégie applique le principe de moindre exposition. Le contrôle devra aussi être conservé dans les DTO HTTP : une protection unique ne suffit jamais pour une donnée privée.

## 6. Services de lecture

Les services `CategoryService` et `ArtisanService` regroupent les requêtes métier. Une future route HTTP appellera un service au lieu d'écrire une jointure Sequelize dans son contrôleur.

Cette séparation apporte :

- des contrôleurs plus courts ;
- un ordre et des jointures cohérents entre routes ;
- des tests directs de la logique d'accès ;
- une évolution possible de la base sans réécrire l'adaptation HTTP.

## 7. Contrôler la base de développement

Après le démarrage de la stack :

```bash
make up
make database-check
```

La commande exécute `src/scripts/check-database.ts` dans le backend. Elle se connecte avec les mêmes paramètres que l'application et exige 4 catégories, 15 spécialités, 17 artisans et 3 vedettes. Elle ferme toujours sa connexion, y compris en cas d'échec.

## 8. Base de test isolée

```bash
make integration-test
```

Cette commande utilise `compose.test.yaml`. Elle démarre un MySQL distinct avec :

- un nom de projet Compose séparé ;
- une base dont le nom finit obligatoirement par `_test` ;
- un réseau interne propre aux tests ;
- un système de fichiers `tmpfs`, stocké en mémoire et perdu à l'arrêt ;
- aucun port publié sur l'hôte ;
- les scripts SQL de production appliqués tels quels.

Le code de test vérifie aussi `NODE_ENV=test`. Ces deux garde-fous empêchent une erreur de configuration d'orienter les tests vers la base persistante ou la production.

`--abort-on-container-exit` arrête la stack dès que le conteneur de test finit. `--exit-code-from backend-test` transmet son résultat à Make et à l'intégration continue. Une étape de nettoyage est exécutée que les tests réussissent ou échouent.

## 9. Pourquoi tester les accents

Les deux scripts SQL sont exécutés dans deux connexions distinctes par l'image MySQL. Une instruction `SET NAMES` placée uniquement dans le schéma ne configure donc pas le seed. Un test d'intégration a détecté cette différence en comparant `Chocolaterie Labbé` à la valeur relue.

Chaque script fixe maintenant explicitement `utf8mb4`. Tester le contenu, et pas seulement le nombre de lignes, protège les noms, villes et futurs textes réels contre une corruption silencieuse de l'encodage.

## 10. Commandes de contrôle

```bash
make format-check
make lint
make typecheck
make test
make integration-test
make build
make up
make database-check
make check
make down
git diff --check
```

Les tests locaux rapides n'ouvrent pas MySQL ; la suite de persistance y est désactivée. `make integration-test` est le contrôle de référence dès qu'un modèle, une association, un service SQL ou un script de données change.
