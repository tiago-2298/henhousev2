import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, X, CheckCircle } from 'lucide-react';
import { supabase, Product, ReadyStock } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast';
import { notifySale, notifyLowStock } from '../../lib/discord';
import { playAddToCartSound, playCashRegisterSound, playErrorSound } from '../../lib/sounds';

interface CartItem {
  product: Product;
  quantity: number;
  stockAvailable: number;
}

export function PointOfSale() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<ReadyStock[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { employee } = useAuth();
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [prodsRes, stocksRes] = await Promise.all([
      supabase.from('products').select('*').eq('is_active', true).order('name'),
      supabase.from('ready_stock').select('*')
    ]);

    setProducts(prodsRes.data || []);
    setStocks(stocksRes.data || []);
  };

  const getStockForProduct = (productId: string): number => {
    const stock = stocks.find(s => s.product_id === productId);
    return stock?.quantity || 0;
  };

  const addToCart = (product: Product) => {
    const stockAvailable = getStockForProduct(product.id);

    if (stockAvailable <= 0) {
      playErrorSound();
      showToast('Stock insuffisant', 'error');
      return;
    }

    const existingItem = cart.find(item => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= stockAvailable) {
        playErrorSound();
        showToast('Stock insuffisant', 'error');
        return;
      }
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1, stockAvailable }]);
    }

    playAddToCartSound();
  };

  const updateQuantity = (productId: string, delta: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;

    const newQuantity = item.quantity + delta;

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > item.stockAvailable) {
      playErrorSound();
      showToast('Stock insuffisant', 'error');
      return;
    }

    setCart(cart.map(i =>
      i.product.id === productId ? { ...i, quantity: newQuantity } : i
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const handleConfirmSale = () => {
    if (cart.length === 0) {
      playErrorSound();
      showToast('Le panier est vide', 'error');
      return;
    }

    if (!invoiceNumber.trim()) {
      playErrorSound();
      showToast('Numéro de facture requis', 'error');
      return;
    }

    setShowConfirmModal(true);
  };

  const completeSale = async () => {
    setLoading(true);
    setShowConfirmModal(false);

    try {
      const total = calculateTotal();

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          employee_id: employee!.id,
          invoice_number: invoiceNumber,
          total,
          payment_method: 'cash',
          customer_type: 'B2C',
          partner_id: null
        })
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: item.product.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      for (const item of cart) {
        const currentStock = getStockForProduct(item.product.id);
        const newStock = currentStock - item.quantity;

        await supabase
          .from('ready_stock')
          .update({ quantity: newStock, updated_at: new Date().toISOString() })
          .eq('product_id', item.product.id);

        if (newStock <= 10) {
          notifyLowStock({
            itemName: item.product.name,
            quantity: newStock,
            type: 'Produit'
          });
        }
      }

      notifySale({
        employeeName: `${employee!.first_name} ${employee!.last_name}`,
        invoiceNumber,
        total,
        paymentMethod: 'Espèces',
        items: cart.map(i => ({ product: i.product.name, quantity: i.quantity, price: i.product.price }))
      });

      playCashRegisterSound();
      showToast(`Vente complétée: $${total.toFixed(2)}`, 'success');

      setCart([]);
      setInvoiceNumber('');
      loadData();
    } catch (error: any) {
      playErrorSound();
      showToast(error.message || 'Erreur lors de la vente', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex gap-6">
      {ToastComponent}

      <div className="flex-1 overflow-hidden flex flex-col">
        <h2 className="text-2xl font-bold text-white mb-4">Produits Disponibles</h2>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2">
          {products.map(product => {
            const stock = getStockForProduct(product.id);
            const isOutOfStock = stock <= 0;

            return (
              <button
                key={product.id}
                onClick={() => !isOutOfStock && addToCart(product)}
                disabled={isOutOfStock}
                className="group relative backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-orange-500 transition-all hover:shadow-lg hover:shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-white/5">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-white mb-1 text-sm">{product.name}</h3>
                <p className="text-xs text-gray-400 mb-2 line-clamp-2">{product.description}</p>
                <div className="flex justify-between items-center">
                  <p className="text-lg font-bold text-orange-500">${product.price.toFixed(2)}</p>
                  <p className={`text-xs ${stock <= 10 ? 'text-red-400' : 'text-gray-400'}`}>
                    Stock: {stock}
                  </p>
                </div>
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold">Rupture</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-96 backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <ShoppingCart className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold text-white">Panier</h2>
        </div>

        <div className="flex-1 overflow-y-auto mb-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 py-12">Panier vide</div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="flex items-start gap-3 mb-2">
                  <img src={item.product.image_url} alt={item.product.name} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-sm">{item.product.name}</h3>
                    <p className="text-orange-500 font-bold text-sm">${item.product.price.toFixed(2)}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.product.id, -1)} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-10 text-center text-white font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, 1)} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-white font-bold text-sm">${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-4 border-t border-white/10 pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">N° Facture *</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
              placeholder="INV-001"
              required
            />
          </div>

          <div className="flex justify-between items-center text-xl font-bold pt-2">
            <span className="text-gray-300">Total</span>
            <span className="text-orange-500">${calculateTotal().toFixed(2)}</span>
          </div>

          <button onClick={handleConfirmSale} disabled={cart.length === 0 || loading} className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/50 transition-all disabled:opacity-50">
            Valider la Vente
          </button>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Confirmer la vente</h3>
            <div className="space-y-2 mb-6 text-sm">
              <p className="text-gray-300">Facture: <span className="text-white font-bold">{invoiceNumber}</span></p>
              <p className="text-gray-300">Montant: <span className="text-orange-500 font-bold">${calculateTotal().toFixed(2)}</span></p>
              <p className="text-gray-300">Articles: <span className="text-white font-bold">{cart.length}</span></p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 bg-white/5 text-white py-2 rounded-xl font-semibold">Annuler</button>
              <button onClick={completeSale} className="flex-1 bg-green-500 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
