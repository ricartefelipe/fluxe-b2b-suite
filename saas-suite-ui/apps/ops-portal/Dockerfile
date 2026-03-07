FROM node:20-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN npx nx build ops-portal --configuration=production

FROM nginx:1.27-alpine
COPY apps/ops-portal/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/apps/ops-portal/browser /usr/share/nginx/html
COPY apps/ops-portal/config.template.json /usr/share/nginx/html/assets/config.template.json
COPY apps/ops-portal/entrypoint.sh /docker-entrypoint.d/40-config.sh
RUN chmod +x /docker-entrypoint.d/40-config.sh
EXPOSE 80
