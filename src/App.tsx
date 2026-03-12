import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, ShoppingCart, Plus, Loader2, User, Search, Filter, Heart, Settings, Crown, Star, ChefHat, X } from 'lucide-react';
import { analyzeRecipeImage, analyzeRecipeUrl } from './services/gemini';
import { Recipe } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './contexts/AuthContext';
import { useLanguage } from './contexts/LanguageContext';
import { auth, db, googleProvider, app } from './services/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, orderBy, increment } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Components
import AuthModal from './components/modals/AuthModal';
import SettingsModal from './components/modals/SettingsModal';
import PremiumModal from './components/modals/PremiumModal';
import DeleteConfirmModal from './components/modals/DeleteConfirmModal';
import RecipeDetailModal from './components/modals/RecipeDetailModal';
import LegalModal from './components/modals/LegalModal';
import AboutModal from './components/modals/AboutModal';
import RecipeCard from './components/RecipeCard';
import ScanOptions from './components/scan/ScanOptions';
import ScanResultPreview from './components/scan/ScanResultPreview';
import ShoppingList from './components/ShoppingList';

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
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);
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
    }, (error) => {
      console.error('Firestore Error (Recipes):', error);
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
          // We use the Price ID from environment variables for production
          price: import.meta.env.VITE_STRIPE_PRICE_ID || 'price_1T9qdtBexB8ULnAkJbhKKYoB', 
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
      }, (error) => {
        console.error('Firestore Error (Checkout):', error);
        setLoading(false);
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
      
      // NOTE: La région doit correspondre à celle choisie lors de l'installation de l'extension.
      // Par défaut c'est 'us-central1'. Si vous avez choisi la Belgique, c'est 'europe-west1'.
      const REGION = 'europe-west1'; 
      
      const functions = getFunctions(app, REGION);
      const functionRef = httpsCallable(functions, 'ext-firestore-stripe-payments-createPortalLink');
      const { data } = await functionRef({ returnUrl: window.location.origin });
      
      if ((data as any)?.url) {
        window.location.assign((data as any).url);
      } else {
        throw new Error("Aucune URL retournée par Stripe. Vérifiez que le portail client est activé dans le dashboard Stripe.");
      }
    } catch (err: any) {
      console.error('Erreur Portail:', err);
      
      let errorMessage = err.message;
      if (err.message === 'internal') {
        errorMessage = "Erreur interne (Stripe). Vérifiez que :\n1. Le 'Customer Portal' est activé dans votre Dashboard Stripe.\n2. Votre clé API Stripe dans la config de l'extension est correcte.\n3. La région '" + 'europe-west1' + "' est la bonne.";
      }
      
      alert("Erreur Portail : " + errorMessage);
      setLoading(false);
    }
  };

  const handleUpdateRecipe = async (updatedRecipe: Recipe) => {
    if (!user) return;
    try {
      const recipeRef = doc(db, 'recipes', updatedRecipe.id);
      await updateDoc(recipeRef, {
        title: updatedRecipe.title,
        tags: updatedRecipe.tags,
        prepTime: updatedRecipe.prepTime,
        cookTime: updatedRecipe.cookTime,
        complexity: updatedRecipe.complexity,
        ingredients: updatedRecipe.ingredients,
        steps: updatedRecipe.steps
      });
      setViewingRecipe(updatedRecipe);
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

  const handleDeleteRecipe = () => {
    if (recipeToDelete) {
      deleteRecipe(recipeToDelete);
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
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

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
              <button 
                onClick={() => setShowAboutModal(true)} 
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-all text-sm font-medium"
              >
                <Heart className="w-4 h-4" /> {t('nav.about')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setShowAboutModal(true)} 
                className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all"
              >
                <Heart className="w-5 h-5" /> {t('nav.about')}
              </button>
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
                        placeholder={t('library.filterByTag')}
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
                      <span className="hidden sm:inline">{t('library.shoppingList')}</span> ({selectedForMenu.size})
                    </button>
                  )}
                </div>
              </div>

              {recipes.length === 0 ? (
                <div className="text-center py-20 px-4 max-w-md mx-auto">
                  <div className="w-24 h-24 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <BookOpen className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-slate-800 mb-4">{t('library.emptyTitle')}</h3>
                  <p className="text-slate-500 mb-10 leading-relaxed">{t('library.emptyDesc')}</p>
                  <button 
                    onClick={() => setActiveTab('scan')}
                    className="bg-orange-800 hover:bg-orange-900 transition-all text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-orange-900/20 active:scale-95"
                  >
                    {t('library.addFirst')}
                  </button>
                </div>
              ) : (
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 max-w-lg mx-auto lg:max-w-none">
                  {filteredRecipes.map(recipe => (
                    <RecipeCard 
                      key={recipe.id}
                      recipe={recipe}
                      onView={setViewingRecipe}
                      onDelete={setRecipeToDelete}
                      onToggleMenu={toggleMenuSelection}
                      isSelected={selectedForMenu.has(recipe.id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* SCANNER TAB */}
          {activeTab === 'scan' && (
            <motion.div key="scan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl mx-auto">
              {!scannedRecipe ? (
                <ScanOptions 
                  loading={loading}
                  onImageClick={() => fileInputRef.current?.click()}
                  urlInput={urlInput}
                  setUrlInput={setUrlInput}
                  onUrlSubmit={(e) => { e.preventDefault(); handleUrlSubmit(); }}
                />
              ) : (
                <ScanResultPreview 
                  scannedRecipe={scannedRecipe}
                  onClose={() => setScannedRecipe(null)}
                  onSave={saveRecipe}
                />
              )}
            </motion.div>
          )}

          {/* SHOPPING LIST TAB */}
          {activeTab === 'list' && (
            <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-3xl mx-auto">
              <ShoppingList 
                recipes={recipes}
                selectedForMenu={selectedForMenu}
                onToggleMenu={toggleMenuSelection}
                onClearMenu={() => setSelectedForMenu(new Set())}
                onViewLibrary={() => setActiveTab('library')}
                generateShoppingList={generateShoppingList}
              />
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
        </div>
      </nav>

      {/* MODALS */}
      <RecipeDetailModal 
        recipe={viewingRecipe}
        onClose={() => setViewingRecipe(null)}
        isPremium={isPremium}
        onShowPremium={() => setShowPremiumModal(true)}
        onUpdate={handleUpdateRecipe}
        onToggleMenu={toggleMenuSelection}
        isSelected={viewingRecipe ? selectedForMenu.has(viewingRecipe.id) : false}
      />

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        setMode={setAuthMode}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        error={authError}
        onGoogleLogin={handleGoogleLogin}
        onEmailAuth={handleEmailAuth}
      />

      <SettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        user={user}
        onLogout={handleLogout}
        onShowAbout={() => setShowAboutModal(true)}
      />

      <PremiumModal 
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onSubscribe={handleStripeCheckout}
        loading={loading}
      />

      <DeleteConfirmModal 
        isOpen={!!recipeToDelete}
        onClose={() => setRecipeToDelete(null)}
        onConfirm={handleDeleteRecipe}
      />

      <LegalModal 
        isOpen={!!legalModalType}
        onClose={() => setLegalModalType(null)}
        type={legalModalType}
      />

      <AboutModal 
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />
    </div>
  );
}

