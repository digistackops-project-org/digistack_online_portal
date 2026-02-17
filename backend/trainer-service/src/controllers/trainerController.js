'use strict';

const bcrypt   = require('bcryptjs');
const { query } = require('../config/database');
const logger   = require('../utils/logger');

const SALT_ROUNDS = 12;

/** Generate 6-digit random temporary password */
const generateTempPassword = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/* ─── GET all trainers ─── */
const getAllTrainers = async (req, res) => {
  try {
    const result = await query(
      `SELECT t.id, t.name, t.mobile, t.email, t.is_temp_password, t.is_active,
              t.created_at, t.updated_at,
              c.id AS course_id, c.course_name
       FROM trainer t
       LEFT JOIN course c ON t.course_id = c.id
       WHERE t.is_active = true
       ORDER BY t.created_at DESC`
    );
    return res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    logger.error('getAllTrainers error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/* ─── GET single trainer ─── */
const getTrainerById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT t.id, t.name, t.mobile, t.email, t.is_temp_password, t.is_active, t.created_at,
              c.id AS course_id, c.course_name
       FROM trainer t LEFT JOIN course c ON t.course_id = c.id
       WHERE t.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }
    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    logger.error('getTrainerById error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/* ─── ADD trainer ─── */
const addTrainer = async (req, res) => {
  const { name, mobile, email, course_id } = req.body;
  try {
    // Check duplicate email
    const existing = await query('SELECT id FROM trainer WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Trainer email already exists' });
    }

    // Validate course if provided
    if (course_id) {
      const courseCheck = await query('SELECT id FROM course WHERE id = $1 AND is_active = true', [course_id]);
      if (courseCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }
    }

    const tempPassword  = generateTempPassword();
    const password_hash = await bcrypt.hash(tempPassword, SALT_ROUNDS);

    const result = await query(
      `INSERT INTO trainer (name, mobile, email, password_hash, temp_password, is_temp_password, course_id)
       VALUES ($1, $2, $3, $4, $5, true, $6)
       RETURNING id, name, mobile, email, temp_password, is_temp_password, course_id, created_at`,
      [name, mobile, email, password_hash, tempPassword, course_id || null]
    );

    const trainer = result.rows[0];
    logger.info(`Trainer added: ${email} — temp password generated`);

    return res.status(201).json({
      success: true,
      message: 'Trainer added successfully',
      data: {
        ...trainer,
        // Return temp password ONCE so admin can share it with trainer
        temp_password: tempPassword,
      },
    });
  } catch (err) {
    logger.error('addTrainer error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/* ─── UPDATE trainer ─── */
const updateTrainer = async (req, res) => {
  const { id } = req.params;
  const { name, mobile, email, course_id } = req.body;
  try {
    const result = await query(
      `UPDATE trainer SET name=$1, mobile=$2, email=$3, course_id=$4
       WHERE id=$5 RETURNING id, name, mobile, email, course_id, updated_at`,
      [name, mobile, email, course_id || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }
    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    logger.error('updateTrainer error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/* ─── SET permanent password (trainer uses this after receiving temp) ─── */
const setPassword = async (req, res) => {
  const { id } = req.params;
  const { new_password } = req.body;
  try {
    const password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);
    const result = await query(
      `UPDATE trainer SET password_hash=$1, temp_password=NULL, is_temp_password=false
       WHERE id=$2 RETURNING id, email, is_temp_password`,
      [password_hash, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }
    logger.info(`Trainer ${id} set permanent password`);
    return res.status(200).json({ success: true, message: 'Password updated successfully', data: result.rows[0] });
  } catch (err) {
    logger.error('setPassword error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/* ─── DELETE trainer (soft delete) ─── */
const deleteTrainer = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      'UPDATE trainer SET is_active=false WHERE id=$1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }
    return res.status(200).json({ success: true, message: 'Trainer deleted successfully' });
  } catch (err) {
    logger.error('deleteTrainer error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getAllTrainers, getTrainerById, addTrainer, updateTrainer, setPassword, deleteTrainer };
