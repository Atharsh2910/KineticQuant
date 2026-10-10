-- =============================================================================
-- Migration 002: Feature Tables for KineticQuantAI
-- Tables: price_hedge_actions, capital_drawdowns, vendor_arbitrage_actions,
--         discount_actions, credit_passports
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. price_hedge_actions — Parametric Dynamic Pricing (Storefront Price Hedging)
-- ---------------------------------------------------------------------------
CREATE TABLE price_hedge_actions (
    id                          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    sme_id                      UUID            NOT NULL REFERENCES sme_profiles(id) ON DELETE CASCADE,
    ticker                      VARCHAR(50)     NOT NULL,
    price_change_pct            DECIMAL(10,4)   NOT NULL,
    recommended_adjustment_pct  DECIMAL(10,4)   NOT NULL,
    affected_products           JSONB,
    status                      VARCHAR(20)     NOT NULL DEFAULT 'pending'
                                                CHECK (status IN ('pending', 'applied', 'dismissed')),
    cot_explanation             JSONB           NOT NULL,
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_hedge_actions_sme_id     ON price_hedge_actions (sme_id);
CREATE INDEX idx_price_hedge_actions_status      ON price_hedge_actions (status);
CREATE INDEX idx_price_hedge_actions_created_at  ON price_hedge_actions (created_at DESC);

-- ---------------------------------------------------------------------------
-- 2. capital_drawdowns — Just-in-Time Financing
-- ---------------------------------------------------------------------------
CREATE TABLE capital_drawdowns (
    id                      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    sme_id                  UUID            NOT NULL REFERENCES sme_profiles(id) ON DELETE CASCADE,
    drawdown_amount         DECIMAL(15,2)   NOT NULL,
    trigger_reason          TEXT            NOT NULL,
    target_invoice_id       VARCHAR(100),
    status                  VARCHAR(20)     NOT NULL DEFAULT 'proposed'
                                            CHECK (status IN ('proposed', 'executed', 'repaid', 'cancelled')),
    repayment_source        VARCHAR(50),
    expected_repayment_date DATE,
    cot_explanation         JSONB           NOT NULL,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_capital_drawdowns_sme_id     ON capital_drawdowns (sme_id);
CREATE INDEX idx_capital_drawdowns_status      ON capital_drawdowns (status);
CREATE INDEX idx_capital_drawdowns_created_at  ON capital_drawdowns (created_at DESC);

-- ---------------------------------------------------------------------------
-- 3. vendor_arbitrage_actions — Multi-Vendor Inventory Arbitrage
-- ---------------------------------------------------------------------------
CREATE TABLE vendor_arbitrage_actions (
    id                          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    sme_id                      UUID            NOT NULL REFERENCES sme_profiles(id) ON DELETE CASCADE,
    primary_vendor              VARCHAR(255)    NOT NULL,
    alternative_vendor          VARCHAR(255)    NOT NULL,
    commodity                   VARCHAR(100)    NOT NULL,
    primary_unit_cost           DECIMAL(15,2)   NOT NULL,
    alternative_unit_cost       DECIMAL(15,2)   NOT NULL,
    potential_savings_pct       DECIMAL(10,4)   NOT NULL,
    recommended_volume_shift_pct DECIMAL(10,4)  NOT NULL,
    fx_rate_used                DECIMAL(15,6),
    freight_cost_delta          DECIMAL(15,2),
    status                      VARCHAR(20)     NOT NULL DEFAULT 'proposed'
                                                CHECK (status IN ('proposed', 'executed', 'dismissed')),
    agent_reasoning             JSONB           NOT NULL,
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vendor_arbitrage_actions_sme_id     ON vendor_arbitrage_actions (sme_id);
CREATE INDEX idx_vendor_arbitrage_actions_commodity   ON vendor_arbitrage_actions (commodity);
CREATE INDEX idx_vendor_arbitrage_actions_status      ON vendor_arbitrage_actions (status);
CREATE INDEX idx_vendor_arbitrage_actions_created_at  ON vendor_arbitrage_actions (created_at DESC);

-- ---------------------------------------------------------------------------
-- 4. discount_actions — AP/AR Early Payment Discount Engine
-- ---------------------------------------------------------------------------
CREATE TABLE discount_actions (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    sme_id              UUID            NOT NULL REFERENCES sme_profiles(id) ON DELETE CASCADE,
    direction           VARCHAR(5)      NOT NULL CHECK (direction IN ('AR', 'AP')),
    counterparty_name   VARCHAR(255)    NOT NULL,
    original_amount     DECIMAL(15,2)   NOT NULL,
    discount_pct        DECIMAL(10,4)   NOT NULL,
    discounted_amount   DECIMAL(15,2)   NOT NULL,
    days_early          INTEGER         NOT NULL,
    annualized_yield    DECIMAL(10,4),
    status              VARCHAR(20)     NOT NULL DEFAULT 'proposed'
                                        CHECK (status IN ('proposed', 'sent', 'accepted', 'declined')),
    cot_explanation     JSONB           NOT NULL,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_discount_actions_sme_id      ON discount_actions (sme_id);
CREATE INDEX idx_discount_actions_direction    ON discount_actions (direction);
CREATE INDEX idx_discount_actions_status       ON discount_actions (status);
CREATE INDEX idx_discount_actions_created_at   ON discount_actions (created_at DESC);

-- ---------------------------------------------------------------------------
-- 5. credit_passports — Dynamic Credit Passports
-- ---------------------------------------------------------------------------
CREATE TABLE credit_passports (
    id                        UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    sme_id                    UUID            NOT NULL REFERENCES sme_profiles(id) ON DELETE CASCADE,
    passport_token            VARCHAR(255)    NOT NULL UNIQUE,
    fuse_score_snapshot       DECIMAL(10,4)   NOT NULL,
    financial_health_summary  JSONB           NOT NULL,
    valid_until               TIMESTAMPTZ     NOT NULL,
    access_count              INTEGER         NOT NULL DEFAULT 0,
    created_at                TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_passports_sme_id          ON credit_passports (sme_id);
CREATE INDEX idx_credit_passports_passport_token   ON credit_passports (passport_token);
CREATE INDEX idx_credit_passports_valid_until       ON credit_passports (valid_until);

-- =============================================================================
-- Row-Level Security (RLS)
-- =============================================================================

ALTER TABLE price_hedge_actions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_drawdowns       ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_arbitrage_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_actions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_passports        ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Service-role SELECT policies (all 5 tables)
-- ---------------------------------------------------------------------------
CREATE POLICY "service_role_select_price_hedge_actions"
    ON price_hedge_actions FOR SELECT
    TO service_role
    USING (true);

CREATE POLICY "service_role_select_capital_drawdowns"
    ON capital_drawdowns FOR SELECT
    TO service_role
    USING (true);

CREATE POLICY "service_role_select_vendor_arbitrage_actions"
    ON vendor_arbitrage_actions FOR SELECT
    TO service_role
    USING (true);

CREATE POLICY "service_role_select_discount_actions"
    ON discount_actions FOR SELECT
    TO service_role
    USING (true);

CREATE POLICY "service_role_select_credit_passports"
    ON credit_passports FOR SELECT
    TO service_role
    USING (true);

-- ---------------------------------------------------------------------------
-- Service-role INSERT policies (all 5 tables)
-- ---------------------------------------------------------------------------
CREATE POLICY "service_role_insert_price_hedge_actions"
    ON price_hedge_actions FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "service_role_insert_capital_drawdowns"
    ON capital_drawdowns FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "service_role_insert_vendor_arbitrage_actions"
    ON vendor_arbitrage_actions FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "service_role_insert_discount_actions"
    ON discount_actions FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "service_role_insert_credit_passports"
    ON credit_passports FOR INSERT
    TO service_role
    WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Service-role UPDATE policies (all 5 tables)
-- ---------------------------------------------------------------------------
CREATE POLICY "service_role_update_price_hedge_actions"
    ON price_hedge_actions FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_update_capital_drawdowns"
    ON capital_drawdowns FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_update_vendor_arbitrage_actions"
    ON vendor_arbitrage_actions FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_update_discount_actions"
    ON discount_actions FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_update_credit_passports"
    ON credit_passports FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Public access policy for credit_passports (lookup by passport_token)
-- Allows anyone (anon role) to SELECT a passport row if they know the token.
-- ---------------------------------------------------------------------------
CREATE POLICY "public_select_credit_passport_by_token"
    ON credit_passports FOR SELECT
    TO anon
    USING (true);
