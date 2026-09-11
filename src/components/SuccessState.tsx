import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { MessageCircle, Instagram, CheckCircle2, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import { markWhatsAppCtaClicked } from '../services/earlyAccessService';

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/GsRyrfB4lzRASwYiAp9Ont';
const INSTAGRAM_URL = 'https://www.instagram.com/namma.stores/';

interface SuccessStateProps {
  isDuplicate?: boolean;
  isMock?: boolean;
  leadName?: string;
  leadPhone?: string;
  leadId?: string | null;
  onResetForm?: () => void;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  isDuplicate = false,
  isMock = false,
  leadName,
  leadPhone,
  leadId,
  onResetForm,
}) => {
  useEffect(() => {
    // Fire festive confetti on success mount
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0A8754', '#FF6A00', '#10B981', '#F59E0B'],
      });
    } catch {
      // Confetti fail silently if canvas not supported
    }
  }, []);

  const handleWhatsAppClick = () => {
    trackEvent('whatsapp_cta_clicked', { source: 'success_state_primary', is_duplicate: isDuplicate });
    markWhatsAppCtaClicked(leadId);
  };

  const handleInstagramClick = () => {
    trackEvent('instagram_clicked', { source: 'success_state_secondary' });
  };

  return (
    <div className="rounded-3xl bg-white border border-emerald-200/90 shadow-xl p-7 sm:p-10 md:p-12 text-center max-w-xl mx-auto animate-fade-in">
      {/* Icon Badge */}
      <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#0A8754] border border-emerald-200 flex items-center justify-center mx-auto mb-5 shadow-xs">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      {/* Main Headline */}
      <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0F172A] mb-2 tracking-tight">
        {isDuplicate ? "You're already on the list! 💚" : "You're on the list! 🎉"}
      </h3>

      {/* Supporting Message */}
      <p className="text-slate-700 text-sm sm:text-base font-medium mb-2">
        {leadName ? `${leadName}, you're` : "You're"} now part of Namma Stores Early Access.
      </p>

      {/* Location Status */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-6">
        <MapPin className="w-3.5 h-3.5 text-[#FF6A00]" />
        <span>Launching soon in Whitefield, Bangalore</span>
      </div>

      {isMock && (
        <div className="mb-6 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
          ℹ️ Local Preview Mode: Lead stored in browser cache. In production, leads are written directly to your live Supabase database.
        </div>
      )}

      <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-slate-200/80 mb-7 text-left">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#0A8754] shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            Early members receive priority launch notifications, early-access invitations, and the ability to vote for local stores in Whitefield.
          </p>
        </div>
      </div>

      {/* Next Step Highlight Box */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 mb-7 text-left">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A8754] block mb-1">
          Recommended Next Step:
        </span>
        <h4 className="font-display font-bold text-slate-900 text-sm mb-1">
          Join the Whitefield WhatsApp Community
        </h4>
        <p className="text-xs text-slate-600 leading-relaxed">
          Stay connected directly with our team, suggest your preferred neighbourhood stores, and get instant updates when launch begins.
        </p>
      </div>

      {/* Primary WhatsApp CTA */}
      <div className="flex flex-col gap-3">
        <a
          id="success-join-whatsapp-btn"
          href={WHATSAPP_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsAppClick}
          className="w-full py-3.5 px-6 rounded-full bg-[#0A8754] hover:bg-[#087347] active:scale-[0.98] text-white font-bold text-sm sm:text-base tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A8754]"
        >
          <MessageCircle className="w-5 h-5 text-[#25D366] fill-[#25D366]/20" />
          <span>JOIN WHATSAPP COMMUNITY</span>
          <ArrowRight className="w-4 h-4" />
        </a>

        {/* Secondary Instagram CTA */}
        <a
          id="success-follow-instagram-btn"
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleInstagramClick}
          className="w-full py-3 px-6 rounded-full bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 border border-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Instagram className="w-4 h-4 text-[#E4405F]" />
          <span>FOLLOW @NAMMA.STORES ON INSTAGRAM</span>
        </a>
      </div>

      {onResetForm && (
        <button
          onClick={onResetForm}
          className="mt-6 text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
        >
          Register another member or phone number
        </button>
      )}
    </div>
  );
};
