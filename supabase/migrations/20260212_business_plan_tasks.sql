-- Business plan task model (CORE-011)

CREATE TABLE IF NOT EXISTS business_plan_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_plan_id UUID NOT NULL REFERENCES workspace_business_plans(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES business_plan_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '',
  ai_prompt TEXT NOT NULL DEFAULT '',
  hierarchy_level TEXT NOT NULL CHECK (hierarchy_level IN ('h1', 'h2')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (hierarchy_level = 'h1' AND parent_task_id IS NULL) OR
    (hierarchy_level = 'h2' AND parent_task_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_business_plan_tasks_business_plan_id
  ON business_plan_tasks(business_plan_id);
CREATE INDEX IF NOT EXISTS idx_business_plan_tasks_parent_task_id
  ON business_plan_tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_business_plan_tasks_business_parent_order
  ON business_plan_tasks(business_plan_id, parent_task_id, order_index);

ALTER TABLE business_plan_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for service role" ON business_plan_tasks;
CREATE POLICY "Allow all for service role"
  ON business_plan_tasks
  FOR ALL
  USING (true);

DROP TRIGGER IF EXISTS update_business_plan_tasks_updated_at ON business_plan_tasks;
CREATE TRIGGER update_business_plan_tasks_updated_at
  BEFORE UPDATE ON business_plan_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
