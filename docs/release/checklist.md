# Contrôles de livraison

Cette procédure décrit les contrôles applicables à chaque publication. Les résultats datés de la recette sont consignés dans le [rapport de recette](audit-final.md).

## Code et documentation

- Exécuter les contrôles de qualité, les tests et les builds décrits dans le README.
- Contrôler le schéma SQL, le seed et les comptages des données.
- Vérifier les liens du dossier, la lisibilité du PDF et la cohérence des diagrammes avec le schéma.
- Examiner les scans de dépendances et les exceptions de sécurité, avec leur périmètre et leur échéance.

## Configuration et déploiement

- Configurer les trois fichiers `.env.local` selon le README et exécuter `make prod-preflight`.
- Appliquer la [procédure de production](../operations/production.md).
- Contrôler le certificat, la redirection HTTPS, l’absence de contenu mixte et la transmission de l’IP client.
- Tester les pages profondes, l’API, la recherche, le formulaire de contact et la réception réelle du courrier.
- Vérifier canonical, robots, sitemap et le traitement des URL inconnues.

## Interfaces et accessibilité

- Comparer les interfaces aux maquettes sur mobile, tablette et ordinateur.
- Contrôler navigation clavier, lecteur d’écran, zoom natif et navigateurs pris en charge.
- Vérifier l’accès aux liens du site, des maquettes et du dépôt.

## Exploitation

- Définir la fréquence et la rétention des sauvegardes, et conserver la clé privée séparément de l’hôte.
- Exécuter la [restauration de contrôle](../operations/backup-restore.md).
- Vérifier les journaux, les healthchecks et les éléments nécessaires au retour arrière.
