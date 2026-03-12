import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, LogOut, Heart } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Language } from '../../translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
  onShowAbout: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  onShowAbout
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
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white">
              <h2 className="text-xl font-serif font-black text-slate-900 tracking-tight">{t('settings.title')}</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Language Section */}
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  {t('settings.language')}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setLanguage('fr')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all text-sm font-bold ${language === 'fr' ? 'border-orange-600 bg-orange-50 text-orange-900' : 'border-slate-50 text-slate-500 hover:border-slate-200'}`}
                  >
                    🇫🇷 Français
                  </button>
                  <button 
                    onClick={() => setLanguage('en')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all text-sm font-bold ${language === 'en' ? 'border-orange-600 bg-orange-50 text-orange-900' : 'border-slate-50 text-slate-500 hover:border-slate-200'}`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>

              {/* About Section */}
              <div>
                <button 
                  onClick={() => {
                    onShowAbout();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all text-sm"
                >
                  <Heart className="w-4 h-4 text-orange-500 fill-current" /> {t('about.title')}
                </button>
              </div>
              
              {/* Account Section */}
              {user && (
                <button 
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white text-red-600 font-bold hover:bg-red-50 transition-all border-2 border-red-50 text-sm"
                >
                  <LogOut className="w-4 h-4" /> {t('settings.logout')}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;
