# Namma Stores — Early Access V2

Production early-access landing and customer onboarding platform for Namma Stores (Whitefield, Bangalore). Built with React 19, TypeScript, Vite, Tailwind CSS, Supabase PostgreSQL, and deployed to Cloudflare Workers / Cloudflare Pages.

---

## 1. Architecture Overview

```
Landing Page (Single Landing Page — Tab-Switching Selector)
   │
   ├── [ 🛍️ CUSTOMER TAB ] (Default)
   │      │
   │      ▼
   │   EarlyAccessForm.tsx (Client UX Validation)
   │      │
   │      ▼
   │   earlyAccessService.ts (Attribution & RPC Invocation)
   │      │
   │      ▼ (Supabase JS Browser Client — Public Anon Key Only)
   │   Supabase RPC: public.submit_early_access_lead(...)
   │      │
   │      ▼
   │   PostgreSQL Table: public.early_access_leads
   │      │
   │      ├── [New Lead] ──────► Insert lead record ────► Return { id, status: 'new', duplicate: false }
   │      │
   │      └── [Existing Phone] ─► Update timestamp ─────► Return { id, status: 'duplicate', duplicate: true }
   │      │
   │      ▼
   │   SuccessState.tsx (Displays "You're on the list!" or "You're already on the list!")
   │      │
   │      ▼
   │   WhatsApp Customer Community CTA (Invokes non-blocking markWhatsAppCtaClicked(leadId))
   │
   └── [ 🏪 SELLER TAB ]
          │
          ▼
       SellerRegistrationForm.tsx (Client UX Validation)
          │
          ▼
       sellerLeadService.ts (Attribution & RPC Invocation)
          │
          ▼ (Supabase JS Browser Client — Public Anon Key Only)
       Supabase RPC: public.submit_seller_lead(...)
          │
          ▼
       PostgreSQL Table: public.seller_leads
          │
          ├── [New Seller] ─────► Insert seller lead ────► Return { id, status: 'new', duplicate: false }
          │
          └── [Existing Phone] ─► Update timestamp ─────► Return { id, status: 'duplicate', duplicate: true }
          │
          ▼
       SellerSuccessState.tsx (Displays "Thanks! We've received your details. 💚")
          │
          ▼
       WhatsApp Seller Community CTA (Invokes non-blocking markSellerWhatsAppCtaClicked(leadId))
```

### Key Production Principles:
- **Two Independent Lead Journeys**: Customer (`public.early_access_leads`) and Local Seller (`public.seller_leads`).
- **One Authoritative Write Path for Each**:
  - Customer: Frontend → Supabase RPC `public.submit_early_access_lead` → `public.early_access_leads`.
  - Seller: Frontend → Supabase RPC `public.submit_seller_lead` → `public.seller_leads`.
- **Zero Direct Table Inserts**: Both tables have direct `SELECT`, `INSERT`, `UPDATE`, `DELETE` revoked from `anon` and `authenticated`. Writes and duplicate handling happen atomically inside `SECURITY DEFINER` stored procedures.
- **Zero Fake Production Success**: No silent fallbacks to `localStorage` or unverified state in production.
- **Client-Side Security**: Only `VITE_SUPABASE_ANON_KEY` is bundled into the browser client. The `SUPABASE_SERVICE_ROLE_KEY` is NEVER exposed or used in the frontend.
- **Idempotency**: Phone number is the unique key. Duplicate submissions are recognized gracefully without throwing database errors.

---

## 2. Local Development Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy the template to `.env.local` (which is already ignored by `.gitignore`):
```bash
cp .env.example .env.local
```

Edit `.env.local` and configure your Supabase project credentials:
```env
VITE_SUPABASE_URL=https://oczoglbbrytomuowhyoa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Note on Local Fallback**: If `.env.local` credentials are not configured, the development server (`import.meta.env.DEV`) provides a simulated local browser preview to assist UI development in VS Code without throwing uncaught errors. This fallback is **strictly disabled** in production builds.

### Step 3: Start the Development Server
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

### Step 4: Validate TypeScript & Build
```bash
npm run lint
npm run build
```

---

## 3. Supabase Database Configuration & SQL Migration

Run this SQL migration in the **Supabase SQL Editor** (`Project Ref: oczoglbbrytomuowhyoa`).

### Migration Characteristics:
- **100% Non-Destructive**: Does not drop tables, delete records, or modify existing columns.
- **Structured JSON Response**: Returns `{ id, status, duplicate, message }` for clean consumption by the frontend.
- **Strict Validation**: Normalizes 10-digit Indian phone numbers starting with 6, 7, 8, 9, validates name/area lengths, and checks email syntax.
- **Security Hardened**: Defined with `SECURITY DEFINER` and an explicit `SET search_path = public, pg_temp` to prevent search_path escalation vulnerabilities.
- **Public Anonymous Access**: Grants `EXECUTE` privileges specifically on this RPC to the `anon` and `authenticated` roles so anonymous visitors can submit leads without exposing table-level `SELECT` or `DELETE` access.

```sql
-- ==============================================================================
-- Migration: Namma Stores Early Access V2 - Authoritative Lead Submission RPC
-- Database: Supabase PostgreSQL (Project: oczoglbbrytomuowhyoa)
-- ==============================================================================

-- 1. Ensure Row Level Security remains active on the table
ALTER TABLE public.early_access_leads ENABLE ROW LEVEL SECURITY;

-- 2. Revoke all direct table access from both anon and authenticated roles
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.early_access_leads FROM anon, authenticated;

-- 3. Create or replace the authoritative, race-safe submission RPC
CREATE OR REPLACE FUNCTION public.submit_early_access_lead(
  p_name text,
  p_phone text,
  p_area text,
  p_shopping_preferences text[] DEFAULT '{}'::text[],
  p_utm_source text DEFAULT NULL,
  p_utm_medium text DEFAULT NULL,
  p_utm_campaign text DEFAULT NULL,
  p_utm_content text DEFAULT NULL,
  p_utm_term text DEFAULT NULL,
  p_whatsapp_consent boolean DEFAULT false,
  p_email text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cleaned_phone text;
  v_cleaned_name text;
  v_cleaned_area text;
  v_cleaned_email text;
  v_cleaned_utm_source text;
  v_cleaned_utm_medium text;
  v_cleaned_utm_campaign text;
  v_cleaned_utm_content text;
  v_cleaned_utm_term text;
  v_pref text;
  v_validated_prefs text[] := '{}'::text[];
  v_lead_id uuid;
  v_is_duplicate boolean := false;
BEGIN
  -- A. Normalize phone number (strip whitespace, +91, leading 0)
  v_cleaned_phone := pg_catalog.regexp_replace(COALESCE(p_phone, ''::text), '\D', '', 'g');
  IF pg_catalog.length(v_cleaned_phone) = 12 AND v_cleaned_phone LIKE '91%' THEN
    v_cleaned_phone := pg_catalog.substr(v_cleaned_phone, 3);
  ELSIF pg_catalog.length(v_cleaned_phone) = 11 AND v_cleaned_phone LIKE '0%' THEN
    v_cleaned_phone := pg_catalog.substr(v_cleaned_phone, 2);
  END IF;

  -- B. Normalize text fields
  v_cleaned_name := pg_catalog.btrim(pg_catalog.regexp_replace(COALESCE(p_name, ''::text), '\s+', ' ', 'g'));
  v_cleaned_area := pg_catalog.btrim(pg_catalog.regexp_replace(COALESCE(p_area, ''::text), '\s+', ' ', 'g'));
  v_cleaned_email := NULLIF(pg_catalog.lower(pg_catalog.btrim(COALESCE(p_email, ''::text))), '');

  v_cleaned_utm_source   := NULLIF(pg_catalog.btrim(COALESCE(p_utm_source, ''::text)), '');
  v_cleaned_utm_medium   := NULLIF(pg_catalog.btrim(COALESCE(p_utm_medium, ''::text)), '');
  v_cleaned_utm_campaign := NULLIF(pg_catalog.btrim(COALESCE(p_utm_campaign, ''::text)), '');
  v_cleaned_utm_content  := NULLIF(pg_catalog.btrim(COALESCE(p_utm_content, ''::text)), '');
  v_cleaned_utm_term     := NULLIF(pg_catalog.btrim(COALESCE(p_utm_term, ''::text)), '');

  -- C. Authoritative Database Validation
  IF pg_catalog.length(v_cleaned_phone) != 10 OR pg_catalog.substr(v_cleaned_phone, 1, 1) NOT IN ('6', '7', '8', '9') THEN
    RAISE EXCEPTION 'Invalid mobile number. Must be a 10-digit Indian number.' USING ERRCODE = '22023';
  END IF;

  IF pg_catalog.length(v_cleaned_name) < 2 THEN
    RAISE EXCEPTION 'Invalid name. Must be at least 2 characters.' USING ERRCODE = '22023';
  END IF;

  IF pg_catalog.length(v_cleaned_area) < 2 THEN
    RAISE EXCEPTION 'Invalid area. Must be at least 2 characters.' USING ERRCODE = '22023';
  END IF;

  IF v_cleaned_email IS NOT NULL AND v_cleaned_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format.' USING ERRCODE = '22023';
  END IF;

  -- D. Shopping Preference Validation (5 current active + 2 legacy compatibility values)
  IF p_shopping_preferences IS NOT NULL AND pg_catalog.array_length(p_shopping_preferences, 1) > 0 THEN
    FOREACH v_pref IN ARRAY p_shopping_preferences LOOP
      v_pref := pg_catalog.btrim(v_pref);
      IF v_pref != '' THEN
        IF v_pref NOT IN (
          'Fresh Meat',
          'Fruits & Vegetables',
          'Puja Essentials',
          'Recipes',
          'Not sure yet',
          'Groceries',
          'All of them'
        ) THEN
          RAISE EXCEPTION 'Invalid shopping preference: %. Allowed values are Fresh Meat, Fruits & Vegetables, Puja Essentials, Recipes, Not sure yet.', v_pref
            USING ERRCODE = '22023';
        END IF;
        v_validated_prefs := pg_catalog.array_append(v_validated_prefs, v_pref);
      END IF;
    END LOOP;
  END IF;

  -- E. Atomic Insert via ON CONFLICT DO NOTHING (Race-Condition Free)
  INSERT INTO public.early_access_leads (
    name,
    phone,
    area,
    shopping_preferences,
    email,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    whatsapp_joined,
    whatsapp_consent,
    whatsapp_cta_clicked,
    created_at,
    updated_at
  ) VALUES (
    v_cleaned_name,
    v_cleaned_phone,
    v_cleaned_area,
    v_validated_prefs,
    v_cleaned_email,
    v_cleaned_utm_source,
    v_cleaned_utm_medium,
    v_cleaned_utm_campaign,
    v_cleaned_utm_content,
    v_cleaned_utm_term,
    false,
    COALESCE(p_whatsapp_consent, false::boolean),
    false,
    pg_catalog.now(),
    pg_catalog.now()
  )
  ON CONFLICT (phone) DO NOTHING
  RETURNING id INTO v_lead_id;

  -- F. Duplicate Handling: If row already existed, update timestamp and never downgrade consent
  IF v_lead_id IS NOT NULL THEN
    v_is_duplicate := false;
  ELSE
    v_is_duplicate := true;
    UPDATE public.early_access_leads
    SET
      updated_at = pg_catalog.now(),
      -- Consent preservation: TRUE cannot be downgraded to FALSE
      -- (TRUE OR FALSE = TRUE, FALSE OR TRUE = TRUE, FALSE OR FALSE = FALSE)
      whatsapp_consent = (COALESCE(public.early_access_leads.whatsapp_consent, false::boolean) OR COALESCE(p_whatsapp_consent, false::boolean))
    WHERE phone = v_cleaned_phone
    RETURNING id INTO v_lead_id;

    -- Safety check if lead was concurrently altered
    IF v_lead_id IS NULL THEN
      SELECT id INTO v_lead_id FROM public.early_access_leads WHERE phone = v_cleaned_phone LIMIT 1;
    END IF;
  END IF;

  -- G. Structured, deterministic JSON response
  IF NOT v_is_duplicate THEN
    RETURN pg_catalog.jsonb_build_object(
      'id', v_lead_id,
      'status', 'new',
      'duplicate', false,
      'message', 'You''re on the list! 🎉'
    );
  ELSE
    RETURN pg_catalog.jsonb_build_object(
      'id', v_lead_id,
      'status', 'duplicate',
      'duplicate', true,
      'message', 'You''re already on the Namma Stores early-access list. 💚'
    );
  END IF;
END;
$$;

-- 4. Revoke PUBLIC execution and grant explicitly to anon and authenticated
REVOKE EXECUTE ON FUNCTION public.submit_early_access_lead(
  text,
  text,
  text,
  text[],
  text,
  text,
  text,
  text,
  text,
  boolean,
  text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_early_access_lead(
  text,
  text,
  text,
  text[],
  text,
  text,
  text,
  text,
  text,
  boolean,
  text
) TO anon, authenticated;

-- 5. Create hardened helper RPC for WhatsApp CTA tracking
CREATE OR REPLACE FUNCTION public.mark_lead_whatsapp_clicked(p_lead_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_lead_id IS NOT NULL THEN
    UPDATE public.early_access_leads
    SET
      whatsapp_cta_clicked = true,
      updated_at = pg_catalog.now()
    WHERE id = p_lead_id;
  END IF;
END;
$$;

-- 6. Revoke PUBLIC execution and grant explicitly to anon and authenticated
REVOKE EXECUTE ON FUNCTION public.mark_lead_whatsapp_clicked(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_lead_whatsapp_clicked(uuid) TO anon, authenticated;

-- ==============================================================================
-- Seller Registration Flow: Database Schema & RPC
-- Table: public.seller_leads
-- ==============================================================================

-- 7. Ensure public.seller_leads has Row Level Security active
ALTER TABLE public.seller_leads ENABLE ROW LEVEL SECURITY;

-- 8. Revoke all direct table access from both anon and authenticated roles
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.seller_leads FROM anon, authenticated;

-- 9. Authoritative Seller Submission RPC
CREATE OR REPLACE FUNCTION public.submit_seller_lead(
  p_full_name text,
  p_store_name text,
  p_phone text,
  p_area text,
  p_store_category text,
  p_sells_online boolean,
  p_email text DEFAULT NULL,
  p_whatsapp_consent boolean DEFAULT false,
  p_source text DEFAULT 'website_seller',
  p_utm_source text DEFAULT NULL,
  p_utm_medium text DEFAULT NULL,
  p_utm_campaign text DEFAULT NULL,
  p_utm_content text DEFAULT NULL,
  p_utm_term text DEFAULT NULL,
  p_utm_id text DEFAULT NULL,
  p_adset_id text DEFAULT NULL,
  p_ad_id text DEFAULT NULL,
  p_placement text DEFAULT NULL
)
RETURNS pg_catalog.jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cleaned_name text;
  v_cleaned_store text;
  v_raw_phone text;
  v_cleaned_phone text;
  v_cleaned_area text;
  v_cleaned_category text;
  v_cleaned_email text;
  v_lead_id uuid;
  v_is_duplicate boolean := false;
  v_existing_id uuid;
  v_existing_created_at timestamptz;
BEGIN
  -- A. Input sanitization & boundary checks
  v_cleaned_name := pg_catalog.btrim(pg_catalog.regexp_replace(COALESCE(p_full_name, ''::text), '\s+', ' ', 'g'));
  IF v_cleaned_name = '' OR pg_catalog.length(v_cleaned_name) < 2 OR pg_catalog.length(v_cleaned_name) > 80 THEN
    RAISE EXCEPTION 'Full name must be between 2 and 80 characters';
  END IF;

  v_cleaned_store := pg_catalog.btrim(pg_catalog.regexp_replace(COALESCE(p_store_name, ''::text), '\s+', ' ', 'g'));
  IF v_cleaned_store = '' OR pg_catalog.length(v_cleaned_store) < 2 OR pg_catalog.length(v_cleaned_store) > 120 THEN
    RAISE EXCEPTION 'Store name must be between 2 and 120 characters';
  END IF;

  v_cleaned_area := pg_catalog.btrim(pg_catalog.regexp_replace(COALESCE(p_area, ''::text), '\s+', ' ', 'g'));
  IF v_cleaned_area = '' OR pg_catalog.length(v_cleaned_area) < 2 OR pg_catalog.length(v_cleaned_area) > 100 THEN
    RAISE EXCEPTION 'Area name must be between 2 and 100 characters';
  END IF;

  v_cleaned_category := pg_catalog.btrim(COALESCE(p_store_category, ''::text));
  IF v_cleaned_category NOT IN (
    'Grocery Store',
    'Supermarket',
    'Meat Shop',
    'Fruit & Vegetable Store',
    'Puja / Religious Essentials',
    'Other'
  ) THEN
    RAISE EXCEPTION 'Invalid store category';
  END IF;

  -- B. Indian mobile phone normalization
  v_raw_phone := pg_catalog.regexp_replace(COALESCE(p_phone, ''::text), '[\s\-()]', '', 'g');
  IF v_raw_phone LIKE '+91%' THEN
    v_raw_phone := pg_catalog.substr(v_raw_phone, 4);
  ELSIF v_raw_phone LIKE '91%' AND pg_catalog.length(v_raw_phone) = 12 THEN
    v_raw_phone := pg_catalog.substr(v_raw_phone, 3);
  ELSIF v_raw_phone LIKE '0%' AND pg_catalog.length(v_raw_phone) = 11 THEN
    v_raw_phone := pg_catalog.substr(v_raw_phone, 2);
  END IF;
  v_cleaned_phone := pg_catalog.regexp_replace(v_raw_phone, '\D', '', 'g');

  IF pg_catalog.length(v_cleaned_phone) != 10 OR v_cleaned_phone !~ '^[6-9]\d{9}$' THEN
    RAISE EXCEPTION 'Invalid Indian mobile number: must be 10 digits starting with 6, 7, 8, or 9';
  END IF;

  -- C. Email validation
  IF p_email IS NOT NULL AND pg_catalog.btrim(p_email) <> '' THEN
    v_cleaned_email := pg_catalog.lower(pg_catalog.btrim(p_email));
    IF v_cleaned_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Invalid email format';
    END IF;
  ELSE
    v_cleaned_email := NULL;
  END IF;

  -- D. Atomic insert with ON CONFLICT (phone) DO NOTHING
  INSERT INTO public.seller_leads (
    full_name,
    store_name,
    phone,
    area,
    store_category,
    sells_online,
    email,
    whatsapp_consent,
    status,
    source,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    utm_id,
    adset_id,
    ad_id,
    placement,
    created_at,
    updated_at
  ) VALUES (
    v_cleaned_name,
    v_cleaned_store,
    v_cleaned_phone,
    v_cleaned_area,
    v_cleaned_category,
    COALESCE(p_sells_online, false::boolean),
    v_cleaned_email,
    COALESCE(p_whatsapp_consent, false::boolean),
    'new',
    COALESCE(p_source, 'website_seller'::text),
    p_utm_source,
    p_utm_medium,
    p_utm_campaign,
    p_utm_content,
    p_utm_term,
    p_utm_id,
    p_adset_id,
    p_ad_id,
    p_placement,
    pg_catalog.now(),
    pg_catalog.now()
  )
  ON CONFLICT (phone) DO NOTHING
  RETURNING id INTO v_lead_id;

  -- E. Duplicate handling
  IF v_lead_id IS NULL THEN
    v_is_duplicate := true;

    UPDATE public.seller_leads
    SET
      full_name = v_cleaned_name,
      store_name = v_cleaned_store,
      area = v_cleaned_area,
      store_category = v_cleaned_category,
      sells_online = COALESCE(p_sells_online, sells_online),
      email = COALESCE(v_cleaned_email, email),
      whatsapp_consent = (COALESCE(whatsapp_consent, false::boolean) OR COALESCE(p_whatsapp_consent, false::boolean)),
      utm_source = COALESCE(utm_source, p_utm_source),
      utm_medium = COALESCE(utm_medium, p_utm_medium),
      utm_campaign = COALESCE(utm_campaign, p_utm_campaign),
      utm_content = COALESCE(utm_content, p_utm_content),
      utm_term = COALESCE(utm_term, p_utm_term),
      utm_id = COALESCE(utm_id, p_utm_id),
      adset_id = COALESCE(adset_id, p_adset_id),
      ad_id = COALESCE(ad_id, p_ad_id),
      placement = COALESCE(placement, p_placement),
      updated_at = pg_catalog.now()
    WHERE phone = v_cleaned_phone
    RETURNING id, created_at INTO v_existing_id, v_existing_created_at;

    v_lead_id := v_existing_id;
  END IF;

  -- F. Deterministic JSON response
  IF NOT v_is_duplicate THEN
    RETURN pg_catalog.jsonb_build_object(
      'id', v_lead_id,
      'status', 'new',
      'duplicate', false,
      'message', 'Thanks! We''ve received your details. 💚'
    );
  ELSE
    RETURN pg_catalog.jsonb_build_object(
      'id', v_lead_id,
      'status', 'duplicate',
      'duplicate', true,
      'message', 'You''re already on the Namma Stores seller list. 💚'
    );
  END IF;
END;
$$;

-- 10. Permissions for submit_seller_lead
REVOKE EXECUTE ON FUNCTION public.submit_seller_lead(
  text, text, text, text, text, boolean, text, boolean, text,
  text, text, text, text, text, text, text, text, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_seller_lead(
  text, text, text, text, text, boolean, text, boolean, text,
  text, text, text, text, text, text, text, text, text
) TO anon, authenticated;

-- 11. Helper RPC for Seller WhatsApp tracking
CREATE OR REPLACE FUNCTION public.mark_seller_lead_whatsapp_clicked(p_lead_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_lead_id IS NOT NULL THEN
    UPDATE public.seller_leads
    SET
      whatsapp_cta_clicked = true,
      updated_at = pg_catalog.now()
    WHERE id = p_lead_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_seller_lead_whatsapp_clicked(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_seller_lead_whatsapp_clicked(uuid) TO anon, authenticated;
```

---

## 4. Cloudflare Deployment Configuration

### CRITICAL: Vite Build-Time Variables in Cloudflare
Vite compiles environment variables prefixed with `VITE_` into static assets during `npm run build`. 
If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not present **at the moment the build command runs in Cloudflare**, Vite bundles empty strings, which causes the production guard in the frontend to trigger.

### Required Cloudflare Environment Variables
In your Cloudflare dashboard (under **Workers & Pages** → **Your Project** → **Settings** → **Builds & deployments** / **Environment variables**):

| Variable Name | Type | Value |
|---|---|---|
| `VITE_SUPABASE_URL` | Plaintext / Encrypted | `https://oczoglbbrytomuowhyoa.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Encrypted Secret | `[Your Supabase anon key]` |

### Cloudflare Build Settings
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (or repository root)
- **Node.js version**: `18.x` or `20.x` (configure `NODE_VERSION=20` if using Pages environment variables)

After adding the environment variables, **trigger a new deployment / redeploy** to ensure the build embeds the values.

---

## 5. Security & RLS Policy Summary

- **Table RLS**: Row Level Security (RLS) is enabled on both `public.early_access_leads` and `public.seller_leads`.
- **Public Anon Access**: Anonymous users are **not granted `SELECT`, `INSERT`, `UPDATE`, or `DELETE`** on either table. They can only invoke the hardened RPC functions:
  - Customer: `public.submit_early_access_lead` and `public.mark_lead_whatsapp_clicked`
  - Seller: `public.submit_seller_lead` and `public.mark_seller_lead_whatsapp_clicked`
- **Data Protection**: Existing lead telephone numbers, emails, store details, and personal information are protected from unauthorized enumeration or extraction by public users.
- **Strict search_path**: All RPC functions execute with `SET search_path = ''` to eliminate search_path elevation exploits.

---

## 6. Rate Limiting & Bot Protection Recommendations

For production hardening against spam bots:
1. **Cloudflare WAF / Managed Rules**: Enable Cloudflare's Bot Fight Mode or Managed Challenge on POST requests to your worker route.
2. **Cloudflare Turnstile (Optional future integration)**: Add Turnstile CAPTCHA to `EarlyAccessForm` if automated abuse is observed.
3. **Database-level Connection Throttling**: The `submit_early_access_lead` and `submit_seller_lead` RPCs use PostgreSQL transactions with explicit limits and clean aborts on invalid formats.

---

## 7. Verification & Test Plan

### Customer Journey Tests (Tests 1–7)
1. **TEST 1 — New User Submission**:
   - Fill out Name, valid Indian phone (`9876543210`), Locality (`ECC Road`), optional shopping preference.
   - Click "GET EARLY ACCESS".
   - **Result**: Row created in `public.early_access_leads`. UI displays confetti and "You're on the list! 🎉".
2. **TEST 2 — Duplicate Phone Number**:
   - Re-submit the same phone number (`9876543210`).
   - **Result**: No duplicate row created. UI displays "You're already on the list! 💚".
3. **TEST 3 — Invalid Phone**:
   - Enter `12345` or non-numeric characters.
   - **Result**: Immediate inline UX error. Submission blocked before calling Supabase.
4. **TEST 4 — Invalid Name / Area**:
   - Single-character name or empty area.
   - **Result**: Inline UX validation error. Submission blocked.
5. **TEST 5 — Optional Email**:
   - Empty email: Submits successfully.
   - Invalid email (`test@`): Displays inline error.
   - Valid email: Submits successfully and stores email.
6. **TEST 6 — WhatsApp CTA Click**:
   - Click "JOIN WHATSAPP COMMUNITY" on the customer success card.
   - **Result**: Redirects to customer community link (`https://chat.whatsapp.com/GsRyrfB4lzRASwYiAp9Ont`) and updates `whatsapp_cta_clicked = true` for that lead ID.
7. **TEST 7 — UTM Attribution**:
   - Access URL with `?utm_source=instagram&utm_campaign=whitefield_launch`.
   - **Result**: UTM parameters recorded accurately in `utm_source` and `utm_campaign`.

### Seller Journey Tests (Tests 8–14)
8. **TEST 8 — Tab Switching Integrity**:
   - Click between `[ 🛍️ CUSTOMER ]` and `[ 🏪 SELLER ]`.
   - Verify that form data entered in one tab is not cleared or submitted upon tab switch.
   - Verify that default tab is `CUSTOMER`.
9. **TEST 9 — New Seller Submission**:
   - Fill out Full Name, Store Name, Phone (`9876543211`), Locality (`Hope Farm`), Category (`Grocery Store`), Sells Online (`Yes`), WhatsApp consent (`checked`).
   - Click "JOIN AS A SELLER".
   - **Result**: Row created in `public.seller_leads` with `status = 'new'`. UI displays confetti and "Thanks! We've received your details. 💚".
10. **TEST 10 — Duplicate Seller Submission**:
    - Re-submit the same seller phone (`9876543211`).
    - **Result**: No duplicate row created; updates store details and preserves consent. UI displays "You're already on the Namma Stores seller list. 💚".
11. **TEST 11 — Seller Required Validation**:
    - Submit with missing Store Name, Category, or unselected "Sells Online".
    - **Result**: Inline errors displayed highlighting missing fields.
12. **TEST 12 — Seller WhatsApp CTA Click**:
    - Click "JOIN SELLER WHATSAPP COMMUNITY" on the seller success card.
    - **Result**: Opens seller community link (`https://chat.whatsapp.com/Ji3y3ycfleA1pcmlYDGuER`) and invokes `mark_seller_lead_whatsapp_clicked`.
13. **TEST 13 — Seller UTM Attribution**:
    - Visit with `?utm_source=facebook&utm_campaign=seller_onboarding`.
    - **Result**: Stored with `source = 'website_seller'` and exact UTM tags in `public.seller_leads`.
14. **TEST 14 — Customer Flow Independence**:
    - Verify that submitting a seller lead has zero effect on `public.early_access_leads` and vice versa.
