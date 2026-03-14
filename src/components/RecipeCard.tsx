import React from 'react';
import { Tag, Trash2, Check, Clock, ChefHat, Users } from 'lucide-react';
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
      className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 hover:shadow-md transition-all group relative cursor-pointer active:scale-[0.98]"
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 space-y-1.5">
          <h3 className="font-serif font-black text-lg leading-tight text-slate-900 group-hover:text-orange-800 transition-colors tracking-tight">{recipe.title}</h3>
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {recipe.tags.slice(0, 2).map(tag => (
                <span key={tag} className="text-[9px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-orange-600" /> {tag}
                </span>
              ))}
              {recipe.tags.length > 2 && <span className="text-[9px] font-black text-slate-300">+{recipe.tags.length - 2}</span>}
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleMenu(recipe.id); }}
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-orange-800 border-orange-800 text-white shadow-md' : 'border-slate-200 text-transparent hover:border-orange-300'}`}
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(recipe.id); }}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all md:opacity-0 md:group-hover:opacity-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-slate-500 font-bold mt-auto pt-3 border-t border-slate-50">
        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-orange-500" /> {recipe.prepTime || '-'}</span>
        <span className="flex items-center gap-1.5"><ChefHat className="w-3.5 h-3.5 text-orange-500" /> {recipe.complexity || '-'}</span>
        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-orange-500" /> {recipe.servings || 4} pers.</span>
        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md ml-auto text-[9px] uppercase font-black tracking-widest">{recipe.source}</span>
      </div>
    </div>
  );
};

export default RecipeCard;
