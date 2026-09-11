import React, { useState, useEffect } from 'react';
import { ShoppingPreference } from '../types';
import { ArrowRight, Sparkles, X, Check, MapPin } from 'lucide-react';
import { trackEvent } from '../lib/analytics';

interface CategorySectionProps {
  onSelectCategory: (category: ShoppingPreference) => void;
}

interface CategoryDetail {
  id: ShoppingPreference;
  emoji: string;
  title: string;
  tagline: string;
  description: string;
  sourcingNote: string;
  typicalItems: string[];
  accentColor: string;
  badgeBg: string;
  borderColor: string;
}

const CATEGORIES: CategoryDetail[] = [
  {
    id: 'Fresh Meat',
    emoji: '🥩',
    title: 'Fresh Meat',
    tagline: 'Local Butcheries',
    description:
      'Fresh meat and everyday non-vegetarian essentials from local stores in Whitefield.',
    sourcingNote:
      'Prepared fresh on order by local stores, rather than pre-packaged industrial stock.',
    typicalItems: [
      'Chicken curry cut & boneless cuts',
      'Mutton cuts & mince',
      'Country chicken (Naati Koli)',
      'Cleaned fish cuts',
      'Fresh eggs',
    ],
    accentColor: '#FF6A00',
    badgeBg: 'bg-orange-50 text-[#FF6A00] border-orange-200/70',
    borderColor: 'hover:border-orange-300',
  },
  {
    id: 'Fruits & Vegetables',
    emoji: '🥬',
    title: 'Fruits & Vegetables',
    tagline: 'Local Greens & Produce',
    description:
      'Fresh produce for everyday cooking from trusted local stores.',
    sourcingNote:
      'Sourced from trusted local greengrocers and stores around Whitefield.',
    typicalItems: [
      'Everyday cooking staples (onions, tomatoes, potatoes)',
      'Fresh greens (coriander, methi, palak, curry leaves)',
      'Seasonal local vegetables & gourds',
      'Seasonal fruits',
      'Fresh ginger, garlic & green chillies',
    ],
    accentColor: '#0A8754',
    badgeBg: 'bg-emerald-50 text-[#0A8754] border-emerald-200/70',
    borderColor: 'hover:border-emerald-300',
  },
  {
    id: 'Puja Essentials',
    emoji: '🪔',
    title: 'Puja Essentials',
    tagline: 'Devotional & Everyday Traditions',
    description:
      'Everyday puja and devotional essentials, closer to home.',
    sourcingNote:
      'Quality flowers, camphor, wicks, and devotional essentials from local puja bhandars.',
    typicalItems: [
      'Fresh strings of flowers & garlands',
      'Ghee & devotional lamp oils',
      'Natural sambrani & herbal agarbattis',
      'Camphor (Karpura) & cotton wicks',
      'Kumkum, turmeric & betel leaves',
    ],
    accentColor: '#D97706',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200/70',
    borderColor: 'hover:border-amber-300',
  },
];

export const CategorySection: React.FC<CategorySectionProps> = ({ onSelectCategory }) => {
  const [activeModal, setActiveModal] = useState<CategoryDetail | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
      }
    };
    if (activeModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeModal]);

  const handleOpenCategory = (cat: CategoryDetail) => {
    trackEvent('category_clicked', { category: cat.id });
    setActiveModal(cat);
  };

  const handleChooseForForm = (catId: ShoppingPreference) => {
    setActiveModal(null);
    trackEvent('what_im_looking_for_clicked', { selection: catId, source: 'category_modal' });
    onSelectCategory(catId);
  };

  return (
    <section id="launch-categories" className="py-16 sm:py-24 bg-[#FAF8F5]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 text-[#0A8754] text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Wave 1</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F172A] tracking-tight mb-3">
            What’s coming first
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            We are starting with the three everyday categories where local freshness and neighbourhood trust make the biggest difference.
          </p>
        </div>

        {/* 3 Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className={`flex flex-col rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 p-6 sm:p-7 ${cat.borderColor} group`}
            >
              {/* Category Header */}
              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl select-none" role="img" aria-label={cat.title}>
                  {cat.emoji}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${cat.badgeBg}`}>
                  {cat.tagline}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="font-display font-bold text-xl text-slate-900 mb-2">
                {cat.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                {cat.description}
              </p>

              {/* Key Items Preview */}
              <div className="bg-slate-50 rounded-xl p-3.5 mb-6 border border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Anticipated Essentials:
                </span>
                <ul className="space-y-1.5">
                  {cat.typicalItems.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                  <li className="text-[11px] text-slate-500 italic pt-0.5">
                    + more from local Whitefield vendors
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleOpenCategory(cat)}
                  className="text-xs font-bold text-slate-700 hover:text-[#0A8754] py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore details</span>
                </button>
                <button
                  onClick={() => handleChooseForForm(cat.id)}
                  className="ml-auto text-xs font-bold text-[#0A8754] bg-emerald-50 hover:bg-emerald-100 py-2 px-3.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Select & Request</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Note on Launch Readiness */}
        <div className="mt-10 text-center">
          <p className="text-xs text-slate-500 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200/80 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#0A8754]" />
            Catalogue will be opened in phased batches to registered Early Access members first.
          </p>
        </div>
      </div>

      {/* Category Info Modal */}
      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeModal.title}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl" role="img" aria-label={activeModal.title}>
                {activeModal.emoji}
              </span>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${activeModal.badgeBg}`}>
                  {activeModal.tagline}
                </span>
                <h3 className="font-display font-extrabold text-2xl text-slate-900">
                  {activeModal.title}
                </h3>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {activeModal.description}
            </p>

            {/* Sourcing Promise */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-5">
              <span className="text-xs font-bold text-slate-900 block mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0A8754]" />
                How Namma Stores Sources This:
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeModal.sourcingNote}
              </p>
            </div>

            {/* Expected Catalogue Items */}
            <div className="mb-6">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                Planned Items at Launch:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeModal.typicalItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-100">
                    <Check className="w-3.5 h-3.5 text-[#0A8754] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setActiveModal(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 py-2.5 px-4 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => handleChooseForForm(activeModal.id)}
                className="text-xs font-bold text-white bg-[#0A8754] hover:bg-[#087347] py-2.5 px-5 rounded-full shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Notify me when live</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
