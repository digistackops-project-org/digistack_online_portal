'use strict';

/**
 * Integration Tests — Auth Service
 * Requires a running PostgreSQL instance with employeedb
 * Set TEST_DB_* env vars or use a test DB.
 *
 * Run: npm run test:integration
 */

const request  = require('supertest');
const bcrypt   = require('bcryptjs');
const app      = require('../../app');
const db       = require('../../config/database');

// Use test DB (same DB, test schema or test records)
const TEST_EMAIL    = `test_${Date.now()}@integration.com`;
const TEST_PASSWORD = 'TestPass@123';

afterAll(async () => {
  // Cleanup test records
  await db.query('DELETE FROM employee WHERE email LIKE $1', ['%@integration.com']);
  await db.pool.end();
});

// ══════════════════════════════════════════
// SIGNUP INTEGRATION
// ══════════════════════════════════════════
describe('Integration: POST /api/auth/signup', () => {
  test('should register a new employee successfully', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name:           'Integration Tester',
        email:          TEST_EMAIL,
        password:       TEST_PASSWORD,
        confirm_password: TEST_PASSWORD,
        mobile:         '9876543210',
        gender:         'male',
        marital_status: 'unmarried',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.email).toBe(TEST_EMAIL);
  });

  test('should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Dupe', email: TEST_EMAIL, password: TEST_PASSWORD,
        confirm_password: TEST_PASSWORD, mobile: '9876543210',
        gender: 'male', marital_status: 'unmarried',
      });
    expect(res.status).toBe(409);
  });

  test('should reject invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Bad', email: 'not-an-email', password: TEST_PASSWORD, confirm_password: TEST_PASSWORD });
    expect(res.status).toBe(422);
  });
});

// ══════════════════════════════════════════
// LOGIN INTEGRATION
// ══════════════════════════════════════════
describe('Integration: POST /api/auth/login', () => {
  test('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

  test('should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'WrongPass@999' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Wrong credentials');
  });

  test('should reject non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@test.com', password: TEST_PASSWORD });
    expect(res.status).toBe(401);
  });
});

// ══════════════════════════════════════════
// FORGOT PASSWORD INTEGRATION
// ══════════════════════════════════════════
describe('Integration: POST /api/auth/forgot-password', () => {
  const NEW_PASSWORD = 'NewPass@456';

  test('should update password for existing email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: TEST_EMAIL, new_password: NEW_PASSWORD, confirm_password: NEW_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('should login with new password after reset', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: NEW_PASSWORD });
    expect(res.status).toBe(200);
  });

  test('should return 404 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'unknown@test.com', new_password: NEW_PASSWORD, confirm_password: NEW_PASSWORD });
    expect(res.status).toBe(404);
  });
});

// ══════════════════════════════════════════
// HEALTH INTEGRATION
// ══════════════════════════════════════════
describe('Integration: Health Endpoints', () => {
  test('GET /health should return UP', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
  });

  test('GET /health/live should return ALIVE', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ALIVE');
  });

  test('GET /health/ready should check DB and return READY', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('READY');
    expect(res.body.checks.database).toBe('UP');
  });
});
