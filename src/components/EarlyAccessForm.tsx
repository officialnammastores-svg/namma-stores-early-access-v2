import React, { useState } from 'react';
import { ShoppingPreference, LeadFormData } from '../types';
import { validateIndianMobile, validateName, validateArea, validateEmailOptional } from '../lib/validation';
import { submitEarlyAccessLead } from '../services/earlyAccessService';
import { getAttribution } from '../lib/attribution';
import { trackEvent } from '../lib/analytics';
import { SuccessState } from './SuccessState';
import { SellerRegistrationForm } from './SellerRegistrationForm';
import { User, MapPin, Mail, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface EarlyAccessFormProps {
  selectedPreference?: ShoppingPreference | string;
  onPreferenceChange: (pref: ShoppingPreference) => void;
}

const POPULAR_WHITEFIELD_AREAS = [
  'ECC Road',
  'ITPL',
  'Kundalahalli',
  'Varthur',
  'Kadugodi',
  'Hope Farm',
  'Borewell Road',
  'Seegehalli',
];

const PREFERENCE_CHIPS: { id: ShoppingPreference; label: string; emoji: string }[] = [
  { id: 'Fresh Meat', label: 'Fresh Meat', emoji: '🥩' },
  { id: 'Fruits & Vegetables', label: 'Fruits & Vegetables', emoji: '🥬' },
  { id: 'Puja Essentials', label: 'Puja Essentials', emoji: '🪔' },
  { id: 'Recipes', label: 'Recipes', emoji: '🍳' },
  { id: 'Not sure yet', label: 'Not sure yet', emoji: '💫' },
];

export const EarlyAccessForm: React.FC<EarlyAccessFormProps> = ({
  selectedPreference,
  onPreferenceChange,
}) => {
  // Form State
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    phone: '',
    area: '',
    shoppingPreference: selectedPreference || '',
    email: '',
    whatsappConsent: false,
  });

  // UI States
  const [activeTab, setActiveTab] = useState<'customer' | 'seller'>('customer');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isMockSubmission, setIsMockSubmission] = useState(false);
  const [submittedLeadId, setSubmittedLeadId] = useState<string | null>(null);
  const [hasStartedForm, setHasStartedForm] = useState(false);

  // Sync preference if passed from parent
  React.useEffect(() => {
    if (selectedPreference) {
      setFormData((prev) => ({ ...prev, shoppingPreference: selectedPreference }));
    }
  }, [selectedPreference]);

  const handleFieldChange = (field: keyof LeadFormData, value: unknown) => {
    if (!hasStartedForm) {
      setHasStartedForm(true);
      trackEvent('form_started');
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear specific field error on edit
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (serverError) {
      setServerError(null);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Allow digits, spaces, hyphens
    const filtered = rawVal.replace(/[^\d\s\-+]/g, '');
    handleFieldChange('phone', filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Validate all fields
    const validationErrors: Record<string, string> = {};

    const nameCheck = validateName(formData.name);
    if (!nameCheck.isValid) {
      validationErrors.name = nameCheck.errorMessage || 'Please enter your name.';
    }

    const phoneCheck = validateIndianMobile(formData.phone);
    if (!phoneCheck.isValid) {
      validationErrors.phone = phoneCheck.errorMessage || 'Please enter a valid 10-digit number.';
    }

    const areaCheck = validateArea(formData.area);
    if (!areaCheck.isValid) {
      validationErrors.area = areaCheck.errorMessage || 'Please enter your locality.';
    }

    if (formData.email) {
      const emailCheck = validateEmailOptional(formData.email);
      if (!emailCheck.isValid) {
        validationErrors.email = emailCheck.errorMessage || 'Please enter a valid email address.';
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Focus first error element
      const firstErrorKey = Object.keys(validationErrors)[0];
      const el = document.getElementById(`field-${firstErrorKey}`);
      if (el) {
        el.focus();
      }
      return;
    }

    // Begin Submission
    setIsSubmitting(true);
    setServerError(null);
    trackEvent('form_completed');

    const attribution = getAttribution();

    try {
      const result = await submitEarlyAccessLead(formData, attribution);

      if (result.success) {
        setIsDuplicate(Boolean(result.duplicate));
        setIsMockSubmission(Boolean(result.isMock));
        setSubmittedLeadId(result.leadId || null);
        setIsCompleted(true);
      } else {
        setServerError(result.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setServerError('Unable to connect to the server. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setIsCompleted(false);
    setIsDuplicate(false);
    setIsMockSubmission(false);
    setSubmittedLeadId(null);
    setFormData({
      name: '',
      phone: '',
      area: '',
      shoppingPreference: '',
      email: '',
      whatsappConsent: false,
    });
    setErrors({});
    setServerError(null);
  };

  return (
    <section id="early-access-form-section" className="py-16 sm:py-24 bg-white border-t border-slate-200/80 scroll-mt-14">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-[#FAF8F5] border border-slate-200/90 shadow-lg p-6 sm:p-10 md:p-12">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#0A8754] text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{activeTab === 'customer' ? 'Priority Access' : 'Local Partners'}</span>
            </div>
            <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-[#0F172A] tracking-tight mb-3">
              {activeTab === 'customer' ? 'Be among the first to know.' : 'Bring your local store online.'}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {activeTab === 'customer'
                ? 'Join Namma Stores Early Access and get launch updates, community updates and early-access benefits.'
                : 'Join Namma Stores and connect with customers in your neighbourhood.'}
            </p>
          </div>

          {/* Premium Tab-Switching Selector */}
          <div className="flex justify-center mb-8">
            <div
              role="tablist"
              aria-label="Registration Type"
              className="inline-flex p-1.5 rounded-2xl bg-slate-200/80 border border-slate-300/80 shadow-inner max-w-sm w-full"
            >
              <button
                id="tab-customer"
                role="tab"
                aria-selected={activeTab === 'customer'}
                aria-controls="panel-customer"
                type="button"
                onClick={() => setActiveTab('customer')}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'customer'
                    ? 'bg-white text-[#0A8754] shadow-sm ring-1 ring-slate-900/5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="text-base select-none">🛍️</span>
                <span>CUSTOMER</span>
              </button>
              <button
                id="tab-seller"
                role="tab"
                aria-selected={activeTab === 'seller'}
                aria-controls="panel-seller"
                type="button"
                onClick={() => setActiveTab('seller')}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'seller'
                    ? 'bg-white text-[#0A8754] shadow-sm ring-1 ring-slate-900/5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="text-base select-none">🏪</span>
                <span>SELLER</span>
              </button>
            </div>
          </div>

          {/* Customer Tab Panel */}
          <div
            id="panel-customer"
            role="tabpanel"
            aria-labelledby="tab-customer"
            className={activeTab === 'customer' ? 'block' : 'hidden'}
          >
            {isCompleted ? (
              <SuccessState
                isDuplicate={isDuplicate}
                isMock={isMockSubmission}
                leadName={formData.name}
                leadPhone={formData.phone}
                leadId={submittedLeadId}
                onResetForm={handleResetForm}
              />
            ) : (
              <div>
                {/* Server Error Alert */}
                {serverError && (
                  <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5 text-xs sm:text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                    <span>{serverError}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate className="space-y-5 sm:space-y-6">
              {/* Field 1: Name */}
              <div>
                <label
                  htmlFor="field-name"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Your Name <span className="text-[#FF6A00]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="field-name"
                    type="text"
                    autoComplete="name"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    className={`w-full pl-10 pr-4 py-3 bg-white rounded-xl border text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:outline-hidden ${
                      errors.name
                        ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                        : 'border-slate-300/90 focus:border-[#0A8754] focus:ring-2 focus:ring-[#0A8754]/20'
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* Field 2: Mobile Number */}
              <div>
                <label
                  htmlFor="field-phone"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Mobile Number <span className="text-[#FF6A00]">*</span>
                </label>
                <div className="relative flex rounded-xl shadow-2xs">
                  <div className="inline-flex items-center gap-1 px-3.5 bg-slate-100 border border-r-0 border-slate-300/90 rounded-l-xl text-slate-700 font-semibold text-xs sm:text-sm select-none">
                    <span>🇮🇳 +91</span>
                  </div>
                  <input
                    id="field-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={14}
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="10-digit mobile number"
                    className={`w-full px-3.5 py-3 bg-white rounded-r-xl border text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:outline-hidden ${
                      errors.phone
                        ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                        : 'border-slate-300/90 focus:border-[#0A8754] focus:ring-2 focus:ring-[#0A8754]/20'
                    }`}
                  />
                </div>
                {errors.phone ? (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.phone}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">
                    We will send launch invites and verification only to genuine numbers.
                  </p>
                )}
              </div>

              {/* Field 3: Area / Locality */}
              <div>
                <label
                  htmlFor="field-area"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Area / Locality in Whitefield <span className="text-[#FF6A00]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    id="field-area"
                    type="text"
                    value={formData.area}
                    onChange={(e) => handleFieldChange('area', e.target.value)}
                    placeholder="e.g. ITPL, ECC Road, Kundalahalli, Varthur..."
                    className={`w-full pl-10 pr-4 py-3 bg-white rounded-xl border text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:outline-hidden ${
                      errors.area
                        ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                        : 'border-slate-300/90 focus:border-[#0A8754] focus:ring-2 focus:ring-[#0A8754]/20'
                    }`}
                  />
                </div>

                {errors.area && (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.area}</span>
                  </p>
                )}

                {/* Popular Whitefield Quick Chips */}
                <div className="mt-2.5 flex items-center flex-wrap gap-1.5">
                  <span className="text-[11px] text-slate-400 mr-1">Popular:</span>
                  {POPULAR_WHITEFIELD_AREAS.map((areaName) => (
                    <button
                      key={areaName}
                      type="button"
                      onClick={() => handleFieldChange('area', areaName)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        formData.area.toLowerCase() === areaName.toLowerCase()
                          ? 'bg-[#0A8754] text-white border-[#0A8754]'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {areaName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 4: Shopping Preference (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    What would you shop for?
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Optional</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PREFERENCE_CHIPS.map((chip) => {
                    const isSelected = formData.shoppingPreference === chip.id;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => {
                          const nextPref = isSelected ? '' : chip.id;
                          handleFieldChange('shoppingPreference', nextPref);
                          onPreferenceChange(nextPref as ShoppingPreference);
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-[#0A8754] text-[#0A8754] shadow-xs ring-1 ring-[#0A8754]'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-base select-none">{chip.emoji}</span>
                        <span className="truncate">{chip.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 5: Email (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="field-email"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Email Address
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Optional</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="field-email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    placeholder="name@example.com (for receipts/summaries)"
                    className={`w-full pl-10 pr-4 py-3 bg-white rounded-xl border text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:outline-hidden ${
                      errors.email
                        ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                        : 'border-slate-300/90 focus:border-[#0A8754] focus:ring-2 focus:ring-[#0A8754]/20'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Checkbox: WhatsApp Consent */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    id="field-whatsapp-consent"
                    type="checkbox"
                    checked={formData.whatsappConsent}
                    onChange={(e) => handleFieldChange('whatsappConsent', e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0A8754] focus:ring-[#0A8754] cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    I agree to receive Namma Stores launch updates and early-access information on WhatsApp.
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <div className="pt-4">
                <button
                  id="early-access-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-full bg-[#0A8754] hover:bg-[#087347] active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold text-base tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A8754] focus-visible:ring-offset-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                      <span>Securing your spot...</span>
                    </>
                  ) : (
                    <span>GET EARLY ACCESS</span>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-center text-[11px] text-slate-400 pt-1">
                <span>🔒 No spam guaranteed. We respect your privacy and only send launch updates.</span>
              </div>
            </form>
              </div>
            )}
          </div>

          {/* Seller Tab Panel */}
          <div
            id="panel-seller"
            role="tabpanel"
            aria-labelledby="tab-seller"
            className={activeTab === 'seller' ? 'block' : 'hidden'}
          >
            <SellerRegistrationForm />
          </div>
        </div>
      </div>
    </section>
  );
};
