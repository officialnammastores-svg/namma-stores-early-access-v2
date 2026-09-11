import React, { useState, useEffect } from 'react';
import { NammaStoresLogo } from './NammaStoresLogo';
import { MapPin, Menu, X, ArrowRight, MessageCircle } from 'lucide-react';
import { trackEvent } from '../lib/analytics';

interface HeaderProps {
  onOpenEarlyAccess: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenEarlyAccess }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const scrollToSection = (id: string, eventName?: string) => {
    setMobileMenuOpen(false);
    if (eventName) {
      trackEvent('category_clicked', { target: id });
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCtaClick = () => {
    setMobileMenuOpen(false);
    trackEvent('hero_cta_clicked', { source: 'header_button' });
    onOpenEarlyAccess();
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#FAF8F5]/90 backdrop-blur-md shadow-xs border-b border-emerald-950/5 py-3 sm:py-3.5'
            : 'bg-transparent py-4 sm:py-5'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Logo & Location Badge */}
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A8754] rounded-lg"
              aria-label="Namma Stores - Return to top"
            >
              <NammaStoresLogo variant="compact" />
            </a>

            {/* Desktop Location Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#0A8754] border border-emerald-200/60 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>Whitefield, Bangalore</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-700">
            <button
              onClick={() => scrollToSection('why-namma')}
              className="hover:text-[#0A8754] transition-colors py-1 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A8754] rounded"
            >
              Why Namma Stores
            </button>
            <button
              onClick={() => scrollToSection('launch-categories')}
              className="hover:text-[#0A8754] transition-colors py-1 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A8754] rounded"
            >
              Categories
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-[#0A8754] transition-colors py-1 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A8754] rounded"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('community')}
              className="hover:text-[#0A8754] transition-colors py-1 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A8754] rounded"
            >
              Community
            </button>
          </nav>

          {/* Primary Action Button */}
          <div className="flex items-center gap-3">
            <button
              id="header-early-access-btn"
              onClick={handleCtaClick}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0A8754] hover:bg-[#087347] active:scale-[0.98] text-white text-xs sm:text-sm font-bold tracking-wide shadow-sm hover:shadow-md transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A8754] focus-visible:ring-offset-2"
            >
              <span>GET EARLY ACCESS</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A8754] cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-over Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="relative ml-auto w-full max-w-xs bg-[#FAF8F5] h-full shadow-2xl flex flex-col p-6 border-l border-slate-200"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <NammaStoresLogo variant="compact" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="py-2 mt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#0A8754] border border-emerald-200/60 text-xs font-semibold">
                <MapPin className="w-3.5 h-3.5" />
                <span>Launching in Whitefield, Bangalore</span>
              </div>
            </div>

            <nav className="flex flex-col gap-4 mt-6 text-base font-semibold text-slate-800">
              <button
                onClick={() => scrollToSection('why-namma')}
                className="text-left py-2 hover:text-[#0A8754] transition-colors border-b border-slate-100"
              >
                Why Namma Stores
              </button>
              <button
                onClick={() => scrollToSection('launch-categories')}
                className="text-left py-2 hover:text-[#0A8754] transition-colors border-b border-slate-100"
              >
                Launch Categories
              </button>
              <button
                onClick={() => scrollToSection('what-are-you-looking-for')}
                className="text-left py-2 hover:text-[#0A8754] transition-colors border-b border-slate-100"
              >
                What Are You Looking For?
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-left py-2 hover:text-[#0A8754] transition-colors border-b border-slate-100"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('community')}
                className="text-left py-2 hover:text-[#0A8754] transition-colors border-b border-slate-100"
              >
                Community
              </button>
            </nav>

            <div className="mt-auto pt-6 flex flex-col gap-3">
              <button
                onClick={handleCtaClick}
                className="w-full py-3 px-4 rounded-xl bg-[#0A8754] hover:bg-[#087347] active:scale-[0.98] text-white font-bold text-center text-sm shadow-sm transition-all"
              >
                GET EARLY ACCESS
              </button>

              <a
                href="https://chat.whatsapp.com/GsRyrfB4lzRASwYiAp9Ont"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackEvent('whatsapp_cta_clicked', { source: 'mobile_drawer' });
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-white border border-emerald-300 text-[#0A8754] font-semibold text-center text-xs flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>Join WhatsApp Group</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
