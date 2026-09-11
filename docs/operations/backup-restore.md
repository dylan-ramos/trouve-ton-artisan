# Sauvegarde et restauration MySQL

## Sauvegarder

Prérequis : Docker accessible, Node.js et GnuPG sur l’hôte ; une clé publique GPG dont l’empreinte complète a été vérifiée. La clé privée et sa sauvegarde doivent rester séparées des archives et hors du dépôt. Le script chiffre pour l’empreinte explicitement fournie ; il ne détermine pas l’identité de son propriétaire.

Créer un dossier privé et choisir un nom d’archive neuf :

```bash
mkdir -p backups
chmod 700 backups
export BACKUP_RECIPIENT=EMPREINTE_GPG_COMPLETE_VERIFIEE
make backup BACKUP_MODE=production BACKUP_FILE=backups/avant-release.sql.gz.gpg
```

Remplacer l’empreinte d’exemple ; l’outil exige 40 ou 64 caractères hexadécimaux. `BACKUP_GPG_HOME` peut désigner un trousseau GPG dédié. `BACKUP_MODE=development` cible la base de développement ; `audit` cible la pile locale de recette. Les modes sont explicites pour éviter de confondre les environnements.

Le script emploie `mysqldump` avec transaction cohérente InnoDB, ordre primaire stable et sans tablespaces ni GTID. Il utilise le compte applicatif déjà présent dans le conteneur ; aucun mot de passe n’est passé en argument du client MySQL. Le dump est compressé puis chiffré par GPG, sans SQL temporaire sur disque. La sortie est créée en mode 0600 et un fichier existant est refusé. Un échec de dump ou de chiffrement ne publie pas d’archive partielle.

Cet outil est dimensionné pour ce petit annuaire : sorties et SQL décompressé bornés à 64 Mio. Il n’inclut ni comptes MySQL, ni configuration serveur, ni secrets SMTP ; ceux-ci nécessitent une conservation séparée. Éviter les modifications de schéma pendant le dump. Référence : [mysqldump MySQL 8.4](https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html).

## Vérifier une restauration

La clé privée correspondant à l’archive doit être accessible à GPG, avec son agent déverrouillé si nécessaire. N’utiliser que des archives de provenance vérifiée : le chiffrement ne constitue pas une signature de l’expéditeur.

```bash
make restore-check BACKUP_FILE=backups/avant-release.sql.gz.gpg
```

Le déchiffrement et le contrôle d’intégrité se terminent avant tout lancement de MySQL. L’outil crée ensuite une pile `-restore` sur réseau interne, sans port public, sans seed et avec MySQL en tmpfs. Il refuse une pile préexistante, vérifie les labels et le montage, exige une base vide nommée `trouve_ton_artisan_restore_test`, importe le SQL et compare les empreintes des dumps avant/après. Il arrête et retire la pile temporaire, sans supprimer de volume persistant.

Cette commande ne restaure jamais la base active. En cas de sinistre, préparer une instance de remplacement isolée avec un stockage persistant, restaurer une archive validée suivant la procédure MySQL, puis vérifier les données et l’application avant la bascule. Conserver l’ancienne instance jusqu’à validation. La procédure de promotion dépend de l’hébergement ; ne pas remplacer automatiquement les données de production par le jeu de test.

## Exploitation

Prévoir une sauvegarde avant chaque livraison et une fréquence adaptée aux modifications de données. Définir avec l’exploitant la perte maximale admissible et le temps de reprise cible. Copier les archives chiffrées hors de l’hôte, limiter leur accès et vérifier périodiquement la restauration. Documenter la rétention et la rotation des clés. Une archive sans clé privée récupérable n’est pas une sauvegarde utilisable.

La recette locale du 10 septembre a validé le chiffrement, les permissions, le refus d’écrasement, le rejet d’une archive altérée et une restauration au dump identique. La clé utilisée était éphémère et réservée à la recette.
