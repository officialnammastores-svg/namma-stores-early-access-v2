import React, { useState } from 'react';
import { SellerFormData, StoreCategory } from '../types';
import {
  validateIndianMobile,
  validateSellerFullName,
  validateStoreName,
  validateArea,
  validateEmailOptional,
} from '../lib/validation';
import { submitSellerLead } from '../services/sellerLeadService';
import { getAttribution } from '../lib/attribution';
import { trackEvent } from '../lib/analytics';
import { SellerSuccessState } from './SellerSuccessState';
import { User, Store, Phone, MapPin, Mail, Loader2, AlertCircle, Check } from 'lucide-react';

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

const STORE_CATEGORIES: StoreCategory[] = [
  'Grocery Store',
  'Supermarket',
  'Meat Shop',
  'Fruit & Vegetable Store',
  'Puja / Religious Essentials',
  'Other',
];

export const SellerRegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<SellerFormData>({
    fullName: '',
    storeName: '',
    phone: '',
    area: '',
    storeCategory: '',
    sellsOnline: null,
    email: '',
    whatsappConsent: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isMockSubmission, setIsMockSubmission] = useState(false);
  const [submittedLeadId, setSubmittedLeadId] = useState<string | null>(null);
  const [hasStartedForm, setHasStartedForm] = useState(false);

  const handleFieldChange = (field: keyof SellerFormData, value: unknown) => {
    if (!hasStartedForm) {
      setHasStartedForm(true);
      trackEvent('seller_form_started');
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

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
    const filtered = rawVal.replace(/[^\d\s\-+]/g, '');
    handleFieldChange('phone', filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    const validationErrors: Record<string, string> = {};

    const nameCheck = validateSellerFullName(formData.fullName);
    if (!nameCheck.isValid) {
      validationErrors.fullName = nameCheck.errorMessage || 'Please enter your full name.';
    }

    const storeCheck = validateStoreName(formData.storeName);
    if (!storeCheck.isValid) {
      validationErrors.storeName = storeCheck.errorMessage || 'Please enter your store name.';
    }

    const phoneCheck = validateIndianMobile(formData.phone);
    if (!phoneCheck.isValid) {
      validationErrors.phone = phoneCheck.errorMessage || 'Please enter a valid 10-digit mobile number.';
    }

    const areaCheck = validateArea(formData.area);
    if (!areaCheck.isValid) {
      validationErrors.area = areaCheck.errorMessage || 'Please enter your area / locality.';
    }

    if (!formData.storeCategory) {
      validationErrors.storeCategory = 'Please select a store category.';
    }

    if (formData.sellsOnline === null) {
      validationErrors.sellsOnline = 'Please select whether you currently sell online.';
    }

    if (formData.email) {
      const emailCheck = validateEmailOptional(formData.email);
      if (!emailCheck.isValid) {
        validationErrors.email = emailCheck.errorMessage || 'Please enter a valid email address.';
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErrorKey = Object.keys(validationErrors)[0];
      const el = document.getElementById(`field-seller-${firstErrorKey}`);
      if (el) {
        el.focus();
      }
      return;
    }

    setIsSubmitting(true);
    setServerError(null);
    trackEvent('seller_form_completed');

    const attribution = getAttribution();

    try {
      const result = await submitSellerLead(formData, attribution);

      if (result.success) {
        setIsDuplicate(Boolean(result.duplicate));
        setIsMockSubmission(Boolean(result.isMock));
        setSubmittedLeadId(result.leadId || null);
        setIsCompleted(true);
      } else {
        setServerError(result.message || 'Unable to submit store details. Please try again.');
      }
    } catch {
      setServerError('Unable to connect to the server. Please check your connection.');
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
      fullName: '',
      storeName: '',
      phone: '',
      area: '',
      storeCategory: '',
      sellsOnline: null,
      email: '',
      whatsappConsent: false,
    });
    setErrors({});
    setServerError(null);
  };

  if (isCompleted) {
    return (
      <SellerSuccessState
        isDuplicate={isDuplicate}
        isMock={isMockSubmission}
        fullName={formData.fullName}
        storeName={formData.storeName}
        phone={formData.phone}
        leadId={submittedLeadId}
        onResetForm={handleResetForm}
      />
    );
  }

  return (
    <div>
      {/* Seller Benefit Highlights */}
      <div className="mb-8 p-4 rounded-2xl bg-white/80 border border-slate-200/90 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-lg select-none">📍</span>
            <div className="text-xs">
              <span className="font-bold text-slate-800 block">Reach nearby customers</span>
              <span className="text-slate-500 text-[11px]">Across Whitefield societies</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-lg select-none">📦</span>
            <div className="text-xs">
              <span className="font-bold text-slate-800 block">Simple online ordering</span>
              <span className="text-slate-500 text-[11px]">Direct WhatsApp & Web flow</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-lg select-none">🤝</span>
            <div className="text-xs">
              <span className="font-bold text-slate-800 block">Built for local stores</span>
              <span className="text-slate-500 text-[11px]">Zero complicated hardware</span>
            </div>
          </div>
        </div>
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-5 sm:space-y-6">
        {/* Row: Full Name & Store Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Field 1: Full Name */}
          <div>
            <label
              htmlFor="field-seller-fullName"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Full Name <span className="text-[#FF6A00]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="field-seller-fullName"
                type="text"
                autoComplete="name"
                maxLength={80}
                value={formData.fullName}
                onChange={(e) => handleFieldChange('fullName', e.target.value)}
                placeholder="Your full name"
                className={`w-full pl-10 pr-4 py-3 bg-white rounded-xl border text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:outline-hidden ${
                  errors.fullName
                    ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                    : 'border-slate-300/90 focus:border-[#0A8754] focus:ring-2 focus:ring-[#0A8754]/20'
                }`}
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.fullName}</span>
              </p>
            )}
          </div>

          {/* Field 2: Store Name */}
          <div>
            <label
              htmlFor="field-seller-storeName"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Store Name <span className="text-[#FF6A00]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Store className="w-4 h-4" />
              </div>
              <input
                id="field-seller-storeName"
                type="text"
                autoComplete="organization"
                maxLength={120}
                value={formData.storeName}
                onChange={(e) => handleFieldChange('storeName', e.target.value)}
                placeholder="e.g. Sri Balaji Supermarket"
                className={`w-full pl-10 pr-4 py-3 bg-white rounded-xl border text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all focus:outline-hidden ${
                  errors.storeName
                    ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                    : 'border-slate-300/90 focus:border-[#0A8754] focus:ring-2 focus:ring-[#0A8754]/20'
                }`}
              />
            </div>
            {errors.storeName && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.storeName}</span>
              </p>
            )}
          </div>
        </div>

        {/* Row: Phone Number & Area */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Field 3: Phone */}
          <div>
            <label
              htmlFor="field-seller-phone"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Phone Number <span className="text-[#FF6A00]">*</span>
            </label>
            <div className="relative flex rounded-xl shadow-2xs">
              <div className="inline-flex items-center gap-1 px-3.5 bg-slate-100 border border-r-0 border-slate-300/90 rounded-l-xl text-slate-700 font-semibold text-xs sm:text-sm select-none">
                <span>🇮🇳 +91</span>
              </div>
              <input
                id="field-seller-phone"
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
            {errors.phone && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.phone}</span>
              </p>
            )}
          </div>

          {/* Field 4: Area / Locality */}
          <div>
            <label
              htmlFor="field-seller-area"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Area / Locality in Whitefield <span className="text-[#FF6A00]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                id="field-seller-area"
                type="text"
                maxLength={100}
                value={formData.area}
                onChange={(e) => handleFieldChange('area', e.target.value)}
                placeholder="e.g. ECC Road, ITPL, Kadugodi..."
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
          </div>
        </div>

        {/* Quick Area Chips for Sellers */}
        <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
          <span className="text-[11px] text-slate-400 mr-1">Popular Areas:</span>
          {POPULAR_WHITEFIELD_AREAS.slice(0, 6).map((areaName) => (
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

        {/* Row: Store Category & Sells Online */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Field 5: Store Category */}
          <div>
            <label
              htmlFor="field-seller-storeCategory"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Store Category <span className="text-[#FF6A00]">*</span>
            </label>
            <div className="relative">
              <select
                id="field-seller-storeCategory"
                value={formData.storeCategory}
                onChange={(e) => handleFieldChange('storeCategory', e.target.value)}
                className={`w-full px-4 py-3 bg-white rounded-xl border text-sm font-medium text-slate-900 transition-all focus:outline-hidden appearance-none cursor-pointer ${
                  errors.storeCategory
                    ? 'border-red-400 focus:ring-2 focus:ring-red-400/20'
                    : 'border-slate-300/90 focus:border-[#0A8754] focus:ring-2 focus:ring-[#0A8754]/20'
                }`}
              >
                <option value="" disabled>
                  Select store category
                </option>
                {STORE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                ▼
              </div>
            </div>
            {errors.storeCategory && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.storeCategory}</span>
              </p>
            )}
          </div>

          {/* Field 6: Do you currently sell online? */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Do you currently sell online? <span className="text-[#FF6A00]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5 h-[46px]">
              <button
                type="button"
                id="field-seller-sellsOnline-yes"
                onClick={() => handleFieldChange('sellsOnline', true)}
                className={`flex items-center justify-center gap-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  formData.sellsOnline === true
                    ? 'bg-emerald-50 border-[#0A8754] text-[#0A8754] ring-1 ring-[#0A8754]'
                    : 'bg-white border-slate-300/90 text-slate-700 hover:border-slate-400'
                }`}
              >
                {formData.sellsOnline === true && <Check className="w-4 h-4 text-[#0A8754]" />}
                <span>Yes, we do</span>
              </button>
              <button
                type="button"
                id="field-seller-sellsOnline-no"
                onClick={() => handleFieldChange('sellsOnline', false)}
                className={`flex items-center justify-center gap-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  formData.sellsOnline === false
                    ? 'bg-emerald-50 border-[#0A8754] text-[#0A8754] ring-1 ring-[#0A8754]'
                    : 'bg-white border-slate-300/90 text-slate-700 hover:border-slate-400'
                }`}
              >
                {formData.sellsOnline === false && <Check className="w-4 h-4 text-[#0A8754]" />}
                <span>No, not yet</span>
              </button>
            </div>
            {errors.sellsOnline && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.sellsOnline}</span>
              </p>
            )}
          </div>
        </div>

        {/* Field 7: Email (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="field-seller-email"
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
              id="field-seller-email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              placeholder="store@example.com (for seller communications)"
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

        {/* Field 8: Checkbox: Contact Consent (whatsapp_consent) */}
        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              id="field-seller-whatsapp-consent"
              type="checkbox"
              checked={formData.whatsappConsent}
              onChange={(e) => handleFieldChange('whatsappConsent', e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0A8754] focus:ring-[#0A8754] cursor-pointer"
            />
            <span className="text-xs text-slate-600 leading-relaxed">
              I agree to be contacted by the Namma Stores team regarding seller onboarding.
            </span>
          </label>
        </div>

        {/* Submit CTA */}
        <div className="pt-4">
          <button
            id="seller-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-full bg-[#0A8754] hover:bg-[#087347] active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold text-base tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A8754] focus-visible:ring-offset-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>Registering your store...</span>
              </>
            ) : (
              <span>JOIN AS A SELLER</span>
            )}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-center text-[11px] text-slate-400 pt-1">
          <span>🔒 Direct partner registration. Your business details are kept safe and confidential.</span>
        </div>
      </form>
    </div>
  );
};
