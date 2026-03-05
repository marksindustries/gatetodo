-- ── Coupon Codes ────────────────────────────────────────────────────────────
-- Admin-generated discount codes redeemable during onboarding or from settings.
-- No public RLS policies: only the service-role key (admin) can read/write.

CREATE TABLE IF NOT EXISTS coupon_codes (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text        UNIQUE NOT NULL,
  discount_percent int         NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  description      text,
  max_uses         int,        -- null = unlimited
  uses_count       int         NOT NULL DEFAULT 0,
  expires_at       timestamptz,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE coupon_codes ENABLE ROW LEVEL SECURITY;
-- Intentionally no RLS SELECT/INSERT policies — service-role only.

-- ── Profiles additions ───────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coupon_code     text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coupon_discount  int NOT NULL DEFAULT 0;
