PROJECT=ens-indexing
COMPOSE=docker compose -f .local/application.docker-compose.yml -p $(PROJECT)

build:
	$(COMPOSE) build
.PHONY: build

start:
	$(COMPOSE) up -d --remove-orphans
.PHONY: start

stop:
	$(COMPOSE) down
.PHONY: stop