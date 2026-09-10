import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LeadFormData, AttributionData, SubmissionResponse, EarlyAccessLeadRecord } from '../types';
import { validateIndianMobile, validateName, validateArea } from '../lib/validation';
import { trackEvent } from '../lib/analytics';

const LOCAL_STORAGE_LEADS_KEY = 'namma_stores_leads_offline_v2';

/**
 * Dedicated service layer for Early Access lead management.
 * Adheres strictly to the existing `public.early_access_leads` schema.
 */
export async function submitEarlyAccessLead(
  formData: LeadFormData,
  attribution: AttributionData
): Promise<SubmissionResponse> {
  // 1. Validate inputs thoroughly
  const nameVal = validateName(formData.name);
  if (!nameVal.isValid) {
    return { success: false, message: nameVal.errorMessage || 'Invalid name' };
  }

  const phoneVal = validateIndianMobile(formData.phone);
  if (!phoneVal.isValid) {
    return { success: false, message: phoneVal.errorMessage || 'Invalid mobile number' };
  }

  const areaVal = validateArea(formData.area);
  if (!areaVal.isValid) {
    return { success: false, message: areaVal.errorMessage || 'Invalid area' };
  }

  // 2. Normalize shopping preferences into string[] text[] array
  let shoppingPreferencesArray: string[] = [];
  if (Array.isArray(formData.shoppingPreference)) {
    shoppingPreferencesArray = formData.shoppingPreference.map((p) => String(p).trim()).filter(Boolean);
  } else if (typeof formData.shoppingPreference === 'string' && formData.shoppingPreference.trim() !== '') {
    shoppingPreferencesArray = [formData.shoppingPreference.trim()];
  }

  // Record structure aligned with database schema: public.early_access_leads
  const recordToInsert: EarlyAccessLeadRecord = {
    name: nameVal.cleaned,
    phone: phoneVal.cleanDigits,
    area: areaVal.cleaned,
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

  // 3. Submit to Supabase via RPC public.submit_early_access_lead where configured
  if (isSupabaseConfigured && supabase) {
    try {
      // Prepare RPC parameters matching public.submit_early_access_lead signature
      const rpcParams = {
        p_name: nameVal.cleaned,
        p_phone: phoneVal.cleanDigits,
        p_area: areaVal.cleaned,
        p_shopping_preferences: shoppingPreferencesArray, // text[] array
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

        // Check for duplicate key (23505) or unique constraint error on phone
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

        // Fallback: If RPC function is not installed in the target environment (e.g. PGRST202), attempt direct table insert
        if (
          errorCode === 'PGRST202' ||
          errorCode === '42883' ||
          errorMsg.includes('function') ||
          errorMsg.includes('could not find the function')
        ) {
          const directInsert = await supabase
            .from('early_access_leads')
            .insert([recordToInsert])
            .select('id')
            .maybeSingle();

          if (!directInsert.error) {
            const fallbackId = directInsert.data?.id ? String(directInsert.data.id) : null;
            trackEvent('lead_created', { status: 'new_direct_table', area: areaVal.cleaned });
            return {
              success: true,
              duplicate: false,
              statusType: 'real_success',
              isMock: false,
              leadId: fallbackId,
              message: "You're on the list! 🎉",
              phone: phoneVal.cleanDigits,
              name: nameVal.cleaned,
            };
          } else {
            const directMsg = directInsert.error.message?.toLowerCase() || '';
            const directCode = directInsert.error.code || '';
            if (
              directCode === '23505' ||
              directMsg.includes('duplicate') ||
              directMsg.includes('unique') ||
              directMsg.includes('already exists')
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
          }
        }

        console.error('Supabase submit_early_access_lead RPC error:', error);
        return {
          success: false,
          statusType: 'database_failure',
          message: 'Unable to register at the moment. Please try again in a moment.',
        };
      }

      // Check if RPC returned a duplicate response payload (e.g. { duplicate: true })
      if (data && typeof data === 'object') {
        const dataObj = data as Record<string, unknown>;
        if (dataObj.duplicate === true || dataObj.status === 'duplicate') {
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
      }

      // Successful RPC registration
      let insertedId: string | null = null;
      if (typeof data === 'string') {
        insertedId = data;
      } else if (data && typeof data === 'object' && 'id' in data) {
        insertedId = String((data as { id: unknown }).id);
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
        leadId: insertedId,
        message: "You're on the list! 🎉",
        phone: phoneVal.cleanDigits,
        name: nameVal.cleaned,
      };
    } catch (err) {
      console.error('Network or RPC exception:', err);
      return {
        success: false,
        statusType: 'database_failure',
        message: 'Network error. Please check your connection and retry.',
      };
    }
  }

  // 4. Production guard: In production, never silently pretend an unconfigured database succeeded
  if (import.meta.env.PROD) {
    console.error('⚠️ [Namma Stores Production Error] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not configured in this environment.');
    return {
      success: false,
      statusType: 'unconfigured',
      message: 'Registration service is currently undergoing final configuration. Please join our WhatsApp community directly to reserve your early spot.',
    };
  }

  // 5. Development / Local Preview fallback (only in DEV mode)
  try {
    const rawExisting = localStorage.getItem(LOCAL_STORAGE_LEADS_KEY);
    const existing: EarlyAccessLeadRecord[] = rawExisting ? JSON.parse(rawExisting) : [];

    const isDuplicate = existing.some((item) => item.phone === phoneVal.cleanDigits);
    if (isDuplicate) {
      trackEvent('lead_created', { status: 'duplicate_offline', area: areaVal.cleaned });
      return {
        success: true,
        duplicate: true,
        statusType: 'duplicate',
        isMock: true,
        message: "You're already on the Namma Stores early-access list. 💚",
        phone: phoneVal.cleanDigits,
        name: nameVal.cleaned,
      };
    }

    const mockId = 'lead_' + Math.random().toString(36).substring(2, 9);
    recordToInsert.id = mockId;
    existing.push(recordToInsert);
    localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(existing));

    console.info(
      'ℹ️ [Namma Stores Dev Preview] Saved lead to browser local storage (Live Supabase credentials not set in this preview session):',
      recordToInsert
    );

    trackEvent('lead_created', { status: 'new_local_preview', area: areaVal.cleaned });

    return {
      success: true,
      duplicate: false,
      statusType: 'preview_mock',
      isMock: true,
      leadId: mockId,
      message: "You're on the list! 🎉",
      phone: phoneVal.cleanDigits,
      name: nameVal.cleaned,
    };
  } catch (storageErr) {
    console.warn('Storage fallback error:', storageErr);
    return {
      success: false,
      statusType: 'database_failure',
      message: 'Unable to save lead. Please check your browser settings.',
    };
  }
}


/**
 * Updates `whatsapp_cta_clicked` flag safely without reading or exposing lead records.
 */
export async function markWhatsAppCtaClicked(leadId?: string | null, phone?: string): Promise<void> {
  trackEvent('whatsapp_cta_clicked', { has_lead: Boolean(leadId) });

  if (isSupabaseConfigured && supabase && leadId) {
    try {
      await supabase
        .from('early_access_leads')
        .update({
          whatsapp_cta_clicked: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);
    } catch {
      // Non-blocking update failure
    }
  } else if (!isSupabaseConfigured && (leadId || phone)) {
    try {
      const rawExisting = localStorage.getItem(LOCAL_STORAGE_LEADS_KEY);
      if (rawExisting) {
        const existing: EarlyAccessLeadRecord[] = JSON.parse(rawExisting);
        const updated = existing.map((lead) => {
          if ((leadId && lead.id === leadId) || (phone && lead.phone === phone)) {
            return { ...lead, whatsapp_cta_clicked: true, updated_at: new Date().toISOString() };
          }
          return lead;
        });
        localStorage.setItem(LOCAL_STORAGE_LEADS_KEY, JSON.stringify(updated));
      }
    } catch {
      // Silent error
    }
  }
}
