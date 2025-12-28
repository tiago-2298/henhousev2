import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Employee {
  id: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  personal_id: string;
  rib: string;
  phone: string;
  grade: 'PDG' | 'CoPDG' | 'Manager' | 'Chef d\'équipe' | 'Employé Polyvalent';
  hourly_rate: number;
  commission_rate: number;
  hire_date: string;
  is_active: boolean;
  created_at: string;
}

export interface WorkSession {
  id: string;
  employee_id: string;
  clock_in: string;
  clock_out?: string | null;
  hours_worked?: number | null;
  total_earned?: number | null;
  created_at: string;
}

export interface Timesheet {
  id: string;
  employee_id: string;
  check_in: string;
  check_out?: string;
  total_hours?: number;
  week_number: number;
  year: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  production_cost: number;
  margin: number;
  category: 'Plats' | 'Boissons' | 'Menus' | 'Desserts';
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export interface ProductionOrder {
  id: string;
  product_id: string;
  quantity_ordered: number;
  quantity_produced?: number | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_by: string;
  started_by?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  partner_id?: string | null;
  created_at: string;
  products?: Product;
  partners?: Partner;
}

export interface VehicleMaintenance {
  id: string;
  vehicle_id: string;
  description: string;
  cost: number;
  performed_by: string;
  date: string;
  created_at: string;
  vehicles?: Vehicle;
}

export interface StockAdjustment {
  id: string;
  item_type: 'product' | 'raw_material';
  item_id: string;
  quantity_change: number;
  reason: string;
  created_at: string;
}

export type RawMaterial = RawIngredient;

export interface RawIngredient {
  id: string;
  name: string;
  unit: 'kg' | 'L' | 'unités';
  quantity: number;
  cost_per_unit: number;
  min_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface ModulePermission {
  id: string;
  module_name: 'dashboard' | 'pos' | 'timesheet' | 'stocks' | 'production' | 'garage' | 'expenses' | 'hr' | 'settings';
  grade: 'PDG' | 'CoPDG' | 'Manager' | 'Chef d\'équipe' | 'Employé Polyvalent';
  can_view: boolean;
  can_edit: boolean;
  created_at: string;
}

export interface AdminActionLog {
  id: string;
  employee_id: string;
  action_type: 'create' | 'update' | 'delete' | 'settings_change' | 'permission_change' | 'logo_change';
  module_name: string;
  details: any;
  created_at: string;
}

export interface ReadyStock {
  id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  id: string;
  product_id: string;
  ingredient_id: string;
  quantity_needed: number;
  created_at: string;
}

export interface Sale {
  id: string;
  employee_id: string;
  invoice_number: string;
  total: number;
  payment_method: 'cash' | 'card' | 'banking';
  customer_type: 'B2C' | 'B2B';
  partner_id?: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface ProductionLog {
  id: string;
  employee_id: string;
  product_id: string;
  quantity_produced: number;
  created_at: string;
}

export interface Vehicle {
  id: string;
  name: string;
  model: string;
  plate_number: string;
  fuel_level: number;
  condition: 'Excellent' | 'Bon' | 'Moyen' | 'Mauvais';
  is_available: boolean;
  allowed_grades: string[];
  created_at: string;
}

export interface VehicleLog {
  id: string;
  vehicle_id: string;
  employee_id: string;
  action: 'Sortie' | 'Retour';
  fuel_level: number;
  condition: string;
  notes: string;
  created_at: string;
}

export interface Expense {
  id: string;
  employee_id: string;
  type: 'Essence' | 'Réparation' | 'Autre';
  amount: number;
  description: string;
  vehicle_id?: string;
  created_at: string;
}

export interface Loss {
  id: string;
  employee_id: string;
  item_type: 'Produit' | 'Ingrédient';
  item_id: string;
  quantity: number;
  reason: string;
  created_at: string;
}

export interface Partner {
  id: string;
  name: string;
  contact: string;
  special_menu: any;
  webhook_url: string;
  is_active: boolean;
  created_at: string;
}

export interface Settings {
  id: string;
  company_name: string;
  logo_url: string;
  updated_at: string;
}

export interface GradeSalaryConfig {
  id: string;
  grade: 'PDG' | 'CoPDG' | 'Manager' | 'Chef d\'équipe' | 'Employé Polyvalent';
  salary_type: 'fixed_hourly' | 'revenue_percentage' | 'margin_percentage';
  hourly_rate: number;
  percentage: number;
  calculation_basis: 'revenue' | 'margin';
  created_at: string;
  updated_at: string;
}

export interface EmployeeRequest {
  id: string;
  employee_id: string;
  request_type: 'leave' | 'advance' | 'schedule_change' | 'other';
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  start_date?: string | null;
  end_date?: string | null;
  amount?: number | null;
  reviewed_by?: string | null;
  review_message?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

export interface EmployeeObjective {
  id: string;
  employee_id: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  period_start: string;
  period_end: string;
  status: 'active' | 'completed' | 'failed';
  created_by: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria_type: 'sales_count' | 'sales_amount' | 'work_hours' | 'perfect_month';
  criteria_value: number;
  created_at: string;
}

export interface EmployeeAchievement {
  id: string;
  employee_id: string;
  achievement_id: string;
  earned_at: string;
}

export interface Notification {
  id: string;
  employee_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  link?: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  created_by: string;
  expires_at?: string | null;
  created_at: string;
}

export interface PayrollRecord {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  work_hours: number;
  base_salary: number;
  commissions: number;
  bonuses: number;
  deductions: number;
  total_amount: number;
  paid: boolean;
  paid_at?: string | null;
  notes?: string | null;
  created_by: string;
  created_at: string;
}

export interface PerformanceReview {
  id: string;
  employee_id: string;
  reviewer_id: string;
  period_start: string;
  period_end: string;
  rating: number;
  strengths: string;
  areas_for_improvement: string;
  goals: string;
  notes?: string | null;
  created_at: string;
}

export interface WorkSchedule {
  id: string;
  employee_id: string;
  date: string;
  shift_start: string;
  shift_end: string;
  notes?: string | null;
  created_by: string;
  created_at: string;
}

export interface PromotionRule {
  id: string;
  name: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  applies_to: 'all' | 'category' | 'product';
  target_id?: string | null;
  min_purchase: number;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string | null;
  monthly_budget: number;
  is_active: boolean;
  created_at: string;
}

export interface WebhookConfig {
  id: string;
  module_name: 'sales' | 'production' | 'maintenance' | 'expenses' | 'losses' | 'low_stock' | 'admin_actions' | 'employee_actions' | 'partner_sales' | 'partner_invoices' | 'timesheets' | 'payroll' | 'work_sessions' | 'announcements' | 'requests' | 'garage' | 'hr';
  webhook_url: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type DiscordWebhook = WebhookConfig;

export interface Menu {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  category: string;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  menu_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
}

export interface PartnerMenuPermission {
  id: string;
  partner_id: string;
  menu_id: string;
  partner_price: number;
  daily_limit: number;
  is_active: boolean;
  created_at: string;
}

export interface PartnerSale {
  id: string;
  partner_id: string;
  menu_id: string;
  employee_id: string;
  quantity: number;
  unit_price: number;
  total: number;
  sale_date: string;
  invoice_id?: string | null;
  created_at: string;
}

export interface PartnerInvoice {
  id: string;
  partner_id: string;
  invoice_number: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  paid_at?: string | null;
}
