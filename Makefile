SHELL := /bin/sh

include .env
-include .env.local

LOCAL_ENV_FILE := $(wildcard .env.local)
ENV_FILES := --env-file .env $(if $(LOCAL_ENV_FILE),--env-file .env.local)
COMPOSE := docker compose $(ENV_FILES)
COMPOSE_DEV := $(COMPOSE) -f compose.yaml -f compose.dev.yaml
COMPOSE_PROD := $(COMPOSE) -f compose.yaml

.DEFAULT_GOAL := help

.PHONY: help check-env install format format-check lint typecheck test quality-check network config build up down restart ps logs check frontend-logs backend-logs database-logs frontend-shell backend-shell database-shell clean prod-config prod-build prod-up prod-deploy prod-down prod-restart prod-ps prod-logs

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

quality-check: format-check lint typecheck test ## Exécute tous les contrôles hors build

network: ## Crée le réseau externe utilisé par Traefik s'il est absent
	@docker network inspect proxy >/dev/null 2>&1 || docker network create proxy

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

prod-up: check-env network ## Démarre la production derrière Traefik
	@$(COMPOSE_PROD) up -d --wait

prod-deploy: prod-config prod-build prod-up ## Valide, construit et démarre la production

prod-down: check-env ## Arrête la production sans supprimer les données
	@$(COMPOSE_PROD) down --remove-orphans

prod-restart: prod-down prod-up ## Redémarre la production

prod-ps: check-env ## Affiche l'état des services de production
	@$(COMPOSE_PROD) ps

prod-logs: check-env ## Suit les journaux de production
	@$(COMPOSE_PROD) logs -f
