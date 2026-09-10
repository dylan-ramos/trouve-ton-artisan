# Trouve ton artisan — Dossier du projet

Auteur : Dylan Ramos. Version documentaire : 10 septembre 2026. Statut : application développée, recette finale et publication à compléter.

## Sommaire

1. Contexte et besoins
2. Contraintes et conception
3. Données et API
4. Sécurité et validation
5. Liens et pièces de livraison

## 1. Contexte et besoins

La Région Auvergne-Rhône-Alpes souhaite faciliter la mise en relation des particuliers avec les artisans de son territoire. Le service organise un catalogue par catégorie, propose une recherche par nom et présente une fiche détaillée avec formulaire de contact. Le parcours doit rester accessible sur téléphone, tablette et ordinateur, y compris au clavier et avec une technologie d’assistance.

Les critères fonctionnels comprennent un header et un footer communs, quatre catégories issues de la base, quatre étapes explicatives sur l’accueil, trois artisans mis en avant, les résultats filtrés, une fiche complète et des pages transverses. Aucun espace administrateur, compte utilisateur, paiement ou prise de rendez-vous n’est inclus.

## 2. Contraintes et conception

React, Bootstrap et Sass portent une interface mobile first ; Node.js, Express, Sequelize et MySQL composent le serveur. TypeScript matérialise les contrats entre modules. L’organisation sépare composants réutilisables, pages, client HTTP, services métier et modèles. Les états chargement, vide, erreur et réussite sont prévus pour chaque parcours concerné.

La [spécification visuelle](../design/specification.md) décrit les écrans ; le [registre des actifs](../design/assets.md) décrit logo, favicons et Montserrat auto-hébergée. Les images individuelles absentes du jeu source sont remplacées par un monogramme, sans inventer de portrait.

À insérer après validation : captures accueil, catalogue, fiche/contact, pages transverses et 404 aux formats mobile, tablette et ordinateur ; inclure les états d’erreur et le formulaire invalide. Le lien Figma reste à renseigner.

## 3. Données et API

Une catégorie regroupe plusieurs spécialités ; chaque artisan appartient à une spécialité. Cette relation évite de dupliquer sa catégorie. Les données conservent 4 catégories, 15 spécialités, 17 artisans et 3 vedettes. Slugs uniques, clés étrangères et contraintes SQL protègent la cohérence. La note utilise un décimal et les accents sont stockés en utf8mb4.

Le [MCD/MLD détaillé](../conception/database.md) et les [sources Mermaid et exports](../conception/diagrams/README.md) accompagnent les scripts SQL. Sequelize charge les associations sans synchronisation destructive. L’[API](../api/README.md) sert des DTO publics sans e-mail ; le formulaire résout son destinataire exclusivement côté serveur.

## 4. Sécurité et validation

Les entrées sont normalisées et bornées avec Zod ; Sequelize paramètre les requêtes. Les quotas limitent les abus et le contact combine contrôle de format, honeypot, refus d’injection d’en-têtes et échappement du message HTML. SMTP exige TLS en production. Les secrets restent dans la configuration locale ; les variables du navigateur sont publiques.

En production, Traefik termine HTTPS, Nginx sert l’application et relaie `/api`, Express et MySQL restent privés. L’adresse du proxy de confiance est explicitement configurée. Les limites connues comprennent les quotas en mémoire, les essais humains d’accessibilité restants et la recette d’hébergement à réaliser.

La [matrice de couverture](../validation/coverage.md) relie risques et tests. La [procédure d’acceptation](../validation/acceptance.md), le [rapport d’audit](../security/audit-2026-09-09.md) et la [veille sourcée](../security/veille.md) documentent preuves et limites. Aucun score automatisé n’est assimilé à une conformité WCAG complète.

## 5. Liens et pièces de livraison

| Pièce | État / emplacement |
| --- | --- |
| Dépôt | [dylan-ramos/trouve-ton-artisan](https://github.com/dylan-ramos/trouve-ton-artisan) ; accessibilité publique à vérifier lors de la livraison |
| Installation et exploitation | [README](../../README.md) |
| Maquettes Figma | À renseigner après partage |
| Site HTTPS | À renseigner après déploiement et recette |
| Captures | À insérer avec légende, format et date |
| Schéma et seed | [Création](../../database/01-schema.sql), [alimentation](../../database/02-seed.sql) |
| Licences | [Inventaire](../licenses.md) |
| Procès-verbal de recette | À compléter selon la procédure d’acceptation |

Pour le PDF final, reprendre ce contenu dans un document paginé avec couverture, sommaire, en-tête « Trouve ton artisan », pied de page avec version et pagination. Insérer les diagrammes SVG et les captures, renseigner les liens manquants puis contrôler lisibilité, sélection du texte et liens après export. Ce fichier constitue le contenu éditable ; le PDF final attend les pièces de publication.
