/*
  # Ajouter tous les webhooks de modules

  1. Modifications
    - Supprimer la contrainte actuelle sur module_name
    - Ajouter une nouvelle contrainte avec tous les modules
    - Insérer les nouveaux webhooks

  2. Nouveaux modules
    - partner_sales (Ventes partenaires)
    - partner_invoices (Factures partenaires)
    - timesheets (Pointeuse)
    - payroll (Paie)
    - work_sessions (Sessions de travail)
    - announcements (Annonces)
    - requests (Demandes employés)
    - garage (Garage/Véhicules)
    - hr (Ressources Humaines)
*/

-- Supprimer l'ancienne contrainte
ALTER TABLE discord_webhooks DROP CONSTRAINT IF EXISTS valid_module_name;

-- Ajouter la nouvelle contrainte avec tous les modules
ALTER TABLE discord_webhooks ADD CONSTRAINT valid_module_name 
  CHECK (module_name IN (
    'sales', 
    'production', 
    'maintenance', 
    'expenses', 
    'losses', 
    'low_stock', 
    'admin_actions', 
    'employee_actions',
    'partner_sales',
    'partner_invoices',
    'timesheets',
    'payroll',
    'work_sessions',
    'announcements',
    'requests',
    'garage',
    'hr'
  ));

-- Insérer les nouveaux webhooks
INSERT INTO discord_webhooks (module_name, webhook_url, is_enabled) VALUES
  ('partner_sales', '', false),
  ('partner_invoices', '', false),
  ('timesheets', '', false),
  ('payroll', '', false),
  ('work_sessions', '', false),
  ('announcements', '', false),
  ('requests', '', false),
  ('garage', '', false),
  ('hr', '', false)
ON CONFLICT (module_name) DO NOTHING;
