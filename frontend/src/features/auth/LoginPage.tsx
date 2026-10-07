import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Key, ArrowRight, AlertCircle, Building2, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { AuthResponse } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface LoginPageProps {
  onLoginSuccess: (authData: AuthResponse) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmpCode, setForgotEmpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'REQUEST' | 'RESET' | 'SUCCESS'>('REQUEST');
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!employeeCode.trim() || !password) {
      setError('Please enter both Employee ID and password.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await api.login(employeeCode.trim(), password);
      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const setQuickCredentials = (code: string, pass: string) => {
    setEmployeeCode(code);
    setPassword(pass);
    setError(null);
  };

  const handleRequestResetToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotEmpCode.trim()) {
      setForgotError('Please enter your Employee ID.');
      return;
    }
    try {
      const res = await api.forgotPassword(forgotEmpCode.trim());
      if (res.dev_reset_token) {
        setResetToken(res.dev_reset_token);
        setForgotMsg(`Reset token generated: ${res.dev_reset_token}`);
      } else {
        setForgotMsg(res.message);
      }
      setForgotStep('RESET');
    } catch (err: any) {
      setForgotError(err.message || 'Failed to generate reset token.');
    }
  };

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!resetToken || !newPassword || !confirmPassword) {
      setForgotError('All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }
    try {
      await api.resetPassword(resetToken, newPassword, confirmPassword);
      setForgotStep('SUCCESS');
    } catch (err: any) {
      setForgotError(err.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-blue-500 shadow-xl shadow-brand-500/20 mb-4 border border-brand-400/30">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          SHIVMANI <span className="text-brand-400 font-light">HRMS</span>
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Enterprise Workforce & Human Resource Management Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-slate-800/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-slate-700/60 sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-300 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Employee ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emp-0001"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotStep('REQUEST');
                    setForgotError(null);
                    setForgotMsg(null);
                  }}
                  className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white font-semibold py-3 shadow-lg shadow-brand-600/25 border-none"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to HRMS
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-700/60">
            <p className="text-xs font-medium text-slate-400 text-center mb-3 uppercase tracking-wider">
              Quick Test Credentials
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setQuickCredentials('Emp-0001', 'Mponline@123')}
                className="p-2.5 text-left rounded-xl bg-slate-900/40 hover:bg-slate-900/80 border border-slate-700/60 hover:border-brand-500/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white group-hover:text-brand-400">Neha Mishra</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 font-bold">HR</span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5">Emp-0001</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickCredentials('Emp-0003', 'Mponline@123')}
                className="p-2.5 text-left rounded-xl bg-slate-900/40 hover:bg-slate-900/80 border border-slate-700/60 hover:border-blue-500/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white group-hover:text-blue-400">Rajesh Kumar</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-bold">EMP</span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5">Emp-0003</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400">
                  <Key className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Forgot Password</h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-white text-lg font-semibold"
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotStep === 'REQUEST' && (
              <form onSubmit={handleRequestResetToken} className="space-y-4">
                <p className="text-sm text-slate-300">
                  Enter your Employee ID to generate a secure reset token.
                </p>
                <Input
                  label="Employee ID"
                  placeholder="e.g. Emp-0001"
                  value={forgotEmpCode}
                  onChange={(e) => setForgotEmpCode(e.target.value)}
                  required
                />
                <Button type="submit" variant="primary" className="w-full">
                  Generate Reset Token
                </Button>
              </form>
            )}

            {forgotStep === 'RESET' && (
              <form onSubmit={handleExecuteReset} className="space-y-3.5">
                {forgotMsg && (
                  <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-lg text-brand-300 text-xs">
                    {forgotMsg}
                  </div>
                )}
                <Input
                  label="Reset Token"
                  placeholder="Enter 16-character token"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Button type="submit" variant="primary" className="w-full mt-2">
                  Update Password
                </Button>
              </form>
            )}

            {forgotStep === 'SUCCESS' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-white font-semibold">Password Reset Successful!</h4>
                <p className="text-xs text-slate-300">
                  You can now log in using your newly configured password.
                </p>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    setShowForgotModal(false);
                    setPassword('');
                  }}
                >
                  Back to Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
