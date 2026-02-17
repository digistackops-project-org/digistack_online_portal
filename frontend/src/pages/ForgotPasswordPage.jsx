import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { KeyRound, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { authAPI } from '../services/api';

const inputCls = (err) =>
  `w-full px-4 py-3 bg-white/5 border ${err ? 'border-red-400' : 'border-white/20'} rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`;

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [showCPw, setShowCPw] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const newPw = watch('new_password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authAPI.forgotPassword(data);
      toast.success('Password updated! Please login.');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Error updating password';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 9, repeat: Infinity }}
          className="absolute top-20 left-20 w-80 h-80 bg-teal-500 rounded-full blur-3xl opacity-10" />
        <motion.div animate={{ scale: [1.3, 1, 1.3] }} transition={{ duration: 11, repeat: Infinity }}
          className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500 rounded-full blur-3xl opacity-15" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={18} /> Back to Login
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-2xl mb-4 shadow-lg shadow-teal-500/30">
            <KeyRound size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Reset Password</h1>
          <p className="text-slate-400 mt-1">Enter your email and set a new password</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input type="email" placeholder="your@email.com" className={inputCls(errors.email)}
                {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })} />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* New Password */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} placeholder="Min 8 chars" className={`${inputCls(errors.new_password)} pr-10`}
                  {...register('new_password', {
                    required: 'New password required',
                    minLength: { value: 8, message: 'Min 8 chars' },
                    pattern: { value: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, message: 'Need uppercase, number, special char' }
                  })} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {errors.new_password && <p className="text-red-400 text-xs mt-1">{errors.new_password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
              <div className="relative">
                <input type={showCPw ? 'text' : 'password'} placeholder="Re-enter new password" className={`${inputCls(errors.confirm_password)} pr-10`}
                  {...register('confirm_password', {
                    required: 'Confirm password required',
                    validate: v => v === newPw || 'Passwords do not match'
                  })} />
                <button type="button" onClick={() => setShowCPw(!showCPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showCPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {errors.confirm_password && <p className="text-red-400 text-xs mt-1">{errors.confirm_password.message}</p>}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-teal-600 to-purple-600 text-white font-semibold rounded-xl hover:from-teal-500 hover:to-purple-500 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><KeyRound size={18} /> Reset Password</>}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
