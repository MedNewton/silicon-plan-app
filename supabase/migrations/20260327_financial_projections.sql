-- Migration: workspace_financial_projections
-- Stores structured financial data, industry classification, and computed
-- valuation results for the Pre-Money Valuation module.

CREATE TABLE IF NOT EXISTS workspace_financial_projections (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID          NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Structured financial inputs (revenue lines, cost lines, balance sheet, valuation params)
  financial_data          JSONB NOT NULL DEFAULT '{}',

  -- Resolved industry: onboarding sector, ATECO, Damodaran industry, multiples
  industry_classification JSONB,

  -- Cached computation results from all 4 valuation methods + summary
  valuation_results       JSONB,

  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),

  -- One financial projection record per workspace
  UNIQUE(workspace_id)
);

-- Row Level Security
ALTER TABLE workspace_financial_projections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for service role"
  ON workspace_financial_projections
  FOR ALL
  USING (true);

-- Auto-update updated_at on row modification
CREATE TRIGGER update_workspace_financial_projections_updated_at
  BEFORE UPDATE ON workspace_financial_projections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
