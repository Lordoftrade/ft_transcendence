FROM prom/prometheus:v2.53.0

WORKDIR /etc/prometheus

#COPY configs/ /etc/prometheus/
COPY configs/prometheus.yml .
COPY configs/prometheus_rules.yml .
COPY configs/web.yml . 
COPY certs/ /etc/prometheus/certs/

EXPOSE 9090

RUN /bin/promtool check rules /etc/prometheus/prometheus_rules.yml

#CMD ["--config.file=/etc/prometheus/prometheus.yml", "--web.listen-address=:9090"]
CMD ["--config.file=/etc/prometheus/prometheus.yml", "--web.listen-address=:9090", "--web.config.file=/etc/prometheus/web.yml"]

# "--storage.tsdb.path=/prometheus"
# если потребуется кастовать путь вместо prometheus-data:/var/lib/prometheus
