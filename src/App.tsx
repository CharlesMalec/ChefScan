import React, { useState, useEffect, useRef } from 'react';
import { Camera, Link as LinkIcon, BookOpen, ShoppingCart, Plus, Loader2, Check, ChevronRight, Clock, ChefHat, X, Image as ImageIcon, LogOut, Mail, Lock, User, Tag, Trash2, Crown, Pencil, Save, Star, Sparkles, Search, Filter, ChevronDown, Heart, Settings } from 'lucide-react';
import { analyzeRecipeImage, analyzeRecipeUrl } from './services/gemini';
import { getIngredientEmoji } from './utils';
import { Recipe } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './contexts/AuthContext';
import { useLanguage } from './contexts/LanguageContext';
import { auth, db, googleProvider, app } from './services/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, increment, orderBy, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function App() {
  const { user, profile, isPremium } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'library' | 'scan' | 'list' | 'about'>('library');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedForMenu, setSelectedForMenu] = useState<Set<string>>(new Set());
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  
  // Auth UI State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Scanner State
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [scannedRecipe, setScannedRecipe] = useState<Recipe | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Recipe | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSaveRef = useRef(false);

  // Stripe Success/Cancel handling
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("success")) {
      alert("Paiement réussi ! Vous êtes maintenant Premium 🎉");
      // Clean up URL
      window.history.replaceState(null, '', window.location.pathname);
    }
    if (query.get("canceled")) {
      alert("Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.");
      // Clean up URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Load recipes from Firestore on user change
  useEffect(() => {
    if (user && pendingSaveRef.current) {
      pendingSaveRef.current = false;
      setShowAuthModal(false);
      saveRecipe();
    }

    if (!user) {
      setRecipes([]);
      return;
    }

    const q = query(
      collection(db, 'recipes'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Recipe[];
      setRecipes(data);
    });

    return () => unsubscribe();
  }, [user]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setShowAuthModal(false);
    } catch (e: any) {
      setAuthError(e.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setShowAuthModal(false);
    } catch (e: any) {
      setAuthError(e.message);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleStripeCheckout = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      setLoading(true);
      
      // Add a document to the checkout_sessions subcollection of the user's customer document
      const checkoutSessionRef = await addDoc(
        collection(db, 'customers', user.uid, 'checkout_sessions'),
        {
          // We need the Price ID from the Stripe Dashboard
          // The user will need to replace this with their actual Price ID
          price: 'price_1T9RstBCaCCfPENPfnrGiyDa', // TODO: Remplacer par le vrai Price ID de Stripe
          success_url: window.location.origin + '?success=true',
          cancel_url: window.location.origin + '?canceled=true',
        }
      );

      // Wait for the CheckoutSession to get attached by the extension
      onSnapshot(checkoutSessionRef, (snap) => {
        const { error, url } = snap.data() || {};
        if (error) {
          alert(`Une erreur est survenue : ${error.message}`);
          setLoading(false);
        }
        if (url) {
          // We have a Stripe Checkout URL, let's redirect.
          window.location.assign(url);
        }
      });

    } catch (err: any) {
      console.error('Erreur Stripe:', err);
      alert("Une erreur est survenue lors de la redirection vers Stripe: " + err.message);
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Par défaut, Firebase déploie les extensions sur us-central1. 
      // Si votre extension est sur une autre région (ex: europe-west1), modifiez la ligne ci-dessous :
      const functions = getFunctions(app, 'europe-west1'); // ou 'us-central1'
      const functionRef = httpsCallable(functions, 'ext-firestore-stripe-payments-createPortalLink');
      const { data } = await functionRef({ returnUrl: window.location.origin });
      
      if ((data as any)?.url) {
        window.location.assign((data as any).url);
      } else {
        throw new Error("Aucune URL retournée par Stripe");
      }
    } catch (err: any) {
      console.error('Erreur Portail:', err);
      alert("Erreur lors de la redirection vers le portail : " + err.message + "\nAssurez-vous que l'extension Stripe est bien configurée.");
      setLoading(false);
    }
  };

  const handleUpdateRecipe = async () => {
    if (!editForm || !user) return;
    try {
      const recipeRef = doc(db, 'recipes', editForm.id);
      await updateDoc(recipeRef, {
        title: editForm.title,
        tags: editForm.tags,
        prepTime: editForm.prepTime,
        cookTime: editForm.cookTime,
        complexity: editForm.complexity,
        ingredients: editForm.ingredients,
        steps: editForm.steps
      });
      setViewingRecipe(editForm);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating recipe:", error);
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
    if (!user) {
      pendingSaveRef.current = true;
      setShowAuthModal(true);
      return;
    }

    if (!isPremium && recipes.length >= 10) {
      alert("Vous avez atteint la limite de 10 recettes pour le compte gratuit. Passez à Premium pour en ajouter plus !");
      return;
    }

    if (scannedRecipe) {
      try {
        const recipeToSave = {
          ...scannedRecipe,
          userId: user.uid,
          createdAt: Date.now(),
          tags: scannedRecipe.tags || []
        };
        
        await addDoc(collection(db, 'recipes'), recipeToSave);
        
        // Update user recipe count
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          recipeCount: increment(1)
        });

        setScannedRecipe(null);
        setActiveTab('library');
      } catch (e) {
        console.error("Failed to save recipe", e);
        alert("Erreur lors de la sauvegarde de la recette.");
      }
    }
  };

  const deleteRecipe = async (id: string) => {
    if (!user) return;
    
    try {
      await deleteDoc(doc(db, 'recipes', id));
      
      // Update user recipe count
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        recipeCount: increment(-1)
      });

      const newSelected = new Set(selectedForMenu);
      newSelected.delete(id);
      setSelectedForMenu(newSelected);
      setRecipeToDelete(null);
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

  const allTags = Array.from(new Set(recipes.flatMap(r => r.tags || []))).sort();
  const filteredRecipes = recipes.filter(r => {
    const matchesTag = selectedTag ? r.tags?.includes(selectedTag) : true;
    const matchesSearch = searchQuery 
      ? r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.ingredients.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        r.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    return matchesTag && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F5F2ED] flex flex-col md:flex-row font-sans text-slate-900">
      {/* Mobile Header */}
      <header className="md:hidden bg-[#F5F2ED]/80 backdrop-blur-md px-6 py-4 shadow-sm sticky top-0 z-40 flex justify-between items-center border-b border-orange-100">
        <h1 className="text-2xl font-serif font-bold text-orange-900 flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-orange-700" />
          ChefScan
        </h1>
        <div className="flex items-center gap-2">
          {selectedForMenu.size > 0 && (
            <button onClick={() => setActiveTab('list')} className="relative p-2">
              <ShoppingCart className="w-6 h-6 text-orange-900" />
              <span className="absolute -top-1 -right-1 bg-orange-700 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {selectedForMenu.size}
              </span>
            </button>
          )}
          {user ? (
            <div className="flex items-center gap-2">
              {!isPremium ? (
                <button onClick={() => setShowPremiumModal(true)} className="px-3 py-1.5 bg-gradient-to-r from-orange-400 to-orange-600 text-white text-xs font-bold rounded-full shadow-md flex items-center gap-1">
                  <Crown className="w-3 h-3" /> {t('nav.premium')}
                </button>
              ) : (
                <button onClick={handleManageSubscription} disabled={loading} className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-full shadow-md flex items-center gap-1 disabled:opacity-70">
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crown className="w-3 h-3" />} {t('nav.manage')}
                </button>
              )}
              <button 
                onClick={() => setShowSettingsModal(true)} 
                className="p-2 text-orange-900 hover:bg-orange-50 rounded-full transition-colors"
                title={t('settings.title')}
              >
                <Settings className="w-6 h-6" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowSettingsModal(true)} 
                className="p-2 text-orange-900 hover:bg-orange-50 rounded-full transition-colors"
                title={t('settings.title')}
              >
                <Settings className="w-6 h-6" />
              </button>
              <button onClick={() => setShowAuthModal(true)} className="p-2 text-orange-900">
                <User className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </header>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-orange-50 h-screen sticky top-0 p-8">
        <h1 className="text-3xl font-serif font-bold text-orange-900 flex items-center gap-3 mb-12">
          <ChefHat className="w-8 h-8 text-orange-700" />
          ChefScan
        </h1>
        
        <nav className="flex flex-col gap-4 flex-1">
          <button 
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all font-medium ${activeTab === 'library' ? 'bg-orange-100 text-orange-900 shadow-sm' : 'text-slate-600 hover:bg-orange-50/50'}`}
          >
            <BookOpen className="w-5 h-5" /> {t('nav.recipes')}
          </button>
          <button 
            onClick={() => setActiveTab('scan')}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all font-medium ${activeTab === 'scan' ? 'bg-orange-100 text-orange-900 shadow-sm' : 'text-slate-600 hover:bg-orange-50/50'}`}
          >
            <Plus className="w-5 h-5" /> {t('nav.add')}
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={`flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all font-medium ${activeTab === 'list' ? 'bg-orange-100 text-orange-900 shadow-sm' : 'text-slate-600 hover:bg-orange-50/50'}`}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5" /> {t('nav.shopping')}
            </div>
            {selectedForMenu.size > 0 && (
              <span className="bg-orange-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {selectedForMenu.size}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all font-medium ${activeTab === 'about' ? 'bg-orange-100 text-orange-900 shadow-sm' : 'text-slate-600 hover:bg-orange-50/50'}`}
          >
            <Heart className="w-5 h-5" /> {t('nav.about')}
          </button>
        </nav>

        <div className="mt-auto pt-8 border-t border-orange-50">
          {user ? (
            <div className="flex flex-col gap-4">
              {!isPremium ? (
                <button 
                  onClick={() => setShowPremiumModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 to-orange-600 text-white px-4 py-3 rounded-2xl font-bold shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 transition-all hover:-translate-y-0.5"
                >
                  <Star className="w-4 h-4 fill-current" /> {t('nav.premium')}
                </button>
              ) : (
                <button 
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-all hover:-translate-y-0.5 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />} {t('nav.manage')}
                </button>
              )}
              <div className="flex items-center gap-3 px-2">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-orange-100" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold">
                    {user.email?.[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{user.displayName || user.email?.split('@')[0]}</p>
                  <div className="flex items-center gap-1">
                    {isPremium ? (
                      <span className="text-[10px] bg-orange-700 text-white px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5" /> PREMIUM
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">
                        {recipes.length}/10 RECETTES
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowSettingsModal(true)} 
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-all text-sm font-medium"
              >
                <Settings className="w-4 h-4" /> {t('settings.title')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setShowSettingsModal(true)} 
                className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-orange-100 text-orange-900 font-bold hover:bg-orange-200 transition-all"
              >
                <Settings className="w-5 h-5" /> {t('settings.title')}
              </button>
              <button 
                onClick={() => setShowAuthModal(true)}
                className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-orange-700 text-white font-bold shadow-lg shadow-orange-700/20 hover:bg-orange-800 transition-all"
              >
                <User className="w-5 h-5" /> {t('settings.login')}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* LIBRARY TAB */}
          {activeTab === 'library' && (
            <motion.div key="library" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8">
                <h2 className="text-2xl font-semibold text-slate-800 shrink-0">{t('library.title')} ({filteredRecipes.length})</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder={t('library.search')} 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                  
                  {allTags.length > 0 && (
                    <div className="relative shrink-0">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        list="tag-options"
                        value={selectedTag || ''}
                        onChange={(e) => setSelectedTag(e.target.value || null)}
                        placeholder="Filtrer par tag..."
                        className="w-full sm:w-48 pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-700 font-medium"
                      />
                      <datalist id="tag-options">
                        {allTags.map(tag => (
                          <option key={tag} value={tag} />
                        ))}
                      </datalist>
                      {selectedTag && (
                        <button 
                          onClick={() => setSelectedTag(null)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}

                  {selectedForMenu.size > 0 && (
                    <button 
                      onClick={() => setActiveTab('list')}
                      className="text-sm bg-orange-100 text-orange-700 px-4 py-2 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-orange-200 transition-colors shrink-0"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span className="hidden sm:inline">Liste de courses</span> ({selectedForMenu.size})
                    </button>
                  )}
                </div>
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
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 max-w-lg mx-auto lg:max-w-none">
                  {filteredRecipes.map(recipe => (
                    <div 
                      key={recipe.id} 
                      onClick={() => setViewingRecipe(recipe)}
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
                            onClick={(e) => { e.stopPropagation(); setRecipeToDelete(recipe.id); }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all md:opacity-0 md:group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleMenuSelection(recipe.id); }}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selectedForMenu.has(recipe.id) ? 'bg-orange-800 border-orange-800 text-white scale-110 shadow-lg shadow-orange-800/20' : 'border-orange-100 text-transparent hover:border-orange-300'}`}
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
                    
                    {scannedRecipe.tags && scannedRecipe.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {scannedRecipe.tags.map(tag => (
                          <span key={tag} className="bg-white/50 text-orange-800 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5" /> {tag}
                          </span>
                        ))}
                      </div>
                    )}

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
                            <span className="text-slate-700 flex items-center gap-2">
                              <span>{getIngredientEmoji(ing.name)}</span>
                              {ing.name}
                            </span>
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
                  <div className="mb-6 pb-6 border-b border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-slate-600 font-medium">Basée sur <span className="text-orange-600 font-bold">{selectedForMenu.size}</span> recette(s) sélectionnée(s).</p>
                      <button 
                        onClick={() => setSelectedForMenu(new Set())}
                        className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"
                      >
                        Tout décocher
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recipes.filter(r => selectedForMenu.has(r.id)).map(recipe => (
                        <div key={recipe.id} className="flex items-center gap-2 bg-orange-50 text-orange-900 px-3 py-1.5 rounded-xl text-sm font-medium border border-orange-100">
                          {recipe.title}
                          <button 
                            onClick={() => toggleMenuSelection(recipe.id)}
                            className="text-orange-400 hover:text-orange-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                    {Object.entries(generateShoppingList()).map(([ingredient, items], idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 hover:bg-orange-50/50 rounded-2xl transition-all group border border-transparent hover:border-orange-100">
                        <input type="checkbox" className="w-5 h-5 rounded border-orange-200 text-orange-800 focus:ring-orange-800 mt-0.5 cursor-pointer" />
                        <div className="flex-1">
                          <p className="font-serif font-bold text-lg text-slate-800 capitalize leading-tight">
                            <span className="mr-2">{getIngredientEmoji(ingredient)}</span>
                            {ingredient}
                          </p>
                          {items.some(item => item.total > 0) && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {items.filter(item => item.total > 0).map((item, i) => (
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
            </motion.div>
          )}

          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <motion.div key="about" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-3xl mx-auto">
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-orange-50">
                <div className="h-64 sm:h-80 relative">
                  <img 
                    src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=2000&auto=format&fit=crop" 
                    alt="Plat traditionnel, pot-au-feu" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-8">
                    <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">{t('about.title')}</h2>
                  </div>
                </div>
                
                <div className="p-8 sm:p-12 space-y-6 text-lg text-slate-700 leading-relaxed font-serif">
                  <p>
                    <span className="text-4xl font-bold text-orange-800 float-left mr-2 mt-1 leading-none">{t('about.letter')}</span>
                    {t('about.p1')}
                  </p>
                  
                  <p>
                    {t('about.p2')}
                  </p>

                  <p>
                    {t('about.p3')}
                  </p>

                  <div className="my-10 border-l-4 border-orange-300 pl-6 italic text-xl text-slate-600">
                    {t('about.quote')}
                  </div>

                  <p>
                    {t('about.p4')}
                  </p>

                  <div className="pt-8 mt-8 border-t border-orange-100 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-800 font-bold text-2xl font-sans">
                      C
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 font-sans">Charles</p>
                      <p className="text-sm text-slate-500 font-sans">{t('about.role')}</p>
                    </div>
                  </div>
                </div>
              </div>
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
            <span className="text-[10px] font-bold uppercase tracking-widest">{t('nav.recipes')}</span>
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
            <span className="text-[10px] font-bold uppercase tracking-widest">{t('nav.shopping')}</span>
            {selectedForMenu.size > 0 && (
              <span className="absolute top-1 right-4 w-5 h-5 bg-orange-800 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md">
                {selectedForMenu.size}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('about')}
            className={`flex flex-col items-center p-2 w-20 transition-all ${activeTab === 'about' ? 'text-orange-900 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Heart className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{t('nav.about')}</span>
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
                <div className="absolute top-8 right-8 flex items-center gap-3">
                  {!isEditing ? (
                    <button 
                      onClick={() => {
                        if (!isPremium) {
                          setShowPremiumModal(true);
                          return;
                        }
                        setEditForm(viewingRecipe);
                        setIsEditing(true);
                      }}
                      className="text-slate-400 hover:text-orange-900 bg-white rounded-full p-3 shadow-sm transition-all hover:scale-110 active:scale-90 relative"
                    >
                      {!isPremium && <Crown className="w-3 h-3 absolute -top-1 -right-1 text-orange-500" />}
                      <Pencil className="w-5 h-5" />
                    </button>
                  ) : (
                    <button 
                      onClick={handleUpdateRecipe}
                      className="text-white bg-orange-700 hover:bg-orange-800 rounded-full p-3 shadow-sm transition-all hover:scale-110 active:scale-90"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setViewingRecipe(null);
                      setIsEditing(false);
                    }} 
                    className="text-slate-400 hover:text-orange-900 bg-white rounded-full p-3 shadow-sm transition-all hover:rotate-90 active:scale-90"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-orange-900 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{viewingRecipe.source}</span>
                  {viewingRecipe.sourceUrl && !isEditing && (
                    <a href={viewingRecipe.sourceUrl} target="_blank" rel="noreferrer" className="text-orange-600 hover:text-orange-800 transition-colors">
                      <LinkIcon className="w-4 h-4" />
                    </a>
                  )}
                </div>
                
                {isEditing && editForm ? (
                  <input 
                    type="text" 
                    value={editForm.title}
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                    className="w-full text-4xl md:text-5xl font-serif font-bold leading-tight text-slate-900 mb-6 bg-white/50 border border-orange-200 rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                ) : (
                  <h2 className="text-4xl md:text-5xl font-serif font-bold leading-tight text-slate-900 mb-6">{viewingRecipe.title}</h2>
                )}
                
                {isEditing && editForm ? (
                  <div className="mb-8">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Tags (séparés par des virgules)</label>
                    <input 
                      type="text" 
                      value={(editForm.tags || []).join(', ')}
                      onChange={e => setEditForm({...editForm, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})}
                      className="w-full bg-white/50 border border-orange-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Végétarien, Rapide, Dessert..."
                    />
                  </div>
                ) : (
                  viewingRecipe.tags && viewingRecipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {viewingRecipe.tags.map(tag => (
                        <span key={tag} className="bg-white/60 backdrop-blur-sm border border-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                          <Tag className="w-3 h-3" /> {tag}
                        </span>
                      ))}
                    </div>
                  )
                )}

                <div className="flex flex-wrap gap-8 text-sm font-bold text-orange-900/60 uppercase tracking-widest">
                  {isEditing && editForm ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-500" />
                        <input type="text" value={editForm.prepTime || ''} onChange={e => setEditForm({...editForm, prepTime: e.target.value})} placeholder="Préparation" className="bg-white/50 border border-orange-200 rounded-lg px-2 py-1 w-24 focus:outline-none" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-500" />
                        <input type="text" value={editForm.cookTime || ''} onChange={e => setEditForm({...editForm, cookTime: e.target.value})} placeholder="Cuisson" className="bg-white/50 border border-orange-200 rounded-lg px-2 py-1 w-24 focus:outline-none" />
                      </div>
                      <div className="flex items-center gap-2">
                        <ChefHat className="w-5 h-5 text-orange-500" />
                        <input type="text" value={editForm.complexity || ''} onChange={e => setEditForm({...editForm, complexity: e.target.value})} placeholder="Difficulté" className="bg-white/50 border border-orange-200 rounded-lg px-2 py-1 w-24 focus:outline-none" />
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="flex items-center gap-2"><Clock className="w-5 h-5 text-orange-500" /> Préparation: {viewingRecipe.prepTime || '-'}</span>
                      <span className="flex items-center gap-2"><Clock className="w-5 h-5 text-orange-500" /> Cuisson: {viewingRecipe.cookTime || '-'}</span>
                      <span className="flex items-center gap-2"><ChefHat className="w-5 h-5 text-orange-500" /> Difficulté: {viewingRecipe.complexity || '-'}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className={`p-8 md:p-12 ${isEditing ? 'flex flex-col gap-12' : 'grid md:grid-cols-5 gap-12'}`}>
                <div className={isEditing ? '' : 'md:col-span-2'}>
                  <h3 className="font-serif font-bold text-2xl mb-8 flex items-center gap-3 text-slate-800 border-b border-orange-100 pb-4 italic">
                    <ShoppingCart className="w-6 h-6 text-orange-400" /> Ingrédients
                  </h3>
                  <ul className="space-y-5">
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
                        }} className="h-full min-h-[48px] border-2 border-dashed border-orange-200 rounded-xl text-sm text-orange-600 font-bold flex items-center justify-center gap-2 hover:bg-orange-50 hover:border-orange-300 transition-colors"><Plus className="w-4 h-4" /> Ajouter un ingrédient</button>
                      </div>
                    ) : (
                      viewingRecipe.ingredients.map((ing, idx) => (
                        <li key={idx} className="flex justify-between items-center group">
                          <span className="text-slate-700 font-serif italic text-lg capitalize flex items-center gap-2">
                            <span>{getIngredientEmoji(ing.name)}</span>
                            {ing.name}
                          </span>
                          {((ing.amount && ing.amount !== '0') || ing.unit) && (
                            <div className="flex items-center gap-3">
                              <span className="h-px w-6 bg-orange-100 group-hover:w-10 transition-all"></span>
                              <span className="font-bold text-orange-900 bg-orange-100/30 px-3 py-1 rounded-xl text-sm">{ing.amount} {ing.unit}</span>
                            </div>
                          )}
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <div className={isEditing ? '' : 'md:col-span-3'}>
                  <h3 className="font-serif font-bold text-2xl mb-8 flex items-center gap-3 text-slate-800 border-b border-orange-100 pb-4 italic">
                    <ChefHat className="w-6 h-6 text-orange-400" /> Préparation
                  </h3>
                  <ol className="space-y-8 text-slate-700">
                    {isEditing && editForm ? (
                      <div className="space-y-4">
                        {editForm.steps.map((step, idx) => (
                          <div key={idx} className="flex gap-4 items-start bg-white p-4 rounded-2xl border border-orange-200 shadow-sm focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-400 transition-all">
                            <span className="font-serif font-bold text-2xl text-orange-300 shrink-0">{idx + 1}.</span>
                            <textarea 
                              value={step} 
                              onChange={e => {
                                const newSteps = [...editForm.steps];
                                newSteps[idx] = e.target.value;
                                setEditForm({...editForm, steps: newSteps});
                              }} 
                              className="flex-1 bg-transparent text-sm focus:outline-none min-h-[80px] resize-y text-slate-700 leading-relaxed" 
                              placeholder="Étape de préparation..."
                            />
                            <button onClick={() => {
                              const newSteps = editForm.steps.filter((_, i) => i !== idx);
                              setEditForm({...editForm, steps: newSteps});
                            }} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors shrink-0"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        ))}
                        <button onClick={() => {
                          setEditForm({...editForm, steps: [...editForm.steps, '']});
                        }} className="w-full py-4 border-2 border-dashed border-orange-200 rounded-2xl text-sm text-orange-600 font-bold flex items-center justify-center gap-2 hover:bg-orange-50 hover:border-orange-300 transition-colors"><Plus className="w-5 h-5" /> Ajouter une étape</button>
                      </div>
                    ) : (
                      viewingRecipe.steps.map((step, idx) => (
                        <li key={idx} className="flex gap-6 group">
                          <span className="font-serif font-bold text-4xl text-orange-100 group-hover:text-orange-300 transition-colors shrink-0 leading-none">{String(idx + 1).padStart(2, '0')}</span>
                          <p className="leading-relaxed text-lg font-serif italic">{step}</p>
                        </li>
                      ))
                    )}
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

      {/* AUTH MODAL */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-serif font-bold text-slate-900">
                    {authMode === 'login' ? 'Connexion' : 'Inscription'}
                  </h2>
                  <button onClick={() => setShowAuthModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <button 
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-700 hover:bg-slate-50 transition-all mb-6"
                >
                  <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black">G</div> Continuer avec Google
                </button>

                <div className="relative flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-slate-100"></div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ou</span>
                  <div className="flex-1 h-px bg-slate-100"></div>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-orange-200 focus:bg-white transition-all outline-none"
                        placeholder="votre@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-orange-200 focus:bg-white transition-all outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {authError && (
                    <p className="text-sm text-red-500 font-medium px-1">{authError}</p>
                  )}

                  <button 
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-orange-700 text-white font-bold shadow-lg shadow-orange-700/20 hover:bg-orange-800 transition-all"
                  >
                    {authMode === 'login' ? 'Se connecter' : "S'inscrire"}
                  </button>
                </form>

                <p className="text-center mt-8 text-sm text-slate-500">
                  {authMode === 'login' ? "Pas encore de compte ?" : "Déjà un compte ?"}
                  <button 
                    onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                    className="ml-2 text-orange-700 font-bold hover:underline"
                  >
                    {authMode === 'login' ? "S'inscrire" : "Se connecter"}
                  </button>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-orange-600" />
                  {t('settings.title')}
                </h2>
                <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-8">
                {/* Language Section */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-4 h-px bg-slate-200"></span>
                    {t('settings.language')}
                    <span className="flex-1 h-px bg-slate-200"></span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setLanguage('fr')}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${language === 'fr' ? 'border-orange-500 bg-orange-50 text-orange-900 font-bold shadow-sm' : 'border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50'}`}
                    >
                      <span className="text-xl">🇫🇷</span> Français
                    </button>
                    <button 
                      onClick={() => setLanguage('en')}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${language === 'en' ? 'border-orange-500 bg-orange-50 text-orange-900 font-bold shadow-sm' : 'border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50'}`}
                    >
                      <span className="text-xl">🇬🇧</span> English
                    </button>
                  </div>
                </div>
                
                {/* Account Section */}
                {user && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="w-4 h-px bg-slate-200"></span>
                      {t('settings.account')}
                      <span className="flex-1 h-px bg-slate-200"></span>
                    </h3>
                    <button 
                      onClick={() => {
                        handleLogout();
                        setShowSettingsModal(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all border border-red-100"
                    >
                      <LogOut className="w-5 h-5" /> {t('settings.logout')}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PREMIUM MODAL */}
      <AnimatePresence>
        {showPremiumModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowPremiumModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative max-h-[95vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowPremiumModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-6 sm:p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 backdrop-blur-md shadow-inner border border-white/30">
                  <Star className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-current" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2 relative z-10">ChefScan Premium</h2>
                <p className="text-orange-100 font-medium relative z-10 text-sm sm:text-base">Libérez tout le potentiel de votre cuisine</p>
              </div>

              <div className="p-6 sm:p-8">
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Recettes illimitées</p>
                      <p className="text-sm text-slate-500">Sauvegardez autant de recettes que vous le souhaitez (limité à 10 en gratuit).</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Modification avancée</p>
                      <p className="text-sm text-slate-500">Modifiez les ingrédients, les étapes et les tags de vos recettes scannées.</p>
                    </div>
                  </li>
                </ul>

                <button 
                  onClick={handleStripeCheckout}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  {loading ? 'Redirection...' : "S'abonner pour 4.99€/mois"}
                </button>
                <p className="text-center text-xs text-slate-400 mt-4">Sans engagement, annulez à tout moment.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {recipeToDelete && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setRecipeToDelete(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[32px] p-8 text-center shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-slate-800 mb-2">Supprimer la recette ?</h3>
              <p className="text-slate-500 mb-8">Cette action est définitive et ne peut pas être annulée.</p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setRecipeToDelete(null)}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => deleteRecipe(recipeToDelete)}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

