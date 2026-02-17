'use strict';

jest.mock('../../config/database');
jest.mock('jsonwebtoken');

const request = require('supertest');
const jwt     = require('jsonwebtoken');
const db      = require('../../config/database');
const app     = require('../../app');

// Mock valid token
beforeEach(() => {
  jest.clearAllMocks();
  jwt.verify.mockReturnValue({ id: 1, email: 'admin@test.com', role: 'admin' });
});

const AUTH_HEADER = { Authorization: 'Bearer valid.mock.token' };

describe('API: GET /api/courses', () => {
  test('200 — returns course list', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, course_name: 'Node.js', course_fees: 5000, trainer_name: 'Alice' }] });
    const res = await request(app).get('/api/courses').set(AUTH_HEADER);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('401 — no token', async () => {
    const res = await request(app).get('/api/courses');
    expect(res.status).toBe(401);
  });
});

describe('API: POST /api/courses', () => {
  const validCourse = { course_name: 'React', course_fees: 4000, course_duration: '2 months', trainer_id: 1 };

  test('201 — creates course', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // trainer exists
      .mockResolvedValueOnce({ rows: [{ id: 5, course_name: 'React' }] }); // insert
    const res = await request(app).post('/api/courses').set(AUTH_HEADER).send(validCourse);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('422 — missing course_name', async () => {
    const res = await request(app).post('/api/courses').set(AUTH_HEADER).send({ course_fees: 4000 });
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('errors');
  });

  test('422 — invalid course_fees (negative)', async () => {
    const res = await request(app).post('/api/courses').set(AUTH_HEADER).send({ ...validCourse, course_fees: -100 });
    expect(res.status).toBe(422);
  });
});

describe('API: GET /health (course-service)', () => {
  test('200 — service UP', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('course-service');
  });
});
