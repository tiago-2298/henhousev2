# Hen House ERP - Ultimate Edition

Application ERP complète pour la gestion de restaurant avec intégration FiveM.

## ✅ Infrastructure Complète

**Ce qui est déjà implémenté:**
- Base de données Supabase avec 15 tables
- Edge Functions (authentification + API FiveM)
- Système d'authentification par username
- Webhooks Discord configurés (5 canaux)
- Navigation complète avec filtrage par rôle
- Design dark mode tactile moderne
- Types TypeScript complets

## 🚀 Démarrage Rapide

### Comptes de Test
- **PDG**: `pdg` / `henhouse2025`
- **Manager**: `manager` / `manager123`
- **Employé**: `employe` / `employe123`

### Lancer l'Application
```bash
npm install
npm run dev
```

### Build Production
```bash
npm run build
```

## 📊 Structure de la Base de Données

### Tables Principales

| Table | Description | Clés |
|-------|-------------|------|
| `employees` | Employés avec auth par username | username (unique), grade, hourly_rate |
| `timesheets` | Pointeuse avec calcul heures | employee_id, check_in, check_out, week_number |
| `products` | Catalogue avec prix réels | name, price, category, image_url |
| `raw_ingredients` | Stock Niveau 1 (brut) | name, quantity, unit, min_threshold |
| `ready_stock` | Stock Niveau 2 (frigo) | product_id, quantity |
| `recipes` | Recettes (produit→ingrédients) | product_id, ingredient_id, quantity_needed |
| `sales` + `sale_items` | Ventes avec N° facture | invoice_number (unique), payment_method |
| `production_logs` | Historique production | employee_id, product_id, quantity_produced |
| `vehicles` + `vehicle_logs` | Garage avec tracking | fuel_level, condition, action |
| `expenses` | Dépenses | type, amount, vehicle_id |
| `losses` | Pertes déclarées | item_type, item_id, quantity, reason |
| `partners` | Partenaires B2B | name, special_menu (JSON) |
| `settings` | Personnalisation | company_name, logo_url |

### Données Seed Incluses

**Produits** (avec prix réels et images Catbox):
- Boeuf Bourguignon (€50)
- Saumon Grillé (€35)
- Poulet Rôti (€30)
- Wings (€25)
- Menu Happy Hen House (€110)
- Berry Fizz (€15)
- Cola (€10)
- Etc.

**Véhicules**:
- Grotti Brioso Fulmin (HH-001)
- Taco Van (HH-002)
- Rumpobox (HH-003)

**Partenaires B2B**:
- Biogood
- SASP Nord

## 🔔 Webhooks Discord

Tous configurés dans `src/lib/discord.ts`:

| Webhook | Usage | URL |
|---------|-------|-----|
| Sales | Ventes/Factures | 1412851967314759710/... |
| Production | Production/Stocks | 1389343371742412880/... |
| B2B | Ventes B2B | 1389356140957274112/... |
| Garage | Véhicules/Dépenses | 1392213573668962475/... |
| Security | Alertes sécurité | 1424558367938183168/... |

**Fonctions disponibles:**
- `notifySale()` - Vente complétée
- `notifyB2BSale()` - Vente partenaire
- `notifyProduction()` - Production réalisée
- `notifyLowStock()` - Stock bas
- `notifyVehicleAction()` - Sortie/Retour véhicule
- `notifyExpense()` - Dépense
- `notifyLoss()` - Perte déclarée
- `notifySecurityAlert()` - Alerte sécurité

## 🎯 Modules à Implémenter

Tous les modules ont des placeholders dans `App.tsx`. Créez les composants dans `src/components/modules/`.

### 1. Caisse TPV (`PointOfSale.tsx`)

**Features:**
- Grille tactile produits avec images
- Panier latéral modifiable
- **Input obligatoire**: N° Facture (unique)
- Modale confirmation
- 3 modes paiement: Cash/Card/Banking
- Option B2B avec sélection partner

**Logique:**
```typescript
1. Charger products + ready_stock (JOIN)
2. Afficher si stock > 0
3. Ajouter au panier (state local)
4. Demander N° Facture (validation)
5. Modale confirmation
6. Créer sale + sale_items
7. Déduire ready_stock
8. Appeler notifySale() ou notifyB2BSale()
9. Si stock < 10 → notifyLowStock()
```

### 2. Pointeuse (`Timesheet.tsx`)

**Features:**
- Check-in / Check-out
- **"Ma Semaine"**: Lundi→Dimanche en cours
- **Salaire Live**: Heures × Taux horaire
- Historique shifts

**Logique:**
```typescript
Check-in:
  - INSERT timesheet (check_in=now, week_number, year)

Check-out:
  - UPDATE timesheet SET check_out=now
  - Calculer total_hours = (check_out - check_in)

Salaire Live:
  - SELECT SUM(total_hours) WHERE week_number=current
  - Multiplier par employee.hourly_rate
```

### 3. Stocks 2 Niveaux (`StockManagement.tsx`)

**Features:**
- **Onglet 1**: Raw Ingredients
  - Liste avec quantité, unité
  - Boutons +/- ajustement
  - Badge rouge si < min_threshold
- **Onglet 2**: Ready Stock (Frigo)
  - Liste produits finis
  - Géré automatiquement (Production/Ventes)

**Logique:**
```typescript
Ajustement raw_ingredients:
  - UPDATE quantity
  - Si < min_threshold → notifyLowStock()
```

### 4. Production (`Production.tsx`)

**Features:**
- Sélection produit
- Input quantité à produire
- Affichage recette (ingrédients nécessaires)
- Vérification stock suffisant

**Logique:**
```typescript
1. Charger products + recipes
2. Calculer ingrédients requis × quantité
3. Vérifier raw_ingredients >= requis
4. Sur validation:
   - INSERT production_log
   - UPDATE raw_ingredients (déduire)
   - UPDATE ready_stock.quantity (augmenter)
   - notifyProduction()
```

### 5. Garage (`Garage.tsx`)

**Features:**
- Liste véhicules avec statut
- Formulaire Sortie:
  - Fuel level (slider 0-100%)
  - Condition (select)
  - Notes (textarea)
- Formulaire Retour: idem

**Logique:**
```typescript
Sortie:
  - Vérifier is_available=true
  - INSERT vehicle_log (action='Sortie')
  - UPDATE vehicle SET is_available=false
  - notifyVehicleAction()

Retour:
  - INSERT vehicle_log (action='Retour')
  - UPDATE vehicle SET fuel_level, condition, is_available=true
  - notifyVehicleAction()
```

### 6. Dépenses & Pertes (`ExpensesLosses.tsx`)

**Features:**
- **Tab Dépenses**:
  - Type: Essence/Réparation/Autre
  - Montant, Description
  - Select véhicule (optionnel)
- **Tab Pertes**:
  - Type: Produit/Ingrédient
  - Sélection item, Quantité, Raison

**Logique:**
```typescript
Dépense:
  - INSERT expenses
  - notifyExpense()

Perte:
  - INSERT losses
  - UPDATE stock correspondant (déduire)
  - notifyLoss()
```

### 7. RH (`HR.tsx`)

**Accès**: PDG, Manager

**Features:**
- **CRUD Employés**:
  - Username, Password, Nom, Prénom
  - ID personnel, RIB, Téléphone
  - Grade, Taux horaire, Date d'arrivée
- **Vue Semaine**:
  - Tableau timesheets par employé
  - Total heures + salaire calculé
- **Historique**: Tous shifts avec filtres

**Logique:**
```typescript
CRUD:
  - Vérifier grade IN ('PDG', 'Manager')
  - INSERT/UPDATE/DELETE employees

Vue Semaine:
  - SELECT employees JOIN timesheets
  - GROUP BY employee_id
  - SUM(total_hours) × hourly_rate
```

### 8. Dashboard (`Dashboard.tsx`)

**Features:**
- KPIs: CA total, Ventes jour, Employés en service
- Graphique ventes 7 jours (Recharts LineChart)
- Top 5 produits (PieChart)
- Alertes stocks bas

**Logique:**
```typescript
KPIs:
  - SELECT SUM(total) FROM sales WHERE status='completed'
  - SELECT COUNT(*) FROM employees WHERE is_on_duty=true
  - SELECT COUNT(*) FROM raw_ingredients WHERE quantity < min_threshold

Graphique:
  - SELECT created_at::date, SUM(total)
    FROM sales
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY created_at::date
```

### 9. Paramètres (`Settings.tsx`)

**Accès**: PDG uniquement

**Features:**
- **Personnalisation**:
  - Nom entreprise (input)
  - Logo URL (input)
- **Zone de Danger**:
  - RESET Stocks (DELETE raw_ingredients + ready_stock)
  - RESET Ventes (DELETE sales + sale_items)
  - RESET Heures (DELETE timesheets)
  - Double confirmation: Modale + Input "CONFIRMER"

**Logique:**
```typescript
Update Settings:
  - UPDATE settings SET company_name, logo_url

Reset:
  - Modale "Êtes-vous sûr ?"
  - Input text === "CONFIRMER"
  - DELETE FROM table_name
  - notifySecurityAlert()
```

## 🔌 API FiveM

### Edge Function: `fivem-webhook`

**Endpoint**: `https://[projet].supabase.co/functions/v1/fivem-webhook`

**Header**: `X-HenHouse-Token: SECRET_SUPER_SECURISE_123`

#### Action 1: banking_transfer
Créer vente PENDING après transfert bancaire FiveM.

```lua
PerformHttpRequest(webhookUrl, function(err, text, headers)
    print(text)
end, 'POST', json.encode({
    action = 'banking_transfer',
    data = {
        user_id = 'fivem_identifier',
        amount = 150,
        product_ids = {}
    }
}), {
    ['Content-Type'] = 'application/json',
    ['X-HenHouse-Token'] = 'SECRET_SUPER_SECURISE_123'
})
```

#### Action 2: setjob
Mettre à jour grade employé depuis FiveM.

```lua
PerformHttpRequest(webhookUrl, function(err, text, headers)
    print(text)
end, 'POST', json.encode({
    action = 'setjob',
    data = {
        user_id = 'fivem_identifier',
        job = 'henhouse',
        grade = 2  -- Grade >= 2 = Manager/PDG
    }
}), {
    ['Content-Type'] = 'application/json',
    ['X-HenHouse-Token'] = 'SECRET_SUPER_SECURISE_123'
})
```

## 📝 Exemple de Composant

Exemple minimal de module:

```typescript
// src/components/modules/PointOfSale.tsx
import React, { useState, useEffect } from 'react';
import { supabase, Product } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { notifySale } from '../../lib/discord';

export function PointOfSale() {
  const [products, setProducts] = useState<Product[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const { employee } = useAuth();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*');
    setProducts(data || []);
  };

  const handleSale = async () => {
    const { data: sale } = await supabase
      .from('sales')
      .insert({
        employee_id: employee!.id,
        invoice_number: invoiceNumber,
        total: 100,
        payment_method: 'cash',
        customer_type: 'B2C'
      })
      .select()
      .single();

    notifySale({
      employeeName: `${employee!.first_name} ${employee!.last_name}`,
      invoiceNumber,
      total: 100,
      paymentMethod: 'Cash',
      items: []
    });
  };

  return (
    <div>
      <h1>Caisse TPV</h1>
      <input
        value={invoiceNumber}
        onChange={(e) => setInvoiceNumber(e.target.value)}
        placeholder="N° Facture"
      />
      <button onClick={handleSale}>Valider Vente</button>
    </div>
  );
}
```

## 🎨 Design System

**Palette de Couleurs:**
- Background: `from-gray-900 via-gray-800 to-gray-900`
- Accent: `from-orange-500 to-red-600`
- Glass: `bg-white/5 border-white/10`

**Composants Réutilisables:**
- `Toast`: Notifications (déjà créé)
- Boutons tactiles larges (touch-friendly)
- Cards glassmorphism
- Modales de confirmation

## 🛠️ Stack Technique

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (Dark mode)
- **Database**: Supabase PostgreSQL
- **Edge Functions**: Deno
- **Icons**: Lucide React
- **Charts**: Recharts (installer: `npm install recharts`)

## 📦 Déploiement

### Docker
```bash
docker build -t henhouse-erp .
docker run -p 3000:3000 henhouse-erp
```

### Supabase
Edge Functions déjà déployées:
- `login`: Authentification
- `get-user`: Récupération employé
- `fivem-webhook`: API FiveM

## 🎯 Roadmap d'Implémentation

1. **Caisse TPV** (priorité haute)
2. **Pointeuse** (priorité haute)
3. **Stocks 2 Niveaux**
4. **Production**
5. **Dashboard**
6. **Garage**
7. **RH**
8. **Dépenses & Pertes**
9. **Paramètres**

## �� Notes Importantes

- Tous les modules partagent la même structure: `src/components/modules/[Module].tsx`
- Remplacer `PlaceholderModule` dans `App.tsx` par vos composants
- Types TypeScript complets dans `src/lib/supabase.ts`
- Webhooks Discord prêts à l'emploi
- RLS policies configurées pour chaque table
- Authentification par username (pas d'email)

## 🚀 Prochaines Étapes

1. Choisir un module à implémenter
2. Créer le fichier dans `src/components/modules/`
3. Importer dans `App.tsx` et remplacer le placeholder
4. Tester avec les comptes seed
5. Répéter pour les autres modules

**Structure complète prête à l'emploi !** 🎉
