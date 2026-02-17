# Trainer Portal — Version 3 Deployment Guide
## Merging V3 into Main Branch | Python FastAPI + React + PostgreSQL

---

## 📋 What's New in Version 3

| Component | Stack | Port | Description |
|-----------|-------|------|-------------|
| **Trainer Portal Backend** | Python 3.12 + FastAPI | 4004 | Trainer self-service auth |
| **Trainer Portal Frontend** | React 18 + Nginx | 3001 (dev) / 80 (prod EC2) | Trainer-facing UI |
| **DB Migrations** | Liquibase V3 | — | Extends trainer table, adds trainer_session |

### V3 DB Changes (additive — no breaking changes to V1/V2)
- `trainer` table: +`last_login_at`, +`reset_token`, +`reset_token_expiry`, +`bio`, +`profile_image_url`, +`portal_access`
- New `trainer_session` table for JWT audit trail
- V4 placeholder comments included in changelogs

---

## 1. Project Structure (V3 additions)

```
admin-portal/                        ← existing monorepo
├── backend/
│   ├── auth-service/               ← V1 Node.js  (unchanged)
│   ├── course-service/             ← V2 Node.js  (unchanged)
│   ├── trainer-service/            ← V2 Node.js  (unchanged)
│   └── trainer-portal-service/     ← V3 NEW — Python FastAPI
│       ├── src/
│       │   ├── config/
│       │   │   ├── database.py     asyncpg pool (shared employeedb)
│       │   │   └── settings.py     pydantic-settings config
│       │   ├── controllers/
│       │   │   └── auth_controller.py  login / set-password / forgot-pw
│       │   ├── middleware/
│       │   │   └── jwt_handler.py  JWT creation & verification
│       │   ├── models/
│       │   │   └── schemas.py      Pydantic v2 request/response schemas
│       │   ├── routes/
│       │   │   ├── auth.py         POST /api/trainer-auth/*
│       │   │   └── health.py       GET /health, /live, /ready
│       │   ├── utils/logger.py     loguru structured logging
│       │   ├── app.py              FastAPI factory
│       │   └── tests/
│       │       ├── unit/           test_auth_controller.py  (no DB)
│       │       ├── api/            test_auth_api.py         (mocked DB)
│       │       └── integration/    test_auth_integration.py (real DB)
│       ├── main.py                 uvicorn entry point
│       ├── requirements.txt
│       ├── Dockerfile
│       └── pytest.ini
│
├── trainer-portal/                  ← V3 NEW — React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── TrainerLoginPage.jsx      (login + wrong-creds popup)
│   │   │   ├── TrainerForgotPasswordPage.jsx
│   │   │   └── TrainerDashboardPage.jsx
│   │   ├── components/
│   │   │   └── SetNewPasswordModal.jsx   (temp-pw → permanent-pw popup)
│   │   ├── services/api.js
│   │   ├── hooks/useAuthContext.js
│   │   └── App.js
│   ├── nginx.conf
│   └── Dockerfile
│
└── db/
    └── migrations/
        └── v3/
            └── 006_trainer_portal_enhancements.xml  ← V3 migration
```

---

## 2. Merging V3 into Main Branch

### Step 1: Create feature branch
```bash
git checkout main
git pull origin main
git checkout -b feature/v3-trainer-portal
```

### Step 2: Add V3 files (already done in this zip)
```bash
# The following directories are new in V3:
# - backend/trainer-portal-service/
# - trainer-portal/
# - db/migrations/v3/

git add backend/trainer-portal-service/
git add trainer-portal/
git add db/migrations/v3/
git add db/migrations/db.changelog-master.xml  # Updated with V3 include
git add docker-compose.yml                     # Updated with 2 new services
```

### Step 3: Verify no breaking changes to V1/V2
```bash
# V1/V2 tests should still pass
cd backend/auth-service    && npm run test:unit && npm run test:api
cd backend/course-service  && npm run test:unit && npm run test:api
cd backend/trainer-service && npm run test:unit && npm run test:api
```

### Step 4: Run V3 tests
```bash
cd backend/trainer-portal-service
pip install -r requirements.txt
pytest src/tests/unit/ src/tests/api/ -v
```

### Step 5: Merge to main
```bash
git add -A
git commit -m "feat(v3): Add Trainer Portal — Python FastAPI + React

- trainer-portal-service (Python/FastAPI/asyncpg) port 4004
- trainer-portal (React/Nginx) port 3001
- Liquibase V3 migrations (006_trainer_portal_enhancements)
- Login with temp password → set-password popup
- Forgot password flow
- /health, /health/live, /health/ready endpoints
- Unit + API + Integration tests"

git push origin feature/v3-trainer-portal
# Create PR → code review → merge to main
```

---

## 3. Local Development Setup (V3)

### Prerequisites (additional for V3)
```bash
# Python 3.12
sudo apt install -y python3.12 python3.12-venv python3-pip

# OR using pyenv (recommended)
pyenv install 3.12.0
pyenv local 3.12.0
```

### Setup Trainer Portal Backend
```bash
cd admin-portal/backend/trainer-portal-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate    # Linux/Mac
# OR: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
nano .env   # Set DB connection + JWT_SECRET

# Run DB migrations (V3 changesets)
# (From the db/ directory)
liquibase \
  --url="jdbc:postgresql://localhost:5432/employeedb" \
  --username=postgres \
  --password=postgres \
  --changeLogFile=migrations/db.changelog-master.xml \
  update

# Start development server (auto-reload)
uvicorn main:app --host 0.0.0.0 --port 4004 --reload
# API docs: http://localhost:4004/docs
```

### Setup Trainer Portal Frontend
```bash
cd admin-portal/trainer-portal
npm install

# Configure backend URL
echo "REACT_APP_TRAINER_PORTAL_URL=http://localhost:4004" > .env.local

npm start
# Trainer portal: http://localhost:3001
```

---

## 4. Running V3 Tests

### Unit Tests (no DB needed)
```bash
cd backend/trainer-portal-service
source venv/bin/activate
pytest src/tests/unit/ -v
```

### API Contract Tests (mocked DB)
```bash
pytest src/tests/api/ -v
```

### All tests with coverage
```bash
pytest -v --cov=src --cov-report=html:htmlcov
# View: open htmlcov/index.html
```

### Integration Tests (real DB required)
```bash
# Set these env vars first:
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=employeedb
export DB_USER=postgres
export DB_PASSWORD=yourpassword
export JWT_SECRET=test_secret_32chars_min_ok_here
export RUN_INTEGRATION_TESTS=1

pytest src/tests/integration/ -v
```

### V3 CI/CD Test Pipeline Stages
```
Stage 1: Unit Tests       → pytest src/tests/unit/          (always runs)
Stage 2: API Tests        → pytest src/tests/api/           (always runs)
Stage 3: DB Migration     → liquibase update --contexts=staging
Stage 4: Integration      → RUN_INTEGRATION_TESTS=1 pytest  (staging DB)
Stage 5: Build Docker     → docker build .
Stage 6: Deploy staging   → restart services
Stage 7: Smoke test       → curl /health/ready
Stage 8: Deploy prod      → (after approval)
```

---

## 5. DB Migration (V3)

### Liquibase applies incrementally — only runs new changesets
```bash
# Check current status (shows which changesets are applied)
liquibase status \
  --url="jdbc:postgresql://<DB_HOST>:5432/employeedb" \
  --username=postgres \
  --password=$DB_PASSWORD \
  --changeLogFile=db/migrations/db.changelog-master.xml

# Apply V3 migrations (changesets 006, 007)
liquibase tag v3.0.0_pre \
  --url="jdbc:postgresql://<DB_HOST>:5432/employeedb" \
  --changeLogFile=db/migrations/db.changelog-master.xml

liquibase update \
  --url="jdbc:postgresql://<DB_HOST>:5432/employeedb" \
  --username=postgres \
  --password=$DB_PASSWORD \
  --changeLogFile=db/migrations/db.changelog-master.xml \
  --contexts=prod
```

### DB Rollback (if V3 deployment fails)
```bash
liquibase rollback v3.0.0_pre \
  --url="jdbc:postgresql://<DB_HOST>:5432/employeedb" \
  --username=postgres \
  --password=$DB_PASSWORD \
  --changeLogFile=db/migrations/db.changelog-master.xml
```

### Adding V4 migrations (future)
1. Create `db/migrations/v4/007_your_feature.xml`
2. Add `<include file="v4/007_your_feature.xml" .../>` to `db.changelog-master.xml`
3. Liquibase will auto-apply only the new changesets

---

## 6. AWS EC2 — 3-Server Production Deployment (V3)

### Architecture (same 3 EC2 instances, 2 new services added)

```
EC2-1 (Frontend)                   EC2-2 (Backend)         EC2-3 (DB)
┌────────────────────┐             ┌──────────────────┐    ┌──────────────┐
│ Nginx :80          │             │ auth-svc  :4001  │    │ PostgreSQL   │
│  ├ /admin → :3000  │ ──────────► │ course-svc:4002  │───►│ employeedb   │
│  └ /trainer→:3001  │             │ trainer-svc:4003 │    │ (V1+V2+V3    │
│ Admin Portal :3000 │             │ tp-svc    :4004  │    │  tables)     │
│ Trainer Portal:3001│             └──────────────────┘    └──────────────┘
└────────────────────┘
```

### EC2-2: Deploy trainer-portal-service (Python)

```bash
ssh ubuntu@EC2-2-IP

# Install Python 3.12
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt install -y python3.12 python3.12-venv

# Clone (or pull) new V3 code
cd /opt/admin-portal
git pull origin main

# Setup trainer-portal-service
cd backend/trainer-portal-service
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env
cat > .env << EOF
APP_ENV=production
APP_PORT=4004
DB_HOST=<EC2-3-PRIVATE-IP>
DB_PORT=5432
DB_NAME=employeedb
DB_USER=postgres
DB_PASSWORD=<your-db-password>
JWT_SECRET=<64-char-random-string>
JWT_EXPIRE_HOURS=8
ALLOWED_ORIGINS=https://trainer.yourdomain.com
EOF

# Create logs dir
mkdir -p logs

# Start with PM2 (install pm2 if needed: npm install -g pm2)
pm2 start venv/bin/uvicorn \
  --name trainer-portal-service \
  --interpreter none \
  -- main:app --host 0.0.0.0 --port 4004 --workers 4

# OR use systemd (recommended for production)
sudo tee /etc/systemd/system/trainer-portal.service << 'SYSTEMD'
[Unit]
Description=Trainer Portal FastAPI Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/opt/admin-portal/backend/trainer-portal-service
Environment="PATH=/opt/admin-portal/backend/trainer-portal-service/venv/bin"
EnvironmentFile=/opt/admin-portal/backend/trainer-portal-service/.env
ExecStart=/opt/admin-portal/backend/trainer-portal-service/venv/bin/uvicorn main:app --host 0.0.0.0 --port 4004 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SYSTEMD

sudo systemctl daemon-reload
sudo systemctl enable trainer-portal
sudo systemctl start trainer-portal

# Verify
curl http://localhost:4004/health/ready
```

### EC2-1: Deploy Trainer Portal Frontend

```bash
# Build on CI or EC2-2, then rsync to EC2-1
cd /opt/admin-portal/trainer-portal

REACT_APP_TRAINER_PORTAL_URL=https://api.yourdomain.com:4004 \
npm run build

# Upload to EC2-1
rsync -avz build/ ubuntu@EC2-1-IP:/var/www/trainer-portal/

# On EC2-1 — update nginx config to serve both portals
sudo tee /etc/nginx/sites-available/admin-portal << 'NGINX'
# Admin Portal (Port 80 - domain: admin.yourdomain.com)
server {
    listen 80;
    server_name admin.yourdomain.com;
    root /var/www/admin-portal;
    index index.html;
    gzip on;
    location ~* \.(js|css|png)$ { expires 1y; }
    location / { try_files $uri $uri/ /index.html; }
}

# Trainer Portal (Port 80 - domain: trainer.yourdomain.com)
server {
    listen 80;
    server_name trainer.yourdomain.com;
    root /var/www/trainer-portal;
    index index.html;
    gzip on;
    location ~* \.(js|css|png)$ { expires 1y; }
    location / { try_files $uri $uri/ /index.html; }
}
NGINX

sudo nginx -t && sudo systemctl reload nginx
```

### V3 Security Group Updates (EC2-2)
```
Add Inbound Rule:
  Port 4004 — from EC2-1 Security Group
```

---

## 7. Docker Deployment (V3)

### Start all services including V3
```bash
# .env — add V3 vars
echo "TRAINER_PORTAL_ORIGINS=http://localhost:3001" >> .env
echo "REACT_APP_TRAINER_PORTAL_URL=http://localhost:4004" >> .env

# Run migrations + start everything
docker compose up -d --build

# Trainer portal frontend: http://localhost:3001
# Trainer portal API:      http://localhost:4004
# API docs (dev only):     http://localhost:4004/docs
```

### V3 smoke tests
```bash
# Health checks
curl http://localhost:4004/health          # {"status":"UP"...}
curl http://localhost:4004/health/live     # {"status":"ALIVE"...}
curl http://localhost:4004/health/ready    # {"status":"READY", "checks":{"database":"UP"}}

# Login test (with credentials from trainer table)
curl -X POST http://localhost:4004/api/trainer-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"trainer@example.com","password":"123456"}'
```

---

## 8. API Reference (V3 — Trainer Portal Service :4004)

| Method | Endpoint                              | Auth | Description |
|--------|---------------------------------------|------|-------------|
| POST   | /api/trainer-auth/login               | No   | Login — returns token + is_temp_password flag |
| POST   | /api/trainer-auth/set-password        | Yes (temp token) | Set permanent password after temp-pw login |
| POST   | /api/trainer-auth/forgot-password     | No   | Reset password (email + new_password) |
| GET    | /api/trainer-auth/me                  | Yes  | Get trainer profile |
| GET    | /health                               | No   | Service info |
| GET    | /health/live                          | No   | Liveness probe |
| GET    | /health/ready                         | No   | Readiness probe (checks DB) |

### Login Flow Detail
```
1. POST /login { email, password }
   ├── if is_temp_password=true
   │   └── Returns: { token (set-password scope), is_temp_password: true }
   │       → Frontend shows SetNewPasswordModal popup
   │       → POST /set-password with token → permanent password set
   │       → Redirect to dashboard
   └── if is_temp_password=false
       └── Returns: { token (full access), is_temp_password: false }
           → Redirect to dashboard

2. Wrong password → HTTP 401 { detail: "Wrong credentials" }
   → Frontend shows animated red popup toast

3. POST /forgot-password { email, new_password, confirm_password }
   → Checks email in trainer table
   → 404 if not found
   → Updates password_hash, clears is_temp_password
```

---

## 9. Jenkins Pipeline (V3 addition)

```groovy
// Add this to your existing Jenkinsfile pipeline stages:

stage('V3 Unit Tests') {
  steps {
    dir('backend/trainer-portal-service') {
      sh '''
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
        pytest src/tests/unit/ src/tests/api/ -v --tb=short
      '''
    }
  }
}

stage('V3 DB Migration') {
  when { branch 'main' }
  steps {
    input message: 'Apply V3 DB migrations?'
    sh '''
      liquibase tag v3.0.0_pre \
        --url="jdbc:postgresql://${DB_HOST}:5432/employeedb" \
        --username=postgres --password=${DB_PASSWORD} \
        --changeLogFile=db/migrations/db.changelog-master.xml

      liquibase update \
        --url="jdbc:postgresql://${DB_HOST}:5432/employeedb" \
        --username=postgres --password=${DB_PASSWORD} \
        --changeLogFile=db/migrations/db.changelog-master.xml \
        --contexts=prod
    '''
  }
}

stage('Deploy V3 to Production') {
  when { branch 'main' }
  steps {
    input message: 'Deploy V3 Trainer Portal to Production?'
    sh '''
      # Deploy Python backend
      ssh ubuntu@${EC2_2_IP} "cd /opt/admin-portal && git pull && sudo systemctl restart trainer-portal"

      # Build and deploy trainer frontend
      cd trainer-portal
      REACT_APP_TRAINER_PORTAL_URL=https://${EC2_2_IP}:4004 npm run build
      rsync -avz build/ ubuntu@${EC2_1_IP}:/var/www/trainer-portal/
      ssh ubuntu@${EC2_1_IP} "sudo systemctl reload nginx"
    '''
  }
}

stage('V3 Smoke Tests') {
  steps {
    sh '''
      curl -f http://${EC2_2_IP}:4004/health/ready || exit 1
      curl -f http://${EC2_1_IP}/nginx-health       || exit 1
      echo "V3 health checks passed!"
    '''
  }
}
```

---

## 10. V3 Rollback

```bash
# Application rollback
ssh ubuntu@EC2-2-IP
cd /opt/admin-portal
git log --oneline -5
git checkout <previous-commit>
sudo systemctl restart trainer-portal

# DB rollback
liquibase rollback v3.0.0_pre \
  --url="jdbc:postgresql://<DB_HOST>:5432/employeedb" \
  --username=postgres --password=$DB_PASSWORD \
  --changeLogFile=db/migrations/db.changelog-master.xml
# This drops trainer_session table and added columns
```

---

## 11. Security Checklist (V3 additions)

- [ ] `JWT_SECRET` for trainer portal is the SAME as admin portal (shared `employeedb`)
- [ ] Port 4004 exposed ONLY to EC2-1 Security Group (not public internet)
- [ ] `ALLOWED_ORIGINS` set to `https://trainer.yourdomain.com` only
- [ ] `APP_ENV=production` disables `/docs` and `/redoc` Swagger UI
- [ ] `portal_access` flag in trainer table allows per-trainer access control
- [ ] `trainer_session` table allows JWT audit and future revocation
- [ ] SSL/TLS applied via Certbot on EC2-1 for trainer subdomain
- [ ] Temp passwords are plain-text in DB — ensure DB access is restricted

---

*Trainer Portal v3.0.0 | Admin Portal Suite | Last updated: 2026*
