'use strict';

jest.mock('../../config/database');
const db = require('../../config/database');
const { getAllCourses, getCourseById, addCourse, deleteCourse } = require('../../controllers/courseController');

const mockReq = (body = {}, params = {}) => ({ body, params });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => jest.clearAllMocks());

describe('Unit: CourseController.getAllCourses', () => {
  test('should return 200 with courses list', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, course_name: 'Node.js', course_fees: 5000, trainer_name: 'John' }] });
    const res = mockRes();
    await getAllCourses(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, count: 1 }));
  });

  test('should return empty list when no courses', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = mockRes();
    await getAllCourses(mockReq(), res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ count: 0 }));
  });

  test('should return 500 on DB error', async () => {
    db.query.mockRejectedValueOnce(new Error('DB error'));
    const res = mockRes();
    await getAllCourses(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('Unit: CourseController.getCourseById', () => {
  test('should return 200 when course found', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, course_name: 'React' }] });
    const res = mockRes();
    await getCourseById(mockReq({}, { id: 1 }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('should return 404 when course not found', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = mockRes();
    await getCourseById(mockReq({}, { id: 999 }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('Unit: CourseController.addCourse', () => {
  test('should create course and return 201', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // trainer check
      .mockResolvedValueOnce({ rows: [{ id: 5, course_name: 'Vue.js' }] }); // insert
    const req = mockReq({ course_name: 'Vue.js', course_fees: 3000, course_duration: '3 months', trainer_id: 1 });
    const res = mockRes();
    await addCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('should return 404 when trainer not found', async () => {
    db.query.mockResolvedValueOnce({ rows: [] }); // trainer not found
    const req = mockReq({ course_name: 'Vue.js', course_fees: 3000, course_duration: '3 months', trainer_id: 99 });
    const res = mockRes();
    await addCourse(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('Unit: CourseController.deleteCourse', () => {
  test('should soft delete and return 200', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const res = mockRes();
    await deleteCourse(mockReq({}, { id: 1 }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('should return 404 for non-existent course', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = mockRes();
    await deleteCourse(mockReq({}, { id: 999 }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
