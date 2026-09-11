import React from 'react';
import { ArrowRight, MapPin, Sparkles, ShieldCheck, HeartHandshake, Leaf } from 'lucide-react';
import { trackEvent } from '../lib/analytics';

interface HeroProps {
  onGetEarlyAccess: () => void;
  onExplore: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onGetEarlyAccess, onExplore }) => {
  const handlePrimaryCta = () => {
    trackEvent('hero_cta_clicked', { source: 'hero_primary_button' });
    onGetEarlyAccess();
  };

  const handleExplore = () => {
    trackEvent('hero_cta_clicked', { source: 'hero_explore_button' });
    onExplore();
  };

  return (
    <section className="relative pt-28 pb-14 sm:pt-36 sm:pb-20 md:pt-40 md:pb-24 overflow-hidden">
      {/* Background Subtle Tone Ambient Lighting */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] pointer-events-none opacity-40 blur-3xl -z-10"
        style={{
          background: 'radial-gradient(ellipse at 50% 20%, rgba(10, 135, 84, 0.15) 0%, rgba(255, 106, 0, 0.08) 45%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Status & Location Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-emerald-200/80 shadow-xs mb-6 text-xs sm:text-sm font-semibold text-slate-800">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0A8754]"></span>
            </span>
            <span className="text-[#0A8754] font-bold">Launching Soon</span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-[#FF6A00]" />
              Whitefield, Bangalore
            </span>
          </div>

          {/* H1 Main Display Headline */}
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl text-[#0F172A] tracking-[-0.03em] leading-[1.15] mb-5">
            Something local is coming to{' '}
            <span className="relative inline-block text-[#0A8754]">
              Whitefield.
              <svg
                className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-2 sm:h-2.5 text-[#FF6A00] opacity-80"
                viewBox="0 0 100 20"
                preserveAspectRatio="none"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M0 15 Q 50 0 100 12 L 100 18 Q 50 8 0 19 Z" />
              </svg>
            </span>{' '}
            <span className="inline-block text-2xl sm:text-4xl md:text-5xl align-middle">👀</span>
          </h1>

          {/* Supporting Headline */}
          <p className="font-display font-semibold text-lg sm:text-2xl text-slate-800 tracking-tight mb-3">
            Your trusted local stores are coming online.
          </p>

          {/* Supporting Context */}
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl leading-relaxed mb-8 sm:mb-10">
            Fresh essentials. Local stores. One simpler way to shop. Connecting trusted neighbourhood stores to your home.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
            <button
              id="hero-primary-cta"
              onClick={handlePrimaryCta}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#0A8754] hover:bg-[#087347] active:scale-[0.98] text-white font-bold text-sm sm:text-base tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A8754] focus-visible:ring-offset-2"
            >
              <span>GET EARLY ACCESS</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-explore-cta"
              onClick={handleExplore}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-800 border border-slate-200/90 font-bold text-sm sm:text-base shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <span>EXPLORE CATEGORIES</span>
            </button>
          </div>

          {/* Brand Promise Micro-Trust Bar */}
          <div className="grid grid-cols-3 gap-2 sm:gap-6 mt-10 pt-8 border-t border-slate-200/70 w-full max-w-xl text-left sm:text-center">
            <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#0A8754] flex items-center justify-center">
                <Leaf className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs sm:text-sm text-slate-900">Local & Fresh</span>
              <span className="text-[11px] text-slate-500 hidden sm:block">Directly from nearby stores</span>
            </div>

            <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-orange-50 text-[#FF6A00] flex items-center justify-center">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs sm:text-sm text-slate-900">Whitefield First</span>
              <span className="text-[11px] text-slate-500 hidden sm:block">Built for our locality</span>
            </div>

            <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs sm:text-sm text-slate-900">Trusted Sourcing</span>
              <span className="text-[11px] text-slate-500 hidden sm:block">Stores you know</span>
            </div>
          </div>
        </div>

        {/* Editorial Visual Composition */}
        <div className="mt-12 sm:mt-16 max-w-4xl mx-auto">
          <div className="relative rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-lg overflow-hidden p-4 sm:p-7">
            {/* Top Bar inside Card */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                </div>
                <span className="text-xs font-semibold text-slate-600 pl-1">Whitefield Neighbourhood Network</span>
              </div>
              <span className="text-xs font-semibold text-[#0A8754] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 uppercase tracking-wider">
                EARLY ACCESS
              </span>
            </div>

            {/* Visual Grid: 3 Launch Category Teasers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
              {/* Category 1: Fresh Meat */}
              <div className="group relative rounded-xl sm:rounded-2xl p-4 bg-orange-50/40 border border-orange-100 transition-all hover:border-orange-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl" role="img" aria-label="Fresh Meat">🥩</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6A00] bg-orange-100/70 px-2 py-0.5 rounded-full">
                    Launch Category
                  </span>
                </div>
                <h2 className="font-display font-bold text-slate-900 text-base mb-1">Fresh Meat</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Fresh meat and everyday non-vegetarian essentials from local stores in Whitefield.
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                  <MapPin className="w-3 h-3 text-[#FF6A00]" />
                  <span>ECC Rd • Kundalahalli</span>
                </div>
              </div>

              {/* Category 2: Fruits & Veg */}
              <div className="group relative rounded-xl sm:rounded-2xl p-4 bg-emerald-50/40 border border-emerald-100 transition-all hover:border-emerald-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl" role="img" aria-label="Fruits and Vegetables">🥬</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A8754] bg-emerald-100/70 px-2 py-0.5 rounded-full">
                    Launch Category
                  </span>
                </div>
                <h2 className="font-display font-bold text-slate-900 text-base mb-1">Fruits & Vegetables</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Fresh fruits and vegetables from trusted local stores around Whitefield.
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                  <MapPin className="w-3 h-3 text-[#0A8754]" />
                  <span>Varthur • Hope Farm</span>
                </div>
              </div>

              {/* Category 3: Puja Essentials */}
              <div className="group relative rounded-xl sm:rounded-2xl p-4 bg-amber-50/40 border border-amber-100 transition-all hover:border-amber-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl" role="img" aria-label="Puja Essentials">🪔</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                    Launch Category
                  </span>
                </div>
                <h2 className="font-display font-bold text-slate-900 text-base mb-1">Puja Essentials</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Flowers, camphor, ghee wicks and everyday puja essentials, closer to home.
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                  <MapPin className="w-3 h-3 text-amber-600" />
                  <span>Kadugodi • ITPL</span>
                </div>
              </div>
            </div>

            {/* Bottom Local Proof Strip */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0A8754]" />
                <span>Early Access members get priority launch alerts & first-wave invitations.</span>
              </div>
              <button
                onClick={onGetEarlyAccess}
                className="text-[#0A8754] font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                Join list now →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
