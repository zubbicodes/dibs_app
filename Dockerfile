# Multi-stage build for Expo Router web server output.
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json yarn.lock* pnpm-lock.yaml* ./
COPY scripts ./scripts

RUN if [ -f yarn.lock ]; then \
      yarn install --frozen-lockfile; \
    elif [ -f pnpm-lock.yaml ]; then \
      npm install -g pnpm && pnpm install --frozen-lockfile; \
    else \
      npm install --frozen-lockfile --legacy-peer-deps; \
    fi

COPY . .

RUN npm run web:build

RUN if [ ! -d "dist/client" ] || [ ! -d "dist/server" ]; then \
      echo "ERROR: Expo server export must contain dist/client and dist/server"; \
      ls -la dist || true; \
      exit 1; \
    fi

FROM node:20-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY server.js ./server.js

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:${PORT:-80}/health || exit 1

CMD ["node", "server.js"]
