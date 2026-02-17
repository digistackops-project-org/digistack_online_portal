import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { UserPlus, Eye, EyeOff, Shield } from 'lucide-react';
import { authAPI } from '../services/api';

const inputCls = (err) =>
  `w-full px-4 py-3 bg-white/5 border ${err ? 'border-red-400' : 'border-white/20'} rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`;

const SignupPage = () => {
  const navigate = useNavigate();
  const [showPw, setShowPw]     = useState(false);
  const [showCPw, setShowCPw]   = useState(false);
  const [loading, setLoading]   = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authAPI.signup(data);
      toast.success('Account created! Please login.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20" />
        <motion.div animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 10, repeat: Infinity }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-20" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-2xl mb-4 shadow-lg shadow-purple-500/30">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 mt-1">Fill in your details to get started</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
                <input type="text" placeholder="John Doe" className={inputCls(errors.name)}
                  {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 chars' } })} />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Mobile *</label>
                <input type="tel" placeholder="9876543210" className={inputCls(errors.mobile)}
                  {...register('mobile', { required: 'Mobile required', pattern: { value: /^[6-9]\d{9}$/, message: 'Invalid mobile' } })} />
                {errors.mobile && <p className="text-red-400 text-xs mt-1">{errors.mobile.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
                <input type="email" placeholder="you@company.com" className={inputCls(errors.email)}
                  {...register('email', { required: 'Email required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })} />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Gender *</label>
                <select className={inputCls(errors.gender)}
                  {...register('gender', { required: 'Gender required', validate: v => v !== '' || 'Select gender' })}>
                  <option value="" className="bg-slate-800">Select gender</option>
                  <option value="male" className="bg-slate-800">Male</option>
                  <option value="female" className="bg-slate-800">Female</option>
                </select>
                {errors.gender && <p className="text-red-400 text-xs mt-1">{errors.gender.message}</p>}
              </div>

              {/* Marital Status */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Marital Status *</label>
                <select className={inputCls(errors.marital_status)}
                  {...register('marital_status', { required: 'Required', validate: v => v !== '' || 'Select status' })}>
                  <option value="" className="bg-slate-800">Select status</option>
                  <option value="married" className="bg-slate-800">Married</option>
                  <option value="unmarried" className="bg-slate-800">Unmarried</option>
                </select>
                {errors.marital_status && <p className="text-red-400 text-xs mt-1">{errors.marital_status.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password *</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} placeholder="Min 8 chars" className={`${inputCls(errors.password)} pr-10`}
                    {...register('password', {
                      required: 'Password required',
                      minLength: { value: 8, message: 'Min 8 chars' },
                      pattern: { value: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, message: 'Need uppercase, number, special char' }
                    })} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password *</label>
                <div className="relative">
                  <input type={showCPw ? 'text' : 'password'} placeholder="Re-enter password" className={`${inputCls(errors.confirm_password)} pr-10`}
                    {...register('confirm_password', {
                      required: 'Confirm password required',
                      validate: v => v === password || 'Passwords do not match'
                    })} />
                  <button type="button" onClick={() => setShowCPw(!showCPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    {showCPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
                {errors.confirm_password && <p className="text-red-400 text-xs mt-1">{errors.confirm_password.message}</p>}
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><UserPlus size={18} /> Create Account</>}
            </motion.button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/" className="text-purple-400 hover:text-purple-300 font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;
