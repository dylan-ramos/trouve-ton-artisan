# Version candidate — Trouve ton artisan

Date : 10 septembre 2026. Base de préparation : `f08d05d`. La version candidate complète l’annuaire React/Express/MySQL, sa documentation et sa préparation opérationnelle.

## Changements de livraison

- Sources Mermaid MCD/MLD, documentation d’installation et dossier illustré.
- Sauvegarde GPG et vérification de restauration dans une base isolée, sans écrasement de la base active.
- Précontrôle de configuration avant démarrage public, rotation des journaux et délais d’arrêt explicites.
- Correction du rôle accessible du composant de note révélée par la validation HTML.
- Conservation du CSS compilé Sass pour éviter le sélecteur invalide produit par la minification.
- Captures mobile, tablette et ordinateur et export PDF de recette.

Aucune migration SQL ni modification du jeu de données. Les mots de passe et les fichiers locaux ne font pas partie de la livraison. Les résultats et limites sont consignés dans le [rapport final](audit-final.md).
