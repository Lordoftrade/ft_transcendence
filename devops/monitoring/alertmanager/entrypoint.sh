#!/bin/sh
envsubst < /etc/alertmanager/config.tpl.yml > /etc/alertmanager/alertmanager.yml
exec /bin/alertmanager --config.file=/etc/alertmanager/alertmanager.yml