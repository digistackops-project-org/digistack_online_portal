'use strict';

jest.mock('../../config/database');
jest.mock('bcryptjs');

const db     = require('../../config/database');
const bcrypt = require('bcryptjs');
const { getAllTrainers, addTrainer, deleteTrainer, setPassword } = require('../../controllers/trainerController');

const mockReq = (body = {}, params = {}) => ({ body, params });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => jest.clearAllMocks());

describe('Unit: TrainerController.getAllTrainers', () => {
  test('should return 200 with list', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Alice', email: 'a@b.com', course_name: 'React' }] });
    const res = mockRes();
    await getAllTrainers(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, count: 1 }));
  });

  test('should return 500 on DB error', async () => {
    db.query.mockRejectedValueOnce(new Error('DB down'));
    const res = mockRes();
    await getAllTrainers(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('Unit: TrainerController.addTrainer', () => {
  test('should add trainer and return 201 with temp password', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })   // no duplicate
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })  // course exists
      .mockResolvedValueOnce({ rows: [{ id: 5, name: 'Alice', email: 'alice@t.com', temp_password: '123456', is_temp_password: true }] });
    bcrypt.hash.mockResolvedValue('hashed');

    const req = mockReq({ name: 'Alice', mobile: '9876543210', email: 'alice@t.com', course_id: 1 });
    const res = mockRes();
    await addTrainer(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    const callArg = res.json.mock.calls[0][0];
    expect(callArg.data).toHaveProperty('temp_password');
  });

  test('should return 409 on duplicate email', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // duplicate found
    const req = mockReq({ name: 'Bob', mobile: '9876543210', email: 'bob@t.com' });
    const res = mockRes();
    await addTrainer(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });
});

describe('Unit: TrainerController.setPassword', () => {
  test('should set permanent password and return 200', async () => {
    bcrypt.hash.mockResolvedValue('new_hash');
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'a@b.com', is_temp_password: false }] });
    const req = mockReq({ new_password: 'NewPass@123' }, { id: '1' });
    const res = mockRes();
    await setPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('should return 404 for unknown trainer', async () => {
    bcrypt.hash.mockResolvedValue('hash');
    db.query.mockResolvedValueOnce({ rows: [] });
    const req = mockReq({ new_password: 'NewPass@123' }, { id: '999' });
    const res = mockRes();
    await setPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('Unit: TrainerController.deleteTrainer', () => {
  test('should soft delete trainer', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const res = mockRes();
    await deleteTrainer(mockReq({}, { id: '1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
