# Notice 02 — Socle React, Express et Docker

Cette notice présente la structure initiale des deux applications, la circulation d'une requête et la configuration de l'environnement. Le socle reste volontairement réduit : les fonctionnalités métier seront ajoutées module par module.

## 1. Installer les dépendances

```bash
make install
```

Cette commande exécute `npm ci` dans `backend/` puis `frontend/`. Contrairement à `npm install`, `npm ci` exige un lockfile cohérent et installe exactement les versions validées. C'est le bon choix pour l'intégration continue et Docker. `npm install` reste utilisé lorsqu'une dépendance est ajoutée et met alors à jour le lockfile.

Les deux `package-lock.json` doivent être versionnés. Ils garantissent que deux machines ne résolvent pas silencieusement des versions différentes.

## 2. Pourquoi TypeScript strict

React et Express utilisent TypeScript pour détecter avant l'exécution les propriétés absentes, types incompatibles et retours non traités. Les options comme `strict`, `noUncheckedIndexedAccess` et `useUnknownInCatchVariables` empêchent plusieurs raccourcis fragiles.

```bash
make typecheck
```

Le compilateur ne remplace pas la validation des données externes : une requête HTTP et une variable d'environnement restent inconnues à l'exécution. Le backend utilise donc Zod pour analyser `process.env` avant de démarrer.

## 3. Comprendre le backend Express

Le point d'entrée `src/server.ts` se limite aux responsabilités système : lire l'environnement, créer Sequelize, démarrer HTTP et gérer l'arrêt. `src/app.ts` assemble les middlewares et routes. Cette séparation permet de tester l'application sans démarrer le serveur de production ; Supertest utilise un port éphémère local.

La route de santé reçoit une fonction `checkDatabase`. En production, cette fonction appelle `database.authenticate()`. Dans les tests, elle est remplacée par une fonction contrôlée. Cette injection de dépendance réduit le couplage sans imposer un framework supplémentaire.

Cycle d'une requête :

```text
requête -> Helmet -> quota -> parseur JSON borné -> route -> contrôleur -> réponse
                                      \-> 404 si aucune route ne correspond
```

Commandes utiles :

```bash
npm --prefix backend run dev
npm --prefix backend test
npm --prefix backend run build
npm --prefix backend start
```

`dev` surveille les fichiers avec `tsx`. `build` compile vers `dist/`. `start` exécute uniquement le JavaScript compilé, comme en production.

## 4. Comprendre le frontend React

`index.html` contient seulement le point de montage `#root`. `src/main.tsx` initialise React, active `StrictMode` et installe `BrowserRouter`. `App.tsx` déclare les routes et composants visibles.

React décrit l'interface en fonction des données. Quand un état change, React recalcule les composants concernés et met à jour le DOM. Il ne faut généralement pas manipuler directement `document` pour construire l'interface.

Vite fournit le serveur de développement et le build optimisé :

```bash
npm --prefix frontend run dev
npm --prefix frontend test
npm --prefix frontend run build
```

En développement, Vite reçoit `/api/health`, retire le préfixe `/api` et transmet `/health` à Express. Le navigateur reste sur une origine unique et les composants n'ont pas besoin de connaître l'adresse interne du backend.

## 5. Bootstrap et Sass

Bootstrap fournit grille, utilitaires et comportements visuels éprouvés. Sass permettra de définir les couleurs et variables du projet avant l'import de Bootstrap. Les styles spécifiques resteront organisés par responsabilité au lieu d'être accumulés dans une feuille unique.

Les avertissements de dépréciation Sass actuellement émis viennent des sources Bootstrap, pas des fichiers du projet. Ils sont surveillés jusqu'à leur correction amont.

## 6. Les cinq niveaux de configuration

### Variables Compose

Le `.env` racine configure l'infrastructure : versions d'images, ports hôte, domaine, nom de base et utilisateurs. `.env.local`, ignoré, remplace les secrets et valeurs propres à une machine.

```bash
cp .env .env.local
```

### Arguments Docker `ARG`

`NODE_VERSION`, `MYSQL_VERSION`, `NGINX_IMAGE` et `NGINX_VERSION` choisissent les images pendant la construction. Un `ARG` n'est pas un coffre à secrets : son usage peut rester visible dans les métadonnées de build. La variante Nginx non privilégiée permet au frontend de production de fonctionner sans utilisateur root.

### Variables Docker `ENV` et `environment`

Elles existent pendant l'exécution du conteneur. Compose injecte explicitement au backend les valeurs nécessaires à Sequelize. Le mot de passe root MySQL n'est jamais transmis à Express.

### Configuration backend

`backend/.env` contient les réglages applicatifs non sensibles. Les secrets d'infrastructure viennent de Compose. `backend/.env.local` permet une surcharge applicative locale.

### Variables Vite

Toute variable commençant par `VITE_` est intégrée au JavaScript livré au navigateur. Elle est publique et ne doit jamais contenir de mot de passe, clé SMTP ou secret API.

Les ports internes restent fixes : Express écoute sur 3000, Vite sur 5173, Nginx sur 8080 et MySQL sur 3306. Ils forment le contrat privé entre services. Seul le frontend est publié sur l’hôte en développement, via `FRONTEND_PORT`. Express et MySQL n’ont aucun port hôte ; les vérifications HTTP passent par `/api`.

## 7. Lancer l'environnement

```bash
make config
make build
make up
make ps
make check
```

`config` valide la fusion de `compose.yaml` et `compose.dev.yaml`. `build` fabrique les images. `up` démarre les services et attend leurs healthchecks. `check` vérifie le frontend puis `/api/health` à travers le proxy Vite.

Pour examiner un problème :

```bash
make logs
make frontend-logs
make backend-logs
make database-logs
```

Pour arrêter sans perdre MySQL :

```bash
make down
```

Cette commande ne passe jamais `--volumes`. La suppression du volume est une opération distincte et volontaire qui exige une sauvegarde.

## 8. Contrôler la qualité

```bash
make format-check
make lint
make typecheck
make test
make quality-check
git diff --check
```

Prettier uniformise la présentation. ESLint détecte les constructions risquées. TypeScript contrôle les types. Les tests vérifient le comportement. Aucun outil ne remplace les autres : ils couvrent des catégories de défauts différentes.
