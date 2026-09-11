-- Trouve ton artisan — schéma MySQL 8.4
-- Exécuté dans MYSQL_DATABASE à la première initialisation du volume Docker.

SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS categories (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    display_order SMALLINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_categories_name UNIQUE (name),
    CONSTRAINT uq_categories_slug UNIQUE (slug),
    CONSTRAINT uq_categories_display_order UNIQUE (display_order),
    CONSTRAINT chk_categories_name_not_blank CHECK (CHAR_LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_categories_slug_format CHECK (slug REGEXP '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT chk_categories_display_order_positive CHECK (display_order > 0)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS specialties (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    category_id SMALLINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_specialties_category_name UNIQUE (category_id, name),
    CONSTRAINT uq_specialties_slug UNIQUE (slug),
    CONSTRAINT chk_specialties_name_not_blank CHECK (CHAR_LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_specialties_slug_format CHECK (slug REGEXP '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT fk_specialties_category FOREIGN KEY (category_id) REFERENCES categories (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    INDEX idx_specialties_category_id (category_id)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS artisans (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    specialty_id SMALLINT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(160) NOT NULL,
    rating DECIMAL(2, 1) UNSIGNED NOT NULL,
    city VARCHAR(120) NOT NULL,
    about TEXT NOT NULL,
    contact_email VARCHAR(254) NOT NULL,
    website_url VARCHAR(2048) NULL,
    image_url VARCHAR(2048) NULL,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_artisans_slug UNIQUE (slug),
    CONSTRAINT chk_artisans_name_not_blank CHECK (CHAR_LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_artisans_slug_format CHECK (slug REGEXP '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT chk_artisans_rating_range CHECK (rating BETWEEN 0.0 AND 5.0),
    CONSTRAINT chk_artisans_city_not_blank CHECK (CHAR_LENGTH(TRIM(city)) > 0),
    CONSTRAINT chk_artisans_about_not_blank CHECK (CHAR_LENGTH(TRIM(about)) > 0),
    CONSTRAINT chk_artisans_email_not_blank CHECK (CHAR_LENGTH(TRIM(contact_email)) > 0),
    CONSTRAINT fk_artisans_specialty FOREIGN KEY (specialty_id) REFERENCES specialties (id)
        ON UPDATE RESTRICT ON DELETE RESTRICT,
    INDEX idx_artisans_specialty_id (specialty_id),
    INDEX idx_artisans_name (name),
    INDEX idx_artisans_featured (is_featured)
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
