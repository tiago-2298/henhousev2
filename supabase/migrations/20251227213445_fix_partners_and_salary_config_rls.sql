/*
  # Correction des politiques RLS pour partners et grade_salary_config

  1. Changes
    - Mise à jour des politiques RLS pour partners
      - Utilisation de auth.uid() au lieu de current_setting
      - Permettre aux PDG/CoPDG de gérer les partenaires
    
    - Mise à jour des politiques RLS pour grade_salary_config
      - Permettre à tous les employés authentifiés de lire la config
      - Seuls PDG/CoPDG peuvent modifier

  2. Security
    - Maintien de la sécurité appropriée pour chaque table
    - Utilisation cohérente de auth.uid()
*/

-- Drop existing partners policies
DROP POLICY IF EXISTS "Authenticated can view partners" ON partners;
DROP POLICY IF EXISTS "PDG and Manager can manage partners" ON partners;

-- Create new partners policies
CREATE POLICY "Anyone can view partners"
  ON partners FOR SELECT
  TO public
  USING (true);

CREATE POLICY "PDG and CoPDG can insert partners"
  ON partners FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.grade IN ('PDG', 'CoPDG')
    )
  );

CREATE POLICY "PDG and CoPDG can update partners"
  ON partners FOR UPDATE
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

CREATE POLICY "PDG and CoPDG can delete partners"
  ON partners FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.grade IN ('PDG', 'CoPDG')
    )
  );

-- Drop existing grade_salary_config policies
DROP POLICY IF EXISTS "PDG and CoPDG can read salary config" ON grade_salary_config;
DROP POLICY IF EXISTS "PDG and CoPDG can insert salary config" ON grade_salary_config;
DROP POLICY IF EXISTS "PDG and CoPDG can update salary config" ON grade_salary_config;

-- Create new grade_salary_config policies - Everyone can read, only PDG/CoPDG can modify
CREATE POLICY "Authenticated employees can read salary config"
  ON grade_salary_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
    )
  );

CREATE POLICY "PDG and CoPDG can insert salary config"
  ON grade_salary_config FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.grade IN ('PDG', 'CoPDG')
    )
  );

CREATE POLICY "PDG and CoPDG can update salary config"
  ON grade_salary_config FOR UPDATE
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

CREATE POLICY "PDG and CoPDG can delete salary config"
  ON grade_salary_config FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.grade IN ('PDG', 'CoPDG')
    )
  );