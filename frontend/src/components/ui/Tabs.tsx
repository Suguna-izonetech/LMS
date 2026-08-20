import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'underline' | 'pills';
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeId,
  onChange,
  className = '',
  variant = 'underline',
}) => {
  return (
    <div className={`w-full ${className}`}>
      {variant === 'underline' ? (
        <div className="border-b border-slate-850">
          <nav className="flex space-x-6" aria-label="Tabs">
            {items.map((tab) => {
              const isActive = tab.id === activeId;
              return (
                <button
                  key={tab.id}
                  onClick={() => onChange(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-all duration-200 cursor-pointer focus:outline-hidden
                    ${
                      isActive
                        ? 'border-violet-500 text-violet-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }
                  `}
                >
                  {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      ) : (
        <nav className="flex space-x-1.5 p-1 bg-slate-900 rounded-lg max-w-max border border-slate-800" aria-label="Tabs">
          {items.map((tab) => {
            const isActive = tab.id === activeId;
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wide transition-all duration-200 cursor-pointer focus:outline-hidden
                  ${
                    isActive
                      ? 'bg-slate-800 text-slate-100 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }
                `}
              >
                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                {tab.label}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};
export default Tabs;
