/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { LocalCommerceSection } from './components/LocalCommerceSection';
import { CategorySection } from './components/CategorySection';
import { WhyNammaStores } from './components/WhyNammaStores';
import { PreferenceSection } from './components/PreferenceSection';
import { HowItWorks } from './components/HowItWorks';
import { CommunitySection } from './components/CommunitySection';
import { EarlyAccessForm } from './components/EarlyAccessForm';
import { Footer } from './components/Footer';
import { MobileStickyBar } from './components/MobileStickyBar';
import { parseAndPersistAttribution } from './lib/attribution';
import { trackEvent } from './lib/analytics';
import { ShoppingPreference } from './types';

export default function App() {
  const [selectedPreference, setSelectedPreference] = useState<ShoppingPreference | ''>('');

  useEffect(() => {
    // Parse URL parameters (UTM tags, referrer) and persist into session storage
    const attribution = parseAndPersistAttribution();

    // Track initial page view with attribution context
    trackEvent('page_view', {
      source: attribution.utm_source,
      medium: attribution.utm_medium,
      campaign: attribution.utm_campaign,
    });
  }, []);

  const scrollToEarlyAccessForm = () => {
    const el = document.getElementById('early-access-form-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToCategories = () => {
    const el = document.getElementById('launch-categories');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectPreference = (pref: ShoppingPreference) => {
    setSelectedPreference(pref);
    scrollToEarlyAccessForm();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-slate-800 antialiased selection:bg-[#0A8754]/20 selection:text-[#0A8754]">
      {/* Navigation Header */}
      <Header onOpenEarlyAccess={scrollToEarlyAccessForm} />

      <main className="flex-1">
        {/* Section 1: Hero */}
        <Hero
          onGetEarlyAccess={scrollToEarlyAccessForm}
          onExplore={scrollToCategories}
        />

        {/* Section 2: Local Commerce & Whitefield Network */}
        <LocalCommerceSection />

        {/* Section 3: Launch Categories */}
        <CategorySection onSelectCategory={handleSelectPreference} />

        {/* Section 4: Why Namma Stores? */}
        <WhyNammaStores />

        {/* Section 5: What are you looking for? */}
        <PreferenceSection
          selectedPreference={selectedPreference}
          onSelectPreference={handleSelectPreference}
        />

        {/* Section 6: How It Works */}
        <HowItWorks />

        {/* Section 7: Whitefield Resident Community */}
        <CommunitySection />

        {/* Section 8: Early Access Registration Form & Success State */}
        <EarlyAccessForm
          selectedPreference={selectedPreference}
          onPreferenceChange={(pref) => setSelectedPreference(pref)}
        />
      </main>

      {/* Footer */}
      <Footer onScrollToForm={scrollToEarlyAccessForm} />

      {/* Mobile Sticky Quick Access Bar */}
      <MobileStickyBar onJoinClick={scrollToEarlyAccessForm} />
    </div>
  );
}

