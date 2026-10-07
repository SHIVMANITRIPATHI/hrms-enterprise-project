export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateTimeStr?: string): string => {
  if (!dateTimeStr) return '—';
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateTimeStr;
  }
};

export const maskSensitiveString = (str?: string, visibleChars: number = 4): string => {
  if (!str) return '••••••••';
  if (str.length <= visibleChars) return str;
  const maskedLength = str.length - visibleChars;
  return '•'.repeat(maskedLength) + str.slice(-visibleChars);
};

export const getStatusBadgeStyle = (status: string): { bg: string; text: string; dot: string } => {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
    case 'APPROVED':
      return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Approved', dot: 'bg-emerald-500' };
    case 'ON_LEAVE':
    case 'PENDING':
      return { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'Pending', dot: 'bg-amber-500' };
    case 'INACTIVE':
    case 'REJECTED':
      return { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'Rejected', dot: 'bg-rose-500' };
    case 'CANCELLED':
      return { bg: 'bg-slate-100 text-slate-600 border-slate-200', text: 'Cancelled', dot: 'bg-slate-400' };
    default:
      return { bg: 'bg-slate-50 text-slate-700 border-slate-200', text: status, dot: 'bg-slate-400' };
  }
};
