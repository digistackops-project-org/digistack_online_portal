import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { GraduationCap, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuthContext';
import SetNewPasswordModal from '../components/SetNewPasswordModal';

const TrainerLoginPage = () => {
  const { login }     = useAuth();
  const navigate      = useNavigate();
  const [showPw, setShowPw]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [showWrongCreds, setShowWrongCreds] = useState(false); // pop-up for wrong creds
  const [showSetPassword, setShowSetPassword] = useState(false); // set-password modal
  const [tempTrainerData, setTempTrainerData] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setShowWrongCreds(false);
    try {
      const result = await login(data.email, data.password);

      if (result.is_temp_password) {
        // Show set-password modal
        setTempTrainerData(result.trainer);
        setShowSetPassword(true);
      } else {
        toast.success(`Welcome back, ${result.trainer?.name?.split(' ')[0]}!`);
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || '';
      if (msg === 'Wrong credentials' || err.response?.status === 401) {
        setShowWrongCreds(true);
      } else {
        toast.error(msg || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Animated background orbs */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 9, repeat: Infinity }}
        className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 12, repeat: Infinity }}
        className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-600 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"
      />
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/4 w-64 h-64 bg-emerald-700 rounded-full blur-3xl opacity-10"
      />

      {/* Wrong Credentials Pop-up */}
      <AnimatePresence>
        {showWrongCreds && (
          <motion.div
            initial={{ opacity: 0, y: -60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-red-950 border border-red-500/40 rounded-2xl px-6 py-4 shadow-2xl shadow-red-900/40 flex items-center gap-3 min-w-72"
          >
            <div className="w-9 h-9 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-red-300 font-semibold text-sm">Wrong Credentials</p>
              <p className="text-red-400/70 text-xs mt-0.5">Check your email and password and try again.</p>
            </div>
            <button onClick={() => setShowWrongCreds(false)} className="ml-auto text-red-500 hover:text-red-300">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main login card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ rotateY: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl mb-5 shadow-2xl shadow-emerald-500/30"
          >
            <GraduationCap size={40} className="text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Trainer Portal</h1>
          <p className="text-emerald-400/70 mt-2 text-sm">Sign in to access your training dashboard</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl"
        >
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="you@training.com"
                className={`w-full px-4 py-3.5 bg-white/5 border ${errors.email ? 'border-red-500' : 'border-white/20'} rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all`}
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email format' },
                })}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={`w-full px-4 py-3.5 bg-white/5 border ${errors.password ? 'border-red-500' : 'border-white/20'} rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all pr-12`}
                  {...register('password', { required: 'Password is required' })}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Forgot password */}
            <div className="text-right mb-7">
              <Link to="/forgot-password" className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors font-medium">
                Forgot Password?
              </Link>
            </div>

            {/* Sign in button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2 text-base"
            >
              {loading
                ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                : <><LogIn size={18} /> Sign In</>
              }
            </motion.button>
          </form>

          {/* Temp password hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-center"
          >
            <p className="text-slate-600 text-xs">
              First time? Use the temporary password shared by your admin.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Set New Password Modal */}
      <AnimatePresence>
        {showSetPassword && (
          <SetNewPasswordModal
            trainerData={tempTrainerData}
            onClose={() => setShowSetPassword(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrainerLoginPage;
