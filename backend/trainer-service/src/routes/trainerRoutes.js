'use strict';

const router = require('express').Router();
const { body, param } = require('express-validator');
const { getAllTrainers, getTrainerById, addTrainer, updateTrainer, setPassword, deleteTrainer } = require('../controllers/trainerController');
const { authenticate } = require('../middleware/auth');
const handleValidation = require('../middleware/handleValidation');

const trainerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('mobile').trim().matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit mobile required'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('course_id').optional({ nullable: true }).isInt({ min: 1 }),
  handleValidation,
];

router.use(authenticate);

router.get('/',    getAllTrainers);
router.get('/:id', param('id').isInt(), handleValidation, getTrainerById);
router.post('/',   trainerValidators, addTrainer);
router.put('/:id', param('id').isInt(), handleValidation, trainerValidators, updateTrainer);
router.patch('/:id/set-password',
  param('id').isInt(),
  body('new_password').isLength({ min: 8 }).withMessage('Min 8 chars'),
  handleValidation,
  setPassword
);
router.delete('/:id', param('id').isInt(), handleValidation, deleteTrainer);

module.exports = router;
