import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Users, CalendarCheck, Clock, DollarSign,
  PieChart, BarChart3, Download, Printer, ShieldCheck, Award
} from 'lucide-react';
import { api } from '../../services/api';
import { OverviewDashboardReport } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const ReportsPage: React.FC = () => {
  const [report, setReport] = useState<OverviewDashboardReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await api.getOverviewReport();
      setReport(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  if (isLoading || !report) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Generating real-time workforce analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Executive Reports & Analytics</h2>
          <p className="text-sm text-slate-500">
            Real-time workforce intelligence, payroll expenditures, leave utilization, and departmental distributions
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" /> Print Executive Summary
        </Button>
      </div>

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 border-l-4 border-l-blue-500">
          <p className="text-xs font-semibold text-slate-500 uppercase">Headcount Utilization</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{report.headcount.active_employees} Active</p>
          <p className="text-xs text-slate-400 mt-1">{report.headcount.full_time_count} Full-time • {report.headcount.contract_count} Contract</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-slate-500 uppercase">Daily Turnout Rate</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{report.attendance.attendance_rate}%</p>
          <p className="text-xs text-slate-400 mt-1">{report.attendance.present_today} Present • {report.attendance.on_leave_today} On Leave</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-slate-500 uppercase">Monthly Payroll Cost</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(report.payroll.total_monthly_gross)}</p>
          <p className="text-xs text-slate-400 mt-1">Avg Pay: {formatCurrency(report.payroll.avg_salary)} / emp</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-purple-500">
          <p className="text-xs font-semibold text-slate-500 uppercase">Hiring Pipeline</p>
          <p className="text-2xl font-black text-purple-600 mt-1">{report.total_candidates}</p>
          <p className="text-xs text-slate-400 mt-1">{report.open_jobs_count} Open positions actively recruiting</p>
        </Card>
      </div>

      {/* Department Breakdown & Leave Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">Department Distribution Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Headcount</th>
                  <th className="py-2.5 px-3">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.department_distribution.map((d) => (
                  <tr key={d.department_id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{d.department_name}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-xs">{d.department_code}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{d.headcount}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-2">
                          <div className="bg-brand-600 h-2 rounded-full" style={{ width: `${d.percentage}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{d.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">Leave Type Utilization Analysis</h3>
          <div className="space-y-4">
            {report.leave_utilization.map((lu) => (
              <div key={lu.leave_type_name} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-bold text-slate-800">{lu.leave_type_name}</span>
                  <span className="font-semibold text-slate-600">
                    {lu.used_days} used / {lu.allocated_days} total ({lu.utilization_rate}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, lu.utilization_rate)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
