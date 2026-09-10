import React, { useEffect, useRef } from 'react';
import { Search, ShoppingBag, Truck, Check } from 'lucide-react';
import { trackEvent } from '../lib/analytics';

export const HowItWorks: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const hasTrackedRef = useRef<boolean>(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || hasTrackedRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasTrackedRef.current) {
          hasTrackedRef.current = true;
          trackEvent('how_it_works_viewed');
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section ref={sectionRef} id="how-it-works" className="py-16 sm:py-24 bg-white border-b border-slate-200/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-18">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0A8754] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 inline-block mb-3">
            Simple & Transparent
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F172A] tracking-tight mb-4">
            How it will work
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Shopping from your trusted neighbourhood vendors will be effortless once Namma Stores goes live in Whitefield.
          </p>
        </div>

        {/* 3 Step Sequence */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-6 relative">
          {/* Connector Line on Desktop */}
          <div
            className="hidden md:block absolute top-1/3 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-emerald-200 via-orange-200 to-emerald-200 -z-0"
            aria-hidden="true"
          />

          {/* Step 1 */}
          <div className="relative z-10 flex flex-col items-center text-center p-6 sm:p-7 rounded-2xl bg-[#FAF8F5] border border-slate-200/80 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-white text-[#0A8754] shadow-xs border border-emerald-100 flex items-center justify-center mb-5 font-display font-extrabold text-lg">
              <Search className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400 mb-1">
              Step 01
            </span>
            <h3 className="font-display font-bold text-xl text-slate-900 mb-2">
              Discover
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Find trusted local stores around your neighbourhood in Whitefield.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative z-10 flex flex-col items-center text-center p-6 sm:p-7 rounded-2xl bg-[#FAF8F5] border border-slate-200/80 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-white text-[#FF6A00] shadow-xs border border-orange-100 flex items-center justify-center mb-5 font-display font-extrabold text-lg">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400 mb-1">
              Step 02
            </span>
            <h3 className="font-display font-bold text-xl text-slate-900 mb-2">
              Choose
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Explore fresh essentials, custom meat cuts, and everyday devotional needs.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative z-10 flex flex-col items-center text-center p-6 sm:p-7 rounded-2xl bg-[#FAF8F5] border border-slate-200/80 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-white text-emerald-700 shadow-xs border border-emerald-100 flex items-center justify-center mb-5 font-display font-extrabold text-lg">
              <Truck className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400 mb-1">
              Step 03
            </span>
            <h3 className="font-display font-bold text-xl text-slate-900 mb-2">
              Order
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Place your order when Namma Stores launches and receive genuine local freshness.
            </p>
          </div>
        </div>

        {/* Pre-launch Transparency Disclaimer */}
        <div className="mt-12 max-w-xl mx-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <p className="text-xs text-slate-600 leading-relaxed flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-[#0A8754] shrink-0" />
            <span>
              <strong>Pre-launch status:</strong> We are currently welcoming early members and onboarding Whitefield stores. No orders are charged today.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};
