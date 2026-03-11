import React from 'react';
import { ShoppingCart, BookOpen, X } from 'lucide-react';
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
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3 text-slate-800">
        <ShoppingCart className="w-7 h-7 text-orange-600" />
        {t('shopping.title')}
      </h2>

      {selectedForMenu.size === 0 ? (
        <div className="text-center py-20 px-4 bg-white rounded-3xl border border-slate-100">
          <p className="text-slate-500 mb-6 text-lg">{t('shopping.empty')}</p>
          <button 
            onClick={onViewLibrary}
            className="text-orange-600 font-medium hover:text-orange-700 flex items-center gap-2 mx-auto"
          >
            <BookOpen className="w-5 h-5" /> {t('shopping.viewRecipes')}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
          <div className="mb-6 pb-6 border-b border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <p className="text-slate-600 font-medium">{t('shopping.basedOn')} <span className="text-orange-600 font-bold">{selectedForMenu.size}</span> {t('shopping.recipesSelected')}</p>
              <button 
                onClick={onClearMenu}
                className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                {t('shopping.uncheckAll')}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recipes.filter(r => selectedForMenu.has(r.id)).map(recipe => (
                <div key={recipe.id} className="flex items-center gap-2 bg-orange-50 text-orange-900 px-3 py-1.5 rounded-xl text-sm font-medium border border-orange-100">
                  {recipe.title}
                  <button 
                    onClick={() => onToggleMenu(recipe.id)}
                    className="text-orange-400 hover:text-orange-600 transition-colors"
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
                <input type="checkbox" className="w-5 h-5 rounded border-orange-200 text-orange-800 focus:ring-orange-800 mt-0.5 cursor-pointer" />
                <div className="flex-1">
                  <p className="font-serif font-bold text-lg text-slate-800 capitalize leading-tight">
                    <span className="mr-2">{getIngredientEmoji(ingredient)}</span>
                    {ingredient}
                  </p>
                  {items.some(item => Number(item.total.toFixed(2)) > 0) && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {items.filter(item => Number(item.total.toFixed(2)) > 0).map((item, i) => (
                        <div key={i} className="text-xs bg-white border border-orange-100 px-2 py-0.5 rounded-full text-slate-600 shadow-sm flex items-center gap-1.5">
                          <span className="font-bold text-orange-800">{Number(item.total.toFixed(2))} {item.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingList;
