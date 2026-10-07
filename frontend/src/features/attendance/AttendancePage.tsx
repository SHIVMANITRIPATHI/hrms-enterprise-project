import React, { useState, useEffect } from 'react';
import {
  CalendarCheck, Clock, CheckCircle2, AlertCircle, Filter,
  UserCheck, ShieldCheck, Edit3, X, Search
} from 'lucide-react';
import { api } from '../../services/api';
import { User, AttendanceRecord, AttendanceSummary, Department } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar } from '../../components/ui/Avatar';
import { formatDate } from '../../utils/formatters';

interface AttendancePageProps {
  currentUser: User;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({ currentUser }) => {
  const isHR = currentUser.role === 'HR';
  const [isLoading, setIsLoading] = useState(true);

  // Employee State
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);
  const [mySummary, setMySummary] = useState<AttendanceSummary | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [todayCheckInTime, setTodayCheckInTime] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // HR State
  const [orgAttendance, setOrgAttendance] = useState<AttendanceRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterDept, setFilterDept] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Correction Modal State
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [correctStatus, setCorrectStatus] = useState('PRESENT');
  const [correctCheckIn, setCorrectCheckIn] = useState('09:00');
  const [correctCheckOut, setCorrectCheckOut] = useState('18:00');
  const [correctNotes, setCorrectNotes] = useState('');
  const [isCorrecting, setIsCorrecting] = useState(false);

  useEffect(() => {
    loadData();
  }, [filterDate, filterDept, filterStatus, currentUser]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (isHR) {
        const [orgRes, depts] = await Promise.all([
          api.getOrganizationAttendance({
            target_date: filterDate || undefined,
            department_id: filterDept || undefined,
            status: filterStatus || undefined,
          }),
          api.getDepartments(),
        ]);
        setOrgAttendance(orgRes.items);
        setDepartments(depts);
      } else {
        const [myRes, summary, todayAtt] = await Promise.all([
          api.getMyAttendance(),
          api.getMyAttendanceSummary(),
          api.getMyAttendance({ start_date: new Date().toISOString().split('T')[0] }),
        ]);
        setMyAttendance(myRes.items);
        setMySummary(summary);
        if (todayAtt.items.length > 0 && todayAtt.items[0].check_in) {
          setIsCheckedIn(true);
          setTodayCheckInTime(todayAtt.items[0].check_in);
        } else {
          setIsCheckedIn(false);
          setTodayCheckInTime(null);
        }
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCheckIn = async () => {
    setActionLoading(true);
    try {
      if (isCheckedIn) {
        await api.checkOut('Self service check-out');
        setIsCheckedIn(false);
      } else {
        const res = await api.checkIn('Self service check-in');
        setIsCheckedIn(true);
        setTodayCheckInTime(res.check_in || 'Just now');
      }
      loadData();
    } catch (err: any) {
      alert(err.message || 'Attendance action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setIsCorrecting(true);
    try {
      await api.correctAttendance({
        employee_id: selectedRecord.employee_id,
        date: selectedRecord.date,
        check_in: correctCheckIn ? `${correctCheckIn}:00` : undefined,
        check_out: correctCheckOut ? `${correctCheckOut}:00` : undefined,
        status: correctStatus,
        notes: correctNotes,
      });
      setSelectedRecord(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to correct attendance');
    } finally {
      setIsCorrecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Attendance & Shifts</h2>
          <p className="text-sm text-slate-500">
            {isHR
              ? 'Organization-wide daily attendance, biometric logs, and shift corrections'
              : 'Track your daily check-in, check-out, working hours, and monthly attendance summary'}
          </p>
        </div>

        {!isHR && (
          <Button
            variant="primary"
            size="lg"
            isLoading={actionLoading}
            onClick={handleToggleCheckIn}
            className={isCheckedIn ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'}
          >
            <Clock className="w-5 h-5 mr-2" />
            {isCheckedIn ? 'Check Out' : 'Check In'}
          </Button>
        )}
      </div>

      {/* EMPLOYEE VIEW */}
      {!isHR && (
        <div className="space-y-6">
          {mySummary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="p-4 border-l-4 border-l-blue-500">
                <p className="text-xs text-slate-500 uppercase font-semibold">Total Tracked</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{mySummary.total_days}d</p>
              </Card>
              <Card className="p-4 border-l-4 border-l-emerald-500">
                <p className="text-xs text-slate-500 uppercase font-semibold">Present</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{mySummary.present_days}d</p>
              </Card>
              <Card className="p-4 border-l-4 border-l-amber-500">
                <p className="text-xs text-slate-500 uppercase font-semibold">Late</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{mySummary.late_days}d</p>
              </Card>
              <Card className="p-4 border-l-4 border-l-indigo-500">
                <p className="text-xs text-slate-500 uppercase font-semibold">Half Day</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">{mySummary.half_days}d</p>
              </Card>
              <Card className="p-4 border-l-4 border-l-purple-500">
                <p className="text-xs text-slate-500 uppercase font-semibold">On Leave</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{mySummary.leave_days}d</p>
              </Card>
              <Card className="p-4 border-l-4 border-l-slate-500">
                <p className="text-xs text-slate-500 uppercase font-semibold">Avg Hours</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{mySummary.avg_working_hours}h</p>
              </Card>
            </div>
          )}

          <Card className="p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">My Attendance Log</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Check In</th>
                    <th className="py-3 px-4">Check Out</th>
                    <th className="py-3 px-4">Working Hours</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myAttendance.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-medium text-slate-900">{formatDate(rec.date)}</td>
                      <td className="py-3 px-4 text-slate-600">{rec.check_in ? rec.check_in.substring(0, 5) : '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{rec.check_out ? rec.check_out.substring(0, 5) : '—'}</td>
                      <td className="py-3 px-4 text-slate-700 font-semibold">{rec.working_hours} hrs</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={rec.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{rec.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* HR ORGANIZATION VIEW */}
      {isHR && (
        <div className="space-y-6">
          {/* Filters Card */}
          <Card className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="HALF_DAY">HALF_DAY</option>
                  <option value="LEAVE">LEAVE</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Org Table */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Workforce Attendance ({orgAttendance.length} records)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Check In</th>
                    <th className="py-3 px-4">Check Out</th>
                    <th className="py-3 px-4">Hours</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orgAttendance.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={`${rec.employee?.first_name || ''} ${rec.employee?.last_name || 'Employee'}`.trim()}
                            size="sm"
                          />
                          <div>
                            <p className="font-semibold text-slate-900">
                              {rec.employee?.first_name} {rec.employee?.last_name}
                            </p>
                            <p className="text-[11px] text-slate-400">{rec.employee?.employee_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {rec.employee?.department?.name || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{formatDate(rec.date)}</td>
                      <td className="py-3 px-4 text-slate-600">{rec.check_in ? rec.check_in.substring(0, 5) : '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{rec.check_out ? rec.check_out.substring(0, 5) : '—'}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{rec.working_hours}h</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={rec.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(rec);
                            setCorrectStatus(rec.status);
                            setCorrectCheckIn(rec.check_in ? rec.check_in.substring(0, 5) : '09:00');
                            setCorrectCheckOut(rec.check_out ? rec.check_out.substring(0, 5) : '18:00');
                            setCorrectNotes(rec.notes || '');
                          }}
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" /> Correct
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

      {/* HR Attendance Correction Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Manual Attendance Override</h3>
              <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              Editing record for <span className="font-semibold text-white">{selectedRecord.employee?.first_name} {selectedRecord.employee?.last_name}</span> on {formatDate(selectedRecord.date)}.
            </p>

            <form onSubmit={handleSaveCorrection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                <select
                  value={correctStatus}
                  onChange={(e) => setCorrectStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm"
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="HALF_DAY">HALF_DAY</option>
                  <option value="LEAVE">LEAVE</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Check In"
                  type="time"
                  value={correctCheckIn}
                  onChange={(e) => setCorrectCheckIn(e.target.value)}
                />
                <Input
                  label="Check Out"
                  type="time"
                  value={correctCheckOut}
                  onChange={(e) => setCorrectCheckOut(e.target.value)}
                />
              </div>

              <Input
                label="HR Correction Reason"
                placeholder="e.g. Approved biometric sensor delay"
                value={correctNotes}
                onChange={(e) => setCorrectNotes(e.target.value)}
              />

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="w-1/2" onClick={() => setSelectedRecord(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="w-1/2" isLoading={isCorrecting}>
                  Save Override
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
