/*
  # Configuration des salaires et permissions vehicules

  1. Nouvelles Tables
    - `grade_salary_config`
      - `id` (uuid, primary key)
      - `grade` (text) - Grade concerne
      - `salary_type` (text) - Type : fixed_hourly, revenue_percentage, margin_percentage
      - `hourly_rate` (decimal) - Taux horaire fixe
      - `percentage` (decimal) - Pourcentage CA ou marge
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Modifications
    - Ajout de `allowed_grades` dans `vehicles` (array de grades autorises)

  3. Securite
    - RLS sur grade_salary_config
    - Seuls PDG et CoPDG peuvent modifier la config salaires
*/

-- Creer table configuration salaires par grade
CREATE TABLE IF NOT EXISTS grade_salary_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade text NOT NULL UNIQUE,
  salary_type text NOT NULL DEFAULT 'fixed_hourly',
  hourly_rate decimal(10,2) DEFAULT 0,
  percentage decimal(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_salary_type CHECK (salary_type IN ('fixed_hourly', 'revenue_percentage', 'margin_percentage')),
  CONSTRAINT valid_grade CHECK (grade IN ('PDG', 'CoPDG', 'Manager', 'Chef d''équipe', 'Employé Polyvalent'))
);

-- Ajouter colonne allowed_grades dans vehicles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'allowed_grades'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN allowed_grades text[] DEFAULT '{}';
  END IF;
END $$;

-- Activer RLS sur grade_salary_config
ALTER TABLE grade_salary_config ENABLE ROW LEVEL SECURITY;

-- Politique lecture pour PDG et CoPDG
CREATE POLICY "PDG and CoPDG can read salary config"
  ON grade_salary_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.grade IN ('PDG', 'CoPDG')
    )
  );

-- Politique modification pour PDG et CoPDG
CREATE POLICY "PDG and CoPDG can update salary config"
  ON grade_salary_config
  FOR UPDATE
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

-- Politique insertion pour PDG et CoPDG
CREATE POLICY "PDG and CoPDG can insert salary config"
  ON grade_salary_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.grade IN ('PDG', 'CoPDG')
    )
  );

-- Inserer configuration par defaut pour chaque grade
INSERT INTO grade_salary_config (grade, salary_type, hourly_rate, percentage)
VALUES
  ('PDG', 'fixed_hourly', 50.00, 0),
  ('CoPDG', 'fixed_hourly', 45.00, 0),
  ('Manager', 'fixed_hourly', 35.00, 0),
  ('Chef d''équipe', 'fixed_hourly', 25.00, 0),
  ('Employé Polyvalent', 'fixed_hourly', 20.00, 0)
ON CONFLICT (grade) DO NOTHING;