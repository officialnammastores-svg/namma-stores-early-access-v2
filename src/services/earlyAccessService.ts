import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  LeadFormData,
  AttributionData,
  SubmissionResponse,
  EarlyAccessLeadRecord,
  RpcSubmitLeadResult,
} from '../types';
import {
  validateIndianMobile,
  validateName,
  validateArea,
  validateEmailOptional,
} from '../lib/validation';
import { trackEvent } from '../lib/analytics';

const LOCAL_STORAGE_LEADS_KEY = 'namma_stores_leads_offline_v2';
const MAX_RPC_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [350, 900];

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
 * Dedicated service layer for Early Access lead management.
 * Authoritative production path: Supabase RPC public.submit_early_access_lead -> public.early_access_leads
 */
export async function submitEarlyAccessLead(
  formData: LeadFormData,
  attribution: AttributionData,
): Promise<SubmissionResponse> {
  const nameVal = validateName(formData.name);
  if (!nameVal.isValid) {
    return {
      success: false,
      statusType: 'validation_error',
      message: nameVal.errorMessage || 'Invalid name',
    };
  }

  const phoneVal = validateIndianMobile(formData.phone);
  if (!phoneVal.isValid) {
    return {
      success: false,
      statusType: 'validation_error',
      message: phoneVal.errorMessage || 'Invalid mobile number',
    };
  }

  const areaVal = validateArea(formData.area);
  if (!areaVal.isValid) {
    return {
      success: false,
      statusType: 'validation_error',
      message: areaVal.errorMessage || 'Invalid area',
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

  let shoppingPreferencesArray: string[] = [];
  if (Array.isArray(formData.shoppingPreference)) {
    shoppingPreferencesArray = formData.shoppingPreference
      .map((p) => String(p).trim())
      .filter(Boolean);
  } else if (
    typeof formData.shoppingPreference === 'string' &&
    formData.shoppingPreference.trim() !== ''
  ) {
    shoppingPreferencesArray = [formData.shoppingPreference.trim()];
  }

  if (isSupabaseConfigured && supabase) {
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
      p_utm_id: attribution.utm_id || null,
      p_adset_id: attribution.adset_id || null,
      p_ad_id: attribution.ad_id || null,
      p_placement: attribution.placement || null,
      p_whatsapp_consent: Boolean(formData.whatsappConsent),
      p_email: formData.email?.trim() || null,
    };

    let lastError: { code?: string; message?: string; details?: string; hint?: string; status?: number } | null = null;

    for (let attempt = 1; attempt <= MAX_RPC_ATTEMPTS; attempt += 1) {
      try {
        const { data, error } = await supabase.rpc('submit_early_access_lead', rpcParams);

        if (!error) {
          if (data && typeof data === 'object') {
            const resObj = data as RpcSubmitLeadResult;
            const isDuplicateLead = Boolean(
              resObj.duplicate === true || resObj.status === 'duplicate',
            );
            const extractedLeadId = resObj.id ? String(resObj.id) : null;

            if (isDuplicateLead) {
              trackEvent('lead_created', { status: 'duplicate', area: areaVal.cleaned });
              return {
                success: true,
                duplicate: true,
                statusType: 'duplicate',
                isMock: false,
                leadId: extractedLeadId,
                message:
                  resObj.message ||
                  "You're already on the Namma Stores early-access list. 💚",
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

          const returnedId = typeof data === 'string' ? data : null;
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

        if (!isRetryableRpcError(error) || attempt === MAX_RPC_ATTEMPTS) {
          break;
        }

        await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 1000);
      } catch (networkOrExecErr) {
        lastError = {
          message: networkOrExecErr instanceof Error ? networkOrExecErr.message : String(networkOrExecErr),
        };

        if (attempt === MAX_RPC_ATTEMPTS) break;
        await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 1000);
      }
    }

    console.error('Supabase submit_early_access_lead RPC failure after retries:', lastError);
    trackEvent('lead_created', {
      status: 'failure',
      reason: lastError?.message || 'rpc_failure',
    });

    return {
      success: false,
      statusType: isRetryableRpcError(lastError) ? 'network_error' : 'database_failure',
      message: isRetryableRpcError(lastError)
        ? 'We could not connect right now. Please try again in a moment.'
        : 'Unable to complete registration. Please try again in a moment or join our WhatsApp community.',
    };
  }

  if (import.meta.env.PROD) {
    console.error(
      '⚠️ [Namma Stores Production Error] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not configured in this environment.',
    );
    trackEvent('lead_created', {
      status: 'failure',
      reason: 'unconfigured_production_environment',
    });
    return {
      success: false,
      statusType: 'unconfigured',
      message:
        'Registration service is currently undergoing final configuration. Please join our WhatsApp community directly to reserve your early spot.',
    };
  }

  if (import.meta.env.DEV && !isSupabaseConfigured) {
    return saveLeadLocalFallback(
      formData,
      nameVal.cleaned,
      phoneVal.cleanDigits,
      areaVal.cleaned,
      shoppingPreferencesArray,
      attribution,
    );
  }

  return {
    success: false,
    statusType: 'unconfigured',
    message: 'Registration service is not configured.',
  };
}

function saveLeadLocalFallback(
  formData: LeadFormData,
  nameCleaned: string,
  phoneCleanDigits: string,
  areaCleaned: string,
  shoppingPreferencesArray: string[],
  attribution: AttributionData,
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

    console.info('ℹ️ [Namma Stores Local Dev Preview] Stored lead in browser storage:', devRecord);

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
    try {
      const rawExisting = localStorage.getItem(LOCAL_STORAGE_LEADS_KEY);
      if (rawExisting) {
        const existing: EarlyAccessLeadRecord[] = JSON.parse(rawExisting);
        const updated = existing.map((lead) =>
          lead.id === cleanedLeadId
            ? { ...lead, whatsapp_cta_clicked: true, updated_at: new Date().toISOString() }
            : lead,
        );
        localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(updated));
      }
    } catch {
      // Non-blocking in dev
    }
  }
}
