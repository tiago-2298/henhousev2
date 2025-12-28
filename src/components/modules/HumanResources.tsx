import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, DollarSign, Clock, TrendingUp, Shield } from 'lucide-react';
import { supabase, Employee, GradeSalaryConfig } from '../../lib/supabase';
import { useToast } from '../Toast';

const GRADE_OPTIONS = [
  { value: 'Employé Polyvalent', label: 'Employé Polyvalent', rate: 80, type: 'margin', desc: '80% de la marge' },
  { value: 'Chef d\'équipe', label: 'Chef d\'équipe', rate: 83, type: 'margin', desc: '83% de la marge' },
  { value: 'Manager', label: 'Manager', rate: 40, type: 'revenue', desc: '40% du CA' },
  { value: 'CoPDG', label: 'CoPDG', rate: 50, type: 'revenue', desc: '50% du CA' },
  { value: 'PDG', label: 'PDG', rate: 50, type: 'revenue', desc: '50% du CA' },
];

export function HumanResources() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryConfigs, setSalaryConfigs] = useState<GradeSalaryConfig[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeForm, setEmployeeForm] = useState({
    first_name: '',
    last_name: '',
    personal_id: '',
    grade: 'Employé Polyvalent',
    hourly_rate: 0,
    username: '',
    password: ''
  });
  const [stats, setStats] = useState({
    totalPayroll: 0,
    avgHourlyRate: 0,
    totalHoursWorked: 0
  });
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [employeesRes, salaryConfigsRes] = await Promise.all([
      supabase.from('employees').select('*').order('first_name'),
      supabase.from('grade_salary_config').select('*')
    ]);

    setEmployees(employeesRes.data || []);
    setSalaryConfigs(salaryConfigsRes.data || []);

    if (employeesRes.data && employeesRes.data.length > 0) {
      const employeeIds = employeesRes.data.map(e => e.id);
      const { data: sessionsData } = await supabase
        .from('work_sessions')
        .select('total_earned, hours_worked')
        .in('employee_id', employeeIds)
        .not('clock_out', 'is', null);

      const totalPayroll = sessionsData?.reduce((sum, s) => sum + (s.total_earned || 0), 0) || 0;
      const totalHours = sessionsData?.reduce((sum, s) => sum + (s.hours_worked || 0), 0) || 0;
      const avgRate = employeesRes.data.reduce((sum, e) => sum + e.hourly_rate, 0) / employeesRes.data.length;

      setStats({
        totalPayroll,
        avgHourlyRate: avgRate,
        totalHoursWorked: totalHours
      });
    }
  };

  const getHourlyRateForGrade = (grade: string): number => {
    const config = salaryConfigs.find(c => c.grade === grade);
    return config?.hourly_rate || 0;
  };

  const handleGradeChange = (grade: string) => {
    const hourlyRate = getHourlyRateForGrade(grade);
    setEmployeeForm({ ...employeeForm, grade, hourly_rate: hourlyRate });
  };

  const getCommissionRate = (grade: string) => {
    const gradeInfo = GRADE_OPTIONS.find(g => g.value === grade);
    return gradeInfo?.rate || 0;
  };

  const addEmployee = async () => {
    if (!employeeForm.first_name || !employeeForm.last_name || !employeeForm.personal_id || !employeeForm.username || !employeeForm.password) {
      showToast('Remplissez tous les champs requis', 'error');
      return;
    }

    try {
      const commissionRate = getCommissionRate(employeeForm.grade);

      await supabase.from('employees').insert({
        first_name: employeeForm.first_name,
        last_name: employeeForm.last_name,
        personal_id: employeeForm.personal_id,
        grade: employeeForm.grade,
        hourly_rate: employeeForm.hourly_rate,
        commission_rate: commissionRate,
        username: employeeForm.username,
        password: employeeForm.password,
        is_active: true,
        rib: '',
        phone: '',
        hire_date: new Date().toISOString().split('T')[0]
      });

      showToast('Employé et login créés avec succès', 'success');
      setShowAddModal(false);
      setEmployeeForm({ first_name: '', last_name: '', personal_id: '', grade: 'Employé Polyvalent', hourly_rate: 15, username: '', password: '' });
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const updateEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      const commissionRate = getCommissionRate(employeeForm.grade);

      await supabase
        .from('employees')
        .update({
          first_name: employeeForm.first_name,
          last_name: employeeForm.last_name,
          personal_id: employeeForm.personal_id,
          grade: employeeForm.grade,
          hourly_rate: employeeForm.hourly_rate,
          commission_rate: commissionRate
        })
        .eq('id', selectedEmployee.id);

      showToast('Employé mis à jour', 'success');
      setShowEditModal(false);
      setSelectedEmployee(null);
      setEmployeeForm({ first_name: '', last_name: '', personal_id: '', grade: 'Employé Polyvalent', hourly_rate: 15, username: '', password: '' });
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const toggleEmployeeStatus = async (employee: Employee) => {
    try {
      await supabase
        .from('employees')
        .update({ is_active: !employee.is_active })
        .eq('id', employee.id);

      showToast(`Employé ${!employee.is_active ? 'activé' : 'désactivé'}`, 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erreur', 'error');
    }
  };

  const openAddModal = () => {
    const defaultGrade = 'Employé Polyvalent';
    const hourlyRate = getHourlyRateForGrade(defaultGrade);
    setEmployeeForm({
      first_name: '',
      last_name: '',
      personal_id: '',
      grade: defaultGrade,
      hourly_rate: hourlyRate,
      username: '',
      password: ''
    });
    setShowAddModal(true);
  };

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeForm({
      first_name: employee.first_name,
      last_name: employee.last_name,
      personal_id: employee.personal_id || '',
      grade: employee.grade,
      hourly_rate: employee.hourly_rate,
      username: employee.username,
      password: ''
    });
    setShowEditModal(true);
  };

  const getGradeInfo = (grade: string) => {
    return GRADE_OPTIONS.find(g => g.value === grade);
  };

  return (
    <div className="h-full overflow-y-auto">
      {ToastComponent}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-medium text-blue-200">Employés Actifs</h3>
          </div>
          <p className="text-3xl font-bold text-white">
            {employees.filter(e => e.is_active).length} / {employees.length}
          </p>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl p-6 border border-green-500/30">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-medium text-green-200">Masse Salariale Totale</h3>
          </div>
          <p className="text-3xl font-bold text-white">${stats.totalPayroll.toFixed(2)}</p>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-medium text-purple-200">Taux Horaire Moyen</h3>
          </div>
          <p className="text-3xl font-bold text-white">${stats.avgHourlyRate.toFixed(2)}/h</p>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Employés</h2>
          <button
            onClick={openAddModal}
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-orange-500/50 transition-all"
          >
            <Plus className="w-5 h-5" />
            Ajouter Employé
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(employee => {
            const gradeInfo = getGradeInfo(employee.grade);
            return (
              <div
                key={employee.id}
                className={`bg-white/5 rounded-xl p-4 border ${employee.is_active ? 'border-white/10' : 'border-red-500/30'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg">
                      {employee.first_name} {employee.last_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Shield className="w-3 h-3 text-orange-400" />
                      <span className="text-sm text-gray-400">{employee.grade}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">ID: {employee.personal_id || 'N/A'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${employee.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {employee.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Taux horaire:</span>
                    <span className="text-sm text-orange-500 font-bold">${employee.hourly_rate}/h</span>
                  </div>
                  {gradeInfo && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Commission:</span>
                      <span className="text-sm text-green-400 font-bold">{gradeInfo.desc}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(employee)}
                    className="flex-1 bg-blue-500/20 text-blue-400 py-2 rounded-lg text-sm font-semibold hover:bg-blue-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Modifier
                  </button>
                  <button
                    onClick={() => toggleEmployeeStatus(employee)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                      employee.is_active
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    }`}
                  >
                    {employee.is_active ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Ajouter un Employé</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Prénom *</label>
                <input
                  type="text"
                  value={employeeForm.first_name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, first_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nom *</label>
                <input
                  type="text"
                  value={employeeForm.last_name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, last_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">ID Personnel *</label>
                <input
                  type="text"
                  value={employeeForm.personal_id}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, personal_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Grade *</label>
                <select
                  value={employeeForm.grade}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                >
                  {GRADE_OPTIONS.map(grade => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label} ({grade.desc})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Taux Horaire (défini par la config salaire)</label>
                <input
                  type="number"
                  value={employeeForm.hourly_rate}
                  readOnly
                  className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-xl text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Modifiable uniquement via Paramètres → Salaires</p>
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-sm text-gray-400 mb-3">Création du login</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Nom d'utilisateur *</label>
                    <input
                      type="text"
                      value={employeeForm.username}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, username: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Mot de passe *</label>
                    <input
                      type="password"
                      value={employeeForm.password}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEmployeeForm({ first_name: '', last_name: '', personal_id: '', grade: 'Employé Polyvalent', hourly_rate: 15, username: '', password: '' });
                }}
                className="flex-1 bg-white/5 text-white py-2 rounded-xl font-semibold"
              >
                Annuler
              </button>
              <button onClick={addEmployee} className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-semibold">
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Modifier l'Employé</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Prénom</label>
                <input
                  type="text"
                  value={employeeForm.first_name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, first_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nom</label>
                <input
                  type="text"
                  value={employeeForm.last_name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, last_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">ID Personnel</label>
                <input
                  type="text"
                  value={employeeForm.personal_id}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, personal_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Grade</label>
                <select
                  value={employeeForm.grade}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                >
                  {GRADE_OPTIONS.map(grade => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label} ({grade.desc})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Taux Horaire (défini par la config salaire)</label>
                <input
                  type="number"
                  value={employeeForm.hourly_rate}
                  readOnly
                  className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-xl text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Modifiable uniquement via Paramètres → Salaires</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEmployee(null);
                  setEmployeeForm({ first_name: '', last_name: '', personal_id: '', grade: 'Employé Polyvalent', hourly_rate: 15, username: '', password: '' });
                }}
                className="flex-1 bg-white/5 text-white py-2 rounded-xl font-semibold"
              >
                Annuler
              </button>
              <button onClick={updateEmployee} className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-semibold">
                Mettre à jour
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
