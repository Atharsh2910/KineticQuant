-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: sme_profiles
CREATE TABLE sme_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lender_id UUID NOT NULL, -- Represents the lender who owns this portfolio
    name VARCHAR(255) NOT NULL,
    industry_category VARCHAR(100) NOT NULL,
    supply_chain_dependencies JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: financial_ledgers
CREATE TABLE financial_ledgers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sme_id UUID REFERENCES sme_profiles(id) ON DELETE CASCADE,
    cash_on_hand DECIMAL(15, 2) NOT NULL,
    accounts_payable DECIMAL(15, 2) NOT NULL,
    accounts_receivable DECIMAL(15, 2) NOT NULL,
    inventory_holding_costs DECIMAL(15, 2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: market_time_series
CREATE TABLE market_time_series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: fuse_score_history
CREATE TABLE fuse_score_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sme_id UUID REFERENCES sme_profiles(id) ON DELETE CASCADE,
    fuse_score DECIMAL(10, 4) NOT NULL,
    base_score DECIMAL(10, 4) NOT NULL,
    delta_score DECIMAL(10, 4) NOT NULL,
    sentiment_multiplier DECIMAL(10, 4) NOT NULL,
    cot_explanation JSONB NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)

ALTER TABLE sme_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_time_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuse_score_history ENABLE ROW LEVEL SECURITY;

-- Policies for sme_profiles
CREATE POLICY "Lenders can view their own SME profiles"
    ON sme_profiles FOR SELECT
    USING (auth.uid() = lender_id);

CREATE POLICY "Lenders can insert their own SME profiles"
    ON sme_profiles FOR INSERT
    WITH CHECK (auth.uid() = lender_id);

-- Policies for financial_ledgers
CREATE POLICY "Lenders can view ledgers of their SMEs"
    ON financial_ledgers FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM sme_profiles WHERE id = sme_id AND lender_id = auth.uid()
    ));

-- Policies for market_time_series (Typically globally readable by authenticated users or service role)
CREATE POLICY "Anyone can view market data"
    ON market_time_series FOR SELECT
    USING (true);

-- Policies for fuse_score_history
CREATE POLICY "Lenders can view fuse scores of their SMEs"
    ON fuse_score_history FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM sme_profiles WHERE id = sme_id AND lender_id = auth.uid()
    ));

