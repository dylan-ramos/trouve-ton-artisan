-- Remplace les coordonnées de contact sans supprimer les artisans.
-- Réexécutable : le résultat dépend uniquement de l’identifiant.
START TRANSACTION;
UPDATE artisans
SET contact_email = CONCAT('artisan-', id, '@example.invalid'),
    updated_at = updated_at;
COMMIT;
SELECT COUNT(*) AS contacts_anonymises
FROM artisans
WHERE contact_email = CONCAT('artisan-', id, '@example.invalid');
