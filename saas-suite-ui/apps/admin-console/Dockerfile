FROM node:20-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN npx nx build admin-console --configuration=production

FROM nginx:1.27-alpine
RUN mkdir -p /etc/nginx/snippets \
  && printf '# placeholder (gerado no entrypoint)\n' > /etc/nginx/snippets/api-proxy.conf
COPY apps/admin-console/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/apps/admin-console/browser /usr/share/nginx/html
COPY apps/admin-console/config.template.json /usr/share/nginx/html/assets/config.template.json
COPY apps/admin-console/entrypoint.sh /docker-entrypoint.d/40-config.sh
RUN chmod +x /docker-entrypoint.d/40-config.sh
EXPOSE 80
