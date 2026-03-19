import React, { useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, Link as LinkIcon, Loader2, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ScanOptionsProps {
  loading: boolean;
  onImageClick: () => void;
  onGalleryClick?: () => void;
  urlInput: string;
  setUrlInput: (url: string) => void;
  onUrlSubmit: (e: React.FormEvent) => void;
}

const ScanOptions: React.FC<ScanOptionsProps> = ({
  loading,
  onImageClick,
  onGalleryClick,
  urlInput,
  setUrlInput,
  onUrlSubmit
}) => {
  const { t } = useLanguage();
  const [messageIndex, setMessageIndex] = useState(0);
  const loadingMessages = t('scan.loadingMessages') as unknown as string[];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
    } else {
      setMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading, loadingMessages.length]);

  return (
    <div className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {/* Image Upload */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center hover:border-orange-200 transition-all group">
        <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <ImageIcon className="w-8 h-8" />
        </div>
        <h3 className="font-serif font-black text-2xl mb-2 text-slate-900 tracking-tight">{t('scan.bookTitle')}</h3>
        <p className="text-slate-500 mb-8 text-center text-sm leading-relaxed">{t('scan.bookDesc')}</p>
        
        <div className="w-full space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              type="button"
              disabled={loading}
              onClick={onImageClick}
              className="flex-1 bg-orange-700 hover:bg-orange-800 transition-all text-white py-3.5 rounded-xl font-bold shadow-lg shadow-orange-700/20 flex items-center justify-center gap-2.5 disabled:opacity-70 active:scale-[0.98] text-base"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /></>
              ) : (
                <><Camera className="w-5 h-5" /> {t('scan.takePhoto')}</>
              )}
            </button>
            <button 
              type="button"
              disabled={loading}
              onClick={onGalleryClick}
              className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-800 transition-all py-3.5 rounded-xl font-bold flex items-center justify-center gap-2.5 disabled:opacity-70 active:scale-[0.98] text-base"
            >
              <ImageIcon className="w-5 h-5" /> {t('scan.choosePhoto')}
            </button>
          </div>
          {loading && (
            <p className="text-[10px] text-orange-600 font-black text-center animate-pulse uppercase tracking-widest mt-2">
              {loadingMessages[messageIndex]}<br/>
              {t('scan.loadingNote')}
            </p>
          )}
        </div>
      </div>

      {/* URL Import */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center hover:border-slate-200 transition-all group">
        <div className="w-16 h-16 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <LinkIcon className="w-8 h-8" />
        </div>
        <h3 className="font-serif font-black text-2xl mb-2 text-slate-900 tracking-tight">{t('scan.webTitle')}</h3>
        <p className="text-slate-500 mb-8 text-center text-sm leading-relaxed">{t('scan.webDesc')}</p>

        <form 
          onSubmit={onUrlSubmit}
          className="flex flex-col gap-3 w-full"
        >
          <input 
            type="url" 
            placeholder="https://..." 
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
          <div className="space-y-3">
            <button 
              type="submit"
              disabled={loading || !urlInput}
              className="w-full bg-slate-900 hover:bg-slate-800 transition-all text-white py-4 rounded-xl font-bold shadow-lg shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {loadingMessages[messageIndex]}</>
              ) : (
                <><ChevronRight className="w-4 h-4" /> {t('scan.importLink')}</>
              )}
            </button>
            {loading && (
              <p className="text-[10px] text-slate-500 font-black text-center animate-pulse uppercase tracking-widest">
                {t('scan.loadingNote')}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScanOptions;
