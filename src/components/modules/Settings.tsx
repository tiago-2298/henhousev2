import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Package, Shield, Plus, CreditCard as Edit2, Trash2, X, AlertTriangle, DollarSign, Database } from 'lucide-react';
import { supabase, Product, RawIngredient, Recipe, ModulePermission, Partner, GradeSalaryConfig, WebhookConfig } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast';
import { notifyAdminAction } from '../../lib/discord';

type Tab = 'products' | 'ingredients' | 'recipes' | 'permissions' | 'partners' | 'salaries' | 'webhooks' | 'danger';

const GRADE_OPTIONS = ['PDG', 'CoPDG', 'Manager', 'Chef d\'équipe', 'Employé Polyvalent'];
const MODULE_OPTIONS = ['dashboard', 'pos', 'timesheet', 'stocks', 'production', 'garage', 'expenses', 'hr', 'settings'];

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  pos: 'Caisse',
  timesheet: 'Pointeuse',
  stocks: 'Stocks',
  production: 'Production',
  garage: 'Garage',
  expenses: 'Dépenses',
  hr: 'RH',
  settings: 'Paramètres'
};

const WEBHOOK_MODULE_LABELS: Record<string, string> = {
  sales: 'Ventes (POS)',
  production: 'Production',
  maintenance: 'Maintenance Véhicules',
  expenses: 'Dépenses',
  losses: 'Pertes',
  low_stock: 'Alertes Stock Faible',
  admin_actions: 'Actions Administrateur',
  employee_actions: 'Actions Employé',
  partner_sales: 'Ventes Partenaires',
  partner_invoices: 'Factures Partenaires',
  timesheets: 'Pointeuse',
  payroll: 'Paie',
  work_sessions: 'Sessions de Travail',
  announcements: 'Annonces',
  requests: 'Demandes Employés',
  garage: 'Garage',
  hr: 'Ressources Humaines'
};

export function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('ingredients');
  const [ingredients, setIngredients] = useState<RawIngredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [salaryConfigs, setSalaryConfigs] = useState<GradeSalaryConfig[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [showEditIngredient, setShowEditIngredient] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showEditRecipe, setShowEditRecipe] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [showEditWebhook, setShowEditWebhook] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfig | null>(null);
  const [selectedIngredient, setSelectedIngredient] = useState<RawIngredient | null>(null);
  const [ingredientForm, setIngredientForm] = useState({
    name: '',
    unit: 'kg' as 'kg' | 'L' | 'unités',
    quantity: 0,
    cost_per_unit: 0,
    min_threshold: 10
  });
  const [recipeForm, setRecipeForm] = useState({
    product_id: '',
    ingredient_id: '',
    quantity_needed: 1
  });
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'Plats' as 'Plats' | 'Boissons' | 'Menus' | 'Desserts',
    image_url: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg'
  });
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    contact: '',
    webhook_url: ''
  });
  const [webhookForm, setWebhookForm] = useState({
    name: '',
    webhook_url: ''
  });
  const [confirmAction, setConfirmAction] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const { employee } = useAuth();
  const { showToast, ToastComponent } = useToast();

  const isAdmin = employee?.grade === 'PDG' || employee?.grade === 'CoPDG';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [ingredientsRes, productsRes, recipesRes, permissionsRes, partnersRes, salaryConfigsRes, webhooksRes] = await Promise.all([
      supabase.from('raw_ingredients').select('*').order('name'),
      supabase.from('products').select('*').order('name'),
      supabase.from('recipes').select('*, products(*), raw_ingredients:ingredient_id(*)').order('created_at'),
      supabase.from('module_permissions').select('*').order('grade, module_name'),
      supabase.from('partners').select('*').order('name'),
      supabase.from('grade_salary_config').select('*').order('grade'),
      supabase.from('discord_webhooks').select('*').order('module_name')
    ]);

    setIngredients(ingredientsRes.data || []);
    setProducts(productsRes.data || []);
    setRecipes(recipesRes.data || []);
    setPermissions(permissionsRes.data || []);
    setPartners(partnersRes.data || []);
    setSalaryConfigs(salaryConfigsRes.data || []);
    setWebhooks(webhooksRes.data || []);
  };

  const logAdminAction = async (actionType: 'create' | 'update' | 'delete' | 'settings_change' | 'permission_change', moduleName: string, details: string) => {
    await supabase.from('admin_actions_log').insert({
      employee_id: employee!.id,
      action_type: actionType,
      module_name: moduleName,
      details: { description: details }
    });

    notifyAdminAction({
      employeeName: `${employee!.first_name} ${employee!.last_name}`,
      actionType,
      moduleName,
      details
    });
  };

  const addIngredient = async () => {
    if (!ingredientForm.name) {
      showToast('Nom requis', 'error');
      return;
    }

    try {
      await supabase.from('raw_ingredients').insert(ingredientForm);
      showToast('Ingrédient ajouté', 'success');
      logAdminAction('create', 'ingredients', `Ingrédient ajouté: ${ingredientForm.name} à $${ingredientForm.cost_per_unit}/${ingredientForm.unit}`);
      setShowAddIngredient(false);
      setIngredientForm({ name: '', unit: 'kg', quantity: 0, cost_per_unit: 0, min_threshold: 10 });
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const updateIngredient = async () => {
    if (!selectedIngredient) return;

    try {
      await supabase.from('raw_ingredients').update(ingredientForm).eq('id', selectedIngredient.id);

      const { data: affectedRecipes } = await supabase
        .from('recipes')
        .select('product_id')
        .eq('ingredient_id', selectedIngredient.id);

      if (affectedRecipes && affectedRecipes.length > 0) {
        const productIds = [...new Set(affectedRecipes.map(r => r.product_id))];
        for (const productId of productIds) {
          await recalculateProductCost(productId);
        }
      }

      showToast('Ingrédient mis à jour et coûts recalculés', 'success');
      logAdminAction('update', 'ingredients', `Ingrédient modifié: ${ingredientForm.name}`);
      setShowEditIngredient(false);
      setSelectedIngredient(null);
      setIngredientForm({ name: '', unit: 'kg', quantity: 0, cost_per_unit: 0, min_threshold: 10 });
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const deleteIngredient = async (ingredientId: string, ingredientName: string) => {
    if (!confirm('Êtes-vous sûr ?')) return;

    try {
      await supabase.from('raw_ingredients').delete().eq('id', ingredientId);
      showToast('Ingrédient supprimé', 'success');
      logAdminAction('delete', 'ingredients', `Ingrédient supprimé: ${ingredientName}`);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const recalculateProductCost = async (productId: string) => {
    const { data: productRecipes } = await supabase
      .from('recipes')
      .select('*, raw_ingredients:ingredient_id(*)')
      .eq('product_id', productId);

    let totalCost = 0;
    if (productRecipes && productRecipes.length > 0) {
      for (const recipe of productRecipes) {
        const ingredient = recipe.raw_ingredients;
        if (ingredient) {
          totalCost += ingredient.cost_per_unit * recipe.quantity_needed;
        }
      }
    }

    const { data: product } = await supabase
      .from('products')
      .select('price')
      .eq('id', productId)
      .single();

    if (product) {
      const margin = product.price - totalCost;
      await supabase
        .from('products')
        .update({ production_cost: totalCost, margin })
        .eq('id', productId);
    }
  };

  const addRecipe = async () => {
    if (!recipeForm.product_id || !recipeForm.ingredient_id) {
      showToast('Sélectionnez produit et ingrédient', 'error');
      return;
    }

    try {
      await supabase.from('recipes').insert(recipeForm);
      await recalculateProductCost(recipeForm.product_id);
      const product = products.find(p => p.id === recipeForm.product_id);
      const ingredient = ingredients.find(i => i.id === recipeForm.ingredient_id);
      showToast('Recette ajoutée et coût recalculé', 'success');
      logAdminAction('create', 'recipes', `${product?.name}: ${recipeForm.quantity_needed} ${ingredient?.unit} de ${ingredient?.name}`);
      setShowRecipeModal(false);
      setRecipeForm({ product_id: '', ingredient_id: '', quantity_needed: 1 });
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const updateRecipe = async () => {
    if (!selectedRecipe || !recipeForm.quantity_needed) {
      showToast('Quantité requise', 'error');
      return;
    }

    try {
      await supabase
        .from('recipes')
        .update({ quantity_needed: recipeForm.quantity_needed })
        .eq('id', selectedRecipe.id);

      await recalculateProductCost(recipeForm.product_id);
      showToast('Recette mise à jour et coût recalculé', 'success');
      logAdminAction('update', 'recipes', 'Recette modifiée');
      setShowEditRecipe(false);
      setSelectedRecipe(null);
      setRecipeForm({ product_id: '', ingredient_id: '', quantity_needed: 1 });
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    if (!confirm('Êtes-vous sûr ?')) return;

    try {
      const { data: recipe } = await supabase
        .from('recipes')
        .select('product_id')
        .eq('id', recipeId)
        .single();

      await supabase.from('recipes').delete().eq('id', recipeId);

      if (recipe) {
        await recalculateProductCost(recipe.product_id);
      }

      showToast('Recette supprimée et coût recalculé', 'success');
      logAdminAction('delete', 'recipes', 'Recette supprimée');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const updatePermission = async (permissionId: string, field: 'can_view' | 'can_edit', value: boolean, moduleName: string, grade: string) => {
    try {
      await supabase.from('module_permissions').update({ [field]: value }).eq('id', permissionId);
      showToast('Permission mise à jour', 'success');
      logAdminAction('permission_change', moduleName, `${grade}: ${field === 'can_view' ? 'Voir' : 'Modifier'} = ${value ? 'Oui' : 'Non'}`);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const addProduct = async () => {
    if (!productForm.name || productForm.price <= 0) {
      showToast('Nom et prix requis', 'error');
      return;
    }

    try {
      const { data: newProduct, error: productError } = await supabase.from('products').insert({
        name: productForm.name,
        description: productForm.description,
        price: productForm.price,
        production_cost: 0,
        margin: productForm.price,
        category: productForm.category,
        image_url: productForm.image_url,
        is_active: true
      }).select().single();

      if (productError) throw productError;

      await supabase.from('ready_stock').insert({
        product_id: newProduct.id,
        quantity: 0
      });

      showToast('Produit ajouté. Ajoutez des ingrédients dans l\'onglet Recettes.', 'success');
      logAdminAction('create', 'products', `Produit ajouté: ${productForm.name} à $${productForm.price}`);
      setShowAddProduct(false);
      setProductForm({
        name: '',
        description: '',
        price: 0,
        category: 'Plats',
        image_url: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg'
      });
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean, productName: string) => {
    try {
      await supabase.from('products').update({ is_active: !currentStatus }).eq('id', productId);
      showToast(`Produit ${!currentStatus ? 'activé' : 'désactivé'}`, 'success');
      logAdminAction('update', 'products', `${productName} ${!currentStatus ? 'activé' : 'désactivé'}`);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const addPartner = async () => {
    if (!partnerForm.name) {
      showToast('Nom requis', 'error');
      return;
    }

    try {
      await supabase.from('partners').insert({ ...partnerForm, special_menu: {}, is_active: true });
      showToast('Partenaire ajouté', 'success');
      logAdminAction('create', 'partners', `Partenaire ajouté: ${partnerForm.name}`);
      setShowAddPartner(false);
      setPartnerForm({ name: '', contact: '', webhook_url: '' });
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const updateSalaryConfig = async (configId: string, field: keyof GradeSalaryConfig, value: any, grade: string) => {
    try {
      await supabase.from('grade_salary_config').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', configId);
      showToast('Configuration mise à jour', 'success');
      logAdminAction('settings_change', 'salaries', `${grade}: ${field} = ${value}`);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const addWebhook = async () => {
    if (!webhookForm.name || !webhookForm.webhook_url) {
      showToast('Nom et URL requis', 'error');
      return;
    }

    try {
      await supabase.from('discord_webhooks').insert({ module_name: webhookForm.name, webhook_url: webhookForm.webhook_url, is_enabled: true });
      showToast('Webhook ajouté', 'success');
      logAdminAction('create', 'webhooks', `Webhook ajouté: ${webhookForm.name}`);
      setShowAddWebhook(false);
      setWebhookForm({ name: '', webhook_url: '' });
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const updateWebhook = async () => {
    if (!selectedWebhook) return;

    try {
      await supabase.from('discord_webhooks').update({ module_name: webhookForm.name, webhook_url: webhookForm.webhook_url, updated_at: new Date().toISOString() }).eq('id', selectedWebhook.id);
      showToast('Webhook mis à jour', 'success');
      logAdminAction('update', 'webhooks', `Webhook modifié: ${webhookForm.name}`);
      setShowEditWebhook(false);
      setSelectedWebhook(null);
      setWebhookForm({ name: '', webhook_url: '' });
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const toggleWebhook = async (webhookId: string, currentStatus: boolean, webhookName: string) => {
    try {
      await supabase.from('discord_webhooks').update({ is_enabled: !currentStatus, updated_at: new Date().toISOString() }).eq('id', webhookId);
      showToast(`Webhook ${!currentStatus ? 'activé' : 'désactivé'}`, 'success');
      logAdminAction('update', 'webhooks', `${webhookName} ${!currentStatus ? 'activé' : 'désactivé'}`);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const deleteWebhook = async (webhookId: string, webhookName: string) => {
    if (!confirm('Êtes-vous sûr ?')) return;

    try {
      await supabase.from('discord_webhooks').delete().eq('id', webhookId);
      showToast('Webhook supprimé', 'success');
      logAdminAction('delete', 'webhooks', `Webhook supprimé: ${webhookName}`);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const getRecipesByProduct = (productId: string) => recipes.filter(r => r.product_id === productId);

  const calculateProductionCost = (productId: string): number => {
    const productRecipes = getRecipesByProduct(productId);
    return productRecipes.reduce((total, recipe) => {
      const ingredient = ingredients.find(i => i.id === recipe.ingredient_id);
      return total + (ingredient ? recipe.quantity_needed * ingredient.cost_per_unit : 0);
    }, 0);
  };

  const dangerActions = [
    { id: 'clear_sales', name: 'Supprimer toutes les ventes', icon: <DollarSign className="w-5 h-5" /> },
    { id: 'clear_sessions', name: 'Supprimer sessions de travail', icon: <Database className="w-5 h-5" /> },
    { id: 'reset_stocks', name: 'Réinitialiser les stocks', icon: <Package className="w-5 h-5" /> }
  ];

  const executeDangerAction = async (actionId: string) => {
    if (confirmText !== 'SUPPRIMER') {
      showToast('Tapez SUPPRIMER', 'error');
      return;
    }

    try {
      switch (actionId) {
        case 'clear_sales':
          await supabase.from('sale_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          break;
        case 'clear_sessions':
          await supabase.from('work_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          break;
        case 'reset_stocks':
          await supabase.from('ready_stock').update({ quantity: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('raw_ingredients').update({ quantity: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
          break;
      }

      showToast('Action exécutée', 'success');
      logAdminAction('delete', 'system', `Action danger: ${actionId}`);
      setConfirmAction('');
      setConfirmText('');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Accès Refusé</h2>
          <p className="text-gray-400">Seuls les PDG et CoPDG peuvent accéder aux paramètres.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {ToastComponent}

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'products' as Tab, label: 'Produits', icon: Package },
          { id: 'ingredients' as Tab, label: 'Ingrédients', icon: Package },
          { id: 'recipes' as Tab, label: 'Recettes', icon: SettingsIcon },
          { id: 'permissions' as Tab, label: 'Permissions', icon: Shield },
          { id: 'salaries' as Tab, label: 'Salaires', icon: DollarSign },
          { id: 'partners' as Tab, label: 'Partenaires', icon: DollarSign },
          { id: 'webhooks' as Tab, label: 'Webhooks', icon: Database },
          { id: 'danger' as Tab, label: 'Danger', icon: AlertTriangle }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap text-sm transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'products' && (
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Produits</h2>
            <button
              onClick={() => setShowAddProduct(true)}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Ajouter
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-start gap-3 mb-3">
                  <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{product.name}</h3>
                    <p className="text-sm text-orange-500 font-bold">${product.price.toFixed(2)}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleProductStatus(product.id, product.is_active, product.name)}
                  className={`w-full py-2 rounded-lg text-sm font-semibold ${
                    product.is_active ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                  }`}
                >
                  {product.is_active ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'ingredients' && (
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Ingrédients</h2>
            <button
              onClick={() => setShowAddIngredient(true)}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Ajouter
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Nom</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Unité</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Stock</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Coût/Unité</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map(ingredient => (
                  <tr key={ingredient.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-white font-medium">{ingredient.name}</td>
                    <td className="py-3 px-4 text-gray-400 text-sm">{ingredient.unit}</td>
                    <td className="py-3 px-4 text-gray-400 text-sm">{ingredient.quantity}</td>
                    <td className="py-3 px-4 text-green-400 font-bold text-sm">${ingredient.cost_per_unit.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setSelectedIngredient(ingredient);
                            setIngredientForm({
                              name: ingredient.name,
                              unit: ingredient.unit,
                              quantity: ingredient.quantity,
                              cost_per_unit: ingredient.cost_per_unit,
                              min_threshold: ingredient.min_threshold
                            });
                            setShowEditIngredient(true);
                          }}
                          className="bg-blue-500/20 text-blue-400 p-2 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteIngredient(ingredient.id, ingredient.name)}
                          className="bg-red-500/20 text-red-400 p-2 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'recipes' && (
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Recettes</h2>
              <p className="text-sm text-gray-400 mt-1">Fabrication par 2, vente par 1</p>
            </div>
            <button
              onClick={() => setShowRecipeModal(true)}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Ajouter
            </button>
          </div>

          <div className="space-y-6">
            {products.map(product => {
              const productRecipes = getRecipesByProduct(product.id);
              const productionCost = calculateProductionCost(product.id);

              return (
                <div key={product.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{product.name}</h3>
                      <p className="text-sm text-gray-400">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-400">${product.price.toFixed(2)}</p>
                      <p className="text-xs text-orange-400">Coût: ${productionCost.toFixed(2)}</p>
                      <p className="text-xs text-blue-400">Marge: ${(product.price - productionCost).toFixed(2)}</p>
                    </div>
                  </div>

                  {productRecipes.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-300 mb-2">Pour 2 unités:</p>
                      {productRecipes.map((recipe: any) => (
                        <div key={recipe.id} className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <span className="text-white">{recipe.raw_ingredients?.name}</span>
                            <span className="text-gray-400 text-sm">
                              {recipe.quantity_needed} {recipe.raw_ingredients?.unit}
                            </span>
                            <span className="text-green-400 text-sm">
                              (${((recipe.raw_ingredients?.cost_per_unit || 0) * recipe.quantity_needed).toFixed(2)})
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedRecipe(recipe);
                                setRecipeForm({
                                  product_id: recipe.product_id,
                                  ingredient_id: recipe.ingredient_id,
                                  quantity_needed: recipe.quantity_needed
                                });
                                setShowEditRecipe(true);
                              }}
                              className="bg-blue-500/20 text-blue-400 p-2 rounded-lg"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteRecipe(recipe.id)}
                              className="bg-red-500/20 text-red-400 p-2 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">Aucun ingrédient assigné</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6">Permissions par Grade</h2>

          <div className="space-y-6">
            {GRADE_OPTIONS.map(grade => {
              const gradePermissions = permissions.filter(p => p.grade === grade);

              return (
                <div key={grade} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-500" />
                    {grade}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {MODULE_OPTIONS.map(moduleName => {
                      const permission = gradePermissions.find(p => p.module_name === moduleName);

                      return (
                        <div key={moduleName} className="bg-white/5 rounded-lg p-3">
                          <p className="text-white font-medium mb-2 text-sm">{MODULE_LABELS[moduleName]}</p>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={permission?.can_view || false}
                                onChange={(e) => permission && updatePermission(permission.id, 'can_view', e.target.checked, moduleName, grade)}
                                className="w-4 h-4 rounded"
                              />
                              <span className="text-xs text-gray-400">Voir</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={permission?.can_edit || false}
                                onChange={(e) => permission && updatePermission(permission.id, 'can_edit', e.target.checked, moduleName, grade)}
                                className="w-4 h-4 rounded"
                              />
                              <span className="text-xs text-gray-400">Modifier</span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'salaries' && (
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-4">Configuration Salaires par Grade</h2>
          <p className="text-sm text-gray-400 mb-6">Configurez le mode de calcul des salaires pour chaque grade</p>

          <div className="space-y-4">
            {salaryConfigs.map(config => (
              <div key={config.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">{config.grade}</h3>
                  <select
                    value={config.salary_type}
                    onChange={(e) => updateSalaryConfig(config.id, 'salary_type', e.target.value, config.grade)}
                    className="px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white text-sm"
                  >
                    <option value="fixed_hourly">Taux Horaire Fixe</option>
                    <option value="revenue_percentage">Pourcentage CA</option>
                    <option value="margin_percentage">Pourcentage Marge</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {config.salary_type === 'fixed_hourly' ? (
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Taux Horaire ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={config.hourly_rate}
                        onChange={(e) => updateSalaryConfig(config.id, 'hourly_rate', parseFloat(e.target.value) || 0, config.grade)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Pourcentage (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          max="100"
                          value={config.percentage}
                          onChange={(e) => updateSalaryConfig(config.id, 'percentage', parseFloat(e.target.value) || 0, config.grade)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Basé sur</label>
                        <select
                          value={config.calculation_basis}
                          onChange={(e) => updateSalaryConfig(config.id, 'calculation_basis', e.target.value, config.grade)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white"
                        >
                          <option value="revenue">Chiffre d'affaire</option>
                          <option value="margin">Marge</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'partners' && (
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Partenaires B2B</h2>
            <button
              onClick={() => setShowAddPartner(true)}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Ajouter
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {partners.map(partner => (
              <div key={partner.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-white mb-1">{partner.name}</h3>
                    {partner.contact && <p className="text-sm text-gray-400">{partner.contact}</p>}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    partner.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {partner.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Webhook Discord/FiveM</label>
                  <input
                    type="text"
                    value={partner.webhook_url || ''}
                    onChange={(e) => {
                      const updatedPartners = partners.map(p =>
                        p.id === partner.id ? { ...p, webhook_url: e.target.value } : p
                      );
                      setPartners(updatedPartners);
                    }}
                    onBlur={async (e) => {
                      await supabase.from('partners').update({ webhook_url: e.target.value }).eq('id', partner.id);
                      showToast('Webhook mis à jour', 'success');
                    }}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'webhooks' && (
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white">Configuration Webhooks</h2>
            <p className="text-sm text-gray-400 mt-1">Configurez les URLs de webhooks Discord/FiveM par module</p>
          </div>
          <div className="space-y-4">
            {webhooks.map(webhook => (
              <div key={webhook.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{WEBHOOK_MODULE_LABELS[webhook.module_name]}</h3>
                    <p className="text-xs text-gray-500">{webhook.module_name}</p>
                  </div>
                  <button
                    onClick={() => toggleWebhook(webhook)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      webhook.is_enabled ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                    }`}
                  >
                    {webhook.is_enabled ? 'Activé' : 'Désactivé'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={webhook.webhook_url}
                    onChange={(e) => {
                      const updatedWebhooks = webhooks.map(w =>
                        w.id === webhook.id ? { ...w, webhook_url: e.target.value } : w
                      );
                      setWebhooks(updatedWebhooks);
                    }}
                    onBlur={(e) => updateWebhookUrl(webhook.id, e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'danger' && (
        <div className="backdrop-blur-xl bg-red-500/10 rounded-2xl p-6 border border-red-500/30">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h2 className="text-2xl font-bold text-red-400">Zone Danger</h2>
          </div>
          <p className="text-gray-300 mb-6">Actions irréversibles</p>

          <div className="space-y-3">
            <button className="w-full bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors">
              Réinitialiser toutes les données
            </button>
          </div>
        </div>
      )}

      {activeTab === 'webhooks' && (
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Configuration Webhooks</h2>
              <p className="text-sm text-gray-400 mt-1">Configurez les URLs de webhooks pour les notifications</p>
            </div>
            <button
              onClick={() => setShowAddWebhook(true)}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Ajouter
            </button>
          </div>
          <div className="space-y-4">
            {webhooks.map(webhook => (
              <div key={webhook.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">{WEBHOOK_MODULE_LABELS[webhook.module_name] || webhook.module_name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      webhook.is_enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {webhook.is_enabled ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-3 break-all">{webhook.webhook_url}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedWebhook(webhook);
                      setWebhookForm({ name: webhook.module_name, webhook_url: webhook.webhook_url });
                      setShowEditWebhook(true);
                    }}
                    className="flex-1 bg-blue-500/20 text-blue-400 py-2 rounded-lg font-semibold text-sm"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => toggleWebhook(webhook.id, webhook.is_enabled, webhook.module_name)}
                    className={`flex-1 py-2 rounded-lg font-semibold text-sm ${
                      webhook.is_enabled ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {webhook.is_enabled ? 'Désactiver' : 'Activer'}
                  </button>
                  <button
                    onClick={() => deleteWebhook(webhook.id, webhook.module_name)}
                    className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg font-semibold text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'danger' && (
        <div className="backdrop-blur-xl bg-red-500/10 rounded-2xl p-6 border border-red-500/30">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h2 className="text-2xl font-bold text-red-400">Zone Danger</h2>
          </div>
          <p className="text-gray-300 mb-6">Actions irréversibles</p>

          <div className="space-y-3">
            {dangerActions.map(action => (
              <div key={action.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-red-400">{action.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{action.name}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmAction(action.id)}
                  className="w-full bg-red-500/20 text-red-400 py-2 rounded-lg font-semibold"
                >
                  Exécuter
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddIngredient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Ajouter Ingrédient</h3>
              <button onClick={() => setShowAddIngredient(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4 mb-6">
              <input type="text" placeholder="Nom *" value={ingredientForm.name} onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white" />
              <select value={ingredientForm.unit} onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value as any })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white">
                <option value="kg">kg</option>
                <option value="L">L</option>
                <option value="unités">unités</option>
              </select>
              <input type="number" placeholder="Quantité initiale" value={ingredientForm.quantity} onChange={(e) => setIngredientForm({ ...ingredientForm, quantity: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white" />
              <input type="number" step="0.01" placeholder="Coût/unité ($) *" value={ingredientForm.cost_per_unit} onChange={(e) => setIngredientForm({ ...ingredientForm, cost_per_unit: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddIngredient(false)} className="flex-1 bg-white/5 text-white py-2 rounded-xl font-semibold">Annuler</button>
              <button onClick={addIngredient} className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-semibold">Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {showEditIngredient && selectedIngredient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Modifier Ingrédient</h3>
              <button onClick={() => setShowEditIngredient(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4 mb-6">
              <input type="text" value={ingredientForm.name} onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white" />
              <input type="number" step="0.01" value={ingredientForm.cost_per_unit} onChange={(e) => setIngredientForm({ ...ingredientForm, cost_per_unit: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowEditIngredient(false)} className="flex-1 bg-white/5 text-white py-2 rounded-xl font-semibold">Annuler</button>
              <button onClick={updateIngredient} className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-semibold">Mettre à jour</button>
            </div>
          </div>
        </div>
      )}

      {showRecipeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Ajouter Recette</h3>
              <button onClick={() => setShowRecipeModal(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4 mb-6">
              <select value={recipeForm.product_id} onChange={(e) => setRecipeForm({ ...recipeForm, product_id: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white">
                <option value="">Produit...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={recipeForm.ingredient_id} onChange={(e) => setRecipeForm({ ...recipeForm, ingredient_id: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white">
                <option value="">Ingrédient...</option>
                {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
              </select>
              <input type="number" step="0.1" placeholder="Quantité (pour 2 unités)" value={recipeForm.quantity_needed} onChange={(e) => setRecipeForm({ ...recipeForm, quantity_needed: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white" />
              <p className="text-xs text-gray-500">Note: Production x2, vente x1</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRecipeModal(false)} className="flex-1 bg-white/5 text-white py-2 rounded-xl font-semibold">Annuler</button>
              <button onClick={addRecipe} className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-semibold">Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {showEditRecipe && selectedRecipe && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Modifier Recette</h3>
              <button onClick={() => { setShowEditRecipe(false); setSelectedRecipe(null); }} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Quantité (pour 2 unités)</label>
                <input
                  type="number"
                  step="0.1"
                  value={recipeForm.quantity_needed}
                  onChange={(e) => setRecipeForm({ ...recipeForm, quantity_needed: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
              <p className="text-xs text-gray-500">Note: Production x2, vente x1</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowEditRecipe(false); setSelectedRecipe(null); }} className="flex-1 bg-white/5 text-white py-2 rounded-xl font-semibold">Annuler</button>
              <button onClick={updateRecipe} className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-semibold">Mettre à jour</button>
            </div>
          </div>
        </div>
      )}

      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Ajouter Produit</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nom *</label>
                <input
                  type="text"
                  placeholder="Nom du produit"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Catégorie *</label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                >
                  <option value="Plats">Plats</option>
                  <option value="Boissons">Boissons</option>
                  <option value="Menus">Menus</option>
                  <option value="Desserts">Desserts</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Image URL</label>
                <input
                  type="text"
                  placeholder="URL de l'image"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Prix de vente *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <p className="text-xs text-blue-400">
                  Le coût de production sera calculé automatiquement selon les ingrédients de la recette
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddProduct(false)} className="flex-1 bg-white/5 text-white py-2 rounded-xl font-semibold">Annuler</button>
              <button onClick={addProduct} className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-semibold">Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {showAddPartner && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Ajouter Partenaire</h3>
            <div className="space-y-4 mb-6">
              <input type="text" placeholder="Nom *" value={partnerForm.name} onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white" />
              <input type="text" placeholder="Contact" value={partnerForm.contact} onChange={(e) => setPartnerForm({ ...partnerForm, contact: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white" />
              <input type="text" placeholder="Webhook URL (optionnel)" value={partnerForm.webhook_url} onChange={(e) => setPartnerForm({ ...partnerForm, webhook_url: e.target.value })} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddPartner(false)} className="flex-1 bg-white/5 text-white py-2 rounded-xl font-semibold">Annuler</button>
              <button onClick={addPartner} className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-semibold">Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {showAddWebhook && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Ajouter Webhook</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nom *</label>
                <input
                  type="text"
                  placeholder="Discord Admin, FiveM..."
                  value={webhookForm.name}
                  onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">URL du Webhook *</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={webhookForm.webhook_url}
                  onChange={(e) => setWebhookForm({ ...webhookForm, webhook_url: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddWebhook(false)} className="flex-1 bg-white/5 text-white py-2 rounded-xl font-semibold">Annuler</button>
              <button onClick={addWebhook} className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-semibold">Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {showEditWebhook && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Modifier Webhook</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nom *</label>
                <input
                  type="text"
                  placeholder="Discord Admin, FiveM..."
                  value={webhookForm.name}
                  onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">URL du Webhook *</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={webhookForm.webhook_url}
                  onChange={(e) => setWebhookForm({ ...webhookForm, webhook_url: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowEditWebhook(false); setSelectedWebhook(null); }} className="flex-1 bg-white/5 text-white py-2 rounded-xl font-semibold">Annuler</button>
              <button onClick={updateWebhook} className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-semibold">Mettre à jour</button>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-red-500/50">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h3 className="text-xl font-bold text-red-400">Confirmation</h3>
            </div>
            <p className="text-gray-300 mb-4">Tapez <span className="font-bold">SUPPRIMER</span> pour confirmer.</p>
            <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white mb-4" placeholder="Tapez SUPPRIMER" />
            <div className="flex gap-3">
              <button onClick={() => { setConfirmAction(''); setConfirmText(''); }} className="flex-1 bg-white/5 text-white py-2 rounded-xl font-semibold">Annuler</button>
              <button onClick={() => executeDangerAction(confirmAction)} disabled={confirmText !== 'SUPPRIMER'} className="flex-1 bg-red-500 text-white py-2 rounded-xl font-semibold disabled:opacity-50">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
