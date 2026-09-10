import React from 'react';
import { MessageCircle, Instagram, Users, Sparkles, HeartHandshake, ArrowRight } from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import { markWhatsAppCtaClicked } from '../services/earlyAccessService';

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/GsRyrfB4lzRASwYiAp9Ont';
const INSTAGRAM_URL = 'https://www.instagram.com/namma.stores/';

export const CommunitySection: React.FC = () => {
  const handleWhatsAppClick = () => {
    trackEvent('community_cta_clicked', { platform: 'whatsapp' });
    trackEvent('whatsapp_cta_clicked', { source: 'community_section' });
    markWhatsAppCtaClicked();
  };

  const handleInstagramClick = () => {
    trackEvent('community_cta_clicked', { platform: 'instagram' });
    trackEvent('instagram_clicked', { source: 'community_section' });
  };

  return (
    <section id="community" className="py-16 sm:py-24 bg-[#FAF8F5]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-lg p-7 sm:p-12 md:p-16 relative overflow-hidden">
          {/* Subtle Ambient Decorative Gradient */}
          <div
            className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-100/50 via-orange-100/30 to-transparent rounded-full blur-3xl -z-0 pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-2xl">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-[#0A8754] text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-200/60">
              <Users className="w-3.5 h-3.5" />
              <span>Whitefield Resident Collective</span>
            </div>

            {/* Headline */}
            <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-[#0F172A] tracking-tight leading-tight mb-4">
              We’re building Namma Stores around what Whitefield needs.
            </h2>

            {/* Supporting Idea */}
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-6">
              Your feedback helps shape what comes next. Tell us which local stores you love, what items are missing from your daily shopping, and how we can serve your neighbourhood best.
            </p>

            {/* Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAF8F5] border border-slate-200/70">
                <Sparkles className="w-5 h-5 text-[#0A8754] shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700">
                  <strong className="block text-slate-900 font-bold mb-0.5">Direct Founder & Team Access</strong>
                  Participate in quick polls and suggest your favourite local vendors.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAF8F5] border border-slate-200/70">
                <HeartHandshake className="w-5 h-5 text-[#FF6A00] shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700">
                  <strong className="block text-slate-900 font-bold mb-0.5">First Wave Launch Privileges</strong>
                  Community members receive priority rollout invitations and early perks.
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <a
                href={WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsAppClick}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-[#0A8754] hover:bg-[#087347] active:scale-[0.98] text-white font-bold text-sm tracking-wide shadow-sm hover:shadow-md transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A8754] focus-visible:ring-offset-2"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366] fill-[#25D366]/20" />
                <span>JOIN THE COMMUNITY</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleInstagramClick}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-800 border border-slate-200/90 font-bold text-sm shadow-2xs hover:shadow-xs transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <Instagram className="w-4 h-4 text-[#E4405F]" />
                <span>FOLLOW @NAMMA.STORES</span>
              </a>
            </div>

            <p className="text-[11px] text-slate-400 mt-4">
              Join our WhatsApp Community for launch updates, early-access benefits and to share your ideas with us.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
