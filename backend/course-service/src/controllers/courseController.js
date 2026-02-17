'use strict';

const { query } = require('../config/database');
const logger    = require('../utils/logger');

/* ─── GET all courses (with trainer name) ─── */
const getAllCourses = async (req, res) => {
  try {
    const result = await query(
      `SELECT c.id, c.course_name, c.course_fees, c.course_duration, c.is_active,
              c.created_at, c.updated_at,
              t.id AS trainer_id, t.name AS trainer_name
       FROM course c
       LEFT JOIN trainer t ON c.trainer_id = t.id
       WHERE c.is_active = true
       ORDER BY c.created_at DESC`
    );
    return res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    logger.error('getAllCourses error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/* ─── GET single course ─── */
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT c.*, t.name AS trainer_name FROM course c
       LEFT JOIN trainer t ON c.trainer_id = t.id
       WHERE c.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    logger.error('getCourseById error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/* ─── ADD course ─── */
const addCourse = async (req, res) => {
  const { course_name, course_fees, course_duration, trainer_id } = req.body;
  try {
    // Validate trainer exists if provided
    if (trainer_id) {
      const trainerCheck = await query('SELECT id FROM trainer WHERE id = $1', [trainer_id]);
      if (trainerCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Trainer not found' });
      }
    }

    const result = await query(
      `INSERT INTO course (course_name, course_fees, course_duration, trainer_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, course_name, course_fees, course_duration, trainer_id, created_at`,
      [course_name, course_fees, course_duration, trainer_id || null]
    );

    logger.info(`Course added: ${course_name}`);
    return res.status(201).json({ success: true, message: 'Course added successfully', data: result.rows[0] });
  } catch (err) {
    logger.error('addCourse error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/* ─── UPDATE course ─── */
const updateCourse = async (req, res) => {
  const { id } = req.params;
  const { course_name, course_fees, course_duration, trainer_id } = req.body;
  try {
    const result = await query(
      `UPDATE course SET course_name=$1, course_fees=$2, course_duration=$3, trainer_id=$4
       WHERE id=$5 RETURNING *`,
      [course_name, course_fees, course_duration, trainer_id || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    logger.error('updateCourse error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/* ─── DELETE course (soft delete) ─── */
const deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      'UPDATE course SET is_active=false WHERE id=$1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    return res.status(200).json({ success: true, message: 'Course deleted successfully' });
  } catch (err) {
    logger.error('deleteCourse error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getAllCourses, getCourseById, addCourse, updateCourse, deleteCourse };
