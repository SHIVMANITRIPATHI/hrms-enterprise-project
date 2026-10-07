import React, { useState, useEffect } from 'react';
import {
  DollarSign, FileText, Calendar, PlusCircle, CheckCircle2,
  Printer, ArrowRight, ShieldCheck, Download, Edit3, X
} from 'lucide-react';
import { api } from '../../services/api';
import { User, SalaryStructure, PayrollPeriod, PayrollRecord, Employee } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate } from '../../utils/formatters';

interface PayrollPageProps {
  currentUser: User;
}

export const PayrollPage: React.FC<PayrollPageProps> = ({ currentUser }) => {
  const isHR = currentUser.role === 'HR';
  const [activeTab, setActiveTab] = useState<'periods' | 'structures' | 'my_payslips'>('periods');
  const [isLoading, setIsLoading] = useState(true);

  // HR State
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');

  // Run Payroll Modal
  const [showRunModal, setShowRunModal] = useState(false);
  const [runPeriodId, setRunPeriodId] = useState('');
  const [isRunningPayroll, setIsRunningPayroll] = useState(false);

  // Employee State
  const [myRecords, setMyRecords] = useState<PayrollRecord[]>([]);
  const [viewPayslip, setViewPayslip] = useState<PayrollRecord | null>(null);

  useEffect(() => {
    loadPayrollData();
  }, [currentUser, activeTab]);

  const loadPayrollData = async () => {
    setIsLoading(true);
    try {
      if (isHR) {
        const [periodList, structList, recList] = await Promise.all([
          api.getPayrollPeriods(),
          api.getSalaryStructures(),
          api.getPayrollRecords(selectedPeriodId || undefined),
        ]);
        setPeriods(periodList);
        setStructures(structList);
        setRecords(recList);
        if (periodList.length > 0 && !selectedPeriodId) {
          setSelectedPeriodId(periodList[0].id);
        }
      } else {
        const payslips = await api.getMyPayroll();
        setMyRecords(payslips);
      }
    } catch (err) {
      console.error('Failed to load payroll data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecutePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!runPeriodId) return;
    setIsRunningPayroll(true);
    try {
      await api.generatePayroll(runPeriodId);
      setShowRunModal(false);
      loadPayrollData();
    } catch (err: any) {
      alert(err.message || 'Failed to generate payroll');
    } finally {
      setIsRunningPayroll(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Payroll & Compensation</h2>
          <p className="text-sm text-slate-500">
            {isHR
              ? 'Manage corporate salary structures, process monthly pay runs, and generate employee payslips'
              : 'View your salary breakdown, earnings, deductions, and download monthly payslips'}
          </p>
        </div>

        {isHR && (
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              if (periods.length > 0) setRunPeriodId(periods[0].id);
              setShowRunModal(true);
            }}
          >
            <DollarSign className="w-5 h-5 mr-2" />
            Process Pay Run
          </Button>
        )}
      </div>

      {/* HR TABS */}
      {isHR && (
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('periods')}
            className={`py-3 px-5 font-semibold text-sm border-b-2 transition-colors ${
              activeTab === 'periods' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Pay Runs & Records
          </button>
          <button
            onClick={() => setActiveTab('structures')}
            className={`py-3 px-5 font-semibold text-sm border-b-2 transition-colors ${
              activeTab === 'structures' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Salary Structures ({structures.length})
          </button>
        </div>
      )}

      {/* HR: Pay Runs View */}
      {isHR && activeTab === 'periods' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {periods.map((p) => (
              <Card
                key={p.id}
                className={`p-5 cursor-pointer transition-all border-2 ${
                  selectedPeriodId === p.id ? 'border-brand-600 shadow-md bg-brand-50/20' : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => {
                  setSelectedPeriodId(p.id);
                  api.getPayrollRecords(p.id).then(setRecords);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900">{p.period_name}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${p.is_processed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {p.is_processed ? 'COMPLETED' : 'PENDING'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {formatDate(p.start_date)} - {formatDate(p.end_date)}
                </p>
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Processed Payroll Records ({records.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Basic</th>
                    <th className="py-3 px-4">HRA</th>
                    <th className="py-3 px-4">Allowances</th>
                    <th className="py-3 px-4">Deductions</th>
                    <th className="py-3 px-4">Net Salary</th>
                    <th className="py-3 px-4">Payslip #</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {r.employee?.first_name} {r.employee?.last_name}
                        <span className="block text-[11px] text-slate-400 font-normal">{r.employee?.employee_code}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{formatCurrency(r.basic_salary)}</td>
                      <td className="py-3 px-4 text-slate-700">{formatCurrency(r.hra)}</td>
                      <td className="py-3 px-4 text-emerald-600 font-medium">+{formatCurrency(r.allowances)}</td>
                      <td className="py-3 px-4 text-rose-600 font-medium">-{formatCurrency(r.deductions)}</td>
                      <td className="py-3 px-4 text-slate-900 font-bold">{formatCurrency(r.net_salary)}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-xs">{r.payslip_number}</td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setViewPayslip(r)}>
                          <FileText className="w-3.5 h-3.5 mr-1" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* HR: Salary Structures View */}
      {isHR && activeTab === 'structures' && (
        <Card className="p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">Configured Compensation Structures</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Basic Pay</th>
                  <th className="py-3 px-4">HRA</th>
                  <th className="py-3 px-4">Special Allowance</th>
                  <th className="py-3 px-4">PF Deduction</th>
                  <th className="py-3 px-4">Gross Pay</th>
                  <th className="py-3 px-4">Monthly Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {structures.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {s.employee?.first_name} {s.employee?.last_name}
                      <span className="block text-[11px] text-slate-400 font-normal">{s.employee?.employee_code}</span>
                    </td>
                    <td className="py-3 px-4">{formatCurrency(s.basic_salary)}</td>
                    <td className="py-3 px-4">{formatCurrency(s.hra)}</td>
                    <td className="py-3 px-4">{formatCurrency(s.special_allowance)}</td>
                    <td className="py-3 px-4 text-rose-600">-{formatCurrency(s.pf_deduction)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{formatCurrency(s.gross_salary)}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{formatCurrency(s.net_salary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* EMPLOYEE VIEW */}
      {!isHR && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">My Payslips History</h3>
            {myRecords.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No payslips released yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Period</th>
                      <th className="py-3 px-4">Payslip #</th>
                      <th className="py-3 px-4">Gross Earnings</th>
                      <th className="py-3 px-4">Total Deductions</th>
                      <th className="py-3 px-4">Net Payout</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-semibold text-slate-900">{r.period?.period_name || 'Pay Run'}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-xs">{r.payslip_number}</td>
                        <td className="py-3 px-4 text-slate-700">{formatCurrency(r.basic_salary + r.hra + r.allowances)}</td>
                        <td className="py-3 px-4 text-rose-600 font-medium">-{formatCurrency(r.deductions)}</td>
                        <td className="py-3 px-4 font-bold text-emerald-700">{formatCurrency(r.net_salary)}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status="PAID" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="primary" size="sm" onClick={() => setViewPayslip(r)}>
                            <FileText className="w-3.5 h-3.5 mr-1" /> View Payslip
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Run Payroll Modal */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Execute Monthly Pay Run</h3>
              <button onClick={() => setShowRunModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              This action will calculate gross earnings, statutory PF/tax deductions, generate official payslip numbers, and record payment status for all active employees.
            </p>

            <form onSubmit={handleExecutePayroll} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Pay Period</label>
                <select
                  value={runPeriodId}
                  onChange={(e) => setRunPeriodId(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                  required
                >
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>{p.period_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="w-1/2" onClick={() => setShowRunModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="w-1/2" isLoading={isRunningPayroll}>
                  Generate Payslips
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Payslip Modal */}
      {viewPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative text-slate-900 print:p-0">
            <button
              onClick={() => setViewPayslip(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 print:hidden"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Payslip Header */}
            <div className="border-b border-slate-200 pb-5 mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black text-brand-600 tracking-tight">SHIVMANI ENTERPRISES</h2>
                <p className="text-xs text-slate-500 mt-0.5">Tower B, Tech Park, Whitefield, Bengaluru - 560066</p>
                <p className="text-xs font-bold text-slate-800 mt-2 uppercase">Official Payslip / Salary Statement</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-500">Payslip No:</p>
                <p className="text-sm font-bold font-mono text-slate-900">{viewPayslip.payslip_number}</p>
                <p className="text-xs text-slate-500 mt-1">Period: {viewPayslip.period?.period_name}</p>
              </div>
            </div>

            {/* Employee Metadata */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-4 rounded-xl">
              <div>
                <p><span className="text-slate-500">Employee Name:</span> <strong className="text-slate-900">{viewPayslip.employee?.first_name} {viewPayslip.employee?.last_name}</strong></p>
                <p className="mt-1"><span className="text-slate-500">Employee ID:</span> <strong className="text-slate-900">{viewPayslip.employee?.employee_code}</strong></p>
                <p className="mt-1"><span className="text-slate-500">Department:</span> <strong className="text-slate-900">{viewPayslip.employee?.department?.name}</strong></p>
              </div>
              <div>
                <p><span className="text-slate-500">Designation:</span> <strong className="text-slate-900">{viewPayslip.employee?.designation?.name}</strong></p>
                <p className="mt-1"><span className="text-slate-500">Bank Account:</span> <strong className="text-slate-900">{viewPayslip.employee?.bank_name} ••••{viewPayslip.employee?.account_number?.slice(-4)}</strong></p>
                <p className="mt-1"><span className="text-slate-500">PAN:</span> <strong className="text-slate-900">{viewPayslip.employee?.pan_number}</strong></p>
              </div>
            </div>

            {/* Earnings & Deductions Grid */}
            <div className="grid grid-cols-2 gap-6 text-xs mb-6">
              <div>
                <h4 className="font-bold text-slate-800 uppercase pb-2 border-b border-slate-200">Earnings</h4>
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between"><span>Basic Salary</span><strong>{formatCurrency(viewPayslip.basic_salary)}</strong></div>
                  <div className="flex justify-between"><span>House Rent Allowance (HRA)</span><strong>{formatCurrency(viewPayslip.hra)}</strong></div>
                  <div className="flex justify-between"><span>Special Allowances</span><strong>{formatCurrency(viewPayslip.allowances)}</strong></div>
                  <div className="flex justify-between pt-2 border-t font-bold text-slate-900">
                    <span>Total Gross Pay</span>
                    <span>{formatCurrency(viewPayslip.basic_salary + viewPayslip.hra + viewPayslip.allowances)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase pb-2 border-b border-slate-200">Deductions</h4>
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between"><span>Provident Fund (PF)</span><strong className="text-rose-600">-{formatCurrency(viewPayslip.deductions * 0.6)}</strong></div>
                  <div className="flex justify-between"><span>Income Tax (TDS)</span><strong className="text-rose-600">-{formatCurrency(viewPayslip.deductions * 0.4)}</strong></div>
                  <div className="flex justify-between pt-2 border-t font-bold text-slate-900">
                    <span>Total Deductions</span>
                    <span className="text-rose-600">-{formatCurrency(viewPayslip.deductions)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Payout Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-semibold text-emerald-800">Net Take Home Pay</p>
                <p className="text-xs text-emerald-600">Directly transferred to bank account</p>
              </div>
              <p className="text-2xl font-black text-emerald-800">{formatCurrency(viewPayslip.net_salary)}</p>
            </div>

            <div className="flex justify-end gap-3 print:hidden">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-1.5" /> Print Statement
              </Button>
              <Button variant="primary" size="sm" onClick={() => setViewPayslip(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
