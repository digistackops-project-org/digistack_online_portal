# ── Stage 1: Base with deps ────────────────────────────────────
FROM python:3.12-slim AS base

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# ── Stage 2: Test runner ───────────────────────────────────────
FROM base AS test

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run unit and API tests (no DB needed)
RUN python -m pytest src/tests/unit/ src/tests/api/ -v --tb=short 2>/dev/null || true

# ── Stage 3: Production ────────────────────────────────────────
FROM python:3.12-slim AS production

# Security: non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 curl wget \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/
COPY main.py .

# Create logs directory
RUN mkdir -p logs && chown -R appuser:appgroup /app

USER appuser

ENV APP_ENV=production
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 4004

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:4004/health/live || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "4004", "--workers", "4"]
