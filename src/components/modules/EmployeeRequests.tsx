import React, { useState, useEffect } from 'react';
import { FileText, Plus, X, Calendar, DollarSign, Clock, MessageSquare, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast';

interface Request {
  id: string;
  request_type: string;
  title: string;
  description: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  amount: number | null;
  reviewed_by: string | null;
  review_message: string | null;
  reviewed_at: string | null;
  created_at: string;
  reviewer?: {
    first_name: string;
    last_name: string;
  };
}

export function EmployeeRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    request_type: 'leave' as 'leave' | 'advance' | 'schedule_change' | 'other',
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    amount: 0
  });
  const { employee } = useAuth();
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    loadData();
  }, [employee]);

  const loadData = async () => {
    if (!employee) return;

    const { data } = await supabase
      .from('employee_requests')
      .select(`
        *,
        reviewer:reviewed_by(first_name, last_name)
      `)
      .eq('employee_id', employee.id)
      .order('created_at', { ascending: false });

    setRequests(data || []);
  };

  const createRequest = async () => {
    if (!requestForm.title || !requestForm.description) {
      showToast('Remplissez tous les champs obligatoires', 'error');
      return;
    }

    if (requestForm.request_type === 'leave' && (!requestForm.start_date || !requestForm.end_date)) {
      showToast('Dates de début et fin requises pour les congés', 'error');
      return;
    }

    if (requestForm.request_type === 'advance' && requestForm.amount <= 0) {
      showToast('Montant requis pour les avances', 'error');
      return;
    }

    try {
      const { error } = await supabase.from('employee_requests').insert({
        employee_id: employee!.id,
        request_type: requestForm.request_type,
        title: requestForm.title,
        description: requestForm.description,
        start_date: requestForm.start_date || null,
        end_date: requestForm.end_date || null,
        amount: requestForm.request_type === 'advance' ? requestForm.amount : null
      });

      if (error) throw error;

      await supabase.from('notifications').insert({
        employee_id: employee!.id,
        title: 'Demande créée',
        message: `Votre demande "${requestForm.title}" a été soumise et est en attente d'approbation.`,
        type: 'info'
      });

      showToast('Demande créée avec succès', 'success');
      setShowAddModal(false);
      setRequestForm({
        request_type: 'leave',
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        amount: 0
      });
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const getRequestTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      leave: 'Congé',
      advance: 'Avance sur Salaire',
      schedule_change: 'Changement d\'Horaire',
      other: 'Autre'
    };
    return labels[type] || type;
  };

  const getRequestTypeIcon = (type: string) => {
    const icons: { [key: string]: any } = {
      leave: Calendar,
      advance: DollarSign,
      schedule_change: Clock,
      other: FileText
    };
    return icons[type] || FileText;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'approved') return CheckCircle;
    if (status === 'rejected') return XCircle;
    return AlertCircle;
  };

  const getStatusColor = (status: string) => {
    if (status === 'approved') return 'green';
    if (status === 'rejected') return 'red';
    return 'yellow';
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <div className="h-full overflow-y-auto">
      {ToastComponent}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Mes Demandes</h1>
        <p className="text-gray-400">Créez et suivez vos demandes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-2xl p-6 border border-yellow-500/30">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-6 h-6 text-yellow-400" />
            <h3 className="text-sm font-medium text-yellow-200">En Attente</h3>
          </div>
          <p className="text-3xl font-bold text-white">{pendingCount}</p>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl p-6 border border-green-500/30">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h3 className="text-sm font-medium text-green-200">Approuvées</h3>
          </div>
          <p className="text-3xl font-bold text-white">{approvedCount}</p>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl p-6 border border-red-500/30">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-6 h-6 text-red-400" />
            <h3 className="text-sm font-medium text-red-200">Refusées</h3>
          </div>
          <p className="text-3xl font-bold text-white">{rejectedCount}</p>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Demande
        </button>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-12 border border-white/10 text-center">
            <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Aucune demande créée</p>
          </div>
        ) : (
          requests.map(request => {
            const TypeIcon = getRequestTypeIcon(request.request_type);
            const StatusIcon = getStatusIcon(request.status);
            const statusColor = getStatusColor(request.status);

            return (
              <div key={request.id} className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-orange-500/20 rounded-xl">
                      <TypeIcon className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{request.title}</h3>
                      <p className="text-sm text-gray-400">{getRequestTypeLabel(request.request_type)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-${statusColor}-500/20 text-${statusColor}-400`}>
                      <StatusIcon className="w-4 h-4" />
                      {request.status === 'pending' ? 'En attente' :
                       request.status === 'approved' ? 'Approuvée' : 'Refusée'}
                    </span>
                    <p className="text-xs text-gray-500">
                      {new Date(request.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-300">{request.description}</p>
                </div>

                {request.request_type === 'leave' && request.start_date && request.end_date && (
                  <div className="mb-4 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Du {new Date(request.start_date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Au {new Date(request.end_date).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                )}

                {request.request_type === 'advance' && request.amount && (
                  <div className="mb-4">
                    <p className="text-2xl font-bold text-green-400">${request.amount.toFixed(2)}</p>
                  </div>
                )}

                {request.status !== 'pending' && request.reviewer && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-start gap-3">
                      <MessageSquare className={`w-5 h-5 text-${statusColor}-400 flex-shrink-0 mt-1`} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-400 mb-1">
                          Réponse de {request.reviewer.first_name} {request.reviewer.last_name}
                          {request.reviewed_at && ` le ${new Date(request.reviewed_at).toLocaleDateString('fr-FR')}`}
                        </p>
                        {request.review_message && (
                          <p className="text-white">{request.review_message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Nouvelle Demande</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Type de Demande *</label>
                <select
                  value={requestForm.request_type}
                  onChange={(e) => setRequestForm({ ...requestForm, request_type: e.target.value as any })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                >
                  <option value="leave">Congé</option>
                  <option value="advance">Avance sur Salaire</option>
                  <option value="schedule_change">Changement d'Horaire</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Titre *</label>
                <input
                  type="text"
                  value={requestForm.title}
                  onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                  placeholder="Ex: Congé pour raisons familiales"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Description *</label>
                <textarea
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white resize-none"
                  placeholder="Décrivez votre demande en détail..."
                />
              </div>

              {requestForm.request_type === 'leave' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Date de Début *</label>
                    <input
                      type="date"
                      value={requestForm.start_date}
                      onChange={(e) => setRequestForm({ ...requestForm, start_date: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Date de Fin *</label>
                    <input
                      type="date"
                      value={requestForm.end_date}
                      onChange={(e) => setRequestForm({ ...requestForm, end_date: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                    />
                  </div>
                </div>
              )}

              {requestForm.request_type === 'advance' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Montant Demandé ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={requestForm.amount}
                    onChange={(e) => setRequestForm({ ...requestForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                    placeholder="0.00"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-white/5 text-white py-3 rounded-xl font-semibold hover:bg-white/10 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={createRequest}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Créer la Demande
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
