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

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy Next.js standalone bundle
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy better-sqlite3 native bindings (not included in standalone bundle)
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder /app/node_modules/bindings ./node_modules/bindings
COPY --from=builder /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path

# SQLite database is written to /app/webagent.db (matches process.cwd() in the app).
# Mount a volume here for persistence across container restarts:
#   docker run -v ./data:/app/data -e VOCAREUM_API_KEY=... ...
# (or keep it ephemeral for stateless deployments)

EXPOSE 3000

# Required environment variables at runtime:
#   VOCAREUM_API_KEY      — Vocareum AI gateway key
#   ANTHROPIC_BASE_URL    — https://claude.vocareum.com/v1
#   OPENAI_BASE_URL       — https://openai.vocareum.com/v1
#   GOOGLE_BASE_URL       — https://gemini.vocareum.com/v1beta
CMD ["node", "server.js"]
