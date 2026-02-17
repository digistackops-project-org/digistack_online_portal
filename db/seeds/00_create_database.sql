-- =============================================================
-- admin-portal/db/seeds/00_create_database.sql
-- Run ONCE as postgres superuser to bootstrap the database
-- Used in CI/CD before Liquibase migrations
-- =============================================================

-- Create database (run as superuser)
SELECT 'CREATE DATABASE employeedb'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'employeedb')\gexec

-- Connect to employeedb and set up schema
\c employeedb

-- Ensure UUID extension (handy for future use)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure pg_trgm for search (used in v3 future)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

COMMENT ON DATABASE employeedb IS 'Admin Portal Main Database - Version 1+';
