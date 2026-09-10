import React, { useEffect } from 'react';
import { X, Shield, FileText } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (type) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [type, onClose]);

  if (!type) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={type === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
    >
      <div className="relative w-full max-w-xl max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5">
            {type === 'privacy' ? (
              <Shield className="w-5 h-5 text-[#0A8754]" />
            ) : (
              <FileText className="w-5 h-5 text-[#FF6A00]" />
            )}
            <h3 className="font-display font-bold text-lg text-slate-900">
              {type === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {type === 'privacy' ? (
            <>
              <p className="font-semibold text-slate-900">
                Namma Stores Early Access Privacy Notice (Whitefield, Bangalore)
              </p>
              <p>
                Namma Stores collects your name, mobile phone number, area of residence in Whitefield, and optional shopping preferences solely to manage early-access membership, coordinate pre-launch communication, and inform you of our marketplace launch.
              </p>
              <h4 className="font-bold text-slate-800 pt-2">1. Information We Collect</h4>
              <p>
                We only collect information voluntarily provided by you during registration on this website. We do not buy third-party lists or share your mobile number with unauthorized telemarketers.
              </p>
              <h4 className="font-bold text-slate-800 pt-2">2. WhatsApp & Communications</h4>
              <p>
                If you opt in to receive updates via WhatsApp, we will use your provided phone number solely to send invitations, community access links, and launch announcements regarding Namma Stores in Whitefield. You can leave the community group at any time.
              </p>
              <h4 className="font-bold text-slate-800 pt-2">3. Data Security</h4>
              <p>
                Your registration records are protected using secure row-level database security. We never sell your personal information.
              </p>
              <h4 className="font-bold text-slate-800 pt-2">4. Contact</h4>
              <p>
                For any data questions or to request removal of your early access registration, contact us via Instagram @namma.stores or through the official WhatsApp community.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-slate-900">
                Namma Stores Early Access Terms (Pre-Launch)
              </p>
              <p>
                Welcome to Namma Stores. By registering for Early Access, you acknowledge and agree to the following terms:
              </p>
              <h4 className="font-bold text-slate-800 pt-2">1. Pre-Launch Status</h4>
              <p>
                Namma Stores is currently in pre-launch development. Registering for Early Access grants you priority notification and potential first-cohort invitations; it does not constitute a financial transaction, binding contract of sale, or guaranteed delivery service prior to official commercial rollout.
              </p>
              <h4 className="font-bold text-slate-800 pt-2">2. Service Availability</h4>
              <p>
                Initial operations and catalogue rollouts will be phased starting in select zones within Whitefield, Bangalore. Product availability, delivery zones, and participating neighbourhood stores are subject to localized onboarding.
              </p>
              <h4 className="font-bold text-slate-800 pt-2">3. Community Conduct</h4>
              <p>
                Members joining our official WhatsApp community are expected to maintain respectful, constructive participation. Spamming, unauthorized promotions, or harassment will result in immediate removal.
              </p>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-[#FAF8F5] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
