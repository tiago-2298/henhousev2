/*
  # Hen House Manager - Ultimate Edition Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique) - Identifiant de connexion
      - `password` (text) - Mot de passe hashé
      - `full_name` (text) - Nom complet
      - `role` (text) - 'admin' ou 'employee'
      - `hourly_rate` (numeric) - Taux horaire en $
      - `is_on_duty` (boolean) - En service actuellement
      - `fivem_identifier` (text, nullable) - ID FiveM pour intégration
      - `created_at` (timestamptz)

    - `shifts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key) - Référence vers users
      - `start_time` (timestamptz) - Début de service
      - `end_time` (timestamptz, nullable) - Fin de service
      - `total_hours` (numeric, nullable) - Heures calculées
      - `created_at` (timestamptz)

    - `products`
      - `id` (uuid, primary key)
      - `name` (text) - Nom du produit
      - `description` (text) - Description
      - `price` (numeric) - Prix de vente
      - `cost` (numeric) - Coût d'achat
      - `stock` (integer) - Quantité en stock
      - `image_url` (text) - URL de l'image
      - `is_active` (boolean) - Produit actif
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `sales`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key) - Vendeur
      - `total` (numeric) - Montant total
      - `status` (text) - 'completed', 'pending', 'cancelled'
      - `payment_method` (text) - 'cash', 'card', 'banking'
      - `created_at` (timestamptz)

    - `sale_items`
      - `id` (uuid, primary key)
      - `sale_id` (uuid, foreign key) - Référence vers sales
      - `product_id` (uuid, foreign key) - Référence vers products
      - `quantity` (integer) - Quantité vendue
      - `unit_price` (numeric) - Prix unitaire au moment de la vente
      - `subtotal` (numeric) - quantity * unit_price
      - `created_at` (timestamptz)

    - `discord_webhooks`
      - `id` (uuid, primary key)
      - `name` (text) - Nom du webhook
      - `url` (text) - URL Discord
      - `event_type` (text) - 'sales', 'shifts', 'stock'
      - `is_active` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on roles

  3. Seed Data
    - Admin user: patron / henhouse2025
    - Employee user: vendeur / 1234
    - Sample products: Burger, Cola
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'employee')),
  hourly_rate numeric DEFAULT 15.0,
  is_on_duty boolean DEFAULT false,
  fivem_identifier text,
  created_at timestamptz DEFAULT now()
);

-- Create shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  total_hours numeric,
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL CHECK (price >= 0),
  cost numeric NOT NULL CHECK (cost >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  total numeric NOT NULL CHECK (total >= 0),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'banking')),
  created_at timestamptz DEFAULT now()
);

-- Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE SET NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  subtotal numeric NOT NULL CHECK (subtotal >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create discord_webhooks table
CREATE TABLE IF NOT EXISTS discord_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('sales', 'shifts', 'stock', 'all')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discord_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS Policies for shifts
CREATE POLICY "Users can view all shifts"
  ON shifts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own shifts"
  ON shifts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own shifts"
  ON shifts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for products
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS Policies for sales
CREATE POLICY "Users can view all sales"
  ON sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can manage sales"
  ON sales FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS Policies for sale_items
CREATE POLICY "Users can view all sale items"
  ON sale_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create sale items"
  ON sale_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for discord_webhooks
CREATE POLICY "Admin can manage webhooks"
  ON discord_webhooks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_start_time ON shifts(start_time);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- Insert seed data: Admin user (patron / henhouse2025)
INSERT INTO users (username, password, full_name, role, hourly_rate, is_on_duty)
VALUES ('patron', 'henhouse2025', 'Le Patron', 'admin', 25.0, false)
ON CONFLICT (username) DO NOTHING;

-- Insert seed data: Employee user (vendeur / 1234)
INSERT INTO users (username, password, full_name, role, hourly_rate, is_on_duty)
VALUES ('vendeur', '1234', 'Vendeur Principal', 'employee', 15.0, false)
ON CONFLICT (username) DO NOTHING;

-- Insert seed data: Products
INSERT INTO products (name, description, price, cost, stock, image_url, is_active)
VALUES 
  ('Burger', 'Délicieux burger maison', 50.0, 20.0, 100, 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400', true),
  ('Cola', 'Boisson rafraîchissante', 15.0, 5.0, 50, 'https://images.pexels.com/photos/2983100/pexels-photo-2983100.jpeg?auto=compress&cs=tinysrgb&w=400', true),
  ('Frites', 'Frites croustillantes', 30.0, 10.0, 80, 'https://images.pexels.com/photos/1893556/pexels-photo-1893556.jpeg?auto=compress&cs=tinysrgb&w=400', true),
  ('Salade', 'Salade fraîche', 40.0, 15.0, 60, 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=400', true)
ON CONFLICT DO NOTHING;