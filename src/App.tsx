import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, ShoppingCart, Plus, Loader2, User, Search, Filter, Heart, Settings, Crown, Star, ChefHat, X, Camera, Sparkles } from 'lucide-react';
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
import { LogoGenerator } from './components/LogoGenerator';
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
  const [menuServings, setMenuServings] = useState<Record<string, number>>({});
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
  const [showLegalPage, setShowLegalPage] = useState<'privacy' | 'terms' | 'delete' | 'logo' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const pendingSaveRef = useRef(false);

  // Stripe Success/Cancel handling
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    
    // Handle legal pages
    const page = query.get('page');
    if (page === 'privacy') setShowLegalPage('privacy');
    if (page === 'terms') setShowLegalPage('terms');
    if (page === 'delete') setShowLegalPage('delete');
    if (page === 'logo') setShowLegalPage('logo');

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
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          ...docData,
          id: doc.id, // Ensure id from Firestore doc is used and not overwritten by data
        };
      }) as Recipe[];
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
      const recipeData = await analyzeRecipeImage(base64String, 'image/jpeg', language);
      setScannedRecipe({ ...recipeData, id: crypto.randomUUID(), source: t('scan.sourceBook') });
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
      const recipeData = await analyzeRecipeUrl(urlInput, language);
      setScannedRecipe({ ...recipeData, id: crypto.randomUUID(), source: t('scan.sourceWeb'), sourceUrl: urlInput });
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
      if (loading) return; // Prevent double save
      setLoading(true);
      try {
        const recipeToSave = {
          ...scannedRecipe,
          userId: user.uid,
          createdAt: Date.now(),
          tags: scannedRecipe.tags || []
        };
        
        // Remove id if it exists in scannedRecipe to avoid confusion
        if ('id' in recipeToSave) delete (recipeToSave as any).id;
        
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
      } finally {
        setLoading(false);
      }
    }
  };

  const deleteRecipe = async (id: string) => {
    if (!user || loading) return;
    
    setLoading(true);
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
      alert("Erreur lors de la suppression de la recette. Vérifiez vos permissions.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecipe = () => {
    if (recipeToDelete) {
      deleteRecipe(recipeToDelete);
    }
  };

  const toggleMenuSelection = (id: string) => {
    const newSet = new Set(selectedForMenu);
    const newServings = { ...menuServings };
    if (newSet.has(id)) {
      newSet.delete(id);
      delete newServings[id];
    } else {
      newSet.add(id);
      const recipe = recipes.find(r => r.id === id);
      newServings[id] = recipe?.servings || 4;
    }
    setSelectedForMenu(newSet);
    setMenuServings(newServings);
  };

  const generateShoppingList = () => {
    const list: Record<string, { total: number; unit: string; sources: string[], isNullAmount: boolean }[]> = {};
    
    const normalizeIngredientName = (name: string) => {
      let n = name.toLowerCase().trim();
      
      // Handle 'œ' ligature (e dans l'o)
      n = n.replace(/œ/g, 'oe');
      
      // Basic accent normalization for better matching
      n = n.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      // Basic plural normalization for common cases
      if (n.endsWith('s') && n.length > 3) {
        // Avoid stripping 's' from words like 'maïs', 'pois', 'ananas'
        const exceptions = ['mais', 'pois', 'ananas', 'radis', 'cassis', 'glass', 'molasses', 'couscous', 'hummus'];
        if (!exceptions.includes(n)) {
          return n.slice(0, -1);
        }
      }
      if (n.endsWith('x') && n.length > 3) {
        const exceptions = ['noix', 'prix'];
        if (!exceptions.includes(n)) {
          return n.slice(0, -1);
        }
      }
      return n;
    };

    const normalizeUnit = (unit: string) => {
      let u = unit.toLowerCase().trim();
      if (u === 'null' || u === 'undefined') return '';
      
      // French
      if (u === 'gousses' || u === 'gousse') return 'gousse';
      if (u === 'cuillères' || u === 'cuillère') return 'cuillère';
      if (u === 'pincées' || u === 'pincée') return 'pincée';
      if (u === 'tranches' || u === 'tranche') return 'tranche';
      if (u === 'grammes' || u === 'g') return 'g';
      if (u === 'entiers' || u === 'entier') return 'entier';
      
      // English
      if (u === 'cloves' || u === 'clove') return 'clove';
      if (u === 'spoons' || u === 'spoon') return 'spoon';
      if (u === 'pinches' || u === 'pinch') return 'pinch';
      if (u === 'slices' || u === 'slice') return 'slice';
      if (u === 'grams' || u === 'g') return 'g';
      if (u === 'whole') return 'whole';
      
      if (u.endsWith('s') && u.length > 3) return u.slice(0, -1);
      return u;
    };

    const parseAmount = (amountStr: any) => {
      if (amountStr === null || amountStr === undefined || amountStr === 'null' || amountStr === 'undefined' || amountStr === '') return 0;
      const clean = String(amountStr).replace(',', '.').trim();
      if (clean.includes('/')) {
        const [num, den] = clean.split('/').map(s => parseFloat(s.trim()));
        if (den) return num / den;
      }
      return parseFloat(clean) || 0;
    };

    recipes.filter(r => selectedForMenu.has(r.id)).forEach(r => {
      const originalServings = r.servings || 4;
      const targetServings = menuServings[r.id] || originalServings;
      const ratio = targetServings / originalServings;

      r.ingredients.forEach(i => {
        if (!i || !i.name || i.name === 'null') return;
        const name = normalizeIngredientName(i.name);
        const baseAmount = parseAmount(i.amount);
        const amount = baseAmount * ratio;
        
        const isNullAmount = baseAmount === 0 && (!i.amount || String(i.amount).trim() === '' || String(i.amount) === 'null');

        let unit = (i.unit || '').toLowerCase().trim();
        if (unit === 'null' || unit === 'undefined') unit = '';
        const normUnit = normalizeUnit(unit);
        
        if (!list[name]) list[name] = [];
        
        // Try to find if we already have this normalized unit for this ingredient
        const existing = list[name].find(item => normalizeUnit(item.unit) === normUnit && item.isNullAmount === isNullAmount);
        if (existing) {
          existing.total += amount;
          if (!existing.sources.includes(r.title)) {
            existing.sources.push(r.title);
          }
        } else {
          list[name].push({
            total: amount,
            unit: unit, // Keep original unit for display
            sources: [r.title],
            isNullAmount
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

  if (showLegalPage) {
    return (
      <div className="min-h-screen bg-white p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 pb-4 border-b">
          <h1 className="text-3xl font-serif font-black text-orange-950 italic">ChefScan</h1>
          <button 
            onClick={() => {
              setShowLegalPage(null);
              window.history.replaceState(null, '', window.location.pathname);
            }}
            className="text-slate-500 hover:text-slate-800 font-bold"
          >
            Retour à l'app
          </button>
        </div>
        <div className="prose prose-slate max-w-none">
          {showLegalPage === 'privacy' ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">Politique de Confidentialité</h2>
              <p className="text-slate-600">Dernière mise à jour : 23 mars 2026</p>
              
              <h3 className="text-xl font-bold text-slate-800">1. Collecte des données</h3>
              <p className="text-slate-600">
                Dans le cadre de l'utilisation de l'application ChefScan, nous sommes amenés à collecter certaines données personnelles vous concernant, notamment lors de la création de votre compte (adresse e-mail, nom d'utilisateur) et de l'utilisation de nos services (recettes enregistrées, listes de courses).
              </p>

              <h3 className="text-xl font-bold text-slate-800">2. Utilisation des données</h3>
              <p className="text-slate-600">
                Vos données sont utilisées exclusivement pour le bon fonctionnement de l'application : sauvegarde de vos recettes, synchronisation de vos listes de courses entre vos appareils, et gestion de votre abonnement Premium le cas échéant.
              </p>

              <h3 className="text-xl font-bold text-slate-800">3. Protection et stockage</h3>
              <p className="text-slate-600">
                Vos données sont stockées de manière sécurisée sur les serveurs de Google (Firebase) situés en Europe. Nous mettons en œuvre toutes les mesures techniques et organisationnelles nécessaires pour garantir la sécurité de vos informations.
              </p>

              <h3 className="text-xl font-bold text-slate-800">4. Services tiers</h3>
              <div className="text-slate-600">
                Nous utilisons les services suivants :
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Firebase (Google) :</strong> pour l'authentification et l'hébergement de la base de données.</li>
                  <li><strong>Stripe :</strong> pour le traitement sécurisé des paiements (version Premium). Aucune donnée bancaire n'est stockée sur nos serveurs.</li>
                  <li><strong>Google Gemini :</strong> pour l'analyse intelligente des images et des URLs de recettes.</li>
                </ul>
              </div>

              <h3 className="text-xl font-bold text-slate-800">5. Vos droits</h3>
              <p className="text-slate-600">
                Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Vous pouvez exercer ces droits en nous contactant directement ou en supprimant votre compte depuis les paramètres de l'application.
              </p>

              <h3 className="text-xl font-bold text-slate-800">6. Suppression des données (Google Play)</h3>
              <p className="text-slate-600">
                Vous pouvez demander la suppression complète de votre compte et de toutes les données associées (recettes, listes, profil) à tout moment. Pour ce faire :
              </p>
              <ul className="list-disc pl-5 text-slate-600 space-y-2">
                <li>Option 1 : Allez dans les <strong>Paramètres</strong> de l'application et cliquez sur "Supprimer mon compte".</li>
                <li>Option 2 : Envoyez un e-mail à <strong>charles.malec@hotmail.fr</strong> avec pour objet "Demande de suppression de compte".</li>
              </ul>
              <p className="text-slate-600">
                Toutes les données seront définitivement supprimées de nos serveurs sous 30 jours.
              </p>
              
              <h3 className="text-xl font-bold text-slate-800">7. Contact</h3>
              <p className="text-slate-600">
                Pour toute question concernant vos données : charles.malec@hotmail.fr
              </p>
            </div>
          ) : showLegalPage === 'terms' ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">Mentions Légales & Conditions</h2>
              <p className="text-slate-600">Dernière mise à jour : 23 mars 2026</p>

              <h3 className="text-xl font-bold text-slate-800">1. Éditeur de l'application</h3>
              <p className="text-slate-600">
                L'application ChefScan est éditée à titre personnel.<br />
                <strong>Contact :</strong> charles.malec@hotmail.fr
              </p>

              <h3 className="text-xl font-bold text-slate-800">2. Hébergement</h3>
              <p className="text-slate-600">
                L'application et ses bases de données sont hébergées par :<br />
                <strong>Google Cloud Platform (Firebase)</strong><br />
                Google Ireland Limited<br />
                Gordon House, Barrow Street, Dublin 4, Irlande
              </p>

              <h3 className="text-xl font-bold text-slate-800">3. Propriété intellectuelle</h3>
              <p className="text-slate-600">
                L'ensemble des éléments composant l'application (textes, interfaces, illustrations, code source) sont la propriété exclusive de l'éditeur, à l'exception des images générées par les utilisateurs ou issues de banques d'images libres de droits.
              </p>

              <h3 className="text-xl font-bold text-slate-800">4. Responsabilité</h3>
              <p className="text-slate-600">
                L'éditeur s'efforce d'assurer au mieux la disponibilité et l'exactitude des fonctionnalités de l'application. Toutefois, l'application est fournie "en l'état". L'éditeur ne saurait être tenu responsable des erreurs d'extraction de recettes, des omissions dans les listes de courses ou des éventuels problèmes techniques.
              </p>

              <h3 className="text-xl font-bold text-slate-800">5. Conditions d'utilisation</h3>
              <p className="text-slate-600">
                L'utilisation de l'application implique l'acceptation pleine et entière des présentes conditions. L'éditeur se réserve le droit de modifier ces conditions à tout moment.
              </p>
            </div>
          ) : showLegalPage === 'delete' ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">Demande de suppression de compte</h2>
              <p className="text-slate-600">
                Conformément aux exigences de Google Play, vous pouvez demander la suppression de votre compte ChefScan et de l'intégralité de vos données personnelles.
              </p>
              
              <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                <h3 className="text-lg font-bold text-orange-900 mb-2">Comment procéder ?</h3>
                <p className="text-orange-800 mb-4">
                  Pour supprimer votre compte et vos données, veuillez envoyer un e-mail à l'adresse suivante :
                </p>
                <a 
                  href="mailto:charles.malec@hotmail.fr?subject=Demande de suppression de compte ChefScan" 
                  className="text-xl font-black text-orange-700 underline underline-offset-4"
                >
                  charles.malec@hotmail.fr
                </a>
                <p className="mt-4 text-sm text-orange-600">
                  Veuillez utiliser l'adresse e-mail associée à votre compte ChefScan pour que nous puissions vous identifier.
                </p>
              </div>

              <h3 className="text-xl font-bold text-slate-800">Quelles données seront supprimées ?</h3>
              <ul className="list-disc pl-5 text-slate-600 space-y-2">
                <li>Votre profil utilisateur (e-mail, nom, photo).</li>
                <li>L'intégralité de votre bibliothèque de recettes.</li>
                <li>Vos listes de courses et préférences.</li>
                <li>Vos données d'abonnement (via Stripe).</li>
              </ul>
              
              <p className="text-slate-600 italic">
                Note : Une fois la suppression effectuée, ces données ne pourront pas être récupérées.
              </p>
            </div>
          ) : showLegalPage === 'logo' ? (
            <div className="flex flex-col items-center justify-center py-20 gap-16">
              <div className="flex flex-col items-center gap-6">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Logo Vectoriel (Haute Définition)</p>
                <div className="w-80 h-80 bg-orange-700 rounded-[80px] shadow-2xl flex items-center justify-center">
                  <ChefHat className="text-white w-48 h-48" strokeWidth={1.5} />
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-6">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Logo Image (PNG)</p>
                <div className="w-80 h-80 bg-white rounded-[80px] shadow-2xl overflow-hidden border border-slate-100 flex items-center justify-center">
                  <img src="/pwa-192x192.png" alt="Logo" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="text-center">
                <h1 className="text-8xl font-serif font-black text-orange-950 italic tracking-tighter">ChefScan</h1>
                <p className="text-slate-400 font-bold mt-6 uppercase tracking-[0.5em] text-sm">L'intelligence en cuisine</p>
              </div>
            </div>
          ) : null}
        </div>
        <div className="mt-12 pt-8 border-t text-center text-slate-400 text-sm">
          &copy; 2026 ChefScan - Tous droits réservés
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2ED] flex flex-col md:flex-row font-sans text-slate-900">
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        capture="environment"
        className="hidden" 
      />
      <input 
        type="file" 
        ref={galleryInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Mobile Header */}
      <header className="md:hidden bg-white/80 backdrop-blur-xl px-5 py-4 shadow-sm sticky top-0 z-40 flex justify-between items-center border-b border-orange-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-700 rounded-xl shadow-lg shadow-orange-700/20 flex items-center justify-center overflow-hidden">
            <img 
              src="/pwa-192x192.png" 
              alt="Logo" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chef-hat text-white w-6 h-6"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><path d="M6 17h12"/></svg>';
              }}
            />
          </div>
          <h1 className="text-2xl font-serif font-black text-orange-950 tracking-tight italic">ChefScan</h1>
        </div>
        <div className="flex items-center gap-2">
          {selectedForMenu.size > 0 && (
            <button onClick={() => setActiveTab('list')} className="relative p-2.5 bg-orange-50 rounded-xl text-orange-900 border border-orange-100">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-orange-700 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {selectedForMenu.size}
              </span>
            </button>
          )}
          {user ? (
            <button 
              onClick={() => setShowSettingsModal(true)} 
              className="p-2.5 bg-slate-50 text-slate-400 rounded-xl border border-slate-100"
            >
              <Settings className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="p-2.5 bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-700/20"
            >
              <User className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-[#FDFCFB] border-r border-orange-100/50 h-screen sticky top-0 p-6">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-700 rounded-xl shadow-lg shadow-orange-700/20 flex items-center justify-center overflow-hidden">
              <img 
                src="/pwa-192x192.png" 
                alt="Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chef-hat text-white w-6 h-6"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><path d="M6 17h12"/></svg>';
                }}
              />
            </div>
            <h1 className="text-2xl font-serif font-black text-orange-950 tracking-tight italic">ChefScan</h1>
          </div>
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
            title={t('settings.title')}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex flex-col gap-2 flex-1">
          <button 
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all font-bold text-base ${activeTab === 'library' ? 'bg-orange-900 text-white shadow-lg shadow-orange-900/20' : 'text-slate-500 hover:bg-orange-50 hover:text-orange-900'}`}
          >
            <BookOpen className="w-5 h-5" />
            {t('nav.recipes')}
          </button>
          <button 
            onClick={() => setActiveTab('scan')}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all font-bold text-base ${activeTab === 'scan' ? 'bg-orange-900 text-white shadow-lg shadow-orange-900/20' : 'text-slate-500 hover:bg-orange-50 hover:text-orange-900'}`}
          >
            <Plus className="w-5 h-5" />
            {t('nav.add')}
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={`flex items-center justify-between px-5 py-3.5 rounded-xl transition-all font-bold text-base ${activeTab === 'list' ? 'bg-orange-900 text-white shadow-lg shadow-orange-900/20' : 'text-slate-500 hover:bg-orange-50 hover:text-orange-900'}`}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5" />
              {t('nav.shopping')}
            </div>
            {selectedForMenu.size > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'list' ? 'bg-orange-700 text-white' : 'bg-orange-100 text-orange-700'}`}>
                {selectedForMenu.size}
              </span>
            )}
          </button>
        </nav>

        <div className="mt-auto space-y-6">
          {user ? (
            <div className="flex flex-col gap-4">
              {!isPremium && (
                <button 
                  onClick={() => setShowPremiumModal(true)}
                  className="w-full group relative overflow-hidden bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center justify-center gap-2">
                    <Star className="w-4 h-4 fill-current text-orange-400 group-hover:text-white" /> 
                    <span>{t('nav.premium')}</span>
                  </div>
                </button>
              )}
              
              <div className="flex items-center gap-4 p-4 bg-white rounded-[24px] border border-orange-100 shadow-sm hover:shadow-md transition-all">
                <div className="relative">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-12 h-12 rounded-2xl border-2 border-orange-50 shadow-sm object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-700 font-black text-xl shadow-sm">
                      {user.email?.[0].toUpperCase()}
                    </div>
                  )}
                  {isPremium && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-700 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      <Crown className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate leading-tight mb-1">{user.displayName || user.email?.split('@')[0]}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {isPremium ? 'Membre Premium' : `${recipes.length}/10 RECETTES`}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl bg-orange-700 text-white font-black shadow-xl shadow-orange-700/20 hover:bg-orange-800 transition-all hover:-translate-y-1"
            >
              <User className="w-5 h-5" /> {t('settings.login')}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 md:p-8 pb-24 md:pb-8 max-w-[100rem] mx-auto w-full flex flex-col">
        <div className="flex-grow">
          <AnimatePresence mode="wait">
            {/* LIBRARY TAB */}
            {activeTab === 'library' && (
              <motion.div key="library" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">{t('library.title')}</p>
                    <h2 className="text-4xl font-serif font-black text-slate-900 tracking-tight">{t('nav.recipes')}</h2>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder={t('library.search')} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-sm"
                      />
                    </div>
                    
                    {allTags.length > 0 && (
                      <div className="relative shrink-0">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          list="tag-options"
                          value={selectedTag || ''}
                          onChange={(e) => setSelectedTag(e.target.value || null)}
                          placeholder={t('library.filterByTag')}
                          className="w-full sm:w-56 pl-11 pr-10 py-4 bg-white border border-orange-100 rounded-[20px] text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 text-slate-900 font-black shadow-sm"
                        />
                        <datalist id="tag-options">
                          {allTags.map(tag => (
                            <option key={tag} value={tag} />
                          ))}
                        </datalist>
                        {selectedTag && (
                          <button 
                            onClick={() => setSelectedTag(null)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}

                    {selectedForMenu.size > 0 && (
                      <button 
                        onClick={() => setActiveTab('list')}
                        className="text-sm bg-orange-900 text-white px-6 py-4 rounded-[20px] font-black flex items-center justify-center gap-3 hover:bg-orange-950 transition-all shadow-xl shadow-orange-900/20 hover:-translate-y-0.5 shrink-0"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        <span className="hidden sm:inline">{t('library.shoppingList')}</span>
                        <span className="bg-orange-700 px-2 py-0.5 rounded-full text-[10px]">{selectedForMenu.size}</span>
                      </button>
                    )}
                  </div>
                </div>

                {recipes.length === 0 ? (
                  <div className="py-12 px-4 max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                      <div className="w-20 h-20 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <BookOpen className="w-10 h-10" />
                      </div>
                      <h3 className="text-3xl font-serif font-bold text-slate-800 mb-4">{t('tutorial.title')}</h3>
                      <p className="text-slate-500 text-lg max-w-xl mx-auto">{t('library.emptyDesc')}</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3 mb-12">
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Camera className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-slate-800 mb-2">{t('tutorial.step1Title')}</h4>
                        <p className="text-sm text-slate-500">{t('tutorial.step1Desc')}</p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-slate-800 mb-2">{t('tutorial.step2Title')}</h4>
                        <p className="text-sm text-slate-500">{t('tutorial.step2Desc')}</p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center">
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <ChefHat className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-slate-800 mb-2">{t('tutorial.step3Title')}</h4>
                        <p className="text-sm text-slate-500">{t('tutorial.step3Desc')}</p>
                      </div>
                    </div>

                    <div className="text-center mt-8">
                      <button 
                        onClick={() => setActiveTab('scan')}
                        className="w-full sm:w-auto bg-orange-800 hover:bg-orange-900 transition-all text-white px-6 sm:px-10 py-4 rounded-2xl font-bold shadow-xl shadow-orange-900/20 active:scale-95 inline-flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5 shrink-0" />
                        <span>{t('library.addFirst')}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 max-w-lg mx-auto lg:max-w-none">
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
              <motion.div key="scan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-5xl mx-auto">
                {!scannedRecipe ? (
                  <>
                    <div className="flex flex-col items-center text-center mb-12 space-y-4">
                      <h2 className="text-4xl lg:text-5xl font-serif font-black text-slate-900 tracking-tight leading-none">{t('scan.title')}</h2>
                      <p className="text-slate-500 max-w-lg mx-auto text-lg font-medium leading-relaxed">
                        {t('scan.subtitle')}
                      </p>
                    </div>
                    <ScanOptions 
                      loading={loading}
                      onImageClick={() => fileInputRef.current?.click()}
                      onGalleryClick={() => galleryInputRef.current?.click()}
                      urlInput={urlInput}
                      setUrlInput={setUrlInput}
                      onUrlSubmit={(e) => { e.preventDefault(); handleUrlSubmit(); }}
                    />
                  </>
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
                  menuServings={menuServings}
                  onUpdateServings={(id, servings) => setMenuServings(prev => ({ ...prev, [id]: servings }))}
                  onToggleMenu={toggleMenuSelection}
                  onClearMenu={() => {
                    setSelectedForMenu(new Set());
                    setMenuServings({});
                  }}
                  onViewLibrary={() => setActiveTab('library')}
                  generateShoppingList={generateShoppingList}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Banner */}
        <footer className="mt-auto pt-12 pb-24 md:pb-8 border-t border-orange-100 px-6 text-center">
          <div className="flex flex-col items-center justify-center gap-4 text-xs font-medium text-slate-400">
            <p className="order-2 md:order-1">© 2026 ChefScan • {t('footer.madeWith')}</p>
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 order-1 md:order-2">
              <button 
                onClick={() => setLegalModalType('terms')}
                className="hover:text-orange-600 transition-colors"
              >
                {t('footer.legal')}
              </button>
              <span className="hidden md:inline w-1 h-1 bg-slate-200 rounded-full"></span>
              <button 
                onClick={() => setLegalModalType('privacy')}
                className="hover:text-orange-600 transition-colors"
              >
                {t('footer.privacy')}
              </button>
            </div>
          </div>
        </footer>
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
              onClick={() => {
                if (activeTab === 'scan' && scannedRecipe) {
                  setScannedRecipe(null);
                } else {
                  setActiveTab('scan');
                }
              }}
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
        authMode={authMode}
        setAuthMode={setAuthMode}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        authError={authError}
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

