FROM grafana/grafana:10.2.3

COPY provisioning/ /etc/grafana/provisioning/

COPY grafana.ini /etc/grafana/grafana.ini
COPY certs/ /etc/grafana/certs/

# COPY grafana.db /var/lib/grafana/grafana.db

EXPOSE 3000