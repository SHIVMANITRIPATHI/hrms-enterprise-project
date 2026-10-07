import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-xl p-5 shadow-card transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-brand-300 hover:shadow-md' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
