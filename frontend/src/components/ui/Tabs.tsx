import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`flex border-b border-slate-200 space-x-6 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`pb-3 text-sm font-semibold transition-all duration-150 relative cursor-pointer flex items-center gap-2 ${
              isActive
                ? 'text-brand-600 border-b-2 border-brand-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  isActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
