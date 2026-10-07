// SHIVMANI HRMS - TypeScript Type Definitions

export type UserRole = 'HR' | 'EMPLOYEE';

export interface User {
  id: string;
  employee_id: string;
  employee_code: string;
  role: UserRole;
  is_active: boolean;
  must_change_password: boolean;
  force_password_change?: boolean;
  last_login_at?: string | null;
  created_at: string;
  employee?: Employee | null;
  // Convenience fields (may be populated by backend or derived)
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  must_change_password: boolean;
  force_password_change?: boolean;
  user: User;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface Designation {
  id: string;
  department_id: string;
  code: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  department?: Department;
}

export interface ManagerInfo {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  date_of_joining: string;
  employment_status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_LEAVE' | string;
  employment_type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | string;
  department_id: string;
  designation_id: string;
  manager_id?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  pan_number?: string | null;
  uan_number?: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  department?: Department;
  designation?: Designation;
  manager?: ManagerInfo | null;
}

export interface EmployeeCreatePayload {
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  date_of_joining: string;
  employment_status?: string;
  employment_type?: string;
  department_id: string;
  designation_id: string;
  manager_id?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  pan_number?: string | null;
  uan_number?: string | null;
  default_password?: string;
  role?: UserRole;
}

export interface EmployeeListResponse {
  items: Employee[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface HierarchyNode {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  designation_name?: string | null;
  department_name?: string | null;
  reports: HierarchyNode[];
}

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  title: string;
  document_type: string;
  file_url: string;
  uploaded_at: string;
}

// Attendance Types
export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in?: string | null;
  check_out?: string | null;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE' | 'HOLIDAY' | string;
  working_hours: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface AttendanceSummary {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  half_days: number;
  leave_days: number;
  avg_working_hours: number;
}

export interface AttendanceListResponse {
  items: AttendanceRecord[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

// Leave Types
export interface LeaveType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  yearly_allotment: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  allocated_days: number;
  used_days: number;
  remaining_days: number;
  leave_type?: LeaveType;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approved_at?: string | null;
  rejected_at?: string | null;
  cancelled_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  employee?: Employee;
  leave_type?: LeaveType;
}

export interface LeaveRequestCreatePayload {
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string;
}

export interface LeaveRequestListResponse {
  items: LeaveRequest[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

// Payroll Types
export interface SalaryStructure {
  id: string;
  employee_id: string;
  basic_salary: number;
  hra: number;
  conveyance_allowance: number;
  medical_allowance: number;
  special_allowance: number;
  pf_deduction: number;
  tax_deduction: number;
  other_deductions: number;
  gross_salary: number;
  net_salary: number;
  effective_date: string;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface PayrollPeriod {
  id: string;
  period_name: string;
  month: number;
  year: number;
  start_date: string;
  end_date: string;
  is_processed: boolean;
  processed_at?: string | null;
  created_at: string;
}

export interface PayrollRecord {
  id: string;
  payroll_period_id: string;
  employee_id: string;
  basic_salary: number;
  hra: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  payment_status: 'PAID' | 'PENDING' | 'PROCESSED';
  payment_date?: string | null;
  payslip_number: string;
  created_at: string;
  updated_at: string;
  period?: PayrollPeriod;
  employee?: Employee;
}

export interface PayrollSummary {
  total_payroll_cost: number;
  total_employees_paid: number;
  pending_approvals: number;
  period_name: string;
}

// Recruitment Types
export interface JobOpening {
  id: string;
  title: string;
  department_id: string;
  designation_id: string;
  description?: string | null;
  requirements?: string | null;
  openings_count: number;
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
  posted_date: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  department?: Department;
  designation?: Designation;
}

export interface Candidate {
  id: string;
  job_opening_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  resume_url?: string | null;
  status: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'SELECTED' | 'OFFERED' | 'HIRED' | 'REJECTED';
  interview_date?: string | null;
  interview_notes?: string | null;
  experience_years: number;
  expected_salary?: number | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  job_opening?: JobOpening;
}

// Performance Types
export interface PerformanceCycle {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'CLOSED' | 'DRAFT';
  created_at: string;
}

export interface PerformanceGoal {
  id: string;
  performance_cycle_id: string;
  employee_id: string;
  title: string;
  description?: string | null;
  target_date: string;
  progress: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface PerformanceReview {
  id: string;
  performance_cycle_id: string;
  employee_id: string;
  reviewer_id: string;
  self_rating?: number | null;
  reviewer_rating?: number | null;
  self_feedback?: string | null;
  reviewer_feedback?: string | null;
  status: 'PENDING' | 'SUBMITTED' | 'COMPLETED';
  created_at: string;
  updated_at: string;
  cycle?: PerformanceCycle;
  employee?: Employee;
  reviewer?: Employee;
}

// Reports & Analytics Types
export interface HeadcountMetric {
  total_employees: number;
  active_employees: number;
  inactive_employees: number;
  full_time_count: number;
  contract_count: number;
  intern_count: number;
}

export interface DepartmentDistribution {
  department_id: string;
  department_name: string;
  department_code: string;
  headcount: number;
  percentage: number;
}

export interface AttendanceOverviewMetric {
  total_expected_today: number;
  present_today: number;
  late_today: number;
  half_day_today: number;
  on_leave_today: number;
  absent_today: number;
  attendance_rate: number;
}

export interface LeaveUtilizationMetric {
  leave_type_name: string;
  allocated_days: number;
  used_days: number;
  remaining_days: number;
  utilization_rate: number;
}

export interface PayrollExpenseMetric {
  total_monthly_gross: number;
  total_monthly_net: number;
  total_deductions: number;
  avg_salary: number;
}

export interface OverviewDashboardReport {
  headcount: HeadcountMetric;
  department_distribution: DepartmentDistribution[];
  attendance: AttendanceOverviewMetric;
  leave_utilization: LeaveUtilizationMetric[];
  payroll: PayrollExpenseMetric;
  open_jobs_count: number;
  total_candidates: number;
  pending_approvals_count: number;
}

// Settings & Audit Types
export interface CompanySettings {
  id: string;
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  timezone: string;
  currency: string;
  fiscal_year_start: string;
  attendance_grace_period_mins: number;
  standard_working_hours: number;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  actor_name: string;
  action: string;
  entity: string;
  entity_id?: string | null;
  details?: string | null;
  ip_address?: string | null;
  timestamp: string;
}

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  onLeaveToday: number;
  pendingApprovalsCount: number;
  activeJobsCount?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error' | 'leave' | 'employee' | 'system' | string;
}
