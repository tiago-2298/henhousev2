import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, Plus, Minus } from 'lucide-react';
import { supabase, RawMaterial, ReadyStock, Product } from '../../lib/supabase';
import { useToast } from '../Toast';
import { notifyLowStock } from '../../lib/discord';

export function StockManagement() {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [readyStock, setReadyStock] = useState<ReadyStock[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'raw' | 'ready'>('raw');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [rawRes, readyRes, prodRes] = await Promise.all([
      supabase.from('raw_ingredients').select('*').order('name'),
      supabase.from('ready_stock').select('*, products(*)'),
      supabase.from('products').select('*')
    ]);

    setRawMaterials(rawRes.data || []);
    setReadyStock(readyRes.data || []);
    setProducts(prodRes.data || []);
  };

  const handleAdjustStock = async () => {
    if (!selectedItem || adjustQuantity === 0 || !adjustReason.trim()) {
      showToast('Remplissez tous les champs', 'error');
      return;
    }

    try {
      if (activeTab === 'raw') {
        const material = rawMaterials.find(m => m.id === selectedItem);
        if (!material) return;

        const newQuantity = material.quantity + adjustQuantity;
        if (newQuantity < 0) {
          showToast('Quantité insuffisante', 'error');
          return;
        }

        await supabase
          .from('raw_ingredients')
          .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
          .eq('id', selectedItem);

        await supabase.from('stock_adjustments').insert({
          item_type: 'raw_material',
          item_id: selectedItem,
          quantity_change: adjustQuantity,
          reason: adjustReason
        });

        if (newQuantity <= 50) {
          notifyLowStock({
            itemName: material.name,
            quantity: newQuantity,
            type: 'Matière première'
          });
        }
      } else {
        const stock = readyStock.find(s => s.product_id === selectedItem);
        if (!stock) return;

        const newQuantity = stock.quantity + adjustQuantity;
        if (newQuantity < 0) {
          showToast('Quantité insuffisante', 'error');
          return;
        }

        await supabase
          .from('ready_stock')
          .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
          .eq('product_id', selectedItem);

        await supabase.from('stock_adjustments').insert({
          item_type: 'product',
          item_id: selectedItem,
          quantity_change: adjustQuantity,
          reason: adjustReason
        });

        const product = products.find(p => p.id === selectedItem);
        if (newQuantity <= 10 && product) {
          notifyLowStock({
            itemName: product.name,
            quantity: newQuantity,
            type: 'Produit'
          });
        }
      }

      showToast('Stock ajusté avec succès', 'success');
      setShowAddModal(false);
      setSelectedItem('');
      setAdjustQuantity(0);
      setAdjustReason('');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de l\'ajustement', 'error');
    }
  };

  const getLowStockItems = () => {
    const lowRaw = rawMaterials.filter(m => m.quantity <= 50);
    const lowReady = readyStock.filter(s => s.quantity <= 10);
    return { lowRaw, lowReady, total: lowRaw.length + lowReady.length };
  };

  const lowStock = getLowStockItems();

  return (
    <div className="h-full overflow-y-auto">
      {ToastComponent}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-medium text-blue-200">Matières Premières</h3>
          </div>
          <p className="text-3xl font-bold text-white">{rawMaterials.length}</p>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl p-6 border border-green-500/30">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-medium text-green-200">Produits Finis</h3>
          </div>
          <p className="text-3xl font-bold text-white">{readyStock.length}</p>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl p-6 border border-red-500/30">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-sm font-medium text-red-200">Alertes Stock Faible</h3>
          </div>
          <p className="text-3xl font-bold text-white">{lowStock.total}</p>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${activeTab === 'raw' ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400'}`}
            >
              Matières Premières
            </button>
            <button
              onClick={() => setActiveTab('ready')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${activeTab === 'ready' ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400'}`}
            >
              Produits Finis
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-orange-500/50 transition-all"
          >
            <Plus className="w-5 h-5" />
            Ajuster Stock
          </button>
        </div>

        {activeTab === 'raw' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rawMaterials.map(material => (
              <div key={material.id} className={`bg-white/5 rounded-xl p-4 border ${material.quantity <= 50 ? 'border-red-500/50' : 'border-white/10'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{material.name}</h3>
                    <p className="text-xs text-gray-400">{material.unit}</p>
                  </div>
                  {material.quantity <= 50 && (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Stock</span>
                  <span className={`text-2xl font-bold ${material.quantity <= 50 ? 'text-red-400' : 'text-white'}`}>
                    {material.quantity}
                  </span>
                </div>
                {material.quantity <= 50 && (
                  <div className="mt-2 text-xs text-red-400 font-medium">⚠️ Stock critique</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyStock.map(stock => {
              const product = products.find(p => p.id === stock.product_id);
              if (!product) return null;

              return (
                <div key={stock.id} className={`bg-white/5 rounded-xl p-4 border ${stock.quantity <= 10 ? 'border-red-500/50' : 'border-white/10'}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{product.name}</h3>
                      <p className="text-sm text-orange-500 font-bold">${product.price.toFixed(2)}</p>
                    </div>
                    {stock.quantity <= 10 && (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Stock</span>
                    <span className={`text-2xl font-bold ${stock.quantity <= 10 ? 'text-red-400' : 'text-white'}`}>
                      {stock.quantity}
                    </span>
                  </div>
                  {stock.quantity <= 10 && (
                    <div className="mt-2 text-xs text-red-400 font-medium">⚠️ Stock critique</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Ajuster le Stock</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {activeTab === 'raw' ? 'Matière Première' : 'Produit'}
                </label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                >
                  <option value="">Sélectionner...</option>
                  {activeTab === 'raw'
                    ? rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)
                    : products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Quantité</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAdjustQuantity(Math.max(-999, adjustQuantity - 1))}
                    className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <input
                    type="number"
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-center"
                  />
                  <button
                    onClick={() => setAdjustQuantity(Math.min(999, adjustQuantity + 1))}
                    className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Nombre positif pour ajouter, négatif pour retirer
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Raison</label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white resize-none"
                  rows={3}
                  placeholder="Raison de l'ajustement..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedItem('');
                  setAdjustQuantity(0);
                  setAdjustReason('');
                }}
                className="flex-1 bg-white/5 text-white py-2 rounded-xl font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleAdjustStock}
                className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-semibold"
              >
                Ajuster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
