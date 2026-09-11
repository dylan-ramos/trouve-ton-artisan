# Notice 10 — Accessibilité et sécurité

## Parcours accessibles

Les changements de route placent le focus sur `main` et remontent la page, sans déplacer le focus lors du premier chargement. Le lien d’évitement permet de rejoindre ce même repère. Le menu mobile s’ouvre au clavier et Échap le ferme en rendant le focus au bouton.

Chaque état de catalogue et de fiche possède un titre principal. Les titres des cartes et des états vides respectent leur contexte. Les zones de recherche du menu et de l’accueil ont des noms accessibles distincts. Le formulaire associe aides et erreurs aux champs, place le focus sur le premier champ invalide et annonce l’envoi, le résultat et les pannes. Une nouvelle fiche ne conserve ni les données ni le brouillon de contact de la précédente.

Le focus comporte deux couleurs pour rester visible sur les surfaces claires et foncées ; les champs ont une bordure contrastée. Les grilles prennent en compte la taille du texte avec des minima en `rem`. Les animations et le défilement animé respectent la préférence de mouvement réduit. Les critères de référence sont [l’ordre du focus](https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html), [les messages de statut](https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html) et [le reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow.html).

## Frontière HTTP

Nginx applique une CSP sans JavaScript ou CSS inline ni `eval`, interdit l’intégration en iframe, borne les corps à 32 Kio et pose `nosniff`, `Referrer-Policy` et `Permissions-Policy`. Les en-têtes s’appliquent aussi aux fichiers statiques et aux erreurs. Les fichiers HTML sont revalidés et les actifs non hachés ne sont plus déclarés immuables. Les directives sont incluses dans chaque emplacement qui redéfinit des en-têtes afin de respecter [les règles d’héritage Nginx](https://nginx.org/en/docs/http/ngx_http_headers_module.html).

Les scripts, styles, polices et connexions viennent de la même origine. Les images autorisent aussi `data:` pour Bootstrap et HTTPS pour les éventuelles images d’artisans. La CSP n’autorise aucun script tiers. Les images HTTP distantes ne sont pas admises en production.

Express protège les réponses avec Helmet et `no-store`. Les JSON malformés, corps trop gros ou encodages refusés renvoient respectivement 400, 413 et 415, sans corps original ni stack. Les quotas précèdent le parsing : 120 requêtes par minute et cinq contacts en quinze minutes. Le healthcheck reste accessible. La recherche limite les pages à 10 000 et les listes à 50 résultats. Sequelize paramètre les requêtes et les DTO excluent l’adresse privée de contact.

Le contact exige `application/json`, refuse `Sec-Fetch-Site: cross-site` et ne fournit aucun en-tête CORS permissif. Cela réduit les soumissions depuis d’autres sites ; une API publique reste directement appelable par un client HTTP. Les protections contre le spam restent donc nécessaires.

## Chaîne de confiance et HTTPS

```text
Client -> Traefik (TLS) -> Nginx -> Express -> MySQL
                                   -> SMTP via le réseau egress
```

Définir `TRAEFIK_TRUSTED_IP` dans `.env.local` avec l’adresse exacte et stable du conteneur Traefik sur `proxy`. La valeur par défaut `127.0.0.1` ne fait confiance à aucun proxy distant. Ne pas utiliser une plage couvrant tous les conteneurs. Sans configuration correcte, HSTS ne sera pas émis derrière Traefik et les quotas regrouperont ses clients.

Nginx ne reprend l’adresse et le protocole annoncés que lorsque le pair correspond à cette adresse. Il remplace ensuite `X-Forwarded-For` par une seule adresse, remplace le protocole et supprime `Forwarded`. Express fait confiance à un seul saut, Nginx, sur le réseau privé. HSTS, limité au domaine courant, est émis uniquement pour HTTPS identifié par ce pair. Les en-têtes externes falsifiés ne doivent pas modifier le quota ni imposer HSTS. Ce fonctionnement suit les recommandations de [Nginx realip](https://nginx.org/en/docs/http/ngx_http_realip_module.html) et [d’Express derrière un proxy](https://expressjs.com/en/guide/behind-proxies/).

Traefik doit conserver `forwardedHeaders.insecure=false`. S’il existe un proxy supplémentaire devant Traefik, seules ses adresses doivent figurer dans `forwardedHeaders.trustedIPs`, conformément à [sa documentation](https://doc.traefik.io/traefik/reference/install-configuration/entrypoints/). La recette locale vérifie le comportement Nginx avec un pair de confiance simulé ; le certificat public, la redirection HTTP vers HTTPS et l’adresse réelle de Traefik devront être recettés sur l’hébergement.

## SMTP et données

Le serveur refuse les caractères de contrôle des champs d’en-tête avant leur normalisation, échappe le contenu HTML et résout seul le destinataire. En production, Nodemailer exige TLS/STARTTLS avec vérification normale des certificats, interdit l’accès aux fichiers et URL de pièces jointes et borne les délais. Voir [les options SMTP officielles](https://nodemailer.com/smtp). Le développement sans SMTP utilise un transport JSON sans livraison.

La base n’a aucun port hôte. Express n’a plus de port hôte, y compris en développement : utiliser `/api` via le frontend. Le réseau `database` est interne ; `egress` permet au backend de joindre le SMTP sans l’exposer par Traefik. Ce réseau n’est pas un pare-feu limitant la sortie au seul port SMTP : une restriction plus fine relève du pare-feu de l’hôte.

Les journaux d’accès Nginx omettent IP, paramètres de recherche, referer et user-agent. Les erreurs applicatives imprévues ne journalisent ni le corps ni l’erreur brute. Les journaux d’infrastructure restent à encadrer par une durée de conservation adaptée lors du déploiement.

## Images

Les applications s’exécutent sous `101` pour Nginx et `node` pour Express, sans capacités Linux et avec `no-new-privileges`. Les paquets Alpine reçoivent leurs correctifs lors de la construction. Le backend démarre directement avec Node ; npm et Corepack sont retirés de l’image finale.

L’image MySQL est dérivée de la version 8.4 sélectionnée. Elle corrige les paquets Oracle Linux en excluant les dépôts MySQL de la mise à jour, conserve le serveur et l’entrypoint officiels et retire MySQL Shell ainsi que ses dépendances Python embarquées, inutilisés. Le client `mysql` et les scripts d’initialisation restent disponibles. L’entrypoint conserve les permissions nécessaires pour initialiser le stockage puis passe à l’utilisateur `mysql`.

## Reproduire la recette

Prérequis : dépendances npm installées, Docker Compose prenant en charge `!override`/`!reset`, Chrome local (ou `BROWSER_CHANNEL` adapté), fichiers `.env.local` habituels.

```bash
make quality-check
make config
make prod-config
make test-config
make integration-test
make prod-build
make audit-up
make audit-reset
make audit-security
make audit-browser
make audit-lighthouse
make audit-gosu
make audit-images
make audit-down
```

La recette utilise le projet Docker suffixé `-audit`, MySQL en tmpfs et Nginx sur `127.0.0.1:5180`. `AUDIT_PORT` permet de changer ce port. Elle ne monte jamais le volume MySQL de développement et n’envoie aucun e-mail : les soumissions navigateur sont interceptées ; les tests serveur utilisent un transport simulé ou le honeypot. Le backend d’audit n’a pas de sortie réseau SMTP.

Les rapports restent dans `frontend/audit-results/`, ignoré par Git et Docker. La commande Trivy applique uniquement les exceptions précises, datées et vérifiées du rapport. Elle télécharge une version fixe, vérifie son archive par SHA-256 et consulte une base de vulnérabilités actualisée. Elle n’envoie pas le code applicatif à un service d’analyse. Après correction ou pour une seconde passe, utiliser `make audit-reset` pour redémarrer le backend de la pile d’audit pour réinitialiser les quotas ; ne jamais modifier les limites de l’application pour faire passer les tests.

Les résultats datés et les vérifications manuelles restantes figurent dans [le rapport d’audit](../security/audit-2026-09-09.md). Un score automatique ne constitue pas une déclaration de conformité WCAG.
