import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Pencil, Save, Link as LinkIcon, Tag, Clock, ChefHat, ShoppingCart, Trash2, Plus, Minus, Check, Crown, Users } from 'lucide-react';
import { Recipe } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { getIngredientEmoji, formatUnit } from '../../utils';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  onClose: () => void;
  isPremium: boolean;
  onShowPremium: () => void;
  onUpdate: (recipe: Recipe) => Promise<void>;
  onToggleMenu: (id: string) => void;
  isSelected: boolean;
}

const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  onClose,
  isPremium,
  onShowPremium,
  onUpdate,
  onToggleMenu,
  isSelected
}) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Recipe | null>(null);
  const [viewServings, setViewServings] = useState(4);

  useEffect(() => {
    if (recipe) {
      setEditForm(recipe);
      setViewServings(recipe.servings || 4);
    } else {
      setIsEditing(false);
      setEditForm(null);
    }
  }, [recipe]);

  if (!recipe) return null;

  const handleUpdate = async () => {
    if (editForm) {
      await onUpdate(editForm);
      setIsEditing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-orange-900/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }} 
          animate={{ scale: 1, y: 0 }} 
          exit={{ scale: 0.9, y: 20 }}
          className="bg-[#FDFCFB] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] shadow-2xl border border-orange-100/50"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-orange-50/50 p-6 md:p-8 relative">
            <div className="absolute top-6 right-6 flex items-center gap-2">
              {!isEditing ? (
                <button 
                  onClick={() => {
                    if (!isPremium) {
                      onShowPremium();
                      return;
                    }
                    setIsEditing(true);
                  }}
                  className="text-slate-400 hover:text-orange-900 bg-white rounded-full p-2 shadow-sm transition-all hover:scale-110 active:scale-90 relative"
                >
                  {!isPremium && <Crown className="w-2.5 h-2.5 absolute -top-1 -right-1 text-orange-500" />}
                  <Pencil className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={handleUpdate}
                  className="text-white bg-orange-700 hover:bg-orange-800 rounded-full p-2 shadow-sm transition-all hover:scale-110 active:scale-90"
                >
                  <Save className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={onClose} 
                className="text-slate-400 hover:text-orange-900 bg-white rounded-full p-2 shadow-sm transition-all hover:rotate-90 active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-orange-900 text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest">{recipe.source}</span>
              {recipe.sourceUrl && !isEditing && (
                <a href={recipe.sourceUrl} target="_blank" rel="noreferrer" className="text-orange-600 hover:text-orange-800 transition-colors">
                  <LinkIcon className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            
            {isEditing && editForm ? (
              <input 
                type="text" 
                value={editForm.title}
                onChange={e => setEditForm({...editForm, title: e.target.value})}
                className="w-full text-2xl md:text-3xl font-serif font-bold leading-tight text-slate-900 mb-4 bg-white/50 border border-orange-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            ) : (
              <h2 className="text-2xl md:text-3xl font-serif font-bold leading-tight text-slate-900 mb-4">{recipe.title}</h2>
            )}
            
            {isEditing && editForm ? (
              <div className="mb-8">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t('scan.tags') || 'Tags'} ({t('scan.separated') || 'séparés par des virgules'})</label>
                <input 
                  type="text" 
                  value={(editForm.tags || []).join(', ')}
                  onChange={e => setEditForm({...editForm, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})}
                  className="w-full bg-white/50 border border-orange-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Végétarien, Rapide, Dessert..."
                />
              </div>
            ) : (
              recipe.tags && recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {recipe.tags.map(tag => (
                    <span key={tag} className="bg-white/60 backdrop-blur-sm border border-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                      <Tag className="w-3 h-3" /> {tag}
                    </span>
                  ))}
                </div>
              )
            )}

            <div className="flex flex-wrap gap-6 text-xs font-bold text-orange-900/60 uppercase tracking-widest">
              {isEditing && editForm ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <input type="text" value={editForm.prepTime || ''} onChange={e => setEditForm({...editForm, prepTime: e.target.value})} placeholder={t('scan.prep')} className="bg-white/50 border border-orange-200 rounded-lg px-2 py-1 w-20 focus:outline-none" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <input type="text" value={editForm.cookTime || ''} onChange={e => setEditForm({...editForm, cookTime: e.target.value})} placeholder={t('scan.cook')} className="bg-white/50 border border-orange-200 rounded-lg px-2 py-1 w-20 focus:outline-none" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ChefHat className="w-4 h-4 text-orange-500" />
                    <input type="text" value={editForm.complexity || ''} onChange={e => setEditForm({...editForm, complexity: e.target.value})} placeholder={t('scan.complexity')} className="bg-white/50 border border-orange-200 rounded-lg px-2 py-1 w-20 focus:outline-none" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-orange-500" />
                    <input type="number" value={editForm.servings || ''} onChange={e => setEditForm({...editForm, servings: parseInt(e.target.value) || undefined})} placeholder="Portions" className="bg-white/50 border border-orange-200 rounded-lg px-2 py-1 w-20 focus:outline-none" />
                  </div>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-orange-500" /> {t('scan.prep')}: {recipe.prepTime || '-'}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-orange-500" /> {t('scan.cook')}: {recipe.cookTime || '-'}</span>
                  <span className="flex items-center gap-1.5"><ChefHat className="w-4 h-4 text-orange-500" /> {t('scan.complexity')}: {recipe.complexity || '-'}</span>
                </>
              )}
            </div>
          </div>
          
          <div className={`p-6 md:p-8 ${isEditing ? 'flex flex-col gap-8' : 'grid md:grid-cols-5 gap-8'}`}>
            <div className={isEditing ? '' : 'md:col-span-2'}>
              <h3 className="font-serif font-bold text-xl mb-6 flex items-center justify-between text-slate-800 border-b border-orange-100 pb-3 italic">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-orange-400" /> {t('scan.ingredients')}
                </div>
                {!isEditing && (
                  <div className="flex items-center gap-1.5 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100/50 not-italic">
                    <Users className="w-3.5 h-3.5 text-orange-500" />
                    <button 
                      onClick={() => setViewServings(Math.max(1, viewServings - 1))} 
                      className="text-orange-400 hover:text-orange-700 transition-colors p-0.5 ml-0.5"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-[10px] text-orange-800 w-3 text-center font-bold flex items-center justify-center gap-1">
                      {viewServings}
                    </span>
                    <button 
                      onClick={() => setViewServings(viewServings + 1)} 
                      className="text-orange-400 hover:text-orange-700 transition-colors p-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </h3>
              <ul className="space-y-4">
                {isEditing && editForm ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {editForm.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex gap-1.5 sm:gap-2 items-center bg-white p-2 rounded-xl border border-orange-200 shadow-sm focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-400 transition-all">
                        <input type="text" value={ing.name} onChange={e => {
                          const newIngs = [...editForm.ingredients];
                          newIngs[idx].name = e.target.value;
                          setEditForm({...editForm, ingredients: newIngs});
                        }} className="flex-1 min-w-0 bg-transparent px-1 sm:px-2 py-1 text-sm focus:outline-none font-medium text-slate-700" placeholder="Nom" />
                        <div className="w-px h-6 bg-orange-100 shrink-0"></div>
                        <input type="text" value={ing.amount} onChange={e => {
                          const newIngs = [...editForm.ingredients];
                          newIngs[idx].amount = e.target.value;
                          setEditForm({...editForm, ingredients: newIngs});
                        }} className="w-10 sm:w-12 min-w-0 shrink-0 bg-transparent px-1 py-1 text-sm focus:outline-none text-center text-slate-600" placeholder="Qté" />
                        <div className="w-px h-6 bg-orange-100 shrink-0"></div>
                        <input type="text" value={ing.unit} onChange={e => {
                          const newIngs = [...editForm.ingredients];
                          newIngs[idx].unit = e.target.value;
                          setEditForm({...editForm, ingredients: newIngs});
                        }} className="w-14 sm:w-16 min-w-0 shrink-0 bg-transparent px-1 py-1 text-sm focus:outline-none text-center text-slate-600" placeholder="Unité" />
                        <button onClick={() => {
                          const newIngs = editForm.ingredients.filter((_, i) => i !== idx);
                          setEditForm({...editForm, ingredients: newIngs});
                        }} className="p-1.5 shrink-0 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button onClick={() => {
                      setEditForm({...editForm, ingredients: [...editForm.ingredients, {name: '', amount: '', unit: ''}]});
                    }} className="h-full min-h-[48px] border-2 border-dashed border-orange-200 rounded-xl text-sm text-orange-600 font-bold flex items-center justify-center gap-2 hover:bg-orange-50 hover:border-orange-300 transition-colors"><Plus className="w-4 h-4" /> {t('scan.addIngredient') || 'Ajouter un ingrédient'}</button>
                  </div>
                ) : (
                  recipe.ingredients.map((ing, idx) => {
                    const originalServings = recipe.servings || 4;
                    const ratio = viewServings / originalServings;
                    const baseAmount = ing.amount ? parseFloat(String(ing.amount).replace(',', '.')) : 0;
                    const scaledAmount = baseAmount > 0 ? Number((baseAmount * ratio).toFixed(2)) : '';
                    const unitDisplay = formatUnit(scaledAmount || baseAmount, ing.unit);
                    
                    return (
                      <li key={idx} className="flex justify-between items-center group">
                        <span className="text-slate-700 font-serif italic text-base capitalize flex items-center gap-2">
                          <span>{getIngredientEmoji(ing.name)}</span>
                          {ing.name}
                        </span>
                        {(scaledAmount !== '' || unitDisplay !== '') && (
                          <div className="flex items-center gap-2">
                            <span className="h-px w-4 bg-orange-100 group-hover:w-8 transition-all"></span>
                            <span className="font-bold text-orange-900 bg-orange-100/30 px-2.5 py-0.5 rounded-lg text-xs">
                              {scaledAmount} {unitDisplay}
                            </span>
                          </div>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>

            <div className={isEditing ? '' : 'md:col-span-3'}>
              <h3 className="font-serif font-bold text-xl mb-6 flex items-center gap-2 text-slate-800 border-b border-orange-100 pb-3 italic">
                <ChefHat className="w-5 h-5 text-orange-400" /> {t('scan.steps')}
              </h3>
              <ol className="space-y-6 text-slate-700">
                {isEditing && editForm ? (
                  <div className="space-y-3">
                    {editForm.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-3 items-start bg-white p-3 rounded-xl border border-orange-200 shadow-sm focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-400 transition-all">
                        <span className="font-serif font-bold text-xl text-orange-300 shrink-0">{idx + 1}.</span>
                        <textarea 
                          value={step} 
                          onChange={e => {
                            const newSteps = [...editForm.steps];
                            newSteps[idx] = e.target.value;
                            setEditForm({...editForm, steps: newSteps});
                          }} 
                          className="flex-1 bg-transparent text-sm focus:outline-none min-h-[60px] resize-y text-slate-700 leading-relaxed" 
                          placeholder="Étape de préparation..."
                        />
                        <button onClick={() => {
                          const newSteps = editForm.steps.filter((_, i) => i !== idx);
                          setEditForm({...editForm, steps: newSteps});
                        }} className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors shrink-0"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button onClick={() => {
                      setEditForm({...editForm, steps: [...editForm.steps, '']});
                    }} className="w-full py-3 border-2 border-dashed border-orange-200 rounded-xl text-sm text-orange-600 font-bold flex items-center justify-center gap-2 hover:bg-orange-50 hover:border-orange-300 transition-colors"><Plus className="w-4 h-4" /> Ajouter une étape</button>
                  </div>
                ) : (
                  recipe.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-4 group">
                      <span className="font-serif font-bold text-2xl text-orange-100 group-hover:text-orange-300 transition-colors shrink-0 leading-none">{String(idx + 1).padStart(2, '0')}</span>
                      <p className="leading-relaxed text-base font-serif italic">{step}</p>
                    </li>
                  ))
                )}
              </ol>
            </div>
          </div>

          <div className="p-8 bg-orange-50/30 flex justify-center">
            <button 
              onClick={() => { onToggleMenu(recipe.id); onClose(); }}
              className={`px-8 py-4 rounded-[20px] font-bold transition-all flex items-center gap-2 shadow-2xl active:scale-95 ${isSelected ? 'bg-slate-900 text-white shadow-slate-900/20' : 'bg-orange-900 text-white hover:bg-orange-950 shadow-orange-900/30'}`}
            >
              {isSelected ? <><X className="w-4 h-4" /> Retirer du menu</> : <><Check className="w-4 h-4" /> Ajouter au menu</>}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RecipeDetailModal;
