'use strict';

const router = require('express').Router();
const { body, param } = require('express-validator');
const { getAllCourses, getCourseById, addCourse, updateCourse, deleteCourse } = require('../controllers/courseController');
const { authenticate } = require('../middleware/auth');

const handleValidation = require('../middleware/handleValidation');

const courseValidators = [
  body('course_name').trim().notEmpty().withMessage('Course name is required'),
  body('course_fees').isFloat({ min: 0 }).withMessage('Valid course fees required'),
  body('course_duration').trim().notEmpty().withMessage('Course duration is required'),
  body('trainer_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Valid trainer ID required'),
  handleValidation,
];

router.use(authenticate); // all course routes protected

router.get('/',    getAllCourses);
router.get('/:id', param('id').isInt(), handleValidation, getCourseById);
router.post('/',   courseValidators, addCourse);
router.put('/:id', param('id').isInt(), handleValidation, courseValidators, updateCourse);
router.delete('/:id', param('id').isInt(), handleValidation, deleteCourse);

module.exports = router;
