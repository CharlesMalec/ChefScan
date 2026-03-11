import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, LogOut } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Language } from '../../translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout
}) => {
  const { t, language, setLanguage } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-600" />
                {t('settings.title')}
              </h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Language Section */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-4 h-px bg-slate-200"></span>
                  {t('settings.language')}
                  <span className="flex-1 h-px bg-slate-200"></span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setLanguage('fr')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${language === 'fr' ? 'border-orange-500 bg-orange-50 text-orange-900 font-bold shadow-sm' : 'border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50'}`}
                  >
                    <span className="text-xl">🇫🇷</span> Français
                  </button>
                  <button 
                    onClick={() => setLanguage('en')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${language === 'en' ? 'border-orange-500 bg-orange-50 text-orange-900 font-bold shadow-sm' : 'border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50'}`}
                  >
                    <span className="text-xl">🇬🇧</span> English
                  </button>
                </div>
              </div>
              
              {/* Account Section */}
              {user && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-4 h-px bg-slate-200"></span>
                    {t('settings.account')}
                    <span className="flex-1 h-px bg-slate-200"></span>
                  </h3>
                  <button 
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all border border-red-100"
                  >
                    <LogOut className="w-5 h-5" /> {t('settings.logout')}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;
