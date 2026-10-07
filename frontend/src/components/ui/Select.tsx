import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  requiredIndicator?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  helperText,
  requiredIndicator,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {label}
          {requiredIndicator && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full bg-white border rounded-lg px-3.5 py-2 text-sm text-slate-900 transition-all duration-150 focus:outline-none focus:ring-2 cursor-pointer ${
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100 shadow-subtle'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs font-medium text-rose-600 animate-fadeIn">{error}</span>}
      {!error && helperText && <span className="text-xs text-slate-500">{helperText}</span>}
    </div>
  );
};
