# Couverture fondée sur les risques

La couverture est décrite par comportements vérifiés, sans pourcentage de lignes revendiqué. `make verify` exécute les contrôles statiques, les tests locaux et les builds ; `make integration-test` ajoute la base réelle isolée.

| Risque | Preuves automatisées |
| --- | --- |
| Configuration inutilisable ou TLS mal interprété | `backend/test/environment.test.ts`, `mail-transport.test.ts` : ports, champs obligatoires, booléen SMTP, refus sans STARTTLS |
| Données perdues ou associations incorrectes | `persistence.test.ts` : comptages 4/15/17/3, associations, scope privé |
| Recherche trop large ou pagination incohérente | `persistence.test.ts` : accents, caractères LIKE, tentative SQL, deux pages sans doublon, page vide, filtres combinés |
| Fuite d’e-mail et erreurs internes | `persistence.test.ts`, `app.test.ts`, `security.test.ts` : DTO, erreurs neutres, SMTP indisponible |
| Spam et entrées malveillantes | `security.test.ts`, `persistence.test.ts` : quotas, JSON, CR/LF, honeypot, cross-site et en-têtes falsifiés |
| Navigation et recherche désynchronisées | `CatalogPage.test.tsx` : réponse obsolète, pagination conservant la recherche, panne puis nouvelle tentative |
| Fiche et contact incorrects | `ArtisanPage.test.tsx` : validation, double soumission, lien externe et changement de slug |
| Métadonnées ou routes absentes | `App.test.tsx`, `HomePage.test.tsx` : navigation, 404, SEO et états de l’accueil |
| Régression navigateur et accessibilité | `frontend/e2e/accessibility.spec.ts` : axe, clavier, formats et formulaire sur images de production |

Les nouveaux tests ne modifient pas les données métier. Les tests d’intégration ferment la connexion et le Makefile arrête la pile éphémère ; aucun volume persistant n’est supprimé. Les mocks frontend sont restaurés après chaque cas ; les transports de test capturent les messages sans livraison. Le backend exécute les fichiers de tests séquentiellement, ce qui évite une concurrence involontaire entre quotas et base.

## Limites

Les tests composants simulent HTTP ; les tests MySQL vérifient la requête réelle. Ces deux niveaux se complètent. La recette humaine lecteur d’écran, zoom natif, navigateurs supplémentaires, SMTP et Traefik réels reste décrite dans la [procédure d’acceptation](acceptance.md). Le rapport du [9 septembre](../security/audit-2026-09-09.md) conserve ses résultats datés ; il ne représente pas une nouvelle exécution.
