import React from 'react';
import { ImageIcon, Link as LinkIcon, Loader2, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ScanOptionsProps {
  loading: boolean;
  onImageClick: () => void;
  urlInput: string;
  setUrlInput: (url: string) => void;
  onUrlSubmit: (e: React.FormEvent) => void;
}

const ScanOptions: React.FC<ScanOptionsProps> = ({
  loading,
  onImageClick,
  urlInput,
  setUrlInput,
  onUrlSubmit
}) => {
  const { t } = useLanguage();

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
      {/* Image Upload */}
      <div className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center justify-center hover:border-orange-200 transition-all hover:shadow-xl hover:shadow-orange-500/5 group">
        <div className="w-24 h-24 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
          <ImageIcon className="w-12 h-12" />
        </div>
        <h3 className="font-serif font-bold text-2xl mb-3 text-slate-900">{t('scan.bookTitle')}</h3>
        <p className="text-slate-500 mb-10 leading-relaxed text-center">{t('scan.bookDesc')}</p>
        
        <button 
          type="button"
          disabled={loading}
          onClick={onImageClick}
          className="w-full bg-orange-600 hover:bg-orange-700 transition-all text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-600/20 flex items-center justify-center gap-3 disabled:opacity-70 active:scale-[0.98]"
        >
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> {t('scan.analyzing')}</> : <><ImageIcon className="w-5 h-5" /> {t('scan.takePhoto')}</>}
        </button>
      </div>

      {/* URL Import */}
      <div className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center justify-center hover:border-blue-200 transition-all hover:shadow-xl hover:shadow-blue-500/5 group">
        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
          <LinkIcon className="w-12 h-12" />
        </div>
        <h3 className="font-serif font-bold text-2xl mb-3 text-slate-900">{t('scan.webTitle')}</h3>
        <p className="text-slate-500 mb-10 leading-relaxed text-center">{t('scan.webDesc')}</p>

        <form 
          onSubmit={onUrlSubmit}
          className="flex flex-col gap-4 w-full"
        >
          <input 
            type="url" 
            placeholder="https://recette-delicieuse.com/..." 
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-800 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
          />
          <button 
            type="submit"
            disabled={loading || !urlInput}
            className="w-full bg-slate-900 hover:bg-slate-800 transition-all text-white py-4 rounded-2xl font-bold shadow-lg shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ChevronRight className="w-5 h-5" /> {t('scan.importLink')}</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ScanOptions;
