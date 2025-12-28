import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee } from '../lib/supabase';
import { login as authLogin, getCurrentEmployee } from '../lib/auth';

interface AuthContextType {
  employee: Employee | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const employeeId = localStorage.getItem('henhouse_employee_id');
    if (employeeId) {
      getCurrentEmployee(employeeId).then((employeeData) => {
        setEmployee(employeeData);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const employeeData = await authLogin(username, password);
    if (employeeData) {
      setEmployee(employeeData);
      localStorage.setItem('henhouse_employee_id', employeeData.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setEmployee(null);
    localStorage.removeItem('henhouse_employee_id');
  };

  return (
    <AuthContext.Provider value={{ employee, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
