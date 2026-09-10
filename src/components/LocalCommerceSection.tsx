import React from 'react';
import { Store, Navigation, CheckCircle2, Clock } from 'lucide-react';

const LOCALITIES = [
  'ECC Road',
  'ITPL Main Rd',
  'Kundalahalli',
  'Varthur',
  'Kadugodi',
  'Hope Farm',
  'Borewell Road',
  'Seegehalli',
  'Immadihalli',
  'Nallurahalli',
];

export const LocalCommerceSection: React.FC = () => {
  return (
    <section className="py-14 sm:py-20 bg-white border-y border-slate-200/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 items-center">
          {/* Left Column: Context & Message */}
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#0A8754] text-xs font-bold tracking-wide uppercase">
              <Navigation className="w-3.5 h-3.5" />
              <span>Hyperlocal by Design</span>
            </div>

            <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-[#0F172A] tracking-tight leading-tight">
              Bringing Whitefield’s favourite neighbourhood stores directly to you.
            </h2>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              We all have that butcher shop down the road whose cuts we trust, the vegetable vendor who always has crisp greens, and the puja store for devotional essentials.
            </p>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              <strong className="text-slate-900 font-semibold">Namma Stores</strong> is building the digital bridge that connects you with those same beloved local vendors — giving you convenient online ordering while keeping business local.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#0A8754] shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-slate-800">
                  <strong className="font-bold">Real neighbourhood stores:</strong> Built around the local stores and vendors that serve Whitefield.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#0A8754] shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-slate-800">
                  <strong className="font-bold">Fresh local essentials:</strong> Bringing everyday fresh products closer to your neighbourhood.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#0A8754] shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-slate-800">
                  <strong className="font-bold">Strengthening local retail:</strong> Keeping our Bangalore community vibrant and independent.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Local Map Visual Canvas */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl sm:rounded-3xl bg-[#FAF8F5] border border-slate-200/90 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-[#0A8754]" />
                  <span className="font-display font-bold text-slate-900 text-sm sm:text-base">
                    Whitefield Focus Areas
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF6A00] bg-orange-50 border border-orange-200/70 px-2.5 py-0.5 rounded-full">
                  <Clock className="w-3 h-3" />
                  Pre-Launch Setup
                </span>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                Starting with key neighbourhoods in and around Whitefield.
              </p>

              {/* Locality Chips Grid */}
              <div className="flex flex-wrap gap-2 mb-6">
                {LOCALITIES.map((loc) => (
                  <div
                    key={loc}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs hover:border-[#0A8754] hover:text-[#0A8754] transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0A8754]" />
                    <span>{loc}</span>
                  </div>
                ))}
              </div>

              {/* Community Quotation Note */}
              <div className="p-4 rounded-xl bg-white border border-emerald-100 flex items-start gap-3">
                <div className="text-2xl select-none" role="img" aria-label="Bengaluru pin">📍</div>
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-xs sm:text-sm">
                    Live in or around Whitefield?
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    By registering for Early Access, you help us map which specific local vendors to onboard first in your immediate pocket.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
