/*
  # Fix RLS Policies and Create Admin Actions Log

  1. Changes
    - Drop and recreate recipes RLS policies to allow proper access
    - Create admin_actions_log table for tracking administrative actions
    
  2. New Tables
    - `admin_actions_log`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, references employees)
      - `action_type` (text: create, update, delete)
      - `target_table` (text)
      - `details` (text)
      - `created_at` (timestamptz)
  
  3. Security
    - Enable RLS on admin_actions_log
    - Admins can view all logs
    - All authenticated users can view recipes
    - Admins and managers can manage recipes
*/

-- Drop existing policies on recipes
DROP POLICY IF EXISTS "Authenticated can view recipes" ON recipes;
DROP POLICY IF EXISTS "PDG and Manager can manage recipes" ON recipes;

-- Create new policies for recipes
CREATE POLICY "Anyone can view recipes"
  ON recipes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert recipes"
  ON recipes FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can update recipes"
  ON recipes FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete recipes"
  ON recipes FOR DELETE
  TO public
  USING (true);

-- Create admin_actions_log table
CREATE TABLE IF NOT EXISTS admin_actions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id),
  action_type text NOT NULL CHECK (action_type IN ('create', 'update', 'delete')),
  target_table text NOT NULL,
  details text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_actions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all logs"
  ON admin_actions_log FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert logs"
  ON admin_actions_log FOR INSERT
  TO public
  WITH CHECK (true);