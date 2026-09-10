# Veille de sécurité et accessibilité

Revue documentaire du 10 septembre 2026. Les constats de scans restent ceux de l’[audit du 9 septembre](audit-2026-09-09.md) tant qu’un nouveau scan n’est pas consigné.

| Source primaire consultée | Enseignement et application au projet |
| --- | --- |
| [Express : sécurité en production](https://expressjs.com/en/advanced/best-practice-security/) | Validation des entrées, TLS, Helmet et suivi des dépendances ; appliqués aux frontières HTTP et au déploiement |
| [npm audit](https://docs.npmjs.com/cli/v11/commands/npm-audit/) | Analyse des dépendances connues ; conserver le lockfile, la date, le rapport et vérifier les changements proposés avant correction |
| [gosu 1.19 : politique de sécurité](https://github.com/tianon/gosu/blob/1.19/SECURITY.md) | Distinguer version Go signalée et fonctions atteignables ; qualification du binaire exact dans le rapport d’audit |
| [W3C : référence WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) | Relier les contrôles aux critères de clavier, focus, contraste, reflow et identification des erreurs ; compléter l’automatisation par des essais humains |

## Cas étudié : alertes du binaire gosu

Le scan daté du 9 septembre conserve 46 alertes brutes liées à Go dans l’image MySQL. Le contrôle du binaire exact par govulncheck n’a trouvé aucun symbole vulnérable. Les 22 alertes hautes/critiques sont qualifiées individuellement dans [image-exceptions.json](image-exceptions.json), avec empreinte et expiration au 9 octobre 2026. Cela ne signifie pas que le scan brut est vide. Réexaminer l’exception à expiration, lors d’un changement de binaire ou dès une nouvelle alerte.

## Processus de suivi

Avant une livraison et régulièrement pendant l’exploitation, lancer `npm audit --audit-level=low` dans chaque application, puis les audits d’images décrits dans la notice de sécurité. Conserver date, commit, versions des outils et base de vulnérabilités. Lire l’avis primaire de chaque alerte, identifier le paquet réellement embarqué, évaluer l’exposition et tester le correctif. Éviter une mise à jour forcée sans revue des incompatibilités. Toute exception doit avoir une justification, une cible exacte, un responsable et une échéance ; aucune alerte ne doit disparaître uniquement du rapport.
