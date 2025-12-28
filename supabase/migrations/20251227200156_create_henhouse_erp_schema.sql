/*
  # Hen House ERP - Schema Complet

  ## 1. Nouvelles Tables

  ### Employés & RH
  - `employees`
    - `id` (uuid, primary key)
    - `username` (text, unique) - Identifiant de connexion
    - `password` (text) - Mot de passe
    - `first_name` (text) - Prénom
    - `last_name` (text) - Nom
    - `personal_id` (text) - ID personnel
    - `rib` (text) - RIB bancaire
    - `phone` (text) - Téléphone
    - `grade` (text) - PDG, Manager, Employé Polyvalent
    - `hourly_rate` (numeric) - Taux horaire en €
    - `hire_date` (date) - Date d'arrivée
    - `is_active` (boolean)
    - `created_at` (timestamptz)

  ### Pointeuse
  - `timesheets`
    - `id` (uuid, primary key)
    - `employee_id` (uuid, foreign key)
    - `check_in` (timestamptz)
    - `check_out` (timestamptz, nullable)
    - `total_hours` (numeric, nullable)
    - `week_number` (integer) - Numéro de semaine
    - `year` (integer)
    - `created_at` (timestamptz)

  ### Catalogue Produits
  - `products`
    - `id` (uuid, primary key)
    - `name` (text)
    - `description` (text)
    - `price` (numeric)
    - `category` (text) - Plats, Boissons, Menus
    - `image_url` (text)
    - `is_active` (boolean)
    - `created_at` (timestamptz)

  ### Stocks Niveau 1 (Ingrédients Bruts)
  - `raw_ingredients`
    - `id` (uuid, primary key)
    - `name` (text)
    - `unit` (text) - kg, L, unités
    - `quantity` (numeric)
    - `min_threshold` (numeric) - Seuil minimum
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### Stocks Niveau 2 (Frigo Prêt-à-Vendre)
  - `ready_stock`
    - `id` (uuid, primary key)
    - `product_id` (uuid, foreign key)
    - `quantity` (integer)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### Recettes (Lien Produit -> Ingrédients)
  - `recipes`
    - `id` (uuid, primary key)
    - `product_id` (uuid, foreign key)
    - `ingredient_id` (uuid, foreign key)
    - `quantity_needed` (numeric)
    - `created_at` (timestamptz)

  ### Ventes
  - `sales`
    - `id` (uuid, primary key)
    - `employee_id` (uuid, foreign key)
    - `invoice_number` (text, unique) - N° Facture obligatoire
    - `total` (numeric)
    - `payment_method` (text)
    - `customer_type` (text) - B2C, B2B
    - `partner_id` (uuid, nullable, foreign key)
    - `created_at` (timestamptz)

  - `sale_items`
    - `id` (uuid, primary key)
    - `sale_id` (uuid, foreign key)
    - `product_id` (uuid, foreign key)
    - `quantity` (integer)
    - `unit_price` (numeric)
    - `subtotal` (numeric)
    - `created_at` (timestamptz)

  ### Production
  - `production_logs`
    - `id` (uuid, primary key)
    - `employee_id` (uuid, foreign key)
    - `product_id` (uuid, foreign key)
    - `quantity_produced` (integer)
    - `created_at` (timestamptz)

  ### Véhicules & Garage
  - `vehicles`
    - `id` (uuid, primary key)
    - `name` (text)
    - `model` (text)
    - `plate_number` (text)
    - `fuel_level` (integer) - Pourcentage 0-100
    - `condition` (text) - Excellent, Bon, Moyen, Mauvais
    - `is_available` (boolean)
    - `created_at` (timestamptz)

  - `vehicle_logs`
    - `id` (uuid, primary key)
    - `vehicle_id` (uuid, foreign key)
    - `employee_id` (uuid, foreign key)
    - `action` (text) - Sortie, Retour
    - `fuel_level` (integer)
    - `condition` (text)
    - `notes` (text)
    - `created_at` (timestamptz)

  ### Dépenses & Pertes
  - `expenses`
    - `id` (uuid, primary key)
    - `employee_id` (uuid, foreign key)
    - `type` (text) - Essence, Réparation, Autre
    - `amount` (numeric)
    - `description` (text)
    - `vehicle_id` (uuid, nullable, foreign key)
    - `created_at` (timestamptz)

  - `losses`
    - `id` (uuid, primary key)
    - `employee_id` (uuid, foreign key)
    - `item_type` (text) - Produit, Ingrédient
    - `item_id` (uuid)
    - `quantity` (numeric)
    - `reason` (text)
    - `created_at` (timestamptz)

  ### Partenaires B2B
  - `partners`
    - `id` (uuid, primary key)
    - `name` (text)
    - `contact` (text)
    - `special_menu` (jsonb) - Menu spécifique
    - `is_active` (boolean)
    - `created_at` (timestamptz)

  ### Configuration
  - `settings`
    - `id` (uuid, primary key)
    - `company_name` (text)
    - `logo_url` (text)
    - `updated_at` (timestamptz)

  ## 2. Sécurité RLS
  - Toutes les tables avec RLS activé
  - Policies basées sur les grades

  ## 3. Indexes pour performance
*/

-- DROP existing tables if they exist
DROP TABLE IF EXISTS discord_webhooks CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  personal_id text DEFAULT '',
  rib text DEFAULT '',
  phone text DEFAULT '',
  grade text NOT NULL CHECK (grade IN ('PDG', 'Manager', 'Employé Polyvalent')),
  hourly_rate numeric NOT NULL DEFAULT 15.0,
  hire_date date NOT NULL DEFAULT CURRENT_DATE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Timesheets
CREATE TABLE IF NOT EXISTS timesheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  check_in timestamptz NOT NULL DEFAULT now(),
  check_out timestamptz,
  total_hours numeric,
  week_number integer NOT NULL,
  year integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL CHECK (price >= 0),
  category text NOT NULL CHECK (category IN ('Plats', 'Boissons', 'Menus', 'Desserts')),
  image_url text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Raw Ingredients
CREATE TABLE IF NOT EXISTS raw_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text NOT NULL CHECK (unit IN ('kg', 'L', 'unités')),
  quantity numeric NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_threshold numeric NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ready Stock
CREATE TABLE IF NOT EXISTS ready_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id)
);

-- Recipes
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES raw_ingredients(id) ON DELETE CASCADE,
  quantity_needed numeric NOT NULL CHECK (quantity_needed > 0),
  created_at timestamptz DEFAULT now()
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE SET NULL,
  invoice_number text UNIQUE NOT NULL,
  total numeric NOT NULL CHECK (total >= 0),
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'banking')),
  customer_type text DEFAULT 'B2C' CHECK (customer_type IN ('B2C', 'B2B')),
  partner_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE SET NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  subtotal numeric NOT NULL CHECK (subtotal >= 0),
  created_at timestamptz DEFAULT now()
);

-- Production Logs
CREATE TABLE IF NOT EXISTS production_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE SET NULL,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_produced integer NOT NULL CHECK (quantity_produced > 0),
  created_at timestamptz DEFAULT now()
);

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  model text NOT NULL,
  plate_number text NOT NULL,
  fuel_level integer NOT NULL DEFAULT 100 CHECK (fuel_level >= 0 AND fuel_level <= 100),
  condition text NOT NULL DEFAULT 'Excellent' CHECK (condition IN ('Excellent', 'Bon', 'Moyen', 'Mauvais')),
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Vehicle Logs
CREATE TABLE IF NOT EXISTS vehicle_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('Sortie', 'Retour')),
  fuel_level integer NOT NULL,
  condition text NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('Essence', 'Réparation', 'Autre')),
  amount numeric NOT NULL CHECK (amount >= 0),
  description text NOT NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Losses
CREATE TABLE IF NOT EXISTS losses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE SET NULL,
  item_type text NOT NULL CHECK (item_type IN ('Produit', 'Ingrédient')),
  item_id uuid NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Partners
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text DEFAULT '',
  special_menu jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'Hen House',
  logo_url text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ready_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE losses ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees
CREATE POLICY "Employees can view all employees"
  ON employees FOR SELECT
  USING (true);

CREATE POLICY "PDG and Manager can manage employees"
  ON employees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = (current_setting('app.current_employee_id', true))::uuid
      AND employees.grade IN ('PDG', 'Manager')
    )
  );

-- RLS Policies for timesheets
CREATE POLICY "Employees can view own timesheets"
  ON timesheets FOR SELECT
  USING (
    employee_id = (current_setting('app.current_employee_id', true))::uuid
    OR EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = (current_setting('app.current_employee_id', true))::uuid
      AND employees.grade IN ('PDG', 'Manager')
    )
  );

CREATE POLICY "Employees can create own timesheets"
  ON timesheets FOR INSERT
  WITH CHECK (employee_id = (current_setting('app.current_employee_id', true))::uuid);

CREATE POLICY "Employees can update own timesheets"
  ON timesheets FOR UPDATE
  USING (employee_id = (current_setting('app.current_employee_id', true))::uuid);

-- RLS Policies for products (all can read, PDG/Manager can manage)
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "PDG and Manager can manage products"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = (current_setting('app.current_employee_id', true))::uuid
      AND employees.grade IN ('PDG', 'Manager')
    )
  );

-- RLS Policies for stocks, sales, etc (all authenticated can access)
CREATE POLICY "Authenticated can view raw_ingredients"
  ON raw_ingredients FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage raw_ingredients"
  ON raw_ingredients FOR ALL USING (true);

CREATE POLICY "Authenticated can view ready_stock"
  ON ready_stock FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage ready_stock"
  ON ready_stock FOR ALL USING (true);

CREATE POLICY "Authenticated can view recipes"
  ON recipes FOR SELECT USING (true);

CREATE POLICY "PDG and Manager can manage recipes"
  ON recipes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = (current_setting('app.current_employee_id', true))::uuid
      AND employees.grade IN ('PDG', 'Manager')
    )
  );

CREATE POLICY "Authenticated can view sales"
  ON sales FOR SELECT USING (true);

CREATE POLICY "Authenticated can create sales"
  ON sales FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can view sale_items"
  ON sale_items FOR SELECT USING (true);

CREATE POLICY "Authenticated can create sale_items"
  ON sale_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can view production_logs"
  ON production_logs FOR SELECT USING (true);

CREATE POLICY "Authenticated can create production_logs"
  ON production_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can view vehicles"
  ON vehicles FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage vehicles"
  ON vehicles FOR ALL USING (true);

CREATE POLICY "Authenticated can view vehicle_logs"
  ON vehicle_logs FOR SELECT USING (true);

CREATE POLICY "Authenticated can create vehicle_logs"
  ON vehicle_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can view expenses"
  ON expenses FOR SELECT USING (true);

CREATE POLICY "Authenticated can create expenses"
  ON expenses FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can view losses"
  ON losses FOR SELECT USING (true);

CREATE POLICY "Authenticated can create losses"
  ON losses FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated can view partners"
  ON partners FOR SELECT USING (true);

CREATE POLICY "PDG and Manager can manage partners"
  ON partners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = (current_setting('app.current_employee_id', true))::uuid
      AND employees.grade IN ('PDG', 'Manager')
    )
  );

CREATE POLICY "Authenticated can view settings"
  ON settings FOR SELECT USING (true);

CREATE POLICY "PDG can manage settings"
  ON settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = (current_setting('app.current_employee_id', true))::uuid
      AND employees.grade = 'PDG'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_timesheets_employee ON timesheets(employee_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_week ON timesheets(week_number, year);
CREATE INDEX IF NOT EXISTS idx_sales_employee ON sales(employee_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_production_employee ON production_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_logs_vehicle ON vehicle_logs(vehicle_id);

-- Insert default settings
INSERT INTO settings (company_name, logo_url)
VALUES ('Hen House', '')
ON CONFLICT DO NOTHING;

-- Insert seed employee (PDG)
INSERT INTO employees (username, password, first_name, last_name, grade, hourly_rate, hire_date)
VALUES ('pdg', 'henhouse2025', 'Le', 'PDG', 'PDG', 30.0, '2024-01-01')
ON CONFLICT (username) DO NOTHING;

-- Insert seed employee (Manager)
INSERT INTO employees (username, password, first_name, last_name, grade, hourly_rate, hire_date)
VALUES ('manager', 'manager123', 'John', 'Manager', 'Manager', 20.0, '2024-01-01')
ON CONFLICT (username) DO NOTHING;

-- Insert seed employee (Employé)
INSERT INTO employees (username, password, first_name, last_name, grade, hourly_rate, hire_date)
VALUES ('employe', 'employe123', 'Marie', 'Dupont', 'Employé Polyvalent', 15.0, '2024-01-01')
ON CONFLICT (username) DO NOTHING;