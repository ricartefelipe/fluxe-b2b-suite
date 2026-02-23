#!/bin/sh
CONFIG_FILE=/usr/share/nginx/html/assets/config.json
envsubst < /usr/share/nginx/html/assets/config.template.json > "$CONFIG_FILE"
