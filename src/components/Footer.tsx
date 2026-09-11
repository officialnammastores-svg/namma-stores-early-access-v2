import React, { useState } from 'react';
import { NammaStoresLogo } from './NammaStoresLogo';
import { MessageCircle, Instagram, MapPin, Heart } from 'lucide-react';
import { LegalModal } from './LegalModals';
import { trackEvent } from '../lib/analytics';
import { markWhatsAppCtaClicked } from '../services/earlyAccessService';

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/GsRyrfB4lzRASwYiAp9Ont';
const INSTAGRAM_URL = 'https://www.instagram.com/namma.stores/';

interface FooterProps {
  onScrollToForm: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onScrollToForm }) => {
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);

  const handleWhatsAppClick = () => {
    trackEvent('whatsapp_cta_clicked', { source: 'footer' });
    markWhatsAppCtaClicked();
  };

  const handleInstagramClick = () => {
    trackEvent('instagram_clicked', { source: 'footer' });
  };

  return (
    <>
      <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 sm:gap-12 pb-12 border-b border-slate-800">
            {/* Brand Column */}
            <div className="md:col-span-6 space-y-4">
              <div className="inline-block bg-white px-4 py-2.5 rounded-2xl">
                <NammaStoresLogo variant="compact" />
              </div>

              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                Bringing Whitefield’s trusted neighbourhood stores online. Fresh meat, fruits & vegetables, and puja essentials from vendors you already rely on.
              </p>

              <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                <MapPin className="w-4 h-4 text-[#FF6A00]" />
                <span className="font-semibold text-slate-300">Whitefield, Bangalore, Karnataka</span>
              </div>
            </div>

            {/* Quick Links Column */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Explore
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <button
                    onClick={onScrollToForm}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Join Early Access
                  </button>
                </li>
                <li>
                  <a
                    href="#why-namma"
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Why Namma Stores
                  </a>
                </li>
                <li>
                  <a
                    href="#launch-categories"
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    Launch Categories
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    How It Works
                  </a>
                </li>
              </ul>
            </div>

            {/* Community Links Column */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Community
              </h4>
              <div className="flex flex-col gap-2.5">
                <a
                  href={WHATSAPP_GROUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleWhatsAppClick}
                  className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-[#25D366] transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>WhatsApp Community</span>
                </a>

                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleInstagramClick}
                  className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-[#E4405F] transition-colors"
                >
                  <Instagram className="w-4 h-4 text-[#E4405F]" />
                  <span>Instagram @namma.stores</span>
                </a>
              </div>

              <div className="pt-3">
                <span className="inline-block text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full">
                  Pre-Launch Beta Phase
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span>© {new Date().getFullYear()} Namma Stores. Built with</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>for Whitefield, Bangalore.</span>
            </div>

            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setLegalModalType('privacy')}
                className="hover:text-slate-300 underline-offset-4 hover:underline cursor-pointer"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setLegalModalType('terms')}
                className="hover:text-slate-300 underline-offset-4 hover:underline cursor-pointer"
              >
                Terms & Conditions
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />
    </>
  );
};
