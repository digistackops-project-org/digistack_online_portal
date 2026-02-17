import axios from 'axios';

const AUTH_BASE    = process.env.REACT_APP_AUTH_URL    || 'http://localhost:4001';
const COURSE_BASE  = process.env.REACT_APP_COURSE_URL  || 'http://localhost:4002';
const TRAINER_BASE = process.env.REACT_APP_TRAINER_URL || 'http://localhost:4003';

const getToken = () => localStorage.getItem('ap_token');

const withAuth = (config = {}) => ({
  ...config,
  headers: { ...config.headers, Authorization: `Bearer ${getToken()}` },
});

// ─── Auth API ───────────────────────────────────────────
export const authAPI = {
  login:          (data) => axios.post(`${AUTH_BASE}/api/auth/login`, data),
  signup:         (data) => axios.post(`${AUTH_BASE}/api/auth/signup`, data),
  forgotPassword: (data) => axios.post(`${AUTH_BASE}/api/auth/forgot-password`, data),
  getMe:          ()     => axios.get(`${AUTH_BASE}/api/auth/me`, withAuth()),
};

// ─── Course API ─────────────────────────────────────────
export const courseAPI = {
  getAll:  ()           => axios.get(`${COURSE_BASE}/api/courses`, withAuth()),
  getById: (id)         => axios.get(`${COURSE_BASE}/api/courses/${id}`, withAuth()),
  add:     (data)       => axios.post(`${COURSE_BASE}/api/courses`, data, withAuth()),
  update:  (id, data)   => axios.put(`${COURSE_BASE}/api/courses/${id}`, data, withAuth()),
  delete:  (id)         => axios.delete(`${COURSE_BASE}/api/courses/${id}`, withAuth()),
};

// ─── Trainer API ────────────────────────────────────────
export const trainerAPI = {
  getAll:       ()         => axios.get(`${TRAINER_BASE}/api/trainers`, withAuth()),
  getById:      (id)       => axios.get(`${TRAINER_BASE}/api/trainers/${id}`, withAuth()),
  add:          (data)     => axios.post(`${TRAINER_BASE}/api/trainers`, data, withAuth()),
  update:       (id, data) => axios.put(`${TRAINER_BASE}/api/trainers/${id}`, data, withAuth()),
  setPassword:  (id, data) => axios.patch(`${TRAINER_BASE}/api/trainers/${id}/set-password`, data, withAuth()),
  delete:       (id)       => axios.delete(`${TRAINER_BASE}/api/trainers/${id}`, withAuth()),
};
