# Procédure d’acceptation

Consigner pour chaque exécution : date, commit, environnement, navigateur, commande, résultat, lien vers la preuve et responsable. Ne déclarer réussi qu’un contrôle effectivement exécuté.

## Recette technique

Depuis un clone neuf, suivre le [README](../../README.md), créer les trois configurations locales, démarrer la pile et vérifier `make check` et `make database-check`. Exécuter `make verify`, `make config prod-config test-config`, `make integration-test` et `make prod-build`. Conserver les sorties et le code de retour. Après les tests MySQL, vérifier que la pile `-test` est arrêtée et que les données de développement restent présentes.

Démarrer `make audit-up`, puis exécuter les recettes sécurité, navigateur et Lighthouse du README. Terminer par `make audit-down`, même si une recette échoue. Vérifier les journaux avant toute nouvelle tentative ; conserver les preuves de l’échec.

## Parcours fonctionnels

| Parcours | Résultat attendu |
| --- | --- |
| Accueil | Quatre étapes, trois vedettes, liens fonctionnels |
| Menu | Quatre catégories chargées depuis l’API ; ouverture mobile et Échap |
| Recherche `Labbé`, puis terme absent | Résultat pertinent, puis état vide explicite |
| Catalogue et pagination | Paramètres conservés ; retour à la page précédente |
| Fiche | Nom, note, spécialité, ville, à-propos, site éventuel ; aucun e-mail privé |
| Contact invalide, valide, panne | Focus sur erreur ; état d’envoi ; réussite ou reprise explicite |
| URL inconnue et pages transverses | 404 utile, métadonnées cohérentes, pages légales signalées provisoires |
| Rechargement d’une route profonde | Nginx rend l’application, React retrouve la route |

## Recette humaine et mise en service

- Parcourir au clavier seul ; vérifier focus visible, ordre, évitement, menu et retour après navigation.
- Avec NVDA/Firefox, VoiceOver/Safari ou Orca, écouter repères, titres, notes et annonces du formulaire ; noter la combinaison exacte et le résultat.
- Tester le zoom natif 200 % et 400 %, texte agrandi, petits écrans et interaction tactile ; aucune perte d’information ou contrôle inaccessible.
- Exporter le DOM final des pages nominales et d’erreur, ainsi que le CSS compilé, dans les validateurs HTML/CSS W3C ; conserver les rapports et qualifier les diagnostics des bibliothèques.
- Sur l’hébergement : vérifier certificat, redirection HTTP vers HTTPS, adresse Traefik de confiance, HSTS et conservation de l’IP dans les quotas.
- Avec une boîte de recette autorisée : vérifier réception SMTP, texte/HTML, `Reply-To`, absence de destinataire privé dans la réponse et comportement en panne.
- Valider les contenus légaux définitifs, les liens publics, une sauvegarde et une restauration isolée avant ouverture.

Le résultat automatisé axe/Lighthouse n’est pas une déclaration de conformité WCAG. Les contrôles humains non exécutés restent « à effectuer ».
