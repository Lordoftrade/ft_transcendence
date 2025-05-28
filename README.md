# Trance & Dance: стек мониторинга (ELK + Prometheus + Grafana)

## Обзор

Проект представляет собой систему централизованного логирования и мониторинга микросервисной архитектуры с использованием:

* **ELK (Elasticsearch, Logstash, Kibana)** для сбора, хранения и анализа логов
* **Prometheus + Grafana + Alertmanager** для сбора метрик, визуализации и настроек оповещений (Telegram)
* **Node Exporter + cAdvisor** для мониторинга хостов и контейнеров
* **Docker Compose** для оркестрации всех сервисов

## 🔧 Бэкенд

Команда бэкенд-разработчиков создала микросервисы на Node.js:

* **Game Service:** бизнес-логика игры и WebSocket-коммуникация
* **User Service:** управление профилями, аутентификация (JWT)
* **Слой БД:** SQLite, единая база `dev.db`
* **Инфраструктура:** контейнеризация сервисов через Docker и управление переменными окружения

## 🎨 Фронтенд

Фронтенд-команда разработала два React-приложения:

* **Admin Dashboard:** панель управления пользователями и аналитикой
* **Pong UI:** браузерная реализация игры Pong
* **Сборка и деплой:** Webpack, Docker-образы и CI/CD для автоматического развёртывания

## ⚙️ DevOps (Мой вклад)

В рамках командного проекта я отвечал за разработку и развёртывание инфраструктуры мониторинга и логирования.

### 1. ELK (Elasticsearch, Logstash, Kibana)

* **Elasticsearch:** запуск кластера через Docker Compose для индексирования и хранения логов
* **Logstash:** настройка конвейеров (pipelines) для приёма, парсинга и доставки логов в Elasticsearch
* **Kibana:** создание дашбордов и визуализаций для анализа ключевых логов и ошибок
* **TLS/HTTPS:** все соединения между компонентами ELK защищены через TLS, обеспечивая безопасный обмен данными по HTTPS.

### 2. Prometheus + Grafana + Alertmanager Prometheus + Grafana + Alertmanager

* **Prometheus:** сбор метрик с Node Exporter, cAdvisor и приложений
* **Кастомные экспортеры:** настройка метрик через клиентские библиотеки Prometheus
* **Grafana:** дашборды для CPU, памяти, сети и пользовательских метрик с шаблонами (variables)
* **Alertmanager:** правила для CPU (>80% за 5 мин), памяти (>85%) и недоступности контейнеров; интеграция оповещений через Telegram-бота

## 🚀 Запуск и остановка проекта

В корне репозитория:

```bash
# Генерация сертификатов для всех компонентов (через mkcert)
make certs

# Подготовка конфигурации Kibana: запуск Elasticsearch, создание сервиса-токена и генерация конфига
make prepare-kibana-config

# Полная сборка и запуск: certs + prepare-kibana-config + запуск сервисов
make all

# Запуск всех сервисов (сборка и оркестрация ELK-стека и приложений)
make up
# или эквивалент:
# docker-compose -f docker-compose.yml -f docker-compose.elk.yml up --build -d

# Остановка сервисов
make down
# или:
# docker-compose -f docker-compose.yml -f docker-compose.elk.yml down

# Остановка сервисов и удаление томов
make down-volumes
# или:
# docker-compose -f docker-compose.yml -f docker-compose.elk.yml down -v
```

## 🔧 Переменные окружения

### В корневом каталоге:

```bash
GRAFANA_USER=name
GRAFANA_PASSWORD=1234567
TELEGRAM_BOT_TOKEN= TOKEN
ELASTIC_USERNAME=elastic
ELASTIC_PASSWORD=1234567
KIBANA_SECURITY_KEY= 32 символа
KIBANA_SAVEDOBJECTS_KEY= 32 символа
KIBANA_REPORTING_KEY= 32 символа
```

### В папке `backend/`:

```bash
DATABASE_URL=file:./dev.db
```

### В папке `frontend/` (Admin Dashboard):

```bash
VITE_GOOGLE_CLIENT_ID= заполнить 
VITE_API_URL=https://<IP-адрес>:3000
VITE_BACK_URL=<IP-адрес>:3000
```

> Где `<IP-адрес>` — адрес вашей локальной машины в сети.

## 📁 Структура проекта

```
├── backend/                   # Node.js микросервисы
├── frontend/                  # React-приложения Admin Dashboard и Pong UI
├── devops/                    # Конфигурации и Docker Compose для ELK и Prometheus/Grafana
├── docker-compose.yml         # Оркестрация всех сервисов
├── docker-compose.elk.yml     # Отдельный Compose-файл для ELK
└── Makefile                   # Скрипты для развёртывания, проверки и удаления
```

