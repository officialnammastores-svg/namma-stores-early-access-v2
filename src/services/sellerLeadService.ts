import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  SellerFormData,
  AttributionData,
  SellerSubmissionResponse,
  SellerLeadRecord,
  SellerRpcSubmitLeadResult,
} from '../types';
import {
  validateIndianMobile,
  validateSellerFullName,
  validateStoreName,
  validateArea,
  validateEmailOptional,
} from '../lib/validation';
import { trackEvent } from '../lib/analytics';

const LOCAL_STORAGE_SELLER_KEY = 'namma_stores_seller_leads_offline_v1';

const VALID_STORE_CATEGORIES = [
  'Grocery Store',
  'Supermarket',
  'Meat Shop',
  'Fruit & Vegetable Store',
  'Puja / Religious Essentials',
  'Other',
];

/**
 * Dedicated service layer for Seller Lead Registration.
 * Authoritative production path: Supabase RPC public.submit_seller_lead -> public.seller_leads
 */
export async function submitSellerLead(
  formData: SellerFormData,
  attribution: AttributionData
): Promise<SellerSubmissionResponse> {
  // 1. Frontend validation (UX gatekeeper)
  const nameVal = validateSellerFullName(formData.fullName);
  if (!nameVal.isValid) {
    return {
      success: false,
      statusType: 'validation_error',
      message: nameVal.errorMessage || 'Please enter your full name.',
    };
  }

  const storeVal = validateStoreName(formData.storeName);
  if (!storeVal.isValid) {
    return {
      success: false,
      statusType: 'validation_error',
      message: storeVal.errorMessage || 'Please enter your store name.',
    };
  }

  const phoneVal = validateIndianMobile(formData.phone);
  if (!phoneVal.isValid) {
    return {
      success: false,
      statusType: 'validation_error',
      message: phoneVal.errorMessage || 'Please enter a valid 10-digit mobile number.',
    };
  }

  const areaVal = validateArea(formData.area);
  if (!areaVal.isValid) {
    return {
      success: false,
      statusType: 'validation_error',
      message: areaVal.errorMessage || 'Please enter your area / locality.',
    };
  }

  const categoryClean = (formData.storeCategory || '').trim();
  if (!categoryClean || !VALID_STORE_CATEGORIES.includes(categoryClean)) {
    return {
      success: false,
      statusType: 'validation_error',
      message: 'Please select a valid store category.',
    };
  }

  if (formData.sellsOnline === null || formData.sellsOnline === undefined) {
    return {
      success: false,
      statusType: 'validation_error',
      message: 'Please select whether you currently sell online.',
    };
  }

  if (formData.email) {
    const emailVal = validateEmailOptional(formData.email);
    if (!emailVal.isValid) {
      return {
        success: false,
        statusType: 'validation_error',
        message: emailVal.errorMessage || 'Please enter a valid email address.',
      };
    }
  }

  // 2. Authoritative Production Path: Supabase RPC public.submit_seller_lead
  if (isSupabaseConfigured && supabase) {
    try {
      const rpcParams = {
        p_full_name: nameVal.cleaned,
        p_store_name: storeVal.cleaned,
        p_phone: phoneVal.cleanDigits,
        p_area: areaVal.cleaned,
        p_store_category: categoryClean,
        p_sells_online: Boolean(formData.sellsOnline),
        p_email: formData.email?.trim() || null,
        p_whatsapp_consent: Boolean(formData.whatsappConsent),
        p_source: 'website_seller',
        p_utm_source: attribution.utm_source || null,
        p_utm_medium: attribution.utm_medium || null,
        p_utm_campaign: attribution.utm_campaign || null,
        p_utm_content: attribution.utm_content || null,
        p_utm_term: attribution.utm_term || null,
        p_utm_id: attribution.utm_id || null,
        p_adset_id: attribution.adset_id || null,
        p_ad_id: attribution.ad_id || null,
        p_placement: attribution.placement || null,
      };

      const { data, error } = await supabase.rpc('submit_seller_lead', rpcParams);

      if (error) {
        const errorMsg = error.message?.toLowerCase() || '';
        const errorCode = error.code || '';

        // Handle unique constraint / duplicate phone detection from PostgreSQL
        if (
          errorCode === '23505' ||
          errorMsg.includes('duplicate') ||
          errorMsg.includes('unique') ||
          errorMsg.includes('already exists')
        ) {
          trackEvent('seller_lead_created', { status: 'duplicate', area: areaVal.cleaned });
          return {
            success: true,
            duplicate: true,
            statusType: 'duplicate',
            isMock: false,
            message: "You're already on the Namma Stores seller list. 💚",
            phone: phoneVal.cleanDigits,
            fullName: nameVal.cleaned,
            storeName: storeVal.cleaned,
          };
        }

        console.error('Supabase submit_seller_lead RPC error:', {
          code: errorCode,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        trackEvent('seller_lead_created', { status: 'failure', reason: error.message });

        return {
          success: false,
          statusType: 'database_failure',
          message: 'Unable to complete store registration. Please try again in a moment or join our Seller WhatsApp community.',
        };
      }

      // Check if RPC returned a structured response payload (JSON / JSONB)
      if (data && typeof data === 'object') {
        const resObj = data as SellerRpcSubmitLeadResult;
        const isDuplicateLead = Boolean(resObj.duplicate === true || resObj.status === 'duplicate');
        const extractedLeadId = resObj.id ? String(resObj.id) : null;

        if (isDuplicateLead) {
          trackEvent('seller_lead_created', { status: 'duplicate', area: areaVal.cleaned });
          return {
            success: true,
            duplicate: true,
            statusType: 'duplicate',
            isMock: false,
            leadId: extractedLeadId,
            message: resObj.message || "You're already on the Namma Stores seller list. 💚",
            phone: phoneVal.cleanDigits,
            fullName: nameVal.cleaned,
            storeName: storeVal.cleaned,
          };
        }

        trackEvent('seller_lead_created', {
          status: 'new',
          area: areaVal.cleaned,
          category: categoryClean,
        });

        return {
          success: true,
          duplicate: false,
          statusType: 'real_success',
          isMock: false,
          leadId: extractedLeadId,
          message: resObj.message || "Thanks! We've received your details. 💚",
          phone: phoneVal.cleanDigits,
          fullName: nameVal.cleaned,
          storeName: storeVal.cleaned,
        };
      }

      // Handle scalar responses (e.g. UUID string)
      let returnedId: string | null = null;
      if (typeof data === 'string') {
        returnedId = data;
      }

      trackEvent('seller_lead_created', {
        status: 'new',
        area: areaVal.cleaned,
        category: categoryClean,
      });

      return {
        success: true,
        duplicate: false,
        statusType: 'real_success',
        isMock: false,
        leadId: returnedId,
        message: "Thanks! We've received your details. 💚",
        phone: phoneVal.cleanDigits,
        fullName: nameVal.cleaned,
        storeName: storeVal.cleaned,
      };
    } catch (networkOrExecErr) {
      console.error('Supabase submit_seller_lead network or connection exception:', networkOrExecErr);
      trackEvent('seller_lead_created', { status: 'failure', reason: 'network_exception' });
      return {
        success: false,
        statusType: 'network_error',
        message: 'Unable to connect to registration service. Please check your internet connection and retry.',
      };
    }
  }

  // 3. Production Guard: In production, NEVER execute fake success or localStorage fallback
  if (import.meta.env.PROD) {
    console.error(
      '⚠️ [Namma Stores Production Error] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not configured in this environment.'
    );
    trackEvent('seller_lead_created', { status: 'failure', reason: 'unconfigured_production_environment' });
    return {
      success: false,
      statusType: 'unconfigured',
      message: 'Seller registration service is currently undergoing final configuration. Please join our Seller WhatsApp community directly.',
    };
  }

  // 4. Local Development Fallback: ONLY executed when in DEV mode AND Supabase is NOT configured
  if (import.meta.env.DEV && !isSupabaseConfigured) {
    return saveSellerLeadLocalFallback(
      formData,
      nameVal.cleaned,
      storeVal.cleaned,
      phoneVal.cleanDigits,
      areaVal.cleaned,
      categoryClean,
      attribution
    );
  }

  return {
    success: false,
    statusType: 'unconfigured',
    message: 'Seller registration service is not configured.',
  };
}

/**
 * Local development fallback storage helper for seller leads.
 */
function saveSellerLeadLocalFallback(
  formData: SellerFormData,
  fullNameCleaned: string,
  storeNameCleaned: string,
  phoneCleanDigits: string,
  areaCleaned: string,
  categoryClean: string,
  attribution: AttributionData
): SellerSubmissionResponse {
  try {
    const rawExisting = localStorage.getItem(LOCAL_STORAGE_SELLER_KEY);
    const existing: SellerLeadRecord[] = rawExisting ? JSON.parse(rawExisting) : [];

    const isDuplicate = existing.some((item) => item.phone === phoneCleanDigits);
    if (isDuplicate) {
      trackEvent('seller_lead_created', { status: 'duplicate_offline', area: areaCleaned });
      return {
        success: true,
        duplicate: true,
        statusType: 'duplicate',
        isMock: true,
        message: "You're already on the Namma Stores seller list. 💚",
        phone: phoneCleanDigits,
        fullName: fullNameCleaned,
        storeName: storeNameCleaned,
      };
    }

    const mockId = 'seller_dev_' + Math.random().toString(36).substring(2, 9);
    const devRecord: SellerLeadRecord = {
      id: mockId,
      full_name: fullNameCleaned,
      store_name: storeNameCleaned,
      phone: phoneCleanDigits,
      area: areaCleaned,
      store_category: categoryClean,
      sells_online: Boolean(formData.sellsOnline),
      email: formData.email?.trim() || null,
      whatsapp_consent: Boolean(formData.whatsappConsent),
      whatsapp_cta_clicked: false,
      status: 'new',
      source: 'website_seller',
      utm_source: attribution.utm_source || null,
      utm_medium: attribution.utm_medium || null,
      utm_campaign: attribution.utm_campaign || null,
      utm_content: attribution.utm_content || null,
      utm_term: attribution.utm_term || null,
      utm_id: attribution.utm_id || null,
      adset_id: attribution.adset_id || null,
      ad_id: attribution.ad_id || null,
      placement: attribution.placement || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    existing.push(devRecord);
    localStorage.setItem(LOCAL_STORAGE_SELLER_KEY, JSON.stringify(existing));

    console.info(
      'ℹ️ [Namma Stores Local Dev Preview] Stored seller lead in browser storage:',
      devRecord
    );

    trackEvent('seller_lead_created', { status: 'new_local_preview', area: areaCleaned });

    return {
      success: true,
      duplicate: false,
      statusType: 'preview_mock',
      isMock: true,
      leadId: mockId,
      message: "Thanks! We've received your details. 💚",
      phone: phoneCleanDigits,
      fullName: fullNameCleaned,
      storeName: storeNameCleaned,
    };
  } catch (storageErr) {
    console.warn('Dev preview seller storage error:', storageErr);
    return {
      success: false,
      statusType: 'database_failure',
      message: 'Unable to save store details in local preview. Please check browser settings.',
    };
  }
}

/**
 * Updates seller `whatsapp_cta_clicked` flag safely via RPC without exposing lead data.
 * Non-blocking: tracking failures never prevent user interaction.
 */
export async function markSellerWhatsAppCtaClicked(leadId?: string | null): Promise<void> {
  trackEvent('seller_whatsapp_cta_clicked', { has_lead: Boolean(leadId) });

  const cleanedLeadId = leadId?.trim();
  if (isSupabaseConfigured && supabase && cleanedLeadId) {
    try {
      // Authoritative RPC: public.mark_seller_lead_whatsapp_clicked
      const { error } = await supabase.rpc('mark_seller_lead_whatsapp_clicked', {
        p_lead_id: cleanedLeadId,
      });

      if (error && import.meta.env.DEV) {
        console.warn('Notice from mark_seller_lead_whatsapp_clicked RPC:', error.message);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('Non-blocking Seller WhatsApp CTA tracking notice:', err);
      }
    }
  } else if (!import.meta.env.PROD && !isSupabaseConfigured && cleanedLeadId) {
    // Local dev mock update only when Supabase is not configured
    try {
      const rawExisting = localStorage.getItem(LOCAL_STORAGE_SELLER_KEY);
      if (rawExisting) {
        const existing: SellerLeadRecord[] = JSON.parse(rawExisting);
        const updated = existing.map((lead) => {
          if (lead.id === cleanedLeadId) {
            return { ...lead, whatsapp_cta_clicked: true, updated_at: new Date().toISOString() };
          }
          return lead;
        });
        localStorage.setItem(LOCAL_STORAGE_SELLER_KEY, JSON.stringify(updated));
      }
    } catch {
      // Non-blocking in dev
    }
  }
}
