-- Workspace invite lifecycle tracking (WS-001 / WS-002 / WS-003)
-- Safe additive migration: no drops, no destructive updates.

ALTER TABLE workspace_member_invites
  ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS declined_by_user_id TEXT,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_by_user_id TEXT,
  ADD COLUMN IF NOT EXISTS resend_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ;

-- Backfill send timestamp for historical rows
UPDATE workspace_member_invites
SET last_sent_at = COALESCE(last_sent_at, created_at)
WHERE last_sent_at IS NULL;

-- Keep resend_count sane
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'workspace_member_invites_resend_count_nonnegative'
  ) THEN
    ALTER TABLE workspace_member_invites
      ADD CONSTRAINT workspace_member_invites_resend_count_nonnegative
      CHECK (resend_count >= 0);
  END IF;
END $$;

-- Query helpers for members/invites panel + invite actions
CREATE INDEX IF NOT EXISTS idx_workspace_member_invites_workspace_email
  ON workspace_member_invites (workspace_id, email);

CREATE INDEX IF NOT EXISTS idx_workspace_member_invites_pending
  ON workspace_member_invites (workspace_id, expires_at)
  WHERE accepted_at IS NULL
    AND declined_at IS NULL
    AND revoked_at IS NULL;
