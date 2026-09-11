# Notice 08 — Fiche artisan et contact

## Consultation de la fiche

`ArtisanPage` récupère l'artisan depuis le slug de l'URL. La requête est annulée lorsque la page change et une garde ignore toute réponse obsolète. La fiche présente le nom, la note accessible, la spécialité, la ville, la présentation et le site éventuel.

Le lien externe est rendu uniquement pour un protocole HTTP ou HTTPS et utilise `noopener noreferrer`. En l'absence d'image, un monogramme décoratif occupe la zone visuelle.

## Parcours d'un message

```text
ContactForm
  -> POST /api/artisans/{slug}/contact
  -> validation Zod
  -> ContactService
  -> adresse privée chargée depuis MySQL
  -> transport Nodemailer
  -> serveur SMTP
```

Le navigateur transmet uniquement le slug public. Le serveur charge explicitement le scope Sequelize `withContactEmail` au dernier moment ; l'adresse de l'artisan n'apparaît dans aucune réponse HTTP.

## Validation et expérience utilisateur

Les quatre champs visibles possèdent des longueurs minimales et maximales côté navigateur et serveur. Les erreurs sont reliées aux champs avec `aria-describedby` et `aria-invalid`. Une région `aria-live` annonce le succès ou la panne. Pendant l'envoi, le bouton est désactivé et une seconde soumission est ignorée.

## Protections serveur

- corps JSON limité à 32 Kio ;
- objet Zod strict et espaces périphériques normalisés ;
- retours chariot et sauts de ligne interdits dans les champs utilisés comme en-têtes ;
- contenu HTML échappé et sujet préfixé par le serveur ;
- honeypot `website` produisant un faux succès sans requête SQL ni courrier ;
- cinq demandes maximum en quinze minutes par adresse cliente ;
- panne SMTP transformée en erreur neutre sans contenu, destinataire ou détail technique.

## Configuration SMTP

Sans `SMTP_HOST`, le développement et les tests utilisent le transport JSON de Nodemailer : aucun courrier réel ne quitte l'application. En production, `SMTP_HOST` est obligatoire et le démarrage échoue si la configuration est incomplète.

Les secrets se placent uniquement dans `backend/.env.local`, ignoré par Git :

```dotenv
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=replace-with-smtp-user
SMTP_PASSWORD=replace-with-smtp-password
SMTP_FROM=no-reply@example.com
```

Le port 465 utilise généralement `SMTP_SECURE=true`. Le port 587 utilise généralement `false` puis négocie STARTTLS, obligatoire en production ; un serveur qui le refuse ne reçoit aucun message. Les paramètres exacts dépendent du fournisseur.

Au démarrage des conteneurs de développement, `npm ci` resynchronise les volumes `node_modules` avec les lockfiles. Une nouvelle dépendance est ainsi disponible après `make up` sans supprimer le volume MySQL ni modifier les lockfiles.

## Vérification

```bash
make quality-check
make integration-test
make prod-build
make up
curl http://localhost:5174/api/artisans/chocolaterie-labbe
make down
```

Les tests capturent le courrier sans livraison réelle et vérifient l'échappement HTML, les validations, l'injection d'en-tête, le honeypot, la limite de débit, l'artisan inconnu, la confidentialité et la panne SMTP.
