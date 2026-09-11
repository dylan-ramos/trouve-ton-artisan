# Notice 09 — Pages transverses et référencement

## Routes publiques

Les pages de mentions légales, données personnelles, accessibilité et cookies utilisent le même `AppLayout` que le reste du site. Leur contenu indique sans ambiguïté ce qui doit encore être publié avant la mise en service. Toute autre URL affiche une page 404 utile, illustrée et dotée d'un retour vers l'accueil.

React Router traite la navigation côté navigateur. En production, la directive Nginx `try_files $uri $uri/ /index.html` renvoie aussi `index.html` lors du rechargement direct d'une route profonde ; React peut alors rendre la page demandée.

## Métadonnées dynamiques

Le composant `Seo` centralise pour chaque écran :

- le titre et la description ;
- l'URL canonical absolue ;
- les directives d'indexation ;
- les propriétés Open Graph principales ;
- le format de carte générique pour le partage ;
- les données structurées JSON-LD lorsqu'elles décrivent des informations réellement disponibles.

Les recherches et la 404 utilisent `noindex, follow` afin de ne pas créer de pages de faible valeur dans les résultats. Les catégories, fiches, pages transverses et l'accueil restent indexables. Aucune grande image de partage n'est déclarée : les actifs disponibles n'ont pas le format adapté, et une image inadéquate dégraderait l'aperçu.

## URL de production

L'URL publique n'est pas écrite en dur dans l'application. La variable d'infrastructure `SITE_URL` alimente `VITE_SITE_URL` pendant le build :

```dotenv
TRAEFIK_HOST=artisans.example.com
SITE_URL=https://artisans.example.com
```

Ces deux valeurs doivent décrire le même hôte en production. Elles ne sont pas secrètes : leur présence dans le JavaScript et les fichiers publics est normale.

## Sitemap et robots

Un plugin Vite génère `robots.txt` et `sitemap.xml` pendant chaque build. Les URL proviennent de `SITE_URL`, les pages indexables connues sont incluses et la recherche interne est exclue. Cette génération évite les liens incohérents lors d'un changement de domaine.

## Vérification

```bash
make quality-check
make prod-build
make config
```

Après démarrage de l'image frontend, une route profonde doit retourner l'application et les fichiers générés doivent contenir le domaine configuré :

```bash
curl --fail http://localhost:8080/mentions-legales
curl --fail http://localhost:8080/robots.txt
curl --fail http://localhost:8080/sitemap.xml
```
