# Admin Portal — Complete Deployment Guide
## Dev → Staging → Production | Version 1 & 2

---

## 📋 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Project Structure](#3-project-structure)
4. [Local Development Setup](#4-local-development-setup)
5. [Running Tests (All Stages)](#5-running-tests-all-stages)
6. [Database Setup & Migrations](#6-database-setup--migrations)
7. [Deploying to Physical Server (No Docker)](#7-deploying-to-physical-server-no-docker)
8. [Deploying with Docker](#8-deploying-with-docker)
9. [AWS EC2 — 3-Instance Production Setup](#9-aws-ec2--3-instance-production-setup)
10. [CI/CD Pipeline (Jenkins)](#10-cicd-pipeline-jenkins)
11. [V1 → V2 Upgrade Guide](#11-v1--v2-upgrade-guide)
12. [Health Endpoints Reference](#12-health-endpoints-reference)
13. [Rollback Procedures](#13-rollback-procedures)
14. [Security Checklist](#14-security-checklist)

---

## 1. Architecture Overview

```
┌─────────────────────────── AWS VPC ───────────────────────────────┐
│                                                                     │
│  EC2-1 (Frontend)         EC2-2 (Backend)        EC2-3 (Database)  │
│  ┌──────────────┐         ┌──────────────┐        ┌─────────────┐  │
│  │ Nginx        │ ──────► │ Auth :4001   │ ──────►│ PostgreSQL  │  │
│  │ React SPA    │         │ Course :4002 │        │ employeedb  │  │
│  │ :80 / :443   │         │ Trainer:4003 │        │ :5432       │  │
│  └──────────────┘         └──────────────┘        └─────────────┘  │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘

Ports:
  Frontend    → Port 80 (HTTP) / 443 (HTTPS via SSL cert)
  Auth Svc    → Port 4001
  Course Svc  → Port 4002
  Trainer Svc → Port 4003
  PostgreSQL  → Port 5432 (internal only, NOT exposed to internet)
```

---

## 2. Prerequisites

### All Servers
```bash
# Ubuntu 22.04 LTS (recommended AMI)
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git unzip htop ufw fail2ban
```

### EC2-1 (Frontend Server)
```bash
# Nginx
sudo apt install -y nginx

# OR Node.js (if serving with node serve)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### EC2-2 (Backend Server)
```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 process manager
sudo npm install -g pm2

# Java (for Liquibase)
sudo apt install -y default-jdk

# Download Liquibase
wget https://github.com/liquibase/liquibase/releases/download/v4.27.0/liquibase-4.27.0.tar.gz
sudo tar xzf liquibase-4.27.0.tar.gz -C /opt/liquibase
sudo ln -s /opt/liquibase/liquibase /usr/local/bin/liquibase

# Download PostgreSQL JDBC driver for Liquibase
wget https://jdbc.postgresql.org/download/postgresql-42.7.3.jar -O /opt/liquibase/lib/postgresql.jar
```

### EC2-3 (Database Server)
```bash
# PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-client-16

# Configure PostgreSQL to accept remote connections (from EC2-2 IP only)
sudo nano /etc/postgresql/16/main/postgresql.conf
  # Change: listen_addresses = 'localhost'
  # To:     listen_addresses = 'EC2-3-PRIVATE-IP'

sudo nano /etc/postgresql/16/main/pg_hba.conf
  # Add at bottom:
  # host  employeedb  postgres  EC2-2-PRIVATE-IP/32  md5

sudo systemctl restart postgresql
```

---

## 3. Project Structure

```
admin-portal/
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── pages/               # LoginPage, SignupPage, ForgotPasswordPage, DashboardPage, CoursesPage, TrainersPage
│   │   ├── services/api.js      # Axios API clients
│   │   ├── hooks/useAuthContext.js
│   │   └── App.js
│   ├── nginx.conf               # Nginx config for production
│   ├── Dockerfile
│   └── package.json
│
├── backend/
│   ├── auth-service/            # V1 — Login, Signup, Forgot Password
│   │   ├── src/
│   │   │   ├── controllers/authController.js
│   │   │   ├── routes/authRoutes.js
│   │   │   ├── routes/healthRoutes.js
│   │   │   ├── middleware/auth.js
│   │   │   ├── middleware/validators.js
│   │   │   ├── config/database.js
│   │   │   ├── utils/logger.js
│   │   │   ├── app.js
│   │   │   ├── server.js
│   │   │   └── tests/
│   │   │       ├── unit/authController.unit.test.js
│   │   │       ├── integration/auth.integration.test.js
│   │   │       └── api/auth.api.test.js
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── course-service/          # V2 — Course CRUD
│   │   └── ... (same structure)
│   │
│   └── trainer-service/         # V2 — Trainer CRUD + Temp Password
│       └── ... (same structure)
│
├── db/
│   ├── migrations/
│   │   ├── db.changelog-master.xml  # Master Liquibase changelog
│   │   ├── v1/001_create_employee_table.xml
│   │   └── v2/002_create_trainer_table.xml
│   │       003_create_course_table.xml
│   │       004_add_fk_course_trainer.xml
│   ├── seeds/00_create_database.sql
│   └── liquibase.properties
│
├── docker-compose.yml           # Full stack Docker compose
├── .env.example                 # Environment variable template
└── docs/DEPLOYMENT.md           # This file
```

---

## 4. Local Development Setup

### Step 1: Clone & Configure
```bash
git clone <repo-url> admin-portal
cd admin-portal

# Copy env template
cp .env.example .env

# Edit .env with your local values
nano .env
```

### Step 2: Install Dependencies
```bash
# Backend
cd backend/auth-service   && npm install && cd ../..
cd backend/course-service && npm install && cd ../..
cd backend/trainer-service && npm install && cd ../..

# Frontend
cd frontend && npm install && cd ..
```

### Step 3: Start PostgreSQL locally
```bash
# Using Docker for local DB:
docker run -d \
  --name local_postgres \
  -e POSTGRES_DB=employeedb \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine

# OR use your local PostgreSQL installation
psql -U postgres -f db/seeds/00_create_database.sql
```

### Step 4: Run Liquibase Migrations
```bash
cd db
liquibase \
  --url="jdbc:postgresql://localhost:5432/employeedb" \
  --username=postgres \
  --password=postgres \
  --changeLogFile=migrations/db.changelog-master.xml \
  update
```

### Step 5: Start Backend Services
```bash
# Terminal 1
cd backend/auth-service
cp .env.example .env  # edit as needed
npm run dev

# Terminal 2
cd backend/course-service
npm run dev

# Terminal 3
cd backend/trainer-service
npm run dev
```

### Step 6: Start Frontend
```bash
cd frontend
npm start
# Opens at http://localhost:3000
```

### Default Admin Login (from seed data):
```
Email:    admin@adminportal.com
Password: Admin@123
```

---

## 5. Running Tests (All Stages)

### Unit Tests (No DB needed — fast, isolated)
```bash
# Auth Service
cd backend/auth-service
npm run test:unit

# Course Service
cd backend/course-service
npm run test:unit

# Trainer Service
cd backend/trainer-service
npm run test:unit
```

### API Tests (No DB needed — mocked)
```bash
cd backend/auth-service && npm run test:api
cd backend/course-service && npm run test:api
cd backend/trainer-service && npm run test:api
```

### Integration Tests (Requires live DB — run in staging)
```bash
# Set environment vars first
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=employeedb
export DB_USER=postgres
export DB_PASSWORD=postgres
export JWT_SECRET=test_secret_min_32_chars_here_ok

cd backend/auth-service && npm run test:integration
```

### Run All Tests with Coverage
```bash
cd backend/auth-service && npm test
# Coverage report: backend/auth-service/coverage/index.html
```

### Frontend Tests
```bash
cd frontend
npm test
# Coverage: frontend/coverage/lcov-report/index.html
```

### Test Pipeline Order (CI/CD)
```
Stage 1: UNIT TESTS        → Fast, no external deps, run on every commit
Stage 2: API CONTRACT TESTS → Fast, mocked, run on every commit
Stage 3: INTEGRATION TESTS  → Needs DB, run on pull request / merge
Stage 4: BUILD              → npm run build / docker build
Stage 5: DEPLOY TO STAGING  → Deploy + smoke test
Stage 6: DEPLOY TO PROD     → After manual approval
```

---

## 6. Database Setup & Migrations

### Initial Bootstrap (one-time)
```bash
# On EC2-3 as postgres user
sudo -u postgres psql -f /path/to/db/seeds/00_create_database.sql
```

### Run Liquibase (V1 only)
```bash
liquibase \
  --url="jdbc:postgresql://<EC2-3-IP>:5432/employeedb" \
  --username=postgres \
  --password=$DB_PASSWORD \
  --changeLogFile=/opt/admin-portal/db/migrations/db.changelog-master.xml \
  --contexts=prod \
  --labels=v1 \
  update
```

### Run Liquibase (V1 + V2)
```bash
liquibase \
  --url="jdbc:postgresql://<EC2-3-IP>:5432/employeedb" \
  --username=postgres \
  --password=$DB_PASSWORD \
  --changeLogFile=/opt/admin-portal/db/migrations/db.changelog-master.xml \
  --contexts=prod \
  update
# (runs all changesets not yet applied)
```

### Tag a Release (for rollback)
```bash
liquibase tag v1.0.0   # before V1 deploy
liquibase tag v2.0.0   # before V2 deploy
```

### Rollback Example
```bash
# Roll back to V1
liquibase rollback v1.0.0 \
  --url="jdbc:postgresql://<EC2-3-IP>:5432/employeedb" \
  --username=postgres \
  --password=$DB_PASSWORD \
  --changeLogFile=/opt/admin-portal/db/migrations/db.changelog-master.xml
```

### Verify Migration Status
```bash
liquibase status \
  --url="jdbc:postgresql://<EC2-3-IP>:5432/employeedb" \
  --username=postgres \
  --password=$DB_PASSWORD \
  --changeLogFile=/opt/admin-portal/db/migrations/db.changelog-master.xml
```

---

## 7. Deploying to Physical Server (No Docker)

### On EC2-2 (Backend Server)

#### Step 1: Upload code
```bash
# From your local machine
scp -r admin-portal/backend ubuntu@EC2-2-IP:/opt/admin-portal/
scp -r admin-portal/db ubuntu@EC2-2-IP:/opt/admin-portal/

# OR use git
ssh ubuntu@EC2-2-IP
git clone <repo-url> /opt/admin-portal
```

#### Step 2: Install dependencies
```bash
cd /opt/admin-portal/backend/auth-service   && npm ci --only=production
cd /opt/admin-portal/backend/course-service && npm ci --only=production
cd /opt/admin-portal/backend/trainer-service && npm ci --only=production
```

#### Step 3: Create .env files
```bash
# Auth service
cat > /opt/admin-portal/backend/auth-service/.env << EOF
NODE_ENV=production
PORT=4001
DB_HOST=<EC2-3-PRIVATE-IP>
DB_PORT=5432
DB_NAME=employeedb
DB_USER=postgres
DB_PASSWORD=<your-secure-password>
JWT_SECRET=<64-char-random-string>
JWT_EXPIRES_IN=8h
ALLOWED_ORIGINS=https://<your-frontend-domain>
EOF

# Repeat for course-service (PORT=4002) and trainer-service (PORT=4003)
```

#### Step 4: Create logs directory
```bash
mkdir -p /opt/admin-portal/backend/auth-service/logs
mkdir -p /opt/admin-portal/backend/course-service/logs
mkdir -p /opt/admin-portal/backend/trainer-service/logs
```

#### Step 5: Start with PM2
```bash
# Start all services
pm2 start /opt/admin-portal/backend/auth-service/src/server.js    --name auth-service
pm2 start /opt/admin-portal/backend/course-service/src/server.js  --name course-service
pm2 start /opt/admin-portal/backend/trainer-service/src/server.js --name trainer-service

# Save PM2 config (auto-restart on reboot)
pm2 save
pm2 startup systemd  # Follow instructions shown
```

#### Step 6: Verify services
```bash
pm2 status
pm2 logs auth-service
curl http://localhost:4001/health/ready
curl http://localhost:4002/health/ready
curl http://localhost:4003/health/ready
```

### On EC2-1 (Frontend Server)

#### Step 1: Build React app
```bash
# Build on your local machine or CI
cd admin-portal/frontend

REACT_APP_AUTH_URL=https://<EC2-2-IP-or-domain>:4001 \
REACT_APP_COURSE_URL=https://<EC2-2-IP-or-domain>:4002 \
REACT_APP_TRAINER_URL=https://<EC2-2-IP-or-domain>:4003 \
npm run build

# Upload build folder to EC2-1
scp -r build ubuntu@EC2-1-IP:/var/www/admin-portal/
```

#### Step 2: Configure Nginx
```bash
sudo cp admin-portal/frontend/nginx.conf /etc/nginx/sites-available/admin-portal
sudo ln -s /etc/nginx/sites-available/admin-portal /etc/nginx/sites-enabled/
sudo nginx -t   # test config
sudo systemctl reload nginx
```

#### Step 3: Verify
```bash
curl http://EC2-1-IP/nginx-health
# Should return: OK
```

---

## 8. Deploying with Docker

### Single Server Docker (Dev / Staging)
```bash
# Copy env
cp .env.example .env
nano .env  # fill real values

# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f auth-service

# Run migrations (if not using the liquibase container)
docker compose run --rm liquibase

# Scale a service
docker compose up -d --scale course-service=2
```

### 3-Server Docker Setup (Production)

#### EC2-3 — Start only DB
```bash
docker compose up -d postgres
```

#### EC2-2 — Run migrations then start backends
```bash
docker compose up -d liquibase
docker compose up -d auth-service course-service trainer-service
```

#### EC2-1 — Start frontend
```bash
docker compose up -d frontend
```

### Useful Docker Commands
```bash
# Check health
docker inspect --format='{{json .State.Health}}' ap_auth | python3 -m json.tool

# Enter container
docker exec -it ap_auth sh

# Tail logs
docker compose logs -f --tail=100 auth-service

# Stop all
docker compose down

# Stop and remove volumes (WARNING: destroys DB data)
docker compose down -v

# Update a service without downtime
docker compose up -d --no-deps --build auth-service
```

---

## 9. AWS EC2 — 3-Instance Production Setup

### Instance Recommendations

| Instance    | Role            | Type         | Storage |
|-------------|-----------------|--------------|---------|
| EC2-1       | Frontend/Nginx  | t3.small     | 20 GB   |
| EC2-2       | Backend APIs    | t3.medium    | 30 GB   |
| EC2-3       | PostgreSQL      | t3.medium    | 100 GB  |

### Security Groups

**EC2-1 (Frontend)**
```
Inbound:
  Port 80  (HTTP)  — 0.0.0.0/0
  Port 443 (HTTPS) — 0.0.0.0/0
  Port 22  (SSH)   — Your IP only

Outbound:
  Port 4001-4003 → EC2-2 Security Group
```

**EC2-2 (Backend)**
```
Inbound:
  Port 4001 — EC2-1 Security Group
  Port 4002 — EC2-1 Security Group
  Port 4003 — EC2-1 Security Group
  Port 22   — Your IP only

Outbound:
  Port 5432 → EC2-3 Security Group
```

**EC2-3 (Database)**
```
Inbound:
  Port 5432 — EC2-2 Security Group ONLY
  Port 22   — Your IP only

Outbound:
  None required
```

### Step-by-Step AWS Setup

#### 1. Launch EC2 Instances
```bash
# Use Ubuntu 22.04 LTS AMI for all 3 instances
# Enable auto-assign public IP for EC2-1 only
# EC2-2 and EC2-3 use private IPs for internal communication
```

#### 2. Set up EC2-3 (Database) first
```bash
ssh ubuntu@EC2-3-PUBLIC-IP

sudo apt update && sudo apt install -y postgresql-16

# Create database
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'YourSecureDBPass!';"
sudo -u postgres psql -f /tmp/00_create_database.sql

# Allow connections from EC2-2 private IP
echo "host employeedb postgres EC2-2-PRIVATE-IP/32 md5" | sudo tee -a /etc/postgresql/16/main/pg_hba.conf
echo "listen_addresses = '*'" | sudo tee -a /etc/postgresql/16/main/postgresql.conf
sudo systemctl restart postgresql
```

#### 3. Set up EC2-2 (Backend)
```bash
ssh ubuntu@EC2-2-PUBLIC-IP

# Install Node, PM2, Liquibase (see Prerequisites section)

# Clone repo
git clone <repo-url> /opt/admin-portal

# Run Liquibase migrations
cd /opt/admin-portal
liquibase \
  --url="jdbc:postgresql://EC2-3-PRIVATE-IP:5432/employeedb" \
  --username=postgres \
  --password=YourSecureDBPass! \
  --changeLogFile=db/migrations/db.changelog-master.xml \
  --contexts=prod \
  update

# Create .env files and start with PM2 (see Physical Server section)
pm2 start ecosystem.config.js
pm2 save && pm2 startup
```

#### 4. Set up EC2-1 (Frontend)
```bash
ssh ubuntu@EC2-1-PUBLIC-IP

sudo apt install -y nginx

# Build React on EC2-2 or CI, then copy build to EC2-1
# OR use rsync:
rsync -avz ubuntu@EC2-2-IP:/opt/admin-portal/frontend/build/ /var/www/admin-portal/

sudo cp /tmp/nginx.conf /etc/nginx/sites-available/admin-portal
sudo ln -s /etc/nginx/sites-available/admin-portal /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### PM2 Ecosystem File
```js
// /opt/admin-portal/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'auth-service',
      script: '/opt/admin-portal/backend/auth-service/src/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4001,
        DB_HOST: 'EC2-3-PRIVATE-IP',
        // ... other env vars
      }
    },
    {
      name: 'course-service',
      script: '/opt/admin-portal/backend/course-service/src/server.js',
      instances: 1,
      exec_mode: 'cluster',
      env_production: { NODE_ENV: 'production', PORT: 4002 }
    },
    {
      name: 'trainer-service',
      script: '/opt/admin-portal/backend/trainer-service/src/server.js',
      instances: 1,
      exec_mode: 'cluster',
      env_production: { NODE_ENV: 'production', PORT: 4003 }
    },
  ]
};
```

---

## 10. CI/CD Pipeline (Jenkins)

### Jenkinsfile (Declarative Pipeline)
```groovy
pipeline {
  agent any

  environment {
    DB_HOST     = credentials('prod-db-host')
    DB_PASSWORD = credentials('prod-db-password')
    JWT_SECRET  = credentials('prod-jwt-secret')
    EC2_1_IP    = credentials('ec2-frontend-ip')
    EC2_2_IP    = credentials('ec2-backend-ip')
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Install Dependencies') {
      parallel {
        stage('Auth')    { steps { dir('backend/auth-service')    { sh 'npm ci' } } }
        stage('Course')  { steps { dir('backend/course-service')  { sh 'npm ci' } } }
        stage('Trainer') { steps { dir('backend/trainer-service') { sh 'npm ci' } } }
        stage('Frontend') { steps { dir('frontend')              { sh 'npm ci' } } }
      }
    }

    stage('Unit Tests') {
      parallel {
        stage('Auth Unit')    { steps { dir('backend/auth-service')    { sh 'npm run test:unit' } } }
        stage('Course Unit')  { steps { dir('backend/course-service')  { sh 'npm run test:unit' } } }
        stage('Trainer Unit') { steps { dir('backend/trainer-service') { sh 'npm run test:unit' } } }
      }
    }

    stage('API Tests') {
      parallel {
        stage('Auth API')    { steps { dir('backend/auth-service')    { sh 'npm run test:api' } } }
        stage('Course API')  { steps { dir('backend/course-service')  { sh 'npm run test:api' } } }
        stage('Trainer API') { steps { dir('backend/trainer-service') { sh 'npm run test:api' } } }
      }
    }

    stage('DB Migration (Staging)') {
      when { branch 'develop' }
      steps {
        sh '''
          liquibase \
            --url="jdbc:postgresql://${DB_HOST}:5432/employeedb" \
            --username=postgres \
            --password=${DB_PASSWORD} \
            --changeLogFile=db/migrations/db.changelog-master.xml \
            --contexts=staging \
            update
        '''
      }
    }

    stage('Integration Tests') {
      when { branch 'develop' }
      environment {
        DB_HOST=credentials('staging-db-host')
      }
      steps {
        parallel {
          stage('Auth Integration')    { steps { dir('backend/auth-service')    { sh 'npm run test:integration' } } }
        }
      }
    }

    stage('Build Docker Images') {
      when { branch 'main' }
      steps {
        sh 'docker compose build'
      }
    }

    stage('DB Migration (Production)') {
      when { branch 'main' }
      steps {
        input message: 'Approve DB migration to production?'
        sh '''
          liquibase tag v_${BUILD_NUMBER}_pre \
            --url="jdbc:postgresql://${DB_HOST}:5432/employeedb" \
            --username=postgres \
            --password=${DB_PASSWORD} \
            --changeLogFile=db/migrations/db.changelog-master.xml

          liquibase update \
            --url="jdbc:postgresql://${DB_HOST}:5432/employeedb" \
            --username=postgres \
            --password=${DB_PASSWORD} \
            --changeLogFile=db/migrations/db.changelog-master.xml \
            --contexts=prod
        '''
      }
    }

    stage('Deploy to Production') {
      when { branch 'main' }
      steps {
        input message: 'Deploy to Production?'
        sh '''
          # Deploy backends to EC2-2
          ssh ubuntu@${EC2_2_IP} "cd /opt/admin-portal && git pull && pm2 reload all"

          # Build and deploy frontend to EC2-1
          REACT_APP_AUTH_URL=https://${EC2_2_IP}:4001 npm run build --prefix frontend
          rsync -avz frontend/build/ ubuntu@${EC2_1_IP}:/var/www/admin-portal/
          ssh ubuntu@${EC2_1_IP} "sudo systemctl reload nginx"
        '''
      }
    }

    stage('Smoke Tests') {
      steps {
        sh '''
          curl -f http://${EC2_2_IP}:4001/health/ready || exit 1
          curl -f http://${EC2_2_IP}:4002/health/ready || exit 1
          curl -f http://${EC2_2_IP}:4003/health/ready || exit 1
          curl -f http://${EC2_1_IP}/nginx-health       || exit 1
          echo "All health checks passed!"
        '''
      }
    }
  }

  post {
    failure {
      echo 'Pipeline failed! Check logs above.'
      // slackSend channel: '#alerts', message: "FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
    }
    success {
      echo 'Pipeline succeeded!'
    }
  }
}
```

---

## 11. V1 → V2 Upgrade Guide

When upgrading from Version 1 to Version 2 in production:

### Step 1: Merge V2 code to main
```bash
git checkout main
git merge feature/v2-course-trainer
git push origin main
```

### Step 2: Run DB migrations
```bash
# DB already has V1 tables. Liquibase will only run V2 changesets (002, 003, 004, 005)
liquibase tag v2.0.0_pre \
  --url="jdbc:postgresql://<DB_HOST>:5432/employeedb" \
  --changeLogFile=db/migrations/db.changelog-master.xml

liquibase update \
  --url="jdbc:postgresql://<DB_HOST>:5432/employeedb" \
  --changeLogFile=db/migrations/db.changelog-master.xml \
  --contexts=prod
```

### Step 3: Deploy new services
```bash
# Install dependencies for new services
cd /opt/admin-portal/backend/course-service  && npm ci --only=production
cd /opt/admin-portal/backend/trainer-service && npm ci --only=production

# Create .env for new services
cp backend/course-service/.env.example  backend/course-service/.env
cp backend/trainer-service/.env.example backend/trainer-service/.env
# Edit .env files with real values

# Start new services
pm2 start src/server.js --name course-service  --cwd /opt/admin-portal/backend/course-service
pm2 start src/server.js --name trainer-service --cwd /opt/admin-portal/backend/trainer-service
pm2 save
```

### Step 4: Rebuild & deploy frontend
```bash
cd /opt/admin-portal/frontend
REACT_APP_AUTH_URL=... REACT_APP_COURSE_URL=... REACT_APP_TRAINER_URL=... npm run build
rsync -avz build/ ubuntu@EC2-1-IP:/var/www/admin-portal/
ssh ubuntu@EC2-1-IP "sudo systemctl reload nginx"
```

### Step 5: Verify
```bash
curl http://EC2-2-IP:4002/health/ready   # Course service
curl http://EC2-2-IP:4003/health/ready   # Trainer service
```

---

## 12. Health Endpoints Reference

| Service       | Endpoint            | Method | Description                    |
|---------------|---------------------|--------|--------------------------------|
| Auth          | /health             | GET    | Service info + uptime          |
| Auth          | /health/live        | GET    | Process alive check (k8s liveness) |
| Auth          | /health/ready       | GET    | DB connectivity check (k8s readiness) |
| Course        | /health             | GET    | Same as above                  |
| Course        | /health/live        | GET    | Same as above                  |
| Course        | /health/ready       | GET    | Same as above                  |
| Trainer       | /health             | GET    | Same as above                  |
| Trainer       | /health/live        | GET    | Same as above                  |
| Trainer       | /health/ready       | GET    | Same as above                  |
| Frontend      | /nginx-health       | GET    | Nginx serving check            |

### Expected Response Shapes
```json
GET /health
{ "status": "UP", "service": "auth-service", "version": "1.0.0", "uptime": "3600s", "timestamp": "..." }

GET /health/live
{ "status": "ALIVE", "service": "auth-service", "timestamp": "..." }

GET /health/ready — when DB is up
{ "status": "READY", "checks": { "database": "UP" }, "timestamp": "..." }

GET /health/ready — when DB is down
HTTP 503
{ "status": "NOT_READY", "checks": { "database": "DOWN" }, "timestamp": "..." }
```

---

## 13. Rollback Procedures

### Application Rollback (PM2)
```bash
# Rollback with git
cd /opt/admin-portal
git log --oneline -5           # find previous commit
git checkout <previous-commit>
pm2 reload all
```

### Database Rollback (Liquibase)
```bash
# Roll back to tag (created before V2 deploy)
liquibase rollback v2.0.0_pre \
  --url="jdbc:postgresql://<DB_HOST>:5432/employeedb" \
  --username=postgres \
  --password=$DB_PASSWORD \
  --changeLogFile=db/migrations/db.changelog-master.xml

# Or roll back N changesets
liquibase rollbackCount 3 \
  --url="jdbc:postgresql://<DB_HOST>:5432/employeedb" \
  ...
```

### Docker Rollback
```bash
# Use previous image tag
docker compose down
docker compose up -d --no-deps auth-service  # uses last build
# OR
docker pull <registry>/<image>:previous-tag
docker compose up -d
```

---

## 14. Security Checklist

### Before Production Go-Live

- [ ] **JWT_SECRET** is a random 64+ character string (not default)
- [ ] **DB_PASSWORD** is strong and unique (not default)
- [ ] PostgreSQL port 5432 is **NOT** exposed to internet (Security Group)
- [ ] **SSL/TLS** is configured on EC2-1 (Nginx) — use Let's Encrypt (Certbot)
- [ ] `fail2ban` is installed and configured on all EC2 instances
- [ ] SSH key-based auth only (disable password auth in `/etc/ssh/sshd_config`)
- [ ] UFW firewall rules applied on all instances
- [ ] `.env` files are **NOT** committed to git (check `.gitignore`)
- [ ] Database backups scheduled (AWS RDS snapshots or pg_dump cron)
- [ ] CloudWatch / monitoring alerts set up for CPU, memory, disk
- [ ] `NODE_ENV=production` on all backend services
- [ ] Rate limiting enabled on auth endpoints
- [ ] CORS `ALLOWED_ORIGINS` set to your actual domain only

### SSL Setup (EC2-1 with Certbot)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot renew --dry-run  # test auto-renewal
```

---

## API Reference Summary

### Auth Service (:4001)
| Method | Endpoint                      | Auth | Description         |
|--------|-------------------------------|------|---------------------|
| POST   | /api/auth/signup              | No   | Create admin account |
| POST   | /api/auth/login               | No   | Login + get JWT      |
| POST   | /api/auth/forgot-password     | No   | Reset password       |
| GET    | /api/auth/me                  | Yes  | Get current user     |

### Course Service (:4002)
| Method | Endpoint                      | Auth | Description         |
|--------|-------------------------------|------|---------------------|
| GET    | /api/courses                  | Yes  | List all courses    |
| GET    | /api/courses/:id              | Yes  | Get single course   |
| POST   | /api/courses                  | Yes  | Add course          |
| PUT    | /api/courses/:id              | Yes  | Update course       |
| DELETE | /api/courses/:id              | Yes  | Soft delete course  |

### Trainer Service (:4003)
| Method | Endpoint                           | Auth | Description              |
|--------|------------------------------------|------|--------------------------|
| GET    | /api/trainers                      | Yes  | List all trainers        |
| GET    | /api/trainers/:id                  | Yes  | Get single trainer       |
| POST   | /api/trainers                      | Yes  | Add trainer (gen temp pw)|
| PUT    | /api/trainers/:id                  | Yes  | Update trainer           |
| PATCH  | /api/trainers/:id/set-password     | Yes  | Set permanent password   |
| DELETE | /api/trainers/:id                  | Yes  | Soft delete trainer      |

---

*Last updated: 2026 | Admin Portal v2.0.0*
