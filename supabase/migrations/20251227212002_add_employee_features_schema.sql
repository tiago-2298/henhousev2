/*
  # Employee Features Schema

  1. New Tables
    - `employee_requests`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to employees)
      - `request_type` (text: 'leave', 'advance', 'schedule_change', 'other')
      - `title` (text)
      - `description` (text)
      - `status` (text: 'pending', 'approved', 'rejected')
      - `start_date` (timestamptz, nullable)
      - `end_date` (timestamptz, nullable)
      - `amount` (numeric, nullable for advance requests)
      - `reviewed_by` (uuid, nullable, foreign key to employees)
      - `review_message` (text, nullable)
      - `reviewed_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
    
    - `employee_objectives`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to employees)
      - `title` (text)
      - `description` (text)
      - `target_value` (numeric)
      - `current_value` (numeric, default 0)
      - `period_start` (timestamptz)
      - `period_end` (timestamptz)
      - `status` (text: 'active', 'completed', 'failed')
      - `created_by` (uuid, foreign key to employees)
      - `created_at` (timestamptz)
    
    - `achievements`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `icon` (text)
      - `criteria_type` (text: 'sales_count', 'sales_amount', 'work_hours', 'perfect_month')
      - `criteria_value` (numeric)
      - `created_at` (timestamptz)
    
    - `employee_achievements`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to employees)
      - `achievement_id` (uuid, foreign key to achievements)
      - `earned_at` (timestamptz)
    
    - `notifications`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to employees)
      - `title` (text)
      - `message` (text)
      - `type` (text: 'info', 'success', 'warning', 'error')
      - `is_read` (boolean, default false)
      - `link` (text, nullable)
      - `created_at` (timestamptz)
    
    - `announcements`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `priority` (text: 'low', 'medium', 'high')
      - `created_by` (uuid, foreign key to employees)
      - `expires_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
    
    - `payroll_records`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to employees)
      - `period_start` (date)
      - `period_end` (date)
      - `work_hours` (numeric)
      - `base_salary` (numeric)
      - `commissions` (numeric, default 0)
      - `bonuses` (numeric, default 0)
      - `deductions` (numeric, default 0)
      - `total_amount` (numeric)
      - `paid` (boolean, default false)
      - `paid_at` (timestamptz, nullable)
      - `notes` (text, nullable)
      - `created_by` (uuid, foreign key to employees)
      - `created_at` (timestamptz)
    
    - `performance_reviews`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to employees)
      - `reviewer_id` (uuid, foreign key to employees)
      - `period_start` (date)
      - `period_end` (date)
      - `rating` (numeric, 1-5)
      - `strengths` (text)
      - `areas_for_improvement` (text)
      - `goals` (text)
      - `notes` (text, nullable)
      - `created_at` (timestamptz)
    
    - `work_schedules`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to employees)
      - `date` (date)
      - `shift_start` (time)
      - `shift_end` (time)
      - `notes` (text, nullable)
      - `created_by` (uuid, foreign key to employees)
      - `created_at` (timestamptz)
    
    - `promotion_rules`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `discount_type` (text: 'percentage', 'fixed')
      - `discount_value` (numeric)
      - `applies_to` (text: 'all', 'category', 'product')
      - `target_id` (uuid, nullable)
      - `min_purchase` (numeric, default 0)
      - `start_date` (timestamptz, nullable)
      - `end_date` (timestamptz, nullable)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
    
    - `expense_categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, nullable)
      - `monthly_budget` (numeric, default 0)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create employee_requests table
CREATE TABLE IF NOT EXISTS employee_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('leave', 'advance', 'schedule_change', 'other')),
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  start_date timestamptz,
  end_date timestamptz,
  amount numeric,
  reviewed_by uuid REFERENCES employees(id),
  review_message text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employee_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users"
  ON employee_requests FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create employee_objectives table
CREATE TABLE IF NOT EXISTS employee_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  target_value numeric NOT NULL,
  current_value numeric DEFAULT 0,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  created_by uuid REFERENCES employees(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employee_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users"
  ON employee_objectives FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  criteria_type text NOT NULL CHECK (criteria_type IN ('sales_count', 'sales_amount', 'work_hours', 'perfect_month')),
  criteria_value numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users"
  ON achievements FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create employee_achievements table
CREATE TABLE IF NOT EXISTS employee_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) NOT NULL,
  achievement_id uuid REFERENCES achievements(id) NOT NULL,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, achievement_id)
);

ALTER TABLE employee_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users"
  ON employee_achievements FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read boolean DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users"
  ON notifications FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_by uuid REFERENCES employees(id) NOT NULL,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users"
  ON announcements FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create payroll_records table
CREATE TABLE IF NOT EXISTS payroll_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  work_hours numeric NOT NULL,
  base_salary numeric NOT NULL,
  commissions numeric DEFAULT 0,
  bonuses numeric DEFAULT 0,
  deductions numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  paid boolean DEFAULT false,
  paid_at timestamptz,
  notes text,
  created_by uuid REFERENCES employees(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users"
  ON payroll_records FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create performance_reviews table
CREATE TABLE IF NOT EXISTS performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) NOT NULL,
  reviewer_id uuid REFERENCES employees(id) NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  rating numeric NOT NULL CHECK (rating >= 1 AND rating <= 5),
  strengths text NOT NULL,
  areas_for_improvement text NOT NULL,
  goals text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users"
  ON performance_reviews FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create work_schedules table
CREATE TABLE IF NOT EXISTS work_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) NOT NULL,
  date date NOT NULL,
  shift_start time NOT NULL,
  shift_end time NOT NULL,
  notes text,
  created_by uuid REFERENCES employees(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users"
  ON work_schedules FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create promotion_rules table
CREATE TABLE IF NOT EXISTS promotion_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  applies_to text NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'category', 'product')),
  target_id uuid,
  min_purchase numeric DEFAULT 0,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE promotion_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users"
  ON promotion_rules FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create expense_categories table
CREATE TABLE IF NOT EXISTS expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  monthly_budget numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users"
  ON expense_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add category_id to expenses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN category_id uuid REFERENCES expense_categories(id);
  END IF;
END $$;

-- Add attachment_url to expenses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'attachment_url'
  ) THEN
    ALTER TABLE expenses ADD COLUMN attachment_url text;
  END IF;
END $$;

-- Add approval_status to expenses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE expenses ADD COLUMN approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Add approved_by to expenses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE expenses ADD COLUMN approved_by uuid REFERENCES employees(id);
  END IF;
END $$;