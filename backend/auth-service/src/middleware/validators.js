'use strict';

const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const signupValidators = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 150 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('mobile').trim().matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit mobile required'),
  body('gender').isIn(['male', 'female']).withMessage('Gender must be male or female'),
  body('marital_status').isIn(['married', 'unmarried']).withMessage('Marital status must be married or unmarried'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/).withMessage('Password must contain uppercase, number, special char'),
  body('confirm_password').custom((val, { req }) => {
    if (val !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
  handleValidation,
];

const loginValidators = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

const forgotPasswordValidators = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('new_password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/).withMessage('Password must contain uppercase, number, special char'),
  body('confirm_password').custom((val, { req }) => {
    if (val !== req.body.new_password) throw new Error('Passwords do not match');
    return true;
  }),
  handleValidation,
];

module.exports = { signupValidators, loginValidators, forgotPasswordValidators };
