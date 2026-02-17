'use strict';

require('dotenv').config();

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const compression  = require('compression');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');

const authRoutes   = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');
const logger       = require('./utils/logger');

const app = express();

/* ─── Security middleware ─── */
app.use(helmet());
app.use(compression());

/* ─── CORS ─── */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      cb(null, true);
    } else {
      cb(new Error(`CORS: ${origin} not allowed`));
    }
  },
  credentials: true,
}));

/* ─── Body parsing ─── */
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/* ─── HTTP logging ─── */
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

/* ─── Rate limiting ─── */
const limiter = rateLimit({
  windowMs:    parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max:         parseInt(process.env.RATE_LIMIT_MAX       || '100'),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/auth', limiter);

/* ─── Routes ─── */
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);

/* ─── 404 handler ─── */
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

/* ─── Global error handler ─── */
app.use((err, req, res, next) => {
  logger.error(err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

module.exports = app;
