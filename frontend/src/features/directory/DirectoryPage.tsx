import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, SlidersHorizontal, Plus, MoreHorizontal, Eye, Pencil, Trash2,
  ChevronUp, ChevronDown, X, Mail, Phone, Briefcase, Building2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../services/api';
import {
  Employee, Department, Designation,
  EmployeeCreatePayload
} from '../../types';
import { formatDate } from '../../utils/formatters';
import { validateName, validateEmail, validatePhone } from '../../utils/validators';

interface DirectoryPageProps {
  onNavigateProfile: (empId: string) => void;
}

const EMPLOYMENT_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'INACTIVE', label: 'Inactive' }
];

const EMPLOYMENT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERN', label: 'Intern' }
];

const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other / Prefer not to say' }
];

interface AddEmployeeFormState {
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  date_of_joining: string;
  employment_status: string;
  employment_type: string;
  department_id: string;
  designation_id: string;
  manager_id: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

const DEFAULT_FORM: AddEmployeeFormState = {
  employee_code: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  gender: 'MALE',
  date_of_joining: '',
  employment_status: 'ACTIVE',
  employment_type: 'FULL_TIME',
  department_id: '',
  designation_id: '',
  manager_id: '',
  address: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
  emergency_contact_name: '',
  emergency_contact_phone: ''
};

export const DirectoryPage: React.FC<DirectoryPageProps> = ({ onNavigateProfile }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [desigFilter, setDesigFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const PAGE_SIZE = 10;

  const [showAddModal, setShowAddModal] = useState(false);
  const [formState, setFormState] = useState<AddEmployeeFormState>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Partial<AddEmployeeFormState>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [formServerError, setFormServerError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getEmployees({
        page,
        page_size: PAGE_SIZE,
        search: search || undefined,
        department_id: deptFilter || undefined,
        designation_id: desigFilter || undefined,
        employment_status: statusFilter || undefined,
        employment_type: typeFilter || undefined,
      });
      setEmployees(res.items);
      setTotalPages(res.total_pages);
      setTotalItems(res.total);
    } catch (e: any) {
      setError('Unable to load employees. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, search, deptFilter, desigFilter, statusFilter, typeFilter]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const loadMeta = async () => {
      const [depts, desigs] = await Promise.all([api.getDepartments(), api.getDesignations()]);
      setDepartments(depts);
      setDesignations(desigs);
    };
    loadMeta();
  }, []);

  useEffect(() => {
    if (formState.department_id) {
      api.getDesignations(formState.department_id).then(setDesignations);
    }
  }, [formState.department_id]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <span className="ml-1 text-slate-300">⇅</span>;
    return sortOrder === 'asc'
      ? <ChevronUp className="w-3 h-3 inline ml-1 text-brand-600" />
      : <ChevronDown className="w-3 h-3 inline ml-1 text-brand-600" />;
  };

  // Add Employee Form Validation
  const validateForm = (): boolean => {
    const errors: Partial<AddEmployeeFormState> = {};
    const fnameCheck = validateName(formState.first_name, 'First Name');
    if (!fnameCheck.isValid) errors.first_name = fnameCheck.error!;
    const lnameCheck = validateName(formState.last_name, 'Last Name');
    if (!lnameCheck.isValid) errors.last_name = lnameCheck.error!;
    const emailCheck = validateEmail(formState.email);
    if (!emailCheck.isValid) errors.email = emailCheck.error!;
    const phoneCheck = validatePhone(formState.phone);
    if (!phoneCheck.isValid) errors.phone = phoneCheck.error!;
    if (!formState.employee_code.trim()) errors.employee_code = 'Employee code is required.';
    if (!formState.date_of_birth) errors.date_of_birth = 'Date of birth is required.';
    if (!formState.date_of_joining) errors.date_of_joining = 'Date of joining is required.';
    if (!formState.department_id) errors.department_id = 'Department is required.';
    if (!formState.designation_id) errors.designation_id = 'Designation is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (field: keyof AddEmployeeFormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setFormLoading(true);
    setFormServerError(null);
    try {
      const payload: EmployeeCreatePayload = {
        ...formState,
        employment_status: formState.employment_status as any,
        employment_type: formState.employment_type as any,
        manager_id: formState.manager_id || undefined,
      };
      await api.createEmployee(payload);
      setShowAddModal(false);
      setFormState(DEFAULT_FORM);
      fetchEmployees();
    } catch (e: any) {
      setFormServerError(e.message || 'Failed to create employee. Please check for duplicate email or code.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.deleteEmployee(deleteTarget.id);
      setDeleteTarget(null);
      fetchEmployees();
    } catch (e: any) {
      // ignore for UI
    } finally {
      setDeleteLoading(false);
    }
  };

  const deptOptions = [
    { value: '', label: 'All Departments' },
    ...departments.map(d => ({ value: d.id, label: d.name }))
  ];

  const desigOptions = [
    { value: '', label: 'All Designations' },
    ...designations.map(d => ({ value: d.id, label: d.name }))
  ];

  const formDeptOptions = [
    { value: '', label: '— Select Department —' },
    ...departments.map(d => ({ value: d.id, label: d.name }))
  ];

  const formDesigOptions = [
    { value: '', label: '— Select Designation —' },
    ...designations
      .filter(d => !formState.department_id || d.department_id === formState.department_id)
      .map(d => ({ value: d.id, label: d.name }))
  ];

  const formManagerOptions = [
    { value: '', label: '— No Manager —' },
    ...employees.map(e => ({ value: e.id, label: `${e.first_name} ${e.last_name} (${e.employee_code})` }))
  ];

  const activeFiltersCount = [deptFilter, desigFilter, statusFilter, typeFilter].filter(Boolean).length;

  return (
    <div className="p-6 max-w-full mx-auto space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Employee Directory</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {totalItems > 0 ? `${totalItems} employees found` : 'Manage your organization workforce'}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => { setShowAddModal(true); setFormState(DEFAULT_FORM); setFormErrors({}); setFormServerError(null); }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Employee
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-subtle space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by name, code or email..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-all"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
          >
            Filters{activeFiltersCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-brand-600 text-white text-[10px] font-bold rounded-full">{activeFiltersCount}</span>}
          </Button>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => { setDeptFilter(''); setDesigFilter(''); setStatusFilter(''); setTypeFilter(''); setPage(1); }}>
              Clear All
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            <Select
              label="Department"
              value={deptFilter}
              onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
              options={deptOptions}
            />
            <Select
              label="Designation"
              value={desigFilter}
              onChange={e => { setDesigFilter(e.target.value); setPage(1); }}
              options={desigOptions}
            />
            <Select
              label="Status"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              options={EMPLOYMENT_STATUSES}
            />
            <Select
              label="Type"
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              options={EMPLOYMENT_TYPES}
            />
          </div>
        )}
      </div>

      {/* Employee Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <p className="text-rose-600 font-medium mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchEmployees}>Retry</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th
                    className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-slate-900 select-none"
                    onClick={() => handleSort('first_name')}
                  >
                    Employee <SortIcon col="first_name" />
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider hidden md:table-cell">
                    Department
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider hidden lg:table-cell">
                    Designation
                  </th>
                  <th
                    className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-slate-900 select-none hidden lg:table-cell"
                    onClick={() => handleSort('date_of_joining')}
                  >
                    Joining Date <SortIcon col="date_of_joining" />
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                          <div className="space-y-1.5 flex-1">
                            <Skeleton className="h-3.5 w-28" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell"><Skeleton className="h-3 w-24" /></td>
                      <td className="px-5 py-3.5 hidden lg:table-cell"><Skeleton className="h-3 w-24" /></td>
                      <td className="px-5 py-3.5 hidden lg:table-cell"><Skeleton className="h-3 w-20" /></td>
                      <td className="px-5 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="px-5 py-3.5"><Skeleton className="h-7 w-16 ml-auto" /></td>
                    </tr>
                  ))
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <EmptyState
                        icon={<Building2 className="w-6 h-6" />}
                        title="No employees found"
                        description="Try adjusting your search filters or add a new employee to get started."
                        actionLabel="Add Employee"
                        onAction={() => setShowAddModal(true)}
                        className="border-0 rounded-none"
                      />
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <div
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => onNavigateProfile(emp.id)}
                        >
                          <Avatar name={`${emp.first_name} ${emp.last_name}`} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 hover:text-brand-700 transition-colors">
                              {emp.first_name} {emp.last_name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] font-mono text-slate-500">{emp.employee_code}</span>
                              <span className="text-slate-300">·</span>
                              <span className="text-[11px] text-slate-500 truncate max-w-[160px]">{emp.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[120px]">{emp.department?.name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-slate-700">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{emp.designation?.name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell text-sm text-slate-600">
                        {formatDate(emp.date_of_joining)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={emp.employment_status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="View Profile"
                            onClick={() => onNavigateProfile(emp.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            title="Delete"
                            onClick={() => setDeleteTarget(emp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && employees.length > 0 && (
          <div className="px-5 border-t border-slate-100">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Employee"
        subtitle="Fill in the new employee's details below."
        maxWidth="2xl"
      >
        <form onSubmit={handleAddEmployee} noValidate>
          {formServerError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm font-medium text-rose-700">
              {formServerError}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Basic Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Employee Code"
                  requiredIndicator
                  placeholder="EMP-0001"
                  value={formState.employee_code}
                  onChange={e => handleFormChange('employee_code', e.target.value)}
                  error={formErrors.employee_code}
                />
                <Select
                  label="Gender"
                  requiredIndicator
                  value={formState.gender}
                  onChange={e => handleFormChange('gender', e.target.value)}
                  options={GENDERS}
                />
                <Input
                  label="First Name"
                  requiredIndicator
                  placeholder="Shivmani"
                  value={formState.first_name}
                  onChange={e => handleFormChange('first_name', e.target.value)}
                  error={formErrors.first_name}
                />
                <Input
                  label="Last Name"
                  requiredIndicator
                  placeholder="Sharma"
                  value={formState.last_name}
                  onChange={e => handleFormChange('last_name', e.target.value)}
                  error={formErrors.last_name}
                />
                <Input
                  label="Email Address"
                  requiredIndicator
                  type="email"
                  placeholder="shivmani@enterprise.com"
                  value={formState.email}
                  onChange={e => handleFormChange('email', e.target.value)}
                  error={formErrors.email}
                  leftIcon={<Mail className="w-4 h-4" />}
                />
                <Input
                  label="Phone Number"
                  requiredIndicator
                  placeholder="+91 98765 43210"
                  value={formState.phone}
                  onChange={e => handleFormChange('phone', e.target.value)}
                  error={formErrors.phone}
                  leftIcon={<Phone className="w-4 h-4" />}
                />
                <Input
                  label="Date of Birth"
                  requiredIndicator
                  type="date"
                  value={formState.date_of_birth}
                  onChange={e => handleFormChange('date_of_birth', e.target.value)}
                  error={formErrors.date_of_birth}
                />
                <Input
                  label="Date of Joining"
                  requiredIndicator
                  type="date"
                  value={formState.date_of_joining}
                  onChange={e => handleFormChange('date_of_joining', e.target.value)}
                  error={formErrors.date_of_joining}
                />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Employment Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Department"
                  requiredIndicator
                  value={formState.department_id}
                  onChange={e => handleFormChange('department_id', e.target.value)}
                  options={formDeptOptions}
                  error={formErrors.department_id}
                />
                <Select
                  label="Designation"
                  requiredIndicator
                  value={formState.designation_id}
                  onChange={e => handleFormChange('designation_id', e.target.value)}
                  options={formDesigOptions}
                  error={formErrors.designation_id}
                />
                <Select
                  label="Employment Status"
                  value={formState.employment_status}
                  onChange={e => handleFormChange('employment_status', e.target.value)}
                  options={EMPLOYMENT_STATUSES.filter(s => s.value)}
                />
                <Select
                  label="Employment Type"
                  value={formState.employment_type}
                  onChange={e => handleFormChange('employment_type', e.target.value)}
                  options={EMPLOYMENT_TYPES.filter(s => s.value)}
                />
                <Select
                  label="Reporting Manager (Optional)"
                  value={formState.manager_id}
                  onChange={e => handleFormChange('manager_id', e.target.value)}
                  options={formManagerOptions}
                />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Address (Optional)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="City"
                  placeholder="Bengaluru"
                  value={formState.city}
                  onChange={e => handleFormChange('city', e.target.value)}
                />
                <Input
                  label="State"
                  placeholder="Karnataka"
                  value={formState.state}
                  onChange={e => handleFormChange('state', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={formLoading} leftIcon={<Plus className="w-4 h-4" />}>
              Add Employee
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Employee"
        subtitle="This action cannot be undone."
        maxWidth="sm"
      >
        <div className="text-sm text-slate-600">
          Are you sure you want to delete{' '}
          <span className="font-bold text-slate-900">
            {deleteTarget?.first_name} {deleteTarget?.last_name}
          </span>{' '}
          ({deleteTarget?.employee_code})? This will mark the employee as deleted.
        </div>
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" isLoading={deleteLoading} onClick={handleDeleteEmployee} leftIcon={<Trash2 className="w-4 h-4" />}>
            Delete Employee
          </Button>
        </div>
      </Modal>
    </div>
  );
};
