import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  requiredIndicator?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  requiredIndicator,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {label}
          {requiredIndicator && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full bg-white border rounded-lg px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 transition-all duration-150 focus:outline-none focus:ring-2 ${
            leftIcon ? 'pl-10' : ''
          } ${rightIcon ? 'pr-10' : ''} ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
              : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100 shadow-subtle'
          } ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <span className="text-xs font-medium text-rose-600 animate-fadeIn">{error}</span>}
      {!error && helperText && <span className="text-xs text-slate-500">{helperText}</span>}
    </div>
  );
};
