-- Consultant favorites table
CREATE TABLE IF NOT EXISTS consultant_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  consultant_id UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, consultant_id)
);

CREATE INDEX IF NOT EXISTS idx_consultant_favorites_user ON consultant_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_consultant_favorites_consultant ON consultant_favorites(consultant_id);
