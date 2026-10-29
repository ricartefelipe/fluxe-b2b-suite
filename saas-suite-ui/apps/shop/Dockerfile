FROM node:20-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate && pnpm install --frozen-lockfile
COPY . .
RUN npx nx build shop --configuration=production

FROM node:20-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app

COPY --from=build /app/dist/apps/shop ./dist/apps/shop
COPY apps/shop/config.template.json ./config.template.json
COPY apps/shop/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 4000
ENV PORT=4000 NODE_ENV=production

# A porta vem de PORT (as plataformas a injetam) e o servidor escuta nela; o healthcheck fixo em
# 4000 ficava unhealthy sempre que PORT era outra, mesmo com a aplicacao atendendo.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD sh -c 'wget -qO- "http://127.0.0.1:${PORT:-4000}/" >/dev/null || exit 1'

CMD ["./entrypoint.sh"]
