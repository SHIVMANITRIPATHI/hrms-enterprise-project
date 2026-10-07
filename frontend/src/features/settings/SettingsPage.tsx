import React, { useState, useEffect } from 'react';
import {
  Building2, Sliders, ShieldCheck, PlusCircle, CheckCircle2,
  Lock, Bell, History, Save, X
} from 'lucide-react';
import { api } from '../../services/api';
import { User, CompanySettings, Department, Designation, LeaveType, AuditLog } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatDate } from '../../utils/formatters';

interface SettingsPageProps {
  currentUser: User;
  onOpenChangePassword: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser, onOpenChangePassword }) => {
  const isHR = currentUser.role === 'HR';
  const [activeTab, setActiveTab] = useState<'company' | 'masters' | 'audit' | 'preferences'>('company');
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // New Department Form
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  // New Designation Form
  const [desigDeptId, setDesigDeptId] = useState('');
  const [desigName, setDesigName] = useState('');
  const [desigCode, setDesigCode] = useState('');

  // Company Form state
  const [compName, setCompName] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [compAddress, setCompAddress] = useState('');

  useEffect(() => {
    loadSettingsData();
  }, [activeTab]);

  const loadSettingsData = async () => {
    setIsLoading(true);
    try {
      if (isHR) {
        const [comp, depts, desigs, lts, logs] = await Promise.all([
          api.getCompanySettings(),
          api.getDepartments(),
          api.getDesignations(),
          api.getLeaveTypes(),
          api.getAuditLogs(50),
        ]);
        setSettings(comp);
        setDepartments(depts);
        setDesignations(desigs);
        setLeaveTypes(lts);
        setAuditLogs(logs);

        setCompName(comp.company_name);
        setCompEmail(comp.company_email);
        setCompPhone(comp.company_phone);
        setCompAddress(comp.company_address);
        if (depts.length > 0) setDesigDeptId(depts[0].id);
      }
    } catch (err) {
      console.error('Failed to load settings data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.updateCompanySettings({
        company_name: compName,
        company_email: compEmail,
        company_phone: compPhone,
        company_address: compAddress,
      });
      setSettings(updated);
      alert('Company profile updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update company profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName || !deptCode) return;
    try {
      await api.createDepartment({ name: deptName, code: deptCode, description: deptDesc });
      setDeptName('');
      setDeptCode('');
      setDeptDesc('');
      loadSettingsData();
    } catch (err: any) {
      alert(err.message || 'Failed to add department');
    }
  };

  const handleAddDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desigDeptId || !desigName || !desigCode) return;
    try {
      await api.createDesignation({ department_id: desigDeptId, name: desigName, code: desigCode });
      setDesigName('');
      setDesigCode('');
      loadSettingsData();
    } catch (err: any) {
      alert(err.message || 'Failed to add designation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">System Preferences & Masters</h2>
        <p className="text-sm text-slate-500">
          {isHR
            ? 'Manage organizational settings, department & designation masters, and audit security logs'
            : 'Personal application settings and security controls'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {isHR ? (
          <>
            <button
              onClick={() => setActiveTab('company')}
              className={`py-3 px-5 font-semibold text-sm border-b-2 transition-colors ${
                activeTab === 'company' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Company Profile
            </button>
            <button
              onClick={() => setActiveTab('masters')}
              className={`py-3 px-5 font-semibold text-sm border-b-2 transition-colors ${
                activeTab === 'masters' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Organization Masters
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-3 px-5 font-semibold text-sm border-b-2 transition-colors ${
                activeTab === 'audit' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Audit & Security Logs ({auditLogs.length})
            </button>
          </>
        ) : (
          <button
            onClick={() => setActiveTab('preferences')}
            className="py-3 px-5 font-semibold text-sm border-b-2 border-brand-600 text-brand-600"
          >
            My Account & Security
          </button>
        )}
      </div>

      {/* HR: COMPANY PROFILE */}
      {isHR && activeTab === 'company' && (
        <Card className="p-6 max-w-2xl">
          <h3 className="text-base font-bold text-slate-900 mb-4">Enterprise Corporate Profile</h3>
          <form onSubmit={handleSaveCompanySettings} className="space-y-4">
            <Input
              label="Company Name"
              value={compName}
              onChange={(e) => setCompName(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Official HR Email"
                type="email"
                value={compEmail}
                onChange={(e) => setCompEmail(e.target.value)}
                required
              />
              <Input
                label="Corporate Phone"
                value={compPhone}
                onChange={(e) => setCompPhone(e.target.value)}
                required
              />
            </div>
            <Input
              label="Headquarters Address"
              value={compAddress}
              onChange={(e) => setCompAddress(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" isLoading={isSaving}>
              <Save className="w-4 h-4 mr-2" /> Save Company Profile
            </Button>
          </form>
        </Card>
      )}

      {/* HR: MASTERS */}
      {isHR && activeTab === 'masters' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Departments */}
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Departments Master ({departments.length})</h3>
            <form onSubmit={handleAddDepartment} className="p-4 bg-slate-50 rounded-xl space-y-3">
              <p className="text-xs font-semibold text-slate-700">Add New Department</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Department Name"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  required
                />
                <input
                  placeholder="Code (e.g. DEPT-QA)"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  className="p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>
              <Button type="submit" variant="primary" size="sm" className="w-full">
                Add Department
              </Button>
            </form>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {departments.map((d) => (
                <div key={d.id} className="py-2.5 flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-800">{d.name}</span>
                  <span className="font-mono text-slate-400 font-medium">{d.code}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Designations */}
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Designations Master ({designations.length})</h3>
            <form onSubmit={handleAddDesignation} className="p-4 bg-slate-50 rounded-xl space-y-3">
              <p className="text-xs font-semibold text-slate-700">Add New Designation</p>
              <select
                value={desigDeptId}
                onChange={(e) => setDesigDeptId(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                required
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Designation Title"
                  value={desigName}
                  onChange={(e) => setDesigName(e.target.value)}
                  className="p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  required
                />
                <input
                  placeholder="Code (e.g. DESIG-QA)"
                  value={desigCode}
                  onChange={(e) => setDesigCode(e.target.value)}
                  className="p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>
              <Button type="submit" variant="primary" size="sm" className="w-full">
                Add Designation
              </Button>
            </form>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {designations.map((ds) => (
                <div key={ds.id} className="py-2.5 flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-800">{ds.name}</span>
                  <span className="font-mono text-slate-400 font-medium">{ds.code}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* HR: AUDIT LOGS */}
      {isHR && activeTab === 'audit' && (
        <Card className="p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">Security & Transaction Audit Trail</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 text-xs">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{log.actor_name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-mono font-bold text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{log.entity}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{log.details || '—'}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{log.ip_address || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* EMPLOYEE / PREFERENCES */}
      {(!isHR || activeTab === 'preferences') && (
        <Card className="p-6 max-w-lg space-y-6">
          <h3 className="text-base font-bold text-slate-900">Security Credentials</h3>
          <p className="text-xs text-slate-500">
            Keep your password confidential and change it periodically to safeguard your employee data.
          </p>
          <Button variant="primary" onClick={onOpenChangePassword}>
            <Lock className="w-4 h-4 mr-2" /> Change Account Password
          </Button>
        </Card>
      )}
    </div>
  );
};
