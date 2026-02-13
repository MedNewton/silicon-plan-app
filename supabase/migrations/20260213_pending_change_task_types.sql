-- WS-016: allow task-related pending change types in DB
-- Safe migration for both enum-based and text+check schemas.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'pending_change_type'
  ) THEN
    ALTER TYPE pending_change_type ADD VALUE IF NOT EXISTS 'add_task';
    ALTER TYPE pending_change_type ADD VALUE IF NOT EXISTS 'update_task';
    ALTER TYPE pending_change_type ADD VALUE IF NOT EXISTS 'delete_task';
  END IF;
END $$;

DO $$
DECLARE
  col_udt text;
  constraint_row record;
BEGIN
  SELECT c.udt_name
  INTO col_udt
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'business_plan_pending_changes'
    AND c.column_name = 'change_type';

  IF col_udt IS NULL THEN
    RAISE NOTICE 'Column public.business_plan_pending_changes.change_type not found; skipping check constraint migration.';
    RETURN;
  END IF;

  -- For text/varchar schemas, refresh check constraints to include task change types.
  IF col_udt <> 'pending_change_type' THEN
    FOR constraint_row IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public'
        AND t.relname = 'business_plan_pending_changes'
        AND c.contype = 'c'
        AND pg_get_constraintdef(c.oid) ILIKE '%change_type%'
    LOOP
      EXECUTE format(
        'ALTER TABLE public.business_plan_pending_changes DROP CONSTRAINT %I',
        constraint_row.conname
      );
    END LOOP;

    ALTER TABLE public.business_plan_pending_changes
      ADD CONSTRAINT business_plan_pending_changes_change_type_check
      CHECK (
        change_type IN (
          'add_section',
          'update_section',
          'delete_section',
          'reorder_sections',
          'add_chapter',
          'update_chapter',
          'delete_chapter',
          'reorder_chapters',
          'add_task',
          'update_task',
          'delete_task'
        )
      );
  END IF;
END $$;
