import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  authError: string;
  onGoogleLogin: () => void;
  onEmailAuth: (e: React.FormEvent) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  authMode,
  setAuthMode,
  email,
  setEmail,
  password,
  setPassword,
  authError,
  onGoogleLogin,
  onEmailAuth
}) => {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} 
            animate={{ scale: 1, y: 0 }} 
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-serif font-bold text-slate-900">
                  {authMode === 'login' ? t('auth.login') : t('auth.signup')}
                </h2>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <button 
                onClick={onGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-700 hover:bg-slate-50 transition-all mb-6"
              >
                <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black">G</div> {t('auth.google')}
              </button>

              <div className="relative flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-slate-100"></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('auth.or')}</span>
                <div className="flex-1 h-px bg-slate-100"></div>
              </div>

              <form onSubmit={onEmailAuth} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">{t('auth.email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-orange-200 focus:bg-white transition-all outline-none"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">{t('auth.password')}</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-orange-200 focus:bg-white transition-all outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {authError && (
                  <p className="text-sm text-red-500 font-medium px-1">{authError}</p>
                )}

                <button 
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-orange-700 text-white font-bold shadow-lg shadow-orange-700/20 hover:bg-orange-800 transition-all"
                >
                  {authMode === 'login' ? t('auth.signIn') : t('auth.signUp')}
                </button>
              </form>

              <p className="text-center mt-8 text-sm text-slate-500">
                {authMode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="ml-2 text-orange-700 font-bold hover:underline"
                >
                  {authMode === 'login' ? t('auth.signUp') : t('auth.signIn')}
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
