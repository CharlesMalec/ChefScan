import React from 'react';
import { X, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" 
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }} 
          className="bg-white rounded-[32px] shadow-2xl w-full max-w-3xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
        >
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
            <h2 className="text-xl font-serif font-black text-slate-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-orange-600 fill-current" />
              {t('about.title')}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto">
            <div className="h-48 sm:h-64 relative">
              <img 
                src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=2000&auto=format&fit=crop" 
                alt="Plat traditionnel" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-white">{t('about.title')}</h2>
              </div>
            </div>
            
            <div className="p-6 sm:p-8 space-y-4 text-base text-slate-700 leading-relaxed font-serif">
              <p>
                <span className="text-3xl font-black text-orange-800 float-left mr-2 mt-1 leading-none">{t('about.letter')}</span>
                {t('about.p1')}
              </p>
              
              <p>{t('about.p2')}</p>
              <p>{t('about.p3')}</p>

              <div className="my-6 border-l-4 border-orange-200 pl-4 italic text-lg text-slate-600">
                {t('about.quote')}
              </div>

              <p>{t('about.p4')}</p>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-800 font-black text-xl font-sans">
                  C
                </div>
                <div>
                  <p className="font-black text-slate-900 font-sans">Charles</p>
                  <p className="text-xs text-slate-500 font-sans">{t('about.role')}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg transition-colors text-sm"
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AboutModal;
