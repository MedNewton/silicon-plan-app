-- WS-016: Align pending-change status vocabulary
-- Original migration (20260126) used: 'pending', 'accepted', 'rejected'
-- Application code uses: 'pending', 'approved', 'rejected'
-- This migration adds 'approved' as a valid status value alongside 'accepted'
-- for backward compatibility, and adds a 'conversation_id' column if missing.

-- Step 1: Add 'approved' to enum type if it exists
DO $$
BEGIN
  -- Check if pending_change_status enum exists
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'pending_change_status'
  ) THEN
    -- Add 'approved' value if not already present
    BEGIN
      ALTER TYPE pending_change_status ADD VALUE IF NOT EXISTS 'approved';
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'Value "approved" already exists in enum pending_change_status';
    END;
  END IF;
END $$;

-- Step 2: Handle text/varchar schemas with check constraints
DO $$
DECLARE
  col_udt text;
  constraint_row record;
BEGIN
  -- Check column type
  SELECT c.udt_name
  INTO col_udt
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'business_plan_pending_changes'
    AND c.column_name = 'status';

  IF col_udt IS NULL THEN
    RAISE NOTICE 'Column public.business_plan_pending_changes.status not found; skipping.';
    RETURN;
  END IF;

  -- For text/varchar schemas, refresh check constraints to include both 'accepted' and 'approved'
  IF col_udt IN ('text', 'varchar', 'character varying') THEN
    -- Drop existing status check constraints
    FOR constraint_row IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public'
        AND t.relname = 'business_plan_pending_changes'
        AND c.contype = 'c'
        AND pg_get_constraintdef(c.oid) ILIKE '%status%'
    LOOP
      EXECUTE format(
        'ALTER TABLE public.business_plan_pending_changes DROP CONSTRAINT %I',
        constraint_row.conname
      );
    END LOOP;

    -- Add new constraint that accepts both 'accepted' and 'approved'
    ALTER TABLE public.business_plan_pending_changes
      ADD CONSTRAINT business_plan_pending_changes_status_check
      CHECK (status IN ('pending', 'accepted', 'approved', 'rejected'));
  END IF;
END $$;

-- Step 3: Backfill existing 'accepted' rows to 'approved' for consistency
-- This ensures the app code only needs to deal with 'approved' going forward.
-- Only run if there are actually rows with 'accepted' status
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'business_plan_pending_changes'
      AND column_name = 'status'
  ) THEN
    -- Check if any rows have 'accepted' status before updating
    IF EXISTS (
      SELECT 1
      FROM public.business_plan_pending_changes
      WHERE status::text = 'accepted'
      LIMIT 1
    ) THEN
      UPDATE public.business_plan_pending_changes
      SET status = 'approved'
      WHERE status::text = 'accepted';
      
      RAISE NOTICE 'Backfilled accepted → approved status values';
    ELSE
      RAISE NOTICE 'No rows with accepted status found, skipping backfill';
    END IF;
  END IF;
END $$;

-- Also ensure the 'reviewed_at' column exists (original migration used 'resolved_at')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'business_plan_pending_changes'
      AND column_name = 'reviewed_at'
  ) THEN
    -- Check if 'resolved_at' exists and rename it
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'business_plan_pending_changes'
        AND column_name = 'resolved_at'
    ) THEN
      ALTER TABLE public.business_plan_pending_changes
        RENAME COLUMN resolved_at TO reviewed_at;
    ELSE
      ALTER TABLE public.business_plan_pending_changes
        ADD COLUMN reviewed_at TIMESTAMPTZ DEFAULT NULL;
    END IF;
  END IF;
END $$;

-- Ensure 'conversation_id' column exists (app code references it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'business_plan_pending_changes'
      AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE public.business_plan_pending_changes
      ADD COLUMN conversation_id UUID DEFAULT NULL;
  END IF;
END $$;

-- Ensure 'parent_id' column exists on chapters (original used 'parent_chapter_id')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'business_plan_chapters'
      AND column_name = 'parent_id'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'business_plan_chapters'
        AND column_name = 'parent_chapter_id'
    ) THEN
      ALTER TABLE public.business_plan_chapters
        RENAME COLUMN parent_chapter_id TO parent_id;
    ELSE
      ALTER TABLE public.business_plan_chapters
        ADD COLUMN parent_id UUID DEFAULT NULL REFERENCES business_plan_chapters(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Ensure 'is_collapsed' column exists on chapters
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'business_plan_chapters'
      AND column_name = 'is_collapsed'
  ) THEN
    ALTER TABLE public.business_plan_chapters
      ADD COLUMN is_collapsed BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add missing section_type enum values if enum exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'business_plan_section_type'
  ) THEN
    -- Add missing values one by one
    BEGIN
      ALTER TYPE business_plan_section_type ADD VALUE IF NOT EXISTS 'heading';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE business_plan_section_type ADD VALUE IF NOT EXISTS 'bullet_list';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE business_plan_section_type ADD VALUE IF NOT EXISTS 'numbered_list';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE business_plan_section_type ADD VALUE IF NOT EXISTS 'chart';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE business_plan_section_type ADD VALUE IF NOT EXISTS 'quote';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE business_plan_section_type ADD VALUE IF NOT EXISTS 'callout';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Relax section_type check constraint to match app-level types (for text/varchar schemas)
DO $$
DECLARE
  constraint_row record;
  col_udt text;
BEGIN
  -- Check if section_type is text/varchar (not enum)
  SELECT c.udt_name
  INTO col_udt
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'business_plan_sections'
    AND c.column_name = 'section_type';

  IF col_udt IN ('text', 'varchar', 'character varying') THEN
    -- Drop existing constraints
    FOR constraint_row IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public'
        AND t.relname = 'business_plan_sections'
        AND c.contype = 'c'
        AND pg_get_constraintdef(c.oid) ILIKE '%section_type%'
    LOOP
      EXECUTE format(
        'ALTER TABLE public.business_plan_sections DROP CONSTRAINT %I',
        constraint_row.conname
      );
    END LOOP;

    -- Add new constraint with all values
    ALTER TABLE public.business_plan_sections
      ADD CONSTRAINT business_plan_sections_section_type_check
      CHECK (section_type IN (
        'section_title', 'subsection', 'text', 'image', 'table', 'list',
        'comparison_table', 'timeline', 'embed', 'page_break', 'empty_space',
        'heading', 'bullet_list', 'numbered_list', 'chart', 'quote', 'callout'
      ));
  END IF;
END $$;

-- Drop legacy change_type and target_type constraints if they still use old format
DO $$
DECLARE
  constraint_row record;
  has_target_type boolean;
BEGIN
  -- Check if target_type column exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'business_plan_pending_changes'
      AND column_name = 'target_type'
  ) INTO has_target_type;

  -- Drop old change_type constraints that use 'create'/'update'/'delete'
  FOR constraint_row IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'business_plan_pending_changes'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%change_type%'
      AND pg_get_constraintdef(c.oid) ILIKE '%create%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.business_plan_pending_changes DROP CONSTRAINT %I',
      constraint_row.conname
    );
  END LOOP;

  -- Drop target_type constraints if they exist
  IF has_target_type THEN
    FOR constraint_row IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public'
        AND t.relname = 'business_plan_pending_changes'
        AND c.contype = 'c'
        AND pg_get_constraintdef(c.oid) ILIKE '%target_type%'
    LOOP
      EXECUTE format(
        'ALTER TABLE public.business_plan_pending_changes DROP CONSTRAINT %I',
        constraint_row.conname
      );
    END LOOP;
  END IF;
END $$;
