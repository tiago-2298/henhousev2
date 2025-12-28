import React, { useState, useEffect } from 'react';
import { Handshake, Plus, DollarSign, FileText, AlertCircle } from 'lucide-react';
import { supabase, Partner, Menu, PartnerMenuPermission, PartnerSale, PartnerInvoice } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast';

export function PartnerSales() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [permissions, setPermissions] = useState<PartnerMenuPermission[]>([]);
  const [sales, setSales] = useState<PartnerSale[]>([]);
  const [invoices, setInvoices] = useState<PartnerInvoice[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [selectedMenu, setSelectedMenu] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [view, setView] = useState<'sale' | 'config' | 'invoices'>('sale');
  const { showToast, ToastComponent } = useToast();
  const { employee } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [partnersRes, menusRes, permissionsRes, salesRes, invoicesRes] = await Promise.all([
      supabase.from('partners').select('*').eq('is_active', true).order('name'),
      supabase.from('menus').select('*').eq('is_active', true).order('name'),
      supabase.from('partner_menu_permissions').select('*').eq('is_active', true),
      supabase.from('partner_sales').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('partner_invoices').select('*').order('created_at', { ascending: false }).limit(20)
    ]);

    setPartners(partnersRes.data || []);
    setMenus(menusRes.data || []);
    setPermissions(permissionsRes.data || []);
    setSales(salesRes.data || []);
    setInvoices(invoicesRes.data || []);
  };

  const getPartnerPermissions = (partnerId: string) => {
    return permissions.filter(p => p.partner_id === partnerId);
  };

  const getTodaySales = (partnerId: string, menuId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return sales.filter(s =>
      s.partner_id === partnerId &&
      s.menu_id === menuId &&
      s.sale_date === today
    ).reduce((sum, s) => sum + s.quantity, 0);
  };

  const processSale = async () => {
    if (!selectedPartner || !selectedMenu || !employee) {
      showToast('Veuillez sélectionner un partenaire et un menu', 'error');
      return;
    }

    const permission = permissions.find(p =>
      p.partner_id === selectedPartner &&
      p.menu_id === selectedMenu &&
      p.is_active
    );

    if (!permission) {
      showToast('Ce menu n\'est pas autorisé pour ce partenaire', 'error');
      return;
    }

    const todaySales = getTodaySales(selectedPartner, selectedMenu);
    if (todaySales + quantity > permission.daily_limit) {
      showToast(`Limite quotidienne dépassée (${permission.daily_limit} max)`, 'error');
      return;
    }

    try {
      const total = permission.partner_price * quantity;
      await supabase.from('partner_sales').insert({
        partner_id: selectedPartner,
        menu_id: selectedMenu,
        employee_id: employee.id,
        quantity,
        unit_price: permission.partner_price,
        total,
        sale_date: new Date().toISOString().split('T')[0]
      });

      showToast(`Vente enregistrée: ${quantity} menus pour ${total.toFixed(2)}$`, 'success');
      setQuantity(1);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la vente', 'error');
    }
  };

  const addPermission = async (partnerId: string, menuId: string, partnerPrice: number, dailyLimit: number) => {
    try {
      await supabase.from('partner_menu_permissions').insert({
        partner_id: partnerId,
        menu_id: menuId,
        partner_price: partnerPrice,
        daily_limit: dailyLimit,
        is_active: true
      });
      showToast('Permission ajoutée', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const removePermission = async (permissionId: string) => {
    if (!confirm('Supprimer cette autorisation ?')) return;
    try {
      await supabase.from('partner_menu_permissions').delete().eq('id', permissionId);
      showToast('Permission supprimée', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const generateInvoice = async (partnerId: string) => {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const startDate = startOfWeek.toISOString().split('T')[0];
      const endDate = endOfWeek.toISOString().split('T')[0];

      const weekSales = sales.filter(s =>
        s.partner_id === partnerId &&
        s.sale_date >= startDate &&
        s.sale_date <= endDate &&
        !s.invoice_id
      );

      if (weekSales.length === 0) {
        showToast('Aucune vente non facturée pour cette période', 'error');
        return;
      }

      const totalAmount = weekSales.reduce((sum, s) => sum + s.total, 0);
      const invoiceNumber = `INV-${Date.now()}`;

      const { data: invoice } = await supabase.from('partner_invoices').insert({
        partner_id: partnerId,
        invoice_number: invoiceNumber,
        start_date: startDate,
        end_date: endDate,
        total_amount: totalAmount,
        status: 'pending'
      }).select().single();

      if (invoice) {
        const saleIds = weekSales.map(s => s.id);
        await supabase.from('partner_sales').update({ invoice_id: invoice.id }).in('id', saleIds);
      }

      showToast(`Facture ${invoiceNumber} générée: ${totalAmount.toFixed(2)}$`, 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const partnerPermissions = selectedPartner ? getPartnerPermissions(selectedPartner) : [];
  const availableMenus = partnerPermissions.map(p => menus.find(m => m.id === p.menu_id)).filter(Boolean) as Menu[];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <ToastComponent />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Handshake className="w-8 h-8 text-orange-400" />
            Ventes Partenaires
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setView('sale')}
              className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
                view === 'sale' ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400'
              }`}
            >
              Vente
            </button>
            <button
              onClick={() => setView('config')}
              className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
                view === 'config' ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400'
              }`}
            >
              Configuration
            </button>
            <button
              onClick={() => setView('invoices')}
              className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
                view === 'invoices' ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400'
              }`}
            >
              Factures
            </button>
          </div>
        </div>

        {view === 'sale' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Nouvelle Vente</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Partenaire *</label>
                  <select
                    value={selectedPartner}
                    onChange={(e) => {
                      setSelectedPartner(e.target.value);
                      setSelectedMenu('');
                    }}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                  >
                    <option value="">Sélectionner un partenaire</option>
                    {partners.map(partner => (
                      <option key={partner.id} value={partner.id}>{partner.name}</option>
                    ))}
                  </select>
                </div>
                {selectedPartner && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Menu *</label>
                      <select
                        value={selectedMenu}
                        onChange={(e) => setSelectedMenu(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                      >
                        <option value="">Sélectionner un menu</option>
                        {availableMenus.map(menu => {
                          const permission = partnerPermissions.find(p => p.menu_id === menu.id);
                          const todayCount = getTodaySales(selectedPartner, menu.id);
                          return (
                            <option key={menu.id} value={menu.id}>
                              {menu.name} - {permission?.partner_price.toFixed(2)}$ ({todayCount}/{permission?.daily_limit})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    {selectedMenu && (
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Quantité *</label>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          min="1"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                        />
                        {(() => {
                          const permission = partnerPermissions.find(p => p.menu_id === selectedMenu);
                          const todayCount = getTodaySales(selectedPartner, selectedMenu);
                          const remaining = (permission?.daily_limit || 0) - todayCount;
                          const total = (permission?.partner_price || 0) * quantity;

                          return (
                            <div className="mt-3 p-3 bg-orange-500/10 rounded-xl border border-orange-500/30">
                              <p className="text-sm text-gray-300">Restant aujourd'hui: <span className="font-bold text-white">{remaining}</span></p>
                              <p className="text-lg font-bold text-orange-400 mt-1">Total: {total.toFixed(2)}$</p>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </>
                )}
                <button
                  onClick={processSale}
                  disabled={!selectedPartner || !selectedMenu}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                >
                  Enregistrer la Vente
                </button>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Ventes Récentes</h2>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {sales.slice(0, 20).map(sale => {
                  const partner = partners.find(p => p.id === sale.partner_id);
                  const menu = menus.find(m => m.id === sale.menu_id);
                  return (
                    <div key={sale.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-semibold text-white">{partner?.name}</p>
                        <span className="text-orange-400 font-bold">{sale.total.toFixed(2)}$</span>
                      </div>
                      <p className="text-sm text-gray-400">{menu?.name} x {sale.quantity}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(sale.created_at).toLocaleString('fr-FR')}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {view === 'config' && (
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Configuration des Partenaires</h2>
            {partners.map(partner => {
              const partnerPerms = getPartnerPermissions(partner.id);
              return (
                <div key={partner.id} className="mb-6 bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold text-white">{partner.name}</h3>
                    <button
                      onClick={() => {
                        const menuId = prompt('ID du menu:');
                        const price = prompt('Prix partenaire:');
                        const limit = prompt('Limite journalière:');
                        if (menuId && price && limit) {
                          addPermission(partner.id, menuId, parseFloat(price), parseInt(limit));
                        }
                      }}
                      className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-sm font-semibold"
                    >
                      + Menu
                    </button>
                  </div>
                  <div className="space-y-2">
                    {partnerPerms.length === 0 ? (
                      <p className="text-gray-400 text-sm">Aucun menu autorisé</p>
                    ) : (
                      partnerPerms.map(perm => {
                        const menu = menus.find(m => m.id === perm.menu_id);
                        const todayCount = getTodaySales(partner.id, perm.menu_id);
                        return (
                          <div key={perm.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                            <div>
                              <p className="font-semibold text-white">{menu?.name}</p>
                              <p className="text-sm text-gray-400">
                                {perm.partner_price.toFixed(2)}$ • {todayCount}/{perm.daily_limit} vendus aujourd'hui
                              </p>
                            </div>
                            <button
                              onClick={() => removePermission(perm.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Supprimer
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'invoices' && (
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Factures</h2>
              <select
                onChange={(e) => e.target.value && generateInvoice(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
              >
                <option value="">Générer facture...</option>
                {partners.map(partner => (
                  <option key={partner.id} value={partner.id}>{partner.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              {invoices.map(invoice => {
                const partner = partners.find(p => p.id === invoice.partner_id);
                return (
                  <div key={invoice.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-white">{invoice.invoice_number}</p>
                        <p className="text-sm text-gray-400">{partner?.name}</p>
                        <p className="text-xs text-gray-500">
                          Du {new Date(invoice.start_date).toLocaleDateString('fr-FR')} au {new Date(invoice.end_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-400">{invoice.total_amount.toFixed(2)}$</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          invoice.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                          invoice.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {invoice.status === 'paid' ? 'Payée' : invoice.status === 'cancelled' ? 'Annulée' : 'En attente'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
