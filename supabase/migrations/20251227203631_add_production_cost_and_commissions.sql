/*
  # Ajout coût de production et système de commissions

  1. Modifications Tables
    - `products`
      - Ajouter `production_cost` (numeric) - Coût de production calculé
      - Ajouter `margin` (numeric) - Marge bénéficiaire
    - `employees`
      - Mettre à jour les valeurs de grade possibles
      - Ajouter `commission_rate` (numeric) - Taux de commission selon grade
  
  2. Notes
    - Les ingrédients sont déjà gérés via la table `recipes`
    - Les grades et commissions:
      - Employé Polyvalent: 80% de la marge
      - Chef d'équipe: 83% de la marge
      - Manager: 40% du CA
      - PDG/CoPDG: 50% du CA
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'production_cost'
  ) THEN
    ALTER TABLE products ADD COLUMN production_cost numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'margin'
  ) THEN
    ALTER TABLE products ADD COLUMN margin numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE employees ADD COLUMN commission_rate numeric DEFAULT 0;
  END IF;
END $$;

ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_grade_check;

ALTER TABLE employees ADD CONSTRAINT employees_grade_check 
CHECK (grade = ANY (ARRAY[
  'PDG'::text, 
  'CoPDG'::text,
  'Manager'::text, 
  'Chef d''équipe'::text,
  'Employé Polyvalent'::text
]));

UPDATE products 
SET margin = price - production_cost 
WHERE margin = 0;
