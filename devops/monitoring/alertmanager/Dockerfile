FROM alpine:3.18

RUN apk add --no-cache curl ca-certificates gettext

# download Alertmanager
ENV ALERTMANAGER_VERSION=0.26.0
RUN curl -L https://github.com/prometheus/alertmanager/releases/download/v${ALERTMANAGER_VERSION}/alertmanager-${ALERTMANAGER_VERSION}.linux-amd64.tar.gz | \
    tar xz && \
    mv alertmanager-${ALERTMANAGER_VERSION}.linux-amd64/alertmanager /bin/alertmanager && \
    mv alertmanager-${ALERTMANAGER_VERSION}.linux-amd64/amtool /bin/amtool && \
    rm -rf alertmanager-${ALERTMANAGER_VERSION}.linux-amd64

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY config.tpl.yml /etc/alertmanager/config.tpl.yml

ENTRYPOINT ["/entrypoint.sh"]