import axios from 'axios';

const BASE = process.env.REACT_APP_TRAINER_PORTAL_URL || 'http://localhost:4004';

const getToken = () => localStorage.getItem('tp_token');
const withAuth = (cfg = {}) => ({
  ...cfg,
  headers: { ...cfg.headers, Authorization: `Bearer ${getToken()}` },
});

export const trainerPortalAPI = {
  login:           (data) => axios.post(`${BASE}/api/trainer-auth/login`, data),
  setPassword:     (data) => axios.post(`${BASE}/api/trainer-auth/set-password`, data, withAuth()),
  forgotPassword:  (data) => axios.post(`${BASE}/api/trainer-auth/forgot-password`, data),
  getMe:           ()     => axios.get(`${BASE}/api/trainer-auth/me`, withAuth()),
  health:          ()     => axios.get(`${BASE}/health`),
};
