#!/bin/sh
CONFIG_FILE=/usr/share/nginx/html/assets/config.json
envsubst '${CORE_API_BASE_URL} ${ORDERS_API_BASE_URL} ${PAYMENTS_API_BASE_URL} ${AUTH_MODE} ${OIDC_ISSUER} ${OIDC_CLIENT_ID} ${OIDC_SCOPE} ${LOG_LEVEL} ${APP_VERSION}' \
  < /usr/share/nginx/html/assets/config.template.json > "$CONFIG_FILE"
