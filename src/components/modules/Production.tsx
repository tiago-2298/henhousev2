import React, { useState, useEffect } from 'react';
import { Factory, CheckCircle, Clock, Package } from 'lucide-react';
import { supabase, ProductionOrder, Product, RawMaterial, Partner } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast';
import { notifyProduction, notifyLowStock } from '../../lib/discord';

export function Production() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { employee } = useAuth();
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [ordersRes, productsRes, rawRes, partnersRes] = await Promise.all([
      supabase.from('production_orders').select('*, products(*), partners(*)').order('created_at', { ascending: false }),
      supabase.from('products').select('*').eq('is_active', true),
      supabase.from('raw_ingredients').select('*'),
      supabase.from('partners').select('*').eq('is_active', true)
    ]);

    setOrders(ordersRes.data || []);
    setProducts(productsRes.data || []);
    setRawMaterials(rawRes.data || []);
    setPartners(partnersRes.data || []);
  };

  const createProductionOrder = async () => {
    if (!selectedProduct || quantity <= 0) {
      showToast('Sélectionnez un produit et une quantité', 'error');
      return;
    }

    try {
      const orderData: any = {
        product_id: selectedProduct,
        quantity_ordered: quantity,
        status: 'pending',
        created_by: employee!.id
      };

      if (selectedPartner) {
        orderData.partner_id = selectedPartner;
      }

      const { data: order, error } = await supabase
        .from('production_orders')
        .insert(orderData)
        .select('*, products(*), partners(*)')
        .single();

      if (error) throw error;

      const product = products.find(p => p.id === selectedProduct);
      const partner = selectedPartner ? partners.find(p => p.id === selectedPartner) : null;

      notifyProduction({
        productName: product?.name || 'Inconnu',
        quantity,
        employeeName: `${employee!.first_name} ${employee!.last_name}`,
        status: partner ? `Ordre créé pour ${partner.name}` : 'Ordre créé'
      });

      showToast('Ordre de production créé', 'success');
      setShowCreateModal(false);
      setSelectedProduct('');
      setSelectedPartner('');
      setQuantity(1);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la création', 'error');
    }
  };

  const startProduction = async (orderId: string) => {
    try {
      await supabase
        .from('production_orders')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
          started_by: employee!.id
        })
        .eq('id', orderId);

      showToast('Production démarrée', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const completeProduction = async (order: any) => {
    try {
      await supabase
        .from('production_orders')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          quantity_produced: order.quantity_ordered
        })
        .eq('id', order.id);

      const { data: stock } = await supabase
        .from('ready_stock')
        .select('*')
        .eq('product_id', order.product_id)
        .maybeSingle();

      if (stock) {
        await supabase
          .from('ready_stock')
          .update({
            quantity: stock.quantity + order.quantity_ordered,
            updated_at: new Date().toISOString()
          })
          .eq('product_id', order.product_id);
      } else {
        await supabase
          .from('ready_stock')
          .insert({
            product_id: order.product_id,
            quantity: order.quantity_ordered
          });
      }

      notifyProduction({
        productName: order.products?.name || 'Inconnu',
        quantity: order.quantity_ordered,
        employeeName: `${employee!.first_name} ${employee!.last_name}`,
        status: 'Complété'
      });

      showToast('Production complétée', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    inProgress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length
  };

  return (
    <div className="h-full overflow-y-auto">
      {ToastComponent}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-2xl p-6 border border-yellow-500/30">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <h3 className="text-sm font-medium text-yellow-200">En Attente</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.pending}</p>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-center gap-3 mb-2">
            <Factory className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-medium text-blue-200">En Production</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.inProgress}</p>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl p-6 border border-green-500/30">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-medium text-green-200">Terminés</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.completed}</p>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Ordres de Production</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-orange-500/50 transition-all"
          >
            <Package className="w-5 h-5" />
            Nouvel Ordre
          </button>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-center text-gray-400 py-12">Aucun ordre de production</p>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-4">
                    {order.products?.image_url && (
                      <img src={order.products.image_url} alt={order.products.name} className="w-16 h-16 rounded-lg object-cover" />
                    )}
                    <div>
                      <h3 className="font-semibold text-white text-lg">{order.products?.name}</h3>
                      <p className="text-sm text-gray-400">Quantité: {order.quantity_ordered}</p>
                      {order.partners && (
                        <p className="text-sm text-orange-400 font-medium">
                          Pour: {order.partners.name} (B2B)
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Créé le {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                {order.status === 'pending' && (
                  <button
                    onClick={() => startProduction(order.id)}
                    className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-all"
                  >
                    Démarrer la Production
                  </button>
                )}

                {order.status === 'in_progress' && (
                  <button
                    onClick={() => completeProduction(order)}
                    className="w-full bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Marquer comme Terminé
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Nouvel Ordre de Production</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Produit *</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                >
                  <option value="">Sélectionner un produit...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Partenaire B2B (optionnel)</label>
                <select
                  value={selectedPartner}
                  onChange={(e) => setSelectedPartner(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                >
                  <option value="">Standard (B2C)</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Quantité *</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  min="1"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedProduct('');
                  setSelectedPartner('');
                  setQuantity(1);
                }}
                className="flex-1 bg-white/5 text-white py-2 rounded-xl font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={createProductionOrder}
                className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-semibold"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
