import React, { useState, useEffect } from 'react';
import { Target, Award, TrendingUp, Users, Star, Trophy, Clock, DollarSign } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Objective {
  id: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  period_start: string;
  period_end: string;
  status: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
}

interface EmployeeRanking {
  employee_id: string;
  first_name: string;
  last_name: string;
  total_sales: number;
  sales_count: number;
}

export function EmployeePerformance() {
  const [activeTab, setActiveTab] = useState<'objectives' | 'achievements' | 'rankings' | 'evolution'>('objectives');
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [availableAchievements, setAvailableAchievements] = useState<any[]>([]);
  const [rankings, setRankings] = useState<EmployeeRanking[]>([]);
  const [salesEvolution, setSalesEvolution] = useState<any[]>([]);
  const { employee } = useAuth();

  useEffect(() => {
    loadData();
  }, [employee]);

  const loadData = async () => {
    if (!employee) return;

    const [objectivesRes, achievementsRes, allAchievementsRes, salesRes, allEmployeesRes] = await Promise.all([
      supabase
        .from('employee_objectives')
        .select('*')
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('employee_achievements')
        .select('*, achievements(*)')
        .eq('employee_id', employee.id)
        .order('earned_at', { ascending: false }),
      supabase
        .from('achievements')
        .select('*')
        .order('criteria_value'),
      supabase
        .from('sales')
        .select('total, created_at')
        .eq('employee_id', employee.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('is_active', true)
    ]);

    setObjectives(objectivesRes.data || []);
    setAchievements((achievementsRes.data || []).map((ea: any) => ({
      ...ea.achievements,
      earned_at: ea.earned_at
    })));
    setAvailableAchievements(allAchievementsRes.data || []);

    const salesByDay: { [key: string]: number } = {};
    (salesRes.data || []).forEach(sale => {
      const date = new Date(sale.created_at).toLocaleDateString('fr-FR');
      salesByDay[date] = (salesByDay[date] || 0) + sale.total;
    });

    setSalesEvolution(
      Object.entries(salesByDay).map(([date, total]) => ({ date, total }))
    );

    const employeeSalesData = await Promise.all(
      (allEmployeesRes.data || []).map(async (emp) => {
        const { data: empSales } = await supabase
          .from('sales')
          .select('total')
          .eq('employee_id', emp.id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        return {
          employee_id: emp.id,
          first_name: emp.first_name,
          last_name: emp.last_name,
          total_sales: (empSales || []).reduce((sum, s) => sum + s.total, 0),
          sales_count: (empSales || []).length
        };
      })
    );

    setRankings(employeeSalesData.sort((a, b) => b.total_sales - a.total_sales));
  };

  const getProgressPercentage = (obj: Objective) => {
    return Math.min(100, (obj.current_value / obj.target_value) * 100);
  };

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      Trophy, Award, DollarSign, Clock, Star, TrendingUp
    };
    return icons[iconName] || Award;
  };

  const myRank = rankings.findIndex(r => r.employee_id === employee?.id) + 1;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Ma Performance</h1>
        <p className="text-gray-400">Suivez vos objectifs, achievements et classements</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'objectives' as const, label: 'Objectifs', icon: Target },
          { id: 'achievements' as const, label: 'Achievements', icon: Award },
          { id: 'rankings' as const, label: 'Classements', icon: Users },
          { id: 'evolution' as const, label: 'Évolution', icon: TrendingUp }
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

      {activeTab === 'objectives' && (
        <div className="space-y-4">
          {objectives.length === 0 ? (
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-12 border border-white/10 text-center">
              <Target className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Aucun objectif assigné pour le moment</p>
            </div>
          ) : (
            objectives.map(obj => {
              const progress = getProgressPercentage(obj);
              const isExpired = new Date(obj.period_end) < new Date();

              return (
                <div key={obj.id} className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{obj.title}</h3>
                      <p className="text-gray-400 text-sm">{obj.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      obj.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      obj.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      isExpired ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {obj.status === 'completed' ? 'Complété' :
                       obj.status === 'failed' ? 'Échoué' :
                       isExpired ? 'Expiré' : 'En cours'}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Progression</span>
                      <span className="text-white font-medium">
                        {obj.current_value.toFixed(0)} / {obj.target_value.toFixed(0)}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          progress >= 100 ? 'bg-green-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-right text-sm text-gray-400 mt-1">{progress.toFixed(0)}%</p>
                  </div>

                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Début: {new Date(obj.period_start).toLocaleDateString('fr-FR')}</span>
                    <span>Fin: {new Date(obj.period_end).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-2xl p-6 border border-yellow-500/30">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              Mes Achievements
            </h3>
            <p className="text-4xl font-bold text-yellow-400">{achievements.length}</p>
            <p className="text-sm text-yellow-200 mt-2">
              {achievements.length} / {availableAchievements.length} débloqués
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableAchievements.map(achievement => {
              const earned = achievements.find(a => a.id === achievement.id);
              const IconComponent = getIconComponent(achievement.icon);

              return (
                <div
                  key={achievement.id}
                  className={`backdrop-blur-xl rounded-2xl p-6 border transition-all ${
                    earned
                      ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500/30'
                      : 'bg-white/5 border-white/10 opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-3 rounded-xl ${
                      earned ? 'bg-yellow-500/20' : 'bg-white/5'
                    }`}>
                      <IconComponent className={`w-6 h-6 ${
                        earned ? 'text-yellow-400' : 'text-gray-500'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1">{achievement.name}</h3>
                      <p className="text-sm text-gray-400">{achievement.description}</p>
                    </div>
                  </div>
                  {earned && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-yellow-400">
                        Débloqué le {new Date(earned.earned_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  )}
                  {!earned && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-gray-500">
                        {achievement.criteria_type === 'sales_count' && `Objectif: ${achievement.criteria_value} ventes`}
                        {achievement.criteria_type === 'sales_amount' && `Objectif: $${achievement.criteria_value}`}
                        {achievement.criteria_type === 'work_hours' && `Objectif: ${achievement.criteria_value}h`}
                        {achievement.criteria_type === 'perfect_month' && 'Objectif: 1 mois parfait'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'rankings' && (
        <div className="space-y-6">
          <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl p-6 border border-blue-500/30">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-blue-400" />
              Mon Classement
            </h3>
            <p className="text-4xl font-bold text-blue-400">#{myRank}</p>
            <p className="text-sm text-blue-200 mt-2">Sur {rankings.length} employés actifs</p>
          </div>

          <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Classement des Ventes (30 derniers jours)</h3>
            <div className="space-y-3">
              {rankings.map((rank, index) => {
                const isMe = rank.employee_id === employee?.id;

                return (
                  <div
                    key={rank.employee_id}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      isMe
                        ? 'bg-orange-500/20 border border-orange-500/30'
                        : 'bg-white/5'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      index === 1 ? 'bg-gray-400/20 text-gray-400' :
                      index === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-white/10 text-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${isMe ? 'text-orange-400' : 'text-white'}`}>
                        {rank.first_name} {rank.last_name}
                        {isMe && <span className="ml-2 text-xs">(Vous)</span>}
                      </p>
                      <p className="text-sm text-gray-400">{rank.sales_count} ventes</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-400">${rank.total_sales.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'evolution' && (
        <div className="space-y-6">
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Évolution des Ventes (30 derniers jours)</h3>
            {salesEvolution.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Aucune donnée de vente disponible</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={salesEvolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl p-6 border border-green-500/30">
              <h3 className="text-sm font-semibold text-green-200 mb-2">Total Ventes</h3>
              <p className="text-3xl font-bold text-green-400">
                ${salesEvolution.reduce((sum, s) => sum + s.total, 0).toFixed(2)}
              </p>
            </div>
            <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl p-6 border border-blue-500/30">
              <h3 className="text-sm font-semibold text-blue-200 mb-2">Moyenne Journalière</h3>
              <p className="text-3xl font-bold text-blue-400">
                ${salesEvolution.length > 0
                  ? (salesEvolution.reduce((sum, s) => sum + s.total, 0) / salesEvolution.length).toFixed(2)
                  : '0.00'}
              </p>
            </div>
            <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-2xl p-6 border border-orange-500/30">
              <h3 className="text-sm font-semibold text-orange-200 mb-2">Meilleure Journée</h3>
              <p className="text-3xl font-bold text-orange-400">
                ${salesEvolution.length > 0
                  ? Math.max(...salesEvolution.map(s => s.total)).toFixed(2)
                  : '0.00'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
