/*
  # Hen House ERP - Données Seed

  Insère les données réelles:
  - Produits avec prix et images Catbox
  - Véhicules
  - Partenaires B2B
  - Ingrédients de base
*/

-- Insert Products avec prix réels et images Catbox
INSERT INTO products (name, description, price, category, image_url) VALUES
('Boeuf Bourguignon', 'Plat signature', 50, 'Plats', 'https://files.catbox.moe/default-food.png'),
('Saumon Grillé', 'Saumon frais grillé', 35, 'Plats', 'https://files.catbox.moe/k0gbil.png'),
('Poulet Rôti', 'Poulet fermier rôti', 30, 'Plats', 'https://files.catbox.moe/default-food.png'),
('Wings', 'Ailes de poulet croustillantes', 25, 'Plats', 'https://files.catbox.moe/vj52j5.png'),
('Menu Happy Hen House', 'Menu complet avec boisson', 110, 'Menus', 'https://files.catbox.moe/default-food.png'),
('Berry Fizz', 'Boisson pétillante aux fruits rouges', 15, 'Boissons', 'https://files.catbox.moe/default-drink.png'),
('Cola', 'Soda classique', 10, 'Boissons', 'https://images.pexels.com/photos/2983100/pexels-photo-2983100.jpeg?auto=compress&cs=tinysrgb&w=400'),
('Eau Minérale', 'Eau plate ou gazeuse', 5, 'Boissons', 'https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg?auto=compress&cs=tinysrgb&w=400'),
('Tiramisu', 'Dessert italien', 20, 'Desserts', 'https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg?auto=compress&cs=tinysrgb&w=400'),
('Tarte Citron', 'Tarte meringuée au citron', 18, 'Desserts', 'https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg?auto=compress&cs=tinysrgb&w=400')
ON CONFLICT DO NOTHING;

-- Insert Raw Ingredients
INSERT INTO raw_ingredients (name, unit, quantity, min_threshold) VALUES
('Poulet', 'kg', 50, 10),
('Boeuf', 'kg', 30, 10),
('Saumon', 'kg', 20, 5),
('Pommes de terre', 'kg', 100, 20),
('Carottes', 'kg', 50, 10),
('Oignons', 'kg', 40, 10),
('Farine', 'kg', 60, 15),
('Beurre', 'kg', 25, 5),
('Lait', 'L', 40, 10),
('Oeufs', 'unités', 200, 50),
('Sucre', 'kg', 30, 10),
('Sel', 'kg', 20, 5)
ON CONFLICT DO NOTHING;

-- Insert Ready Stock for products
INSERT INTO ready_stock (product_id, quantity)
SELECT id, 20 FROM products WHERE category = 'Plats'
ON CONFLICT (product_id) DO UPDATE SET quantity = 20;

INSERT INTO ready_stock (product_id, quantity)
SELECT id, 50 FROM products WHERE category = 'Boissons'
ON CONFLICT (product_id) DO UPDATE SET quantity = 50;

INSERT INTO ready_stock (product_id, quantity)
SELECT id, 15 FROM products WHERE category = 'Desserts'
ON CONFLICT (product_id) DO UPDATE SET quantity = 15;

INSERT INTO ready_stock (product_id, quantity)
SELECT id, 10 FROM products WHERE category = 'Menus'
ON CONFLICT (product_id) DO UPDATE SET quantity = 10;

-- Insert Vehicles
INSERT INTO vehicles (name, model, plate_number, fuel_level, condition, is_available) VALUES
('Grotti Brioso Fulmin', 'Compact électrique', 'HH-001', 100, 'Excellent', true),
('Taco Van', 'Utilitaire', 'HH-002', 85, 'Bon', true),
('Rumpobox', 'Fourgon de livraison', 'HH-003', 70, 'Bon', true)
ON CONFLICT DO NOTHING;

-- Insert Partners B2B
INSERT INTO partners (name, contact, special_menu, is_active) VALUES
('Biogood', 'contact@biogood.com', '[
  {"product": "Wings", "drink": "Berry Fizz", "price": 35},
  {"product": "Saumon Grillé", "drink": "Eau Minérale", "price": 45}
]'::jsonb, true),
('SASP Nord', 'sasp@nord.gov', '[
  {"product": "Menu Happy Hen House", "price": 100},
  {"product": "Poulet Rôti", "drink": "Cola", "price": 38}
]'::jsonb, true)
ON CONFLICT DO NOTHING;