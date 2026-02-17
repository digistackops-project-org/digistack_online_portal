'use strict';

const app    = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 4001;

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Auth Service running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

/* ─── Graceful shutdown ─── */
const shutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000); // force after 10s
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('uncaughtException',  (err) => { logger.error('Uncaught exception', err);  process.exit(1); });
process.on('unhandledRejection', (err) => { logger.error('Unhandled rejection', err); process.exit(1); });

module.exports = server;
