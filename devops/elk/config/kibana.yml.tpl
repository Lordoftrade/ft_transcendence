server.host: "0.0.0.0"
server.port: 5601

server.ssl.enabled: true
server.ssl.certificate: /usr/share/kibana/config/certs/ELK.crt
server.ssl.key:         /usr/share/kibana/config/certs/ELK.key

xpack.security.encryptionKey: "${KIBANA_SECURITY_KEY}"
xpack.encryptedSavedObjects.encryptionKey: "${KIBANA_SAVEDOBJECTS_KEY}"
xpack.reporting.encryptionKey: "${KIBANA_REPORTING_KEY}"
xpack.reporting.kibanaServer.hostname: "localhost"

elasticsearch.hosts: ["https://elasticsearch:9200"]
elasticsearch.serviceAccountToken: "${KIBANA_SERVICE_TOKEN}"
elasticsearch.ssl.certificateAuthorities: [ "/usr/share/kibana/config/certs/rootCA.pem" ]