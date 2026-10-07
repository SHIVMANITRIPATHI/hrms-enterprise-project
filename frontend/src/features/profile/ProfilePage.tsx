import React, { useState, useEffect } from 'react';
import {
  User, Briefcase, CreditCard, Mail, Phone, MapPin, Shield,
  Eye, EyeOff, Pencil, Building2, Users, Calendar, Loader2
} from 'lucide-react';
import { Tabs } from '../../components/ui/Tabs';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { api } from '../../services/api';
import { Employee } from '../../types';
import { formatDate, maskSensitiveString } from '../../utils/formatters';

interface ProfilePageProps {
  employeeId?: string;
  maskSensitiveData: boolean;
  onToggleMask: () => void;
}

const TAB_ITEMS = [
  { id: 'personal', label: 'Personal Information' },
  { id: 'employment', label: 'Employment' },
  { id: 'statutory', label: 'Bank & Statutory' }
];

interface ProfileFieldProps {
  label: string;
  value?: string | null;
  icon?: React.ReactNode;
  masked?: boolean;
  className?: string;
}

const ProfileField: React.FC<ProfileFieldProps> = ({ label, value, icon, masked, className = '' }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <div className="flex items-center gap-1.5">
      {icon && <span className="text-slate-400">{icon}</span>}
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
    <span className={`text-sm font-medium ${masked ? 'font-mono tracking-widest text-slate-400' : 'text-slate-900'}`}>
      {masked ? maskSensitiveString(value ?? undefined) : (value || '—')}
    </span>
  </div>
);

export const ProfilePage: React.FC<ProfilePageProps> = ({ employeeId, maskSensitiveData, onToggleMask }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [showRawSensitive, setShowRawSensitive] = useState(false);

  const targetId = employeeId || 'e1111111-1111-1111-1111-111111111111';

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const emp = await api.getEmployee(targetId);
        setEmployee(emp);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [targetId]);

  const shouldMask = maskSensitiveData && !showRawSensitive;

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-5">
          <Skeleton className="w-20 h-20 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-5 w-24 rounded-full mt-1" />
          </div>
        </div>
        <Skeleton className="h-11 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6 text-center text-slate-500">
        <User className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="font-semibold">Employee not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="relative bg-gradient-to-r from-brand-600 to-brand-800 rounded-2xl overflow-hidden text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHBhdGggZD0ibTAgMCA2MCAwIDAgNjB6IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC4xIiBzdHJva2Utb3BhY2l0eT0iMC4wNiIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-100" />
        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <Avatar name={`${employee.first_name} ${employee.last_name}`} size="xl" className="ring-4 ring-white/30" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold">
              {employee.first_name} {employee.last_name}
            </h2>
            <p className="text-brand-200 text-sm mt-1">
              {employee.designation?.name ?? 'N/A'} · {employee.department?.name ?? 'N/A'}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="px-2.5 py-1 bg-white/10 text-white text-xs font-semibold rounded-lg border border-white/20 font-mono">
                {employee.employee_code}
              </span>
              <StatusBadge status={employee.employment_status} className="bg-white/10 border-white/20 text-white" />
              <span className="text-xs text-brand-200">{employee.employment_type?.replace('_', ' ')}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="border-white/30 text-white hover:bg-white/10 bg-transparent"
              onClick={onToggleMask}
              leftIcon={maskSensitiveData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            >
              {maskSensitiveData ? 'Data Masked' : 'Mask Sensitive'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
        <div className="px-6 pt-4">
          <Tabs tabs={TAB_ITEMS} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <div className="p-6">
          {/* Personal Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                <ProfileField
                  label="Full Name"
                  value={`${employee.first_name} ${employee.last_name}`}
                  icon={<User className="w-3.5 h-3.5" />}
                />
                <ProfileField
                  label="Date of Birth"
                  value={formatDate(employee.date_of_birth)}
                  icon={<Calendar className="w-3.5 h-3.5" />}
                />
                <ProfileField label="Gender" value={employee.gender} />
                <ProfileField
                  label="Email Address"
                  value={employee.email}
                  icon={<Mail className="w-3.5 h-3.5" />}
                />
                <ProfileField
                  label="Phone Number"
                  value={employee.phone}
                  icon={<Phone className="w-3.5 h-3.5" />}
                />
              </div>

              {(employee.address || employee.city || employee.state) && (
                <>
                  <div className="border-t border-slate-100 pt-5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      Address Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                      {employee.address && <ProfileField label="Street Address" value={employee.address} className="col-span-full sm:col-span-2" />}
                      <ProfileField label="City" value={employee.city} />
                      <ProfileField label="State" value={employee.state} />
                      <ProfileField label="Postal Code" value={employee.postal_code} />
                      <ProfileField label="Country" value={employee.country} />
                    </div>
                  </div>
                </>
              )}

              {(employee.emergency_contact_name || employee.emergency_contact_phone) && (
                <div className="border-t border-slate-100 pt-5">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" />
                    Emergency Contact
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                    <ProfileField label="Contact Name" value={employee.emergency_contact_name} />
                    <ProfileField label="Contact Phone" value={employee.emergency_contact_phone} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Employment Tab */}
          {activeTab === 'employment' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                <ProfileField
                  label="Employee ID"
                  value={employee.employee_code}
                  icon={<Briefcase className="w-3.5 h-3.5" />}
                />
                <ProfileField
                  label="Department"
                  value={employee.department?.name}
                  icon={<Building2 className="w-3.5 h-3.5" />}
                />
                <ProfileField
                  label="Designation"
                  value={employee.designation?.name}
                  icon={<Briefcase className="w-3.5 h-3.5" />}
                />
                <ProfileField
                  label="Reporting Manager"
                  value={employee.manager ? `${employee.manager.first_name} ${employee.manager.last_name}` : 'N/A'}
                  icon={<Users className="w-3.5 h-3.5" />}
                />
                <ProfileField
                  label="Date of Joining"
                  value={formatDate(employee.date_of_joining)}
                  icon={<Calendar className="w-3.5 h-3.5" />}
                />
                <ProfileField label="Employment Type" value={employee.employment_type?.replace('_', ' ')} />
                <ProfileField label="Employment Status" value={employee.employment_status?.replace('_', ' ')} />
              </div>
            </div>
          )}

          {/* Statutory Tab */}
          {activeTab === 'statutory' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <h4 className="text-sm font-semibold text-slate-700">Sensitive Information</h4>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRawSensitive(!showRawSensitive)}
                  leftIcon={showRawSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                >
                  {showRawSensitive ? 'Hide Details' : 'Reveal Details'}
                </Button>
              </div>

              {!showRawSensitive && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium">
                  Sensitive financial & statutory data is masked. Click "Reveal Details" to view raw values.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                <ProfileField
                  label="Bank Name"
                  value={employee.bank_name}
                  icon={<CreditCard className="w-3.5 h-3.5" />}
                />
                <ProfileField
                  label="Account Number"
                  value={employee.account_number}
                  masked={!showRawSensitive}
                  icon={<CreditCard className="w-3.5 h-3.5" />}
                />
                <ProfileField
                  label="IFSC Code"
                  value={employee.ifsc_code}
                  masked={!showRawSensitive}
                />
                <ProfileField
                  label="PAN Number"
                  value={employee.pan_number}
                  masked={!showRawSensitive}
                />
                <ProfileField
                  label="UAN Number"
                  value={employee.uan_number}
                  masked={!showRawSensitive}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
