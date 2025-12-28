import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, ShoppingCart, Users, Package, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../../lib/supabase';

export function Dashboard() {
  const [stats, setStats] = useState({
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    lowStockItems: 0,
    pendingProduction: 0
  });
  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [
      todaySalesRes,
      weekSalesRes,
      monthSalesRes,
      employeesRes,
      activeSessionsRes,
      rawStockRes,
      readyStockRes,
      productionRes,
      last7DaysRes,
      topProductsRes
    ] = await Promise.all([
      supabase.from('sales').select('total').gte('created_at', today.toISOString()),
      supabase.from('sales').select('total').gte('created_at', weekAgo.toISOString()),
      supabase.from('sales').select('total').gte('created_at', monthAgo.toISOString()),
      supabase.from('employees').select('id').eq('is_active', true),
      supabase.from('work_sessions').select('id').is('clock_out', null),
      supabase.from('raw_ingredients').select('*').lte('quantity', 50),
      supabase.from('ready_stock').select('*').lte('quantity', 10),
      supabase.from('production_orders').select('id').eq('status', 'pending'),
      supabase.from('sales').select('total, created_at').gte('created_at', weekAgo.toISOString()),
      supabase.from('sale_items')
        .select('quantity, products(name)')
        .gte('created_at', monthAgo.toISOString())
    ]);

    setStats({
      todaySales: todaySalesRes.data?.reduce((sum, s) => sum + s.total, 0) || 0,
      weekSales: weekSalesRes.data?.reduce((sum, s) => sum + s.total, 0) || 0,
      monthSales: monthSalesRes.data?.reduce((sum, s) => sum + s.total, 0) || 0,
      totalEmployees: employeesRes.data?.length || 0,
      activeEmployees: activeSessionsRes.data?.length || 0,
      lowStockItems: (rawStockRes.data?.length || 0) + (readyStockRes.data?.length || 0),
      pendingProduction: productionRes.data?.length || 0
    });

    const salesByDay: { [key: string]: number } = {};
    last7DaysRes.data?.forEach(sale => {
      const date = new Date(sale.created_at).toLocaleDateString('fr-FR', { weekday: 'short' });
      salesByDay[date] = (salesByDay[date] || 0) + sale.total;
    });

    setSalesData(
      Object.entries(salesByDay).map(([day, total]) => ({ day, total }))
    );

    const productCounts: { [key: string]: number } = {};
    topProductsRes.data?.forEach((item: any) => {
      const name = item.products?.name || 'Inconnu';
      productCounts[name] = (productCounts[name] || 0) + item.quantity;
    });

    setTopProducts(
      Object.entries(productCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
    );
  };

  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="h-full overflow-y-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl p-6 border border-green-500/30">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-green-400" />
            <h3 className="text-sm font-medium text-green-200">Ventes Aujourd'hui</h3>
          </div>
          <p className="text-3xl font-bold text-white">${stats.todaySales.toFixed(2)}</p>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            <h3 className="text-sm font-medium text-blue-200">Ventes 7 Jours</h3>
          </div>
          <p className="text-3xl font-bold text-white">${stats.weekSales.toFixed(2)}</p>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="w-6 h-6 text-purple-400" />
            <h3 className="text-sm font-medium text-purple-200">Ventes 30 Jours</h3>
          </div>
          <p className="text-3xl font-bold text-white">${stats.monthSales.toFixed(2)}</p>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-2xl p-6 border border-orange-500/30">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-orange-400" />
            <h3 className="text-sm font-medium text-orange-200">Employés Actifs</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.activeEmployees} / {stats.totalEmployees}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="backdrop-blur-xl bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl p-6 border border-red-500/30">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-sm font-medium text-red-200">Alertes Stock Faible</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.lowStockItems}</p>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-2xl p-6 border border-yellow-500/30">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-6 h-6 text-yellow-400" />
            <h3 className="text-sm font-medium text-yellow-200">Production en Attente</h3>
          </div>
          <p className="text-3xl font-bold text-white">{stats.pendingProduction}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4">Ventes (7 derniers jours)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4">Top 5 Produits (30 jours)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topProducts}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {topProducts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
