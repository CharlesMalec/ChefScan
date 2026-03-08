import React, { useState, useEffect, useRef } from 'react';
import { Camera, Link as LinkIcon, BookOpen, ShoppingCart, Plus, Loader2, Check, ChevronRight, Clock, ChefHat, X, Image as ImageIcon } from 'lucide-react';
import { analyzeRecipeImage, analyzeRecipeUrl } from './services/gemini';
import { Recipe } from './types';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'library' | 'scan' | 'list'>('library');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedForMenu, setSelectedForMenu] = useState<Set<string>>(new Set());
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  
  // Scanner State
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [scannedRecipe, setScannedRecipe] = useState<Recipe | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load recipes from API on mount
  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const res = await fetch('/api/recipes');
      if (res.ok) {
        const data = await res.json();
        setRecipes(data);
      }
    } catch (e) {
      console.error("Failed to fetch recipes", e);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl.split(',')[1]);
        };
        img.onerror = (e) => reject(e);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const base64String = await compressImage(file);
      const recipeData = await analyzeRecipeImage(base64String, 'image/jpeg');
      setScannedRecipe({ ...recipeData, id: crypto.randomUUID(), source: 'Livre' });
    } catch (error: any) {
      console.error(error);
      alert(`Erreur lors de l'analyse de l'image : ${error.message || "Erreur inconnue"}. Assurez-vous que la connexion internet est bonne et réessayez.`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput) return;
    setLoading(true);
    try {
      const recipeData = await analyzeRecipeUrl(urlInput);
      setScannedRecipe({ ...recipeData, id: crypto.randomUUID(), source: 'Web', sourceUrl: urlInput });
      setUrlInput('');
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'analyse de l'URL.");
    } finally {
      setLoading(false);
    }
  };

  const saveRecipe = async () => {
    if (scannedRecipe) {
      try {
        const res = await fetch('/api/recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scannedRecipe)
        });
        if (res.ok) {
          await fetchRecipes();
          setScannedRecipe(null);
          setActiveTab('library');
        }
      } catch (e) {
        console.error("Failed to save recipe", e);
        alert("Erreur lors de la sauvegarde de la recette.");
      }
    }
  };

  const deleteRecipe = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Supprimer cette recette ?")) return;
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchRecipes();
        const newSelected = new Set(selectedForMenu);
        newSelected.delete(id);
        setSelectedForMenu(newSelected);
      }
    } catch (e) {
      console.error("Failed to delete recipe", e);
    }
  };

  const toggleMenuSelection = (id: string) => {
    const newSet = new Set(selectedForMenu);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedForMenu(newSet);
  };

  const generateShoppingList = () => {
    const list: Record<string, { total: number; unit: string; sources: string[] }[]> = {};
    
    recipes.filter(r => selectedForMenu.has(r.id)).forEach(r => {
      r.ingredients.forEach(i => {
        if (!i || !i.name) return;
        const name = i.name.toLowerCase().trim();
        const amountStr = String(i.amount || '0');
        const amount = parseFloat(amountStr.replace(',', '.')) || 0;
        const unit = (i.unit || '').toLowerCase().trim();
        
        if (!list[name]) list[name] = [];
        
        // Try to find if we already have this unit for this ingredient
        const existing = list[name].find(item => item.unit === unit);
        if (existing) {
          existing.total += amount;
          if (!existing.sources.includes(r.title)) {
            existing.sources.push(r.title);
          }
        } else {
          list[name].push({
            total: amount,
            unit: unit,
            sources: [r.title]
          });
        }
      });
    });
    return list;
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] flex flex-col md:flex-row font-sans text-slate-900">
      {/* Mobile Header */}
      <header className="md:hidden bg-[#F5F2ED]/80 backdrop-blur-md px-6 py-4 shadow-sm sticky top-0 z-40 flex justify-between items-center border-b border-orange-100">
        <h1 className="text-2xl font-serif font-bold text-orange-900 flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-orange-700" />
          ChefScan
        </h1>
        {selectedForMenu.size > 0 && (
          <button onClick={() => setActiveTab('list')} className="relative p-2">
            <ShoppingCart className="w-6 h-6 text-orange-900" />
            <span className="absolute -top-1 -right-1 bg-orange-700 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {selectedForMenu.size}
            </span>
          </button>
        )}
      </header>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-orange-50 h-screen sticky top-0 p-8">
        <h1 className="text-3xl font-serif font-bold text-orange-900 flex items-center gap-3 mb-12">
          <ChefHat className="w-8 h-8 text-orange-700" />
          ChefScan
        </h1>
        
        <nav className="flex flex-col gap-4">
          <button 
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all font-medium ${activeTab === 'library' ? 'bg-orange-100 text-orange-900 shadow-sm' : 'text-slate-600 hover:bg-orange-50/50'}`}
          >
            <BookOpen className="w-5 h-5" /> Mes Recettes
          </button>
          <button 
            onClick={() => setActiveTab('scan')}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all font-medium ${activeTab === 'scan' ? 'bg-orange-100 text-orange-900 shadow-sm' : 'text-slate-600 hover:bg-orange-50/50'}`}
          >
            <Plus className="w-5 h-5" /> Ajouter
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={`flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all font-medium ${activeTab === 'list' ? 'bg-orange-100 text-orange-900 shadow-sm' : 'text-slate-600 hover:bg-orange-50/50'}`}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5" /> Courses
            </div>
            {selectedForMenu.size > 0 && (
              <span className="bg-orange-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {selectedForMenu.size}
              </span>
            )}
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* LIBRARY TAB */}
          {activeTab === 'library' && (
            <motion.div key="library" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-semibold text-slate-800">Mes Recettes ({recipes.length})</h2>
                {selectedForMenu.size > 0 && (
                  <button 
                    onClick={() => setActiveTab('list')}
                    className="text-sm bg-orange-100 text-orange-700 px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-orange-200 transition-colors"
                  >
                    Voir la liste de courses ({selectedForMenu.size})
                  </button>
                )}
              </div>

              {recipes.length === 0 ? (
                <div className="text-center py-20 px-4 max-w-md mx-auto">
                  <div className="w-24 h-24 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <BookOpen className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-slate-800 mb-4">Votre bibliothèque est vide</h3>
                  <p className="text-slate-500 mb-10 leading-relaxed">Commencez par scanner un livre de cuisine ou importer un lien depuis un site web pour créer votre collection.</p>
                  <button 
                    onClick={() => setActiveTab('scan')}
                    className="bg-orange-800 hover:bg-orange-900 transition-all text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-orange-900/20 active:scale-95"
                  >
                    Ajouter ma première recette
                  </button>
                </div>
              ) : (
                <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {recipes.map(recipe => (
                    <div 
                      key={recipe.id} 
                      onClick={() => setViewingRecipe(recipe)}
                      className="bg-white p-6 rounded-[32px] shadow-sm border border-orange-50 flex flex-col gap-5 hover:shadow-xl hover:shadow-orange-900/5 transition-all group relative cursor-pointer active:scale-[0.98]"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="font-serif font-bold text-2xl leading-tight text-slate-900 group-hover:text-orange-900 transition-colors">{recipe.title}</h3>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => deleteRecipe(recipe.id, e)}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleMenuSelection(recipe.id); }}
                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selectedForMenu.has(recipe.id) ? 'bg-orange-800 border-orange-800 text-white scale-110 shadow-lg shadow-orange-800/20' : 'border-orange-100 text-transparent hover:border-orange-300'}`}
                          >
                            <Check className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 font-medium mt-auto pt-5 border-t border-orange-50">
                        <span className="flex items-center gap-2 bg-orange-50/50 px-3 py-1.5 rounded-xl"><Clock className="w-4 h-4 text-orange-400" /> {recipe.prepTime || '-'}</span>
                        <span className="flex items-center gap-2 bg-orange-50/50 px-3 py-1.5 rounded-xl"><ChefHat className="w-4 h-4 text-orange-400" /> {recipe.complexity || '-'}</span>
                        <span className="bg-orange-100 text-orange-900 px-3 py-1.5 rounded-xl ml-auto">{recipe.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* SCANNER TAB */}
          {activeTab === 'scan' && (
            <motion.div key="scan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto">
              {!scannedRecipe ? (
                <div className="space-y-12">
                  <div className="text-center max-w-xl mx-auto mb-12">
                    <h2 className="text-4xl font-serif font-bold text-slate-900 mb-4">Ajouter une recette</h2>
                    <p className="text-slate-500 text-lg">Choisissez votre méthode préférée pour importer une nouvelle recette dans votre bibliothèque.</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Camera / Photo Upload */}
                    <div className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-100 text-center flex flex-col items-center justify-center hover:border-orange-200 transition-all hover:shadow-xl hover:shadow-orange-500/5 group">
                      <div className="w-24 h-24 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                        <Camera className="w-12 h-12" />
                      </div>
                      <h3 className="font-serif font-bold text-2xl mb-3 text-slate-900">Scanner un livre</h3>
                      <p className="text-slate-500 mb-10 leading-relaxed">Prenez en photo la page de votre livre de cuisine préféré.</p>
                      
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                      />
                      <button 
                        type="button"
                        disabled={loading}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-orange-600 hover:bg-orange-700 transition-all text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-600/20 flex items-center justify-center gap-3 disabled:opacity-70 active:scale-[0.98]"
                      >
                        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyse...</> : <><ImageIcon className="w-5 h-5" /> Prendre une photo</>}
                      </button>
                    </div>
 
                    {/* URL Import */}
                    <div className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center justify-center hover:border-blue-200 transition-all hover:shadow-xl hover:shadow-blue-500/5 group">
                      <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                        <LinkIcon className="w-12 h-12" />
                      </div>
                      <h3 className="font-serif font-bold text-2xl mb-3 text-slate-900">Importer du web</h3>
                      <p className="text-slate-500 mb-10 leading-relaxed">Collez le lien d'un blog ou d'un site de cuisine.</p>
 
                      <form 
                        onSubmit={(e) => { e.preventDefault(); handleUrlSubmit(); }}
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
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ChevronRight className="w-5 h-5" /> Importer le lien</>}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ) : (
                /* Scanned Recipe Preview */
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="bg-orange-50 p-8 relative">
                    <button onClick={() => setScannedRecipe(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-white/50 rounded-full p-2">
                      <X className="w-6 h-6" />
                    </button>
                    <span className="text-xs font-bold tracking-wider text-orange-600 uppercase mb-3 block">Aperçu de l'extraction IA</span>
                    <h2 className="text-3xl font-serif font-bold leading-tight text-slate-900">{scannedRecipe.title}</h2>
                    <div className="flex flex-wrap gap-6 mt-6 text-sm font-medium text-slate-700">
                      <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" /> Préparation: {scannedRecipe.prepTime || '?'}</span>
                      <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" /> Cuisson: {scannedRecipe.cookTime || '?'}</span>
                      <span className="flex items-center gap-2"><ChefHat className="w-4 h-4 text-orange-500" /> Difficulté: {scannedRecipe.complexity || '?'}</span>
                    </div>
                  </div>
                  
                  <div className="p-8 grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-slate-800">
                        <ShoppingCart className="w-5 h-5 text-slate-400" /> Ingrédients
                      </h3>
                      <ul className="space-y-3">
                        {scannedRecipe.ingredients.map((ing, idx) => (
                          <li key={idx} className="text-sm flex justify-between border-b border-slate-100 pb-2">
                            <span className="text-slate-700">{ing.name}</span>
                            <span className="font-semibold text-slate-900">{ing.amount} {ing.unit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="md:col-span-2">
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-slate-800">
                        <ChefHat className="w-5 h-5 text-slate-400" /> Préparation
                      </h3>
                      <ol className="space-y-4 text-slate-700">
                        {scannedRecipe.steps.map((step, idx) => (
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
                      onClick={saveRecipe}
                      className="bg-slate-900 hover:bg-slate-800 transition-colors text-white px-8 py-3.5 rounded-xl font-medium flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" /> Ajouter à ma bibliothèque
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* SHOPPING LIST TAB */}
          {activeTab === 'list' && (
            <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3 text-slate-800">
                <ShoppingCart className="w-7 h-7 text-orange-600" />
                Liste de courses
              </h2>

              {selectedForMenu.size === 0 ? (
                <div className="text-center py-20 px-4 bg-white rounded-3xl border border-slate-100">
                  <p className="text-slate-500 mb-6 text-lg">Sélectionnez des recettes dans votre bibliothèque pour générer votre liste de courses.</p>
                  <button 
                    onClick={() => setActiveTab('library')}
                    className="text-orange-600 font-medium hover:text-orange-700 flex items-center gap-2 mx-auto"
                  >
                    <BookOpen className="w-5 h-5" /> Voir mes recettes
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
                  <div className="mb-6 pb-6 border-b border-slate-100 flex justify-between items-center">
                    <p className="text-slate-600 font-medium">Basée sur <span className="text-orange-600 font-bold">{selectedForMenu.size}</span> recette(s) sélectionnée(s).</p>
                    <button 
                      onClick={() => setSelectedForMenu(new Set())}
                      className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      Tout décocher
                    </button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                    {Object.entries(generateShoppingList()).map(([ingredient, items], idx) => (
                      <div key={idx} className="flex items-start gap-5 p-5 hover:bg-orange-50/50 rounded-3xl transition-all group border border-transparent hover:border-orange-100">
                        <input type="checkbox" className="w-6 h-6 rounded-lg border-orange-200 text-orange-800 focus:ring-orange-800 mt-1 cursor-pointer" />
                        <div className="flex-1">
                          <p className="font-serif font-bold text-xl text-slate-800 capitalize">{ingredient}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {items.map((item, i) => (
                              <div key={i} className="text-sm bg-white border border-orange-100 px-3 py-1 rounded-full text-slate-600 shadow-sm flex items-center gap-2">
                                <span className="font-bold text-orange-800">{item.total} {item.unit}</span>
                                <span className="text-[10px] opacity-50 uppercase tracking-tighter">({item.sources.join(', ')})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-orange-100 pb-safe z-50">
        <div className="flex justify-around items-center p-3">
          <button 
            onClick={() => setActiveTab('library')}
            className={`flex flex-col items-center p-2 w-20 transition-all ${activeTab === 'library' ? 'text-orange-900 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <BookOpen className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Recettes</span>
          </button>
          
          <div className="relative -top-6">
            <button 
              onClick={() => setActiveTab('scan')}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 ${activeTab === 'scan' ? 'bg-orange-900 text-white rotate-45' : 'bg-orange-800 text-white'}`}
            >
              <Plus className="w-8 h-8" />
            </button>
          </div>

          <button 
            onClick={() => setActiveTab('list')}
            className={`flex flex-col items-center p-2 w-20 transition-all relative ${activeTab === 'list' ? 'text-orange-900 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <ShoppingCart className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Courses</span>
            {selectedForMenu.size > 0 && (
              <span className="absolute top-1 right-4 w-5 h-5 bg-orange-800 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md">
                {selectedForMenu.size}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* RECIPE DETAIL MODAL */}
      <AnimatePresence>
        {viewingRecipe && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-orange-900/40 backdrop-blur-sm"
            onClick={() => setViewingRecipe(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#FDFCFB] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[40px] shadow-2xl border border-orange-100/50"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-orange-50/50 p-8 md:p-12 relative">
                <button 
                  onClick={() => setViewingRecipe(null)} 
                  className="absolute top-8 right-8 text-slate-400 hover:text-orange-900 bg-white rounded-full p-3 shadow-sm transition-all hover:rotate-90 active:scale-90"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-orange-900 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{viewingRecipe.source}</span>
                  {viewingRecipe.sourceUrl && (
                    <a href={viewingRecipe.sourceUrl} target="_blank" rel="noreferrer" className="text-orange-600 hover:text-orange-800 transition-colors">
                      <LinkIcon className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <h2 className="text-4xl md:text-5xl font-serif font-bold leading-tight text-slate-900 mb-8">{viewingRecipe.title}</h2>
                <div className="flex flex-wrap gap-8 text-sm font-bold text-orange-900/60 uppercase tracking-widest">
                  <span className="flex items-center gap-2"><Clock className="w-5 h-5 text-orange-500" /> Préparation: {viewingRecipe.prepTime || '-'}</span>
                  <span className="flex items-center gap-2"><Clock className="w-5 h-5 text-orange-500" /> Cuisson: {viewingRecipe.cookTime || '-'}</span>
                  <span className="flex items-center gap-2"><ChefHat className="w-5 h-5 text-orange-500" /> Difficulté: {viewingRecipe.complexity || '-'}</span>
                </div>
              </div>
              
              <div className="p-8 md:p-12 grid md:grid-cols-5 gap-12">
                <div className="md:col-span-2">
                  <h3 className="font-serif font-bold text-2xl mb-8 flex items-center gap-3 text-slate-800 border-b border-orange-100 pb-4 italic">
                    <ShoppingCart className="w-6 h-6 text-orange-400" /> Ingrédients
                  </h3>
                  <ul className="space-y-5">
                    {viewingRecipe.ingredients.map((ing, idx) => (
                      <li key={idx} className="flex justify-between items-center group">
                        <span className="text-slate-700 font-serif italic text-lg capitalize">{ing.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="h-px w-6 bg-orange-100 group-hover:w-10 transition-all"></span>
                          <span className="font-bold text-orange-900 bg-orange-100/30 px-3 py-1 rounded-xl text-sm">{ing.amount} {ing.unit}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="md:col-span-3">
                  <h3 className="font-serif font-bold text-2xl mb-8 flex items-center gap-3 text-slate-800 border-b border-orange-100 pb-4 italic">
                    <ChefHat className="w-6 h-6 text-orange-400" /> Préparation
                  </h3>
                  <ol className="space-y-8 text-slate-700">
                    {viewingRecipe.steps.map((step, idx) => (
                      <li key={idx} className="flex gap-6 group">
                        <span className="font-serif font-bold text-4xl text-orange-100 group-hover:text-orange-300 transition-colors shrink-0 leading-none">{String(idx + 1).padStart(2, '0')}</span>
                        <p className="leading-relaxed text-lg font-serif italic">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="p-10 bg-orange-50/30 flex justify-center">
                <button 
                  onClick={() => { toggleMenuSelection(viewingRecipe.id); setViewingRecipe(null); }}
                  className={`px-12 py-5 rounded-[24px] font-bold transition-all flex items-center gap-3 shadow-2xl active:scale-95 ${selectedForMenu.has(viewingRecipe.id) ? 'bg-slate-900 text-white shadow-slate-900/20' : 'bg-orange-900 text-white hover:bg-orange-950 shadow-orange-900/30'}`}
                >
                  {selectedForMenu.has(viewingRecipe.id) ? <><X className="w-5 h-5" /> Retirer du menu</> : <><Check className="w-5 h-5" /> Ajouter au menu</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

