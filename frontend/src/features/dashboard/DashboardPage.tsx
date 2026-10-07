import React, { useState, useEffect } from 'react';
import {
  Users, CalendarCheck, Clock, Briefcase, TrendingUp, AlertCircle,
  ArrowRight, ShieldCheck, CheckCircle, PlusCircle, FileText, Check, X,
  UserCheck, Award, DollarSign
} from 'lucide-react';
import { api } from '../../services/api';
import { User, OverviewDashboardReport, AttendanceSummary, LeaveBalance, LeaveRequest } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar } from '../../components/ui/Avatar';
import { formatDate } from '../../utils/formatters';

interface DashboardPageProps {
  currentUser: User;
  onNavigate: (route: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser, onNavigate }) => {
  const isHR = currentUser.role === 'HR';
  const [isLoading, setIsLoading] = useState(true);

  // HR Dashboard State
  const [hrReport, setHrReport] = useState<OverviewDashboardReport | null>(null);

  // Employee Dashboard State
  const [attSummary, setAttSummary] = useState<AttendanceSummary | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [todayAttTime, setTodayAttTime] = useState<string | null>(null);
  const [isCheckInLoading, setIsCheckInLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      if (isHR) {
        const report = await api.getOverviewReport();
        setHrReport(report);
      } else {
        const [att, balances, leaves, todayAtt] = await Promise.all([
          api.getMyAttendanceSummary(),
          api.getLeaveBalances(currentUser.employee_id),
          api.getLeaveRequests({ employee_id: currentUser.employee_id, page_size: 5 }),
          api.getMyAttendance({ start_date: new Date().toISOString().split('T')[0] })
        ]);
        setAttSummary(att);
        setLeaveBalances(balances);
        setMyLeaves(leaves.items);
        if (todayAtt.items.length > 0 && todayAtt.items[0].check_in) {
          setCheckedInToday(true);
          setTodayAttTime(todayAtt.items[0].check_in);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickCheckIn = async () => {
    setIsCheckInLoading(true);
    try {
      if (checkedInToday) {
        await api.checkOut('Quick Dashboard Checkout');
        setCheckedInToday(false);
      } else {
        const rec = await api.checkIn('Quick Dashboard Checkin');
        setCheckedInToday(true);
        setTodayAttTime(rec.check_in || 'Just now');
      }
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Attendance action failed');
    } finally {
      setIsCheckInLoading(false);
    }
  };

  const employeeName = currentUser.employee
    ? `${currentUser.employee.first_name} ${currentUser.employee.last_name}`
    : currentUser.employee_code;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-brand-900 to-slate-900 border border-brand-800/40 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/30 text-brand-300 border border-brand-400/30">
                {isHR ? 'HR Executive Portal' : 'Employee Self-Service'}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {employeeName}!
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              {isHR
                ? 'Workforce intelligence, pending approvals, and operational metrics are up to date.'
                : `Logged in as ${currentUser.employee?.designation?.name || 'Team Member'} (${currentUser.employee_code}). Manage your leaves, attendance, and payslips.`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isHR ? (
              <Button
                variant="primary"
                size="lg"
                isLoading={isCheckInLoading}
                onClick={handleQuickCheckIn}
                className={checkedInToday ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'}
              >
                <Clock className="w-5 h-5 mr-2" />
                {checkedInToday ? 'Check Out Today' : 'Clock In Today'}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={() => onNavigate('onboarding')}
                className="bg-brand-600 hover:bg-brand-500 shadow-md"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Onboard Employee
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* HR DASHBOARD VIEW */}
      {isHR && hrReport && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="p-5 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Headcount</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{hrReport.headcount.total_employees}</h3>
                  <p className="text-xs text-emerald-600 font-medium mt-1">
                    {hrReport.headcount.active_employees} Active Workforce
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="p-5 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Attendance</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{hrReport.attendance.present_today}</h3>
                  <p className="text-xs text-emerald-600 font-medium mt-1">
                    {hrReport.attendance.attendance_rate}% Turnout Rate
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CalendarCheck className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="p-5 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Leaves</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{hrReport.pending_approvals_count}</h3>
                  <p className="text-xs text-amber-600 font-medium mt-1">
                    Awaiting Approval
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="p-5 border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Positions</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{hrReport.open_jobs_count}</h3>
                  <p className="text-xs text-purple-600 font-medium mt-1">
                    {hrReport.total_candidates} Active Candidates
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Briefcase className="w-6 h-6" />
                </div>
              </div>
            </Card>
          </div>

          {/* Department Breakdown & Quick Actions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Department Distribution</h3>
                  <p className="text-xs text-slate-500">Active employee distribution across corporate divisions</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('directory')}>
                  View Directory <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>

              <div className="space-y-4">
                {hrReport.department_distribution.map((dept) => (
                  <div key={dept.department_id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{dept.department_name} ({dept.department_code})</span>
                      <span className="text-slate-500 font-medium">{dept.headcount} employees ({dept.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-brand-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, dept.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Executive Quick Actions</h3>
              <p className="text-xs text-slate-500">Direct shortcuts to critical HR workflows</p>
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => onNavigate('onboarding')}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-brand-600 flex items-center justify-center">
                      <PlusCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 group-hover:text-brand-700">Add New Employee</p>
                      <p className="text-[11px] text-slate-500">Create profile & credentials</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600" />
                </button>

                <button
                  onClick={() => onNavigate('leave')}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 group-hover:text-amber-700">Review Leave Requests</p>
                      <p className="text-[11px] text-slate-500">{hrReport.pending_approvals_count} pending approvals</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
                </button>

                <button
                  onClick={() => onNavigate('payroll')}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700">Run Monthly Payroll</p>
                      <p className="text-[11px] text-slate-500">Process & release payslips</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                </button>

                <button
                  onClick={() => onNavigate('recruitment')}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 group-hover:text-purple-700">Hiring Pipeline</p>
                      <p className="text-[11px] text-slate-500">Manage candidates & jobs</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* EMPLOYEE DASHBOARD VIEW */}
      {!isHR && (
        <div className="space-y-6">
          {/* Leave Balances Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {leaveBalances.map((bal) => (
              <Card key={bal.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">{bal.leave_type?.name}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-600">
                    {bal.leave_type?.code}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900">{bal.remaining_days}</span>
                  <span className="text-xs text-slate-500">/ {bal.allocated_days} days left</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                  <div
                    className="bg-brand-600 h-1.5 rounded-full"
                    style={{ width: `${(bal.used_days / Math.max(1, bal.allocated_days)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Used: {bal.used_days}d</span>
                  <span>Total: {bal.allocated_days}d</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Monthly Attendance & Quick Leave History */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {attSummary && (
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">Monthly Attendance</h3>
                  <Button variant="ghost" size="sm" onClick={() => onNavigate('attendance')}>
                    View Logs <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <p className="text-xs text-emerald-700 font-medium">Present Days</p>
                    <p className="text-xl font-bold text-emerald-900 mt-0.5">{attSummary.present_days}</p>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="text-xs text-amber-700 font-medium">Late Arrivals</p>
                    <p className="text-xl font-bold text-amber-900 mt-0.5">{attSummary.late_days}</p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-xs text-blue-700 font-medium">Avg Working Hours</p>
                    <p className="text-xl font-bold text-blue-900 mt-0.5">{attSummary.avg_working_hours}h</p>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl">
                    <p className="text-xs text-purple-700 font-medium">Leaves Taken</p>
                    <p className="text-xl font-bold text-purple-900 mt-0.5">{attSummary.leave_days}</p>
                  </div>
                </div>
              </Card>
            )}

            <Card className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">My Recent Leave Requests</h3>
                <Button variant="primary" size="sm" onClick={() => onNavigate('leave')}>
                  Apply Leave
                </Button>
              </div>

              {myLeaves.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No leave requests found for this year.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {myLeaves.map((req) => (
                    <div key={req.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{req.leave_type?.name}</span>
                          <span className="text-xs text-slate-500">({req.total_days} days)</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatDate(req.start_date)} - {formatDate(req.end_date)} • {req.reason}
                        </p>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
