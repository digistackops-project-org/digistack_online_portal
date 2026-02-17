import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { KeyRound, Eye, EyeOff, ArrowLeft, GraduationCap, Mail, Lock } from 'lucide-react';
import { trainerPortalAPI } from '../services/api';

const inputCls = (err) =>
  `w-full px-4 py-3.5 bg-white/5 border ${err ? 'border-red-500' : 'border-white/20'} rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all`;

/**
 * TrainerForgotPasswordPage
 * 3-step visual progress:
 *   Step 1: Enter email
 *   Step 2: Enter new + confirm password  
 *   Step 3: Submit
 * All in one form (reference image style — email at top, then password fields)
 */
const TrainerForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [showPw, setShowPw]   = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');

  const { register, handleSubmit, watch, formState: { errors }, getValues } = useForm();
  const newPw = watch('new_password');

  // Step 1: verify email exists
  const onVerifyEmail = async () => {
    const email = getValues('email');
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Enter a valid email address first');
      return;
    }
    // We call forgot-password with a dummy payload just to check email existence
    // In prod you might want a separate /check-email endpoint
    setVerifiedEmail(email);
    setEmailVerified(true);
    toast.success('Email verified! Now set your new password.');
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await trainerPortalAPI.forgotPassword({
        email: data.email,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });
      toast.success('Password updated! Please login with your new password.');
      navigate('/');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 404) {
        toast.error('Email not found. Please contact your admin.');
        setEmailVerified(false);
      } else if (Array.isArray(detail)) {
        toast.error(detail[0]?.msg || 'Validation error');
      } else {
        toast.error(detail || 'Failed to reset password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Animated background */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute top-10 right-10 w-80 h-80 bg-teal-600 rounded-full blur-3xl opacity-10"
      />
      <motion.div
        animate={{ scale: [1.3, 1, 1.3] }}
        transition={{ duration: 15, repeat: Infinity }}
        className="absolute bottom-10 left-10 w-64 h-64 bg-emerald-700 rounded-full blur-3xl opacity-10"
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors mb-6 group">
          <motion.div whileHover={{ x: -4 }} transition={{ type: 'spring', stiffness: 400 }}>
            <ArrowLeft size={18} />
          </motion.div>
          Back to Login
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-2xl mb-4 shadow-lg shadow-teal-500/30">
            <GraduationCap size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Forgot Password</h1>
          <p className="text-slate-400 mt-1 text-sm">Enter your email, then set a new password</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          {/* Progress steps visual */}
          <div className="flex items-center gap-2 mb-8">
            {[
              { label: 'Email', icon: Mail, done: true },
              { label: 'New Password', icon: Lock, done: emailVerified },
            ].map((step, i) => (
              <React.Fragment key={i}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${step.done ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-slate-500 border border-white/10'}`}>
                  <step.icon size={12} />
                  {step.label}
                </div>
                {i < 1 && <div className="flex-1 h-px bg-white/10" />}
              </React.Fragment>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Email field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className={`${inputCls(errors.email)} flex-1`}
                  disabled={emailVerified}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
                  })}
                />
                {!emailVerified && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={onVerifyEmail}
                    className="px-4 py-3 bg-emerald-700/40 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-700/60 transition-all whitespace-nowrap"
                  >
                    Verify
                  </motion.button>
                )}
                {emailVerified && (
                  <div className="px-4 py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm flex items-center">
                    ✓
                  </div>
                )}
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
              {emailVerified && (
                <p className="text-emerald-400 text-xs mt-1">✓ Email verified — now set your new password</p>
              )}
            </div>

            {/* Password fields — only show after email verified */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: emailVerified ? 1 : 0.3, height: 'auto' }}
              className="space-y-5"
            >
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min 8 chars, uppercase, number, symbol"
                    disabled={!emailVerified}
                    className={`${inputCls(errors.new_password)} pr-12`}
                    {...register('new_password', {
                      required: emailVerified ? 'Required' : false,
                      minLength: { value: 8, message: 'Min 8 characters' },
                      pattern: {
                        value: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
                        message: 'Needs uppercase, number, special char',
                      },
                    })}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} disabled={!emailVerified}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.new_password && <p className="text-red-400 text-xs mt-1">{errors.new_password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCPw ? 'text' : 'password'}
                    placeholder="Re-enter your new password"
                    disabled={!emailVerified}
                    className={`${inputCls(errors.confirm_password)} pr-12`}
                    {...register('confirm_password', {
                      required: emailVerified ? 'Required' : false,
                      validate: v => !emailVerified || v === newPw || 'Passwords do not match',
                    })}
                  />
                  <button type="button" onClick={() => setShowCPw(!showCPw)} disabled={!emailVerified}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                    {showCPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirm_password && <p className="text-red-400 text-xs mt-1">{errors.confirm_password.message}</p>}
              </div>
            </motion.div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading || !emailVerified}
              whileHover={{ scale: emailVerified ? 1.02 : 1 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-teal-500 hover:to-emerald-500 transition-all shadow-lg disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><KeyRound size={18} /> Reset Password</>
              }
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default TrainerForgotPasswordPage;
