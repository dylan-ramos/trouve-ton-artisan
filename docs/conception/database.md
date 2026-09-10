# Conception de la base de données

## Modèle conceptuel de données (MCD)

[Source modifiable : mcd.mmd](diagrams/mcd.mmd).

```mermaid
erDiagram
    CATEGORIE ||..o{ SPECIALITE : contient
    SPECIALITE ||..o{ ARTISAN : regroupe

    CATEGORIE {
        identifiant id "Identifiant de la categorie"
        texte nom
        texte slug
        entier ordre_affichage
    }
    SPECIALITE {
        identifiant id "Identifiant de la specialite"
        texte nom
        texte slug
    }
    ARTISAN {
        identifiant id "Identifiant de l artisan"
        texte nom
        texte slug
        decimal note "De 0 a 5"
        texte ville
        texte presentation
        texte email_contact "Prive"
        texte site_web "Facultatif"
        texte image "Facultative"
        booleen mis_en_avant
    }
```

Règles de gestion du projet :

- une catégorie contient zéro à plusieurs spécialités ;
- une spécialité appartient à exactement une catégorie ;
- une spécialité regroupe zéro à plusieurs artisans ;
- un artisan appartient à exactement une spécialité ;
- la catégorie d'un artisan est donc obtenue par sa spécialité, sans colonne redondante dans `artisans` ;
- un artisan peut ne pas avoir de site ou d'image ;
- l'e-mail est nécessaire au contact, mais ne fait pas partie de son profil public.

## Modèle logique de données (MLD)

[Source modifiable : mld.mmd](diagrams/mld.mmd).

```mermaid
erDiagram
    categories ||..o{ specialties : contient
    specialties ||..o{ artisans : regroupe

    categories {
        entier id PK
        texte name UK
        texte slug UK
        entier display_order UK
        horodatage created_at
        horodatage updated_at
    }
    specialties {
        entier id PK
        entier category_id FK "Obligatoire ; unique avec name"
        texte name "Unique avec category_id"
        texte slug UK
        horodatage created_at
        horodatage updated_at
    }
    artisans {
        entier id PK
        entier specialty_id FK "Obligatoire"
        texte name
        texte slug UK
        decimal rating "De 0 a 5 ; une decimale"
        texte city
        texte about
        texte contact_email "Prive"
        texte website_url "NULL autorise"
        texte image_url "NULL autorise"
        booleen is_featured
        horodatage created_at
        horodatage updated_at
    }
```

Écriture relationnelle équivalente :

```text
CATEGORY(
  #id, name [UQ], slug [UQ], display_order [UQ], created_at, updated_at
)

SPECIALTY(
  #id, name, slug [UQ], created_at, updated_at,
  category_id [NN] -> CATEGORY.id,
  UNIQUE(category_id, name)
)

ARTISAN(
  #id, name, slug [UQ], rating, city, about, contact_email,
  website_url?, image_url?, is_featured, created_at, updated_at,
  specialty_id [NN] -> SPECIALTY.id
)
```

`#` désigne une clé primaire, `[NN]` une valeur obligatoire, `[UQ]` une valeur unique et `?` une valeur facultative.

## Choix techniques

- InnoDB garantit les clés étrangères et les transactions.
- `utf8mb4_0900_ai_ci` stocke correctement les accents et permet des comparaisons insensibles à la casse et aux accents, utiles à la recherche.
- Les clés numériques sont petites parce que le domaine est limité, tandis que les URL utilisent des slugs lisibles et stables.
- `DECIMAL(2,1)` représente exactement une note sur cinq, contrairement à un flottant approximatif.
- `RESTRICT` empêche de supprimer une catégorie ou spécialité encore utilisée.
- La catégorie n'est pas dupliquée sur l'artisan : cela évite des incohérences et respecte la troisième forme normale.
- `contact_email` est stocké pour le serveur SMTP, mais les DTO publics l’excluent.

## Index

- Les contraintes uniques créent leurs propres index sur noms/slugs utiles.
- `specialties.category_id` accélère la navigation par catégorie.
- `artisans.specialty_id` accélère les jointures.
- `artisans.name` aide les recherches préfixées ; une recherche `%terme%` sur 17 lignes reste acceptable, mais un moteur plein texte serait à étudier à grande échelle.
- `artisans.is_featured` accélère la récupération des artisans du mois.

## Données fournies

Le seed conserve les 17 lignes du tableur, y compris les graphies qui paraissent éventuellement fautives. Il ajoute seulement des identifiants et slugs techniques. Il contient 4 catégories, 15 spécialités et exactement 3 artisans marqués comme vedettes.
