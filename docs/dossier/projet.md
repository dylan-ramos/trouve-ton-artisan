# Trouve ton artisan — Dossier du projet

Auteur : Dylan Ramos. Version documentaire : 10 septembre 2026.

## Sommaire

1. Contexte et besoins
2. Contraintes et conception
3. Données et API
4. Sécurité et validation
5. Liens et pièces de livraison
6. Préparation opérationnelle

## 1. Contexte et besoins

La Région Auvergne-Rhône-Alpes souhaite faciliter la mise en relation des particuliers avec les artisans de son territoire. Le service organise un catalogue par catégorie, propose une recherche par nom et présente une fiche détaillée avec formulaire de contact. Le parcours doit rester accessible sur téléphone, tablette et ordinateur, y compris au clavier et avec une technologie d’assistance.

Les critères fonctionnels comprennent un header et un footer communs, quatre catégories issues de la base, quatre étapes explicatives sur l’accueil, trois artisans mis en avant, les résultats filtrés, une fiche complète et des pages transverses. Aucun espace administrateur, compte utilisateur, paiement ou prise de rendez-vous n’est inclus.

## 2. Contraintes et conception

React, Bootstrap et Sass portent une interface mobile first ; Node.js, Express, Sequelize et MySQL composent le serveur. TypeScript matérialise les contrats entre modules. L’organisation sépare composants réutilisables, pages, client HTTP, services métier et modèles. Les états chargement, vide, erreur et réussite sont prévus pour chaque parcours concerné.

La [spécification visuelle](../design/specification.md) décrit les écrans ; le [registre des actifs](../design/assets.md) décrit logo, favicons et Montserrat auto-hébergée. Les images individuelles absentes du jeu source sont remplacées par un monogramme, sans inventer de portrait.

Les captures de recette du 10 septembre sont disponibles dans [captures](captures/README.md) : accueil, catalogue, fiche, page légale, 404 et formulaire invalide, à 375, 768 et 1440 pixels. Elles sont intégrées au PDF de recette. Les [maquettes Figma](https://www.figma.com/design/kpnXYMfChXTyp13cdCs2L6/trouve-ton-artisan?node-id=0-1) présentent la conception des interfaces.

## 3. Données et API

Une catégorie regroupe plusieurs spécialités ; chaque artisan appartient à une spécialité. Cette relation évite de dupliquer sa catégorie. Les données conservent 4 catégories, 15 spécialités, 17 artisans et 3 vedettes. Slugs uniques, clés étrangères et contraintes SQL protègent la cohérence. La note utilise un décimal et les accents sont stockés en utf8mb4.

Le [MCD/MLD détaillé](../conception/database.md) et les [sources Mermaid et exports](../conception/diagrams/README.md) accompagnent les scripts SQL. Sequelize charge les associations sans synchronisation destructive. L’[API](../api/README.md) sert des DTO publics sans e-mail ; le formulaire résout son destinataire exclusivement côté serveur.

## 4. Sécurité et validation

Les entrées sont normalisées et bornées avec Zod ; Sequelize paramètre les requêtes. Les quotas limitent les abus et le contact combine contrôle de format, honeypot, refus d’injection d’en-têtes et échappement du message HTML. SMTP exige TLS en production. Les secrets restent dans la configuration locale ; les variables du navigateur sont publiques.

En production, Traefik termine HTTPS, Nginx sert l’application et relaie `/api`, Express et MySQL restent privés. L’adresse du proxy de confiance est explicitement configurée. Les quotas sont conservés en mémoire et s’appliquent à une instance du backend.

La [matrice de couverture](../validation/coverage.md) relie risques et tests. La [procédure d’acceptation](../validation/acceptance.md), le [rapport d’audit](../security/audit-2026-09-09.md) et la [veille sourcée](../security/veille.md) documentent preuves et limites. Aucun score automatisé n’est assimilé à une conformité WCAG complète.

### Veille et vulnérabilités étudiées

La veille documentaire du 10 septembre s’appuie sur les recommandations de sécurité d’[Express](https://expressjs.com/en/advanced/best-practice-security/), la documentation de [npm audit](https://docs.npmjs.com/cli/v11/commands/npm-audit/) et la référence [WCAG 2.1 du W3C](https://www.w3.org/WAI/WCAG21/quickref/). Elle relie validation des entrées, transport TLS, suivi des dépendances et critères d’accessibilité aux contrôles du projet.

Le cas principal étudié concerne gosu, utilisé au démarrage de MySQL pour changer d’utilisateur. Trivy signale 46 alertes brutes liées à sa bibliothèque Go, dont 22 hautes/critiques. L’analyse du binaire exact par govulncheck ne trouve aucun symbole vulnérable appelé. Une exception ciblée conserve les identifiants, l’empreinte et une échéance au 9 octobre 2026 ; elle doit être réexaminée si le binaire ou les alertes changent. La [politique de sécurité de gosu](https://github.com/tianon/gosu/blob/1.19/SECURITY.md) explique cette distinction entre version signalée et fonctions utilisées. Les images frontend/backend et les deux arbres npm ne présentent aucune alerte lors du contrôle du 10 septembre.

La recette a également trouvé et corrigé un libellé ARIA sans rôle adapté sur les notes, ainsi qu’un sélecteur invalide généré par la minification CSS. Après correction, les 11 DOM et le CSS servis passent Nu HTML Checker sans diagnostic ; 45 tests navigateur réussissent et Lighthouse atteint 100/100 en accessibilité sur cinq pages. Les résultats restent limités aux versions et aux parcours testés et ne remplacent pas les essais humains.

## 5. Liens et pièces de livraison

| Pièce | Emplacement |
| --- | --- |
| Dépôt | [dylan-ramos/trouve-ton-artisan](https://github.com/dylan-ramos/trouve-ton-artisan) |
| Installation et exploitation | [README](../../README.md) |
| Maquettes Figma | [Maquettes](https://www.figma.com/design/kpnXYMfChXTyp13cdCs2L6/trouve-ton-artisan?node-id=0-1) |
| Site HTTPS | [Adresse de publication](https://trouve-ton-artisan.srv924756.hstgr.cloud) |
| Captures | [18 captures datées](captures/README.md), intégrées au PDF de recette |
| Schéma et seed | [Création](../../database/01-schema.sql), [alimentation](../../database/02-seed.sql) |
| Licences | [Inventaire](../licenses.md) |
| Procès-verbal de recette | [Rapport local](../release/audit-final.md) |

Le dossier PDF est généré depuis ce document avec `make dossier-pdf`. Il comprend une couverture, un sommaire, les diagrammes et les captures de l’application, avec une pagination et des liens cliquables.


## 6. Préparation opérationnelle

La sauvegarde est compressée puis chiffrée par GPG sans SQL temporaire sur disque. La restauration de contrôle utilise une base vide en tmpfs et compare le dump obtenu à la source. Les journaux Docker sont bornés et les services disposent de délais d’arrêt adaptés. Un précontrôle refuse les principales valeurs de démonstration avant mise en service.

Le [guide de production](../operations/production.md) décrit la configuration, le déploiement et le retour arrière. Le [rapport de recette](../release/audit-final.md) présente les contrôles exécutés et leur périmètre ; la [procédure de livraison](../release/checklist.md) décrit les contrôles applicables à chaque publication.
