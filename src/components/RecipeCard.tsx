import React from 'react';
import { Tag, Trash2, Check, Clock, ChefHat } from 'lucide-react';
import { Recipe } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface RecipeCardProps {
  recipe: Recipe;
  onView: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onToggleMenu: (id: string) => void;
  isSelected: boolean;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ 
  recipe, 
  onView, 
  onDelete, 
  onToggleMenu, 
  isSelected 
}) => {
  const { t } = useLanguage();

  return (
    <div 
      onClick={() => onView(recipe)}
      className="bg-white p-5 rounded-3xl shadow-sm border border-orange-50 flex flex-col gap-4 hover:shadow-xl hover:shadow-orange-900/5 transition-all group relative cursor-pointer active:scale-[0.98]"
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <h3 className="font-serif font-bold text-xl leading-tight text-slate-900 group-hover:text-orange-900 transition-colors mb-2">{recipe.title}</h3>
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {recipe.tags.slice(0, 2).map(tag => (
                <span key={tag} className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" /> {tag}
                </span>
              ))}
              {recipe.tags.length > 2 && <span className="text-[10px] font-bold text-slate-300">+{recipe.tags.length - 2}</span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(recipe.id); }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all md:opacity-0 md:group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleMenu(recipe.id); }}
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-orange-800 border-orange-800 text-white scale-110 shadow-lg shadow-orange-800/20' : 'border-orange-100 text-transparent hover:border-orange-300'}`}
          >
            <Check className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium mt-auto pt-4 border-t border-orange-50">
        <span className="flex items-center gap-1.5 bg-orange-50/50 px-2 py-1 rounded-xl"><Clock className="w-3.5 h-3.5 text-orange-400" /> {recipe.prepTime || '-'}</span>
        <span className="flex items-center gap-1.5 bg-orange-50/50 px-2 py-1 rounded-xl"><ChefHat className="w-3.5 h-3.5 text-orange-400" /> {recipe.complexity || '-'}</span>
        <span className="bg-orange-100 text-orange-900 px-2 py-1 rounded-xl ml-auto text-[10px] uppercase font-bold tracking-wider">{recipe.source}</span>
      </div>
    </div>
  );
};

export default RecipeCard;
