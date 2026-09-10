export type ShoppingPreference = 
  | 'Fresh Meat'
  | 'Fruits & Vegetables'
  | 'Puja Essentials'
  | 'Recipes'
  | 'Not sure yet';

export interface LeadFormData {
  name: string;
  phone: string;
  area: string;
  shoppingPreference?: ShoppingPreference | string | string[];
  email?: string;
  whatsappConsent: boolean;
}

export interface AttributionData {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  utm_id?: string | null;
  adset_id?: string | null;
  ad_id?: string | null;
  placement?: string | null;
}

export interface EarlyAccessLeadRecord {
  id?: string;
  name: string;
  email?: string | null;
  phone: string;
  area: string;
  shopping_preferences?: string[] | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  whatsapp_joined?: boolean;
  whatsapp_consent?: boolean;
  whatsapp_cta_clicked?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SubmissionResponse {
  success: boolean;
  duplicate?: boolean;
  leadId?: string | null;
  message: string;
  phone?: string;
  name?: string;
  isMock?: boolean;
  statusType?: 'real_success' | 'duplicate' | 'preview_mock' | 'database_failure' | 'unconfigured';
}


export type AnalyticsEventName =
  | 'page_view'
  | 'hero_cta_clicked'
  | 'category_clicked'
  | 'what_im_looking_for_clicked'
  | 'how_it_works_viewed'
  | 'community_cta_clicked'
  | 'form_started'
  | 'form_completed'
  | 'lead_created'
  | 'whatsapp_cta_clicked'
  | 'instagram_clicked';
