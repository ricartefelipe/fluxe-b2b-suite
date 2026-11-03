FROM node:20-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate && pnpm install --frozen-lockfile
COPY . .
ARG NX_BASE_HREF=/
RUN npx nx build admin-console --configuration=production --baseHref=${NX_BASE_HREF}

FROM nginx:1.30-alpine@sha256:0e52bd054126cdc040b1276c0af347aeb02a41b9cfe305d6094767ac30e97949
RUN apk upgrade --no-cache
RUN mkdir -p /etc/nginx/snippets \
  && printf '# placeholder (gerado no entrypoint)\n' > /etc/nginx/snippets/api-proxy.conf
COPY apps/admin-console/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/apps/admin-console/browser /usr/share/nginx/html
COPY apps/admin-console/config.template.json /usr/share/nginx/html/assets/config.template.json
COPY apps/admin-console/entrypoint.sh /docker-entrypoint.d/40-config.sh
RUN chmod +x /docker-entrypoint.d/40-config.sh
EXPOSE 80
