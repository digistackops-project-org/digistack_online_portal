You are a Principal Software Architect, DevOps Lead, QA Architect, and DBA working in an enterprise organization.

We are building Admin Portal Version-1 of a large microservices system.

IMPORTANT CONTEXT:
- Frontend team is separate
- Backend team is separate
- DB team is separate
- QA team is separate
- Deployment team is separate
- Currently deploying to Linux VM (Non-containerized)
- In future we will containerize (so design must be container-ready)
- Code must be production-grade and enterprise-ready
- Follow real enterprise Dev → QA → UAT → Prod deployment lifecycle

==================================================
SYSTEM REQUIREMENTS
==================================================

Frontend:
- React (Vite)
- Production-grade folder structure
- Clean architecture
- Reusable components
- API abstraction layer
- Environment-based config
- Attractive UI with smooth animations
- Login / Signup / Forget Password flows
- Proper validation
- Protected routes
- Error boundary
- Loading states
- Responsive UI

Backend:
- Node.js (Express with Clean Architecture OR NestJS)
- PostgreSQL
- Layered architecture (Controller → Service → Repository)
- DTO validation
- JWT Authentication
- bcrypt password hashing
- Role-based support (future ready)
- Centralized error handling
- Logging (winston)
- Security (helmet, cors, rate limit)
- Health endpoints:
    /health
    /health/live
    /health/ready
- Graceful shutdown
- Config-driven environment variables

Database:
- Database Name: employeedb
- Table: employee
- Flyway versioning enabled
- Future version-2 schema ready
- Indexing strategy
- Audit fields (created_at, updated_at)

Employee Table Fields:
- id (UUID PK)
- name
- mobile
- gender (male/female)
- marital_status (married/unmarried)
- email (unique)
- password_hash
- created_at
- updated_at

==================================================
FUNCTIONAL REQUIREMENTS
==================================================

1) Login
- User enters email & password
- Check employeedb.employee table
- If email not found → "User not found"
- If password mismatch → "Wrong credentials"
- If correct → issue JWT

2) Forgot Password
- Enter email
- Enter new password + confirm password
- Update password_hash in employee table

3) Signup
- Name
- Mobile
- Gender (dropdown)
- Marital status (dropdown)
- Email
- Password
- Confirm password
- Store in employee table

==================================================
TESTING REQUIREMENTS
==================================================

Backend:
- Unit tests (Service layer)
- Integration tests (Controller + DB)
- API tests (Supertest or Postman collection)
- Coverage strategy

Frontend:
- Unit tests (component tests)
- API mocking tests
- Basic integration test

==================================================
HEALTH CHECK REQUIREMENTS
==================================================

/health → overall app + DB status
/health/live → app alive check
/health/ready → DB connectivity check

==================================================
FLYWAY REQUIREMENTS
==================================================

Provide:
- V1__create_employee_table.sql
- V2__add_role_column.sql (future ready example)
- Folder structure for DB team
- Flyway configuration
- CI pipeline for DB migrations

==================================================
DEPLOYMENT REQUIREMENTS
==================================================

Provide documentation for:

Dev Environment:
- Local setup
- Environment variables
- DB migration run

QA Environment:
- Build pipeline
- Run tests
- Deploy to QA VM

UAT:
- Smoke test checklist
- Health check verification

Production:
- Build artifact
- SCP to VM
- PM2 setup
- Nginx reverse proxy
- SSL configuration
- Monitoring strategy

==================================================
CI/CD REQUIREMENTS
==================================================

Provide:
1) Backend pipeline (Build → Test → Package → Deploy)
2) Frontend pipeline
3) DB migration pipeline
4) Branch strategy (main / develop / release)
5) Artifact versioning strategy
6) Rollback strategy

==================================================
STRUCTURE REQUIRED IN RESPONSE
==================================================

1) High-level architecture
2) Folder structure (frontend + backend + db)
3) Database Flyway scripts
4) Backend production-ready structure
5) Frontend production-ready structure
6) Testing strategy + sample tests
7) Health check implementation
8) Dev → QA → UAT → Prod deployment document
9) CI/CD YAML example
10) Security checklist
11) Future containerization readiness strategy

IMPORTANT:
Do NOT give simplified demo code.
Everything must follow enterprise production standards.
Assume this is going to real production VM.
