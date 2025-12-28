/*
  # Seed Employee Features Data

  1. Seed Data
    - Default expense categories (Essence, Réparation, Fournitures, etc.)
    - Default achievements (badges)
*/

-- Insert default expense categories
INSERT INTO expense_categories (name, description, monthly_budget, is_active) VALUES
  ('Essence', 'Carburant pour les véhicules', 500, true),
  ('Réparation', 'Réparations véhicules et équipements', 1000, true),
  ('Fournitures', 'Fournitures de bureau et cuisine', 300, true),
  ('Maintenance', 'Maintenance préventive', 200, true),
  ('Autres', 'Dépenses diverses', 500, true)
ON CONFLICT DO NOTHING;

-- Insert default achievements
INSERT INTO achievements (name, description, icon, criteria_type, criteria_value) VALUES
  ('Première Vente', 'Réalisez votre première vente', 'Trophy', 'sales_count', 1),
  ('Vendeur Bronze', 'Réalisez 10 ventes', 'Award', 'sales_count', 10),
  ('Vendeur Argent', 'Réalisez 50 ventes', 'Award', 'sales_count', 50),
  ('Vendeur Or', 'Réalisez 100 ventes', 'Award', 'sales_count', 100),
  ('Vendeur Platine', 'Réalisez 500 ventes', 'Award', 'sales_count', 500),
  ('Petit Chiffre', 'Réalisez $1,000 de ventes', 'DollarSign', 'sales_amount', 1000),
  ('Bon Chiffre', 'Réalisez $5,000 de ventes', 'DollarSign', 'sales_amount', 5000),
  ('Gros Chiffre', 'Réalisez $10,000 de ventes', 'DollarSign', 'sales_amount', 10000),
  ('Champion', 'Réalisez $50,000 de ventes', 'DollarSign', 'sales_amount', 50000),
  ('Travailleur', 'Cumulez 100 heures de travail', 'Clock', 'work_hours', 100),
  ('Acharné', 'Cumulez 500 heures de travail', 'Clock', 'work_hours', 500),
  ('Dévoué', 'Cumulez 1000 heures de travail', 'Clock', 'work_hours', 1000),
  ('Ponctuel', 'Mois parfait sans retard', 'Star', 'perfect_month', 1)
ON CONFLICT DO NOTHING;