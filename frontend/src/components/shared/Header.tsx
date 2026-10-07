import React, { useState } from 'react';
import {
  Bell, Search, HelpCircle, Menu, Eye, EyeOff, User, LogOut, Check, Settings
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { User as UserType, NotificationItem } from '../../types';

export interface HeaderProps {
  currentRoute: string;
  currentUser: UserType;
  onOpenMobileSidebar: () => void;
  maskSensitiveData: boolean;
  onToggleMask: () => void;
  onNavigateProfile: () => void;
  onNavigateSettings: () => void;
  onLogout: () => void;
}

const ROUTE_META: Record<string, { title: string; subtitle: string }> = {
  dashboard:    { title: 'Dashboard',           subtitle: 'Overview & enterprise analytics' },
  directory:    { title: 'Employee Directory',  subtitle: 'Manage workforce & reporting hierarchy' },
  leave:        { title: 'Leave Management',    subtitle: 'Track balances, apply & approve leaves' },
  profile:      { title: 'My Profile',          subtitle: 'Personal, employment & statutory information' },
  attendance:   { title: 'Attendance',          subtitle: 'Daily check-in/out & attendance records' },
  payroll:      { title: 'Payroll',             subtitle: 'Salary structures, payslips & payroll runs' },
  recruitment:  { title: 'Recruitment',         subtitle: 'Job openings, candidates & hiring pipeline' },
  performance:  { title: 'Performance & Growth',subtitle: 'Goals, review cycles & appraisals' },
  reports:      { title: 'Reports & Analytics', subtitle: 'Real-time workforce intelligence & metrics' },
  settings:     { title: 'Settings',            subtitle: 'System preferences, masters & audit trail' },
};

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Leave Request Pending',
    message: 'Ananya Rao submitted Paid Leave request for Oct 12–14.',
    timestamp: '10 mins ago',
    read: false,
    type: 'leave',
  },
  {
    id: 'n2',
    title: 'New Team Member',
    message: 'Rajesh Kumar joined Human Resources department today.',
    timestamp: '2 hours ago',
    read: false,
    type: 'employee',
  },
  {
    id: 'n3',
    title: 'System Maintenance',
    message: 'Scheduled DB optimization tonight at 02:00 AM IST.',
    timestamp: '1 day ago',
    read: true,
    type: 'system',
  },
];

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  currentUser,
  onOpenMobileSidebar,
  maskSensitiveData,
  onToggleMask,
  onNavigateProfile,
  onNavigateSettings,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(SAMPLE_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pageMeta = ROUTE_META[currentRoute] ?? { title: 'SHIVMANI HRMS', subtitle: 'Enterprise HR Management System' };
  const fullName = `${currentUser.first_name ?? ''} ${currentUser.last_name ?? ''}`.trim() || currentUser.employee_code;

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Toggle + Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <span>SHIVMANI HRMS</span>
              <span>/</span>
              <span className="text-brand-600 capitalize">{currentRoute}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{pageMeta.title}</h2>
          </div>
        </div>

        {/* Center: Global Search */}
        <div className="hidden md:flex items-center flex-1 max-w-xs mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee, ID, leave..."
              className="w-full bg-slate-100/80 border border-transparent rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sensitive Data Toggle */}
          <button
            onClick={onToggleMask}
            className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border ${
              maskSensitiveData
                ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                : 'bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100'
            }`}
            title={maskSensitiveData ? 'Show Data' : 'Mask Sensitive Data'}
          >
            {maskSensitiveData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-brand-600" />}
            <span className="hidden sm:inline">{maskSensitiveData ? 'Masked' : 'Visible'}</span>
          </button>

          {/* Help */}
          <button className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-brand-600 rounded-full ring-2 ring-white" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-modal border border-slate-200 p-4 z-50 animate-scaleUp">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-brand-100 text-brand-700 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-brand-600 hover:text-brand-800 font-medium">
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="py-2 divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-lg transition-colors flex items-start gap-3 ${
                        !n.read ? 'bg-brand-50/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-brand-600' : 'bg-slate-300'}`} />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{n.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Avatar name={fullName} size="md" />
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">{fullName}</p>
                <p className="text-[11px] text-slate-500">{currentUser.role}</p>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-modal border border-slate-200 p-2 z-50 animate-scaleUp">
                <div className="p-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{fullName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser.employee_code}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { onNavigateProfile(); setShowProfileMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    View My Profile
                  </button>
                  <button
                    onClick={() => { onNavigateSettings(); setShowProfileMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    Settings
                  </button>
                  <button
                    onClick={onToggleMask}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {maskSensitiveData ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-brand-600" />}
                      Mask Sensitive Info
                    </div>
                    {maskSensitiveData && <Check className="w-3.5 h-3.5 text-brand-600" />}
                  </button>
                </div>
                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => { setShowProfileMenu(false); onLogout(); }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
