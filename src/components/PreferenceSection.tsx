import React from 'react';
import { ShoppingPreference } from '../types';
import { ArrowDown, Check, Sparkles } from 'lucide-react';
import { trackEvent } from '../lib/analytics';

interface PreferenceSectionProps {
  selectedPreference?: ShoppingPreference | string;
  onSelectPreference: (pref: ShoppingPreference) => void;
}

interface PreferenceOption {
  id: ShoppingPreference;
  emoji: string;
  title: string;
  subtitle: string;
  tag?: string;
}

const PREFERENCE_OPTIONS: PreferenceOption[] = [
  {
    id: 'Fresh Meat',
    emoji: '🥩',
    title: 'Fresh Meat',
    subtitle: 'Chicken, mutton, fresh fish, and eggs',
    tag: 'Popular',
  },
  {
    id: 'Fruits & Vegetables',
    emoji: '🥬',
    title: 'Fruits & Vegetables',
    subtitle: 'Daily greens, fresh vegetables, seasonal fruits',
    tag: 'Daily Need',
  },
  {
    id: 'Puja Essentials',
    emoji: '🪔',
    title: 'Puja Essentials',
    subtitle: 'Flowers, camphor, ghee wicks, agarbatti',
    tag: 'Devotional',
  },
  {
    id: 'Recipes',
    emoji: '🍳',
    title: 'Recipes & Meal Kits',
    subtitle: 'Ingredients grouped for classic home recipes',
    tag: 'Upcoming',
  },
  {
    id: 'Not sure yet',
    emoji: '💫',
    title: 'Not sure yet',
    subtitle: 'Just exploring what is coming to Whitefield',
    tag: 'Curious',
  },
];

export const PreferenceSection: React.FC<PreferenceSectionProps> = ({
  selectedPreference,
  onSelectPreference,
}) => {
  const handleSelect = (pref: ShoppingPreference) => {
    trackEvent('what_im_looking_for_clicked', { option: pref });
    onSelectPreference(pref);

    // Smoothly scroll down to form
    const formElement = document.getElementById('early-access-form-section');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="what-are-you-looking-for" className="py-16 sm:py-24 bg-[#FAF8F5]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-[#0A8754] text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Customer-Led Rollout</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F172A] tracking-tight mb-3">
            What would you like to find?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Tell us what matters most to your household. We prioritize partnering with vendors based on what Whitefield residents tell us.
          </p>
        </div>

        {/* Interactive Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 mb-8">
          {PREFERENCE_OPTIONS.map((opt) => {
            const isSelected = selectedPreference === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt.id)}
                className={`flex items-start gap-3.5 p-4 rounded-2xl text-left transition-all cursor-pointer border relative ${
                  isSelected
                    ? 'bg-white border-[#0A8754] shadow-md ring-2 ring-[#0A8754]/20'
                    : 'bg-white/80 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                }`}
                aria-pressed={isSelected}
              >
                <span className="text-3xl select-none shrink-0" role="img" aria-label={opt.title}>
                  {opt.emoji}
                </span>
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-display font-bold text-sm sm:text-base text-slate-900 truncate">
                      {opt.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-snug line-clamp-2">
                    {opt.subtitle}
                  </p>
                </div>

                {/* Selected Checkmark or Tag */}
                <div className="absolute top-4 right-4">
                  {isSelected ? (
                    <span className="w-5 h-5 rounded-full bg-[#0A8754] text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {opt.tag}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Visual Lead Toward Early Access Form */}
        <div className="flex flex-col items-center justify-center text-center pt-2">
          <p className="text-xs font-semibold text-slate-500 mb-2">
            Selection will be attached to your Early Access pass
          </p>
          <a
            href="#early-access-form-section"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0A8754] hover:text-[#087347] transition-colors py-1 px-3 rounded-full hover:bg-emerald-50"
          >
            <span>Proceed to registration</span>
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          </a>
        </div>
      </div>
    </section>
  );
};
