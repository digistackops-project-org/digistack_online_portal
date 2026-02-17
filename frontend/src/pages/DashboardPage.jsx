import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Users, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuthContext';
import toast from 'react-hot-toast';

const cards = [
  {
    id: 'courses',
    label: 'Courses',
    description: 'Manage course catalog, fees & durations',
    icon: BookOpen,
    gradient: 'from-purple-600 to-blue-600',
    shadow: 'shadow-purple-500/30',
    path: '/courses',
  },
  {
    id: 'trainers',
    label: 'Trainers',
    description: 'Add & manage trainers, assign courses',
    icon: Users,
    gradient: 'from-teal-600 to-emerald-600',
    shadow: 'shadow-teal-500/30',
    path: '/trainers',
  },
];

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between items-center"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg">Admin Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-white text-sm font-medium">{user?.name}</p>
            <p className="text-slate-400 text-xs">{user?.email}</p>
          </div>
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-all text-sm"
          >
            <LogOut size={16} /> Logout
          </motion.button>
        </div>
      </motion.nav>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-white mb-3">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-400 text-lg">What would you like to manage today?</p>
        </motion.div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.15 }}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(card.path)}
                className={`group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-left hover:border-white/20 transition-all shadow-2xl ${card.shadow}`}
              >
                {/* Gradient glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity`} />

                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${card.gradient} rounded-2xl mb-6 shadow-lg ${card.shadow}`}>
                  <Icon size={32} className="text-white" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">{card.label}</h2>
                <p className="text-slate-400">{card.description}</p>

                <motion.div
                  initial={{ x: 0 }}
                  whileHover={{ x: 6 }}
                  className={`mt-6 inline-flex items-center gap-2 text-sm font-medium bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}
                >
                  Open {card.label} →
                </motion.div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
