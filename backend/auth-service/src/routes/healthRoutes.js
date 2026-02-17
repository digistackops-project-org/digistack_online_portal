'use strict';

const router   = require('express').Router();
const { healthCheck } = require('../config/database');
const logger   = require('../utils/logger');
const { version } = require('../../package.json');

const START_TIME = Date.now();

// GET /health
router.get('/', (req, res) => {
  res.status(200).json({
    status:  'UP',
    service: 'auth-service',
    version,
    uptime:  `${Math.floor((Date.now() - START_TIME) / 1000)}s`,
    timestamp: new Date().toISOString(),
  });
});

// GET /health/live  — is the process alive?
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'ALIVE', service: 'auth-service', timestamp: new Date().toISOString() });
});

// GET /health/ready — is the service ready to handle traffic (DB connected)?
router.get('/ready', async (req, res) => {
  try {
    await healthCheck();
    res.status(200).json({
      status:  'READY',
      service: 'auth-service',
      checks:  { database: 'UP' },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Health/ready DB check failed', err);
    res.status(503).json({
      status:  'NOT_READY',
      service: 'auth-service',
      checks:  { database: 'DOWN' },
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
