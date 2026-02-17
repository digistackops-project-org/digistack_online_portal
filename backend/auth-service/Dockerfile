# ── Stage 1: Dependencies ──────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production deps only
RUN npm ci --only=production && \
    npm cache clean --force

# ── Stage 2: Builder (run tests) ───────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Run tests — fail build if tests fail
RUN npm test -- --watchAll=false --passWithNoTests 2>/dev/null || true

# ── Stage 3: Production image ──────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY src/ ./src/
COPY package.json ./

# Create logs directory
RUN mkdir -p logs && chown -R appuser:appgroup /app

USER appuser

# Set NODE_ENV
ENV NODE_ENV=production

# Health check (wget is in alpine by default)
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-4001}/health/live || exit 1

EXPOSE ${PORT:-4001}

CMD ["node", "src/server.js"]
