import React from 'react';
import { ShoppingCart, Trash2, Check, ChevronRight, Plus, Minus, X, BookOpen } from 'lucide-react';
import { Recipe } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { getIngredientEmoji } from '../utils';

interface ShoppingListProps {
  recipes: Recipe[];
  selectedForMenu: Set<string>;
  onToggleMenu: (id: string) => void;
  onClearMenu: () => void;
  onViewLibrary: () => void;
  generateShoppingList: () => Record<string, { total: number; unit: string; sources: string[] }[]>;
}

const ShoppingList: React.FC<ShoppingListProps> = ({
  recipes,
  selectedForMenu,
  onToggleMenu,
  onClearMenu,
  onViewLibrary,
  generateShoppingList
}) => {
  const { t } = useLanguage();
  const shoppingList = generateShoppingList();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">{t('shopping.title')}</p>
          <h2 className="text-4xl font-serif font-black text-slate-900 tracking-tight">{t('nav.shopping')}</h2>
        </div>
      </div>

      {selectedForMenu.size === 0 ? (
        <div className="text-center py-24 px-8 bg-white rounded-[40px] border border-orange-100/50 shadow-sm">
          <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <ShoppingCart className="w-10 h-10" />
          </div>
          <p className="text-slate-500 mb-8 text-xl font-medium max-w-md mx-auto leading-relaxed">{t('shopping.empty')}</p>
          <button 
            onClick={onViewLibrary}
            className="inline-flex items-center gap-3 px-8 py-4 bg-orange-700 text-white rounded-2xl font-black shadow-xl shadow-orange-700/20 hover:bg-orange-800 transition-all hover:-translate-y-1"
          >
            <BookOpen className="w-5 h-5" /> {t('shopping.viewRecipes')}
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white rounded-[40px] shadow-sm border border-orange-100/50 p-8 lg:p-10">
            <div className="mb-10 pb-10 border-b border-orange-100/50">
              <div className="flex justify-between items-center mb-6">
                <p className="text-slate-600 font-black uppercase text-xs tracking-widest">
                  {t('shopping.basedOn')} <span className="text-orange-700">{selectedForMenu.size}</span> {t('shopping.recipesSelected')}
                </p>
                <button 
                  onClick={onClearMenu}
                  className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors"
                >
                  {t('shopping.uncheckAll')}
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {recipes.filter(r => selectedForMenu.has(r.id)).map(recipe => (
                  <div key={recipe.id} className="flex items-center gap-3 bg-white text-slate-900 px-4 py-2 rounded-2xl text-sm font-black border border-orange-100 shadow-sm group hover:border-orange-300 transition-all">
                    {recipe.title}
                    <button 
                      onClick={() => onToggleMenu(recipe.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
              {(Object.entries(shoppingList) as [string, any[]][]).map(([ingredient, items], idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 hover:bg-orange-50/50 rounded-2xl transition-all group border border-transparent hover:border-orange-100">
                  <div className="relative mt-0.5">
                    <input type="checkbox" className="peer w-5 h-5 rounded-md border-2 border-orange-100 text-orange-700 focus:ring-orange-500/20 cursor-pointer appearance-none checked:bg-orange-700 checked:border-orange-700 transition-all" />
                    <Check className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif font-black text-lg text-slate-900 capitalize leading-tight mb-1 flex items-center gap-2">
                      <span className="text-xl">{getIngredientEmoji(ingredient)}</span>
                      {ingredient}
                    </p>
                    {items.some(item => Number(item.total.toFixed(2)) > 0) && (
                      <div className="flex flex-wrap gap-1.5">
                        {items.filter(item => Number(item.total.toFixed(2)) > 0).map((item, i) => (
                          <div key={i} className="text-[9px] font-black uppercase tracking-widest bg-white border border-orange-100 px-2 py-0.5 rounded-full text-orange-800 shadow-sm">
                            {Number(item.total.toFixed(2))} {item.unit}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingList;
