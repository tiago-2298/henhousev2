/*
  # Fix Admin Actions Log Table Columns (Version 2)

  1. Changes
    - Add module_name column to admin_actions_log
    - Properly convert details column to jsonb type
*/

-- Add module_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_actions_log' AND column_name = 'module_name'
  ) THEN
    ALTER TABLE admin_actions_log ADD COLUMN module_name text DEFAULT '';
  END IF;
END $$;

-- Change details to jsonb properly
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_actions_log' 
    AND column_name = 'details'
    AND data_type = 'text'
  ) THEN
    -- Drop default first
    ALTER TABLE admin_actions_log ALTER COLUMN details DROP DEFAULT;
    -- Change type
    ALTER TABLE admin_actions_log ALTER COLUMN details TYPE jsonb USING 
      CASE 
        WHEN details = '' THEN '{}'::jsonb
        ELSE jsonb_build_object('description', details)
      END;
    -- Set new default
    ALTER TABLE admin_actions_log ALTER COLUMN details SET DEFAULT '{}'::jsonb;
  END IF;
END $$;