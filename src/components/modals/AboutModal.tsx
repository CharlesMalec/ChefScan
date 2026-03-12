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
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-20">
            <h2 className="text-2xl font-serif font-bold text-slate-800 flex items-center gap-3">
              <Heart className="w-6 h-6 text-orange-600" />
              {t('about.title')}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="overflow-y-auto">
            <div className="h-64 sm:h-80 relative">
              <img 
                src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=2000&auto=format&fit=crop" 
                alt="Plat traditionnel, pot-au-feu" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-8">
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">{t('about.title')}</h2>
              </div>
            </div>
            
            <div className="p-8 sm:p-12 space-y-6 text-lg text-slate-700 leading-relaxed font-serif">
              <p>
                <span className="text-4xl font-bold text-orange-800 float-left mr-2 mt-1 leading-none">{t('about.letter')}</span>
                {t('about.p1')}
              </p>
              
              <p>
                {t('about.p2')}
              </p>

              <p>
                {t('about.p3')}
              </p>

              <div className="my-10 border-l-4 border-orange-300 pl-6 italic text-xl text-slate-600">
                {t('about.quote')}
              </div>

              <p>
                {t('about.p4')}
              </p>

              <div className="pt-8 mt-8 border-t border-orange-100 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-800 font-bold text-2xl font-sans">
                  C
                </div>
                <div>
                  <p className="font-bold text-slate-900 font-sans">Charles</p>
                  <p className="text-sm text-slate-500 font-sans">{t('about.role')}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-orange-600/20"
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
