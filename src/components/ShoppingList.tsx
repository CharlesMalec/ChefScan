import React, { useState } from 'react';
import { ShoppingCart, Trash2, Check, ChevronRight, Plus, Minus, X, BookOpen, Users } from 'lucide-react';
import { Recipe } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { getIngredientEmoji, formatUnit } from '../utils';

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
        <div className="space-y-4">
          <div className="bg-white rounded-[32px] shadow-sm border border-orange-100/50 p-6 lg:p-8">
            <div className="mb-6 pb-6 border-b border-orange-100/50">
              <div className="flex justify-between items-center mb-4">
                <p className="text-slate-600 font-black uppercase text-[10px] tracking-widest">
                  {t('shopping.basedOn')} <span className="text-orange-700">{selectedForMenu.size}</span> {t('shopping.recipesSelected')}
                </p>
                <button 
                  onClick={handleClearMenu}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors"
                >
                  {t('shopping.uncheckAll')}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recipes.filter(r => selectedForMenu.has(r.id)).map(recipe => (
                  <div key={recipe.id} className="flex items-center gap-2 bg-white text-slate-900 pl-3 pr-1.5 py-1.5 rounded-xl text-xs font-black border border-orange-100 shadow-sm group hover:border-orange-300 transition-all">
                    <span className="truncate max-w-[120px]">{recipe.title}</span>
                    
                    <div className="flex items-center gap-1 bg-orange-50 px-1.5 py-0.5 rounded-lg ml-1 border border-orange-100/50">
                      <button 
                        onClick={() => onUpdateServings(recipe.id, Math.max(1, (menuServings[recipe.id] || recipe.servings || 4) - 1))} 
                        className="text-orange-400 hover:text-orange-700 transition-colors p-0.5"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-[9px] text-orange-800 w-3 text-center font-bold">
                        {menuServings[recipe.id] || recipe.servings || 4}
                      </span>
                      <button 
                        onClick={() => onUpdateServings(recipe.id, (menuServings[recipe.id] || recipe.servings || 4) + 1)} 
                        className="text-orange-400 hover:text-orange-700 transition-colors p-0.5"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    <button 
                      onClick={() => onToggleMenu(recipe.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors ml-1 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col gap-y-1">
              {sortedIngredients.map(([ingredient, items], idx) => {
                const isChecked = checkedItems.has(ingredient);
                return (
                   <div 
                    key={ingredient} 
                    className={`flex items-center gap-2.5 p-1.5 rounded-xl transition-all group border border-transparent ${isChecked ? 'opacity-40 grayscale bg-slate-50/50' : 'hover:bg-orange-50/30'}`}
                  >
                    <div className="relative shrink-0">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => toggleCheck(ingredient)}
                        className="peer w-4 h-4 rounded border border-orange-200 text-orange-700 focus:ring-orange-500/20 cursor-pointer appearance-none checked:bg-orange-700 checked:border-orange-700 transition-all" 
                      />
                      <Check className="absolute top-0.5 left-0.5 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer flex items-center justify-between gap-2" onClick={() => toggleCheck(ingredient)}>
                      <p className={`font-serif font-bold text-sm capitalize leading-none truncate ${isChecked ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                        <span className="mr-2 inline-block">{getIngredientEmoji(ingredient)}</span>
                        {ingredient}
                      </p>
                      <div className="flex flex-wrap gap-1 shrink-0">
                        {items.map((item, i) => {
                          const unitDisplay = formatUnit(item.total, item.unit);
                          return (
                            <div key={i} className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${isChecked ? 'bg-slate-200 text-slate-500' : 'bg-orange-100/50 text-orange-900'}`}>
                              {item.isNullAmount ? (
                                <span>{unitDisplay || 'Au goût'}</span>
                              ) : (
                                <span>{Number(item.total.toFixed(2))}{unitDisplay ? ` ${unitDisplay}` : ''}</span>
                              )}
                            </div>
                          );
                        })}
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
