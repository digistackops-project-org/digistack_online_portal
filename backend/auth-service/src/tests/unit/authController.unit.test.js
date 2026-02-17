'use strict';

// Unit tests: mock DB, test controller logic in isolation
jest.mock('../../config/database');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../../config/database');
const { signup, login, forgotPassword } = require('../../controllers/authController');

const mockReq  = (body = {}) => ({ body });
const mockRes  = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

// ══════════════════════════════════════════
// SIGNUP TESTS
// ══════════════════════════════════════════
describe('Unit: AuthController.signup', () => {
  beforeEach(() => jest.clearAllMocks());

  test('should return 409 when email already exists', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // existing user found
    const req = mockReq({ name: 'John', email: 'john@test.com', password: 'Pass@123', mobile: '9876543210', gender: 'male', marital_status: 'married' });
    const res = mockRes();
    await signup(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Email already registered' }));
  });

  test('should create user and return 201', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })          // no duplicate
      .mockResolvedValueOnce({ rows: [{ id: 1, name: 'John', email: 'john@test.com', role: 'admin' }] }); // insert
    bcrypt.hash.mockResolvedValue('hashed_pw');
    const req = mockReq({ name: 'John', email: 'john@test.com', password: 'Pass@123', mobile: '9876543210', gender: 'male', marital_status: 'married' });
    const res = mockRes();
    await signup(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('should return 500 on DB error', async () => {
    db.query.mockRejectedValueOnce(new Error('DB down'));
    const req = mockReq({ name: 'John', email: 'john@test.com' });
    const res = mockRes();
    await signup(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ══════════════════════════════════════════
// LOGIN TESTS
// ══════════════════════════════════════════
describe('Unit: AuthController.login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('should return 401 when user not found', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const req = mockReq({ email: 'nobody@test.com', password: 'Pass@123' });
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid credentials' }));
  });

  test('should return 401 on password mismatch', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'john@test.com', password_hash: 'hash', role: 'admin', is_active: true }] });
    bcrypt.compare.mockResolvedValue(false); // wrong password
    const req = mockReq({ email: 'john@test.com', password: 'WrongPass' });
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Wrong credentials' }));
  });

  test('should return 200 with token on success', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'John', email: 'john@test.com', password_hash: 'hash', role: 'admin', is_active: true }] });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mock.jwt.token');
    const req = mockReq({ email: 'john@test.com', password: 'Pass@123' });
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('should return 403 when account is deactivated', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, is_active: false, password_hash: 'hash' }] });
    const req = mockReq({ email: 'john@test.com', password: 'Pass@123' });
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ══════════════════════════════════════════
// FORGOT PASSWORD TESTS
// ══════════════════════════════════════════
describe('Unit: AuthController.forgotPassword', () => {
  beforeEach(() => jest.clearAllMocks());

  test('should return 404 when email not found', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const req = mockReq({ email: 'nobody@test.com', new_password: 'NewPass@123' });
    const res = mockRes();
    await forgotPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('should update password and return 200', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })  // email found
      .mockResolvedValueOnce({ rows: [] });            // update success
    bcrypt.hash.mockResolvedValue('new_hash');
    const req = mockReq({ email: 'john@test.com', new_password: 'NewPass@123' });
    const res = mockRes();
    await forgotPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
