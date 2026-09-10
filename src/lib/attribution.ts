import { AttributionData } from '../types';

const ATTRIBUTION_STORAGE_KEY = 'namma_stores_utm_v2';

/**
 * Parses query parameters from current URL and merges them with stored attribution.
 * Persists attribution across page visits within the session.
 */
export function getAttribution(): AttributionData {
  if (typeof window === 'undefined') {
    return {};
  }

  // 1. Try to read existing stored attribution
  let stored: AttributionData = {};
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (raw) {
      stored = JSON.parse(raw);
    }
  } catch {
    // sessionStorage not available or blocked
  }

  // 2. Parse current URL params
  const urlParams = new URLSearchParams(window.location.search);
  const currentParams: AttributionData = {};

  const keys: (keyof AttributionData)[] = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'utm_id',
    'adset_id',
    'ad_id',
    'placement',
  ];

  let hasNewParams = false;
  for (const key of keys) {
    const val = urlParams.get(key);
    if (val && val.trim().length > 0) {
      currentParams[key] = val.trim();
      hasNewParams = true;
    }
  }

  // If new params are present in URL, merge or overwrite
  const merged: AttributionData = {
    ...stored,
    ...currentParams,
  };

  // If referrer is available and no utm_source, tag organic source
  if (!merged.utm_source && document.referrer) {
    try {
      const refUrl = new URL(document.referrer);
      if (refUrl.hostname.includes('instagram.com')) {
        merged.utm_source = 'instagram_organic';
        hasNewParams = true;
      } else if (refUrl.hostname.includes('whatsapp.com')) {
        merged.utm_source = 'whatsapp_share';
        hasNewParams = true;
      } else if (refUrl.hostname.includes('facebook.com')) {
        merged.utm_source = 'facebook_organic';
        hasNewParams = true;
      } else if (refUrl.hostname && !refUrl.hostname.includes(window.location.hostname)) {
        merged.utm_source = refUrl.hostname;
        hasNewParams = true;
      }
    } catch {
      // Ignore URL parsing errors on malformed referrers
    }
  }

  if (hasNewParams) {
    try {
      sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // Ignore storage errors
    }
  }

  return merged;
}

export const parseAndPersistAttribution = getAttribution;

