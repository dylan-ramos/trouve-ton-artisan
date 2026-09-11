# Notice 11 — Tests et documentation

## Vérification reproductible

`make verify` lance la qualité puis les builds frontend et backend. `make quality-check` conserve son rôle de contrôle sans build ; `make app-build` compile les deux applications. Les prérequis et commandes d’installation sont regroupés dans le [README](../../README.md).

La [matrice de couverture](../validation/coverage.md) relie les scénarios aux risques. Les tests ajoutés vérifient la configuration, la recherche MySQL sans accents, le traitement littéral des caractères LIKE, la pagination et les filtres combinés. Les composants vérifient le passage de page avec conservation du terme et la reprise après panne.

## Documents disponibles

Le [guide API](../api/README.md) fournit des exemples de consultation et de contact sans secrets ; OpenAPI inclut le healthcheck. Les [sources Mermaid et exports MCD/MLD](../conception/diagrams/README.md) peuvent être intégrés dans un document. Le [dossier éditable](../dossier/projet.md), la [veille](../security/veille.md), les [licences](../licenses.md) et la [recette](../validation/acceptance.md) structurent la livraison.

## Validation du 10 septembre 2026

| Contrôle exécuté | Résultat |
| --- | --- |
| `make verify` | Formatage, lint, types, tests et builds réussis |
| Tests frontend | 27 réussis |
| Tests backend hors base | 15 réussis ; suite MySQL désactivée hors intégration |
| `make integration-test` | 24 tests réussis avec MySQL éphémère ; pile arrêtée et supprimée |
| `make config prod-config test-config` | Trois configurations valides |
| `make prod-build` | Images de production construites |
| `make check database-check` | API disponible ; 4 catégories, 15 spécialités, 17 artisans et 3 vedettes conservés |
| Liens internes et SVG | Cibles des liens contrôlées et XML valide |
| Inventaire des dépendances | Versions directes installées comparées aux lockfiles |

Les avertissements Sass proviennent des dépréciations Bootstrap déjà présentes. Les commandes de recette et de déploiement ont été confrontées au Makefile ; cette validation ne constitue pas un nouveau déploiement ni une nouvelle passe d’audit navigateur/sécurité. L’installation a été vérifiée sur l’environnement existant, pas depuis une machine vierge. Le rapport du 9 septembre garde sa portée historique.

Restent à compléter pour la livraison finale : maquettes partagées, captures, liens publics, PDF final, revue humaine d’accessibilité, validation HTML/CSS et recette Traefik/SMTP réelle. Le dossier indique ces emplacements sans les présenter comme livrés.
