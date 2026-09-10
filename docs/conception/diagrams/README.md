# Diagrammes de données

Les fichiers Mermaid sont les sources à modifier dans un éditeur de texte :

- [mcd.mmd](mcd.mmd) : entités, propriétés et relations métier, sans clés étrangères.
- [mld.mmd](mld.mmd) : tables et colonnes, clés primaires, étrangères et contraintes d’unicité.

Les aperçus Mermaid figurent dans [database.md](../database.md), avec les règles de gestion et l’écriture relationnelle. Après modification d’un `.mmd`, mettre à jour son bloc d’aperçu et régénérer l’export correspondant. Le [schéma SQL](../../../database/01-schema.sql) précise les types physiques, tailles, index et contraintes.

## Lire les relations

La notation entité-association Mermaid utilise `||` pour « exactement un » et `o{` pour « zéro à plusieurs ». Ainsi, `CATEGORIE ||..o{ SPECIALITE` signifie qu’une catégorie peut contenir zéro à plusieurs spécialités et que chaque spécialité appartient à une seule catégorie. Une spécialité peut de même regrouper plusieurs artisans ; chaque artisan possède exactement une spécialité.

Le trait pointillé `..` indique une relation non identifiante : chaque entité possède son propre identifiant. Il ne signifie pas que la clé étrangère est facultative. Le MCD utilise des noms métier français ; le MLD reprend les noms de tables et de colonnes du SQL.

Dans le MLD, `PK` signifie clé primaire, `FK` clé étrangère et `UK` unicité. L’unicité composée de `specialties(category_id, name)` est explicitée en commentaire : ni `category_id` ni `name` n’est individuellement unique. Seuls `website_url` et `image_url` acceptent NULL.

Cette représentation utilise les [conventions Mermaid](https://mermaid.js.org/syntax/entityRelationshipDiagram.html), avec les cardinalités en patte d’oie. Les types du MCD sont des descriptions métier et ceux du MLD restent génériques ; les détails MySQL appartiennent au script SQL.

## Exports

[MCD SVG](mcd.svg) et [MLD SVG](mld.svg) sont des exports des sources `.mmd`, destinés à l’insertion dans le dossier ou à l’impression PDF. Pour modifier le contenu, partir des fichiers texte, puis utiliser le rendu Mermaid de l’éditeur et sa fonction d’export lorsqu’elle est disponible. Aucun fichier draw.io ni logiciel de dessin dédié n’est requis.
