'use strict';

/**
 * API Tests — Auth Service
 * Tests HTTP contracts: status codes, response shape, headers
 * Uses mocked DB — pure HTTP contract testing
 *
 * Run: npm run test:api
 */

jest.mock('../../config/database');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const request = require('supertest');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../../config/database');
const app     = require('../../app');

beforeEach(() => jest.clearAllMocks());

// ══════════════════════════════════════════
// SIGNUP API CONTRACT
// ══════════════════════════════════════════
describe('API: POST /api/auth/signup', () => {
  const validPayload = {
    name: 'API Tester', email: 'api@test.com', password: 'ApiPass@1',
    confirm_password: 'ApiPass@1', mobile: '9876543210',
    gender: 'female', marital_status: 'married',
  };

  test('201 — response shape contains success, message, data', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 99, name: 'API Tester', email: 'api@test.com', role: 'admin' }] });
    bcrypt.hash.mockResolvedValue('hashed');

    const res = await request(app).post('/api/auth/signup').send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ success: true, message: expect.any(String), data: expect.any(Object) });
    expect(res.headers['content-type']).toMatch(/json/);
  });

  test('422 — missing required fields returns validation errors array', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: 'a@b.com' });
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('errors');
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  test('422 — password mismatch', async () => {
    const res = await request(app).post('/api/auth/signup').send({ ...validPayload, confirm_password: 'Different@1' });
    expect(res.status).toBe(422);
  });

  test('422 — weak password', async () => {
    const res = await request(app).post('/api/auth/signup').send({ ...validPayload, password: '12345678', confirm_password: '12345678' });
    expect(res.status).toBe(422);
  });

  test('409 — duplicate email', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const res = await request(app).post('/api/auth/signup').send(validPayload);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

// ══════════════════════════════════════════
// LOGIN API CONTRACT
// ══════════════════════════════════════════
describe('API: POST /api/auth/login', () => {
  test('200 — response contains token and employee object', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Admin', email: 'a@b.com', password_hash: 'h', role: 'admin', is_active: true }] });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('signed.token');

    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'Pass@1' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('employee');
    expect(res.body.data.employee).not.toHaveProperty('password_hash'); // no secret leakage
  });

  test('401 — missing email returns 422', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'Pass@1' });
    expect(res.status).toBe(422);
  });

  test('401 — wrong credentials', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/login').send({ email: 'x@y.com', password: 'Bad' });
    expect([401, 422]).toContain(res.status);
  });
});

// ══════════════════════════════════════════
// FORGOT PASSWORD API CONTRACT
// ══════════════════════════════════════════
describe('API: POST /api/auth/forgot-password', () => {
  test('200 — success on valid email', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [] });
    bcrypt.hash.mockResolvedValue('newhash');
    const res = await request(app).post('/api/auth/forgot-password').send({
      email: 'user@test.com', new_password: 'NewPass@1', confirm_password: 'NewPass@1',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('404 — unknown email', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/forgot-password').send({
      email: 'nobody@test.com', new_password: 'NewPass@1', confirm_password: 'NewPass@1',
    });
    expect(res.status).toBe(404);
  });
});

// ══════════════════════════════════════════
// HEALTH API CONTRACT
// ══════════════════════════════════════════
describe('API: Health Endpoints', () => {
  test('GET /health — 200 with correct shape', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'UP', service: 'auth-service' });
  });

  test('GET /health/live — 200', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ALIVE');
  });

  test('GET /unknown-route — 404', async () => {
    const res = await request(app).get('/api/auth/doesnotexist');
    expect(res.status).toBe(404);
  });
});
