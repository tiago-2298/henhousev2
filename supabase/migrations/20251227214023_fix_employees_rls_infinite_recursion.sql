/*
  # Correction de la récursion infinie dans les politiques RLS employees

  1. Changes
    - Suppression des politiques existantes qui causent la récursion
    - Création de nouvelles politiques utilisant auth.uid() au lieu de current_setting
    - Utilisation d'une approche sans récursion pour vérifier les permissions

  2. Security
    - Tous les employés authentifiés peuvent voir les employés
    - Seuls PDG et CoPDG peuvent gérer les employés
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Employees can view all employees" ON employees;
DROP POLICY IF EXISTS "PDG and Manager can manage employees" ON employees;

-- Create new non-recursive policies
CREATE POLICY "Authenticated employees can view all employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "PDG and CoPDG can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.grade IN ('PDG', 'CoPDG')
    )
  );

CREATE POLICY "PDG and CoPDG can update employees"
  ON employees FOR UPDATE
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

CREATE POLICY "PDG and CoPDG can delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.grade IN ('PDG', 'CoPDG')
    )
  );