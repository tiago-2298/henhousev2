/*
  # Créer tables manquantes

  1. Nouvelles Tables
    - `work_sessions` - Sessions de travail pour la pointeuse
    - `production_orders` - Ordres de production
    - `vehicle_maintenances` - Maintenances véhicules
    - `stock_adjustments` - Ajustements de stock
  
  2. Security
    - Enable RLS sur toutes les tables
    - Add policies pour authenticated users
*/

CREATE TABLE IF NOT EXISTS work_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  clock_in timestamptz NOT NULL DEFAULT now(),
  clock_out timestamptz,
  hours_worked numeric,
  total_earned numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view work sessions"
  ON work_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage work sessions"
  ON work_sessions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS production_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity_ordered integer NOT NULL CHECK (quantity_ordered > 0),
  quantity_produced integer CHECK (quantity_produced >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_by uuid REFERENCES employees(id) NOT NULL,
  started_by uuid REFERENCES employees(id),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view production orders"
  ON production_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage production orders"
  ON production_orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS vehicle_maintenances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  cost numeric NOT NULL DEFAULT 0 CHECK (cost >= 0),
  performed_by uuid REFERENCES employees(id) NOT NULL,
  date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicle_maintenances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view vehicle maintenances"
  ON vehicle_maintenances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage vehicle maintenances"
  ON vehicle_maintenances FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS stock_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL CHECK (item_type IN ('product', 'raw_material')),
  item_id uuid NOT NULL,
  quantity_change integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stock adjustments"
  ON stock_adjustments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage stock adjustments"
  ON stock_adjustments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
