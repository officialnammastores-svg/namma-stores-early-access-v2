import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { trackEvent } from '../lib/analytics';

interface MobileStickyBarProps {
  onJoinClick: () => void;
}

export const MobileStickyBar: React.FC<MobileStickyBarProps> = ({ onJoinClick }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show only after scrolling past hero (~350px) and hide if near bottom form
      const scrollY = window.scrollY;
      const formEl = document.getElementById('early-access-form-section');
      if (formEl) {
        const rect = formEl.getBoundingClientRect();
        // If form is currently in view, hide floating bar
        if (rect.top <= window.innerHeight && rect.bottom >= 0) {
          setVisible(false);
          return;
        }
      }
      setVisible(scrollY > 380);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-3 inset-x-3 z-30 sm:hidden animate-fade-in">
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 pl-1 min-w-0">
          <div className="w-2 h-2 rounded-full bg-[#FF6A00] animate-pulse shrink-0" />
          <div className="flex flex-col leading-tight truncate">
            <span className="text-xs font-bold text-white truncate">
              Whitefield Early Access
            </span>
            <span className="text-[10px] text-slate-400 truncate flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400 inline" />
              Join the Early Access Community
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            trackEvent('hero_cta_clicked', { source: 'mobile_sticky_bar' });
            onJoinClick();
          }}
          className="py-2 px-4 rounded-xl bg-[#0A8754] hover:bg-[#087347] active:scale-95 text-white font-bold text-xs tracking-wide shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <span>GET ACCESS</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
