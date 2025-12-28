import React, { useState, useEffect } from 'react';
import { TrendingDown, DollarSign, Plus, AlertTriangle } from 'lucide-react';
import { supabase, Expense, Loss } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast';

export function ExpensesLosses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [losses, setLosses] = useState<Loss[]>([]);
  const [activeTab, setActiveTab] = useState<'expenses' | 'losses'>('expenses');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: 0,
    category: ''
  });
  const [lossForm, setLossForm] = useState({
    item_type: 'product' as 'product' | 'raw_material',
    item_name: '',
    quantity: 0,
    estimated_value: 0,
    reason: ''
  });
  const { employee } = useAuth();
  const { showToast, ToastComponent } = useToast();

  const canEdit = employee?.grade === 'PDG' || employee?.grade === 'CoPDG' || employee?.grade === 'Manager';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [expensesRes, lossesRes] = await Promise.all([
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('losses').select('*').order('date', { ascending: false })
    ]);

    setExpenses(expensesRes.data || []);
    setLosses(lossesRes.data || []);
  };

  const addExpense = async () => {
    if (!canEdit) {
      showToast('Accès refusé', 'error');
      return;
    }

    if (!expenseForm.description || expenseForm.amount <= 0) {
      showToast('Remplissez tous les champs', 'error');
      return;
    }

    try {
      await supabase.from('expenses').insert({
        ...expenseForm,
        recorded_by: employee!.id,
        date: new Date().toISOString()
      });

      showToast('Dépense enregistrée', 'success');
      setShowAddModal(false);
      setExpenseForm({ description: '', amount: 0, category: '' });
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const addLoss = async () => {
    if (!canEdit) {
      showToast('Accès refusé', 'error');
      return;
    }

    if (!lossForm.item_name || lossForm.quantity <= 0 || !lossForm.reason) {
      showToast('Remplissez tous les champs', 'error');
      return;
    }

    try {
      await supabase.from('losses').insert({
        ...lossForm,
        recorded_by: employee!.id,
        date: new Date().toISOString()
      });

      showToast('Perte enregistrée', 'success');
      setShowAddModal(false);
      setLossForm({ item_type: 'product', item_name: '', quantity: 0, estimated_value: 0, reason: '' });
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalLosses = losses.reduce((sum, l) => sum + l.estimated_value, 0);

  return (
    <div className="h-full overflow-y-auto">
      {ToastComponent}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="backdrop-blur-xl bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl p-6 border border-red-500/30">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-red-400" />
            <h3 className="text-sm font-medium text-red-200">Total Dépenses</h3>
          </div>
          <p className="text-3xl font-bold text-white">${totalExpenses.toFixed(2)}</p>
          <p className="text-sm text-gray-400 mt-1">{expenses.length} dépenses</p>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-2xl p-6 border border-orange-500/30">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-6 h-6 text-orange-400" />
            <h3 className="text-sm font-medium text-orange-200">Total Pertes</h3>
          </div>
          <p className="text-3xl font-bold text-white">${totalLosses.toFixed(2)}</p>
          <p className="text-sm text-gray-400 mt-1">{losses.length} pertes</p>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${activeTab === 'expenses' ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400'}`}
            >
              Dépenses
            </button>
            <button
              onClick={() => setActiveTab('losses')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${activeTab === 'losses' ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400'}`}
            >
              Pertes
            </button>
          </div>

          {canEdit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-orange-500/50 transition-all"
            >
              <Plus className="w-5 h-5" />
              Ajouter
            </button>
          )}
        </div>

        {activeTab === 'expenses' ? (
          <div className="space-y-3">
            {expenses.length === 0 ? (
              <p className="text-center text-gray-400 py-12">Aucune dépense enregistrée</p>
            ) : (
              expenses.map(expense => (
                <div key={expense.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{expense.description}</h3>
                      {expense.category && (
                        <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs mb-2">
                          {expense.category}
                        </span>
                      )}
                      <p className="text-xs text-gray-500">
                        {new Date(expense.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span className="text-red-400 font-bold text-xl">-${expense.amount.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {losses.length === 0 ? (
              <p className="text-center text-gray-400 py-12">Aucune perte enregistrée</p>
            ) : (
              losses.map(loss => (
                <div key={loss.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500 mt-1" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-white">{loss.item_name}</h3>
                          <p className="text-sm text-gray-400">Quantité: {loss.quantity}</p>
                        </div>
                        <span className="text-red-400 font-bold">-${loss.estimated_value.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{loss.reason}</p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                          {loss.item_type === 'product' ? 'Produit' : 'Matière première'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(loss.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">
              {activeTab === 'expenses' ? 'Ajouter une Dépense' : 'Enregistrer une Perte'}
            </h3>

            {activeTab === 'expenses' ? (
              <div className="space-y-4 mb-6">
                <input
                  type="text"
                  placeholder="Description"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
                <input
                  type="text"
                  placeholder="Catégorie (optionnel)"
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
                <input
                  type="number"
                  placeholder="Montant"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                <select
                  value={lossForm.item_type}
                  onChange={(e) => setLossForm({ ...lossForm, item_type: e.target.value as 'product' | 'raw_material' })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                >
                  <option value="product">Produit</option>
                  <option value="raw_material">Matière première</option>
                </select>
                <input
                  type="text"
                  placeholder="Nom de l'article"
                  value={lossForm.item_name}
                  onChange={(e) => setLossForm({ ...lossForm, item_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
                <input
                  type="number"
                  placeholder="Quantité perdue"
                  value={lossForm.quantity}
                  onChange={(e) => setLossForm({ ...lossForm, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
                <input
                  type="number"
                  placeholder="Valeur estimée"
                  value={lossForm.estimated_value}
                  onChange={(e) => setLossForm({ ...lossForm, estimated_value: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
                <textarea
                  placeholder="Raison"
                  value={lossForm.reason}
                  onChange={(e) => setLossForm({ ...lossForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white resize-none"
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setExpenseForm({ description: '', amount: 0, category: '' });
                  setLossForm({ item_type: 'product', item_name: '', quantity: 0, estimated_value: 0, reason: '' });
                }}
                className="flex-1 bg-white/5 text-white py-2 rounded-xl font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={activeTab === 'expenses' ? addExpense : addLoss}
                className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-semibold"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
