import React, { useState } from 'react';
import { ShoppingCart, Trash2, Check, ChevronRight, Plus, Minus, X, BookOpen, Users } from 'lucide-react';
import { Recipe } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { getIngredientEmoji } from '../utils';

interface ShoppingListProps {
  recipes: Recipe[];
  selectedForMenu: Set<string>;
  menuServings: Record<string, number>;
  onUpdateServings: (id: string, servings: number) => void;
  onToggleMenu: (id: string) => void;
  onClearMenu: () => void;
  onViewLibrary: () => void;
  generateShoppingList: () => Record<string, { total: number; unit: string; sources: string[], isNullAmount: boolean }[]>;
}

const ShoppingList: React.FC<ShoppingListProps> = ({
  recipes,
  selectedForMenu,
  menuServings,
  onUpdateServings,
  onToggleMenu,
  onClearMenu,
  onViewLibrary,
  generateShoppingList
}) => {
  const { t } = useLanguage();
  const shoppingList = generateShoppingList();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const handleClearMenu = () => {
    setCheckedItems(new Set());
    onClearMenu();
  };

  const toggleCheck = (ingredient: string) => {
    const newSet = new Set(checkedItems);
    if (newSet.has(ingredient)) newSet.delete(ingredient);
    else newSet.add(ingredient);
    setCheckedItems(newSet);
  };

  const formatUnit = (total: number, unit: string) => {
    let u = unit.trim();
    if (u === 'null' || u === 'undefined') return '';
    if (total >= 2) {
      if (u === 'entier') return 'entiers';
      if (u === 'gousse') return 'gousses';
      if (u === 'cuillère') return 'cuillères';
      if (u === 'pincée') return 'pincées';
      if (u === 'tranche') return 'tranches';
    }
    return u;
  };

  const sortedIngredients = (Object.entries(shoppingList) as [string, any[]][]).sort(([nameA], [nameB]) => {
    const aChecked = checkedItems.has(nameA);
    const bChecked = checkedItems.has(nameB);
    if (aChecked && !bChecked) return 1;
    if (!aChecked && bChecked) return -1;
    return nameA.localeCompare(nameB);
  });

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
                  onClick={handleClearMenu}
                  className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors"
                >
                  {t('shopping.uncheckAll')}
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {recipes.filter(r => selectedForMenu.has(r.id)).map(recipe => (
                  <div key={recipe.id} className="flex items-center gap-2 bg-white text-slate-900 pl-4 pr-2 py-2 rounded-2xl text-sm font-black border border-orange-100 shadow-sm group hover:border-orange-300 transition-all">
                    <span className="truncate max-w-[150px]">{recipe.title}</span>
                    
                    <div className="flex items-center gap-1.5 bg-orange-50 px-2 py-1 rounded-lg ml-1 border border-orange-100/50">
                      <button 
                        onClick={() => onUpdateServings(recipe.id, Math.max(1, (menuServings[recipe.id] || recipe.servings || 4) - 1))} 
                        className="text-orange-400 hover:text-orange-700 transition-colors p-0.5"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs text-orange-800 w-4 text-center font-bold flex items-center justify-center gap-1">
                        {menuServings[recipe.id] || recipe.servings || 4}
                      </span>
                      <button 
                        onClick={() => onUpdateServings(recipe.id, (menuServings[recipe.id] || recipe.servings || 4) + 1)} 
                        className="text-orange-400 hover:text-orange-700 transition-colors p-0.5"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button 
                      onClick={() => onToggleMenu(recipe.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors ml-1 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
              {sortedIngredients.map(([ingredient, items], idx) => {
                const isChecked = checkedItems.has(ingredient);
                return (
                  <div 
                    key={ingredient} 
                    className={`flex items-start gap-3 p-3 rounded-2xl transition-all group border ${isChecked ? 'opacity-40 grayscale bg-slate-50 border-transparent' : 'hover:bg-orange-50/50 border-transparent hover:border-orange-100'}`}
                  >
                    <div className="relative mt-0.5">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => toggleCheck(ingredient)}
                        className="peer w-5 h-5 rounded-md border-2 border-orange-100 text-orange-700 focus:ring-orange-500/20 cursor-pointer appearance-none checked:bg-orange-700 checked:border-orange-700 transition-all" 
                      />
                      <Check className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleCheck(ingredient)}>
                      <p className={`font-serif font-black text-lg capitalize leading-tight mb-1 flex items-center gap-2 ${isChecked ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                        <span className="text-xl">{getIngredientEmoji(ingredient)}</span>
                        {ingredient}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {items.map((item, i) => (
                          <div key={i} className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm ${isChecked ? 'bg-slate-200 text-slate-500 border-transparent' : 'bg-white border border-orange-100 text-orange-800'}`}>
                            {item.isNullAmount ? (
                              <span>{item.unit && item.unit !== 'null' ? item.unit : 'Au goût'}</span>
                            ) : (
                              <span>{Number(item.total.toFixed(2))} {formatUnit(item.total, item.unit)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingList;
