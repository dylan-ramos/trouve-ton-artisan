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
- Node.js 22 ou supérieur avec npm uniquement sur le poste de développement pour les contrôles locaux. Le VPS ne nécessite aucune installation de Node.js ou npm : le déploiement et son précontrôle utilisent Docker. Les images utilisent Node 22.
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

### Les trois fichiers `.env.local` pour le VPS

Créer les trois fichiers ci-dessous aux emplacements indiqués, avant `make prod-preflight`. Ils complètent les `.env` versionnés ; il est inutile de recopier les versions d’images et les paramètres inchangés. Ces exemples utilisent le domaine de publication et la configuration Traefik existante.

**À la racine : `.env.local`**

```dotenv
# Configuration VPS ; les autres valeurs proviennent du .env versionné.
COMPOSE_PROJECT_NAME=trouve-ton-artisan
DB_NAME=trouve_ton_artisan
DB_USER=artisan_app
DB_PASSWORD=replace-with-a-secure-password
DB_ROOT_PASSWORD=replace-with-another-secure-password

TRAEFIK_NETWORK=proxy
TRAEFIK_ENTRYPOINT=websecure
TRAEFIK_CERT_RESOLVER=lehttp
TRAEFIK_HOST=trouve-ton-artisan.srv924756.hstgr.cloud
SITE_URL=https://trouve-ton-artisan.srv924756.hstgr.cloud
# IP interne de Traefik sur TRAEFIK_NETWORK, sans suffixe CIDR.
TRAEFIK_TRUSTED_IP=replace-with-traefik-internal-ip
```

Remplacer les deux mots de passe par des secrets longs et distincts. Pour les secrets MySQL lus aussi par Make, utiliser par exemple des valeurs aléatoires hexadécimales d’au moins 32 caractères afin d’éviter les caractères d’interpolation comme `$` et `#`.

Pour trouver l’IP interne de Traefik sur le VPS :

```bash
docker network inspect proxy --format '{{range .Containers}}{{println .Name .IPv4Address}}{{end}}'
```

Si `TRAEFIK_NETWORK` est différent, remplacer `proxy` dans cette commande. Reporter uniquement l’adresse du conteneur Traefik dans `TRAEFIK_TRUSTED_IP`, sans le suffixe `/…`, et conserver cette adresse stable dans la configuration réseau de Traefik. En cas de changement d’IP, mettre cette valeur à jour et recréer le frontend avec `make prod-up`.

**Backend : `backend/.env.local`**

```dotenv
# Compose fournit NODE_ENV, PORT et DB_* depuis la configuration racine.
LOG_LEVEL=info

# Remplacer par les paramètres du fournisseur SMTP.
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=replace-with-smtp-user
SMTP_PASSWORD=replace-with-smtp-password
# Adresse expéditrice autorisée par le fournisseur SMTP.
SMTP_FROM=no-reply@example.com
# Tous les contacts sont redirigés vers cette boîte contrôlée, à remplacer.
SMTP_TEST_RECIPIENT=recette@example.com
```

Remplacer `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` et `SMTP_FROM` par les valeurs du fournisseur ; l’adresse expéditrice doit être autorisée par celui-ci. Pour un service utilisant TLS dès la connexion, choisir `SMTP_PORT=465` et `SMTP_SECURE=true`. Si le serveur autorise explicitement l’envoi sans authentification, supprimer les deux lignes `SMTP_USER` et `SMTP_PASSWORD` au lieu de les laisser vides. Ne pas recopier les mots de passe MySQL dans ce fichier : Compose les injecte depuis le fichier racine.

Pour tester la réception sans contacter les adresses du jeu de données, renseigner `SMTP_TEST_RECIPIENT` avec une boîte que vous contrôlez. Cette valeur remplace le destinataire SMTP de tous les formulaires, sans copie à l’artisan et sans modifier la base. `Reply-To` reste l’adresse saisie dans le formulaire. Si la variable est absente, les messages vont aux adresses des artisans : conserver la redirection pour une démonstration utilisant les données fournies.

Après modification du fichier, `make prod-up` recrée le backend avec sa configuration. Pour la première installation de cette fonctionnalité, reconstruire les images avec `make prod-build` avant `make prod-up`. Envoyer un message avec un objet identifiable, puis vérifier sa présence dans la boîte de recette et les indésirables. Une réponse HTTP 202 indique que le traitement a été accepté ; elle ne prouve pas la livraison dans la boîte du destinataire.

**Frontend : `frontend/.env.local`**

```dotenv
# Configuration publique uniquement : aucun secret dans VITE_*.
VITE_SITE_URL=https://trouve-ton-artisan.srv924756.hstgr.cloud
```

Ce fichier est requis par les commandes Make et sert aux outils Vite exécutés directement. Pour le build Docker de production, c’est `SITE_URL` du fichier racine qui fournit cette URL ; garder les deux valeurs identiques. Aucun hôte backend n’est à renseigner : le navigateur appelle `/api` sur le domaine du site.

Une fois les valeurs remplacées, protéger les fichiers et contrôler la configuration :

```bash
chmod 600 .env.local backend/.env.local frontend/.env.local
make prod-config
make prod-preflight
```

Le précontrôle refuse notamment les exemples MySQL, le serveur SMTP d’exemple et l’IP Traefik non renseignée. Il ne garantit pas la validité des identifiants SMTP : un envoi réel doit être vérifié après déploiement. Utiliser ensuite les commandes de la section [Production](#production).

## Base et seed

[01-schema.sql](database/01-schema.sql) crée les tables ; [02-seed.sql](database/02-seed.sql) alimente les données. MySQL les exécute dans cet ordre à la première initialisation d’un volume vide. Une modification ultérieure des scripts ne réinitialise pas un volume existant. Le seed réappliqué met à jour les lignes fournies : le relire et sauvegarder avant toute réapplication sur des données modifiées. Aucun `sequelize.sync` ne remplace ces scripts.

`make database-check` vérifie les comptages attendus via Sequelize. `make down` et `make clean` arrêtent les services et conservent le volume MySQL. Un changement de mot de passe dans `.env.local` ne change pas automatiquement le compte d’une base déjà initialisée.

### Anonymisation des contacts

Le seed utilise exclusivement des adresses `artisan-<id>@example.invalid`, sur un domaine réservé ([IANA](https://www.iana.org/assignments/special-use-domain-names)). Les autres données des artisans sont conservées. Pour une base déjà initialisée, appliquer une seule fois sur le VPS :

```bash
make prod-anonymize-emails
```

Cette commande remplace toutes les adresses de contact de la table `artisans`, sans supprimer de ligne ni de volume. Elle est réexécutable et affiche uniquement le nombre de contacts anonymisés. Un build ou un redémarrage seul ne met pas à jour une base existante. Les copies historiques et sauvegardes antérieures conservent leur contenu initial. Utiliser `SMTP_TEST_RECIPIENT` pour recevoir les formulaires dans une boîte contrôlée.

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

Préparer sur l’hôte cible un Traefik actif avec réseau externe `TRAEFIK_NETWORK` (`proxy` par défaut), entrypoint `TRAEFIK_ENTRYPOINT` (`websecure` par défaut), certificat valide et résolveur `TRAEFIK_CERT_RESOLVER` (`lehttp` par défaut). Ces paramètres sont surchargeables dans le `.env.local` à la racine, chargé après `.env` par les commandes Make. Régler `TRAEFIK_HOST`, `SITE_URL` et l’adresse exacte de Traefik sur le réseau choisi dans `TRAEFIK_TRUSTED_IP`. Configurer SMTP avant le démarrage : le backend refuse une production sans serveur SMTP.

```bash
make prod-config
make prod-preflight
make prod-build
make prod-up
make prod-ps
```

Utiliser un hôte ou un nom de projet distinct du développement pour ne pas remplacer ses conteneurs. `make prod-deploy` regroupe validation, construction et démarrage. `make prod-preflight` transmet la configuration Compose par entrée standard à un conteneur Node temporaire, sans accès réseau ni socket Docker ; les secrets ne sont pas affichés. L’image `node:22-alpine` est téléchargée si elle est absente. Une modification de `SITE_URL` exige un nouveau build. La redirection HTTP vers HTTPS relève de Traefik. Les sauvegardes, la restauration, les journaux et la recette SMTP réelle sont à organiser sur l’hébergement. `make prod-down` conserve la base.

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

Maquettes : [Figma](https://www.figma.com/design/kpnXYMfChXTyp13cdCs2L6/trouve-ton-artisan?node-id=0-1). Adresse de publication : [Trouve ton artisan](https://trouve-ton-artisan.srv924756.hstgr.cloud). Les résultats des validations HTML/CSS sont détaillés dans le rapport de recette.


## Exploitation et version candidate

La [procédure de production](docs/operations/production.md) détaille les précontrôles, l’arrêt et le retour arrière. La [sauvegarde chiffrée et sa restauration de contrôle](docs/operations/backup-restore.md) utilisent GnuPG sur l’hôte et une base temporaire sans accès à la base active.

La [note de release](docs/release/release-notes.md) décrit les changements ; le [rapport final](docs/release/audit-final.md) présente les résultats de recette et leur périmètre. La [liste des contrôles de livraison](docs/release/checklist.md) complète les procédures d’exploitation. Le [dossier PDF](docs/dossier/projet-recette.pdf) rassemble la présentation du projet, les diagrammes, les liens et les captures de l’application.

Pour reproduire les captures et le PDF avec Chrome, démarrer la pile de recette, puis :

```bash
make release-evidence
make dossier-pdf
```

Les captures sont dans `docs/dossier/captures`, les DOM/CSS de validation dans `frontend/audit-results/release`. Ces commandes ne livrent aucun e-mail et ne déploient pas de site public.
