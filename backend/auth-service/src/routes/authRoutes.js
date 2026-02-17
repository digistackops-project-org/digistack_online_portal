'use strict';

const router = require('express').Router();
const { signup, login, forgotPassword, getMe } = require('../controllers/authController');
const { signupValidators, loginValidators, forgotPasswordValidators } = require('../middleware/validators');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/signup',          signupValidators,          signup);
router.post('/login',           loginValidators,           login);
router.post('/forgot-password', forgotPasswordValidators,  forgotPassword);

// Protected routes
router.get('/me', authenticate, getMe);

module.exports = router;
