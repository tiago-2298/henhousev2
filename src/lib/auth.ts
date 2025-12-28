import { Employee } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function login(username: string, password: string): Promise<Employee | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      return null;
    }

    const { employee } = await response.json();
    return employee as Employee;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

export async function getCurrentEmployee(employeeId: string): Promise<Employee | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-user?employee_id=${employeeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const { employee } = await response.json();
    return employee as Employee;
  } catch (error) {
    console.error('Get employee error:', error);
    return null;
  }
}
