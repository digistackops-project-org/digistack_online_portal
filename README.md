# 🛡️ Admin Portal — Production-Grade Microservices Application

## Version History
| Version | Features |
|---------|----------|
| **V1**  | Login · Signup · Forgot Password · Employee Auth |
| **V2**  | Course Management · Trainer Management · Temp Passwords |

## Quick Start (Docker)
```bash
cp .env.example .env   # Edit with your values
docker compose up -d --build
# Frontend: http://localhost:3000
# Default login: admin@adminportal.com / Admin@123
```

## Quick Start (Local Dev)
```bash
# See docs/DEPLOYMENT.md Section 4 for full guide
cd backend/auth-service    && npm install && npm run dev
cd backend/course-service  && npm install && npm run dev
cd backend/trainer-service && npm install && npm run dev
cd frontend                && npm install && npm start
```

## Run Tests
```bash
cd backend/auth-service    && npm run test:unit && npm run test:api
cd backend/course-service  && npm run test:unit && npm run test:api
cd backend/trainer-service && npm run test:unit && npm run test:api
```

## Architecture
- **Auth Service**    → Port 4001 (V1)
- **Course Service**  → Port 4002 (V2)
- **Trainer Service** → Port 4003 (V2)
- **Frontend**        → Port 3000 (dev) / 80 (prod)
- **PostgreSQL**      → Port 5432 (internal only)

## Documentation
📖 **[Full Deployment Guide](docs/DEPLOYMENT.md)** — Step-by-step from Dev to AWS Production

## DB Migrations
Managed by **Liquibase**. Versioned XML changesets in `db/migrations/`.
- V1: `employee` table
- V2: `trainer` + `course` tables
- V3: Add your changesets in `db/migrations/v3/`
