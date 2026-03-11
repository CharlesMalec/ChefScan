import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Check, Sparkles, Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  loading: boolean;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, onSubscribe, loading }) => {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} 
            animate={{ scale: 1, y: 0 }} 
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative max-h-[95vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-6 sm:p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 backdrop-blur-md shadow-inner border border-white/30">
                <Star className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-current" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2 relative z-10">ChefScan Premium</h2>
              <p className="text-orange-100 font-medium relative z-10 text-sm sm:text-base">Libérez tout le potentiel de votre cuisine</p>
            </div>

            <div className="p-6 sm:p-8">
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{t('premium.unlimited')}</p>
                    <p className="text-sm text-slate-500">{t('premium.unlimitedDesc')}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{t('premium.advanced')}</p>
                    <p className="text-sm text-slate-500">{t('premium.advancedDesc')}</p>
                  </div>
                </li>
              </ul>

              <button 
                onClick={onSubscribe}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {loading ? t('premium.redirecting') : t('premium.subscribe')}
              </button>
              <p className="text-center text-xs text-slate-400 mt-4">{t('premium.noCommitment')}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PremiumModal;
