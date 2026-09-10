# Recette de la version candidate — 10 septembre 2026

Base Git : `f08d05d`, avec les changements de préparation de release. La recette utilise les images de production sur une pile locale isolée ; elle ne constitue pas une mise en service publique.

## Contrôles exécutés

| Contrôle | Résultat |
| --- | --- |
| Formatage, lint, TypeScript et builds (`make verify`) | Réussis ; 27 tests frontend et 15 backend hors base |
| Garde-fous opérationnels | 3 tests de précontrôle réussis |
| Intégration MySQL | 24 tests réussis ; pile éphémère nettoyée |
| Compose développement, production et tests | Configurations valides |
| Démarrage des images de production en recette | Trois services sains dans l’ordre MySQL, Express, Nginx |
| Sécurité Nginx/API | En-têtes, isolation, quotas et non-divulgation d’e-mail vérifiés |
| Playwright et axe | 45 tests réussis après correction, quatre largeurs de 320 à 1440 pixels |
| Lighthouse accessibilité | 100/100 sur accueil, catalogue, fiche, page légale et 404 |
| HTML/CSS final | 11 DOM finaux et CSS compilé : aucune erreur ni avertissement Nu HTML Checker |
| npm audit | 0 vulnérabilité dans chacun des deux arbres |
| Trivy 0.74.0 | Frontend et backend sans alerte ; 46 alertes brutes gosu dans MySQL, 22 hautes/critiques qualifiées, aucune nouvelle alerte haute/critique non examinée |
| govulncheck v1.1.4 | Aucun symbole vulnérable trouvé dans le binaire gosu exact |
| Gitleaks 8.30.1 | Aucun secret détecté sur les 14 commits des références locales ; snapshot des fichiers de livraison également contrôlé |
| Fichiers indésirables dans l’historique | Aucun chemin de configuration locale, sauvegarde ou dépendances installé détecté par le contrôle de chemins |
| Persistance MySQL | Dump identique avant et après redémarrage du conteneur de développement ; volume conservé |
| Sauvegarde/restauration | Archive GPG 0600, écrasement et corruption refusés ; dump restauré identique dans une base temporaire |
| Arrêt de la pile de recette | Trois services arrêtés avec code 0, sans OOM ; délais et rotation vérifiés, pile retirée |
| Précontrôle de production | Refus attendu de la configuration locale : URL/proxy/SMTP non configurés pour la publication |

Les rapports bruts sont ignorés par Git et Docker dans `frontend/audit-results`, avec les journaux du lot sous `frontend/audit-results/lot12`. Les résultats sont datés, liés aux images construites et aux bases de vulnérabilités consultées ; ils ne garantissent pas l’absence de toute vulnérabilité future.

## Corrections révélées par la recette

Le validateur HTML a détecté un `aria-label` sur un `span` générique dans le composant de note. Le groupe visuel possède désormais le rôle `img` et son libellé explicite ; les tests demandent ce rôle accessible.

La minification CSS produisait un sélecteur `:-webkit-any(...)` contenant des combinateurs, rejeté par le validateur. Le build conserve maintenant le CSS compilé par Sass (`cssMinify: false`), sans filtre supprimant les erreurs et sans modification de Bootstrap. La feuille passe d’environ 233 à 287 Ko bruts ; l’estimation gzip du build passe de 33,06 à 36,53 Ko. La minification JavaScript reste active. Référence de configuration : [options CSS de Vite](https://vite.dev/config/build-options.html#build-cssminify).

Les dépréciations Sass de Bootstrap restent des avertissements de compilation. Elles ne sont pas masquées.

## Validateurs et portée

[Nu HTML Checker](https://validator.w3.org/nu/about.html), version `26.9.7 (d73d94b)`, est exécuté localement sur les DOM après chargement, et sur la feuille CSS réellement servie. L’archive Linux de la [publication officielle](https://github.com/validator/validator/releases) a été contrôlée avec l’empreinte SHA-256 `42a1081a4ac3d8fe30d5b12a8547a94dcbc1ee1b9456f418fa477aa98b6aad2f`. Aucun contenu de formulaire n’a été envoyé à un validateur externe.

```bash
make release-evidence
VNU_BIN=/chemin/vers/vnu make audit-markup
make audit-history
make dossier-pdf
```

L’export comprend les dix routes nominales, l’état du formulaire invalide et la feuille CSS compilée. Les états de panne et de chargement sont aussi contrôlés par axe dans les tests navigateur. Lighthouse porte ici sur l’accessibilité ; aucun score de performance n’est revendiqué.

## Sécurité résiduelle et décisions de publication

Les exceptions gosu restent documentées dans [image-exceptions.json](../security/image-exceptions.json) et expirent le 9 octobre 2026. Le scan brut MySQL contient toujours ses alertes ; les fonctions atteignables ont été analysées conformément au [rapport détaillé](../security/audit-2026-09-09.md).

Les quotas restent en mémoire, la base échange sur un réseau Docker interne sans TLS applicatif et les pages légales sont provisoires. Ces limites imposent une nouvelle revue si l’hébergement devient multi-instance ou multi-hôte. Les scanners de secrets ne prouvent pas l’absence de toute donnée sensible arbitraire.

Les contrôles de ce rapport portent sur la pile locale isolée et les versions indiquées. Les procédures de vérification sur l’hébergement sont décrites dans le [guide de production](../operations/production.md) et les [contrôles de livraison](checklist.md).
