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

export type SubmissionStatusType =
  | 'real_success'
  | 'duplicate'
  | 'preview_mock'
  | 'database_failure'
  | 'network_error'
  | 'validation_error'
  | 'unconfigured';

export interface SubmissionResponse {
  success: boolean;
  duplicate?: boolean;
  leadId?: string | null;
  message: string;
  phone?: string;
  name?: string;
  isMock?: boolean;
  statusType: SubmissionStatusType;
}

export interface RpcSubmitLeadResult {
  id?: string | null;
  status?: 'new' | 'duplicate' | string;
  duplicate?: boolean;
  message?: string;
}

export type StoreCategory =
  | 'Grocery Store'
  | 'Supermarket'
  | 'Meat Shop'
  | 'Fruit & Vegetable Store'
  | 'Puja / Religious Essentials'
  | 'Other';

export type SellerLeadStatus =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'onboarding'
  | 'approved'
  | 'rejected'
  | 'converted';

export interface SellerFormData {
  fullName: string;
  storeName: string;
  phone: string;
  area: string;
  storeCategory: StoreCategory | string;
  sellsOnline: boolean | null;
  email?: string;
  whatsappConsent: boolean;
}

export interface SellerLeadRecord {
  id?: string;
  full_name: string;
  store_name: string;
  phone: string;
  area: string;
  store_category: string;
  sells_online: boolean;
  email?: string | null;
  whatsapp_consent?: boolean;
  whatsapp_cta_clicked?: boolean;
  status?: SellerLeadStatus | string;
  source?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  utm_id?: string | null;
  adset_id?: string | null;
  ad_id?: string | null;
  placement?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SellerSubmissionResponse {
  success: boolean;
  duplicate?: boolean;
  leadId?: string | null;
  message: string;
  phone?: string;
  fullName?: string;
  storeName?: string;
  isMock?: boolean;
  statusType: SubmissionStatusType;
}

export interface SellerRpcSubmitLeadResult {
  id?: string | null;
  status?: 'new' | 'duplicate' | string;
  duplicate?: boolean;
  message?: string;
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
  | 'instagram_clicked'
  | 'seller_form_started'
  | 'seller_form_completed'
  | 'seller_lead_created'
  | 'seller_whatsapp_cta_clicked';
