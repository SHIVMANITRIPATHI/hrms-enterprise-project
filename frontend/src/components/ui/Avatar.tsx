import React from 'react';

export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  src?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', src, className = '' }) => {
  const getInitials = (n: string) => {
    const parts = n.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg font-bold',
  };

  const colors = [
    'bg-blue-600 text-white',
    'bg-indigo-600 text-white',
    'bg-purple-600 text-white',
    'bg-emerald-600 text-white',
    'bg-amber-600 text-white',
    'bg-rose-600 text-white',
  ];

  const charCode = name.charCodeAt(0) || 0;
  const colorClass = colors[charCode % colors.length];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover border border-slate-200 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${colorClass} rounded-full flex items-center justify-center font-semibold tracking-wider shadow-subtle shrink-0 ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};
