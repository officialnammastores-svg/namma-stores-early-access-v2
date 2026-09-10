import { AnalyticsEventName } from '../types';

/**
 * Privacy-preserving, crash-proof client-side analytics event bus.
 * Never transmits sensitive PII (like phone numbers, customer emails).
 */
export function trackEvent(
  eventName: AnalyticsEventName,
  properties?: Record<string, string | number | boolean | null | undefined>
): void {
  try {
    // Sanitize properties: strip any PII keys if accidentally passed
    const sanitized: Record<string, unknown> = {};
    if (properties) {
      for (const [key, value] of Object.entries(properties)) {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey === 'name' ||
          lowerKey.includes('phone') ||
          lowerKey.includes('mobile') ||
          lowerKey.includes('email') ||
          lowerKey.includes('password') ||
          lowerKey.includes('customer_name') ||
          lowerKey.includes('lead_name')
        ) {
          continue; // skip sensitive fields
        }
        sanitized[key] = value;
      }
    }

    const payload = {
      event: eventName,
      timestamp: new Date().toISOString(),
      path: typeof window !== 'undefined' ? window.location.pathname : '',
      ...sanitized,
    };

    // If window.dataLayer exists (Google Tag Manager / Meta Pixel), push safely
    if (typeof window !== 'undefined' && Array.isArray((window as unknown as { dataLayer?: unknown[] }).dataLayer)) {
      (window as unknown as { dataLayer: unknown[] }).dataLayer.push(payload);
    }

    // Custom DOM event for local subscribers or debug listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('namma_analytics', {
          detail: payload,
        })
      );
    }

    // In development or debugging
    if (import.meta.env.DEV) {
      console.log(`📊 [Analytics] ${eventName}`, sanitized);
    }
  } catch {
    // Analytics failure must never disrupt lead flow or throw unhandled exceptions
  }
}
