'use strict';

const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { query } = require('../config/database');
const logger  = require('../utils/logger');

const SALT_ROUNDS = 12;

/* ─────────────── SIGNUP ─────────────── */
const signup = async (req, res) => {
  const { name, email, password, mobile, gender, marital_status } = req.body;
  try {
    // Check duplicate
    const existing = await query(
      'SELECT id FROM employee WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await query(
      `INSERT INTO employee (name, email, password_hash, mobile, gender, marital_status, role)
       VALUES ($1, $2, $3, $4, $5, $6, 'admin')
       RETURNING id, name, email, mobile, gender, marital_status, role, created_at`,
      [name, email, password_hash, mobile, gender, marital_status]
    );

    logger.info(`New admin registered: ${email}`);
    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: result.rows[0],
    });
  } catch (err) {
    logger.error('Signup error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/* ─────────────── LOGIN ─────────────── */
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await query(
      'SELECT id, name, email, password_hash, role, is_active FROM employee WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const employee = result.rows[0];

    if (!employee.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, employee.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Wrong credentials' });
    }

    const payload = { id: employee.id, email: employee.email, role: employee.role };
    const token   = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    logger.info(`Login success: ${email}`);
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        employee: { id: employee.id, name: employee.name, email: employee.email, role: employee.role },
      },
    });
  } catch (err) {
    logger.error('Login error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/* ─────────────── FORGOT PASSWORD ─────────────── */
const forgotPassword = async (req, res) => {
  const { email, new_password } = req.body;
  try {
    const result = await query(
      'SELECT id FROM employee WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    const password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);

    await query(
      'UPDATE employee SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE email = $2',
      [password_hash, email]
    );

    logger.info(`Password reset for: ${email}`);
    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    logger.error('Forgot password error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/* ─────────────── ME (profile) ─────────────── */
const getMe = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, mobile, gender, marital_status, role, created_at FROM employee WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    logger.error('GetMe error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { signup, login, forgotPassword, getMe };
