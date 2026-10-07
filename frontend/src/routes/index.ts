import { UserRole } from '../types';

export type NavigationRoute =
  | 'dashboard'
  | 'directory'
  | 'onboarding'
  | 'attendance'
  | 'leave'
  | 'payroll'
  | 'performance'
  | 'recruitment'
  | 'reports'
  | 'settings'
  | 'profile';

export interface RouteConfig {
  id: NavigationRoute;
  label: string;
  description: string;
  allowedRoles: UserRole[];
  badge?: string;
}

export const APP_ROUTES: RouteConfig[] = [
  // HR & Employee Shared Routes
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Real-time overview of workforce metrics and pending actions',
    allowedRoles: ['HR', 'EMPLOYEE'],
  },
  // HR Routes
  {
    id: 'directory',
    label: 'Employees',
    description: 'Manage workforce directory, profile lifecycle, and hierarchy',
    allowedRoles: ['HR'],
  },
  {
    id: 'recruitment',
    label: 'Recruitment',
    description: 'Manage job openings, candidate pipeline, and hiring conversion',
    allowedRoles: ['HR'],
  },
  {
    id: 'onboarding',
    label: 'Onboarding',
    description: 'Create new employee profiles, credentials, and statutory records',
    allowedRoles: ['HR'],
  },
  // Module Routes
  {
    id: 'attendance',
    label: 'Attendance',
    description: 'Track daily attendance, shift timings, and check-ins',
    allowedRoles: ['HR', 'EMPLOYEE'],
  },
  {
    id: 'leave',
    label: 'Leave Management',
    description: 'Apply for leaves, track balances, and manage approvals',
    allowedRoles: ['HR', 'EMPLOYEE'],
  },
  {
    id: 'payroll',
    label: 'Payroll',
    description: 'Salary structures, monthly pay runs, and payslips',
    allowedRoles: ['HR', 'EMPLOYEE'],
  },
  {
    id: 'performance',
    label: 'Performance',
    description: 'Goal setting, review cycles, and performance appraisals',
    allowedRoles: ['HR', 'EMPLOYEE'],
  },
  // HR Only Reporting
  {
    id: 'reports',
    label: 'Reports & Analytics',
    description: 'Enterprise intelligence on headcount, payroll, and attrition',
    allowedRoles: ['HR'],
  },
  // Employee Self-Service Profile
  {
    id: 'profile',
    label: 'My Profile',
    description: 'View personal, employment, and statutory information',
    allowedRoles: ['EMPLOYEE', 'HR'],
  },
  // Settings
  {
    id: 'settings',
    label: 'Settings',
    description: 'Company masters, policy configurations, and user preferences',
    allowedRoles: ['HR', 'EMPLOYEE'],
  },
];
