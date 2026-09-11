import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  LeadFormData, 
  AttributionData, 
  SubmissionResponse, 
  EarlyAccessLeadRecord,
  RpcSubmitLeadResult 
} from '../types';
import { validateIndianMobile, validateName, validateArea, validateEmailOptional } from '../lib/validation';
import { trackEvent } from '../lib/analytics';

const LOCAL_STORAGE_LEADS_KEY = 'namma_stores_leads_offline_v2';

/**
 * Dedicated service layer for Early Access lead management.
 * Authoritative production path: Supabase RPC public.submit_early_access_lead -> public.early_access_leads
 */
export async function submitEarlyAccessLead(
  formData: LeadFormData,
  attribution: AttributionData
): Promise<SubmissionResponse> {
  // 1. Frontend validation (UX gatekeeper)
  const nameVal = validateName(formData.name);
  if (!nameVal.isValid) {
    return { 
      success: false, 
      statusType: 'validation_error', 
      message: nameVal.errorMessage || 'Invalid name' 
    };
  }

  const phoneVal = validateIndianMobile(formData.phone);
  if (!phoneVal.isValid) {
    return { 
      success: false, 
      statusType: 'validation_error', 
      message: phoneVal.errorMessage || 'Invalid mobile number' 
    };
  }

  const areaVal = validateArea(formData.area);
  if (!areaVal.isValid) {
    return { 
      success: false, 
      statusType: 'validation_error', 
      message: areaVal.errorMessage || 'Invalid area' 
    };
  }

  if (formData.email) {
    const emailVal = validateEmailOptional(formData.email);
    if (!emailVal.isValid) {
      return {
        success: false,
        statusType: 'validation_error',
        message: emailVal.errorMessage || 'Invalid email format',
      };
    }
  }

  // 2. Normalize shopping preferences into text[] array
  let shoppingPreferencesArray: string[] = [];
  if (Array.isArray(formData.shoppingPreference)) {
    shoppingPreferencesArray = formData.shoppingPreference
      .map((p) => String(p).trim())
      .filter(Boolean);
  } else if (typeof formData.shoppingPreference === 'string' && formData.shoppingPreference.trim() !== '') {
    shoppingPreferencesArray = [formData.shoppingPreference.trim()];
  }

  // 3. Authoritative Production Path: Supabase RPC public.submit_early_access_lead
  if (isSupabaseConfigured && supabase) {
    try {
      const rpcParams = {
        p_name: nameVal.cleaned,
        p_phone: phoneVal.cleanDigits,
        p_area: areaVal.cleaned,
        p_shopping_preferences: shoppingPreferencesArray,
        p_utm_source: attribution.utm_source || null,
        p_utm_medium: attribution.utm_medium || null,
        p_utm_campaign: attribution.utm_campaign || null,
        p_utm_content: attribution.utm_content || null,
        p_utm_term: attribution.utm_term || null,
        p_whatsapp_consent: Boolean(formData.whatsappConsent),
        p_email: formData.email?.trim() || null,
      };

      const { data, error } = await supabase.rpc('submit_early_access_lead', rpcParams);

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
          trackEvent('lead_created', { status: 'duplicate', area: areaVal.cleaned });
          return {
            success: true,
            duplicate: true,
            statusType: 'duplicate',
            isMock: false,
            message: "You're already on the Namma Stores early-access list. 💚",
            phone: phoneVal.cleanDigits,
            name: nameVal.cleaned,
          };
        }

        console.error('Supabase submit_early_access_lead RPC error:', {
          code: errorCode,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        trackEvent('lead_created', { status: 'failure', reason: error.message });

        return {
          success: false,
          statusType: 'database_failure',
          message: 'Unable to complete registration. Please try again in a moment or join our WhatsApp community.',
        };
      }

      // Check if RPC returned a structured response payload (JSON / JSONB)
      if (data && typeof data === 'object') {
        const resObj = data as RpcSubmitLeadResult;
        const isDuplicateLead = Boolean(resObj.duplicate === true || resObj.status === 'duplicate');
        const extractedLeadId = resObj.id ? String(resObj.id) : null;

        if (isDuplicateLead) {
          trackEvent('lead_created', { status: 'duplicate', area: areaVal.cleaned });
          return {
            success: true,
            duplicate: true,
            statusType: 'duplicate',
            isMock: false,
            leadId: extractedLeadId,
            message: resObj.message || "You're already on the Namma Stores early-access list. 💚",
            phone: phoneVal.cleanDigits,
            name: nameVal.cleaned,
          };
        }

        trackEvent('lead_created', {
          status: 'new',
          area: areaVal.cleaned,
          has_preference: shoppingPreferencesArray.length > 0,
        });

        return {
          success: true,
          duplicate: false,
          statusType: 'real_success',
          isMock: false,
          leadId: extractedLeadId,
          message: resObj.message || "You're on the list! 🎉",
          phone: phoneVal.cleanDigits,
          name: nameVal.cleaned,
        };
      }

      // Handle legacy scalar responses (e.g. returns boolean true or lead ID string)
      let returnedId: string | null = null;
      if (typeof data === 'string') {
        returnedId = data;
      }

      trackEvent('lead_created', {
        status: 'new',
        area: areaVal.cleaned,
        has_preference: shoppingPreferencesArray.length > 0,
      });

      return {
        success: true,
        duplicate: false,
        statusType: 'real_success',
        isMock: false,
        leadId: returnedId,
        message: "You're on the list! 🎉",
        phone: phoneVal.cleanDigits,
        name: nameVal.cleaned,
      };
    } catch (networkOrExecErr) {
      console.error('Supabase submit_early_access_lead network or connection exception:', networkOrExecErr);
      trackEvent('lead_created', { status: 'failure', reason: 'network_exception' });
      return {
        success: false,
        statusType: 'network_error',
        message: 'Unable to connect to registration service. Please check your internet connection and retry.',
      };
    }
  }

  // 4. Production Guard: In production, NEVER execute fake success or localStorage fallback
  if (import.meta.env.PROD) {
    console.error(
      '⚠️ [Namma Stores Production Error] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not configured in this environment. ' +
      'Please ensure these build-time environment variables are configured in Cloudflare before deploying.'
    );
    trackEvent('lead_created', { status: 'failure', reason: 'unconfigured_production_environment' });
    return {
      success: false,
      statusType: 'unconfigured',
      message: 'Registration service is currently undergoing final configuration. Please join our WhatsApp community directly to reserve your early spot.',
    };
  }

  // 5. Local Development Fallback: ONLY executed when in DEV mode AND Supabase is NOT configured
  if (import.meta.env.DEV && !isSupabaseConfigured) {
    return saveLeadLocalFallback(
      formData,
      nameVal.cleaned,
      phoneVal.cleanDigits,
      areaVal.cleaned,
      shoppingPreferencesArray,
      attribution
    );
  }

  return {
    success: false,
    statusType: 'unconfigured',
    message: 'Registration service is not configured.',
  };
}

/**
 * Local development fallback storage helper for customer leads.
 */
function saveLeadLocalFallback(
  formData: LeadFormData,
  nameCleaned: string,
  phoneCleanDigits: string,
  areaCleaned: string,
  shoppingPreferencesArray: string[],
  attribution: AttributionData
): SubmissionResponse {
  try {
    const rawExisting = localStorage.getItem(LOCAL_STORAGE_LEADS_KEY);
    const existing: EarlyAccessLeadRecord[] = rawExisting ? JSON.parse(rawExisting) : [];

    const isDuplicate = existing.some((item) => item.phone === phoneCleanDigits);
    if (isDuplicate) {
      trackEvent('lead_created', { status: 'duplicate_offline', area: areaCleaned });
      return {
        success: true,
        duplicate: true,
        statusType: 'duplicate',
        isMock: true,
        message: "You're already on the Namma Stores early-access list. 💚",
        phone: phoneCleanDigits,
        name: nameCleaned,
      };
    }

    const mockId = 'dev_' + Math.random().toString(36).substring(2, 9);
    const devRecord: EarlyAccessLeadRecord = {
      id: mockId,
      name: nameCleaned,
      phone: phoneCleanDigits,
      area: areaCleaned,
      shopping_preferences: shoppingPreferencesArray,
      email: formData.email?.trim() || null,
      utm_source: attribution.utm_source || null,
      utm_medium: attribution.utm_medium || null,
      utm_campaign: attribution.utm_campaign || null,
      utm_content: attribution.utm_content || null,
      utm_term: attribution.utm_term || null,
      whatsapp_joined: false,
      whatsapp_consent: Boolean(formData.whatsappConsent),
      whatsapp_cta_clicked: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    existing.push(devRecord);
    localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(existing));

    console.info(
      'ℹ️ [Namma Stores Local Dev Preview] Stored lead in browser storage:',
      devRecord
    );

    trackEvent('lead_created', { status: 'new_local_preview', area: areaCleaned });

    return {
      success: true,
      duplicate: false,
      statusType: 'preview_mock',
      isMock: true,
      leadId: mockId,
      message: "You're on the list! 🎉",
      phone: phoneCleanDigits,
      name: nameCleaned,
    };
  } catch (storageErr) {
    console.warn('Dev preview storage error:', storageErr);
    return {
      success: false,
      statusType: 'database_failure',
      message: 'Unable to save lead in local preview. Please check your browser storage settings.',
    };
  }
}

/**
 * Updates `whatsapp_cta_clicked` flag safely without reading or exposing lead records.
 * Non-blocking: tracking failures never prevent user interaction.
 */
export async function markWhatsAppCtaClicked(leadId?: string | null): Promise<void> {
  trackEvent('whatsapp_cta_clicked', { has_lead: Boolean(leadId) });

  const cleanedLeadId = leadId?.trim();
  if (isSupabaseConfigured && supabase && cleanedLeadId) {
    try {
      const { error } = await supabase.rpc('mark_lead_whatsapp_clicked', {
        p_lead_id: cleanedLeadId,
      });

      if (error && import.meta.env.DEV) {
        console.warn('Notice from mark_lead_whatsapp_clicked RPC:', error.message);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('Non-blocking WhatsApp CTA tracking notice:', err);
      }
    }
  } else if (!import.meta.env.PROD && !isSupabaseConfigured && cleanedLeadId) {
    // Local dev mock update only when Supabase is not configured
    try {
      const rawExisting = localStorage.getItem(LOCAL_STORAGE_LEADS_KEY);
      if (rawExisting) {
        const existing: EarlyAccessLeadRecord[] = JSON.parse(rawExisting);
        const updated = existing.map((lead) => {
          if (lead.id === cleanedLeadId) {
            return { ...lead, whatsapp_cta_clicked: true, updated_at: new Date().toISOString() };
          }
          return lead;
        });
        localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(updated));
      }
    } catch {
      // Non-blocking in dev
    }
  }
}
