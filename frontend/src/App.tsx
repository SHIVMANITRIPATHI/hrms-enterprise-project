import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/shared/Sidebar';
import { Header } from './components/shared/Header';
import { LoginPage } from './features/auth/LoginPage';
import { ForceChangePasswordModal } from './features/auth/ForceChangePasswordModal';
import { ChangePasswordModal } from './features/auth/ChangePasswordModal';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { DirectoryPage } from './features/directory/DirectoryPage';
import { LeavePage } from './features/leave/LeavePage';
import { ProfilePage } from './features/profile/ProfilePage';
import { AttendancePage } from './features/attendance/AttendancePage';
import { PayrollPage } from './features/payroll/PayrollPage';
import { RecruitmentPage } from './features/recruitment/RecruitmentPage';
import { PerformancePage } from './features/performance/PerformancePage';
import { ReportsPage } from './features/reports/ReportsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { api, setAuthToken, getAuthToken } from './services/api';
import { AuthResponse, User } from './types';

export type AppRoute =
  | 'dashboard'
  | 'directory'
  | 'leave'
  | 'profile'
  | 'attendance'
  | 'payroll'
  | 'recruitment'
  | 'performance'
  | 'reports'
  | 'settings';

const App: React.FC = () => {
  const [authData, setAuthData] = useState<AuthResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [showForceChangePassword, setShowForceChangePassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [currentRoute, setCurrentRoute] = useState<AppRoute>('dashboard');
  const [profileEmployeeId, setProfileEmployeeId] = useState<string | undefined>(undefined);
  const [maskSensitiveData, setMaskSensitiveData] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // On mount: try to restore session from localStorage token
  useEffect(() => {
    const tryRestoreSession = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsLoadingAuth(false);
        return;
      }
      try {
        const me = await api.getMe();
        setCurrentUser(me);
        // If must change password, show force modal
        if (me.must_change_password || me.force_password_change) {
          setShowForceChangePassword(true);
        }
      } catch {
        setAuthToken(null);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    tryRestoreSession();
  }, []);

  const handleLoginSuccess = useCallback(async (data: AuthResponse) => {
    setAuthData(data);
    setCurrentUser(data.user);
    if (data.must_change_password || data.force_password_change) {
      setShowForceChangePassword(true);
    }
  }, []);

  const handleForcePasswordChanged = useCallback((updatedUser: User) => {
    setCurrentUser(updatedUser);
    setShowForceChangePassword(false);
  }, []);

  const handleLogout = useCallback(() => {
    api.logout();
    setAuthData(null);
    setCurrentUser(null);
    setCurrentRoute('dashboard');
    setShowForceChangePassword(false);
  }, []);

  const navigate = useCallback((route: string, id?: string) => {
    setCurrentRoute(route as AppRoute);
    if (route === 'profile' && id) {
      setProfileEmployeeId(id);
    } else if (route !== 'profile') {
      setProfileEmployeeId(undefined);
    }
    setMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const renderPage = () => {
    if (!currentUser) return null;
    switch (currentRoute) {
      case 'dashboard':
        return <DashboardPage currentUser={currentUser} onNavigate={navigate} />;
      case 'directory':
        return <DirectoryPage onNavigateProfile={(id) => navigate('profile', id)} />;
      case 'leave':
        return <LeavePage currentUser={currentUser} />;
      case 'profile':
        return (
          <ProfilePage
            employeeId={profileEmployeeId ?? currentUser.employee_id}
            maskSensitiveData={maskSensitiveData}
            onToggleMask={() => setMaskSensitiveData(!maskSensitiveData)}
          />
        );
      case 'attendance':
        return <AttendancePage currentUser={currentUser} />;
      case 'payroll':
        return <PayrollPage currentUser={currentUser} />;
      case 'recruitment':
        return <RecruitmentPage currentUser={currentUser} />;
      case 'performance':
        return <PerformancePage currentUser={currentUser} />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return (
          <SettingsPage
            currentUser={currentUser}
            onOpenChangePassword={() => setShowChangePassword(true)}
          />
        );
      default:
        return <DashboardPage currentUser={currentUser} onNavigate={navigate} />;
    }
  };

  // Loading state while restoring session
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-2xl shadow-xl mx-auto mb-4 animate-pulse">
            S
          </div>
          <p className="text-slate-400 text-sm font-medium">Initializing SHIVMANI HRMS...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated: show Login
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        currentUser={currentUser}
        onNavigate={navigate}
        onLogout={handleLogout}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Header
          currentRoute={currentRoute}
          currentUser={currentUser}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          maskSensitiveData={maskSensitiveData}
          onToggleMask={() => setMaskSensitiveData(!maskSensitiveData)}
          onNavigateProfile={() => navigate('profile')}
          onNavigateSettings={() => navigate('settings')}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {renderPage()}
        </main>
      </div>

      {/* Force Change Password Modal */}
      {showForceChangePassword && (
        <ForceChangePasswordModal
          onSuccess={handleForcePasswordChanged}
          onCancel={handleLogout}
        />
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </div>
  );
};

export default App;
