'use strict';

const { Pool } = require('pg');
const logger   = require('../utils/logger');

const pool = new Pool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '5432'),
  database:           process.env.DB_NAME     || 'employeedb',
  user:               process.env.DB_USER     || 'postgres',
  password:           process.env.DB_PASSWORD || 'postgres',
  min:                parseInt(process.env.DB_POOL_MIN || '2'),
  max:                parseInt(process.env.DB_POOL_MAX || '10'),
  idleTimeoutMillis:  parseInt(process.env.DB_IDLE_TIMEOUT_MS   || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '2000'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => logger.info('New DB client connected'));
pool.on('error',   (err) => logger.error('DB Pool error:', err));

/**
 * Execute a parameterised query
 * @param {string} text  SQL
 * @param {Array}  params
 */
const query = (text, params) => pool.query(text, params);

/**
 * Health check: can we reach the DB?
 */
const healthCheck = async () => {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    return true;
  } finally {
    client.release();
  }
};

module.exports = { pool, query, healthCheck };
