import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, X } from 'lucide-react';
import { supabase, Menu, MenuItem, Product } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast';

export function MenuManagement() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'Menus',
    image_url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'
  });
  const [selectedProducts, setSelectedProducts] = useState<{ product_id: string; quantity: number }[]>([]);
  const { showToast, ToastComponent } = useToast();
  const { employee } = useAuth();

  const isAdmin = employee?.grade === 'PDG' || employee?.grade === 'CoPDG';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [menusRes, productsRes, menuItemsRes] = await Promise.all([
      supabase.from('menus').select('*').order('name'),
      supabase.from('products').select('*').eq('is_active', true).order('name'),
      supabase.from('menu_items').select('*')
    ]);

    setMenus(menusRes.data || []);
    setProducts(productsRes.data || []);
    setMenuItems(menuItemsRes.data || []);
  };

  const addMenu = async () => {
    if (!menuForm.name || selectedProducts.length === 0) {
      showToast('Nom et au moins un produit requis', 'error');
      return;
    }

    try {
      const { data: newMenu, error: menuError } = await supabase
        .from('menus')
        .insert(menuForm)
        .select()
        .single();

      if (menuError) throw menuError;

      const menuItemsData = selectedProducts.map(sp => ({
        menu_id: newMenu.id,
        product_id: sp.product_id,
        quantity: sp.quantity
      }));

      await supabase.from('menu_items').insert(menuItemsData);

      showToast('Menu créé', 'success');
      setShowAddMenu(false);
      resetForm();
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const updateMenu = async () => {
    if (!selectedMenu) return;

    try {
      await supabase.from('menus').update(menuForm).eq('id', selectedMenu.id);
      await supabase.from('menu_items').delete().eq('menu_id', selectedMenu.id);

      const menuItemsData = selectedProducts.map(sp => ({
        menu_id: selectedMenu.id,
        product_id: sp.product_id,
        quantity: sp.quantity
      }));

      await supabase.from('menu_items').insert(menuItemsData);

      showToast('Menu mis à jour', 'success');
      setShowEditMenu(false);
      setSelectedMenu(null);
      resetForm();
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const deleteMenu = async (menuId: string) => {
    if (!confirm('Êtes-vous sûr ?')) return;

    try {
      await supabase.from('menus').delete().eq('id', menuId);
      showToast('Menu supprimé', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const resetForm = () => {
    setMenuForm({
      name: '',
      description: '',
      price: 0,
      category: 'Menus',
      image_url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'
    });
    setSelectedProducts([]);
  };

  const openEditMenu = async (menu: Menu) => {
    setSelectedMenu(menu);
    setMenuForm({
      name: menu.name,
      description: menu.description || '',
      price: menu.price,
      category: menu.category,
      image_url: menu.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'
    });

    const items = menuItems.filter(mi => mi.menu_id === menu.id);
    setSelectedProducts(items.map(i => ({ product_id: i.product_id, quantity: i.quantity })));
    setShowEditMenu(true);
  };

  const getMenuItems = (menuId: string) => menuItems.filter(mi => mi.menu_id === menuId);

  const addProductToMenu = () => {
    if (products.length > 0) {
      setSelectedProducts([...selectedProducts, { product_id: products[0].id, quantity: 1 }]);
    }
  };

  const removeProductFromMenu = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const updateProductQuantity = (index: number, quantity: number) => {
    const updated = [...selectedProducts];
    updated[index].quantity = quantity;
    setSelectedProducts(updated);
  };

  const updateProductSelection = (index: number, productId: string) => {
    const updated = [...selectedProducts];
    updated[index].product_id = productId;
    setSelectedProducts(updated);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="backdrop-blur-xl bg-red-500/10 rounded-2xl p-8 border border-red-500/30">
            <h2 className="text-2xl font-bold text-red-400 mb-2">Accès Refusé</h2>
            <p className="text-gray-300">Seuls les PDG et CoPDG peuvent gérer les menus</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <ToastComponent />
      <div className="max-w-7xl mx-auto">
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Package className="w-8 h-8 text-orange-400" />
                Gestion des Menus
              </h1>
              <p className="text-gray-400 mt-1">Créez des menus composés de plusieurs produits</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddMenu(true);
              }}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <Plus className="w-5 h-5" />
              Nouveau Menu
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menus.map(menu => {
              const items = getMenuItems(menu.id);
              return (
                <div key={menu.id} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-orange-500/50 transition-all">
                  <img src={menu.image_url || ''} alt={menu.name} className="w-full h-48 object-cover rounded-lg mb-3" />
                  <h3 className="font-bold text-white text-lg mb-1">{menu.name}</h3>
                  <p className="text-sm text-gray-400 mb-3">{menu.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-orange-400">{menu.price.toFixed(2)}$</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      menu.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {menu.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <div className="mb-3 text-sm text-gray-300">
                    <p className="font-semibold mb-1">Contenu ({items.length} produits):</p>
                    {items.map((item, idx) => {
                      const product = products.find(p => p.id === item.product_id);
                      return product ? (
                        <p key={idx} className="text-gray-400">• {item.quantity}x {product.name}</p>
                      ) : null;
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditMenu(menu)}
                      className="flex-1 bg-blue-500/20 text-blue-400 py-2 rounded-lg font-semibold text-sm hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Modifier
                    </button>
                    <button
                      onClick={() => deleteMenu(menu.id)}
                      className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {(showAddMenu || showEditMenu) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full mx-4 border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">{showAddMenu ? 'Nouveau Menu' : 'Modifier Menu'}</h3>
              <button
                onClick={() => {
                  setShowAddMenu(false);
                  setShowEditMenu(false);
                  setSelectedMenu(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nom du menu *</label>
                <input
                  type="text"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Description</label>
                <textarea
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Prix *</label>
                <input
                  type="number"
                  value={menuForm.price}
                  onChange={(e) => setMenuForm({ ...menuForm, price: parseFloat(e.target.value) || 0 })}
                  step="0.01"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">URL Image</label>
                <input
                  type="text"
                  value={menuForm.image_url}
                  onChange={(e) => setMenuForm({ ...menuForm, image_url: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm text-gray-400">Produits du menu *</label>
                  <button
                    onClick={addProductToMenu}
                    className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-sm font-semibold hover:bg-green-500/30"
                  >
                    + Ajouter Produit
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedProducts.map((sp, index) => (
                    <div key={index} className="flex gap-2 items-center bg-white/5 p-2 rounded-lg">
                      <select
                        value={sp.product_id}
                        onChange={(e) => updateProductSelection(index, e.target.value)}
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                      >
                        {products.map(product => (
                          <option key={product.id} value={product.id}>{product.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={sp.quantity}
                        onChange={(e) => updateProductQuantity(index, parseInt(e.target.value) || 1)}
                        min="1"
                        className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                      />
                      <button
                        onClick={() => removeProductFromMenu(index)}
                        className="bg-red-500/20 text-red-400 p-2 rounded-lg hover:bg-red-500/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddMenu(false);
                  setShowEditMenu(false);
                  setSelectedMenu(null);
                  resetForm();
                }}
                className="flex-1 bg-white/5 text-white py-2 rounded-xl font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={showAddMenu ? addMenu : updateMenu}
                className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-semibold"
              >
                {showAddMenu ? 'Créer' : 'Mettre à jour'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
