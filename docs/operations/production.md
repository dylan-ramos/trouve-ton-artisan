# Mise en production et retour arrière

## Préparer la cible

Le déploiement utilise un VPS. L’adresse de publication est [trouve-ton-artisan.srv924756.hstgr.cloud](https://trouve-ton-artisan.srv924756.hstgr.cloud). Déployer une révision du dépôt dont les contrôles de release ont réussi. Le serveur doit disposer de Docker/Compose, du réseau `TRAEFIK_NETWORK` (par défaut `proxy`) et d’un Traefik avec entrypoint `TRAEFIK_ENTRYPOINT` (par défaut `websecure`), résolveur de certificat `TRAEFIK_CERT_RESOLVER` (par défaut `lehttp`) et redirection HTTP vers HTTPS. Utiliser un projet Docker distinct du développement.

Les paramètres Traefik sont tous surchargeables dans le `.env.local` à la racine ; `make network` utilise également `TRAEFIK_NETWORK`.

Créer `.env.local`, `backend/.env.local` et `frontend/.env.local` selon les [trois configurations VPS du README](../../README.md#les-trois-fichiers-envlocal-pour-le-vps) : domaine, `SITE_URL`, adresse exacte de Traefik, deux mots de passe MySQL distincts et serveur SMTP. Le contrôle `make prod-preflight` refuse les principales valeurs de démonstration, les domaines incohérents, l’absence de proxy de confiance et les identifiants SMTP incomplets. Il ne teste ni DNS, ni certificat, ni accessibilité du serveur SMTP.

Le précontrôle utilise un conteneur Node temporaire ; Node.js et npm ne sont pas nécessaires sur le VPS. Docker Compose fournit la configuration au conteneur par entrée standard, sans fichier intermédiaire ni affichage des secrets.

## Livrer

Avant la bascule : valider la [checklist finale](../release/checklist.md), réaliser une [sauvegarde et sa vérification](backup-restore.md), relever le commit et les identifiants des images actuellement en service. Conserver ces images et la configuration précédente pour revenir à une version connue.

```bash
make prod-config
make prod-preflight
make prod-build
make prod-up
make prod-ps
```

`prod-up` applique désormais le précontrôle. Il attend les healthchecks : MySQL, puis Express, puis Nginx. Le délai d’arrêt est de 60 secondes pour MySQL, 20 pour Express (délai applicatif de 10 secondes) et 15 pour Nginx. Les journaux Docker utilisent le pilote local avec rotation de trois fichiers de 10 Mio par service. Cette limite de taille n’est pas une politique de conservation par durée.

Sur le domaine final, vérifier HTTPS, redirection, absence de contenu mixte, pages profondes, API, recherche, 404, canonical, robots et sitemap. La route inconnue de cette SPA renvoie le document HTML avec HTTP 200, puis affiche la 404 React et `noindex` ; les ressources API inconnues renvoient HTTP 404. Effectuer un envoi vers une boîte de recette explicitement autorisée et confirmer la réception ainsi que `Reply-To`.

Le healthcheck Nginx confirme son fonctionnement propre ; `/api/health` vérifie aussi la base. Superviser ce dernier à travers l’origine publique. Vérifier l’IP client réellement transmise par Traefik avant de valider les quotas.

## Revenir à la version précédente

Si la recette échoue, interrompre l’ouverture au public. Utiliser le commit/configuration précédemment relevés dans un checkout séparé, puis réaffecter les images conservées à un tag de retour arrière et définir `APP_PROD_IMAGE_TAG` sur ce tag. Exécuter `make prod-config`, `make prod-preflight` et `make prod-up` sans reconstruire les images. Le volume MySQL est conservé.

Ce lot ne modifie pas le schéma ni le seed : le retour applicatif n’exige donc pas de restauration de données. Si une évolution ultérieure modifie le schéma, définir son retour arrière avant livraison ; ne pas exécuter un ancien seed pour tenter de restaurer une base. Le remplacement d’une base active exige une décision explicite après validation de l’archive.

Les changements de cette version sont décrits dans la [note de release](../release/release-notes.md).
