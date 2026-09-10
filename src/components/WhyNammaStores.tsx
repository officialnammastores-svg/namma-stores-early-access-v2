import React from 'react';
import { Store, Sparkles, MapPin, CheckCircle, Users } from 'lucide-react';

export const WhyNammaStores: React.FC = () => {
  return (
    <section id="why-namma" className="py-16 sm:py-24 bg-white border-b border-slate-200/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-18">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF6A00] bg-orange-50 px-3 py-1 rounded-full border border-orange-200/60 inline-block mb-3">
            Local • Fresh • Trusted
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F172A] tracking-tight mb-4">
            Why Namma Stores?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            The stores you already trust, now with the convenience of online shopping.
          </p>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {/* Pillar 1 */}
          <div className="flex flex-col items-start p-6 rounded-2xl bg-[#FAF8F5] border border-slate-200/80 shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-emerald-100/70 text-[#0A8754] flex items-center justify-center mb-5">
              <Store className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Pillar 01
            </span>
            <h3 className="font-display font-bold text-xl text-slate-900 mb-2">
              LOCAL STORES. ONLINE.
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Discover trusted stores around your neighbourhood. Keep supporting local shop owners whose quality and cuts you’ve relied on for years.
            </p>
            <div className="mt-auto pt-3 border-t border-slate-200/60 w-full flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <CheckCircle className="w-4 h-4 text-[#0A8754]" />
              <span>Real storefronts in Whitefield</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="flex flex-col items-start p-6 rounded-2xl bg-[#FAF8F5] border border-slate-200/80 shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-orange-100/70 text-[#FF6A00] flex items-center justify-center mb-5">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Pillar 02
            </span>
            <h3 className="font-display font-bold text-xl text-slate-900 mb-2">
              FRESH LOCAL PRODUCTS.
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Shop everyday fresh essentials from local sources. Quality produce and fresh cuts prepared by trusted neighbourhood vendors.
            </p>
            <div className="mt-auto pt-3 border-t border-slate-200/60 w-full flex items-center gap-2 text-xs font-semibold text-orange-800">
              <CheckCircle className="w-4 h-4 text-[#FF6A00]" />
              <span>Local stores & custom cuts</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="flex flex-col items-start p-6 rounded-2xl bg-[#FAF8F5] border border-slate-200/80 shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center mb-5">
              <MapPin className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Pillar 03
            </span>
            <h3 className="font-display font-bold text-xl text-slate-900 mb-2">
              BUILT FOR WHITEFIELD.
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Built around what Whitefield residents actually need. From daily cooking staples to regional puja items and specific preferences, shaped by you.
            </p>
            <div className="mt-auto pt-3 border-t border-slate-200/60 w-full flex items-center gap-2 text-xs font-semibold text-slate-800">
              <Users className="w-4 h-4 text-slate-700" />
              <span>Community-driven rollout</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
