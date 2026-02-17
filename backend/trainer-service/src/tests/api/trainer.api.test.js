'use strict';

jest.mock('../../config/database');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

const request = require('supertest');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const db      = require('../../config/database');
const app     = require('../../app');

beforeEach(() => {
  jest.clearAllMocks();
  jwt.verify.mockReturnValue({ id: 1, email: 'admin@test.com', role: 'admin' });
});

const AUTH = { Authorization: 'Bearer mock.token' };

describe('API: GET /api/trainers', () => {
  test('200 — returns trainer list', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Alice', email: 'alice@t.com', course_name: 'Node.js' }] });
    const res = await request(app).get('/api/trainers').set(AUTH);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('401 — no token', async () => {
    const res = await request(app).get('/api/trainers');
    expect(res.status).toBe(401);
  });
});

describe('API: POST /api/trainers', () => {
  const validTrainer = { name: 'Bob', mobile: '9876543210', email: 'bob@trainer.com', course_id: 1 };

  test('201 — creates trainer with temp password', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })           // no duplicate
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // course exists
      .mockResolvedValueOnce({ rows: [{ id: 3, name: 'Bob', email: 'bob@trainer.com', temp_password: '654321', is_temp_password: true }] });
    bcrypt.hash.mockResolvedValue('hashed');
    const res = await request(app).post('/api/trainers').set(AUTH).send(validTrainer);
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('temp_password');
  });

  test('422 — missing mobile', async () => {
    const res = await request(app).post('/api/trainers').set(AUTH).send({ name: 'Bob', email: 'bob@t.com' });
    expect(res.status).toBe(422);
  });

  test('422 — invalid email', async () => {
    const res = await request(app).post('/api/trainers').set(AUTH).send({ ...validTrainer, email: 'not-email' });
    expect(res.status).toBe(422);
  });
});

describe('API: PATCH /api/trainers/:id/set-password', () => {
  test('200 — sets permanent password', async () => {
    bcrypt.hash.mockResolvedValue('hash');
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 't@t.com', is_temp_password: false }] });
    const res = await request(app).patch('/api/trainers/1/set-password').set(AUTH).send({ new_password: 'Secure@123' });
    expect(res.status).toBe(200);
  });
});

describe('API: GET /health (trainer-service)', () => {
  test('200 — service UP', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('trainer-service');
  });
});
