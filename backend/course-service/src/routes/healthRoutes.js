'use strict';
const router = require('express').Router();
const { healthCheck } = require('../config/database');
const { version } = require('../../package.json');
const START = Date.now();
router.get('/', (req, res) => res.status(200).json({ status: 'UP', service: 'course-service', version, uptime: `${Math.floor((Date.now()-START)/1000)}s`, timestamp: new Date().toISOString() }));
router.get('/live', (req, res) => res.status(200).json({ status: 'ALIVE', service: 'course-service', timestamp: new Date().toISOString() }));
router.get('/ready', async (req, res) => { try { await healthCheck(); res.json({ status: 'READY', checks: { database: 'UP' } }); } catch { res.status(503).json({ status: 'NOT_READY', checks: { database: 'DOWN' } }); } });
module.exports = router;
