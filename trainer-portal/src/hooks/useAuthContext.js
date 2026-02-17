import React, { createContext, useContext, useState, useEffect } from 'react';
import { trainerPortalAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('tp_token');
    if (token) {
      trainerPortalAPI.getMe()
        .then(res => setTrainer(res.data.data))
        .catch(() => localStorage.removeItem('tp_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await trainerPortalAPI.login({ email, password });
    const { token, is_temp_password, trainer: trainerData } = res.data;
    localStorage.setItem('tp_token', token);
    if (!is_temp_password) setTrainer(trainerData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('tp_token');
    setTrainer(null);
  };

  return (
    <AuthContext.Provider value={{ trainer, setTrainer, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
