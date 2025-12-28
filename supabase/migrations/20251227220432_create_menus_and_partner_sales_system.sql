/*
  # Système de menus et ventes partenaires

  1. Nouvelles Tables
    - `menus`
      - `id` (uuid, primary key)
      - `name` (text) - Nom du menu (ex: "Menu Duo")
      - `description` (text) - Description
      - `price` (numeric) - Prix de vente standard
      - `category` (text) - Catégorie
      - `image_url` (text) - Image
      - `is_active` (boolean) - Actif ou non
      - `created_at` (timestamp)
    
    - `menu_items`
      - `id` (uuid, primary key)
      - `menu_id` (uuid, foreign key -> menus)
      - `product_id` (uuid, foreign key -> products)
      - `quantity` (integer) - Quantité de ce produit dans le menu
      - `created_at` (timestamp)
    
    - `partner_menu_permissions`
      - `id` (uuid, primary key)
      - `partner_id` (uuid, foreign key -> partners)
      - `menu_id` (uuid, foreign key -> menus)
      - `partner_price` (numeric) - Prix spécial pour le partenaire
      - `daily_limit` (integer) - Limite par jour (ex: 5)
      - `is_active` (boolean)
      - `created_at` (timestamp)
    
    - `partner_sales`
      - `id` (uuid, primary key)
      - `partner_id` (uuid, foreign key -> partners)
      - `menu_id` (uuid, foreign key -> menus)
      - `employee_id` (uuid, foreign key -> employees) - Qui a enregistré la vente
      - `quantity` (integer)
      - `unit_price` (numeric) - Prix unitaire du partenaire
      - `total` (numeric)
      - `sale_date` (date)
      - `invoice_id` (uuid, nullable) - Référence à la facture si facturée
      - `created_at` (timestamp)
    
    - `partner_invoices`
      - `id` (uuid, primary key)
      - `partner_id` (uuid, foreign key -> partners)
      - `invoice_number` (text, unique)
      - `start_date` (date) - Début de la période
      - `end_date` (date) - Fin de la période
      - `total_amount` (numeric)
      - `status` (text) - 'pending', 'paid', 'cancelled'
      - `created_at` (timestamp)
      - `paid_at` (timestamp, nullable)

  2. Modifications
    - Ajouter `webhook_url` à la table `partners`
    - Modifier `grade_salary_config` pour ajouter `calculation_basis`

  3. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques pour authenticated users
*/

-- Table des menus
CREATE TABLE IF NOT EXISTS menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'Menus',
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read menus"
  ON menus FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert menus"
  ON menus FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update menus"
  ON menus FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete menus"
  ON menus FOR DELETE
  TO authenticated
  USING (true);

-- Table des items de menu
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id uuid NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(menu_id, product_id)
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read menu_items"
  ON menu_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert menu_items"
  ON menu_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update menu_items"
  ON menu_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete menu_items"
  ON menu_items FOR DELETE
  TO authenticated
  USING (true);

-- Ajouter webhook_url à partners
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'webhook_url'
  ) THEN
    ALTER TABLE partners ADD COLUMN webhook_url text DEFAULT '';
  END IF;
END $$;

-- Table des permissions de menu pour les partenaires
CREATE TABLE IF NOT EXISTS partner_menu_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  menu_id uuid NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  partner_price numeric(10,2) NOT NULL DEFAULT 0,
  daily_limit integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(partner_id, menu_id)
);

ALTER TABLE partner_menu_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read partner_menu_permissions"
  ON partner_menu_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert partner_menu_permissions"
  ON partner_menu_permissions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update partner_menu_permissions"
  ON partner_menu_permissions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete partner_menu_permissions"
  ON partner_menu_permissions FOR DELETE
  TO authenticated
  USING (true);

-- Table des ventes partenaires
CREATE TABLE IF NOT EXISTS partner_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
  menu_id uuid NOT NULL REFERENCES menus(id) ON DELETE RESTRICT,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  total numeric(10,2) NOT NULL,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  invoice_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE partner_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read partner_sales"
  ON partner_sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert partner_sales"
  ON partner_sales FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update partner_sales"
  ON partner_sales FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete partner_sales"
  ON partner_sales FOR DELETE
  TO authenticated
  USING (true);

-- Table des factures partenaires
CREATE TABLE IF NOT EXISTS partner_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
  invoice_number text UNIQUE NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz
);

ALTER TABLE partner_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read partner_invoices"
  ON partner_invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert partner_invoices"
  ON partner_invoices FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update partner_invoices"
  ON partner_invoices FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete partner_invoices"
  ON partner_invoices FOR DELETE
  TO authenticated
  USING (true);

-- Modifier grade_salary_config pour ajouter calculation_basis
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'grade_salary_config' AND column_name = 'calculation_basis'
  ) THEN
    ALTER TABLE grade_salary_config ADD COLUMN calculation_basis text DEFAULT 'revenue';
  END IF;
END $$;

-- Ajouter une contrainte pour calculation_basis
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'grade_salary_config_calculation_basis_check'
  ) THEN
    ALTER TABLE grade_salary_config 
    ADD CONSTRAINT grade_salary_config_calculation_basis_check 
    CHECK (calculation_basis IN ('revenue', 'margin'));
  END IF;
END $$;

-- Supprimer l'ancienne table webhook_config
DROP TABLE IF EXISTS webhook_config CASCADE;
