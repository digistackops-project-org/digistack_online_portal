'use strict';
const app = require('./app');
const logger = require('./utils/logger');
const PORT = process.env.PORT || 4003;
const server = app.listen(PORT, '0.0.0.0', () => logger.info(`Trainer Service running on port ${PORT}`));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
module.exports = server;
