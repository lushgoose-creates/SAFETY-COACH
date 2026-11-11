# ---- Build stage: compile native modules (better-sqlite3) ----
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Native module build toolchain
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
# Use npm install (not ci) for resilience; force better-sqlite3 to compile from
# source instead of downloading prebuilds (which can fail on Railway's network).
ENV npm_config_build_from_source=true \
  npm_config_foreground_scripts=true
RUN npm install --omit=dev \
  && npm rebuild better-sqlite3

# ---- Runtime stage ----
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
  PORT=3000

COPY --from=builder /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY . .

# Persistence: add a Railway Volume in the dashboard mounted at /app/data.
# (Do not use the Docker VOLUME instruction — Railway manages storage itself.)

EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" || exit 1

CMD ["node", "server.js"]
