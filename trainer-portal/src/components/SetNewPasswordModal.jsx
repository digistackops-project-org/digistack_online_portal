import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, KeyRound, ShieldCheck, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { trainerPortalAPI } from '../services/api';
import { useAuth } from '../hooks/useAuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * SetNewPasswordModal
 * Shown immediately after a trainer logs in with their temporary password.
 * Trainer MUST set a permanent password before accessing the portal.
 * Matches the reference image: dark card with lock icon, two password fields.
 */
const SetNewPasswordModal = ({ trainerData, onClose }) => {
  const { setTrainer } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const newPw = watch('new_password');

  const passwordRules = {
    required: 'New password is required',
    minLength: { value: 8, message: 'At least 8 characters' },
    pattern: {
      value: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
      message: 'Needs uppercase, number, and special character (!@#$%^&*)',
    },
  };

  const inputCls = (err) =>
    `w-full px-4 py-3 bg-white/5 border ${err ? 'border-red-500' : 'border-white/20'} rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all`;

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await trainerPortalAPI.setPassword({
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });
      toast.success('✅ Password set! Welcome to your portal.');
      setTrainer(trainerData);
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        toast.error(detail[0]?.msg || 'Validation error');
      } else {
        toast.error(detail || 'Failed to set password');
      }
    } finally {
      setLoading(false);
    }
  };

  // Strength indicator
  const getStrength = (pw = '') => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[!@#$%^&*]/.test(pw)) score++;
    return score;
  };
  const strength = getStrength(newPw || '');
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 w-full max-w-md shadow-2xl shadow-emerald-500/10 relative"
      >
        {/* Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent rounded-3xl pointer-events-none" />

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <motion.div
            animate={{ rotateY: [0, 360] }}
            transition={{ duration: 2, delay: 0.3 }}
            className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30"
          >
            <ShieldCheck size={40} className="text-white" />
          </motion.div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Set New Password</h2>
          <p className="text-slate-400 text-sm">
            Welcome, <span className="text-emerald-400 font-semibold">{trainerData?.name}</span>!
            <br />Please set your permanent password to continue.
          </p>
          <div className="mt-3 inline-block bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1 text-emerald-400 text-xs">
            🔐 This step is required once
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Min 8 chars with uppercase, number, symbol"
                className={`${inputCls(errors.new_password)} pr-12`}
                {...register('new_password', passwordRules)}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.new_password && (
              <p className="text-red-400 text-xs mt-1">{errors.new_password.message}</p>
            )}

            {/* Password Strength Bar */}
            {newPw && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength ? strengthColors[strength - 1] : 'bg-slate-700'}`} />
                  ))}
                </div>
                <p className={`text-xs mt-1 ${['text-red-400', 'text-orange-400', 'text-yellow-400', 'text-emerald-400'][strength - 1] || 'text-slate-500'}`}>
                  {strength > 0 ? strengthLabels[strength - 1] : 'Enter password'}
                </p>
              </motion.div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showCPw ? 'text' : 'password'}
                placeholder="Re-enter your new password"
                className={`${inputCls(errors.confirm_password)} pr-12`}
                {...register('confirm_password', {
                  required: 'Confirm password is required',
                  validate: v => v === newPw || 'Passwords do not match',
                })}
              />
              <button type="button" onClick={() => setShowCPw(!showCPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                {showCPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-red-400 text-xs mt-1">{errors.confirm_password.message}</p>
            )}
          </div>

          {/* Requirements checklist */}
          <div className="bg-white/5 rounded-xl p-4 space-y-1.5">
            {[
              { label: 'At least 8 characters', pass: (newPw || '').length >= 8 },
              { label: 'One uppercase letter',   pass: /[A-Z]/.test(newPw || '') },
              { label: 'One number',             pass: /\d/.test(newPw || '') },
              { label: 'One special character',  pass: /[!@#$%^&*]/.test(newPw || '') },
            ].map((rule, i) => (
              <div key={i} className={`flex items-center gap-2 text-xs transition-colors ${rule.pass ? 'text-emerald-400' : 'text-slate-500'}`}>
                <span>{rule.pass ? '✓' : '○'}</span>
                <span>{rule.label}</span>
              </div>
            ))}
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><KeyRound size={18} /> Set Permanent Password</>
            }
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default SetNewPasswordModal;
