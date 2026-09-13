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
const MAX_RPC_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [350, 900];

const VALID_STORE_CATEGORIES = [
  'Grocery Store',
  'Supermarket',
  'Meat Shop',
  'Fruit & Vegetable Store',
  'Puja / Religious Essentials',
  'Other',
];

function isRetryableRpcError(error: { code?: string; message?: string; status?: number } | null): boolean {
  if (!error) return false;

  const status = Number(error.status || 0);
  const code = String(error.code || '').toUpperCase();
  const message = String(error.message || '').toLowerCase();

  if ([408, 409, 429, 500, 502, 503, 504, 520, 522, 524].includes(status)) return true;
  if (['PGRST003', 'PGRST004'].includes(code)) return true;

  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('failed to fetch') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('temporarily unavailable') ||
    message.includes('connection')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Dedicated service layer for Seller Lead Registration.
 * Authoritative production path: Supabase RPC public.submit_seller_lead -> public.seller_leads
 */
export async function submitSellerLead(
  formData: SellerFormData,
  attribution: AttributionData,
): Promise<SellerSubmissionResponse> {
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
        message: emailVal.errorMessage || 'Please enter a valid email format.',
      };
    }
  }

  if (isSupabaseConfigured && supabase) {
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

    let lastError: { code?: string; message?: string; details?: string; hint?: string; status?: number } | null = null;

    for (let attempt = 1; attempt <= MAX_RPC_ATTEMPTS; attempt += 1) {
      try {
        const { data, error } = await supabase.rpc('submit_seller_lead', rpcParams);

        if (!error) {
          if (data && typeof data === 'object') {
            const resObj = data as SellerRpcSubmitLeadResult;
            const isDuplicateLead = Boolean(
              resObj.duplicate === true || resObj.status === 'duplicate',
            );
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
              message: resObj.message || "Thanks! We've received your seller details. 💚",
              phone: phoneVal.cleanDigits,
              fullName: nameVal.cleaned,
              storeName: storeVal.cleaned,
            };
          }

          const returnedId = typeof data === 'string' ? data : null;
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
            message: "Thanks! We've received your seller details. 💚",
            phone: phoneVal.cleanDigits,
            fullName: nameVal.cleaned,
            storeName: storeVal.cleaned,
          };
        }

        lastError = {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        };

        const errorMsg = error.message?.toLowerCase() || '';
        const errorCode = error.code || '';

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

        if (!isRetryableRpcError(error) || attempt === MAX_RPC_ATTEMPTS) break;
        await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 1000);
      } catch (networkOrExecErr) {
        lastError = {
          message: networkOrExecErr instanceof Error ? networkOrExecErr.message : String(networkOrExecErr),
        };

        if (attempt === MAX_RPC_ATTEMPTS) break;
        await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 1000);
      }
    }

    console.error('Supabase submit_seller_lead RPC failure after retries:', lastError);
    trackEvent('seller_lead_created', {
      status: 'failure',
      reason: lastError?.message || 'rpc_failure',
    });

    return {
      success: false,
      statusType: isRetryableRpcError(lastError) ? 'network_error' : 'database_failure',
      message: isRetryableRpcError(lastError)
        ? 'We could not connect right now. Please try again in a moment.'
        : 'Unable to complete store registration. Please try again in a moment or join our Seller WhatsApp community.',
    };
  }

  if (import.meta.env.PROD) {
    console.error(
      '⚠️ [Namma Stores Production Error] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not configured in this environment.',
    );
    trackEvent('seller_lead_created', {
      status: 'failure',
      reason: 'unconfigured_production_environment',
    });
    return {
      success: false,
      statusType: 'unconfigured',
      message:
        'Seller registration service is currently undergoing final configuration. Please join our Seller WhatsApp community directly.',
    };
  }

  if (import.meta.env.DEV && !isSupabaseConfigured) {
    return saveSellerLeadLocalFallback(
      formData,
      nameVal.cleaned,
      storeVal.cleaned,
      phoneVal.cleanDigits,
      areaVal.cleaned,
      categoryClean,
      attribution,
    );
  }

  return {
    success: false,
    statusType: 'unconfigured',
    message: 'Seller registration service is not configured.',
  };
}

function saveSellerLeadLocalFallback(
  formData: SellerFormData,
  fullNameCleaned: string,
  storeNameCleaned: string,
  phoneCleanDigits: string,
  areaCleaned: string,
  categoryClean: string,
  attribution: AttributionData,
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

    console.info('ℹ️ [Namma Stores Local Dev Preview] Stored seller lead in browser storage:', devRecord);

    trackEvent('seller_lead_created', { status: 'new_local_preview', area: areaCleaned });

    return {
      success: true,
      duplicate: false,
      statusType: 'preview_mock',
      isMock: true,
      leadId: mockId,
      message: "Thanks! We've received your seller details. 💚",
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

export async function markSellerWhatsAppCtaClicked(leadId?: string | null): Promise<void> {
  trackEvent('seller_whatsapp_cta_clicked', { has_lead: Boolean(leadId) });

  const cleanedLeadId = leadId?.trim();
  if (isSupabaseConfigured && supabase && cleanedLeadId) {
    try {
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
    try {
      const rawExisting = localStorage.getItem(LOCAL_STORAGE_SELLER_KEY);
      if (rawExisting) {
        const existing: SellerLeadRecord[] = JSON.parse(rawExisting);
        const updated = existing.map((lead) =>
          lead.id === cleanedLeadId
            ? { ...lead, whatsapp_cta_clicked: true, updated_at: new Date().toISOString() }
            : lead,
        );
        localStorage.setItem(LOCAL_STORAGE_SELLER_KEY, JSON.stringify(updated));
      }
    } catch {
      // Non-blocking in dev
    }
  }
}
