-- Add profile picture and intro video columns to consultants
ALTER TABLE consultants
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT;
