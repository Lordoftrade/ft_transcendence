# Trance & Dance Monitoring Stack (ELK + Prometheus + Grafana)

## Overview

This project provides monitoring and logging for a microservice-based system using:

- **Elasticsearch** + **Logstash** + **Kibana (ELK)** — centralized logging
- **Prometheus**, **Grafana**, **Alertmanager** — metrics collection and alerting
- **Node Exporter**, **cAdvisor** — host and container metrics
- **Docker Compose** — service orchestration

## Features

- Centralized logging via Logstash with visualization in Kibana
- Collection of container and host metrics
- Dashboards and graphs in Grafana
- Alerts for container failures and high CPU usage

## Launch

```bash
make all
```

---

## 🔧 Backend

> _Coming soon:_ Description of the backend service, endpoints, environment configuration, and development instructions.

---

## 🎨 Frontend

> _Coming soon:_ Description of the frontend services (admin, pong), environment configuration, and how to develop and run them locally.

---

## 🧱 Architecture

> _Coming soon:_ Overview diagram of the architecture and explanation of how services interact (log flow, metrics, alert flow).

---

## ⚙️ Environment Setup

> _Coming soon:_ Instructions on `.env` files, local overrides, and SSL certificate trust setup.

---

## 🚨 Alerts

Prometheus is configured with the following alerting rules:

- High CPU usage on host or container
- Container is down or missing
- (Optional) Elasticsearch or Logstash availability checks

---

## 🔐 Certificates

Certificates are automatically generated using `mkcert`.

- `ELK.crt` and `ELK.key` used by Elasticsearch, Kibana, and Logstash
- `rootCA.pem` is required to trust self-signed certs in browsers or Node.js
- Backend uses `NODE_EXTRA_CA_CERTS=/app/certs/rootCA.pem` to trust Kibana’s certificate

---

## 🛠 Troubleshooting

- **Kibana not receiving logs?**
  Make sure you’ve visited the backend URL in your browser to accept the self-signed cert.

- **Grafana dashboards show missing data?**
  Check that metrics from cAdvisor and Node Exporter are reaching Prometheus.

---

## 📁 Folder Structure

> _Coming soon:_ Summary of project folder layout.
