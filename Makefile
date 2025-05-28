include .env
export

HOSTS := localhost 127.0.0.1 ::1 backend frontend-admin frontend-pong grafana prometheus elasticsearch kibana logstash 


# Папки, куда будем писать pem-файлы
BACKEND_CERT_DIR := backend/certs
ADMIN_CERT_DIR   := frontend/admin/certs
PONG_CERT_DIR    := frontend/pong/certs
GRAFANA_CERT_DIR := devops/monitoring/grafana/certs
PROMETHEUS_CERT_DIR := devops/monitoring/prometheus/certs
ELK_CERT_DIR        := devops/elk/certs

ELK_COMPOSE := docker-compose -f docker-compose.yml -f docker-compose.elk.yml


.PHONY: all certs prepare-kibana-config up down down-volumes

all: certs prepare-kibana-config up

certs:
	@echo "→ Generating mkcert root CA (idempotent)…"
	@mkcert -install
	@echo "→ Ensuring cert dirs exist…"
	@mkdir -p $(BACKEND_CERT_DIR) $(ADMIN_CERT_DIR) $(PONG_CERT_DIR) $(GRAFANA_CERT_DIR) $(PROMETHEUS_CERT_DIR) $(ELK_CERT_DIR)
	@echo "→ Generating backend cert…"
	@mkcert -key-file $(BACKEND_CERT_DIR)/key.pem   		-cert-file $(BACKEND_CERT_DIR)/cert.pem   		 $(HOSTS)
	@echo "→ Generating admin cert…"
	@mkcert -key-file $(ADMIN_CERT_DIR)/key.pem     		-cert-file $(ADMIN_CERT_DIR)/cert.pem     		 $(HOSTS)
	@echo "→ Generating pong cert…"
	@mkcert -key-file $(PONG_CERT_DIR)/key.pem      		-cert-file $(PONG_CERT_DIR)/cert.pem      		 $(HOSTS)
	@echo "→ Generating grafana cert…"
	@mkcert -key-file $(GRAFANA_CERT_DIR)/grafana.key 		-cert-file $(GRAFANA_CERT_DIR)/grafana.crt 		 $(HOSTS)
	@chmod 644 $(GRAFANA_CERT_DIR)/*.key || true
	@echo "→ Generating prometheus cert…"
	@mkcert -key-file $(PROMETHEUS_CERT_DIR)/prometheus.key -cert-file $(PROMETHEUS_CERT_DIR)/prometheus.crt $(HOSTS)
	@chmod 644 $(PROMETHEUS_CERT_DIR)/*.key || true
	@echo "→ Generating ELK cert…"
	@mkcert -key-file $(ELK_CERT_DIR)/ELK.key        -cert-file $(ELK_CERT_DIR)/ELK.crt        $(HOSTS)
	@chmod 644 $(ELK_CERT_DIR)/*.key || true
	@cp "$$(mkcert -CAROOT)/rootCA.pem" $(ELK_CERT_DIR)/rootCA.pem

prepare-kibana-config:
	@echo "→ Запуск Elasticsearch для генерации токена Kibana…"
	@$(ELK_COMPOSE) up -d elasticsearch
	@sleep 20 # ждем Elasticsearch
	@export KIBANA_SERVICE_TOKEN=$$($(ELK_COMPOSE) exec elasticsearch \
		bin/elasticsearch-service-tokens create elastic/kibana kibana-token | tr -d '\r' | awk '{print $$4}') && \
		echo "→ Токен сгенерирован: $$KIBANA_SERVICE_TOKEN" && \
		mkdir -p devops/elk/config && \
		KIBANA_SERVICE_TOKEN=$$KIBANA_SERVICE_TOKEN envsubst \
			< devops/elk/config/kibana.yml.tpl \
			> devops/elk/config/kibana.yml
up:
	docker-compose -f docker-compose.yml -f docker-compose.elk.yml up --build

down:
	docker-compose -f docker-compose.yml -f docker-compose.elk.yml down

down-volumes:
	docker-compose -f docker-compose.yml -f docker-compose.elk.yml down -v
