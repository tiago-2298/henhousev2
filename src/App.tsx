import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Dashboard } from './components/modules/Dashboard';
import { PointOfSale } from './components/modules/PointOfSale';
import { StockManagement } from './components/modules/StockManagement';
import { Production } from './components/modules/Production';
import { Garage } from './components/modules/Garage';
import { ExpensesLosses } from './components/modules/ExpensesLosses';
import { HumanResources } from './components/modules/HumanResources';
import { Settings as SettingsModule } from './components/modules/Settings';
import { EmployeeProfile } from './components/modules/EmployeeProfile';
import { EmployeePerformance } from './components/modules/EmployeePerformance';
import { EmployeeRequests } from './components/modules/EmployeeRequests';
import { NotificationsCenter } from './components/modules/NotificationsCenter';
import { MenuManagement } from './components/modules/MenuManagement';
import { PartnerSales } from './components/modules/PartnerSales';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Car,
  DollarSign,
  Settings,
  LogOut,
  ChevronRight,
  Factory,
  User,
  Target,
  FileText,
  Bell,
  UtensilsCrossed,
  HandshakeIcon
} from 'lucide-react';

type Screen = 'dashboard' | 'pos' | 'stocks' | 'production' | 'garage' | 'expenses' | 'hr' | 'settings' | 'profile' | 'performance' | 'requests' | 'notifications' | 'menus' | 'partner_sales';

function AppContent() {
  const { employee, logout } = useAuth();
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');

  if (!employee) {
    return <Login />;
  }

  const menuItems = [
    { id: 'dashboard' as Screen, label: 'Dashboard', icon: LayoutDashboard, roles: ['PDG', 'CoPDG', 'Manager', 'Chef d\'équipe', 'Employé Polyvalent'] },
    { id: 'pos' as Screen, label: 'Caisse', icon: ShoppingCart, roles: ['PDG', 'CoPDG', 'Manager', 'Chef d\'équipe', 'Employé Polyvalent'] },
    { id: 'partner_sales' as Screen, label: 'Ventes Partenaires', icon: HandshakeIcon, roles: ['PDG', 'CoPDG', 'Manager', 'Chef d\'équipe', 'Employé Polyvalent'] },
    { id: 'stocks' as Screen, label: 'Stocks', icon: Package, roles: ['PDG', 'CoPDG', 'Manager', 'Chef d\'équipe', 'Employé Polyvalent'] },
    { id: 'production' as Screen, label: 'Production', icon: Factory, roles: ['PDG', 'CoPDG', 'Manager', 'Chef d\'équipe', 'Employé Polyvalent'] },
    { id: 'menus' as Screen, label: 'Menus', icon: UtensilsCrossed, roles: ['PDG', 'CoPDG'] },
    { id: 'garage' as Screen, label: 'Garage', icon: Car, roles: ['PDG', 'CoPDG', 'Manager', 'Chef d\'équipe', 'Employé Polyvalent'] },
    { id: 'expenses' as Screen, label: 'Dépenses', icon: DollarSign, roles: ['PDG', 'CoPDG', 'Manager', 'Chef d\'équipe', 'Employé Polyvalent'] },
    { id: 'hr' as Screen, label: 'RH', icon: Users, roles: ['PDG', 'CoPDG', 'Manager'] },
    { id: 'settings' as Screen, label: 'Paramètres', icon: Settings, roles: ['PDG', 'CoPDG'] },
    { id: 'profile' as Screen, label: 'Mon Profil', icon: User, roles: ['PDG', 'CoPDG', 'Manager', 'Chef d\'équipe', 'Employé Polyvalent'] },
    { id: 'performance' as Screen, label: 'Ma Performance', icon: Target, roles: ['PDG', 'CoPDG', 'Manager', 'Chef d\'équipe', 'Employé Polyvalent'] },
    { id: 'requests' as Screen, label: 'Mes Demandes', icon: FileText, roles: ['PDG', 'CoPDG', 'Manager', 'Chef d\'équipe', 'Employé Polyvalent'] },
    { id: 'notifications' as Screen, label: 'Notifications', icon: Bell, roles: ['PDG', 'CoPDG', 'Manager', 'Chef d\'équipe', 'Employé Polyvalent'] },
  ].filter(item => item.roles.includes(employee.grade));

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <PointOfSale />;
      case 'partner_sales':
        return <PartnerSales />;
      case 'stocks':
        return <StockManagement />;
      case 'production':
        return <Production />;
      case 'menus':
        return <MenuManagement />;
      case 'garage':
        return <Garage />;
      case 'expenses':
        return <ExpensesLosses />;
      case 'hr':
        return <HumanResources />;
      case 'settings':
        return <SettingsModule />;
      case 'profile':
        return <EmployeeProfile />;
      case 'performance':
        return <EmployeePerformance />;
      case 'requests':
        return <EmployeeRequests />;
      case 'notifications':
        return <NotificationsCenter />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex">
      <div className="w-64 backdrop-blur-xl bg-white/5 border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold text-white mb-1">Hen House</h1>
          <p className="text-sm text-gray-400">ERP Ultimate</p>
        </div>

        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-5 h-5" />}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-400 mb-1">Connecté en tant que</p>
            <p className="text-white font-semibold">{employee.first_name} {employee.last_name}</p>
            <p className="text-xs text-gray-400">{employee.grade}</p>
            <p className="text-xs text-orange-400 mt-1">Taux: ${employee.hourly_rate}/h</p>
          </div>
          <button
            onClick={logout}
            className="w-full bg-white/5 hover:bg-white/10 text-white py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {renderScreen()}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
