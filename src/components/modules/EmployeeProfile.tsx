import React, { useState, useEffect } from 'react';
import { User, Lock, DollarSign, Download, Calendar, TrendingUp, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast';

interface PayrollRecord {
  id: string;
  period_start: string;
  period_end: string;
  work_hours: number;
  base_salary: number;
  commissions: number;
  bonuses: number;
  deductions: number;
  total_amount: number;
  paid: boolean;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

interface SaleRecord {
  id: string;
  invoice_number: string;
  total: number;
  created_at: string;
}

export function EmployeeProfile() {
  const [activeTab, setActiveTab] = useState<'info' | 'payroll' | 'commissions' | 'password'>('info');
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { employee } = useAuth();
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    loadData();
  }, [employee]);

  const loadData = async () => {
    if (!employee) return;

    const [payrollRes, salesRes] = await Promise.all([
      supabase
        .from('payroll_records')
        .select('*')
        .eq('employee_id', employee.id)
        .order('period_end', { ascending: false }),
      supabase
        .from('sales')
        .select('id, invoice_number, total, created_at')
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false })
        .limit(100)
    ]);

    setPayrollRecords(payrollRes.data || []);
    setSales(salesRes.data || []);
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Remplissez tous les champs', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Les mots de passe ne correspondent pas', 'error');
      return;
    }

    if (newPassword.length < 4) {
      showToast('Le mot de passe doit contenir au moins 4 caractères', 'error');
      return;
    }

    const { data: emp } = await supabase
      .from('employees')
      .select('password')
      .eq('id', employee!.id)
      .single();

    if (emp?.password !== currentPassword) {
      showToast('Mot de passe actuel incorrect', 'error');
      return;
    }

    const { error } = await supabase
      .from('employees')
      .update({ password: newPassword })
      .eq('id', employee!.id);

    if (error) {
      showToast('Erreur lors du changement', 'error');
      return;
    }

    showToast('Mot de passe changé avec succès', 'success');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const downloadPayslip = (record: PayrollRecord) => {
    const content = `
HEN HOUSE - BULLETIN DE PAIE
================================

Employé: ${employee?.first_name} ${employee?.last_name}
Grade: ${employee?.grade}
Période: ${new Date(record.period_start).toLocaleDateString('fr-FR')} - ${new Date(record.period_end).toLocaleDateString('fr-FR')}

DÉTAILS
--------------------------------
Heures travaillées: ${record.work_hours.toFixed(2)}h
Salaire de base: $${record.base_salary.toFixed(2)}
Commissions: $${record.commissions.toFixed(2)}
Bonus: $${record.bonuses.toFixed(2)}
Déductions: -$${record.deductions.toFixed(2)}

TOTAL NET: $${record.total_amount.toFixed(2)}

Statut: ${record.paid ? 'PAYÉ' : 'EN ATTENTE'}
${record.paid && record.paid_at ? `Date de paiement: ${new Date(record.paid_at).toLocaleDateString('fr-FR')}` : ''}

${record.notes ? `Notes: ${record.notes}` : ''}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulletin_paie_${new Date(record.period_end).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showToast('Bulletin téléchargé', 'success');
  };

  const totalCommissions = sales.reduce((sum, s) => sum + (s.commission_amount || 0), 0);
  const totalEarned = payrollRecords.reduce((sum, p) => sum + p.total_amount, 0);

  return (
    <div className="h-full overflow-y-auto">
      {ToastComponent}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Mon Profil</h1>
        <p className="text-gray-400">Gérez vos informations personnelles et consultez vos données</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'info' as const, label: 'Informations', icon: User },
          { id: 'payroll' as const, label: 'Historique Paies', icon: DollarSign },
          { id: 'commissions' as const, label: 'Commissions', icon: TrendingUp },
          { id: 'password' as const, label: 'Mot de Passe', icon: Lock }
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

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-orange-500" />
              Informations Personnelles
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Nom Complet</label>
                <p className="text-white font-medium">{employee?.first_name} {employee?.last_name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Grade</label>
                <p className="text-white font-medium">{employee?.grade}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">ID Personnel</label>
                <p className="text-white font-medium">{employee?.personal_id || 'Non renseigné'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Téléphone</label>
                <p className="text-white font-medium">{employee?.phone || 'Non renseigné'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Date d'embauche</label>
                <p className="text-white font-medium">
                  {employee?.hire_date ? new Date(employee.hire_date).toLocaleDateString('fr-FR') : 'Non renseigné'}
                </p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-500" />
              Informations Bancaires
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">RIB</label>
                <p className="text-white font-medium font-mono">{employee?.rib || 'Non renseigné'}</p>
              </div>
              <div className="mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <p className="text-sm text-blue-300">
                  Pour modifier vos informations personnelles, veuillez contacter les ressources humaines.
                </p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl p-6 border border-green-500/30">
            <h3 className="text-lg font-bold text-white mb-2">Total Gagné</h3>
            <p className="text-4xl font-bold text-green-400">${totalEarned.toFixed(2)}</p>
            <p className="text-sm text-green-200 mt-2">Depuis votre embauche</p>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-2xl p-6 border border-orange-500/30">
            <h3 className="text-lg font-bold text-white mb-2">Commissions Totales</h3>
            <p className="text-4xl font-bold text-orange-400">${totalCommissions.toFixed(2)}</p>
            <p className="text-sm text-orange-200 mt-2">Sur toutes vos ventes</p>
          </div>
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="space-y-4">
          {payrollRecords.length === 0 ? (
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-12 border border-white/10 text-center">
              <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Aucun historique de paie disponible</p>
            </div>
          ) : (
            payrollRecords.map(record => (
              <div key={record.id} className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {new Date(record.period_start).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Du {new Date(record.period_start).toLocaleDateString('fr-FR')} au {new Date(record.period_end).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-400">${record.total_amount.toFixed(2)}</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                      record.paid ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {record.paid ? 'Payé' : 'En attente'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-400">Heures</label>
                    <p className="text-white font-medium">{record.work_hours.toFixed(2)}h</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Base</label>
                    <p className="text-white font-medium">${record.base_salary.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Commissions</label>
                    <p className="text-green-400 font-medium">+${record.commissions.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Bonus</label>
                    <p className="text-blue-400 font-medium">+${record.bonuses.toFixed(2)}</p>
                  </div>
                </div>

                {record.deductions > 0 && (
                  <div className="mb-4">
                    <label className="text-xs text-gray-400">Déductions</label>
                    <p className="text-red-400 font-medium">-${record.deductions.toFixed(2)}</p>
                  </div>
                )}

                {record.notes && (
                  <div className="mb-4 p-3 bg-white/5 rounded-lg">
                    <label className="text-xs text-gray-400">Notes</label>
                    <p className="text-white text-sm">{record.notes}</p>
                  </div>
                )}

                <button
                  onClick={() => downloadPayslip(record)}
                  className="w-full bg-orange-500/20 text-orange-400 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-orange-500/30 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Télécharger le bulletin
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'commissions' && (
        <div className="space-y-6">
          <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-2xl p-6 border border-orange-500/30">
            <h3 className="text-lg font-bold text-white mb-2">Total Commissions</h3>
            <p className="text-4xl font-bold text-orange-400">${totalCommissions.toFixed(2)}</p>
            <p className="text-sm text-orange-200 mt-2">{sales.length} ventes avec commission</p>
          </div>

          <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Détail par Vente</h3>
            {sales.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Aucune commission enregistrée</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Date</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Facture</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-semibold text-sm">Montant Vente</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-semibold text-sm">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map(sale => (
                      <tr key={sale.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 text-white text-sm">
                          {new Date(sale.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-sm font-mono">{sale.invoice_number}</td>
                        <td className="py-3 px-4 text-white text-sm text-right">${sale.total.toFixed(2)}</td>
                        <td className="py-3 px-4 text-green-400 font-bold text-sm text-right">
                          ${(sale.commission_amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="max-w-md">
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-500" />
              Changer le Mot de Passe
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Mot de passe actuel</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                  placeholder="••••••••"
                />
              </div>
              <button
                onClick={changePassword}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Changer le Mot de Passe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
