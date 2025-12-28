/*
  # Ajout de la production B2B et système d'annonces

  1. Changes
    - Ajout du champ `partner_id` à la table `production_orders` pour lier à un partenaire B2B
    - Mise à jour des politiques RLS pour `announcements` pour permettre aux PDG/CoPDG de créer des annonces

  2. Security
    - Maintien des politiques RLS existantes
    - Les PDG et CoPDG peuvent créer et gérer les annonces
*/

-- Ajouter le champ partner_id à production_orders s'il n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'production_orders' AND column_name = 'partner_id'
  ) THEN
    ALTER TABLE production_orders ADD COLUMN partner_id uuid REFERENCES partners(id);
  END IF;
END $$;

-- Supprimer les anciennes politiques d'annonces si elles existent
DROP POLICY IF EXISTS "Allow all for authenticated users" ON announcements;

-- Créer les nouvelles politiques pour les annonces
CREATE POLICY "Authenticated employees can view announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
    )
  );

CREATE POLICY "PDG and CoPDG can insert announcements"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.grade IN ('PDG', 'CoPDG')
    )
  );

CREATE POLICY "PDG and CoPDG can update announcements"
  ON announcements FOR UPDATE
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

CREATE POLICY "PDG and CoPDG can delete announcements"
  ON announcements FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.grade IN ('PDG', 'CoPDG')
    )
  );