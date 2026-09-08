# Spécification UX et UI

Ce document prépare la réalisation dans Figma et l'implémentation React. Il ne remplace pas le lien Figma demandé dans le livrable final.

## Principes

- Concevoir d'abord à 375 px, puis vérifier à 768 px et 1440 px.
- Une action principale claire par zone, vocabulaire simple et contenu lisible.
- Navigation et formulaires utilisables au clavier, au toucher et au lecteur d'écran.
- Contraste WCAG 2.1 AA, focus visible, texte redimensionnable et aucun sens porté uniquement par une couleur ou une icône.
- Réutiliser la palette, le logo et le favicon fournis.
- Utiliser Montserrat comme typographie officielle du site. Ce choix est volontaire : Graphik est une police propriétaire dont la redistribution n'est pas autorisée avec les sources disponibles, tandis que Montserrat est distribuée sous licence libre SIL OFL 1.1 et peut être auto-hébergée avec sa licence.

Palette de l'identité visuelle :

| Rôle initial à confirmer par les tests de contraste | Couleur |
| --- | --- |
| Fond très clair | `#f1f8fc` |
| Bleu principal | `#0074c7` |
| Bleu foncé | `#00497c` |
| Texte sombre | `#384050` |
| Alerte/erreur | `#cd2c2e` |
| Accent positif | `#82b864` |

La présence d'une couleur dans la charte ne garantit pas son contraste pour tout usage. Le futur design system devra tester chaque couple texte/fond et réserver certaines teintes aux grandes surfaces, bordures ou éléments décoratifs si nécessaire.

## Gabarit commun

Header : lien d'évitement, logo vers l'accueil, navigation issue de l'API, bouton de menu mobile et recherche par nom. Sur mobile, le menu est repliable mais la recherche reste simple à atteindre.

Zone principale : largeur lisible, un seul `h1`, fil d'Ariane uniquement sur les vues profondes.

Footer : adresse complète de Lyon, téléphone cliquable et liens vers mentions légales, données personnelles, accessibilité et cookies.

## Écrans

### Accueil

1. Introduction courte et recherche.
2. « Comment trouver mon artisan ? » avec les quatre étapes imposées et leurs numéros.
3. « Les artisans du mois » avec trois cartes alimentées par l'API.
4. États : squelette/chargement, erreur avec nouvelle tentative, données absentes.

### Catalogue par catégorie et recherche

1. Titre indiquant la catégorie ou la requête.
2. Nombre de résultats.
3. Grille de cartes : une colonne mobile, deux tablette, trois desktop.
4. États vide, chargement, erreur et pagination si l'API l'exige.

### Fiche artisan

1. Retour ou fil d'Ariane.
2. Image ou illustration neutre, nom, note textuelle et étoilée, spécialité, ville.
3. À-propos puis lien de site externe facultatif.
4. Formulaire de contact avec nom, e-mail, objet et message.
5. États de validation par champ, envoi, succès et panne.

### Pages légales

Le gabarit commun, un `h1` spécifique et « Page en construction ». Les quatre URL restent distinctes afin de pouvoir recevoir leur futur contenu.

### Page 404

Illustration décorative ou décrite selon sa fonction, titre « Page non trouvée », explication et lien vers l'accueil. Elle est atteinte par toute route inconnue.

## Composants prévus

`AppLayout`, `Header`, `CategoryNavigation`, `SearchForm`, `Footer`, `ArtisanCard`, `Rating`, `LoadingState`, `ErrorState`, `EmptyState`, `ContactForm`, `Seo` et `NotFoundPage`.

Un composant partagé doit représenter un concept stable ; on n'extrait pas un composant uniquement pour éviter trois lignes de JSX.

## Prototype Figma à préparer

- Frames 375 × 812, 768 × 1024 et 1440 × 1024 pour chaque écran.
- Composants avec variantes : carte, champ, bouton, navigation, alerte et notation.
- Styles ou variables : couleurs, typographies, espacements et élévations.
- Liens du prototype : logo vers accueil, catégories vers catalogue, recherche vers résultats, cartes vers fiche, footer vers pages légales et route inconnue vers 404.
- Captures exportées dans un format lisible pour le dossier PDF final.
