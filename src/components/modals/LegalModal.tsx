import React from 'react';
import { X, Shield, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms' | null;
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen || !type) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }} 
          className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
        >
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-20">
            <h2 className="text-2xl font-serif font-bold text-slate-800 flex items-center gap-3">
              {type === 'privacy' ? <Shield className="w-6 h-6 text-orange-600" /> : <FileText className="w-6 h-6 text-orange-600" />}
              {type === 'privacy' ? 'Politique de Confidentialité' : 'Mentions Légales'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 sm:p-8 overflow-y-auto text-slate-600 space-y-6 text-sm sm:text-base leading-relaxed">
            {type === 'privacy' ? (
              <>
                <h3 className="text-lg font-bold text-slate-800">1. Collecte des données</h3>
                <p>
                  Dans le cadre de l'utilisation de l'application ChefScan, nous sommes amenés à collecter certaines données personnelles vous concernant, notamment lors de la création de votre compte (adresse e-mail, nom d'utilisateur) et de l'utilisation de nos services (recettes enregistrées, listes de courses).
                </p>

                <h3 className="text-lg font-bold text-slate-800">2. Utilisation des données</h3>
                <p>
                  Vos données sont utilisées exclusivement pour le bon fonctionnement de l'application : sauvegarde de vos recettes, synchronisation de vos listes de courses entre vos appareils, et gestion de votre abonnement Premium le cas échéant.
                </p>

                <h3 className="text-lg font-bold text-slate-800">3. Protection et stockage</h3>
                <p>
                  Vos données sont stockées de manière sécurisée sur les serveurs de Google (Firebase) situés en Europe. Nous mettons en œuvre toutes les mesures techniques et organisationnelles nécessaires pour garantir la sécurité de vos informations.
                </p>

                <h3 className="text-lg font-bold text-slate-800">4. Services tiers</h3>
                <p>
                  Nous utilisons les services suivants :
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><strong>Firebase (Google) :</strong> pour l'authentification et l'hébergement de la base de données.</li>
                    <li><strong>Stripe :</strong> pour le traitement sécurisé des paiements (version Premium). Aucune donnée bancaire n'est stockée sur nos serveurs.</li>
                    <li><strong>Google Gemini :</strong> pour l'analyse intelligente des images et des URLs de recettes.</li>
                  </ul>
                </p>

                <h3 className="text-lg font-bold text-slate-800">5. Vos droits</h3>
                <p>
                  Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Vous pouvez exercer ces droits en nous contactant directement ou en supprimant votre compte depuis les paramètres de l'application.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-slate-800">1. Éditeur de l'application</h3>
                <p>
                  L'application ChefScan est éditée à titre personnel.<br />
                  <strong>Contact :</strong> charles.malec@hotmail.fr
                </p>

                <h3 className="text-lg font-bold text-slate-800">2. Hébergement</h3>
                <p>
                  L'application et ses bases de données sont hébergées par :<br />
                  <strong>Google Cloud Platform (Firebase)</strong><br />
                  Google Ireland Limited<br />
                  Gordon House, Barrow Street, Dublin 4, Irlande
                </p>

                <h3 className="text-lg font-bold text-slate-800">3. Propriété intellectuelle</h3>
                <p>
                  L'ensemble des éléments composant l'application (textes, interfaces, illustrations, code source) sont la propriété exclusive de l'éditeur, à l'exception des images générées par les utilisateurs ou issues de banques d'images libres de droits.
                </p>

                <h3 className="text-lg font-bold text-slate-800">4. Responsabilité</h3>
                <p>
                  L'éditeur s'efforce d'assurer au mieux la disponibilité et l'exactitude des fonctionnalités de l'application. Toutefois, l'application est fournie "en l'état". L'éditeur ne saurait être tenu responsable des erreurs d'extraction de recettes, des omissions dans les listes de courses ou des éventuels problèmes techniques.
                </p>

                <h3 className="text-lg font-bold text-slate-800">5. Conditions d'utilisation</h3>
                <p>
                  L'utilisation de l'application implique l'acceptation pleine et entière des présentes conditions. L'éditeur se réserve le droit de modifier ces conditions à tout moment.
                </p>
              </>
            )}
          </div>
          
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-xl transition-colors"
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LegalModal;
