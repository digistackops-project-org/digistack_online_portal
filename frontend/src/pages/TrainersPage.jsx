import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Users, Trash2, ArrowLeft, X, Loader2, Copy, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trainerAPI, courseAPI } from '../services/api';

const TrainersPage = () => {
  const navigate = useNavigate();
  const [trainers, setTrainers]   = useState([]);
  const [courses,  setCourses]    = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving,   setSaving]     = useState(false);
  const [tempPw,   setTempPw]     = useState(null); // show after add
  const [copied,   setCopied]     = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchData = useCallback(async () => {
    try {
      const [tRes, cRes] = await Promise.all([trainerAPI.getAll(), courseAPI.getAll()]);
      setTrainers(tRes.data.data);
      setCourses(cRes.data.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onAdd = async (data) => {
    setSaving(true);
    try {
      const res = await trainerAPI.add({ ...data, course_id: data.course_id || null });
      const tp = res.data.data.temp_password;
      setTempPw(tp);
      toast.success('Trainer added!');
      setShowForm(false);
      reset();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add trainer');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this trainer?')) return;
    try {
      await trainerAPI.delete(id);
      toast.success('Trainer deleted');
      setTrainers(prev => prev.filter(t => t.id !== id));
    } catch {
      toast.error('Failed to delete');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tempPw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputCls = (err) =>
    `w-full px-4 py-2.5 bg-slate-800 border ${err ? 'border-red-400' : 'border-slate-600'} rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/5 border-b border-white/10 px-6 py-4 flex items-center gap-4"
      >
        <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
            <Users size={18} className="text-white" />
          </div>
          <h1 className="text-white text-xl font-bold">Trainers</h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowForm(true)}
          className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-medium rounded-xl shadow-lg"
        >
          <Plus size={18} /> Add Trainer
        </motion.button>
      </motion.div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={40} className="text-teal-400 animate-spin" />
          </div>
        ) : trainers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 text-slate-500"
          >
            <Users size={60} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">No trainers yet. Add your first trainer!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainers.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-teal-500/40 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-teal-600/30 rounded-xl flex items-center justify-center">
                    <Users size={18} className="text-teal-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    {t.is_temp_password && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">
                        Temp PW
                      </span>
                    )}
                    <button onClick={() => onDelete(t.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="text-white font-semibold text-lg mb-1 truncate">{t.name}</h3>
                <p className="text-slate-400 text-sm mb-1">{t.email}</p>
                <p className="text-slate-500 text-sm mb-3">{t.mobile}</p>
                <div className="text-sm flex justify-between">
                  <span className="text-slate-500">Course:</span>
                  <span className="text-teal-400">{t.course_name || '—'}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Trainer Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/20 rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-white text-xl font-bold">Add New Trainer</h2>
                <button onClick={() => { setShowForm(false); reset(); }} className="text-slate-400 hover:text-white">
                  <X size={22} />
                </button>
              </div>
              <form onSubmit={handleSubmit(onAdd)} noValidate className="space-y-4">
                <div>
                  <label className="text-slate-300 text-sm mb-1.5 block">Name *</label>
                  <input className={inputCls(errors.name)} placeholder="Full name"
                    {...register('name', { required: 'Required' })} />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="text-slate-300 text-sm mb-1.5 block">Mobile *</label>
                  <input type="tel" className={inputCls(errors.mobile)} placeholder="9876543210"
                    {...register('mobile', { required: 'Required', pattern: { value: /^[6-9]\d{9}$/, message: 'Invalid mobile' } })} />
                  {errors.mobile && <p className="text-red-400 text-xs mt-1">{errors.mobile.message}</p>}
                </div>
                <div>
                  <label className="text-slate-300 text-sm mb-1.5 block">Email *</label>
                  <input type="email" className={inputCls(errors.email)} placeholder="trainer@company.com"
                    {...register('email', { required: 'Required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })} />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="text-slate-300 text-sm mb-1.5 block">Assign Course (optional)</label>
                  <select className={inputCls(false)} {...register('course_id')}>
                    <option value="" className="bg-slate-800">— Select Course —</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id} className="bg-slate-800">{c.course_name}</option>
                    ))}
                  </select>
                </div>
                <p className="text-slate-500 text-xs bg-slate-800 rounded-xl p-3">
                  🔑 A 6-digit one-time password will be auto-generated. Share it with the trainer so they can set their permanent password.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Add Trainer</>}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Temp Password Modal */}
      <AnimatePresence>
        {tempPw && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900 border border-yellow-500/30 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔑</span>
              </div>
              <h2 className="text-white text-xl font-bold mb-2">Temporary Password</h2>
              <p className="text-slate-400 text-sm mb-6">Share this one-time password with the trainer. They must change it on first login.</p>
              <div className="bg-slate-800 border border-yellow-500/30 rounded-2xl p-4 mb-6">
                <span className="text-yellow-400 font-mono text-3xl font-bold tracking-widest">{tempPw}</span>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={copyToClipboard}
                  className="flex-1 py-2.5 border border-yellow-500/40 text-yellow-400 rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-yellow-500/10 transition-all"
                >
                  {copied ? <><CheckCheck size={16}/> Copied!</> : <><Copy size={16}/> Copy</>}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setTempPw(null)}
                  className="flex-1 py-2.5 bg-yellow-500 text-slate-900 font-semibold rounded-xl text-sm"
                >
                  Done
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrainersPage;
