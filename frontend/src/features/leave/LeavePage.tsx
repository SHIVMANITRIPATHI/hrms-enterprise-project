import React, { useState, useEffect } from 'react';
import {
  CalendarDays, Plus, CheckCircle2, XCircle, RotateCcw, ChevronDown, ChevronUp,
  AlertTriangle, TrendingDown
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { api } from '../../services/api';
import { LeaveBalance, LeaveRequest, LeaveType, User } from '../../types';
import { formatDate } from '../../utils/formatters';
import { validateLeaveDates } from '../../utils/validators';

const DEFAULT_EMPLOYEE_ID = 'e1111111-1111-1111-1111-111111111111';
const CURRENT_YEAR = new Date().getFullYear();

interface LeavePageProps {
  currentUser?: User;
}

export const LeavePage: React.FC<LeavePageProps> = ({ currentUser }) => {
  const employeeId = currentUser?.employee_id || currentUser?.id || DEFAULT_EMPLOYEE_ID;
  const isHR = currentUser?.role === 'HR';

  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const PAGE_SIZE = 10;

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [applyErrors, setApplyErrors] = useState<Record<string, string>>({});
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const [rejectModal, setRejectModal] = useState<{ open: boolean; requestId: string | null }>({ open: false, requestId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [balRes, ltRes, lrRes, pendRes] = await Promise.all([
        api.getLeaveBalances(employeeId, CURRENT_YEAR).catch(() => []),
        api.getLeaveTypes().catch(() => []),
        api.getLeaveRequests({ employee_id: isHR ? undefined : employeeId, page, page_size: PAGE_SIZE }).catch(() => ({ items: [], total: 0, total_pages: 1, page: 1, page_size: PAGE_SIZE })),
        isHR
          ? api.getLeaveRequests({ status: 'PENDING', page_size: 20 }).catch(() => ({ items: [] }))
          : Promise.resolve({ items: [] })
      ]);
      setBalances(balRes);
      setLeaveTypes(ltRes);
      setLeaveRequests(lrRes.items);
      setTotalPages(lrRes.total_pages);
      setTotalItems(lrRes.total);
      setPendingApprovals(pendRes.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page]);

  const validateApplyForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!applyForm.leave_type_id) errs.leave_type_id = 'Please select a leave type.';
    const dateCheck = validateLeaveDates(applyForm.start_date, applyForm.end_date);
    if (!dateCheck.isValid) errs.dates = dateCheck.error!;
    const reason = applyForm.reason.trim();
    if (!reason || reason.length < 5) errs.reason = 'Reason must be at least 5 characters.';
    if (reason.length > 500) errs.reason = 'Reason cannot exceed 500 characters.';
    setApplyErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateApplyForm()) return;
    setApplyLoading(true);
    setApplyError(null);
    try {
      await api.createLeaveRequest({
        employee_id: employeeId,
        leave_type_id: applyForm.leave_type_id,
        start_date: applyForm.start_date,
        end_date: applyForm.end_date,
        reason: applyForm.reason.trim()
      });
      setShowApplyModal(false);
      setApplyForm({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
      fetchData();
    } catch (e: any) {
      setApplyError(e.message || 'Failed to submit leave request.');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.approveLeaveRequest(id);
      fetchData();
    } catch (e: any) {
      alert(e.message || 'Approval failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.requestId) return;
    setActionLoading(rejectModal.requestId);
    try {
      await api.rejectLeaveRequest(rejectModal.requestId, rejectReason);
      setRejectModal({ open: false, requestId: null });
      setRejectReason('');
      fetchData();
    } catch (e: any) {
      alert(e.message || 'Rejection failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) return;
    setActionLoading(id);
    try {
      await api.cancelLeaveRequest(id);
      fetchData();
    } catch (e: any) {
      alert(e.message || 'Cancellation failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const computeDuration = () => {
    if (!applyForm.start_date || !applyForm.end_date) return null;
    const start = new Date(applyForm.start_date);
    const end = new Date(applyForm.end_date);
    const days = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);
    return days;
  };

  const duration = computeDuration();

  const leaveTypeOptions = [
    { value: '', label: '— Select Leave Type —' },
    ...leaveTypes.map(lt => ({ value: lt.id, label: `${lt.name} (${lt.yearly_allotment} days/year)` }))
  ];

  const balanceForSelectedType = balances.find(b => b.leave_type_id === applyForm.leave_type_id);

  const getBalanceColor = (remaining: number, allocated: number) => {
    const ratio = remaining / allocated;
    if (ratio > 0.5) return 'bg-emerald-500';
    if (ratio > 0.25) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-7">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Leave Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">Track balances, submit leave requests and manage approvals.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => { setShowApplyModal(true); setApplyForm({ leave_type_id: '', start_date: '', end_date: '', reason: '' }); setApplyErrors({}); setApplyError(null); }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Apply for Leave
        </Button>
      </div>

      {/* Leave Balance Cards */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Leave Balance — {CURRENT_YEAR}</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-2 w-full rounded-full" />
              </Card>
            ))
          ) : balances.length === 0 ? (
            <div className="col-span-4 text-center text-sm text-slate-400 p-6 bg-white border border-slate-200 rounded-xl">
              No leave balance records found for {CURRENT_YEAR}.
            </div>
          ) : (
            balances.map(balance => (
              <Card key={balance.id} className="hover:shadow-md">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{balance.leave_type?.name ?? 'Leave'}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{balance.remaining_days}</p>
                    <p className="text-xs text-slate-500">of {balance.allocated_days} days remaining</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Used</p>
                    <p className="text-sm font-semibold text-slate-700">{balance.used_days}d</p>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${getBalanceColor(balance.remaining_days, balance.allocated_days)}`}
                    style={{ width: `${(balance.remaining_days / balance.allocated_days) * 100}%` }}
                  />
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Pending Approval Actions (Manager View) */}
      {pendingApprovals.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-900">
              Pending Approvals ({pendingApprovals.length})
            </h3>
          </div>
          <div className="divide-y divide-amber-100">
            {pendingApprovals.map(req => (
              <div key={req.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {req.employee?.first_name} {req.employee?.last_name}
                    <span className="ml-2 text-[11px] font-mono text-slate-500">({req.employee?.employee_code})</span>
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {req.leave_type?.name} · {formatDate(req.start_date)} – {formatDate(req.end_date)} ({req.total_days} day{req.total_days !== 1 ? 's' : ''})
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 italic">"{req.reason}"</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={actionLoading === req.id}
                    onClick={() => handleApprove(req.id)}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={actionLoading === req.id}
                    onClick={() => { setRejectModal({ open: true, requestId: req.id }); setRejectReason(''); }}
                    leftIcon={<XCircle className="w-4 h-4" />}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave History Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">My Leave History</h3>
          <p className="text-xs text-slate-500 mt-0.5">All your submitted leave requests</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Leave Type</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider hidden sm:table-cell">Dates</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider hidden md:table-cell">Duration</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider hidden lg:table-cell">Reason</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : leaveRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState
                      icon={<CalendarDays className="w-6 h-6" />}
                      title="No leave requests yet"
                      description="You haven't submitted any leave requests. Click 'Apply for Leave' to get started."
                      actionLabel="Apply for Leave"
                      onAction={() => setShowApplyModal(true)}
                      className="border-0 rounded-none"
                    />
                  </td>
                </tr>
              ) : (
                leaveRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold text-slate-900">{req.leave_type?.name ?? '—'}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell text-sm text-slate-600">
                      {formatDate(req.start_date)} – {formatDate(req.end_date)}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-sm font-semibold text-slate-700">{req.total_days}d</span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell max-w-[180px]">
                      <p className="text-sm text-slate-600 truncate" title={req.reason}>{req.reason}</p>
                      {req.rejection_reason && (
                        <p className="text-xs text-rose-600 mt-0.5 truncate" title={req.rejection_reason}>
                          Reason: {req.rejection_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={req.status} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {req.status === 'PENDING' && (
                          <button
                            title="Cancel Request"
                            disabled={actionLoading === req.id}
                            onClick={() => handleCancel(req.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-40"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && leaveRequests.length > 0 && (
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

      {/* Apply Leave Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Apply for Leave"
        subtitle="Submit a new leave request for approval."
        maxWidth="md"
      >
        <form onSubmit={handleApplyLeave} noValidate className="space-y-4">
          {applyError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 font-medium">{applyError}</div>
          )}

          <Select
            label="Leave Type"
            requiredIndicator
            value={applyForm.leave_type_id}
            onChange={e => setApplyForm(p => ({ ...p, leave_type_id: e.target.value }))}
            options={leaveTypeOptions}
            error={applyErrors.leave_type_id}
          />

          {applyForm.leave_type_id && balanceForSelectedType && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <TrendingDown className="w-4 h-4 text-brand-600 shrink-0" />
              <p className="text-xs font-medium text-slate-700">
                Available balance:{' '}
                <span className={`font-bold ${balanceForSelectedType.remaining_days < 3 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {balanceForSelectedType.remaining_days} day{balanceForSelectedType.remaining_days !== 1 ? 's' : ''}
                </span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              requiredIndicator
              type="date"
              value={applyForm.start_date}
              onChange={e => setApplyForm(p => ({ ...p, start_date: e.target.value }))}
              error={applyErrors.dates}
            />
            <Input
              label="End Date"
              requiredIndicator
              type="date"
              value={applyForm.end_date}
              min={applyForm.start_date}
              onChange={e => setApplyForm(p => ({ ...p, end_date: e.target.value }))}
            />
          </div>

          {duration !== null && duration > 0 && (
            <div className="flex items-center gap-2 p-2.5 bg-brand-50 border border-brand-200 rounded-lg">
              <CalendarDays className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-semibold text-brand-700">
                Duration: {duration} working day{duration !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={applyForm.reason}
              onChange={e => setApplyForm(p => ({ ...p, reason: e.target.value }))}
              placeholder="Briefly explain the reason for your leave request..."
              rows={3}
              className={`w-full border rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 transition-all ${
                applyErrors.reason
                  ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-500'
                  : 'border-slate-300 focus:ring-brand-100 focus:border-brand-500'
              }`}
            />
            {applyErrors.reason && <span className="text-xs text-rose-600 font-medium">{applyErrors.reason}</span>}
            <span className="text-xs text-slate-400 self-end">{applyForm.reason.length}/500</span>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setShowApplyModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={applyLoading} leftIcon={<CalendarDays className="w-4 h-4" />}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, requestId: null })}
        title="Reject Leave Request"
        subtitle="Provide a reason for rejecting this request."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Rejection Reason (Optional)</label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Explain why you are rejecting this request..."
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setRejectModal({ open: false, requestId: null })}>Cancel</Button>
            <Button variant="danger" isLoading={!!actionLoading} onClick={handleReject} leftIcon={<XCircle className="w-4 h-4" />}>
              Reject Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
