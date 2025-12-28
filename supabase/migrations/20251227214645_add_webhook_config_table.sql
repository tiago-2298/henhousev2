/*
  # Ajout de la table de configuration des webhooks

  1. New Tables
    - `webhook_config`
      - `id` (uuid, primary key)
      - `name` (text) - Nom du webhook (Discord, FiveM, etc.)
      - `webhook_url` (text) - URL du webhook
      - `is_active` (boolean) - Si le webhook est actif
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `webhook_config` table
    - Only PDG and CoPDG can view and manage webhooks
*/

CREATE TABLE IF NOT EXISTS webhook_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  webhook_url text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE webhook_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PDG and CoPDG can view webhooks"
  ON webhook_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.grade IN ('PDG', 'CoPDG')
    )
  );

CREATE POLICY "PDG and CoPDG can insert webhooks"
  ON webhook_config FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.grade IN ('PDG', 'CoPDG')
    )
  );

CREATE POLICY "PDG and CoPDG can update webhooks"
  ON webhook_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.grade IN ('PDG', 'CoPDG')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.grade IN ('PDG', 'CoPDG')
    )
  );

CREATE POLICY "PDG and CoPDG can delete webhooks"
  ON webhook_config FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.grade IN ('PDG', 'CoPDG')
    )
  );

-- Insert default Discord webhook entry
INSERT INTO webhook_config (name, webhook_url, is_active)
VALUES ('Discord Admin', '', true)
ON CONFLICT DO NOTHING;