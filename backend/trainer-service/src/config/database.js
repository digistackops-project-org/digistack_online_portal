'use strict';
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost', port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'employeedb', user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres', min: 2, max: 10,
  idleTimeoutMillis: 30000, connectionTimeoutMillis: 2000,
});
const query = (text, params) => pool.query(text, params);
const healthCheck = async () => { const c = await pool.connect(); try { await c.query('SELECT 1'); return true; } finally { c.release(); } };
module.exports = { pool, query, healthCheck };
