-- Business Plan Tables Migration
-- Run this in your Supabase SQL editor

-- 1. workspace_business_plans table
CREATE TABLE IF NOT EXISTS workspace_business_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Business Plan',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'published', 'archived')),
  export_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id) -- One business plan per workspace
);

-- 2. business_plan_chapters table
CREATE TABLE IF NOT EXISTS business_plan_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_plan_id UUID NOT NULL REFERENCES workspace_business_plans(id) ON DELETE CASCADE,
  parent_chapter_id UUID REFERENCES business_plan_chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. business_plan_sections table
CREATE TABLE IF NOT EXISTS business_plan_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES business_plan_chapters(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN ('heading', 'text', 'bullet_list', 'numbered_list', 'table', 'chart', 'image', 'quote', 'callout')),
  content JSONB NOT NULL DEFAULT '{}',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. business_plan_ai_conversations table
CREATE TABLE IF NOT EXISTS business_plan_ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_plan_id UUID NOT NULL REFERENCES workspace_business_plans(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_plan_id, user_id) -- One conversation per user per business plan
);

-- 5. business_plan_ai_messages table
CREATE TABLE IF NOT EXISTS business_plan_ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES business_plan_ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. business_plan_pending_changes table
CREATE TABLE IF NOT EXISTS business_plan_pending_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES business_plan_ai_messages(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'delete')),
  target_type TEXT NOT NULL CHECK (target_type IN ('chapter', 'section')),
  target_id UUID DEFAULT NULL,
  proposed_data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ DEFAULT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_plan_chapters_business_plan_id ON business_plan_chapters(business_plan_id);
CREATE INDEX IF NOT EXISTS idx_business_plan_chapters_parent ON business_plan_chapters(parent_chapter_id);
CREATE INDEX IF NOT EXISTS idx_business_plan_sections_chapter_id ON business_plan_sections(chapter_id);
CREATE INDEX IF NOT EXISTS idx_business_plan_ai_conversations_business_plan_id ON business_plan_ai_conversations(business_plan_id);
CREATE INDEX IF NOT EXISTS idx_business_plan_ai_messages_conversation_id ON business_plan_ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_business_plan_pending_changes_message_id ON business_plan_pending_changes(message_id);
CREATE INDEX IF NOT EXISTS idx_business_plan_pending_changes_status ON business_plan_pending_changes(status);

-- Enable Row Level Security
ALTER TABLE workspace_business_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_plan_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_plan_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_plan_ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_plan_ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_plan_pending_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for service role - adjust as needed for client-side access)
-- For workspace_business_plans
CREATE POLICY "Allow all for service role" ON workspace_business_plans FOR ALL USING (true);

-- For business_plan_chapters
CREATE POLICY "Allow all for service role" ON business_plan_chapters FOR ALL USING (true);

-- For business_plan_sections
CREATE POLICY "Allow all for service role" ON business_plan_sections FOR ALL USING (true);

-- For business_plan_ai_conversations
CREATE POLICY "Allow all for service role" ON business_plan_ai_conversations FOR ALL USING (true);

-- For business_plan_ai_messages
CREATE POLICY "Allow all for service role" ON business_plan_ai_messages FOR ALL USING (true);

-- For business_plan_pending_changes
CREATE POLICY "Allow all for service role" ON business_plan_pending_changes FOR ALL USING (true);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_workspace_business_plans_updated_at ON workspace_business_plans;
CREATE TRIGGER update_workspace_business_plans_updated_at
  BEFORE UPDATE ON workspace_business_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_plan_chapters_updated_at ON business_plan_chapters;
CREATE TRIGGER update_business_plan_chapters_updated_at
  BEFORE UPDATE ON business_plan_chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_plan_sections_updated_at ON business_plan_sections;
CREATE TRIGGER update_business_plan_sections_updated_at
  BEFORE UPDATE ON business_plan_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_plan_ai_conversations_updated_at ON business_plan_ai_conversations;
CREATE TRIGGER update_business_plan_ai_conversations_updated_at
  BEFORE UPDATE ON business_plan_ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
