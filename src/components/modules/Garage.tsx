import React, { useState, useEffect } from 'react';
import { Car, Plus, Edit2, Trash2, Wrench, DollarSign, X, Shield } from 'lucide-react';
import { supabase, Vehicle, VehicleMaintenance } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast';

const GRADE_OPTIONS = ['PDG', 'CoPDG', 'Manager', 'Chef d\'équipe', 'Employé Polyvalent'];

export function Garage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenances, setMaintenances] = useState<VehicleMaintenance[]>([]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showEditVehicle, setShowEditVehicle] = useState(false);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState({
    name: '',
    model: '',
    plate_number: '',
    fuel_level: 100,
    condition: 'Excellent' as 'Excellent' | 'Bon' | 'Moyen' | 'Mauvais',
    allowed_grades: [] as string[]
  });
  const [maintenanceForm, setMaintenanceForm] = useState({
    vehicle_id: '',
    description: '',
    cost: 0
  });
  const { employee } = useAuth();
  const { showToast, ToastComponent } = useToast();

  const canEdit = employee?.grade === 'PDG' || employee?.grade === 'CoPDG' || employee?.grade === 'Manager';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [vehiclesRes, maintenancesRes] = await Promise.all([
      supabase.from('vehicles').select('*').order('name'),
      supabase.from('vehicle_maintenances').select('*, vehicles(*)').order('date', { ascending: false })
    ]);

    setVehicles(vehiclesRes.data || []);
    setMaintenances(maintenancesRes.data || []);
  };

  const canUseVehicle = (vehicle: Vehicle): boolean => {
    if (!vehicle.allowed_grades || vehicle.allowed_grades.length === 0) return true;
    return vehicle.allowed_grades.includes(employee!.grade);
  };

  const addVehicle = async () => {
    if (!canEdit) {
      showToast('Accès refusé', 'error');
      return;
    }

    if (!vehicleForm.name || !vehicleForm.model || !vehicleForm.plate_number) {
      showToast('Remplissez tous les champs', 'error');
      return;
    }

    try {
      await supabase.from('vehicles').insert({
        ...vehicleForm,
        is_available: true
      });
      showToast('Véhicule ajouté', 'success');
      setShowAddVehicle(false);
      setVehicleForm({ name: '', model: '', plate_number: '', fuel_level: 100, condition: 'Excellent', allowed_grades: [] });
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const updateVehicle = async () => {
    if (!canEdit) {
      showToast('Accès refusé', 'error');
      return;
    }

    if (!selectedVehicle) return;

    try {
      await supabase
        .from('vehicles')
        .update(vehicleForm)
        .eq('id', selectedVehicle.id);

      showToast('Véhicule mis à jour', 'success');
      setShowEditVehicle(false);
      setSelectedVehicle(null);
      setVehicleForm({ name: '', model: '', plate_number: '', fuel_level: 100, condition: 'Excellent', allowed_grades: [] });
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const deleteVehicle = async (vehicleId: string) => {
    if (!canEdit) {
      showToast('Accès refusé', 'error');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) return;

    try {
      await supabase.from('vehicles').delete().eq('id', vehicleId);
      showToast('Véhicule supprimé', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const openEditModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleForm({
      name: vehicle.name,
      model: vehicle.model,
      plate_number: vehicle.plate_number,
      fuel_level: vehicle.fuel_level,
      condition: vehicle.condition,
      allowed_grades: vehicle.allowed_grades || []
    });
    setShowEditVehicle(true);
  };

  const openPermissionsModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleForm({
      name: vehicle.name,
      model: vehicle.model,
      plate_number: vehicle.plate_number,
      fuel_level: vehicle.fuel_level,
      condition: vehicle.condition,
      allowed_grades: vehicle.allowed_grades || []
    });
    setShowPermissionsModal(true);
  };

  const toggleGradePermission = (grade: string) => {
    const grades = vehicleForm.allowed_grades;
    if (grades.includes(grade)) {
      setVehicleForm({ ...vehicleForm, allowed_grades: grades.filter(g => g !== grade) });
    } else {
      setVehicleForm({ ...vehicleForm, allowed_grades: [...grades, grade] });
    }
  };

  const updateVehiclePermissions = async () => {
    if (!selectedVehicle) return;

    try {
      await supabase
        .from('vehicles')
        .update({ allowed_grades: vehicleForm.allowed_grades })
        .eq('id', selectedVehicle.id);

      showToast('Permissions mises à jour', 'success');
      setShowPermissionsModal(false);
      setSelectedVehicle(null);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const addMaintenance = async () => {
    if (!canEdit) {
      showToast('Accès refusé', 'error');
      return;
    }

    if (!maintenanceForm.vehicle_id || !maintenanceForm.description) {
      showToast('Remplissez tous les champs', 'error');
      return;
    }

    try {
      await supabase.from('vehicle_maintenances').insert({
        ...maintenanceForm,
        performed_by: employee!.id,
        date: new Date().toISOString()
      });

      await supabase
        .from('vehicles')
        .update({ is_available: false })
        .eq('id', maintenanceForm.vehicle_id);

      showToast('Maintenance enregistrée', 'success');
      setShowAddMaintenance(false);
      setMaintenanceForm({ vehicle_id: '', description: '', cost: 0 });
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const toggleVehicleStatus = async (vehicleId: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('vehicles')
        .update({ is_available: !currentStatus })
        .eq('id', vehicleId);

      showToast(`Véhicule ${!currentStatus ? 'disponible' : 'indisponible'}`, 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const getStatusColor = (available: boolean) => {
    return available ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  };

  const totalMaintenanceCost = maintenances.reduce((sum, m) => sum + m.cost, 0);

  return (
    <div className="h-full overflow-y-auto">
      {ToastComponent}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-center gap-3 mb-2">
            <Car className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-medium text-blue-200">Total Véhicules</h3>
          </div>
          <p className="text-3xl font-bold text-white">{vehicles.length}</p>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl p-6 border border-green-500/30">
          <div className="flex items-center gap-3 mb-2">
            <Car className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-medium text-green-200">Disponibles</h3>
          </div>
          <p className="text-3xl font-bold text-white">{vehicles.filter(v => v.is_available).length}</p>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl p-6 border border-red-500/30">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-red-400" />
            <h3 className="text-sm font-medium text-red-200">Coût Maintenance</h3>
          </div>
          <p className="text-3xl font-bold text-white">${totalMaintenanceCost.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Véhicules</h2>
            {canEdit && (
              <button
                onClick={() => setShowAddVehicle(true)}
                className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-orange-500/50 transition-all"
              >
                <Plus className="w-5 h-5" />
                Ajouter
              </button>
            )}
          </div>

          <div className="space-y-3">
            {vehicles.map(vehicle => (
              <div key={vehicle.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <Car className="w-8 h-8 text-orange-500" />
                    <div>
                      <h3 className="font-semibold text-white">{vehicle.name}</h3>
                      <p className="text-sm text-gray-400">{vehicle.model}</p>
                      <p className="text-xs text-gray-500">{vehicle.plate_number}</p>
                      {vehicle.allowed_grades && vehicle.allowed_grades.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Shield className="w-3 h-3 text-blue-400" />
                          <span className="text-xs text-blue-400">Réservé</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(vehicle.is_available)}`}>
                      {vehicle.is_available ? 'Disponible' : 'Maintenance'}
                    </span>
                    {!canUseVehicle(vehicle) && (
                      <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 font-semibold">
                        Non autorisé
                      </span>
                    )}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(vehicle)}
                      className="flex-1 bg-blue-500/20 text-blue-400 py-2 rounded-lg text-xs font-semibold hover:bg-blue-500/30 transition-all flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Modifier
                    </button>
                    <button
                      onClick={() => openPermissionsModal(vehicle)}
                      className="bg-purple-500/20 text-purple-400 py-2 px-3 rounded-lg text-xs font-semibold hover:bg-purple-500/30 transition-all"
                      title="Gérer permissions"
                    >
                      <Shield className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        setMaintenanceForm({ ...maintenanceForm, vehicle_id: vehicle.id });
                        setShowAddMaintenance(true);
                      }}
                      className="flex-1 bg-yellow-500/20 text-yellow-400 py-2 rounded-lg text-xs font-semibold hover:bg-yellow-500/30 transition-all flex items-center justify-center gap-1"
                    >
                      <Wrench className="w-3 h-3" />
                      Maintenance
                    </button>
                    <button
                      onClick={() => deleteVehicle(vehicle.id)}
                      className="bg-red-500/20 text-red-400 py-2 px-3 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-4">Historique Maintenance</h2>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {maintenances.map(maintenance => (
              <div key={maintenance.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-start gap-3 mb-2">
                  <Wrench className="w-5 h-5 text-orange-500 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{maintenance.vehicles?.name}</h3>
                    <p className="text-sm text-gray-400">{maintenance.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(maintenance.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span className="text-red-400 font-bold">${maintenance.cost.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAddVehicle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Ajouter un Véhicule</h3>
              <button onClick={() => setShowAddVehicle(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Nom"
                value={vehicleForm.name}
                onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
              />
              <input
                type="text"
                placeholder="Modèle"
                value={vehicleForm.model}
                onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
              />
              <input
                type="text"
                placeholder="Plaque"
                value={vehicleForm.plate_number}
                onChange={(e) => setVehicleForm({ ...vehicleForm, plate_number: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddVehicle(false)} className="flex-1 bg-white/5 text-white py-2 rounded-xl font-semibold">
                Annuler
              </button>
              <button onClick={addVehicle} className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-semibold">
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditVehicle && selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Modifier le Véhicule</h3>
              <button onClick={() => setShowEditVehicle(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Nom"
                value={vehicleForm.name}
                onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
              />
              <input
                type="text"
                placeholder="Modèle"
                value={vehicleForm.model}
                onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
              />
              <input
                type="text"
                placeholder="Plaque"
                value={vehicleForm.plate_number}
                onChange={(e) => setVehicleForm({ ...vehicleForm, plate_number: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowEditVehicle(false)} className="flex-1 bg-white/5 text-white py-2 rounded-xl font-semibold">
                Annuler
              </button>
              <button onClick={updateVehicle} className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-semibold">
                Mettre à jour
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddMaintenance && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Enregistrer une Maintenance</h3>
              <button onClick={() => setShowAddMaintenance(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <select
                value={maintenanceForm.vehicle_id}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, vehicle_id: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
              >
                <option value="">Sélectionner véhicule...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} - {v.plate_number}</option>)}
              </select>
              <textarea
                placeholder="Description"
                value={maintenanceForm.description}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white resize-none"
                rows={3}
              />
              <input
                type="number"
                placeholder="Coût"
                value={maintenanceForm.cost}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddMaintenance(false)} className="flex-1 bg-white/5 text-white py-2 rounded-xl font-semibold">
                Annuler
              </button>
              <button onClick={addMaintenance} className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-semibold">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {showPermissionsModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Permissions Véhicule</h3>
              </div>
              <button onClick={() => setShowPermissionsModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4">{selectedVehicle.name} - {selectedVehicle.plate_number}</p>
            <p className="text-xs text-gray-500 mb-4">Laissez vide pour autoriser tous les grades</p>
            <div className="space-y-3 mb-6">
              {GRADE_OPTIONS.map(grade => (
                <label key={grade} className="flex items-center gap-3 cursor-pointer bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-all">
                  <input
                    type="checkbox"
                    checked={vehicleForm.allowed_grades.includes(grade)}
                    onChange={() => toggleGradePermission(grade)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-white font-medium">{grade}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPermissionsModal(false)} className="flex-1 bg-white/5 text-white py-2 rounded-xl font-semibold">
                Annuler
              </button>
              <button onClick={updateVehiclePermissions} className="flex-1 bg-purple-500 text-white py-2 rounded-xl font-semibold">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
