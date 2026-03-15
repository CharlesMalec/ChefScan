import React from 'react';
import { X, Tag, Clock, ChefHat, ShoppingCart, Check, Users } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getIngredientEmoji, formatUnit } from '../../utils';

interface ScanResultPreviewProps {
  scannedRecipe: any;
  onClose: () => void;
  onSave: () => void;
}

const ScanResultPreview: React.FC<ScanResultPreviewProps> = ({ scannedRecipe, onClose, onSave }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="bg-orange-50 p-8 relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-white/50 rounded-full p-2">
          <X className="w-6 h-6" />
        </button>
        <span className="text-xs font-bold tracking-wider text-orange-600 uppercase mb-3 block">{t('scan.previewTitle')}</span>
        <h2 className="text-3xl font-serif font-bold leading-tight text-slate-900">{scannedRecipe.title}</h2>
        
        {scannedRecipe.tags && scannedRecipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {scannedRecipe.tags.map((tag: string) => (
              <span key={tag} className="bg-white/50 text-orange-800 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" /> {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-6 mt-6 text-sm font-medium text-slate-700">
          <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" /> {t('scan.prep')}: {scannedRecipe.prepTime || '?'}</span>
          <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" /> {t('scan.cook')}: {scannedRecipe.cookTime || '?'}</span>
          <span className="flex items-center gap-2"><ChefHat className="w-4 h-4 text-orange-500" /> {t('scan.complexity')}: {scannedRecipe.complexity || '?'}</span>
          <span className="flex items-center gap-2"><Users className="w-4 h-4 text-orange-500" /> {scannedRecipe.servings || 4} pers.</span>
        </div>
      </div>
      
      <div className="p-8 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-slate-800">
            <ShoppingCart className="w-5 h-5 text-slate-400" /> {t('scan.ingredients')}
          </h3>
          <ul className="space-y-3">
            {scannedRecipe.ingredients.map((ing: any, idx: number) => {
              const unitDisplay = formatUnit(ing.amount, ing.unit);
              return (
                <li key={idx} className="text-sm flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-700 flex items-center gap-2">
                    <span>{getIngredientEmoji(ing.name)}</span>
                    {ing.name}
                  </span>
                  {(ing.amount || unitDisplay) && (
                    <span className="font-semibold text-slate-900">{ing.amount} {unitDisplay}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="md:col-span-2">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-slate-800">
            <ChefHat className="w-5 h-5 text-slate-400" /> {t('scan.steps')}
          </h3>
          <ol className="space-y-4 text-slate-700">
            {scannedRecipe.steps.map((step: string, idx: number) => (
              <li key={idx} className="flex gap-4 bg-slate-50 p-4 rounded-xl">
                <span className="font-bold text-orange-400 text-lg">{idx + 1}.</span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
        <button 
          onClick={onSave}
          className="bg-slate-900 hover:bg-slate-800 transition-colors text-white px-8 py-3.5 rounded-xl font-medium flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" /> {t('scan.save')}
        </button>
      </div>
    </div>
  );
};

export default ScanResultPreview;
