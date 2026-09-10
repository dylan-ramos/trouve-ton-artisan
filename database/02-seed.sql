-- Trouve ton artisan — jeu d'essai fourni dans data.xlsx
-- Les identifiants explicites rendent les relations lisibles et reproductibles.

SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;

START TRANSACTION;

INSERT INTO categories (id, name, slug, display_order) VALUES
    (1, 'Bâtiment', 'batiment', 1),
    (2, 'Services', 'services', 2),
    (3, 'Fabrication', 'fabrication', 3),
    (4, 'Alimentation', 'alimentation', 4)
ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug), display_order = VALUES(display_order);

INSERT INTO specialties (id, category_id, name, slug) VALUES
    (1, 4, 'Boucher', 'boucher'),
    (2, 4, 'Boulanger', 'boulanger'),
    (3, 4, 'Chocolatier', 'chocolatier'),
    (4, 4, 'Traiteur', 'traiteur'),
    (5, 1, 'Chauffagiste', 'chauffagiste'),
    (6, 1, 'Electricien', 'electricien'),
    (7, 1, 'Menuisier', 'menuisier'),
    (8, 1, 'Plombier', 'plombier'),
    (9, 3, 'Bijoutier', 'bijoutier'),
    (10, 3, 'Couturier', 'couturier'),
    (11, 3, 'Ferronier', 'ferronier'),
    (12, 2, 'Coiffeur', 'coiffeur'),
    (13, 2, 'Fleuriste', 'fleuriste'),
    (14, 2, 'Toiletteur', 'toiletteur'),
    (15, 2, 'Webdesign', 'webdesign')
ON DUPLICATE KEY UPDATE category_id = VALUES(category_id), name = VALUES(name), slug = VALUES(slug);

INSERT INTO artisans
    (id, specialty_id, name, slug, rating, city, about, contact_email, website_url, image_url, is_featured)
VALUES
    (1, 1, 'Boucherie Dumont', 'boucherie-dumont', 4.5, 'Lyon', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus eleifend ante sem, id volutpat massa fermentum nec. Praesent volutpat scelerisque mauris, quis sollicitudin tellus sollicitudin.', 'artisan-1@example.invalid', NULL, NULL, FALSE),
    (2, 2, 'Au pain chaud', 'au-pain-chaud', 4.8, 'Montélimar', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus eleifend ante sem, id volutpat massa fermentum nec. Praesent volutpat scelerisque mauris, quis sollicitudin tellus sollicitudin.', 'artisan-2@example.invalid', NULL, NULL, TRUE),
    (3, 3, 'Chocolaterie Labbé', 'chocolaterie-labbe', 4.9, 'Lyon', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus eleifend ante sem, id volutpat massa fermentum nec. Praesent volutpat scelerisque mauris, quis sollicitudin tellus sollicitudin.', 'artisan-3@example.invalid', 'https://chocolaterie-labbe.fr', NULL, TRUE),
    (4, 4, 'Traiteur Truchon', 'traiteur-truchon', 4.1, 'Lyon', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus eleifend ante sem, id volutpat massa fermentum nec. Praesent volutpat scelerisque mauris, quis sollicitudin tellus sollicitudin.', 'artisan-4@example.invalid', 'https://truchon-traiteur.fr', NULL, FALSE),
    (5, 5, 'Orville Salmons', 'orville-salmons', 5.0, 'Evian', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus eleifend ante sem, id volutpat massa fermentum nec. Praesent volutpat scelerisque mauris, quis sollicitudin tellus sollicitudin.', 'artisan-5@example.invalid', NULL, NULL, TRUE),
    (6, 6, 'Mont Blanc Eléctricité', 'mont-blanc-electricite', 4.5, 'Chamonix', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus eleifend ante sem, id volutpat massa fermentum nec. Praesent volutpat scelerisque mauris, quis sollicitudin tellus sollicitudin.', 'artisan-6@example.invalid', 'https://mont-blanc-electricite.com', NULL, FALSE),
    (7, 7, 'Boutot & fils', 'boutot-et-fils', 4.7, 'Bourg-en-bresse', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus eleifend ante sem, id volutpat massa fermentum nec. Praesent volutpat scelerisque mauris, quis sollicitudin tellus sollicitudin.', 'artisan-7@example.invalid', 'https://boutot-menuiserie.com', NULL, FALSE),
    (8, 8, 'Vallis Bellemare', 'vallis-bellemare', 4.0, 'Vienne', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus eleifend ante sem, id volutpat massa fermentum nec. Praesent volutpat scelerisque mauris, quis sollicitudin tellus sollicitudin.', 'artisan-8@example.invalid', 'https://plomberie-bellemare.com', NULL, FALSE),
    (9, 9, 'Claude Quinn', 'claude-quinn', 4.2, 'Aix-les-bains', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus eleifend ante sem, id volutpat massa fermentum nec. Praesent volutpat scelerisque mauris, quis sollicitudin tellus sollicitudin.', 'artisan-9@example.invalid', NULL, NULL, FALSE),
    (10, 10, 'Amitee Lécuyer', 'amitee-lecuyer', 4.5, 'Annecy', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus eleifend ante sem, id volutpat massa fermentum nec. Praesent volutpat scelerisque mauris, quis sollicitudin tellus sollicitudin.', 'artisan-10@example.invalid', 'https://lecuyer-couture.com', NULL, FALSE),
    (11, 11, 'Ernest Carignan', 'ernest-carignan', 5.0, 'Le Puy-en-Velay', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus eleifend ante sem, id volutpat massa fermentum nec. Praesent volutpat scelerisque mauris, quis sollicitudin tellus sollicitudin.', 'artisan-11@example.invalid', NULL, NULL, FALSE),
    (12, 12, 'Royden Charbonneau', 'royden-charbonneau', 3.8, 'Saint-Priest', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus eleifend ante sem, id volutpat massa fermentum nec. Praesent volutpat scelerisque mauris, quis sollicitudin tellus sollicitudin.', 'artisan-12@example.invalid', NULL, NULL, FALSE),
    (13, 12, 'Leala Dennis', 'leala-dennis', 3.8, 'Chambéry', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus eleifend ante sem, id volutpat massa fermentum nec. Praesent volutpat scelerisque mauris, quis sollicitudin tellus sollicitudin.', 'artisan-13@example.invalid', 'https://coiffure-leala-chambery.fr', NULL, FALSE),
    (14, 12, 'C''est sup''hair', 'c-est-sup-hair', 4.1, 'Romans-sur-Isère', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus eleifend ante sem, id volutpat massa fermentum nec. Praesent volutpat scelerisque mauris, quis sollicitudin tellus sollicitudin.', 'artisan-14@example.invalid', 'https://sup-hair.fr', NULL, FALSE),
    (15, 13, 'Le monde des fleurs', 'le-monde-des-fleurs', 4.6, 'Annonay', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus eleifend ante sem, id volutpat massa fermentum nec. Praesent volutpat scelerisque mauris, quis sollicitudin tellus sollicitudin.', 'artisan-15@example.invalid', 'https://le-monde-des-fleurs-annonay.fr', NULL, FALSE),
    (16, 14, 'Valérie Laderoute', 'valerie-laderoute', 4.5, 'Valence', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus eleifend ante sem, id volutpat massa fermentum nec. Praesent volutpat scelerisque mauris, quis sollicitudin tellus sollicitudin.', 'artisan-16@example.invalid', NULL, NULL, FALSE),
    (17, 15, 'CM Graphisme', 'cm-graphisme', 4.4, 'Valence', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus eleifend ante sem, id volutpat massa fermentum nec. Praesent volutpat scelerisque mauris, quis sollicitudin tellus sollicitudin.', 'artisan-17@example.invalid', 'https://cm-graphisme.com', NULL, FALSE)
ON DUPLICATE KEY UPDATE
    specialty_id = VALUES(specialty_id), name = VALUES(name), slug = VALUES(slug),
    rating = VALUES(rating), city = VALUES(city), about = VALUES(about),
    contact_email = VALUES(contact_email), website_url = VALUES(website_url),
    image_url = VALUES(image_url), is_featured = VALUES(is_featured);

COMMIT;
