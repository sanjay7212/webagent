# ─── Build stage ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# better-sqlite3 requires native compilation
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install dependencies first (layer-cached unless lock file changes)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build (standalone output bundles server.js + required node_modules)
COPY . .
RUN npm run build

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

ENV NODE_ENV=production
ENV PORT=3000

# Copy Next.js standalone bundle into /app
RUN mkdir -p /app
COPY --from=builder /app/.next/standalone /app/
COPY --from=builder /app/.next/static /app/.next/static
COPY --from=builder /app/public /app/public

# Copy better-sqlite3 native bindings (not included in standalone bundle)
COPY --from=builder /app/node_modules/better-sqlite3 /app/node_modules/better-sqlite3
COPY --from=builder /app/node_modules/bindings /app/node_modules/bindings
COPY --from=builder /app/node_modules/file-uri-to-path /app/node_modules/file-uri-to-path

# /voc/work is the Vocareum persistent home directory.
# The app writes webagent.db to process.cwd(), so we run from /voc/work
# so the database lands on the persistent volume automatically.
RUN mkdir -p /voc/work
WORKDIR /voc/work

EXPOSE 3000

# Required environment variables at runtime:
#   VOCAREUM_API_KEY      — Vocareum AI gateway key
#   ANTHROPIC_BASE_URL    — https://claude.vocareum.com/v1
#   OPENAI_BASE_URL       — https://openai.vocareum.com/v1
#   GOOGLE_BASE_URL       — https://gemini.vocareum.com/v1beta
CMD ["node", "/app/server.js"]
