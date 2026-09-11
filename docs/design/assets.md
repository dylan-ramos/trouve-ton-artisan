# Actifs de l'identité visuelle

Les fichiers ci-dessous proviennent du kit graphique officiel « Trouve ton artisan » fourni par la Région Auvergne-Rhône-Alpes. Ils sont conservés dans `frontend/public` pour être servis directement par le navigateur.

| Actif applicatif | Source | SHA-256 de la source |
| --- | --- | --- |
| `assets/logo.png` | `Logo.png` | `d626ad76f87f7f5bd697eb5bfd8cea10e2ae9802bfd6b46047e549c51acf2bff` |
| `favicon-16.png` | `favicon.png` | `59e22fdb185a3b9e784c094f4b0fe341a7fe6971e5362f11f3f23bcb0b7daa49` |
| `favicon-32.png` | `favicon-32.png` | `8dd98fd9b3c366c8b160af1570e576ba37e1f4d8d5699f0cd3ba819f51fe66f5` |
| `assets/fonts/montserrat-variable.ttf` | `Montserrat-VariableFont_wght.ttf` | `498dc34d0fa45288e0ac5345bd385c98bf81c56ee70209aacfb4a22a6510697c` |
| `assets/fonts/OFL.txt` | `OFL.txt` | `77669d97bc1fcef80d834ac2c1432943d48ed9ae4cdfc80f26e49d1da84830ac` |

Le logo PNG pèse environ 32 Kio. Sa résolution permet un affichage net sur les écrans à forte densité, tandis que ses dimensions visibles sont bornées par le CSS afin d'éviter tout déplacement de mise en page.

## Décision typographique

Le remplacement de Graphik par Montserrat est un choix de conception volontaire, et non une police manquante ou une erreur d'intégration. Graphik est une police propriétaire dont les sources disponibles n'autorisent pas la redistribution. Montserrat offre une identité géométrique proche et sa licence SIL Open Font License 1.1 autorise son intégration locale et sa redistribution avec le projet.

La variante variable de Montserrat couvre les graisses 100 à 900 avec un seul téléchargement. `font-display: swap` rend immédiatement le texte avec Arial ou Helvetica pendant son chargement. Aucun service typographique tiers n'est contacté.
