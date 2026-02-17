import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, GraduationCap, BookOpen, Users, Clock, Star, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
  >
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-4`}>
      <Icon size={20} className="text-white" />
    </div>
    <p className="text-3xl font-bold text-white">{value}</p>
    <p className="text-slate-500 text-sm mt-1">{label}</p>
  </motion.div>
);

const TrainerDashboardPage = () => {
  const { trainer, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const stats = [
    { label: 'Assigned Course',    value: trainer?.course_name || '—', icon: BookOpen, color: 'bg-emerald-600', delay: 0.2 },
    { label: 'Active Students',    value: '—',                         icon: Users,    color: 'bg-blue-600',    delay: 0.3 },
    { label: 'Sessions This Week', value: '—',                         icon: Clock,    color: 'bg-purple-600',  delay: 0.4 },
    { label: 'Avg. Rating',        value: '—',                         icon: Star,     color: 'bg-yellow-600',  delay: 0.5 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [0, 40, 0], y: [0, 20, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 right-20 w-96 h-96 bg-emerald-700 rounded-full blur-3xl opacity-5" />
        <motion.div animate={{ x: [0, -30, 0], y: [0, -20, 0] }} transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-20 left-20 w-80 h-80 bg-teal-700 rounded-full blur-3xl opacity-5" />
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between items-center"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg leading-none">Trainer Portal</span>
            <span className="text-emerald-400/60 text-xs block">v3.0</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Trainer info */}
          <div className="text-right">
            <p className="text-white text-sm font-medium">{trainer?.name}</p>
            <p className="text-slate-400 text-xs">{trainer?.email}</p>
          </div>
          {/* Avatar placeholder */}
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold">
            {trainer?.name?.[0]?.toUpperCase() || 'T'}
          </div>
          {/* Logout */}
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all text-sm"
          >
            <LogOut size={16} /> Logout
          </motion.button>
        </div>
      </motion.nav>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">

        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/20 rounded-3xl p-8 mb-10"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome, <span className="text-emerald-400">{trainer?.name?.split(' ')[0]}</span>! 👋
              </h1>
              <p className="text-slate-400">
                {trainer?.course_name
                  ? `You are assigned to: ${trainer.course_name}`
                  : 'No course assigned yet. Contact your admin.'}
              </p>
              {trainer?.is_temp_password && (
                <div className="mt-3 inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-4 py-1.5 text-yellow-400 text-xs">
                  ⚠️ You are using a temporary password. Please change it.
                </div>
              )}
            </div>
            <motion.div
              animate={{ rotateY: [0, 10, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="hidden md:flex w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl items-center justify-center shadow-xl shadow-emerald-500/20"
            >
              <GraduationCap size={40} className="text-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((s, i) => <StatCard key={i} {...s} />)}
        </div>

        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-6"
        >
          <h2 className="text-white font-semibold text-lg mb-5 flex items-center gap-2">
            <Users size={20} className="text-emerald-400" /> My Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Full Name',    value: trainer?.name },
              { label: 'Email',        value: trainer?.email },
              { label: 'Mobile',       value: trainer?.mobile },
              { label: 'Course',       value: trainer?.course_name || '—' },
              { label: 'Portal Access', value: trainer?.portal_access ? 'Active' : 'Disabled' },
              { label: 'Account Type', value: trainer?.is_temp_password ? 'Temp Password' : 'Secured' },
            ].map((f, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-slate-500 text-sm">{f.label}</span>
                <span className={`text-sm font-medium ${f.label === 'Portal Access' ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {f.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TrainerDashboardPage;
