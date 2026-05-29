# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev && npm install prisma@7.7.0 --no-save

FROM node:22-alpine AS runner
RUN apk add --no-cache dumb-init wget \
  && addgroup -g 1001 -S app \
  && adduser -S app -u 1001 -G app

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/package.json ./package.json
COPY --from=build --chown=app:app /app/prisma.config.ts ./prisma.config.ts
COPY --from=build --chown=app:app /app/src/prisma ./src/prisma
COPY --chown=app:app scripts/docker-prod-entrypoint.sh /app/docker-prod-entrypoint.sh
RUN chmod +x /app/docker-prod-entrypoint.sh

USER app
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" || exit 1

ENTRYPOINT ["dumb-init", "--", "/app/docker-prod-entrypoint.sh"]
