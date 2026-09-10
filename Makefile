SHELL := /bin/sh

include .env
-include .env.local

LOCAL_ENV_FILE := $(wildcard .env.local)
ENV_FILES := --env-file .env $(if $(LOCAL_ENV_FILE),--env-file .env.local)
COMPOSE := docker compose $(ENV_FILES)
COMPOSE_DEV := $(COMPOSE) -f compose.yaml -f compose.dev.yaml
COMPOSE_PROD := $(COMPOSE) -f compose.yaml
COMPOSE_TEST := $(COMPOSE) --project-name $(COMPOSE_PROJECT_NAME)-test -f compose.test.yaml

.DEFAULT_GOAL := help

.PHONY: help check-env install format format-check lint typecheck test test-config integration-test quality-check database-check network config build up down restart ps logs check frontend-logs backend-logs database-logs frontend-shell backend-shell database-shell clean prod-config prod-build prod-up prod-deploy prod-down prod-restart prod-ps prod-logs

help: ## Affiche les commandes disponibles
	@awk 'BEGIN {FS = ":.*## "; printf "Commandes disponibles :\n"} /^[a-zA-Z_-]+:.*## / {printf "  %-18s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

check-env: ## Vérifie la présence des configurations locales
	@test -f .env.local || (echo "Copiez .env vers .env.local et remplacez les secrets." && exit 1)
	@test -f frontend/.env.local || (echo "Copiez frontend/.env vers frontend/.env.local." && exit 1)
	@test -f backend/.env.local || (echo "Copiez backend/.env vers backend/.env.local et remplacez les secrets." && exit 1)

install: ## Installe les dépendances des deux applications
	@npm --prefix backend ci
	@npm --prefix frontend ci

format: ## Formate les deux applications
	@npm --prefix backend run format
	@npm --prefix frontend run format

format-check: ## Vérifie le formatage des deux applications
	@npm --prefix backend run format:check
	@npm --prefix frontend run format:check

lint: ## Analyse statiquement les deux applications
	@npm --prefix backend run lint
	@npm --prefix frontend run lint

typecheck: ## Vérifie les types des deux applications
	@npm --prefix backend run typecheck
	@npm --prefix frontend run typecheck

test: ## Exécute les tests des deux applications
	@npm --prefix backend test
	@npm --prefix frontend test

test-config: check-env ## Valide la configuration des tests d'intégration
	@$(COMPOSE_TEST) config --quiet

integration-test: test-config ## Exécute les tests backend avec une base MySQL éphémère
	@status=0; $(COMPOSE_TEST) up --build --abort-on-container-exit --exit-code-from backend-test || status=$$?; $(COMPOSE_TEST) down --remove-orphans; exit $$status

quality-check: format-check lint typecheck test operations-check ## Exécute tous les contrôles hors build

network: ## Crée le réseau externe utilisé par Traefik s'il est absent
	@docker network inspect "$(TRAEFIK_NETWORK)" >/dev/null 2>&1 || docker network create "$(TRAEFIK_NETWORK)"

config: check-env ## Valide la configuration de développement
	@$(COMPOSE_DEV) config --quiet

build: check-env ## Construit les images de développement
	@$(COMPOSE_DEV) build

up: check-env ## Démarre le développement et attend les healthchecks
	@$(COMPOSE_DEV) up -d --build --wait

down: check-env ## Arrête le développement sans supprimer les données
	@$(COMPOSE_DEV) down --remove-orphans

restart: down up ## Redémarre le développement

ps: check-env ## Affiche l'état des services de développement
	@$(COMPOSE_DEV) ps

logs: check-env ## Suit tous les journaux de développement
	@$(COMPOSE_DEV) logs -f

check: check-env ## Vérifie le frontend et le proxy API locaux
	@curl --fail --silent http://127.0.0.1:$(FRONTEND_PORT)/ >/dev/null
	@curl --fail --silent http://127.0.0.1:$(FRONTEND_PORT)/api/health

database-check: check-env ## Vérifie les comptages du jeu de données via Sequelize
	@$(COMPOSE_DEV) exec backend npm run db:check

frontend-logs: check-env ## Suit les journaux du frontend
	@$(COMPOSE_DEV) logs -f frontend

backend-logs: check-env ## Suit les journaux du backend
	@$(COMPOSE_DEV) logs -f backend

database-logs: check-env ## Suit les journaux MySQL
	@$(COMPOSE_DEV) logs -f database

frontend-shell: check-env ## Ouvre un shell dans le frontend
	@$(COMPOSE_DEV) exec frontend sh

backend-shell: check-env ## Ouvre un shell dans le backend
	@$(COMPOSE_DEV) exec backend sh

database-shell: check-env ## Ouvre le client MySQL avec le compte applicatif
	@$(COMPOSE_DEV) exec database sh -c 'mysql --user="$$DB_USER" --password="$$DB_PASSWORD" "$$DB_NAME"'

clean: down ## Arrête les services sans supprimer le volume MySQL

prod-config: check-env ## Valide la configuration de production
	@$(COMPOSE_PROD) config --quiet

prod-build: check-env ## Construit les images de production
	@$(COMPOSE_PROD) build

prod-up: check-env prod-preflight network ## Démarre la production derrière Traefik
	@$(COMPOSE_PROD) up -d --wait

prod-deploy: ## Valide, construit et démarre la production séquentiellement
	@$(MAKE) prod-config prod-preflight
	@$(MAKE) prod-build
	@$(MAKE) prod-up

prod-down: check-env ## Arrête la production sans supprimer les données
	@$(COMPOSE_PROD) down --remove-orphans

prod-restart: prod-down prod-up ## Redémarre la production

prod-ps: check-env ## Affiche l'état des services de production
	@$(COMPOSE_PROD) ps

prod-logs: check-env ## Suit les journaux de production
	@$(COMPOSE_PROD) logs -f

# The audit stack has its own project and an ephemeral MySQL, with no mail delivery.
COMPOSE_AUDIT := $(COMPOSE) --project-name $(COMPOSE_PROJECT_NAME)-audit -f compose.yaml -f compose.audit.yaml
AUDIT_PORT ?= 5180
AUDIT_BASE_URL ?= http://127.0.0.1:$(AUDIT_PORT)

.PHONY: audit-config audit-up audit-down audit-security audit-browser audit-lighthouse

audit-config: check-env ## Valide la recette isolée des images de production
	@$(COMPOSE_AUDIT) config --quiet

audit-up: audit-config ## Démarre la recette sans utiliser le volume de développement
	@$(COMPOSE_AUDIT) up -d --build --wait --pull never

audit-down: ## Arrête la recette éphémère sans supprimer de volume persistant
	@$(COMPOSE_AUDIT) down --remove-orphans

audit-security: ## Vérifie Nginx, le proxy, les quotas et l'isolation de la recette
	@AUDIT_PROJECT_NAME=$(COMPOSE_PROJECT_NAME)-audit AUDIT_BASE_URL=$(AUDIT_BASE_URL) node scripts/security-audit.mjs

audit-browser: ## Audite WCAG, clavier et responsive avec Chrome local
	@AUDIT_BASE_URL=$(AUDIT_BASE_URL) npm --prefix frontend run test:a11y

audit-lighthouse: ## Génère les rapports Lighthouse d'accessibilité
	@AUDIT_BASE_URL=$(AUDIT_BASE_URL) npm --prefix frontend run audit:lighthouse

.PHONY: audit-images

audit-images: ## Analyse les images locales avec Trivy et conserve les rapports JSON
	@AUDIT_PROJECT_NAME=$(COMPOSE_PROJECT_NAME)-audit MYSQL_VERSION=$(MYSQL_VERSION) APP_PROD_IMAGE_TAG=$(APP_PROD_IMAGE_TAG) sh scripts/audit-images.sh

.PHONY: audit-reset

audit-reset: ## Réinitialise uniquement les quotas du backend de recette
	@$(COMPOSE_AUDIT) restart backend
	@$(COMPOSE_AUDIT) up -d --wait --no-build

.PHONY: audit-gosu

audit-gosu: ## Vérifie les fonctions vulnérables réellement liées dans gosu
	@AUDIT_PROJECT_NAME=$(COMPOSE_PROJECT_NAME)-audit sh scripts/audit-gosu.sh

.PHONY: app-build verify

app-build: ## Compile les deux applications avec leurs lockfiles installés
	@npm --prefix backend run build
	@npm --prefix frontend run build

verify: ## Exécute séquentiellement qualité et compilation des deux applications
	@$(MAKE) quality-check
	@$(MAKE) app-build

.PHONY: backup restore-check
BACKUP_MODE ?= production

backup: check-env ## Sauvegarde MySQL chiffrée (BACKUP_FILE, BACKUP_RECIPIENT)
	@test -n "$(BACKUP_FILE)" || (echo "Définir BACKUP_FILE." && exit 1)
	@node scripts/database-backup.mjs backup "$(BACKUP_FILE)" "$(BACKUP_MODE)"

restore-check: check-env ## Vérifie une sauvegarde dans MySQL éphémère (BACKUP_FILE)
	@test -n "$(BACKUP_FILE)" || (echo "Définir BACKUP_FILE." && exit 1)
	@node scripts/database-backup.mjs restore-check "$(BACKUP_FILE)"

.PHONY: prod-preflight operations-check release-evidence

prod-preflight: check-env ## Refuse les valeurs de démonstration avant un démarrage public
	@$(COMPOSE_PROD) config --format json | docker run --rm -i --network none --read-only --cap-drop ALL --security-opt no-new-privileges --user node --mount type=bind,src="$(CURDIR)/scripts/production-preflight.mjs",dst=/preflight.mjs,readonly node:$(NODE_VERSION)-alpine node /preflight.mjs

operations-check: ## Vérifie les garde-fous de déploiement
	@node --test scripts/production-preflight.test.mjs
	@node --check scripts/database-backup.mjs

release-evidence: ## Produit captures et DOM sur la pile de recette active
	@cd frontend && AUDIT_BASE_URL=$(AUDIT_BASE_URL) node scripts/release-evidence.mjs

.PHONY: dossier-pdf

dossier-pdf: ## Exporte le dossier PDF depuis les documents et captures existants
	@cd frontend && node scripts/export-dossier.mjs

.PHONY: audit-history

audit-history: ## Recherche les secrets dans toutes les références Git locales
	@sh scripts/audit-history.sh

.PHONY: audit-markup

audit-markup: ## Valide les DOM et CSS capturés avec Nu HTML Checker (VNU_BIN)
	@sh scripts/audit-markup.sh

.PHONY: prod-anonymize-emails
prod-anonymize-emails: check-env ## Remplace toutes les adresses artisans de production par des adresses fictives
	@$(COMPOSE_PROD) exec -T database sh -c 'MYSQL_PWD="$$MYSQL_PASSWORD" mysql --user="$$MYSQL_USER" "$$MYSQL_DATABASE"' < database/migrations/03-anonymize-contact-emails.sql
