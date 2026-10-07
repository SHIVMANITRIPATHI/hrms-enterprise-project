import React from 'react';
import {
  LayoutDashboard, Users, CalendarDays, UserCircle,
  Clock, Banknote, Award, Briefcase, BarChart3, Settings,
  Building2, ChevronDown, LogOut, ShieldCheck
} from 'lucide-react';
import { User } from '../../types';
import { Avatar } from '../ui/Avatar';

export interface SidebarProps {
  currentRoute: string;
  currentUser: User;
  onNavigate: (route: string) => void;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'directory', label: 'Employee Directory', icon: Users },
  { id: 'attendance', label: 'Attendance', icon: Clock },
  { id: 'leave', label: 'Leave Management', icon: CalendarDays },
  { id: 'payroll', label: 'Payroll', icon: Banknote },
  { id: 'recruitment', label: 'Recruitment', icon: Briefcase },
  { id: 'performance', label: 'Performance', icon: Award },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, hrOnly: true },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'profile', label: 'My Profile', icon: UserCircle },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  currentUser,
  onNavigate,
  onLogout,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const isHR = currentUser.role === 'HR';
  const firstName = currentUser.first_name ?? currentUser.employee?.first_name ?? '';
  const lastName = currentUser.last_name ?? currentUser.employee?.last_name ?? '';
  const displayName = `${firstName} ${lastName}`.trim() || currentUser.employee_code;

  const visibleItems = NAV_ITEMS.filter((item) => !item.hrOnly || isHR);

  const navContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-64 border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-brand-900/40">
          S
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight leading-tight">SHIVMANI</h1>
          <p className="text-[10px] font-semibold text-brand-400 tracking-wider uppercase">Enterprise HRMS</p>
        </div>
      </div>

      {/* Company Selector */}
      <div className="px-4 py-3 border-b border-slate-800/60">
        <div className="bg-slate-800/70 rounded-lg p-2.5 flex items-center justify-between border border-slate-700/50">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Building2 className="w-4 h-4 text-brand-400 shrink-0" />
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">Shivmani Global Corp</p>
              <p className="text-[10px] text-slate-400">Enterprise Plan</p>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">HR Modules</p>
        <nav className="space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
                {item.id === 'reports' && (
                  <span className="ml-auto text-[9px] font-bold bg-brand-900/60 text-brand-300 px-1.5 py-0.5 rounded border border-brand-700/40">
                    HR
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="border-t border-slate-800/80 p-3">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors group">
          <Avatar name={displayName} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {displayName}
            </p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              {currentUser.role === 'HR' && <ShieldCheck className="w-2.5 h-2.5 text-brand-400" />}
              {currentUser.role}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-900/20 transition-colors opacity-0 group-hover:opacity-100"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between px-2 mt-1">
          <span className="text-[10px] text-slate-500">v2.0 Enterprise</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block h-screen sticky top-0 z-30">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative z-10 animate-slideRight">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
