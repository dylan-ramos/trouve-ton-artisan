# Inventaire des licences

Inventaire du 10 septembre 2026, établi depuis les `package.json` installés correspondant aux lockfiles. Il recense les dépendances directes ; les dépendances transitives et composants système des images conservent leurs propres notices et ne sont pas tous détaillés ici. Réexaminer cet inventaire à chaque changement de dépendance. Les textes applicables sont fournis dans les paquets (`LICENSE`, `LICENCE` ou fichiers équivalents).

## Actifs

| Actif | Origine / licence |
| --- | --- |
| Montserrat | SIL Open Font License 1.1 ; [texte redistribué](../frontend/public/assets/fonts/OFL.txt) |
| Logo et favicons | Kit fourni pour le projet ; aucune licence ouverte explicite fournie, ne pas leur attribuer une licence MIT |
| Données artisans | Jeu source fourni ; aucune licence ouverte explicite documentée |
| Diagrammes SVG | Documents du projet, sans actif tiers incorporé |
| Graphik | Non distribuée ; remplacée volontairement par Montserrat |

Les empreintes des actifs figurent dans le [registre graphique](design/assets.md). Le dépôt ne contient pas de licence globale autorisant la réutilisation de son code ; cet inventaire n’en accorde pas une implicitement.

## Dépendances directes

| Application | Paquet | Version installée | Licence déclarée | Usage |
| --- | --- | --- | --- | --- |
| frontend | bootstrap | 5.3.8 | MIT | Exécution |
| frontend | react | 19.2.8 | MIT | Exécution |
| frontend | react-dom | 19.2.8 | MIT | Exécution |
| frontend | react-router-dom | 7.18.3 | MIT | Exécution |
| frontend | @axe-core/playwright | 4.13.0 | MPL-2.0 | Développement / tests |
| frontend | @eslint/js | 10.0.1 | MIT | Développement / tests |
| frontend | @playwright/test | 1.63.0 | Apache-2.0 | Développement / tests |
| frontend | @testing-library/jest-dom | 7.0.1 | MIT | Développement / tests |
| frontend | @testing-library/react | 16.3.3 | MIT | Développement / tests |
| frontend | @types/node | 26.5.0 | MIT | Développement / tests |
| frontend | @types/react | 19.2.18 | MIT | Développement / tests |
| frontend | @types/react-dom | 19.2.7 | MIT | Développement / tests |
| frontend | @vitejs/plugin-react | 6.1.1 | MIT | Développement / tests |
| frontend | eslint | 10.10.0 | MIT | Développement / tests |
| frontend | eslint-plugin-react-hooks | 7.1.1 | MIT | Développement / tests |
| frontend | eslint-plugin-react-refresh | 0.5.6 | MIT | Développement / tests |
| frontend | globals | 17.12.0 | MIT | Développement / tests |
| frontend | jsdom | 30.0.1 | MIT | Développement / tests |
| frontend | lighthouse | 13.4.1 | Apache-2.0 | Développement / tests |
| frontend | prettier | 3.9.6 | MIT | Développement / tests |
| frontend | sass | 1.104.0 | MIT | Développement / tests |
| frontend | typescript | 6.0.3 | Apache-2.0 | Développement / tests |
| frontend | typescript-eslint | 8.70.0 | MIT | Développement / tests |
| frontend | vite | 8.2.2 | MIT | Développement / tests |
| frontend | vitest | 5.0.0 | MIT | Développement / tests |
| backend | express | 5.2.1 | MIT | Exécution |
| backend | express-rate-limit | 8.7.0 | MIT | Exécution |
| backend | helmet | 8.3.0 | MIT | Exécution |
| backend | mysql2 | 3.24.4 | MIT | Exécution |
| backend | nodemailer | 10.0.1 | MIT-0 | Exécution |
| backend | sequelize | 6.37.8 | MIT | Exécution |
| backend | zod | 4.5.4 | MIT | Exécution |
| backend | @eslint/js | 10.0.1 | MIT | Développement / tests |
| backend | @types/express | 5.0.6 | MIT | Développement / tests |
| backend | @types/node | 26.5.0 | MIT | Développement / tests |
| backend | @types/nodemailer | 8.0.1 | MIT | Développement / tests |
| backend | @types/supertest | 7.2.1 | MIT | Développement / tests |
| backend | eslint | 10.10.0 | MIT | Développement / tests |
| backend | prettier | 3.9.6 | MIT | Développement / tests |
| backend | supertest | 7.2.2 | MIT | Développement / tests |
| backend | tsx | 4.23.13 | MIT | Développement / tests |
| backend | typescript | 6.0.3 | Apache-2.0 | Développement / tests |
| backend | typescript-eslint | 8.70.0 | MIT | Développement / tests |

Les images Node/Alpine, Nginx et MySQL comprennent des composants tiers supplémentaires. Conserver leurs notices lors de la redistribution ; l’inventaire npm ne constitue pas un inventaire des licences système.
