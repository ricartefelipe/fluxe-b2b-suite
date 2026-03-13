FROM node:20-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
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

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/ || exit 1

CMD ["./entrypoint.sh"]
