# Trouve ton artisan

Annuaire des artisans d’Auvergne-Rhône-Alpes : consultation par catégorie, recherche par nom, fiche publique et demande de contact. Les données métier viennent de l’API : 17 artisans, 15 spécialités, 4 catégories et 3 artisans du mois.

## Architecture

React et TypeScript, React Router, Bootstrap et Sass composent le frontend. Express, Zod et Sequelize servent l’API sur MySQL 8.4. En développement, Vite relaie `/api`. En production, Traefik termine TLS et Nginx sert le frontend et relaie l’API ; Express et MySQL n’exposent aucun port hôte.

```text
Navigateur → Vite (développement) ou Traefik → Nginx (production)
                  → Express → Sequelize → MySQL
                          → SMTP (contact)
```

Le code est réparti entre `frontend/src`, `backend/src`, `database` et `.docker`. Les [choix applicatifs](docs/conception/application.md), le [modèle de données](docs/conception/database.md) et le [contrat OpenAPI](docs/api/openapi.yaml) détaillent ces frontières.

## Prérequis

- Git, Docker Engine avec Compose prenant en charge `!override` et `!reset`, GNU Make et curl.
- Node.js 22 ou supérieur avec npm pour les contrôles sur l’hôte. Les images utilisent Node 22.
- Accès aux registres npm et Docker lors de la première installation ; Docker doit être accessible à votre compte.
- Chrome pour la recette Playwright configurée avec le canal `chrome`.

## Installation et développement

```bash
git clone https://github.com/dylan-ramos/trouve-ton-artisan.git
cd trouve-ton-artisan
```

À la première installation seulement, copier les exemples sans remplacer une configuration locale existante :

```bash
cp -n .env .env.local
cp -n backend/.env backend/.env.local
cp -n frontend/.env frontend/.env.local
```

Éditer `.env.local` : remplacer `DB_PASSWORD` et `DB_ROOT_PASSWORD` par deux secrets distincts. Le premier est injecté à la fois dans Express et MySQL par Compose. Choisir un `FRONTEND_PORT` libre, par exemple `5174`. Dans `frontend/.env.local`, régler `VITE_SITE_URL=http://127.0.0.1:5174` si ce port est choisi. L’API du navigateur utilise toujours le chemin relatif `/api` ; `VITE_API_URL` est une valeur historique et ne change pas le client HTTP actuel.

```bash
make config
make build
make up
make check
make database-check
```

Ouvrir `http://127.0.0.1:5173` avec le port par défaut, ou `http://127.0.0.1:5174` avec la surcharge ci-dessus. Le développement utilise HTTP et ne nécessite pas Traefik. `make ps` affiche les trois services ; `make logs` suit leurs journaux (Ctrl+C arrête uniquement le suivi).

Les dépendances des conteneurs sont installées par `npm ci` au démarrage, dans des volumes dédiés. Pour les outils locaux :

```bash
make install
make verify
```

`make verify` enchaîne formatage en lecture seule, lint, typage, tests et builds des deux applications. `make format` applique le formatage. Les lockfiles sont versionnés ; utiliser `npm ci` pour reproduire les versions.

## Environnement

| Fichier | Paramètres | Utilisation |
| --- | --- | --- |
| `.env` puis `.env.local` | Nom du projet, versions d’images, port public, identifiants MySQL, domaine et Traefik | Interpolation Compose par le Makefile ; la surcharge locale prévaut |
| `backend/.env` puis `backend/.env.local` | Configuration applicative et `SMTP_*` | Environnement du conteneur Express ; les valeurs `environment` de Compose priment |
| `frontend/.env` puis `frontend/.env.local` | `VITE_SITE_URL` | Métadonnées publiques en développement |
| `.env.local` : `SITE_URL` | URL HTTPS finale | Injectée au build de production pour canonical, robots et sitemap |

Les fichiers `.env.local` sont ignorés par Git et Docker. Ne jamais placer de secret dans une variable `VITE_*`. Les valeurs d’exemple ne sont pas destinées à une mise en service.

Sans `SMTP_HOST` en développement, Nodemailer produit un résultat JSON sans livrer d’e-mail ; une réponse 202 ne prouve donc pas une réception réelle. Pour la production, configurer dans `backend/.env.local` `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_FROM` et, si le serveur l’exige, `SMTP_USER` et `SMTP_PASSWORD` ensemble. Le port 587 utilise habituellement `SMTP_SECURE=false` avec STARTTLS obligatoire en production ; le port 465 utilise `true`. Valider les valeurs auprès du fournisseur.

## Base et seed

[01-schema.sql](database/01-schema.sql) crée les tables ; [02-seed.sql](database/02-seed.sql) alimente les données. MySQL les exécute dans cet ordre à la première initialisation d’un volume vide. Une modification ultérieure des scripts ne réinitialise pas un volume existant. Le seed réappliqué met à jour les lignes fournies : le relire et sauvegarder avant toute réapplication sur des données modifiées. Aucun `sequelize.sync` ne remplace ces scripts.

`make database-check` vérifie les comptages attendus via Sequelize. `make down` et `make clean` arrêtent les services et conservent le volume MySQL. Un changement de mot de passe dans `.env.local` ne change pas automatiquement le compte d’une base déjà initialisée.

## Tests et recette

```bash
make verify
make config prod-config test-config
make integration-test
make prod-build
```

Les tests d’intégration utilisent un projet suffixé `-test`, MySQL en tmpfs et une base dont le nom se termine par `_test`. Ils n’utilisent pas le volume de développement ; Compose est arrêté à la fin. Les tests backend locaux ignorent explicitement les scénarios nécessitant MySQL.

Pour contrôler les images de production sans déployer :

```bash
make audit-up
make audit-security
make audit-reset
make audit-browser
make audit-lighthouse
make audit-down
```

La recette écoute par défaut sur `http://127.0.0.1:5180`, utilise un projet `-audit` isolé et n’envoie pas de courrier. `audit-reset` réinitialise les quotas de cette seule pile. Les résultats restent dans `frontend/audit-results`, ignoré. Voir la [matrice de tests](docs/validation/coverage.md), la [procédure de recette](docs/validation/acceptance.md) et l’[audit du 9 septembre](docs/security/audit-2026-09-09.md).

## Production

Préparer sur l’hôte cible un Traefik actif avec réseau externe `proxy`, entrypoint `websecure`, certificat valide et résolveur correspondant à `TRAEFIK_CERT_RESOLVER`. Régler `TRAEFIK_HOST`, `SITE_URL` et l’adresse exacte de Traefik sur `proxy` dans `TRAEFIK_TRUSTED_IP`. Configurer SMTP avant le démarrage : le backend refuse une production sans serveur SMTP.

```bash
make prod-config
make prod-build
make prod-up
make prod-ps
```

Utiliser un hôte ou un nom de projet distinct du développement pour ne pas remplacer ses conteneurs. `make prod-deploy` regroupe validation, construction et démarrage. Une modification de `SITE_URL` exige un nouveau build. La redirection HTTP vers HTTPS relève de Traefik. Les sauvegardes, la restauration, les journaux et la recette SMTP réelle sont à organiser sur l’hébergement. `make prod-down` conserve la base.

## Dépannage

| Symptôme | Vérification |
| --- | --- |
| Port occupé | Changer `FRONTEND_PORT` dans `.env.local`, adapter `VITE_SITE_URL`, relancer `make up` |
| Erreur de certificat en local | Utiliser l’adresse HTTP et le port de développement |
| API indisponible | `make ps`, `make backend-logs`, `make database-logs`, puis `make check` |
| Accès MySQL refusé après changement de secret | Les comptes du volume existant conservent leurs mots de passe ; corriger la configuration ou effectuer une rotation contrôlée |
| Dépendance absente sur l’hôte | `make install` ; les volumes npm Docker sont distincts du `node_modules` local |
| Contact 429 | Attendre la fenêtre de quota ; ne pas redémarrer la production pour contourner la limite |
| Contact 202 sans courrier en développement | Transport JSON prévu ; voir la configuration SMTP |
| Playwright ne trouve pas Chrome | Installer Chrome ou configurer un canal installé via `BROWSER_CHANNEL` |
| Permission Docker refusée | Vérifier l’accès au daemon et les droits du compte |

## Documentation et livraison

- [Guide API et exemples](docs/api/README.md).
- [Dossier du projet](docs/dossier/projet.md), [veille datée](docs/security/veille.md) et [licences](docs/licenses.md).
- [Sources Mermaid et exports](docs/conception/diagrams/README.md) et [spécification visuelle](docs/design/specification.md).

La recette humaine d’accessibilité, les validations HTML/CSS et le déploiement public restent à compléter. Les pages légales sont provisoires. Les liens Figma et de production seront renseignés dans le dossier après publication.
