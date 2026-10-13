import {
  User, AuthResponse, Employee, EmployeeCreatePayload, EmployeeListResponse,
  Department, Designation, LeaveType, LeaveBalance, LeaveRequest,
  LeaveRequestCreatePayload, LeaveRequestListResponse, HierarchyNode,
  AttendanceRecord, AttendanceSummary, AttendanceListResponse,
  SalaryStructure, PayrollPeriod, PayrollRecord, PayrollSummary,
  JobOpening, Candidate, PerformanceCycle, PerformanceGoal, PerformanceReview,
  OverviewDashboardReport, CompanySettings, AuditLog, EmployeeDocument
} from '../types';

const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  let base = (envUrl && envUrl.trim()) || 'https://app-hrms-backend-api-cufhcxcjbpfzefa5.centralindia-01.azurewebsites.net/api';
  base = base.replace(/\/+$/, '');
  if (!base.endsWith('/api')) {
    base = `${base}/api`;
  }
  return base;
};

const API_BASE = getApiBaseUrl();


// Token Management
let authToken: string | null = localStorage.getItem('shivmani_auth_token');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('shivmani_auth_token', token);
  } else {
    localStorage.removeItem('shivmani_auth_token');
  }
};

export const getAuthToken = () => authToken;

const getHeaders = (customHeaders: Record<string, string> = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

// Generic API Client Helper
async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const finalOptions: RequestInit = {
    ...options,
    headers: getHeaders(options.headers as Record<string, string>),
  };

  const res = await fetch(url, finalOptions);
  if (!res.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }

  if (res.status === 204) {
    return {} as T;
  }
  return res.json();
}

export const api = {
  // Authentication
  async login(employee_code: string, password: string): Promise<AuthResponse> {
    const data = await apiRequest<AuthResponse>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ employee_code, password }),
    });
    setAuthToken(data.access_token);
    return data;
  },

  async getMe(): Promise<User> {
    return apiRequest<User>(`${API_BASE}/auth/me`);
  },

  async forceChangePassword(new_password: string, confirm_password: string): Promise<User> {
    return apiRequest<User>(`${API_BASE}/auth/force-change-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password, confirm_password }),
    });
  },

  async changePassword(current_password: string, new_password: string, confirm_password: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password, confirm_password }),
    });
  },

  async forgotPassword(employee_code: string): Promise<{ message: string; dev_reset_token?: string }> {
    return apiRequest<{ message: string; dev_reset_token?: string }>(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ employee_code }),
    });
  },

  async resetPassword(token: string, new_password: string, confirm_password: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ token, new_password, confirm_password }),
    });
  },

  logout() {
    setAuthToken(null);
  },

  // Metadata
  async getDepartments(): Promise<Department[]> {
    return apiRequest<Department[]>(`${API_BASE}/departments`);
  },

  async getDesignations(department_id?: string): Promise<Designation[]> {
    const url = department_id
      ? `${API_BASE}/designations?department_id=${department_id}`
      : `${API_BASE}/designations`;
    return apiRequest<Designation[]>(url);
  },

  // Employees & Onboarding
  async getEmployees(params: {
    page?: number;
    page_size?: number;
    search?: string;
    department_id?: string;
    designation_id?: string;
    employment_status?: string;
    employment_type?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc' | string;
  } = {}): Promise<EmployeeListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.page_size) query.append('page_size', params.page_size.toString());
    if (params.search) query.append('search', params.search);
    if (params.department_id) query.append('department_id', params.department_id);
    if (params.designation_id) query.append('designation_id', params.designation_id);
    if (params.employment_status) query.append('employment_status', params.employment_status);
    if (params.employment_type) query.append('employment_type', params.employment_type);
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.sort_order) query.append('sort_order', params.sort_order);

    return apiRequest<EmployeeListResponse>(`${API_BASE}/employees?${query.toString()}`);
  },

  async getEmployee(id: string): Promise<Employee> {
    return apiRequest<Employee>(`${API_BASE}/employees/${id}`);
  },

  async getMyProfile(): Promise<Employee> {
    return apiRequest<Employee>(`${API_BASE}/employees/me`);
  },

  async createEmployee(payload: EmployeeCreatePayload): Promise<Employee> {
    return apiRequest<Employee>(`${API_BASE}/employees`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateEmployee(id: string, payload: Partial<EmployeeCreatePayload>): Promise<Employee> {
    return apiRequest<Employee>(`${API_BASE}/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteEmployee(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`${API_BASE}/employees/${id}`, {
      method: 'DELETE',
    });
  },

  async reactivateEmployee(id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`${API_BASE}/employees/${id}/reactivate`, {
      method: 'POST',
    });
  },

  async getEmployeeDocuments(id: string): Promise<EmployeeDocument[]> {
    return apiRequest<EmployeeDocument[]>(`${API_BASE}/employees/${id}/documents`);
  },

  async uploadEmployeeDocument(id: string, doc: { title: string; document_type: string; file_url: string }): Promise<EmployeeDocument> {
    return apiRequest<EmployeeDocument>(`${API_BASE}/employees/${id}/documents`, {
      method: 'POST',
      body: JSON.stringify(doc),
    });
  },

  async getEmployeeHierarchy(id: string): Promise<HierarchyNode> {
    return apiRequest<HierarchyNode>(`${API_BASE}/employees/${id}/hierarchy`);
  },

  // Attendance
  async checkIn(notes?: string): Promise<AttendanceRecord> {
    return apiRequest<AttendanceRecord>(`${API_BASE}/attendance/check-in`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  async checkOut(notes?: string): Promise<AttendanceRecord> {
    return apiRequest<AttendanceRecord>(`${API_BASE}/attendance/check-out`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  async getMyAttendance(params: { start_date?: string; end_date?: string; page?: number; page_size?: number } = {}): Promise<AttendanceListResponse> {
    const q = new URLSearchParams();
    if (params.start_date) q.append('start_date', params.start_date);
    if (params.end_date) q.append('end_date', params.end_date);
    if (params.page) q.append('page', params.page.toString());
    if (params.page_size) q.append('page_size', params.page_size.toString());
    return apiRequest<AttendanceListResponse>(`${API_BASE}/attendance/me?${q.toString()}`);
  },

  async getMyAttendanceSummary(month?: number, year?: number): Promise<AttendanceSummary> {
    const q = new URLSearchParams();
    if (month) q.append('month', month.toString());
    if (year) q.append('year', year.toString());
    return apiRequest<AttendanceSummary>(`${API_BASE}/attendance/me/summary?${q.toString()}`);
  },

  async getOrganizationAttendance(params: {
    target_date?: string;
    department_id?: string;
    employee_id?: string;
    status?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<AttendanceListResponse> {
    const q = new URLSearchParams();
    if (params.target_date) q.append('target_date', params.target_date);
    if (params.department_id) q.append('department_id', params.department_id);
    if (params.employee_id) q.append('employee_id', params.employee_id);
    if (params.status) q.append('status', params.status);
    if (params.page) q.append('page', params.page.toString());
    if (params.page_size) q.append('page_size', params.page_size.toString());
    return apiRequest<AttendanceListResponse>(`${API_BASE}/attendance?${q.toString()}`);
  },

  async correctAttendance(payload: {
    employee_id: string;
    date: string;
    check_in?: string;
    check_out?: string;
    status: string;
    notes?: string;
  }): Promise<AttendanceRecord> {
    return apiRequest<AttendanceRecord>(`${API_BASE}/attendance/correct`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Leaves
  async getLeaveTypes(): Promise<LeaveType[]> {
    return apiRequest<LeaveType[]>(`${API_BASE}/leave-types`);
  },

  async getLeaveBalances(employee_id: string, year: number = 2026): Promise<LeaveBalance[]> {
    return apiRequest<LeaveBalance[]>(`${API_BASE}/employees/${employee_id}/leave-balances?year=${year}`);
  },

  async getLeaveRequests(params: {
    employee_id?: string;
    status?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<LeaveRequestListResponse> {
    const query = new URLSearchParams();
    if (params.employee_id) query.append('employee_id', params.employee_id);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page.toString());
    if (params.page_size) query.append('page_size', params.page_size.toString());

    return apiRequest<LeaveRequestListResponse>(`${API_BASE}/leaves?${query.toString()}`);
  },

  async createLeaveRequest(payload: LeaveRequestCreatePayload): Promise<LeaveRequest> {
    return apiRequest<LeaveRequest>(`${API_BASE}/leaves`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async approveLeaveRequest(id: string): Promise<LeaveRequest> {
    return apiRequest<LeaveRequest>(`${API_BASE}/leaves/${id}/approve`, { method: 'PATCH' });
  },

  async rejectLeaveRequest(id: string, reason?: string): Promise<LeaveRequest> {
    return apiRequest<LeaveRequest>(`${API_BASE}/leaves/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ rejection_reason: reason }),
    });
  },

  async cancelLeaveRequest(id: string): Promise<LeaveRequest> {
    return apiRequest<LeaveRequest>(`${API_BASE}/leaves/${id}/cancel`, { method: 'PATCH' });
  },

  // Payroll
  async getSalaryStructures(): Promise<SalaryStructure[]> {
    return apiRequest<SalaryStructure[]>(`${API_BASE}/payroll/salary-structures`);
  },

  async saveSalaryStructure(payload: Partial<SalaryStructure>): Promise<SalaryStructure> {
    return apiRequest<SalaryStructure>(`${API_BASE}/payroll/salary-structures`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getPayrollPeriods(): Promise<PayrollPeriod[]> {
    return apiRequest<PayrollPeriod[]>(`${API_BASE}/payroll/periods`);
  },

  async createPayrollPeriod(payload: { period_name: string; month: number; year: number; start_date: string; end_date: string }): Promise<PayrollPeriod> {
    return apiRequest<PayrollPeriod>(`${API_BASE}/payroll/periods`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async generatePayroll(payroll_period_id: string, payment_date?: string): Promise<PayrollSummary> {
    return apiRequest<PayrollSummary>(`${API_BASE}/payroll/generate`, {
      method: 'POST',
      body: JSON.stringify({ payroll_period_id, payment_date }),
    });
  },

  async getPayrollRecords(period_id?: string, employee_id?: string): Promise<PayrollRecord[]> {
    const q = new URLSearchParams();
    if (period_id) q.append('period_id', period_id);
    if (employee_id) q.append('employee_id', employee_id);
    return apiRequest<PayrollRecord[]>(`${API_BASE}/payroll/records?${q.toString()}`);
  },

  async getMyPayroll(): Promise<PayrollRecord[]> {
    return apiRequest<PayrollRecord[]>(`${API_BASE}/payroll/me`);
  },

  async getPayslip(record_id: string): Promise<PayrollRecord> {
    return apiRequest<PayrollRecord>(`${API_BASE}/payroll/payslip/${record_id}`);
  },

  // Recruitment
  async getJobs(status?: string): Promise<JobOpening[]> {
    const q = status ? `?status=${status}` : '';
    return apiRequest<JobOpening[]>(`${API_BASE}/recruitment/jobs${q}`);
  },

  async createJob(payload: Partial<JobOpening>): Promise<JobOpening> {
    return apiRequest<JobOpening>(`${API_BASE}/recruitment/jobs`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getCandidates(job_opening_id?: string, status?: string): Promise<Candidate[]> {
    const q = new URLSearchParams();
    if (job_opening_id) q.append('job_opening_id', job_opening_id);
    if (status) q.append('status', status);
    return apiRequest<Candidate[]>(`${API_BASE}/recruitment/candidates?${q.toString()}`);
  },

  async createCandidate(payload: Partial<Candidate>): Promise<Candidate> {
    return apiRequest<Candidate>(`${API_BASE}/recruitment/candidates`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateCandidateStatus(candidate_id: string, status: string, interview_date?: string, interview_notes?: string): Promise<Candidate> {
    return apiRequest<Candidate>(`${API_BASE}/recruitment/candidates/${candidate_id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, interview_date, interview_notes }),
    });
  },

  async convertCandidateToEmployee(candidate_id: string, payload: {
    employee_code: string;
    date_of_birth: string;
    gender: string;
    date_of_joining: string;
    employment_type: string;
    basic_salary: number;
    default_password?: string;
  }): Promise<Employee> {
    return apiRequest<Employee>(`${API_BASE}/recruitment/candidates/${candidate_id}/convert-to-employee`, {
      method: 'POST',
      body: JSON.stringify({ candidate_id, ...payload }),
    });
  },

  // Performance
  async getPerformanceCycles(): Promise<PerformanceCycle[]> {
    return apiRequest<PerformanceCycle[]>(`${API_BASE}/performance/cycles`);
  },

  async createPerformanceCycle(payload: { title: string; start_date: string; end_date: string; status: string }): Promise<PerformanceCycle> {
    return apiRequest<PerformanceCycle>(`${API_BASE}/performance/cycles`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getGoals(cycle_id?: string, employee_id?: string): Promise<PerformanceGoal[]> {
    const q = new URLSearchParams();
    if (cycle_id) q.append('cycle_id', cycle_id);
    if (employee_id) q.append('employee_id', employee_id);
    return apiRequest<PerformanceGoal[]>(`${API_BASE}/performance/goals?${q.toString()}`);
  },

  async createGoal(payload: { performance_cycle_id: string; employee_id: string; title: string; description?: string; target_date: string; progress?: number; status?: string }): Promise<PerformanceGoal> {
    return apiRequest<PerformanceGoal>(`${API_BASE}/performance/goals`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateGoal(id: string, payload: { progress?: number; status?: string; description?: string }): Promise<PerformanceGoal> {
    return apiRequest<PerformanceGoal>(`${API_BASE}/performance/goals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async getReviews(cycle_id?: string, employee_id?: string): Promise<PerformanceReview[]> {
    const q = new URLSearchParams();
    if (cycle_id) q.append('cycle_id', cycle_id);
    if (employee_id) q.append('employee_id', employee_id);
    return apiRequest<PerformanceReview[]>(`${API_BASE}/performance/reviews?${q.toString()}`);
  },

  async createReview(payload: { performance_cycle_id: string; employee_id: string; reviewer_id: string }): Promise<PerformanceReview> {
    return apiRequest<PerformanceReview>(`${API_BASE}/performance/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async submitSelfReview(id: string, self_rating: number, self_feedback: string): Promise<PerformanceReview> {
    return apiRequest<PerformanceReview>(`${API_BASE}/performance/reviews/${id}/self`, {
      method: 'PATCH',
      body: JSON.stringify({ self_rating, self_feedback }),
    });
  },

  async submitReviewerReview(id: string, reviewer_rating: number, reviewer_feedback: string): Promise<PerformanceReview> {
    return apiRequest<PerformanceReview>(`${API_BASE}/performance/reviews/${id}/reviewer`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewer_rating, reviewer_feedback }),
    });
  },

  // Reports
  async getOverviewReport(): Promise<OverviewDashboardReport> {
    return apiRequest<OverviewDashboardReport>(`${API_BASE}/reports/overview`);
  },

  // Settings & Audit
  async getCompanySettings(): Promise<CompanySettings> {
    return apiRequest<CompanySettings>(`${API_BASE}/settings/company`);
  },

  async updateCompanySettings(payload: Partial<CompanySettings>): Promise<CompanySettings> {
    return apiRequest<CompanySettings>(`${API_BASE}/settings/company`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async createDepartment(payload: { name: string; code: string; description?: string }): Promise<Department> {
    return apiRequest<Department>(`${API_BASE}/settings/departments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createDesignation(payload: { department_id: string; name: string; code: string; description?: string }): Promise<Designation> {
    return apiRequest<Designation>(`${API_BASE}/settings/designations`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createLeaveType(payload: { code: string; name: string; description?: string; yearly_allotment: number }): Promise<LeaveType> {
    return apiRequest<LeaveType>(`${API_BASE}/settings/leave-types`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getAuditLogs(limit: number = 50, action?: string): Promise<AuditLog[]> {
    const q = new URLSearchParams({ limit: limit.toString() });
    if (action) q.append('action', action);
    return apiRequest<AuditLog[]>(`${API_BASE}/audit/logs?${q.toString()}`);
  }
};
